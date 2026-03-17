import os
import django
import sys
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campustrace_backend.settings')
django.setup()

with connection.cursor() as cursor:
    cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'items' ORDER BY column_name")
    columns = [row[0] for row in cursor.fetchall()]
    print("--- Current 'items' Columns ---")
    for col in columns:
        print(col)

from items.models import Item
model_fields = sorted([f.name for f in Item._meta.get_fields() if not f.is_relation or f.one_to_one or (f.many_to_one and f.related_model)])
print("\n--- Model Fields ---")
for f in model_fields:
    print(f)
