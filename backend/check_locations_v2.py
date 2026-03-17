import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campustrace_backend.settings')
django.setup()

def check_campus_locations():
    with connection.cursor() as cursor:
        cursor.execute("SELECT id, name, latitude, longitude FROM colleges_campuslocation")
        rows = cursor.fetchall()
        with open('locations_utf8.txt', 'w', encoding='utf-8') as f:
            f.write("Campus locations in DB:\n")
            for row in rows:
                f.write(f"ID: {row[0]}, Name: {row[1]}, Lat: {row[2]}, Lng: {row[3]}\n")
    print("Done. Wrote to locations_utf8.txt")

if __name__ == "__main__":
    check_campus_locations()
