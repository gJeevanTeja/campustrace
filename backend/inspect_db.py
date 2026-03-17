import os
import django
import sys
from django.db import connection

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campustrace_backend.settings')
django.setup()

with connection.cursor() as cursor:
    cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'")
    columns = [row[0] for row in cursor.fetchall()]
    print(f"Columns in 'users' table: {columns}")

from users.models import User
model_fields = [f.name for f in User._meta.get_fields() if not f.is_relation or f.one_to_one or (f.many_to_one and f.related_model)]
print(f"Fields in User model: {model_fields}")

missing = set(model_fields) - set(columns) - {'password', 'last_login', 'is_superuser'} # exclude some auth internals
print(f"Likely missing columns: {missing}")
