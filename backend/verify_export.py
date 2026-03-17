import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campustrace_backend.settings')
django.setup()

from colleges.views import BaseExportView
from users.models import User
from rest_framework.test import APIRequestFactory

def verify_export_data():
    factory = APIRequestFactory()
    user = User.objects.filter(role='super_admin').first()
    if not user:
        print("No super admin found")
        return

    request = factory.get('/api/admin/export/csv/')
    request.user = user
    
    view = BaseExportView()
    try:
        data = view.get_report_data(request)
        print(f"Data retrieved successfully! Row count: {len(data)}")
        if data:
            print(f"Sample row: {data[0]}")
    except Exception as e:
        import traceback
        print(f"Error retrieving report data: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    verify_export_data()
