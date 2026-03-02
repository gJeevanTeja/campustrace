from django.urls import path
from .views import CollegeAnalyticsView, GlobalAnalyticsView, ExportAnalyticsView

urlpatterns = [
    path('college/', CollegeAnalyticsView.as_view(), name='college-analytics'),
    path('global/', GlobalAnalyticsView.as_view(), name='global-analytics'),
    path('export/', ExportAnalyticsView.as_view(), name='export-analytics'),
]
