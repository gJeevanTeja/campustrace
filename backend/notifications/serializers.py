from rest_framework import serializers
from .models import Notification
from items.serializers import ItemSerializer


class NotificationSerializer(serializers.ModelSerializer):
    item = ItemSerializer(read_only=True)

    class Meta:
        model = Notification
        fields = ['id', 'item', 'message', 'is_read', 'created_at']
