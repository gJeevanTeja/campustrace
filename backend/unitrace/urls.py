from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from colleges.views import AdminAnalyticsView, ExportCSVView, ExportExcelView, ExportPDFView, CategoryViewSet, BlockViewSet

from unitrace.health import HealthCheckView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health', HealthCheckView.as_view(), name='health-check'),
    path('api/auth/', include('users.urls')),
    path('api/items/', include('items.urls')),
    path('api/analytics/', include('analytics.urls')),
    path('api/chat/', include('chat.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/administration/', include('administration.urls')),
    path('api/payments/', include('payments.urls')),
    path('api/categories/', CategoryViewSet.as_view({'get': 'list'}), name='global-categories'),
    path('api/blocks/', BlockViewSet.as_view({'get': 'list'}), name='global-blocks'),
    path('api/admin/export/csv/', ExportCSVView.as_view(), name='export-csv'),
    path('api/admin/export/excel/', ExportExcelView.as_view(), name='export-excel'),
    path('api/admin/export/pdf/', ExportPDFView.as_view(), name='export-pdf'),
    path('api/admin/', include('colleges.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)