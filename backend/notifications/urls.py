from django.urls import path
from .views import (
    NotificationListView,
    MarkReadView,
    MarkAllReadView,
    UnreadCountView,
    DeleteNotificationView,
    ClearAllNotificationsView,
    NotificationSoundSettingView,
    MuteNotificationsView,
)

urlpatterns = [
    # ── List & Count ──────────────────────────────────────────
    path('', NotificationListView.as_view(), name='notifications'),
    path('unread-count/', UnreadCountView.as_view(), name='unread-count'),

    # ── Mark Read ─────────────────────────────────────────────
    path('mark-all-read/', MarkAllReadView.as_view(), name='mark-all-read'),
    path('<int:pk>/read/', MarkReadView.as_view(), name='mark-read'),

    # ── Delete ────────────────────────────────────────────────
    path('<int:pk>/delete/', DeleteNotificationView.as_view(), name='delete-notification'),
    path('clear-all/', ClearAllNotificationsView.as_view(), name='clear-all-notifications'),

    # ── Settings ──────────────────────────────────────────────
    path('sound/', NotificationSoundSettingView.as_view(), name='notification-sound'),
    path('mute/', MuteNotificationsView.as_view(), name='mute-notifications'),
]