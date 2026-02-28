from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender='items.Item')
def item_post_save(sender, instance, created, **kwargs):
    try:
        from notifications.models import Notification
        from users.models import User

        if created:
            emoji = '🔍' if instance.type == 'lost' else '📦'
            message = f"{emoji} New {instance.type} item: {instance.title}"

            users = User.objects.filter(is_active=True).exclude(id=instance.user.id)
            notifications = []
            for user in users:
                if user.notifications_enabled:
                    notifications.append(Notification(
                        user=user,
                        item=instance,
                        message=message,
                        notification_type='new_item',
                        play_sound=user.notification_sound,
                    ))
            if notifications:
                Notification.objects.bulk_create(notifications, ignore_conflicts=True)

    except Exception as e:
        print(f'[signals] error: {e}')


## Your items folder should look like this:

