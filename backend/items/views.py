import threading
from rest_framework import generics, permissions, status, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from .models import Item, ItemPhoto, ClaimSession
from django.utils import timezone
from datetime import timedelta
from .serializers import ItemSerializer, ItemCreateSerializer, ItemPhotoSerializer, haversine_distance
from users.rewards_logic import grant_reward_points
from notifications.utils import send_in_app_notification



class ItemListCreateView(generics.ListCreateAPIView):
    parser_classes   = [MultiPartParser, FormParser]
    filter_backends  = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['type', 'category', 'location', 'status']
    search_fields    = ['title', 'description', 'location', 'location_detail', 'location_name']
    ordering_fields  = ['created_at', 'title']
    ordering         = ['-created_at']

    def get_serializer_class(self):
        return ItemCreateSerializer if self.request.method == 'POST' else ItemSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Item.objects.select_related('user', 'claimed_by').prefetch_related('photos')
        
        # Enforce college isolation
        if user.is_authenticated and user.role != 'super_admin':
            if user.college:
                queryset = queryset.filter(college=user.college)
            else:
                return queryset.none()

        timeframe = self.request.query_params.get('timeframe')
        if timeframe:
            from django.utils import timezone
            from datetime import timedelta
            now = timezone.now()
            if timeframe == 'today':
                queryset = queryset.filter(created_at__gte=now - timedelta(days=1))
            elif timeframe == '3days':
                queryset = queryset.filter(created_at__gte=now - timedelta(days=3))
            elif timeframe == 'week':
                queryset = queryset.filter(created_at__gte=now - timedelta(days=7))

        user_lat = self.request.query_params.get('user_lat')
        user_lng = self.request.query_params.get('user_lng')
        max_km   = self.request.query_params.get('max_km')

        if user_lat and user_lng and max_km:
            try:
                ulat         = float(user_lat)
                ulng         = float(user_lng)
                max_distance = float(max_km)
                filtered_ids = []
                for item in queryset:
                    if item.latitude and item.longitude:
                        dist = haversine_distance(ulat, ulng, item.latitude, item.longitude)
                        if dist is not None and dist <= max_distance:
                            filtered_ids.append(item.id)
                queryset = queryset.filter(id__in=filtered_ids)
            except (ValueError, TypeError):
                pass

        return queryset

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Automatically set college from user
        item = serializer.save(user=request.user, college=request.user.college)
        response_data = ItemSerializer(item, context={'request': request}).data

        # ✅ Notifications run in background thread — HTTP 201 returns instantly
        threading.Thread(
            target=self._broadcast_new_item,
            args=(item, request.user),
            daemon=True,
        ).start()

        return Response(response_data, status=status.HTTP_201_CREATED)

    def _broadcast_new_item(self, item, posted_by):
        """
        Creates in-app DB notifications + WebSocket push.
        Runs in background thread — never blocks HTTP response.
        ✅ NO email sending here.
        """
        try:
            from notifications.models import Notification
            from django.utils import timezone

            location_label = (
                item.location_name
                if item.location_name
                else (item.get_location_display() if hasattr(item, 'get_location_display') else item.location)
            )
            time_str = ""
            if item.incident_datetime:
                # E.g., "(Lost on: 12 July 2026 at 02:30 PM)"
                dt = item.incident_datetime
                if timezone.is_naive(dt):
                    dt = timezone.make_aware(dt)
                dt = timezone.localtime(dt)
                formatted_dt = dt.strftime("%d %B %Y at %I:%M %p")
                time_prefix = "Lost on: " if item.type == 'lost' else "Found on: "
                time_str = f" ({time_prefix}{formatted_dt})"

            msg = f"New {item.type.upper()} item posted: {item.title} at {location_label}{time_str}"

            # Only notify users of the SAME college
            from users.models import User
            college_users = User.objects.filter(college=item.college)
            
            notifications = Notification.bulk_create_for_all_users(
                item=item,
                message=msg,
                notification_type='new_item',
                exclude_user=posted_by,
                user_queryset=college_users # Assuming this arg exists or handled in logic
            )

            # WebSocket push to each user
            try:
                from asgiref.sync import async_to_sync
                from channels.layers import get_channel_layer
                channel_layer = get_channel_layer()
                if channel_layer and notifications:
                    for notif in notifications:
                        try:
                            async_to_sync(channel_layer.group_send)(
                                f'notifications_{notif.user_id}',
                                {
                                    'type':              'send_notification',
                                    'id':                notif.id,
                                    'message':           notif.message,
                                    'notification_type': notif.notification_type,
                                    'item_id':           item.id,
                                    'item_type':         item.type,
                                    'time':              timezone.now().isoformat(),
                                }
                            )
                        except Exception:
                            pass
            except Exception as ws_err:
                print(f"[WS broadcast error] {ws_err}")

        except Exception as e:
            print(f"[Notification broadcast error] {e}")


class ItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ItemSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Item.objects.select_related('user', 'claimed_by').prefetch_related('photos')
        if user.is_authenticated and user.role != 'super_admin':
            if user.college:
                return qs.filter(college=user.college)
            return qs.none()
        return qs

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def update(self, request, *args, **kwargs):
        item = self.get_object()
        if item.user != request.user and request.user.role not in ['super_admin', 'college_admin']:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        item = self.get_object()
        if item.user != request.user and request.user.role not in ['super_admin', 'college_admin']:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)


class ClaimItemView(APIView):
    def post(self, request, pk):
        try:
            user = request.user
            item = Item.objects.select_for_update().get(pk=pk)
            # Isolation check
            if user.role != 'super_admin' and item.college != user.college:
                return Response({
                    'success': False,
                    'message': 'Unauthorized to claim items from another college'
                }, status=status.HTTP_403_FORBIDDEN)
        except Item.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Item not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            from unitrace.api_utils import log_event
            log_event("db_error_claim", {"error": str(e), "item_id": pk}, level="error")
            raise e

        if item.type == 'found':
            return Response({
                'success': False,
                'message': 'Found items cannot be claimed. Contact the finder directly.'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        if item.status == 'claimed':
            return Response({
                'success': False,
                'message': 'This item has already been claimed'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        if item.status == 'closed':
            return Response({
                'success': False, 
                'message': 'This item is no longer available'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        if item.user == request.user:
            return Response({
                'success': False,
                'message': 'You cannot claim your own item'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Idempotency check: Already claimed by THIS user?
        if item.claimed_by == request.user:
            return Response({
                'success': True,
                'message': 'You have already claimed this item',
                'data': ItemSerializer(item, context={'request': request}).data
            })

        try:
            item.status     = 'claimed'
            item.claimed_by = request.user
            item.save()

            # ✅ In-app notification
            from notifications.models import Notification
            Notification.objects.create(
                user=item.user,
                item=item,
                message=f'🙋 {request.user.name} has claimed your {item.type} item: "{item.title}"',
                notification_type='item_claimed',
                play_sound=item.user.notification_sound,
            )
            
            from unitrace.api_utils import log_event
            log_event("item_claimed", {"item_id": item.id, "claimed_by": user.id})

            return Response({
                'success': True,
                'message': 'Item claimed successfully',
                'data': ItemSerializer(item, context={'request': request}).data
            })
        except Exception as e:
            from unitrace.api_utils import log_event
            log_event("claim_save_error", {"error": str(e), "item_id": item.id}, level="error")
            raise e


class AddItemPhotosView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        try:
            user = request.user
            item = Item.objects.get(pk=pk)
            if item.user != user and user.role not in ['super_admin', 'college_admin']:
                return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
            if user.role != 'super_admin' and item.college != user.college:
                return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        except Item.DoesNotExist:
            return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)

        photos = request.FILES.getlist('photos')
        if not photos:
            return Response({'error': 'No photos provided'}, status=status.HTTP_400_BAD_REQUEST)

        created = [ItemPhoto.objects.create(item=item, photo=p, is_primary=False) for p in photos]
        return Response(
            ItemPhotoSerializer(created, many=True, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )

    def delete(self, request, pk):
        photo_id = request.data.get('photo_id')
        try:
            photo = ItemPhoto.objects.get(pk=photo_id, item__user=request.user)
            photo.delete()
            return Response({'message': 'Photo deleted'})
        except ItemPhoto.DoesNotExist:
            return Response({'error': 'Photo not found'}, status=status.HTTP_404_NOT_FOUND)


class MyItemsView(generics.ListAPIView):
    serializer_class = ItemSerializer

    def get_queryset(self):
        return Item.objects.filter(
            user=self.request.user
        ).select_related('user', 'claimed_by').prefetch_related('photos')

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class MyClaimsView(generics.ListAPIView):
    """View to list items that the current user has claimed."""
    serializer_class = ItemSerializer

    def get_queryset(self):
        return Item.objects.filter(
            claimed_by=self.request.user
        ).select_related('user', 'claimed_by').prefetch_related('photos')

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class RecentItemsView(generics.ListAPIView):
    serializer_class = ItemSerializer
    pagination_class = None

    def get_queryset(self):
        user = self.request.user
        qs = Item.objects.filter(status='active').select_related('user').prefetch_related('photos')
        if user.is_authenticated and user.role != 'super_admin' and user.college:
            qs = qs.filter(college=user.college)
        return qs.order_by('-created_at')[:8]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class NearbyItemsView(APIView):
    def get(self, request):
        try:
            lat = float(request.query_params.get('lat', ''))
            lng = float(request.query_params.get('lng', ''))
            km  = float(request.query_params.get('km', 2))
        except (ValueError, TypeError):
            return Response({'error': 'lat and lng are required and must be numbers'}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        all_items = Item.objects.filter(status='active').select_related('user').prefetch_related('photos')
        if user.is_authenticated and user.role != 'super_admin':
            if user.college:
                all_items = all_items.filter(college=user.college)
            else:
                return Response([])

        nearby = []
        for item in all_items:
            if item.latitude and item.longitude:
                dist = haversine_distance(lat, lng, item.latitude, item.longitude)
                if dist is not None and dist <= km:
                    nearby.append((dist, item))

        nearby.sort(key=lambda x: x[0])

        result = []
        for dist, item in nearby:
            data = ItemSerializer(item, context={'request': request}).data
            data['distance_km']    = round(dist, 2)
            data['walk_time_min']  = round((dist / 5.0) * 60)
            data['drive_time_min'] = round((dist / 30.0) * 60)
            result.append(data)

        return Response(result)

class VerifyClaimView(APIView):
    def post(self, request, pk):
        try:
            return self._post(request, pk)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def _post(self, request, pk):
        try:
            from django.db import transaction
            with transaction.atomic():
                try:
                    item = Item.objects.select_for_update().get(id=pk)
                except Item.DoesNotExist:
                    return Response({
                        "success": False,
                        "message": "Item not found."
                    }, status=status.HTTP_404_NOT_FOUND)

                # Isolation check
                if request.user.role != 'super_admin' and item.college != request.user.college:
                    return Response({
                        "success": False,
                        "message": "Unauthorized"
                    }, status=status.HTTP_403_FORBIDDEN)

                previous_attempts = ClaimSession.objects.filter(item=item, claimant=request.user).count()
                if previous_attempts >= 3:
                    return Response({
                        "success": False,
                        "message": "Maximum claim attempts reached for this item."
                    }, status=status.HTTP_403_FORBIDDEN)

                is_electronic = item.is_electronics()

                # Idempotency: Return existing pending claim
                existing_claim = ClaimSession.objects.filter(item=item, claimant=request.user, status='pending').first()
                if existing_claim:
                     return Response({
                         "success": True,
                         "message": "AIV_STARTED" if is_electronic else "NORMAL_CLAIM_STARTED",
                         "data": {
                             "status": existing_claim.status,
                             "is_electronics": is_electronic,
                             "verification_questions": existing_claim.ai_questions if is_electronic else []
                         }
                     })

                questions = []
                if is_electronic:
                    if not item.verification_questions:
                        questions = [
                            f"What is the brand of this {item.title}?", 
                            "What is the exact color?", 
                            "Are there any unique identifying marks?",
                            "What condition is the item in?",
                            "Any other specific detail?"
                        ]
                    else:
                        questions = item.verification_questions

                    claim = ClaimSession.objects.create(
                        item=item,
                        claimant=request.user,
                        status='pending',
                        attempts=previous_attempts + 1,
                        ai_questions=questions
                    )
                else:
                    claim = ClaimSession.objects.create(
                        item=item,
                        claimant=request.user,
                        status='pending', 
                        ai_score=0,
                        attempts=previous_attempts + 1,
                        ai_questions=[]
                    )

                # Create or get chat room
                from chat.models import ChatRoom, ChatMessage
                from django.db.models import Q
                room = ChatRoom.objects.filter(
                    Q(participant1=request.user, participant2=item.user) |
                    Q(participant1=item.user, participant2=request.user),
                    item=item
                ).first()

                if not room:
                    room = ChatRoom.objects.create(item=item, participant1=request.user, participant2=item.user)

                if is_electronic:
                    q_text = questions[0]
                    sys_msg = f"**System:** Verifying ownership. Please answer the following 5 questions based on property details.\n\nQuestion 1: {q_text}"
                    ChatMessage.objects.create(room=room, sender=item.user, message=sys_msg, message_type='text')
                else:
                    sys_msg = f"**System:** Direct chat mode. Finder and Claimant are now connected. Please coordinate the return manually."
                    ChatMessage.objects.create(room=room, sender=item.user, message=sys_msg, message_type='text')

                send_in_app_notification(
                    user=item.user,
                    item=item,
                    message=f"Right owner found! {request.user.name} started verifying the claim." if is_electronic else f"Right owner found! {request.user.name} is claiming the item you reported.",
                    notification_type='item_claimed'
                )
                
                from unitrace.api_utils import log_event
                log_event("claim_started", {"item_id": item.id, "claimant": request.user.id, "type": "electronic" if is_electronic else "normal"})

                return Response({
                    "success": True,
                    "message": "AIV_STARTED" if is_electronic else "NORMAL_CLAIM_STARTED",
                    "data": {
                        "status": claim.status,
                        "is_electronics": is_electronic,
                        "verification_questions": questions if is_electronic else []
                    }
                })
        except Exception as e:
            from unitrace.api_utils import log_event
            log_event("verify_claim_error", {"error": str(e), "item_id": pk}, level="error")
            raise e


class SubmitAIAnswerView(APIView):
    def post(self, request, pk):
        try:
            from django.db import transaction
            with transaction.atomic():
                try:
                    item = Item.objects.get(id=pk)
                    # Use select_for_update on the claim session
                    claim = ClaimSession.objects.select_for_update().filter(item=item, claimant=request.user).order_by('-created_at').first()
                    if not claim:
                        return Response({
                            "success": False,
                            "message": "No active claim session found."
                        }, status=status.HTTP_404_NOT_FOUND)
                except Item.DoesNotExist:
                    return Response({
                        "success": False,
                        "message": "Item not found."
                    }, status=status.HTTP_404_NOT_FOUND)

                # If already finished, just return the result
                if claim.status != 'pending':
                    return Response({
                        "success": True,
                        "message": "Verification already completed",
                        "data": {
                            "finished": True,
                            "ai_result": getattr(claim, 'ai_result', claim.ai_result_label),
                            "score": claim.ai_score
                        }
                    })

                answer = request.data.get("answer", "").strip()
                idx = claim.current_question_index
                
                # Robust logging
                from unitrace.api_utils import log_event
                log_event("ai_verification_step", {
                    "claim_id": claim.id,
                    "item_id": pk,
                    "current_idx": idx,
                    "questions_count": len(claim.ai_questions),
                    "has_answer": bool(answer)
                })

                # If initializing (answer is empty and index 0)
                if not answer and idx == 0:
                    if not claim.ai_questions:
                        return Response({
                            "success": False,
                            "message": "AI verification session has no questions. Please contact support."
                        }, status=status.HTTP_400_BAD_REQUEST)
                        
                    return Response({
                        "success": True,
                        "data": {
                            "next_question": claim.ai_questions[0],
                            "question_index": 0,
                            "finished": False
                        }
                    })

                if idx >= len(claim.ai_questions):
                    return Response({
                        "success": False,
                        "message": "No more questions."
                    }, status=status.HTTP_400_BAD_REQUEST)

                # Evaluate Answer
                from .ai_utils import compare_user_answer_to_founder
                question = claim.ai_questions[idx]
                
                # Get founder's answer for this question
                founder_answers = item.verification_answers or {}
                # Handle possible key formats
                founder_answer_obj = founder_answers.get(f"Q{idx+1}") or founder_answers.get(str(idx+1))
                founder_answer = ""
                if isinstance(founder_answer_obj, dict):
                    founder_answer = founder_answer_obj.get("answer", "")
                elif isinstance(founder_answer_obj, str):
                    founder_answer = founder_answer_obj
                
                if founder_answer:
                    score = compare_user_answer_to_founder(question, founder_answer, answer)
                else:
                    from .ai_utils import evaluate_single_answer
                    score = evaluate_single_answer(item.image, question, answer)
                
                claim.ai_score += score
                claim.current_question_index += 1
                
                # Save Answer
                answers = claim.user_answers
                answers[f"Q{idx+1}"] = {"question": question, "answer": answer, "score": score}
                claim.user_answers = answers
                
                is_finished = claim.current_question_index >= len(claim.ai_questions)
                
                if is_finished:
                    total_score = claim.ai_score
                    if total_score >= 40: label = "PERFECT MATCH"
                    elif total_score >= 30: label = "GOOD MATCH"
                    elif total_score >= 20: label = "PARTIAL MATCH"
                    else: label = "INACCURATE"
                    
                    claim.ai_result = label
                    claim.ai_result_label = label
                    claim.save()

                    send_in_app_notification(
                        user=item.user,
                        item=item,
                        message=f"AI verification completed for {item.title}. Result: {label}. Please review.",
                        notification_type='item_claimed'
                    )
                    
                    from unitrace.api_utils import log_event
                    log_event("ai_verification_finished", {"claim_id": claim.id, "score": total_score, "result": label})

                    return Response({
                        "success": True,
                        "message": "Verification finished",
                        "data": {
                            "finished": True,
                            "ai_result": label,
                            "score": total_score
                        }
                    })
                
                claim.save()
                return Response({
                    "success": True,
                    "data": {
                        "next_question": claim.ai_questions[claim.current_question_index],
                        "question_index": claim.current_question_index,
                        "finished": False
                    }
                })
        except Exception as e:
            from unitrace.api_utils import log_event
            log_event("submit_answer_error", {"error": str(e), "item_id": pk}, level="error")
            raise e


class ConfirmReturnView(APIView):
    def post(self, request, item_id):
        try:
            from django.db import transaction
            with transaction.atomic():
                try:
                    item = Item.objects.select_for_update().get(id=item_id)
                    # Find the verified claim for this item
                    claim = ClaimSession.objects.select_for_update().filter(item=item, status='verified').first()
                except Item.DoesNotExist:
                    return Response({
                        "success": False,
                        "message": "Item not found."
                    }, status=status.HTTP_404_NOT_FOUND)

                if not claim:
                    return Response({
                        "success": False,
                        "message": "No verified claim found for this item. Has the owner approved it yet?"
                    }, status=status.HTTP_400_BAD_REQUEST)

                entered_code = request.data.get("claim_code")
                
                entered_code = request.data.get("claim_code")
                
                # Original Flow: Only the claimant can confirm their own received item
                if claim.claimant != request.user:
                    return Response({
                        "success": False,
                        "message": "Only the claimant can confirm item receipt."
                    }, status=status.HTTP_403_FORBIDDEN)

                # Check claim code
                if not entered_code or claim.claim_code != str(entered_code).strip():
                    return Response({
                        "success": False,
                        "message": "Invalid claim code"
                    }, status=status.HTTP_400_BAD_REQUEST)

                # Confirm return
                claim.status = 'completed'
                item.status = "returned"
                item.claimed_by = request.user
                item.save()
                claim.save()

                # Atomically mark payment as completed if it exists
                from payments.models import RewardPayment
                payment = RewardPayment.objects.filter(item=item, payer=request.user, status='paid').first()
                if payment:
                    payment.status = 'completed'
                    payment.save()
                    print(f"PAYMENT_COMPLETED: Order={payment.razorpay_order_id}, Released to Finder={payment.finder_amount}")

                # Award Rewards
                # For "found" items: item.user = founder (gets rewards), claim.claimant = lost person (enters code, receives this response)
                # For "lost" items: item.user = lost person, claim.claimant = finder (gets rewards AND receives this response)
                reward_info = {}
                try:
                    from users.rewards_logic import grant_reward_points
                    if item.type == 'found':
                        # Founder gets points. The API response goes to the claimant (lost person), so is_yours=False
                        finder = item.user
                        new_badges = grant_reward_points(finder, 50, f"Successfully returned item: {item.title}", "return", item) or []
                        grant_reward_points(finder, 20, f"Initial report for returned item: {item.title}", "reporting", item)
                        grant_reward_points(finder, 30, f"Approved owner for: {item.title}", "approval", item)
                        finder.refresh_from_db()
                        reward_info = {
                            "is_yours": False,  # Response goes to lost person, not founder
                            "points_earned": 100,
                            "total_points": finder.reward_points,
                            "level": finder.level,
                            "new_badges": new_badges,
                            "items_returned": finder.successful_returns,
                            "founder_name": finder.name,
                        }
                        # Push reward popup directly to the founder via WebSocket
                        try:
                            from asgiref.sync import async_to_sync
                            from channels.layers import get_channel_layer
                            from django.utils import timezone
                            channel_layer = get_channel_layer()
                            if channel_layer:
                                async_to_sync(channel_layer.group_send)(
                                    f'notifications_{finder.id}',
                                    {
                                        'type': 'send_notification',
                                        'id': f'reward_{item.id}',
                                        'message': f'\U0001f3c6 You earned 100 points for returning "{item.title}"!',
                                        'notification_type': 'reward_earned',
                                        'item_id': item.id,
                                        'item_type': item.type,
                                        'time': timezone.now().isoformat(),
                                        'reward_data': {
                                            'points_earned': 100,
                                            'total_points': finder.reward_points,
                                            'level': finder.level,
                                            'new_badges': new_badges,
                                            'items_returned': finder.successful_returns,
                                        }
                                    }
                                )
                        except Exception as ws_err:
                            print(f'[reward_ws_push error] {ws_err}')
                    else:
                        # Lost item: claimant = finder who helped return it. They get rewards and receive this response.
                        finder = claim.claimant
                        new_badges = grant_reward_points(finder, 50, f"Successfully returned lost item: {item.title}", "return", item) or []
                        finder.refresh_from_db()
                        reward_info = {
                            "is_yours": True,  # Response goes to finder (claimant), who earned the reward
                            "points_earned": 50,
                            "total_points": finder.reward_points,
                            "level": finder.level,
                            "new_badges": new_badges,
                            "items_returned": finder.successful_returns,
                        }
                except Exception as reward_err:
                    from unitrace.api_utils import log_event
                    log_event("reward_error", {"error": str(reward_err), "item_id": item.id}, level="warning")

                # Notify Both
                send_in_app_notification(
                    user=claim.claimant,
                    item=item,
                    message=f"Success! {item.title} reached home.",
                    notification_type='item_returned'
                )
                send_in_app_notification(
                    user=item.user,
                    item=item,
                    message=f"Item returned successfully! Thank you for being a hero!",
                    notification_type='item_returned'
                )
                
                from unitrace.api_utils import log_event
                log_event("item_returned_confirmed", {"item_id": item.id, "claimant": claim.claimant.id, "finder": item.user.id})

                return Response({
                    "success": True,
                    "message": "Return confirmed successfully.",
                    "data": ItemSerializer(item, context={'request': request}).data,
                    "reward": reward_info,
                })
        except Exception as e:
            from unitrace.api_utils import log_event
            log_event("confirm_return_error", {"error": str(e), "item_id": item_id}, level="error")
            raise e


class ApproveVerificationView(APIView):
    def post(self, request, claim_id):
        try:
            from django.db import transaction
            with transaction.atomic():
                try:
                    claim = ClaimSession.objects.select_for_update().get(id=claim_id)
                    item = claim.item
                except ClaimSession.DoesNotExist:
                    return Response({
                        "success": False,
                        "message": "Claim not found"
                    }, status=status.HTTP_404_NOT_FOUND)

                if request.user != item.user:
                    return Response({
                        "success": False,
                        "message": "Unauthorized"
                    }, status=status.HTTP_403_FORBIDDEN)

                import random
                claim_code = str(random.randint(100000, 999999))
                claim.claim_code = claim_code
                item.claim_code = claim_code
                
                claim.status = 'verified'
                claim.save()
                item.save()

                # Notify claimant
                msg = f"Claim approved! Approval code: {claim_code}. Please verify it on the item page to proceed with payment and unlock contact data."

                send_in_app_notification(
                    user=claim.claimant,
                    item=item,
                    message=msg,
                    notification_type='claim_verified'
                )
                
                from unitrace.api_utils import log_event
                log_event("claim_approved", {"claim_id": claim.id, "approved_by": request.user.id})

                return Response({
                    "success": True,
                    "message": "Claim approved successfully",
                    "data": {"claim_code": claim_code}
                })
        except Exception as e:
            from unitrace.api_utils import log_event
            log_event("approve_claim_error", {"error": str(e), "claim_id": claim_id}, level="error")
            raise e


class RejectClaimView(APIView):
    def post(self, request, claim_id):
        try:
            from django.db import transaction
            with transaction.atomic():
                try:
                    claim = ClaimSession.objects.select_for_update().get(id=claim_id)
                except ClaimSession.DoesNotExist:
                    return Response({
                        "success": False,
                        "message": "Claim not found"
                    }, status=status.HTTP_404_NOT_FOUND)

                if request.user != claim.item.user:
                    return Response({
                        "success": False,
                        "message": "Unauthorized"
                    }, status=status.HTTP_403_FORBIDDEN)
                
                claim.status = 'failed'
                claim.save()
                
                from unitrace.api_utils import log_event
                log_event("claim_rejected", {"claim_id": claim.id, "rejected_by": request.user.id})

                return Response({
                    "success": True,
                    "message": "Claim rejected successfully"
                })
        except Exception as e:
            from unitrace.api_utils import log_event
            log_event("reject_claim_error", {"error": str(e), "claim_id": claim_id}, level="error")
            raise e

class GenerateElectronicQuestionsView(APIView):
    def post(self, request):
        """
        Special endpoint to generate 5 verification questions before posting.
        Used by founders for electronic items.
        """
        try:
            from .ai_utils import generate_verification_questions
            import io
            from django.core.files.base import ContentFile
            
            image_file = request.FILES.get('image')
            description = request.data.get('description')
            brand = request.data.get('brand')
            color = request.data.get('color')
            unique_mark = request.data.get('unique_mark')
            
            if not image_file:
                return Response({
                    "success": False,
                    "message": "Image is required to generate questions."
                }, status=400)
                
            questions = generate_verification_questions(
                image_file,
                description=description,
                brand=brand,
                color=color,
                unique_mark=unique_mark
            )
            
            from unitrace.api_utils import log_event
            log_event("ai_questions_generated", {"brand": brand, "color": color})

            return Response({
                "success": True,
                "message": "Questions generated successfully",
                "data": {"questions": questions}
            })
        except Exception as e:
            from unitrace.api_utils import log_event
            log_event("gen_questions_error", {"error": str(e)}, level="error")
            # The custom handler will catch and format this if we don't return here
            raise e