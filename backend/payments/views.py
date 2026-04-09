import razorpay
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from decimal import Decimal

from items.models import Item
from .models import RewardPayment
from .utils import calculate_commission, get_suggested_reward

client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

import logging
logger = logging.getLogger(__name__)

class InitiatePaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, item_id):
        item = get_object_or_404(Item, id=item_id)
        
        if item.user == request.user:
            return Response({"error": "You cannot pay a reward for your own item."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Prevent duplicate payments
        existing_payment = RewardPayment.objects.filter(item=item, payer=request.user, status__in=['pending', 'paid']).exists()
        if existing_payment:
             # If pending, they can continue with existing one, but here we just block new initiation for simplicity
             # Better: return the existing order details if pending. For now, just block.
             return Response({"error": "You already have a payment in progress or completed for this item."}, status=status.HTTP_400_BAD_REQUEST)
        
        # If claimant provides product_price (for found items missing it), we update the item
        provided_price = request.data.get('product_price')
        if provided_price and not item.product_price:
            try:
                item.product_price = Decimal(str(provided_price))
                item.save()
            except Exception:
                pass
        
        # Check claim status
        from items.models import ClaimSession
        claim = ClaimSession.objects.filter(item=item, claimant=request.user, status='verified').first()
        if not claim:
            return Response({"error": "Payment is only allowed after the finder approves your claim."}, status=status.HTTP_400_BAD_REQUEST)

        reward_amount = request.data.get('reward_amount')
        if not reward_amount:
             return Response({"error": "Missing dynamic reward amount."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            total_amount = Decimal(str(reward_amount))
            amount_paise = int(total_amount * 100)
            if amount_paise < 5000:
                return Response({"error": "Minimum reward amount is ₹50"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
             return Response({"error": "Invalid reward amount format."}, status=status.HTTP_400_BAD_REQUEST)

        commission = calculate_commission(total_amount)
        finder_amount = total_amount - commission
        
        # Create Razorpay Order
        try:
            order_data = {
                "amount": amount_paise,
                "currency": "INR",
                "payment_capture": "1"
            }
            razorpay_order = client.order.create(data=order_data)

            # Debug Logging
            partial_key = f"{settings.RAZORPAY_KEY_ID[:4]}...{settings.RAZORPAY_KEY_ID[-4:]}" if len(settings.RAZORPAY_KEY_ID) > 8 else "****"
            print(f"DEBUG_RAZORPAY: Using Key ID: {partial_key}")
            print(f"DEBUG_RAZORPAY: Order Response: {razorpay_order}")

            payment = RewardPayment.objects.create(
                item=item,
                payer=request.user,
                payee=item.user,
                amount=total_amount,
                commission=commission,
                finder_amount=finder_amount,
                razorpay_order_id=razorpay_order['id'],
                status='created'
            )
            
            return Response({
                "order_id": razorpay_order['id'],
                "amount": float(total_amount),
                "commission": float(commission),
                "finder_amount": float(finder_amount),
                "key_id": settings.RAZORPAY_KEY_ID,
                "item_title": item.title,
                "currency": "INR"
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print(f"DEBUG_RAZORPAY_ERROR: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class VerifyPaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        razorpay_order_id = request.data.get('razorpay_order_id')
        razorpay_payment_id = request.data.get('razorpay_payment_id')
        razorpay_signature = request.data.get('razorpay_signature')

        if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature]):
            return Response({"error": "Missing payment credentials"}, status=status.HTTP_400_BAD_REQUEST)

        params_dict = {
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature
        }

        try:
            client.utility.verify_payment_signature(params_dict)
            
            payment = get_object_or_404(RewardPayment, razorpay_order_id=razorpay_order_id)
            payment.razorpay_payment_id = razorpay_payment_id
            payment.razorpay_signature = razorpay_signature
            payment.status = 'held'
            payment.save()
            
            # Logging
            print(f"PAYMENT_SUCCESS: Order={payment.razorpay_order_id}, Reward={payment.amount}, Commission={payment.commission}, Finder={payment.finder_amount}")

            item = payment.item
            # Notify claimant with success
            from items.views import send_in_app_notification
            send_in_app_notification(
                user=payment.payer,
                item=item,
                message="Payment successful! Reward escrowed. Finder contact details are now unlocked for you to arrange the handover.",
                notification_type='payment_success'
            )
            
            return Response({"message": "Payment verified.", "status": "held", "claim_code": getattr(item, 'claim_code', None)})
            
        except Exception as e:
            payment = RewardPayment.objects.filter(razorpay_order_id=razorpay_order_id).first()
            if payment:
                payment.status = 'failed'
                payment.save()
            print(f"PAYMENT_VERIFY_FAILURE: Order={razorpay_order_id}, Error={str(e)}")
            return Response({"error": f"Payment verification failed: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

class ProofUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, item_id):
        item = get_object_or_404(Item, id=item_id)
        payment = RewardPayment.objects.filter(item=item, payer=request.user, status__in=['held', 'paid']).first()
        
        if not payment:
            return Response({"error": "No held payment found for this item."}, status=status.HTTP_404_NOT_FOUND)

        proof_file = request.FILES.get('proof')
        proof_comment = request.data.get('comment', '')

        if not proof_file:
            return Response({"error": "Proof file is required."}, status=status.HTTP_400_BAD_REQUEST)

        from django.utils import timezone
        payment.return_proof = proof_file
        payment.proof_comment = proof_comment
        payment.proof_uploaded_by = request.user
        payment.proof_uploaded_at = timezone.now()
        payment.status = 'proof_pending'
        payment.save()

        return Response({
            "message": "Proof uploaded successfully. Pending admin release.",
            "status": "proof_pending"
        })


class ReleasePaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, item_id):
        if request.user.role != 'super_admin':
            return Response({"error": "Only super admins can release payments."}, status=status.HTTP_403_FORBIDDEN)

        item = get_object_or_404(Item, id=item_id)
        # Allow release if proof_verified
        payment = RewardPayment.objects.filter(item=item, status='proof_verified').first()
        
        if not payment:
            return Response({"error": "No verified proof found for this item."}, status=status.HTTP_404_NOT_FOUND)
        
        if not payment.payee.upi_id:
            return Response({"error": "Finder has not added UPI ID"}, status=status.HTTP_400_BAD_REQUEST)

        finder = payment.payee
        finder_amount = float(payment.finder_amount)
        
        # Prepare RazorpayX API Payload
        import requests
        from django.conf import settings
        from requests.auth import HTTPBasicAuth
        
        payload = {
            "account_number": settings.RAZORPAYX_ACCOUNT_NUMBER,
            "fund_account": {
                "account_type": "vpa",
                "contact": {
                    "name": finder.name,
                    "type": "employee",
                    "email": finder.email,
                    "contact": finder.phone.replace('+91', '') if finder.phone else ''
                },
                "vpa": {
                    "address": finder.upi_id
                }
            },
            "amount": int(finder_amount * 100),
            "currency": "INR",
            "mode": "UPI",
            "purpose": "reward",
            "queue_if_low_balance": True,
            "reference_id": f"unitrace_reward_{payment.id}",
            "narration": "UniTrace Finder Reward"
        }
        
        try:
            url = "https://api.razorpay.com/v1/payouts"
            auth = HTTPBasicAuth(settings.RAZORPAYX_KEY_ID, settings.RAZORPAYX_KEY_SECRET)
            response = requests.post(url, json=payload, auth=auth)
            
            payout_data = response.json()
            
            if response.status_code not in [200, 201]:
                error_desc = payout_data.get('error', {}).get('description', 'Unknown API Error')
                payment.payout_status = 'failed'
                payment.save()
                return Response({"error": f"UPI payout failed: {error_desc}"}, status=status.HTTP_400_BAD_REQUEST)
            
            # Success
            from django.utils import timezone
            payment.payout_id = payout_data.get('id')
            payment.payout_status = payout_data.get('status', 'processing')
            payment.released_by = request.user
            payment.released_at = timezone.now()
            payment.status = 'released'
            payment.save()
            
            item.status = 'returned'
            item.save()

            from items.views import send_in_app_notification
            send_in_app_notification(
                user=payment.payee,
                item=item,
                message=f"Reward Credited Successfully! ₹{finder_amount} has been sent to your UPI-linked bank account.",
                notification_type='reward_released'
            )
            
            return Response({"message": "Payout successful!", "status": "released", "payout_id": payment.payout_id})
            
        except Exception as e:
            print(f"Payout Exception: {str(e)}")
            return Response({"error": "Payout service error. Please try again later."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

from .serializers import RewardPaymentSerializer

class ProofReviewListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role == 'super_admin':
            payments = RewardPayment.objects.filter(status='proof_verified').order_by('-proof_uploaded_at')
        elif request.user.role in ['college_admin', 'admin']:
            payments = RewardPayment.objects.filter(status='proof_pending').order_by('-proof_uploaded_at')
        else:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = RewardPaymentSerializer(payments, many=True)
        return Response(serializer.data)

class ProofReviewActionView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, payment_id):
        if request.user.role not in ['college_admin', 'admin']:
            return Response({"error": "Only College Admins can review proofs."}, status=status.HTTP_403_FORBIDDEN)
        
        payment = get_object_or_404(RewardPayment, id=payment_id)
        
        if payment.status != 'proof_pending':
            return Response({"error": "Proof is not pending review."}, status=status.HTTP_400_BAD_REQUEST)
        
        action = request.data.get('action')
        
        from items.views import send_in_app_notification
        
        if action == 'approve':
            payment.status = 'proof_verified'
            payment.save()
            return Response({"message": "Proof verified. Awaiting super admin release.", "status": "proof_verified"})
        elif action == 'reject':
            payment.status = 'proof_rejected'
            payment.save()
            send_in_app_notification(
                user=payment.payer,
                item=payment.item,
                message="Your return proof was rejected by the admin. Please re-upload.",
                notification_type='proof_rejected'
            )
            return Response({"message": "Proof rejected.", "status": "proof_rejected"})
        else:
            return Response({"error": "Invalid action."}, status=status.HTTP_400_BAD_REQUEST)

from django.db.models import Sum

class EscrowAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'super_admin':
            return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        
        total_released = RewardPayment.objects.filter(status='released').aggregate(Sum('amount'))['amount__sum'] or 0
        platform_commission = RewardPayment.objects.filter(status='released').aggregate(Sum('commission'))['commission__sum'] or 0
        
        pending_escrow = RewardPayment.objects.filter(status__in=['held', 'proof_pending', 'proof_verified']).count()
        successful_returns = Item.objects.filter(status='returned').count()
        fraud_prevented = RewardPayment.objects.filter(status='proof_rejected').count()
        pending_proof_reviews = RewardPayment.objects.filter(status__in=['proof_pending', 'proof_verified']).count()
        
        upi_payout_success = RewardPayment.objects.filter(status='released', payout_status__in=['processed', 'processing']).count()
        pending_upi_failures = RewardPayment.objects.filter(payout_status__in=['failed', 'rejected']).count()
        
        return Response({
            "total_rewards_released": total_released,
            "platform_earnings": platform_commission,
            "pending_escrow": pending_escrow,
            "successful_returns": successful_returns,
            "fraud_prevented": fraud_prevented,
            "pending_proof_reviews": pending_proof_reviews,
            "upi_payout_success": upi_payout_success,
            "pending_upi_failures": pending_upi_failures
        })
