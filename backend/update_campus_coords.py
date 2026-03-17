import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campustrace_backend.settings')
django.setup()

from colleges.models import CampusLocation, College

def update_coords():
    # University Center coordinates (Malla Reddy University)
    mru = College.objects.filter(name__icontains="Malla Reddy").first()
    if not mru:
        print("College not found")
        return

    # Approximate coordinates for blocks
    # Center: 17.5615, 78.4484
    blocks = {
        "Main Block": (17.5615, 78.4484),
        "Science Block": (17.5620, 78.4490),
        "Library": (17.5610, 78.4480),
        "Canteen": (17.5612, 78.4475),
        "Hostel A": (17.5605, 78.4470),
        "Sports Complex": (17.5625, 78.4500)
    }

    for name, coords in blocks.items():
        loc, created = CampusLocation.objects.get_or_create(
            name=name,
            college=mru,
            defaults={'latitude': coords[0], 'longitude': coords[1]}
        )
        if not created:
            loc.latitude = coords[0]
            loc.longitude = coords[1]
            loc.save()
            print(f"Updated {name}")
        else:
            print(f"Created {name}")

if __name__ == "__main__":
    update_coords()
