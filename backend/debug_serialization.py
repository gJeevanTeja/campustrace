import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campustrace_backend.settings')
django.setup()

from users.models import User
from items.models import Item
from users.serializers import UserSerializer
from items.serializers import ItemSerializer
from rest_framework.request import Request
from django.test import RequestFactory

def test_serialization():
    print("Testing UserSerializer...")
    u = User.objects.filter(college__isnull=False).first()
    if not u:
        u = User.objects.first()
    
    if not u:
        print("No users found in database.")
        return

    print(f"User: {u.id} - {u.name} (College: {u.college})")
    
    rf = RequestFactory()
    url = "/api/auth/profile/"
    req = rf.get(url)
    req.user = u
    drf_request = Request(req)
    
    try:
        ser = UserSerializer(u, context={'request': drf_request})
        data = ser.data
        print("UserSerializer Success!")
        print(f"Fields: {list(data.keys())}")
        if 'college_data' in data:
            print(f"college_data: {data['college_data']}")
    except Exception as e:
        import traceback
        print(f"UserSerializer FAILED: {e}")
        traceback.print_exc()

    print("\nTesting ItemSerializer...")
    item = Item.objects.first()
    if item:
        print(f"Item: {item.id} - {item.title}")
        try:
            ser = ItemSerializer(item, context={'request': drf_request})
            data = ser.data
            print("ItemSerializer Success!")
        except Exception as e:
            import traceback
            print(f"ItemSerializer FAILED: {e}")
            traceback.print_exc()
    else:
        print("No items found.")

if __name__ == "__main__":
    test_serialization()
