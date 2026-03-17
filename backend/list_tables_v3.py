import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campustrace_backend.settings')
django.setup()

def list_tables():
    with connection.cursor() as cursor:
        if connection.vendor == 'postgresql':
            cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
        else:
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        
        tables = [t[0] for t in cursor.fetchall()]
        tables.sort()
        print(f"Total Tables: {len(tables)}")
        
        expected = ['colleges', 'blocks', 'categories', 'items', 'users']
        for exp in expected:
            status = "FOUND" if exp in tables else "MISSING"
            print(f"Expected Table '{exp}': {status}")
            if status == "MISSING":
                similar = [t for t in tables if exp in t]
                if similar:
                    print(f"  --> Similar: {similar}")

        print("Full list (comma separated):")
        print(", ".join(tables))

if __name__ == "__main__":
    list_tables()
