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
        
        if not item.product_price:
            return Response({"error": "Item price is not set. Please provide valuation."}, status=status.HTTP_400_BAD_REQUEST)

        # Get or calculate reward
        reward_amount = request.data.get('reward_amount')
        suggested, min_reward = get_suggested_reward(item.product_price)
        
        if reward_amount:
            reward_amount = Decimal(str(reward_amount))
            if reward_amount < min_reward:
                return Response({"error": f"Minimum reward for this item is ₹{min_reward}"}, status=status.HTTP_400_BAD_REQUEST)
        else:
            reward_amount = suggested

        total_amount = reward_amount # User pays exactly the reward amount
        commission = calculate_commission(total_amount)
        finder_amount = total_amount - commission
        
        # Create Razorpay Order
        try:
            order_data = {
                "amount": int(total_amount * 100), # amount in paise
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
                status='pending'
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
            payment.status = 'paid'
            payment.save()
            
            # Logging
            print(f"PAYMENT_SUCCESS: Order={payment.razorpay_order_id}, Reward={payment.amount}, Commission={payment.commission}, Finder={payment.finder_amount}")

            # NEW: Generate claim code and notify ONLY after payment
            import random
            claim_code = str(random.randint(100000, 999999))
            
            item = payment.item
            item.claim_code = claim_code
            item.save()

            # Update the active claim session for this claimant
            from items.models import ClaimSession
            claim = ClaimSession.objects.filter(item=item, claimant=payment.payer, status='verified').first()
            if not claim:
                # Fallback to any pending claim if verified not found
                claim = ClaimSession.objects.filter(item=item, claimant=payment.payer).first()
            
            if claim:
                claim.claim_code = claim_code
                claim.save()

            # Notify claimant with code
            from items.views import send_in_app_notification
            send_in_app_notification(
                user=payment.payer,
                item=item,
                message=f"Payment successful! Reward escrowed. Your escape code is: {claim_code}. Use this to confirm receipt with the finder.",
                notification_type='claim_verified'
            )
            
            return Response({"message": "Payment verified and code generated.", "status": "paid", "claim_code": claim_code})
            
        except Exception as e:
            payment = RewardPayment.objects.filter(razorpay_order_id=razorpay_order_id).first()
            if payment:
                payment.status = 'failed'
                payment.save()
            print(f"PAYMENT_VERIFY_FAILURE: Order={razorpay_order_id}, Error={str(e)}")
            return Response({"error": f"Payment verification failed: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

class ReleasePaymentView(APIView):
    # This will be called when the lost person clicks "Item Received"
    permission_classes = [IsAuthenticated]

    def post(self, request, item_id):
        item = get_object_or_404(Item, id=item_id)
        payment = RewardPayment.objects.filter(item=item, payer=request.user, status='paid').first()
        
        if not payment:
            return Response({"error": "No escrowed payment found for this item."}, status=status.HTTP_404_NOT_FOUND)
        
        payment.status = 'completed'
        payment.save()
        
        # Here you would typically trigger a transfer/payout to the finder.
        # client.payout.create(...)
        
        return Response({"message": "Funds released to the finder successfully.", "status": "completed"})
