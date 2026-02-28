"""
chat/serializers.py

NOTE: The chat views use the custom serialize_message() helper directly
(not DRF serializers) because it needs the `request` object to build
absolute media URLs. These serializers exist for DRF browseable API
and any future admin/integration use.
"""
from rest_framework import serializers
from .models import ChatRoom, ChatMessage
from users.models import User


class ChatParticipantSerializer(serializers.ModelSerializer):
    """
    ✅ FIX 6: phone is intentionally excluded — must stay private.
    Only exposes safe public fields.
    """
    class Meta:
        model  = User
        fields = ['id', 'name']   # ← NO phone, NO email, NO password


class ChatMessageSerializer(serializers.ModelSerializer):
    sender_id   = serializers.IntegerField(source='sender.id',   read_only=True)
    sender_name = serializers.CharField(source='sender.name',    read_only=True)
    media_url   = serializers.SerializerMethodField()
    is_mine     = serializers.SerializerMethodField()

    class Meta:
        model  = ChatMessage
        fields = [
            'id', 'message', 'message_type',
            'sender_id', 'sender_name',
            'media_url', 'is_mine',
            'is_read', 'created_at',
        ]

    def get_media_url(self, obj):
        if not obj.media_file:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.media_file.url)
        return obj.media_file.url

    def get_is_mine(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.sender == request.user
        return False


class ChatRoomSerializer(serializers.ModelSerializer):
    other_participant = serializers.SerializerMethodField()
    last_message      = serializers.SerializerMethodField()
    unread_count      = serializers.SerializerMethodField()
    item_title        = serializers.CharField(source='item.title', read_only=True)

    class Meta:
        model  = ChatRoom
        fields = [
            'id', 'item_id', 'item_title',
            'other_participant',
            'last_message', 'unread_count',
            'updated_at',
        ]

    def get_other_participant(self, obj):
        request = self.context.get('request')
        if not request:
            return None
        other = obj.get_other_participant(request.user)
        if not other:
            return None
        # ✅ FIX 6: only safe fields
        return {'id': other.id, 'name': other.name}

    def get_last_message(self, obj):
        msg = obj.messages.last()
        return msg.message if msg else ''

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if not request:
            return 0
        return obj.get_unread_count(request.user)