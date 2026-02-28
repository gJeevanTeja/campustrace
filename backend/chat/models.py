from django.db import models
from users.models import User
from items.models import Item


class ChatRoom(models.Model):
    item         = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='chat_rooms')
    participant1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_rooms_as_p1')
    participant2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_rooms_as_p2')
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        db_table      = 'chat_rooms'
        unique_together = ['item', 'participant1', 'participant2']
        ordering      = ['-updated_at']

    def __str__(self):
        return f"Chat about '{self.item.title}' between {self.participant1.name} & {self.participant2.name}"

    def get_other_participant(self, user):
        if self.participant1 == user:
            return self.participant2
        return self.participant1

    def get_unread_count(self, user):
        return self.messages.filter(is_read=False).exclude(sender=user).count()

    def is_muted_by(self, user):
        return MutedRoom.objects.filter(room=self, user=user).exists()


class ChatMessage(models.Model):
    MESSAGE_TYPES = [
        ('text',    'Text'),
        ('image',   'Image'),
        ('video',   'Video'),
        ('file',    'File'),
        ('forward', 'Forwarded'),
    ]

    room             = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages')
    sender           = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    message          = models.TextField()
    message_type     = models.CharField(max_length=10, choices=MESSAGE_TYPES, default='text')
    media_file       = models.FileField(upload_to='chat_media/', blank=True, null=True)
    is_read          = models.BooleanField(default=False)

    # ── Forward support ───────────────────────────────────────────
    forwarded_from   = models.ForeignKey(
        'self', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='forwards'
    )
    original_sender  = models.ForeignKey(
        User, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='original_messages'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'chat_messages'
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sender.name} [{self.message_type}]: {self.message[:50]}"


class BlockedUser(models.Model):
    """User A blocks User B — B cannot send messages to A."""
    blocker    = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blocked_users')
    blocked    = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blocked_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table        = 'blocked_users'
        unique_together = ['blocker', 'blocked']

    def __str__(self):
        return f"{self.blocker.name} blocked {self.blocked.name}"


class MutedRoom(models.Model):
    """User mutes notifications for a specific chat room."""
    user       = models.ForeignKey(User, on_delete=models.CASCADE, related_name='muted_rooms')
    room       = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='muted_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table        = 'muted_rooms'
        unique_together = ['user', 'room']

    def __str__(self):
        return f"{self.user.name} muted room {self.room.id}"