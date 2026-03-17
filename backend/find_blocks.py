import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campustrace_backend.settings')
django.setup()

def find_block_tables():
    with connection.cursor() as cursor:
        cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE '%block%'")
        tables = [t[0] for t in cursor.fetchall()]
        print("Tables containing 'block':", tables)

if __name__ == "__main__":
    find_block_tables()
