import os
import django
import sys
import traceback

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campustrace_backend.settings')
django.setup()

from django.contrib.auth import authenticate
from users.serializers import UserSerializer
from rest_framework.request import Request
from django.test import RequestFactory

email = "2311cs030131@mallareddyuniversity.ac.in"
password = "Shivani@131"

print(f"--- Attempting authentication for {email} ---")
try:
    user = authenticate(username=email, password=password)
    if user:
        print("Authentication SUCCESS!")
        
        # Now try to serialize
        print("--- Attempting serialization ---")
        factory = RequestFactory()
        request = factory.get('/')
        # Wrap in DRF request
        from rest_framework.request import Request
        drf_request = Request(request)
        
        serializer = UserSerializer(user, context={'request': drf_request})
        data = serializer.data
        print("Serialization SUCCESS!")
        print(f"User Data: {data}")
    else:
        print("Authentication FAILED (Invalid credentials)")
except Exception:
    print("!!! ERROR caught during process !!!")
    traceback.print_exc()
