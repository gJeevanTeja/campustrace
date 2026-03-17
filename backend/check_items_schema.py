import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campustrace_backend.settings')
django.setup()

def check_items_schema():
    with connection.cursor() as cursor:
        cursor.execute("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'items'")
        rows = cursor.fetchall()
        print("\n--- Schema for items ---")
        for row in rows:
            print(row)

if __name__ == "__main__":
    check_items_schema()
