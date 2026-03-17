import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campustrace_backend.settings')
django.setup()

def list_tables():
    with connection.cursor() as cursor:
        cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
        tables = [row[0] for row in cursor.fetchall()]
        with open('tables_utf8.txt', 'w', encoding='utf-8') as f:
            f.write("Tables in database:\n")
            for t in sorted(tables):
                f.write(f"{t}\n")
        print("Done. Wrote to tables_utf8.txt")

if __name__ == "__main__":
    list_tables()
