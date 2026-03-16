from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Count, Q, Avg, F
from django.db.models.functions import ExtractHour
from django.utils import timezone
from datetime import timedelta

from .models import College, Block, Category, CampusLocation
from .serializers import CollegeSerializer, BlockSerializer, CategorySerializer, CampusLocationSerializer
from users.permissions import IsSuperAdmin, IsCollegeAdmin, IsAdminOrModerator
from items.models import Item

def create_default_college_data(college):
    # Categories
    default_categories = ["ID Card", "Bags", "Helmet", "Keys", "Mobile Phones", "Other"]
    for name in default_categories:
        Category.objects.get_or_create(name=name, college=college)
        
    # Locations / Blocks
    default_locations = ["Canteen", "Parking", "Gym Area", "Ground", "Main Gate", "Library", "Auditorium", "Other"]
    for name in default_locations:
        Block.objects.get_or_create(name=name, college=college)
        CampusLocation.objects.get_or_create(name=name, college=college)

class CollegeViewSet(viewsets.ModelViewSet):
    queryset = College.objects.all()
    serializer_class = CollegeSerializer
    
    def get_permissions(self):
        if self.action == 'list':
            return [permissions.AllowAny()]
        return [IsSuperAdmin()]

    def perform_create(self, serializer):
        college = serializer.save()
        create_default_college_data(college)

class BlockViewSet(viewsets.ModelViewSet):
    queryset = Block.objects.all()
    serializer_class = BlockSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsCollegeAdmin()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return Block.objects.all()
        return Block.objects.filter(college=user.college, is_active=True)

    def perform_create(self, serializer):
        serializer.save(college=self.request.user.college)

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsCollegeAdmin()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return Category.objects.all()
        return Category.objects.filter(college=user.college, is_active=True)

    def perform_create(self, serializer):
        serializer.save(college=self.request.user.college)

from rest_framework import generics

class CampusLocationListView(generics.ListAPIView):
    serializer_class = CampusLocationSerializer

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'college', None):
            return CampusLocation.objects.filter(college=user.college)
        return CampusLocation.objects.none()

class AdminAnalyticsView(APIView):
    permission_classes = [IsAdminOrModerator]

    def get(self, request):
        user = request.user
        college = user.college
        
        # Base filter
        item_filter = Q()
        if user.role != 'super_admin':
            if not college:
                return Response({'error': 'User not linked to any college'}, status=status.HTTP_400_BAD_REQUEST)
            item_filter &= Q(college=college)
            
        items = Item.objects.filter(item_filter)
        total_items = items.count()
        total_lost = items.filter(type='lost').count()
        total_found = items.filter(type='found').count()
        
        # Resolution Rate
        claimed_count = items.filter(status='claimed').count()
        res_rate = (claimed_count / total_items * 100) if total_items > 0 else 0
        
        # Most Lost Category
        most_lost = items.filter(type='lost').values('category_new__name').annotate(count=Count('id')).order_by('-count').first()
        most_lost_name = most_lost['category_new__name'] if most_lost and most_lost['category_new__name'] else "N/A"
        
        # Peak Hour
        peak_hour_data = items.annotate(hour=ExtractHour('created_at')).values('hour').annotate(count=Count('id')).order_by('-count').first()
        peak_hour = "N/A"
        if peak_hour_data:
            h = peak_hour_data['hour']
            suffix = "AM" if h < 12 else "PM"
            h_display = h if h <= 12 else h - 12
            if h == 0: h_display = 12
            peak_hour = f"{h_display} {suffix} - {h_display+1} {suffix}"

        # Active Users (last 24h)
        from users.models import User
        active_users = User.objects.filter(last_active__gte=timezone.now() - timedelta(days=1))
        if user.role != 'super_admin':
            active_users = active_users.filter(college=college)
        active_count = active_users.count()
        
        # Avg Return Time
        claimed_items = items.filter(status='claimed').annotate(
            duration=F('updated_at') - F('created_at')
        ).aggregate(avg_time=Avg('duration'))
        
        avg_hours = 0
        if claimed_items['avg_time']:
            avg_hours = claimed_items['avg_time'].total_seconds() / 3600

        return Response({
            'total_lost': total_lost,
            'total_found': total_found,
            'resolution_rate': round(res_rate, 1),
            'most_lost_category': most_lost_name,
            'peak_hour': peak_hour,
            'active_users': active_count,
            'avg_return_time_hours': round(avg_hours, 1)
        })
