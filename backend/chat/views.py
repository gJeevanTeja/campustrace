from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Q
from .models import ChatRoom, ChatMessage, BlockedUser, MutedRoom
from users.models import User
from items.models import Item


# ─────────────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def build_media_url(request, file_field):
    """Always returns an absolute URL. Safe if file_field is empty."""
    if not file_field:
        return None
    if request is not None:
        return request.build_absolute_uri(file_field.url)
    return file_field.url


def serialize_message(msg, request_user, request=None):
    """
    ✅ Absolute media URLs (works on mobile)
    ✅ Phone number never included
    ✅ Forward info included when present
    ✅ sender_id always int
    """
    data = {
        'id':              msg.id,
        'message':         msg.message,
        'text':            msg.message,
        'message_type':    msg.message_type,
        'sender':          msg.sender.name,
        'sender_id':       msg.sender.id,          # always int
        'is_mine':         msg.sender == request_user,
        'is_read':         msg.is_read,
        'created_at':      msg.created_at.isoformat(),
        'media_url':       build_media_url(request, msg.media_file),
        'is_forwarded':    msg.forwarded_from is not None,
        'original_sender': msg.original_sender.name if msg.original_sender else None,
    }
    return data


def _broadcast_ws(room_id, payload):
    """Push a payload dict to the chat WebSocket group."""
    try:
        from asgiref.sync import async_to_sync
        from channels.layers import get_channel_layer
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(f'chat_{room_id}', payload)
    except Exception as e:
        print(f'[WS broadcast error] {e}')


def is_blocked(sender, receiver):
    """Returns True if receiver has blocked sender."""
    return BlockedUser.objects.filter(blocker=receiver, blocked=sender).exists()


# ─────────────────────────────────────────────────────────────────────────────
# CHAT ROOM LIST
# ─────────────────────────────────────────────────────────────────────────────

class ChatRoomListView(APIView):
    def get(self, request):
        rooms = ChatRoom.objects.filter(
            Q(participant1=request.user) | Q(participant2=request.user)
        ).select_related('item', 'participant1', 'participant2').order_by('-updated_at')

        data = []
        for room in rooms:
            other    = room.get_other_participant(request.user)
            last_msg = room.messages.last()
            data.append({
                'id':       room.id,
                'item':     {'id': room.item.id, 'title': room.item.title},
                'item_id':  room.item.id,
                'item_title': room.item.title,
                'other_participant': {
                    'id':   other.id   if other else None,
                    'name': other.name if other else '',
                    # ✅ NO phone
                },
                'other_user_name':  other.name if other else '',
                'other_user_id':    other.id   if other else None,
                'unread_count':     room.get_unread_count(request.user),
                'is_muted':         room.is_muted_by(request.user),
                'last_message':     last_msg.message if last_msg else '',
                'last_message_time': last_msg.created_at.isoformat() if last_msg else None,
                'updated_at':       room.updated_at.isoformat(),
            })
        return Response(data)


# ─────────────────────────────────────────────────────────────────────────────
# START CHAT
# ─────────────────────────────────────────────────────────────────────────────

class StartChatView(APIView):
    def post(self, request):
        item_id = request.data.get('item_id')
        if not item_id:
            return Response({'error': 'item_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            item = Item.objects.select_related('user').get(id=item_id)
        except Item.DoesNotExist:
            return Response({'error': 'Item not found.'}, status=status.HTTP_404_NOT_FOUND)

        if item.user == request.user:
            return Response({'error': 'You cannot chat about your own item.'}, status=status.HTTP_400_BAD_REQUEST)

        # ✅ Enforce college isolation for admins
        if request.user.role != 'super_admin' and item.college != request.user.college:
            return Response({'error': 'You can only chat about items in your own college.'}, status=status.HTTP_403_FORBIDDEN)

        user1, user2 = request.user, item.user

        # ✅ Block check — prevent starting chat if blocked
        if is_blocked(user1, user2):
            return Response({'error': 'You are blocked by this user.'}, status=status.HTTP_403_FORBIDDEN)

        room = ChatRoom.objects.filter(
            Q(participant1=user1, participant2=user2) |
            Q(participant1=user2, participant2=user1),
            item=item
        ).first()

        if not room:
            room = ChatRoom.objects.create(item=item, participant1=user1, participant2=user2)

        return Response({
            'id': room.id, 'room_id': room.id,
            'item_id': item.id, 'item_title': item.title,
            'other_user': user2.name,
        }, status=status.HTTP_200_OK)


# ─────────────────────────────────────────────────────────────────────────────
# MESSAGES (GET + POST)
# ─────────────────────────────────────────────────────────────────────────────

class ChatMessagesView(APIView):
    def get(self, request, room_id):
        try:
            room = ChatRoom.objects.select_related(
                'item', 'participant1', 'participant2'
            ).get(id=room_id)
        except ChatRoom.DoesNotExist:
            return Response({'error': 'Room not found.'}, status=status.HTTP_404_NOT_FOUND)

        if request.user not in [room.participant1, room.participant2]:
            return Response({'error': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

        room.messages.filter(is_read=False).exclude(sender=request.user).update(is_read=True)

        messages_qs = room.messages.select_related('sender', 'original_sender').order_by('created_at')
        other = room.get_other_participant(request.user)

        return Response({
            'room_id': room.id,
            'item':    {'id': room.item.id, 'title': room.item.title},
            'other_participant': {
                'id':   other.id   if other else None,
                'name': other.name if other else '',
                # ✅ NO phone exposed
            },
            'is_muted': room.is_muted_by(request.user),
            'messages': [serialize_message(m, request.user, request) for m in messages_qs],
        })

    def post(self, request, room_id):
        try:
            room = ChatRoom.objects.get(id=room_id)
        except ChatRoom.DoesNotExist:
            return Response({'error': 'Room not found.'}, status=status.HTTP_404_NOT_FOUND)

        if request.user not in [room.participant1, room.participant2]:
            return Response({'error': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

        other = room.get_other_participant(request.user)

        # ✅ Block check before sending
        if is_blocked(request.user, other):
            return Response({'error': 'You cannot send messages to this user.'}, status=status.HTTP_403_FORBIDDEN)

        message_text = request.data.get('message', '').strip()
        message_type = request.data.get('message_type', 'text')
        if message_type not in ('text', 'image', 'video', 'file'):
            message_type = 'text'

        if not message_text:
            return Response({'error': 'Message cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)

        msg = ChatMessage.objects.create(
            room=room, sender=request.user,
            message=message_text, message_type=message_type,
        )

        # 🤖 AI Claim Verification Hook
        from items.models import ClaimSession
        pending_claim = ClaimSession.objects.filter(
            item=room.item, 
            claimant=request.user, 
            status='pending'
        ).first()

        if pending_claim and message_type == 'text':
            import threading
            def evaluate_in_background(claim_id, text_ans, message_room_id, request_user_name, request_user_id):
                try:
                    from items.models import ClaimSession
                    from chat.models import ChatMessage, ChatRoom
                    from notifications.models import Notification
                    from items.ai_utils import evaluate_answers
                    
                    bg_claim = ClaimSession.objects.get(id=claim_id)
                    bg_room = ChatRoom.objects.get(id=message_room_id)
                    
                    score = evaluate_answers(bg_claim.item.image, bg_claim.ai_questions, [text_ans])
                    bg_claim.user_answers = {"raw_text": text_ans}
                    bg_claim.ai_score = score
                    
                    sys_reply = ""
                    if score >= 3:
                        bg_claim.status = 'ai_verified'
                        sys_reply = f"**System:** Verification passed (Score: {score}/4). Awaiting finder approval."
                        try:
                            Notification.objects.create(
                                user=bg_room.item.user, item=bg_room.item,
                                message=f"{request_user_name} passed AI verification for your item! Please review.",
                                notification_type='item_claimed'
                            )
                        except Exception:
                            pass
                    else:
                        if bg_claim.attempts >= 2:
                            bg_claim.status = 'rejected'
                            sys_reply = f"**System:** Verification failed (Score: {score}/4). Maximum attempts reached."
                        else:
                            bg_claim.attempts += 1
                            sys_reply = f"**System:** Verification failed (Score: {score}/4). You have 1 attempt remaining. Please try answering again."
                            
                    bg_claim.save()
                    
                    sys_msg = ChatMessage.objects.create(
                        room=bg_room, sender=bg_room.item.user,
                        message=sys_reply, message_type='text'
                    )
                    from chat.views import _broadcast_ws
                    _broadcast_ws(bg_room.id, {
                        'type': 'chat_message',
                        'id': sys_msg.id,
                        'message': sys_msg.message,
                        'message_type': 'text',
                        'media_url': None,
                        'sender': bg_room.item.user.name,
                        'sender_id': bg_room.item.user.id,
                        'created_at': sys_msg.created_at.isoformat(),
                        'is_forwarded': False,
                        'original_sender': None,
                    })
                except Exception as e:
                    print(f"[AI Chat Hook Error] {e}")

            threading.Thread(
                target=evaluate_in_background,
                args=(pending_claim.id, message_text, room.id, request.user.name, request.user.id),
                daemon=True
            ).start()


        from django.utils import timezone
        room.updated_at = timezone.now()
        room.save(update_fields=['updated_at'])

        # Notification (only if not muted)
        if not room.is_muted_by(other):
            try:
                from notifications.models import Notification
                Notification.objects.create(
                    user=other, item=room.item,
                    message=f'💬 {request.user.name}: {message_text[:60]}',
                    notification_type='new_message',
                )
            except Exception:
                pass

        return Response(serialize_message(msg, request.user, request), status=status.HTTP_201_CREATED)


# ─────────────────────────────────────────────────────────────────────────────
# MEDIA UPLOAD
# ─────────────────────────────────────────────────────────────────────────────

class ChatMediaUploadView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, room_id):
        try:
            room = ChatRoom.objects.get(id=room_id)
        except ChatRoom.DoesNotExist:
            return Response({'error': 'Room not found.'}, status=status.HTTP_404_NOT_FOUND)

        if request.user not in [room.participant1, room.participant2]:
            return Response({'error': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

        other = room.get_other_participant(request.user)
        if is_blocked(request.user, other):
            return Response({'error': 'You cannot send files to this user.'}, status=status.HTTP_403_FORBIDDEN)

        media_file = request.FILES.get('file')
        if not media_file:
            return Response({'error': 'No file provided.'}, status=status.HTTP_400_BAD_REQUEST)

        ct = media_file.content_type or ''
        if ct.startswith('image/'):
            message_type, label = 'image', f'🖼️ {media_file.name}'
        elif ct.startswith('video/'):
            message_type, label = 'video', f'🎥 {media_file.name}'
        else:
            message_type, label = 'file',  f'📄 {media_file.name}'

        msg = ChatMessage.objects.create(
            room=room, sender=request.user,
            message=label, message_type=message_type, media_file=media_file,
        )

        from django.utils import timezone
        room.updated_at = timezone.now()
        room.save(update_fields=['updated_at'])

        absolute_url = request.build_absolute_uri(msg.media_file.url)

        # Broadcast via WebSocket so receiver gets it instantly
        _broadcast_ws(room.id, {
            'type':         'chat_message',
            'id':           msg.id,
            'message':      msg.message,
            'message_type': msg.message_type,
            'media_url':    absolute_url,
            'sender':       request.user.name,
            'sender_id':    request.user.id,
            'created_at':   msg.created_at.isoformat(),
            'is_forwarded': False,
            'original_sender': None,
        })

        return Response(serialize_message(msg, request.user, request), status=status.HTTP_201_CREATED)


# ─────────────────────────────────────────────────────────────────────────────
# CLEAR CHAT
# ─────────────────────────────────────────────────────────────────────────────

class ClearChatView(APIView):
    def delete(self, request, room_id):
        try:
            room = ChatRoom.objects.get(id=room_id)
        except ChatRoom.DoesNotExist:
            return Response({'error': 'Room not found.'}, status=status.HTTP_404_NOT_FOUND)

        if request.user not in [room.participant1, room.participant2]:
            return Response({'error': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

        count, _ = room.messages.all().delete()
        return Response({'success': True, 'deleted_count': count}, status=status.HTTP_200_OK)


# ─────────────────────────────────────────────────────────────────────────────
# SEARCH MESSAGES
# ─────────────────────────────────────────────────────────────────────────────

class SearchMessagesView(APIView):
    """GET /api/chat/{room_id}/search/?q=keyword"""

    def get(self, request, room_id):
        try:
            room = ChatRoom.objects.get(id=room_id)
        except ChatRoom.DoesNotExist:
            return Response({'error': 'Room not found.'}, status=status.HTTP_404_NOT_FOUND)

        if request.user not in [room.participant1, room.participant2]:
            return Response({'error': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

        q = request.query_params.get('q', '').strip()
        if not q:
            return Response({'results': [], 'count': 0})

        results = room.messages.filter(
            message__icontains=q
        ).select_related('sender').order_by('created_at')

        return Response({
            'results': [serialize_message(m, request.user, request) for m in results],
            'count':   results.count(),
            'query':   q,
        })


# ─────────────────────────────────────────────────────────────────────────────
# BLOCK / UNBLOCK USER
# ─────────────────────────────────────────────────────────────────────────────

class BlockUserView(APIView):
    """POST /api/chat/block/{user_id}/   → block
       DELETE /api/chat/block/{user_id}/ → unblock"""

    def post(self, request, user_id):
        try:
            target = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        if target == request.user:
            return Response({'error': 'You cannot block yourself.'}, status=status.HTTP_400_BAD_REQUEST)

        _, created = BlockedUser.objects.get_or_create(blocker=request.user, blocked=target)
        if created:
            return Response({'success': True, 'message': f'{target.name} has been blocked.'})
        return Response({'success': True, 'message': f'{target.name} is already blocked.'})

    def delete(self, request, user_id):
        try:
            target = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        deleted, _ = BlockedUser.objects.filter(blocker=request.user, blocked=target).delete()
        if deleted:
            return Response({'success': True, 'message': f'{target.name} has been unblocked.'})
        return Response({'success': False, 'message': 'User was not blocked.'})


class BlockStatusView(APIView):
    """GET /api/chat/block/{user_id}/status/"""

    def get(self, request, user_id):
        try:
            target = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        i_blocked_them   = BlockedUser.objects.filter(blocker=request.user, blocked=target).exists()
        they_blocked_me  = BlockedUser.objects.filter(blocker=target, blocked=request.user).exists()

        return Response({
            'i_blocked_them':  i_blocked_them,
            'they_blocked_me': they_blocked_me,
            'can_message':     not i_blocked_them and not they_blocked_me,
        })


# ─────────────────────────────────────────────────────────────────────────────
# MUTE / UNMUTE ROOM
# ─────────────────────────────────────────────────────────────────────────────

class MuteRoomView(APIView):
    """POST /api/chat/{room_id}/mute/   → mute
       DELETE /api/chat/{room_id}/mute/ → unmute"""

    def post(self, request, room_id):
        try:
            room = ChatRoom.objects.get(id=room_id)
        except ChatRoom.DoesNotExist:
            return Response({'error': 'Room not found.'}, status=status.HTTP_404_NOT_FOUND)

        if request.user not in [room.participant1, room.participant2]:
            return Response({'error': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

        MutedRoom.objects.get_or_create(user=request.user, room=room)
        return Response({'success': True, 'is_muted': True})

    def delete(self, request, room_id):
        try:
            room = ChatRoom.objects.get(id=room_id)
        except ChatRoom.DoesNotExist:
            return Response({'error': 'Room not found.'}, status=status.HTTP_404_NOT_FOUND)

        if request.user not in [room.participant1, room.participant2]:
            return Response({'error': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

        MutedRoom.objects.filter(user=request.user, room=room).delete()
        return Response({'success': True, 'is_muted': False})


# ─────────────────────────────────────────────────────────────────────────────
# FORWARD MESSAGE
# ─────────────────────────────────────────────────────────────────────────────

class ForwardMessageView(APIView):
    """
    POST /api/chat/forward/
    Body: { message_id: int, target_room_id: int }
    Forwards a message to a different chat room preserving original sender.
    """

    def post(self, request):
        message_id     = request.data.get('message_id')
        target_room_id = request.data.get('target_room_id')

        if not message_id or not target_room_id:
            return Response(
                {'error': 'message_id and target_room_id are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            original_msg = ChatMessage.objects.select_related('sender').get(id=message_id)
        except ChatMessage.DoesNotExist:
            return Response({'error': 'Message not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Sender must be participant of original room
        orig_room = original_msg.room
        if request.user not in [orig_room.participant1, orig_room.participant2]:
            return Response({'error': 'Access denied to original message.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            target_room = ChatRoom.objects.get(id=target_room_id)
        except ChatRoom.DoesNotExist:
            return Response({'error': 'Target room not found.'}, status=status.HTTP_404_NOT_FOUND)

        if request.user not in [target_room.participant1, target_room.participant2]:
            return Response({'error': 'Access denied to target room.'}, status=status.HTTP_403_FORBIDDEN)

        other = target_room.get_other_participant(request.user)
        if is_blocked(request.user, other):
            return Response({'error': 'Cannot forward to this user.'}, status=status.HTTP_403_FORBIDDEN)

        # Create forwarded message
        forwarded = ChatMessage.objects.create(
            room=target_room,
            sender=request.user,
            message=original_msg.message,
            message_type=original_msg.message_type,
            media_file=original_msg.media_file,   # reuse same file
            forwarded_from=original_msg,
            original_sender=original_msg.sender,
        )

        from django.utils import timezone
        target_room.updated_at = timezone.now()
        target_room.save(update_fields=['updated_at'])

        result = serialize_message(forwarded, request.user, request)

        # Broadcast to target room's WebSocket
        _broadcast_ws(target_room.id, {
            'type':            'chat_message',
            'id':              forwarded.id,
            'message':         forwarded.message,
            'message_type':    forwarded.message_type,
            'media_url':       result.get('media_url'),
            'sender':          request.user.name,
            'sender_id':       request.user.id,
            'created_at':      forwarded.created_at.isoformat(),
            'is_forwarded':    True,
            'original_sender': original_msg.sender.name,
        })

        return Response(result, status=status.HTTP_201_CREATED)


# ─────────────────────────────────────────────────────────────────────────────
# MEDIA & LINKS VIEWER
# ─────────────────────────────────────────────────────────────────────────────

class ChatMediaListView(APIView):
    def get(self, request, room_id):
        try:
            room = ChatRoom.objects.get(id=room_id)
        except ChatRoom.DoesNotExist:
            return Response({'error': 'Room not found.'}, status=status.HTTP_404_NOT_FOUND)

        if request.user not in [room.participant1, room.participant2]:
            return Response({'error': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

        filter_type = request.query_params.get('type', 'all')
        qs = room.messages.exclude(message_type='text').select_related('sender').order_by('-created_at')
        if filter_type in ('image', 'video', 'file'):
            qs = qs.filter(message_type=filter_type)

        media_items = []
        for msg in qs:
            item = {
                'id': msg.id, 'message_type': msg.message_type,
                'message': msg.message, 'sender': msg.sender.name,
                'created_at': msg.created_at.isoformat(),
                'media_url': build_media_url(request, msg.media_file),
            }
            media_items.append(item)

        import re
        link_pattern = re.compile(r'https?://\S+')
        links = []
        if filter_type in ('all', 'links'):
            for msg in room.messages.filter(message_type='text').select_related('sender'):
                for url in link_pattern.findall(msg.message):
                    links.append({
                        'id': msg.id, 'url': url,
                        'sender': msg.sender.name,
                        'created_at': msg.created_at.isoformat(),
                    })

        return Response({
            'media': media_items, 'links': links,
            'counts': {
                'images': room.messages.filter(message_type='image').count(),
                'videos': room.messages.filter(message_type='video').count(),
                'files':  room.messages.filter(message_type='file').count(),
                'links':  len(links),
            },
        })


# ─────────────────────────────────────────────────────────────────────────────
# UNREAD COUNT
# ─────────────────────────────────────────────────────────────────────────────

class UnreadChatCountView(APIView):
    def get(self, request):
        rooms = ChatRoom.objects.filter(
            Q(participant1=request.user) | Q(participant2=request.user)
        )
        total_unread = sum(room.get_unread_count(request.user) for room in rooms)
        return Response({'unread_count': total_unread})