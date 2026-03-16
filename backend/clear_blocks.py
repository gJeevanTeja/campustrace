import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campustrace_backend.settings')
django.setup()

from django.db import connection

with connection.cursor() as cursor:
    cursor.execute("UPDATE items SET block_id = NULL;")
print("Cleared block_id from all items.")
