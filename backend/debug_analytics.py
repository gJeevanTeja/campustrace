import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campustrace_backend.settings')
django.setup()

from users.models import User
from colleges.views import AdminAnalyticsView
from rest_framework.test import APIRequestFactory, force_authenticate

def debug_analytics():
    factory = APIRequestFactory()
    # Find a super admin or admin
    user = User.objects.filter(role='super_admin').first() or User.objects.filter(is_staff=True).first()
    
    if not user:
        print("No admin user found to test with.")
        return

    print(f"Testing analytics for user: {user.email} (Role: {user.role})")
    request = factory.get('/api/admin/dashboard/')
    force_authenticate(request, user=user)
    
    view = AdminAnalyticsView.as_view()
    try:
        response = view(request)
        print(f"Response Status: {response.status_code}")
        print(f"Response Data: {response.data}")
    except Exception as e:
        import traceback
        print("CRASH during analytics retrieval:")
        traceback.print_exc()

if __name__ == "__main__":
    debug_analytics()
