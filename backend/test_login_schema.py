import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campustrace_backend.settings')
django.setup()

from users.models import User
from users.serializers import LoginSerializer

def test_login_serializer():
    email = '2311cs030131@mallareddyuniversity.ac.in'
    data = {'email': email, 'password': 'somepassword'}
    
    print(f"Testing LoginSerializer for: {email}")
    ser = LoginSerializer(data=data)
    try:
        is_valid = ser.is_valid()
        print(f"is_valid() called successfully. Result: {is_valid}")
        print(f"Errors: {ser.errors}")
        
        # Check if the user object in serializer has the college relation working
        if is_valid:
            user = ser.validated_data['user']
            print(f"User retrieved: {user.email}")
            if user.college:
                print(f"College retrieved: {user.college.name}")
            else:
                print("User has no college.")
        else:
            # Even if invalid credentials, it shouldn't 500
            print("Serializer is invalid (as expected if password wrong), but NO 500 error!")
                
    except Exception as e:
        import traceback
        print(f"CRASH detected during LoginSerializer.is_valid():")
        traceback.print_exc()

if __name__ == "__main__":
    test_login_serializer()
