import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campustrace_backend.settings')
django.setup()

from colleges.models import College, Category, CampusLocation, Block

def seed():
    print("Starting seeding process...")
    
    # 1. Create College
    college, created = College.objects.get_or_create(
        email_domain="mallareddyuniversity.ac.in",
        defaults={"name": "Malla Reddy University", "is_active": True}
    )
    if created:
        print(f"Created college: {college.name}")
    else:
        print(f"College already exists: {college.name}")

    # 2. Seed Categories (Filtered to user request)
    target_categories = ["ID Card", "Keys", "Helmet", "Wallet", "Mobile Phones", "Other"]
    
    # Remove categories not in the list
    deleted_count, _ = Category.objects.filter(college=college).exclude(name__in=target_categories).delete()
    if deleted_count > 0:
        print(f"Removed {deleted_count} old categories.")

    for name in target_categories:
        # Determine emoji and priority
        emoji = "📦"
        priority = 0
        if name == "Mobile Phones": emoji, priority = "📱", 10
        elif name == "ID Card": emoji, priority = "🪪", 9
        elif name == "Keys": emoji, priority = "🔑", 8
        elif name == "Wallet": emoji, priority = "👛", 7
        elif name == "Helmet": emoji, priority = "🪖", 6

        cat, created = Category.objects.get_or_create(
            college=college,
            name=name,
            defaults={"emoji": emoji, "priority": priority, "active": True}
        )
        if created:
            print(f"  Created category: {name}")

    # 3. Seed Campus Locations (and Blocks)
    locations = [
        ("Library", 17.5585, 78.4310),
        ("Hostel", 17.5590, 78.4315),
        ("Canteen", 17.5575, 78.4305),
        ("Classroom Block", 17.5580, 78.4320),
        ("Parking Area", 17.5570, 78.4300),
        ("Student Union", 17.5588, 78.4312),
        ("Gym", 17.5595, 78.4325),
        ("Science Block", 17.5578, 78.4318),
        ("Main Gate", 17.5565, 78.4295),
    ]

    for name, lat, lon in locations:
        # Seed CampusLocation
        loc, created = CampusLocation.objects.get_or_create(
            college=college,
            name=name,
            defaults={"latitude": lat, "longitude": lon}
        )
        if created:
            print(f"  Created location: {name}")
            
        # Seed Block (since models have both)
        blk, created = Block.objects.get_or_create(
            college=college,
            name=name,
            defaults={"latitude": lat, "longitude": lon, "is_active": True}
        )
        if created:
            print(f"  Created block: {name}")

    print("Seeding complete!")

if __name__ == "__main__":
    seed()
