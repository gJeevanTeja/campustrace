import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campustrace_backend.settings')
django.setup()

def check_tables():
    with connection.cursor() as cursor:
        cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
        tables = [t[0] for t in cursor.fetchall()]
        
        checks = [
            'users', 'colleges', 'blocks', 'categories', 'items',
            'users_user', 'colleges_college', 'colleges_block', 'colleges_category', 'items_item'
        ]
        
        print("--- Table Check Results ---")
        for name in checks:
            exists = name in tables
            print(f"Table '{name}': {'EXISTS' if exists else 'not found'}")

if __name__ == "__main__":
    check_tables()
