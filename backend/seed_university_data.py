import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campustrace_backend.settings')
django.setup()

from colleges.models import College, Category, Block, CampusLocation

def seed():
    college = College.objects.filter(id=1).first()
    if not college:
        print("College ID 1 not found. Creating default...")
        college = College.objects.create(id=1, name="Malla Reddy University", email_domain="mallareddyuniversity.ac.in")
    else:
        # Correct the name if it was typoed
        if "Mall Trace" in college.name:
            college.name = "Malla Reddy University"
            college.save()

    print(f"Seeding for {college.name}")

    # 1. Categories
    categories_data = [
        {'id': 1, 'name': 'Mobile Phones', 'emoji': '📱'},
        {'id': 2, 'name': 'Earbuds', 'emoji': '🎧'},
        {'id': 3, 'name': 'Laptops', 'emoji': '💻'},
        {'id': 4, 'name': 'ID Card', 'emoji': '🆔'},
        {'id': 5, 'name': 'Bags', 'emoji': '🎒'},
        {'id': 6, 'name': 'Keys', 'emoji': '🔑'},
        {'id': 7, 'name': 'Other', 'emoji': '📦'}
    ]
    for cat in categories_data:
        Category.objects.get_or_create(id=cat['id'], defaults={'college': college, 'name': cat['name'], 'emoji': cat['emoji']})

    # 2. CampusLocations (used as 'block' in Item)
    locations_data = [
        {'id': 1, 'name': 'Main Block'},
        {'id': 2, 'name': 'Canteen'},
        {'id': 3, 'name': 'Library'},
        {'id': 4, 'name': 'Parking Area'},
        {'id': 5, 'name': 'Ground'},
        {'id': 6, 'name': 'Auditorium'}
    ]
    for loc in locations_data:
        CampusLocation.objects.get_or_create(id=loc['id'], defaults={'college': college, 'name': loc['name']})

    # 3. Blocks (for good measure, though frontend seems to prefer CampusLocation or mixing them)
    for loc in locations_data:
        Block.objects.get_or_create(id=loc['id'], defaults={'college': college, 'name': loc['name']})

    print("Seeding finished successfully.")

if __name__ == "__main__":
    seed()
