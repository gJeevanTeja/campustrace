from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CollegeViewSet, BlockViewSet, CategoryViewSet, AdminAnalyticsView

router = DefaultRouter()
router.register(r'manage', CollegeViewSet, basename='college-manage')
router.register(r'blocks', BlockViewSet, basename='block-manage')
router.register(r'categories', CategoryViewSet, basename='category-manage')

urlpatterns = [
    path('', include(router.urls)),
    path('analytics/', AdminAnalyticsView.as_view(), name='admin-analytics'),
]
