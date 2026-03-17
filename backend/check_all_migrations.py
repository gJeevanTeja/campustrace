import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campustrace_backend.settings')
django.setup()

def check_migrations():
    with connection.cursor() as cursor:
        cursor.execute("SELECT app, name FROM django_migrations ORDER BY id")
        rows = cursor.fetchall()
        with open('all_migrations.txt', 'w', encoding='utf-8') as f:
            for row in rows:
                f.write(f"{row[0]}: {row[1]}\n")
        print("Done. Wrote to all_migrations.txt")

if __name__ == "__main__":
    check_migrations()
