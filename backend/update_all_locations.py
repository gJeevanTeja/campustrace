import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campustrace_backend.settings')
django.setup()

def update_locations():
    # Base MRU coords
    base_lat = 17.5615
    base_lng = 78.4484
    
    updates = [
        ("Canteen", 17.5616, 78.4485),
        ("Library", 17.5614, 78.4483),
        ("Parking Area", 17.5617, 78.4486),
        ("Ground", 17.5613, 78.4482),
        ("Auditorium", 17.5618, 78.4487),
        ("Main Block", 17.5615, 78.4484),
    ]
    
    with connection.cursor() as cursor:
        for name, lat, lng in updates:
            print(f"Updating {name}...")
            cursor.execute(
                "UPDATE colleges_campuslocation SET latitude = %s, longitude = %s WHERE name ILIKE %s",
                [lat, lng, f"%{name}%"]
            )
            print(f"Rows affected: {cursor.rowcount}")

if __name__ == "__main__":
    update_locations()
