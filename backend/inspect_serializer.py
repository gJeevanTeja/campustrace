import os
import django
import sys

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campustrace_backend.settings')
django.setup()

import notifications.serializers
print(f"DEBUG: notifications.serializers file: {notifications.serializers.__file__}")

from notifications.serializers import NotificationSerializer

print("--- Serializer Inspection ---")
serializer = NotificationSerializer()
print(f"Declared fields: {list(serializer.fields.keys())}")
print(f"Meta fields: {serializer.Meta.fields}")
print(f"sys.path: {sys.path}")
