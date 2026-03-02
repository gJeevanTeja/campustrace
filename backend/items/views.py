import threading
from rest_framework import generics, permissions, status, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from .models import Item, ItemPhoto
from .serializers import ItemSerializer, ItemCreateSerializer, ItemPhotoSerializer, haversine_distance


class ItemListCreateView(generics.ListCreateAPIView):
    parser_classes   = [MultiPartParser, FormParser]
    filter_backends  = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['type', 'category', 'location', 'status']
    search_fields    = ['title', 'description', 'location', 'location_detail', 'location_name']
    ordering_fields  = ['created_at', 'title']
    ordering         = ['-created_at']

    def get_serializer_class(self):
        return ItemCreateSerializer if self.request.method == 'POST' else ItemSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Item.objects.select_related('user', 'claimed_by').prefetch_related('photos')
        
        # Enforce college isolation
        if user.is_authenticated and user.role != 'super_admin':
            if user.college:
                queryset = queryset.filter(college=user.college)
            else:
                return queryset.none()

        timeframe = self.request.query_params.get('timeframe')
        if timeframe:
            from django.utils import timezone
            from datetime import timedelta
            now = timezone.now()
            if timeframe == 'today':
                queryset = queryset.filter(created_at__gte=now - timedelta(days=1))
            elif timeframe == '3days':
                queryset = queryset.filter(created_at__gte=now - timedelta(days=3))
            elif timeframe == 'week':
                queryset = queryset.filter(created_at__gte=now - timedelta(days=7))

        user_lat = self.request.query_params.get('user_lat')
        user_lng = self.request.query_params.get('user_lng')
        max_km   = self.request.query_params.get('max_km')

        if user_lat and user_lng and max_km:
            try:
                ulat         = float(user_lat)
                ulng         = float(user_lng)
                max_distance = float(max_km)
                filtered_ids = []
                for item in queryset:
                    if item.latitude and item.longitude:
                        dist = haversine_distance(ulat, ulng, item.latitude, item.longitude)
                        if dist is not None and dist <= max_distance:
                            filtered_ids.append(item.id)
                queryset = queryset.filter(id__in=filtered_ids)
            except (ValueError, TypeError):
                pass

        return queryset

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Automatically set college from user
        item = serializer.save(user=request.user, college=request.user.college)
        response_data = ItemSerializer(item, context={'request': request}).data

        # ✅ Notifications run in background thread — HTTP 201 returns instantly
        threading.Thread(
            target=self._broadcast_new_item,
            args=(item, request.user),
            daemon=True,
        ).start()

        return Response(response_data, status=status.HTTP_201_CREATED)

    def _broadcast_new_item(self, item, posted_by):
        """
        Creates in-app DB notifications + WebSocket push.
        Runs in background thread — never blocks HTTP response.
        ✅ NO email sending here.
        """
        try:
            from notifications.models import Notification
            from django.utils import timezone

            location_label = (
                item.location_name
                if item.location_name
                else (item.get_location_display() if hasattr(item, 'get_location_display') else item.location)
            )
            time_str = ""
            if item.incident_datetime:
                # E.g., "(Lost on: 12 July 2026 at 02:30 PM)"
                dt = timezone.localtime(item.incident_datetime)
                formatted_dt = dt.strftime("%d %B %Y at %I:%M %p")
                time_prefix = "Lost on: " if item.type == 'lost' else "Found on: "
                time_str = f" ({time_prefix}{formatted_dt})"

            msg = f"New {item.type.upper()} item posted: {item.title} at {location_label}{time_str}"

            # Only notify users of the SAME college
            from users.models import User
            college_users = User.objects.filter(college=item.college)
            
            notifications = Notification.bulk_create_for_all_users(
                item=item,
                message=msg,
                notification_type='new_item',
                exclude_user=posted_by,
                user_queryset=college_users # Assuming this arg exists or handled in logic
            )

            # WebSocket push to each user
            try:
                from asgiref.sync import async_to_sync
                from channels.layers import get_channel_layer
                channel_layer = get_channel_layer()
                if channel_layer and notifications:
                    for notif in notifications:
                        try:
                            async_to_sync(channel_layer.group_send)(
                                f'notifications_{notif.user_id}',
                                {
                                    'type':              'send_notification',
                                    'id':                notif.id,
                                    'message':           notif.message,
                                    'notification_type': notif.notification_type,
                                    'item_id':           item.id,
                                    'item_type':         item.type,
                                    'time':              timezone.now().isoformat(),
                                }
                            )
                        except Exception:
                            pass
            except Exception as ws_err:
                print(f"[WS broadcast error] {ws_err}")

        except Exception as e:
            print(f"[Notification broadcast error] {e}")


class ItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset         = Item.objects.select_related('user', 'claimed_by').prefetch_related('photos')
    serializer_class = ItemSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def update(self, request, *args, **kwargs):
        item = self.get_object()
        if item.user != request.user and not request.user.is_staff:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        item = self.get_object()
        if item.user != request.user and not request.user.is_staff:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)


class ClaimItemView(APIView):
    def post(self, request, pk):
        try:
            item = Item.objects.get(pk=pk)
        except Item.DoesNotExist:
            return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)

        if item.type == 'found':
            return Response(
                {'error': 'Found items cannot be claimed. Contact the finder directly.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if item.status == 'claimed':
            return Response({'error': 'Already claimed'}, status=status.HTTP_400_BAD_REQUEST)
        if item.status == 'closed':
            return Response({'error': 'Item is closed'}, status=status.HTTP_400_BAD_REQUEST)
        if item.user == request.user:
            return Response({'error': 'Cannot claim your own item'}, status=status.HTTP_400_BAD_REQUEST)

        item.status     = 'claimed'
        item.claimed_by = request.user
        item.save()

        # ✅ In-app notification only — NO email sent on claim
        try:
            from notifications.models import Notification
            Notification.objects.create(
                user=item.user,
                item=item,
                message=f'🙋 {request.user.name} has claimed your {item.type} item: "{item.title}"',
                notification_type='item_claimed',
                play_sound=item.user.notification_sound,
            )
        except Exception as e:
            print(f"[Claim notification error] {e}")

        # ❌ REMOVED: send_mail() for item claim — no email sent here
        # Email is only sent for:
        #   1. OTP login        → users/views.py SendOTPView
        #   2. Password reset   → users/views.py ForgotPasswordView

        return Response(ItemSerializer(item, context={'request': request}).data)


class AddItemPhotosView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        try:
            item = Item.objects.get(pk=pk)
        except Item.DoesNotExist:
            return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)
        if item.user != request.user:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        photos = request.FILES.getlist('photos')
        if not photos:
            return Response({'error': 'No photos provided'}, status=status.HTTP_400_BAD_REQUEST)

        created = [ItemPhoto.objects.create(item=item, photo=p, is_primary=False) for p in photos]
        return Response(
            ItemPhotoSerializer(created, many=True, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )

    def delete(self, request, pk):
        photo_id = request.data.get('photo_id')
        try:
            photo = ItemPhoto.objects.get(pk=photo_id, item__user=request.user)
            photo.delete()
            return Response({'message': 'Photo deleted'})
        except ItemPhoto.DoesNotExist:
            return Response({'error': 'Photo not found'}, status=status.HTTP_404_NOT_FOUND)


class MyItemsView(generics.ListAPIView):
    serializer_class = ItemSerializer

    def get_queryset(self):
        return Item.objects.filter(
            user=self.request.user
        ).select_related('user', 'claimed_by').prefetch_related('photos')

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class RecentItemsView(generics.ListAPIView):
    serializer_class = ItemSerializer
    pagination_class = None

    def get_queryset(self):
        user = self.request.user
        qs = Item.objects.filter(status='active').select_related('user').prefetch_related('photos')
        if user.is_authenticated and user.role != 'super_admin' and user.college:
            qs = qs.filter(college=user.college)
        return qs.order_by('-created_at')[:8]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class NearbyItemsView(APIView):
    def get(self, request):
        try:
            lat = float(request.query_params.get('lat', ''))
            lng = float(request.query_params.get('lng', ''))
            km  = float(request.query_params.get('km', 2))
        except (ValueError, TypeError):
            return Response({'error': 'lat and lng are required'}, status=status.HTTP_400_BAD_REQUEST)

        all_items = Item.objects.filter(status='active').select_related('user').prefetch_related('photos')

        nearby = []
        for item in all_items:
            if item.latitude and item.longitude:
                dist = haversine_distance(lat, lng, item.latitude, item.longitude)
                if dist is not None and dist <= km:
                    nearby.append((dist, item))

        nearby.sort(key=lambda x: x[0])

        result = []
        for dist, item in nearby:
            data = ItemSerializer(item, context={'request': request}).data
            data['distance_km']    = round(dist, 2)
            data['walk_time_min']  = round((dist / 5.0) * 60)
            data['drive_time_min'] = round((dist / 30.0) * 60)
            result.append(data)

        return Response(result)