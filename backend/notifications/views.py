from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer

    def get_queryset(self):
        queryset = Notification.objects.filter(
            user=self.request.user
        ).select_related('item', 'item__user')

        notif_type = self.request.query_params.get('type')
        if notif_type:
            queryset = queryset.filter(notification_type=notif_type)

        unread_only = self.request.query_params.get('unread')
        if unread_only == 'true':
            queryset = queryset.filter(is_read=False)

        return queryset


class MarkReadView(APIView):
    # ✅ FIX: changed from PUT to POST to match frontend notificationsAPI.markRead
    def post(self, request, pk):
        try:
            notif = Notification.objects.get(pk=pk, user=request.user)
            notif.is_read = True
            notif.save()
            return Response({'message': 'Marked as read'})
        except Notification.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)


class MarkAllReadView(APIView):
    # ✅ FIX: changed from PUT to POST to match frontend notificationsAPI.markAllRead
    def post(self, request):
        Notification.objects.filter(
            user=request.user,
            is_read=False
        ).update(is_read=True)
        return Response({'message': 'All notifications marked as read'})


class UnreadCountView(APIView):
    def get(self, request):
        count = Notification.objects.filter(
            user=request.user,
            is_read=False
        ).count()
        user = request.user
        return Response({
            'unread_count': count,
            'notifications_enabled': user.notifications_enabled,
            'notification_sound': user.notification_sound,
            'email_notifications': user.email_notifications,
        })


class DeleteNotificationView(APIView):
    def delete(self, request, pk):
        try:
            notif = Notification.objects.get(pk=pk, user=request.user)
            notif.delete()
            return Response({'message': 'Notification deleted'})
        except Notification.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)


class ClearAllNotificationsView(APIView):
    def delete(self, request):
        deleted_count, _ = Notification.objects.filter(
            user=request.user
        ).delete()
        return Response({'message': f'{deleted_count} notifications cleared'})


class NotificationSoundSettingView(APIView):
    # ✅ FIX: changed from PUT to POST to match frontend notificationsAPI.toggleSound
    def post(self, request):
        user = request.user
        sound_enabled = request.data.get('notification_sound')
        if sound_enabled is None:
            return Response(
                {'error': 'notification_sound field is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        user.notification_sound = sound_enabled
        user.save()
        return Response({
            'message': f"Notification sound {'enabled' if sound_enabled else 'disabled'}",
            'notification_sound': user.notification_sound,
        })


class MuteNotificationsView(APIView):
    # ✅ FIX: changed from PUT to POST to match frontend notificationsAPI.toggleMute
    def post(self, request):
        user = request.user
        enabled = request.data.get('notifications_enabled')
        if enabled is None:
            return Response(
                {'error': 'notifications_enabled field is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        user.notifications_enabled = enabled
        user.save()
        return Response({
            'message': f"Notifications {'enabled' if enabled else 'muted'}",
            'notifications_enabled': user.notifications_enabled,
        })