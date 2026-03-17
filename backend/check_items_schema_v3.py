import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campustrace_backend.settings')
django.setup()

def check_schema():
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'items'
            ORDER BY ordinal_position;
        """)
        rows = cursor.fetchall()
        with open('items_schema_full.txt', 'w') as f:
            f.write(f"{'Column':<25} {'Type':<20} {'Nullable':<10} {'Default'}\n")
            f.write("-" * 70 + "\n")
            for row in rows:
                f.write(f"{row[0]:<25} {row[1]:<20} {row[2]:<10} {row[3]}\n")

if __name__ == "__main__":
    check_schema()
    print("Full schema written to items_schema_full.txt")
