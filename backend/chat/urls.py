from django.urls import path
from .views import (
    ChatRoomListView,
    StartChatView,
    ChatMessagesView,
    UnreadChatCountView,
    ChatMediaUploadView,
    ChatMediaListView,
    ClearChatView,
    SearchMessagesView,
    BlockUserView,
    BlockStatusView,
    MuteRoomView,
    ForwardMessageView,
)

urlpatterns = [
    # ── Room list & start ─────────────────────────────────────────
    path('',          ChatRoomListView.as_view(), name='chat-rooms'),
    path('start/',    StartChatView.as_view(),    name='start-chat'),
    path('unread/',   UnreadChatCountView.as_view(), name='chat-unread'),

    # ── Forward (no room_id — targets specified in body) ──────────
    path('forward/',  ForwardMessageView.as_view(), name='forward-message'),

    # ── Block ─────────────────────────────────────────────────────
    path('block/<int:user_id>/',         BlockUserView.as_view(),   name='block-user'),
    path('block/<int:user_id>/status/',  BlockStatusView.as_view(), name='block-status'),

    # ── Per-room endpoints ────────────────────────────────────────
    path('<int:room_id>/',          ChatMessagesView.as_view(),   name='chat-messages'),
    path('<int:room_id>/upload/',   ChatMediaUploadView.as_view(), name='chat-upload'),
    path('<int:room_id>/media/',    ChatMediaListView.as_view(),   name='chat-media'),
    path('<int:room_id>/clear/',    ClearChatView.as_view(),       name='chat-clear'),
    path('<int:room_id>/search/',   SearchMessagesView.as_view(),  name='chat-search'),
    path('<int:room_id>/mute/',     MuteRoomView.as_view(),        name='chat-mute'),
]