import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_id    = self.scope['url_route']['kwargs']['room_id']
        self.room_group = f'chat_{self.room_id}'

        user = await self.get_user_from_scope()
        if user is None:
            await self.close(code=4001)
            return
        self.user = user

        is_participant = await self.check_room_participant(self.room_id, user)
        if not is_participant:
            await self.close(code=4003)
            return

        await self.channel_layer.group_add(self.room_group, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group'):
            await self.channel_layer.group_discard(self.room_group, self.channel_name)

    async def receive(self, text_data):
        try:
            data         = json.loads(text_data)
            message_text = data.get('message', '').strip()
            message_type = data.get('message_type', 'text')
            if message_type not in ('text', 'image', 'video', 'file'):
                message_type = 'text'
        except (json.JSONDecodeError, AttributeError):
            return

        if not message_text:
            return

        # Block check before saving
        blocked = await self.is_blocked(self.room_id, self.user)
        if blocked:
            return

        msg = await self.save_message(self.room_id, self.user, message_text, message_type)
        if msg is None:
            return

        await self.channel_layer.group_send(
            self.room_group,
            {
                'type':            'chat_message',
                'id':              msg['id'],
                'message':         msg['message'],
                'message_type':    msg['message_type'],
                'media_url':       None,           # text messages have no media
                'sender':          msg['sender'],
                'sender_id':       msg['sender_id'],
                'created_at':      msg['created_at'],
                'is_forwarded':    False,
                'original_sender': None,
            }
        )

        # AI Verification Intercept
        sys_msgs = await self.process_ai_verification(self.room_id, self.user, message_text)
        if sys_msgs:
            for smsg in sys_msgs:
                await self.channel_layer.group_send(
                    self.room_group,
                    {
                        'type':            'chat_message',
                        'id':              smsg['id'],
                        'message':         smsg['message'],
                        'message_type':    smsg['message_type'],
                        'media_url':       None,
                        'sender':          smsg['sender'],
                        'sender_id':       smsg['sender_id'],
                        'created_at':      smsg['created_at'],
                        'is_forwarded':    False,
                        'original_sender': None,
                    }
                )

        # ── Send push notification to the receiver's global socket ──
        receiver_id = await self.get_receiver_for_notification(self.room_id, self.user)
        if receiver_id:
            await self.channel_layer.group_send(
                f'notifications_{receiver_id}',
                {
                    'type':              'send_notification',
                    'id':                msg['id'],                     # passing message ID
                    'message':           msg['message'],                # preview snippet
                    'notification_type': 'chat_message',                # special identifier
                    'item_id':           self.room_id,                  # room_id to route click
                    'item_type':         'chat',
                    'created_at':        msg['created_at'],
                    'sender_name':       msg['sender'],                 # The sender's name
                }
            )


    async def chat_message(self, event):
        """Delivers a message to this WebSocket client."""
        await self.send(text_data=json.dumps({
            'id':              event['id'],
            'message':         event['message'],
            'text':            event['message'],
            'message_type':    event.get('message_type', 'text'),
            'media_url':       event.get('media_url'),
            'sender':          event['sender'],
            'sender_id':       event['sender_id'],       # int
            'created_at':      event['created_at'],
            'is_forwarded':    event.get('is_forwarded', False),
            'original_sender': event.get('original_sender'),
        }))

    # ── DB helpers ────────────────────────────────────────────────

    @database_sync_to_async
    def get_user_from_scope(self):
        from rest_framework_simplejwt.tokens import AccessToken
        from users.models import User
        query_string = self.scope.get('query_string', b'').decode()
        token_str = None
        for part in query_string.split('&'):
            if part.startswith('token='):
                token_str = part.split('=', 1)[1]
                break
        if not token_str:
            return None
        try:
            token = AccessToken(token_str)
            return User.objects.get(id=token['user_id'], is_active=True)
        except Exception:
            return None

    @database_sync_to_async
    def check_room_participant(self, room_id, user):
        from chat.models import ChatRoom
        try:
            room = ChatRoom.objects.get(id=room_id)
            return room.participant1 == user or room.participant2 == user
        except ChatRoom.DoesNotExist:
            return False

    @database_sync_to_async
    def is_blocked(self, room_id, sender):
        from chat.models import ChatRoom, BlockedUser
        try:
            room     = ChatRoom.objects.get(id=room_id)
            receiver = room.get_other_participant(sender)
            return BlockedUser.objects.filter(blocker=receiver, blocked=sender).exists()
        except ChatRoom.DoesNotExist:
            return True

    @database_sync_to_async
    def save_message(self, room_id, user, message_text, message_type='text'):
        from chat.models import ChatRoom, ChatMessage
        from django.utils import timezone
        try:
            room = ChatRoom.objects.get(id=room_id)
            msg  = ChatMessage.objects.create(
                room=room, sender=user,
                message=message_text, message_type=message_type,
            )
            room.updated_at = timezone.now()
            room.save(update_fields=['updated_at'])
            return {
                'id':           msg.id,
                'message':      msg.message,
                'message_type': msg.message_type,
                'sender':       user.name,
                'sender_id':    user.id,    # int
                'created_at':   msg.created_at.isoformat(),
            }
        except ChatRoom.DoesNotExist:
            return None

    @database_sync_to_async
    def process_ai_verification(self, room_id, user, message_text):
        from items.models import ClaimSession
        from chat.models import ChatRoom, ChatMessage
        from items.ai_utils import evaluate_single_answer
        import random
        from django.utils import timezone

        try:
            room = ChatRoom.objects.get(id=room_id)
            claim = ClaimSession.objects.filter(item=room.item, claimant=user, status='pending').first()
            if not claim:
                return None
        except ChatRoom.DoesNotExist:
            return None

        if not room.item.is_electronics():
            return None

        # Verify there are questions left
        idx = claim.current_question_index
        if idx >= len(claim.ai_questions):
            return None

        question = claim.ai_questions[idx]
        
        # Evaluate answer
        score = evaluate_single_answer(room.item.image, question, message_text)
        claim.ai_score += score
        claim.current_question_index += 1
        
        # Save user answer
        answers = claim.user_answers
        answers[f"Q{idx+1}"] = {"question": question, "answer": message_text, "score": score}
        claim.user_answers = answers
        claim.save()

        # Decide what's next
        messages_to_send = []
        messages_to_send.append("**System:** Answer recorded.")

        if claim.current_question_index < len(claim.ai_questions):
            next_q = claim.ai_questions[claim.current_question_index]
            messages_to_send.append(f"**System:** Question {claim.current_question_index + 1}: {next_q}")
        else:
            # Verification finished
            if claim.ai_score >= 2:
                claim.status = 'verified'
                claim.claim_code = str(random.randint(100000, 999999))
                claim.save()
                messages_to_send.append("**System:** Verification complete. Right owner verified by AI. You can view the claim code on the item page.")

                # Notify finder
                try:
                    from notifications.models import Notification
                    Notification.objects.create(
                        user=room.item.user,
                        item=room.item,
                        message="AI verified the rightful owner for your item.",
                        notification_type='item_claimed'
                    )
                except Exception as e:
                    pass

            else:
                claim.status = 'failed'
                claim.save()
                messages_to_send.append(f"**System:** Verification failed. Score: {claim.ai_score}/{len(claim.ai_questions)}. The AI determined that the answers did not match the item details sufficiently.")

        # Save system messages
        system_msgs = []
        for text in messages_to_send:
            msg = ChatMessage.objects.create(
                room=room,
                sender=room.item.user, # Finder acts as system sender
                message=text,
                message_type='text'
            )
            system_msgs.append({
                'id':           msg.id,
                'message':      msg.message,
                'message_type': msg.message_type,
                'sender':       room.item.user.name,
                'sender_id':    room.item.user.id,
                'created_at':   msg.created_at.isoformat(),
            })

        return system_msgs

    @database_sync_to_async
    def get_receiver_for_notification(self, room_id, user):
        from chat.models import ChatRoom
        try:
            room = ChatRoom.objects.get(id=room_id)
            receiver = room.get_other_participant(user)
            if receiver and receiver.is_active:
                return receiver.id
        except ChatRoom.DoesNotExist:
            return None


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = await self.get_user_from_scope()
        if user is None:
            await self.close(code=4001)
            return
        self.user       = user
        self.group_name = f'notifications_{user.id}'
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        pass

    async def send_notification(self, event):
        await self.send(text_data=json.dumps({
            'type':              'send_notification',
            'id':                event.get('id'),
            'message':           event.get('message'),
            'notification_type': event.get('notification_type', 'general'),
            'item_id':           event.get('item_id'),
            'item_type':         event.get('item_type'),
            'created_at':        event.get('created_at'),
            'sender_name':       event.get('sender_name'),
        }))

    @database_sync_to_async
    def get_user_from_scope(self):
        from rest_framework_simplejwt.tokens import AccessToken
        from users.models import User
        query_string = self.scope.get('query_string', b'').decode()
        token_str = None
        for part in query_string.split('&'):
            if part.startswith('token='):
                token_str = part.split('=', 1)[1]
                break
        if not token_str:
            return None
        try:
            token = AccessToken(token_str)
            return User.objects.get(id=token['user_id'], is_active=True)
        except Exception:
            return None