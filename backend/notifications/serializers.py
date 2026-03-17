from rest_framework import serializers
from .models import Notification
from items.serializers import ItemSerializer


class NotificationSerializer(serializers.ModelSerializer):
    item_details = ItemSerializer(source='item', read_only=True)

    class Meta:
        model = Notification
        fields = ('id', 'item_details', 'message', 'notification_type', 'is_read', 'created_at')
