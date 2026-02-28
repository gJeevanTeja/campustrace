"""
notifications/models.py  ← MODIFY THIS FILE
============================================
CHANGES FROM ORIGINAL:
- Removed ALL send_mail() calls from bulk_create_for_all_users()
- Removed should_send_email() from triggering emails
- Only in-app DB notifications remain
- Email is ONLY sent in:
    1. users/views.py → SendOTPView      (OTP login)
    2. users/views.py → ForgotPasswordView (password reset)
    3. items/views.py → claim code delivery  (when you implement claim codes)
"""
from django.db import models
from users.models import User
from items.models import Item


class Notification(models.Model):
    TYPE_CHOICES = [
        ('new_item',         'New Item Posted'),
        ('item_claimed',     'Item Claimed'),
        ('password_changed', 'Password Changed'),
        ('item_found',       'Matching Item Found'),
        ('new_message',      'New Chat Message'),
        ('general',          'General'),
    ]

    user              = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    item              = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='notifications', null=True, blank=True)
    message           = models.TextField()
    notification_type = models.CharField(max_length=30, choices=TYPE_CHOICES, default='general')
    is_read           = models.BooleanField(default=False)
    play_sound        = models.BooleanField(default=True)
    created_at        = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification for {self.user.name}: {self.message[:50]}"

    def should_notify(self):
        return self.user.notifications_enabled

    def should_play_sound(self):
        return self.user.notifications_enabled and self.user.notification_sound

    # ✅ REMOVED: should_send_email() — no longer used anywhere

    @classmethod
    def create_for_user(cls, user, item, message, notification_type='new_item'):
        """Create a single in-app notification. No email."""
        if not user.notifications_enabled:
            return None
        return cls.objects.create(
            user=user,
            item=item,
            message=message,
            notification_type=notification_type,
            play_sound=user.notification_sound,
        )

    @classmethod
    def bulk_create_for_all_users(cls, item, message, notification_type='new_item', exclude_user=None, user_queryset=None):
        """
        Creates in-app DB notifications for all active users.
        If user_queryset is provided, only those users are notified.
        """
        if user_queryset is not None:
            users = user_queryset.filter(is_active=True)
        else:
            from users.models import User as UserModel
            users = UserModel.objects.filter(is_active=True)

        if exclude_user:
            users = users.exclude(id=exclude_user.id)

        notifications = []
        for user in users:
            if user.notifications_enabled:
                notifications.append(cls(
                    user=user,
                    item=item,
                    message=message,
                    notification_type=notification_type,
                    play_sound=user.notification_sound,
                ))

        created = []
        if notifications:
            created = cls.objects.bulk_create(notifications, ignore_conflicts=True)

        return created