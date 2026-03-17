import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campustrace_backend.settings')
django.setup()

from items.models import Item
from users.models import User
from colleges.models import Category, CampusLocation

def verify_creation():
    user = User.objects.first()
    category = Category.objects.first()
    block = CampusLocation.objects.first()
    
    if not all([user, category, block]):
        print("Required seed data missing. Run seed script first.")
        return

    try:
        item = Item.objects.create(
            title="Verification Test",
            description="Testing Integrity Fix",
            category="other",
            category_new=category,
            block=block,
            type="lost",
            user=user,
            use_current_location=False
        )
        print(f"Item created successfully with ID: {item.id}")
        print(f"Reference Number: {item.reference_number}")
    except Exception as e:
        import traceback
        print(f"FAILED to create item: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    verify_creation()
