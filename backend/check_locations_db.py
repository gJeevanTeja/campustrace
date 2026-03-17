import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campustrace_backend.settings')
django.setup()

def check_campus_locations():
    with connection.cursor() as cursor:
        cursor.execute("SELECT id, name, latitude, longitude FROM colleges_campuslocation")
        rows = cursor.fetchall()
        print("Campus locations in DB:")
        for row in rows:
            print(f"ID: {row[0]}, Name: {row[1]}, Lat: {row[2]}, Lng: {row[3]}")

if __name__ == "__main__":
    check_campus_locations()
