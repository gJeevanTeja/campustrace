import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campustrace_backend.settings')
django.setup()

from colleges.models import CampusLocation, College

colleges = College.objects.all()

default_locations = [
    "Canteen",
    "Parking",
    "Gym Area",
    "Ground",
    "Main Gate",
    "Library",
    "Auditorium",
    "Other"
]

for college in colleges:
    for name in default_locations:
        CampusLocation.objects.get_or_create(name=name, college=college)
        print(f"Ensured {name} exists for {college.name}")
