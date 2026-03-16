import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campustrace_backend.settings')
django.setup()

from items.serializers import ItemCreateSerializer
from users.models import User
from items.models import Item
from colleges.models import College, Category, Block
from rest_framework.test import APIRequestFactory
from django.utils import timezone

try:
    user = User.objects.filter(role='college_admin').first() or User.objects.first()
    college = user.college if user else College.objects.first()
    category = Category.objects.filter(college=college).first()
    block = Block.objects.filter(college=college).first()

    data = {
        "title": "Test Item",
        "description": "Lost my test key",
        "category": "other",
        "category_new": category.id if category else "",
        "type": "lost",
        "block": block.id if block else "",
        "location": "other",
        "location_detail": "Desk 5",
        "incident_datetime": timezone.now().isoformat()
    }

    print("Data:", data)

    factory = APIRequestFactory()
    request = factory.post('/api/items/')
    request.user = user

    serializer = ItemCreateSerializer(data=data, context={'request': request})
    
    if serializer.is_valid():
        print("Valid! Saving...")
        try:
            item = serializer.save(user=user, college=college)
            print("Successfully saved item ID:", item.id)
            # Rollback by deleting
            item.delete()
        except Exception as e:
            import traceback
            traceback.print_exc()
    else:
        print("Serializer errors:", serializer.errors)
        
except Exception as e:
    import traceback
    traceback.print_exc()
