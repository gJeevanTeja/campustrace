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
            WHERE table_name = 'claim_sessions'
            ORDER BY ordinal_position;
        """)
        rows = cursor.fetchall()
        print(f"{'Column':<25} {'Type':<20} {'Nullable':<10} {'Default'}")
        print("-" * 70)
        for row in rows:
            print(f"{row[0]:<25} {row[1]:<20} {row[2]:<10} {row[3]}")

if __name__ == "__main__":
    check_schema()
