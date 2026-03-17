from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CollegeViewSet, BlockViewSet, CategoryViewSet, 
    AdminAnalyticsView, CampusLocationListView,
    ExportCSVView, ExportExcelView, ExportPDFView, ItemReportListView
)

router = DefaultRouter()
router.register(r'manage', CollegeViewSet, basename='college-manage')
router.register(r'blocks', BlockViewSet, basename='block-manage')
router.register(r'categories', CategoryViewSet, basename='category-manage')

urlpatterns = [
    path('campus-locations/', CampusLocationListView.as_view(), name='campus-locations'),
    path('dashboard/', AdminAnalyticsView.as_view(), name='admin-dashboard'),
    path('analytics/', AdminAnalyticsView.as_view(), name='admin-analytics'),
    path('export/csv/', ExportCSVView.as_view(), name='export-csv'),
    path('export/excel/', ExportExcelView.as_view(), name='export-excel'),
    path('export/pdf/', ExportPDFView.as_view(), name='export-pdf'),
    path('item-reports/', ItemReportListView.as_view(), name='item-reports'),
    path('', include(router.urls)),
]
