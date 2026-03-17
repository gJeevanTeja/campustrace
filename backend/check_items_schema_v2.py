import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campustrace_backend.settings')
django.setup()

def check_items_schema():
    with connection.cursor() as cursor:
        cursor.execute("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'items'")
        rows = cursor.fetchall()
        with open('items_schema_utf8.txt', 'w', encoding='utf-8') as f:
            f.write("--- Schema for items ---\n")
            for row in rows:
                f.write(f"{row}\n")
    print("Done. Wrote to items_schema_utf8.txt")

if __name__ == "__main__":
    check_items_schema()
