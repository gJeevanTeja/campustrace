from notifications.models import Notification
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.utils import timezone

def send_in_app_notification(user, item, message, notification_type):
    try:
        notif = Notification.objects.create(
            user=user,
            item=item,
            message=message,
            notification_type=notification_type,
            play_sound=True,
        )

        channel_layer = get_channel_layer()
        if channel_layer:
            # Send the normal notification to trigger sound/popup
            async_to_sync(channel_layer.group_send)(
                f'notifications_{user.id}',
                {
                    'type':              'send_notification',
                    'id':                notif.id,
                    'message':           notif.message,
                    'notification_type': notif.notification_type,
                    'item_id':           item.id if item else None,
                    'item_type':         item.type if item else 'general',
                    'time':              timezone.now().isoformat(),
                }
            )
            # Send an update signal to refresh item data on frontend
            if item:
                async_to_sync(channel_layer.group_send)(
                    f'notifications_{user.id}',
                    {
                        'type': 'send_notification',
                        'id': f"item_refresh_{item.id}",
                        'message': "UPDATE_ITEM",
                        'notification_type': 'item_update',
                        'item_id': item.id,
                    }
                )
        return notif
    except Exception as e:
        print(f"[send_in_app_notification error] {e}")
        return None
