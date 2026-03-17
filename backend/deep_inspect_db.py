import os
import django
import sys
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campustrace_backend.settings')
django.setup()

from django.apps import apps

def check_model(model_name):
    model = apps.get_model(model_name)
    table_name = model._meta.db_table
    
    with connection.cursor() as cursor:
        cursor.execute(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{table_name}'")
        columns = {row[0] for row in cursor.fetchall()}
    
    fields = [f.name for f in model._meta.get_fields() if not f.is_relation or f.one_to_one or (f.many_to_one and f.related_model)]
    
    missing = []
    for f in fields:
        col = f if f != 'college' else 'college_id' # simplified check for foreign keys
        if col not in columns:
            # Handle standard foreign key naming iconvention (field_id)
            if f + "_id" not in columns:
                missing.append(f)
                
    if missing:
        print(f"Model {model_name} (Table: {table_name}) is MISSING columns: {missing}")
    else:
        print(f"Model {model_name} is in sync.")

check_model('users.User')
check_model('items.Item')
check_model('colleges.College')
check_model('notifications.Notification')
