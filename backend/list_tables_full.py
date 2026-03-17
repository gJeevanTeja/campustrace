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
        print("TOTAL TABLES:", len(tables))
        for t in sorted(tables):
            print(f"TABLE: {t}")

if __name__ == "__main__":
    list_tables()
