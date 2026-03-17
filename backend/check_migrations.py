import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campustrace_backend.settings')
django.setup()

def check_migrations():
    with connection.cursor() as cursor:
        cursor.execute("SELECT name FROM django_migrations WHERE app = 'users' ORDER BY id")
        rows = cursor.fetchall()
        print("Applied migrations for 'users':")
        for row in rows:
            print(row[0])

if __name__ == "__main__":
    check_migrations()
