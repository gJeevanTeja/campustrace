import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campustrace_backend.settings')
django.setup()

from items.models import Item
from items.serializers import ItemSerializer
from rest_framework.request import Request
from django.test import RequestFactory

def debug():
    print("Testing items API serialization...")
    items = Item.objects.filter(status='returned')[:5]
    print(f"Found {items.count()} returned items.")
    
    rf = RequestFactory()
    request = rf.get('/api/items/?status=returned')
    # Mock authentication
    from users.models import User
    user = User.objects.filter(role='college_admin').first()
    if not user:
        user = User.objects.first()
    request.user = user
    
    # Wrap in DRF Request
    drf_request = Request(request)
    
    for item in items:
        print(f"Serializing item ID: {item.id} - {item.title}")
        try:
            ser = ItemSerializer(item, context={'request': drf_request})
            data = ser.data
            print(f"  Success! Title: {data.get('title')}")
        except Exception as e:
            import traceback
            print(f"  FAILED: {str(e)}")
            traceback.print_exc()

if __name__ == "__main__":
    debug()
