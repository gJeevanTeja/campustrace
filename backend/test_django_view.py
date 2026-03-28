import os
import sys
import django
from django.conf import settings

sys.path.append(r'c:\Users\JEEVAN TEJA\Desktop\campustrace-main\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campustrace_backend.settings')
django.setup()

from rest_framework.test import APIRequestFactory
from users.views import RegisterView

factory = APIRequestFactory()
data = {
    "name": "Gunatit",
    "username": "gunatit178_debug",
    "email": "gunatit_debug@mru.edu.in",
    "phone": "+911234567890",
    "department": "Data Science",
    "section": "",
    "college_year": "3rd Year",
    "college_name": "",
    "password": "Password@123",
    "confirm_password": "Password@123",
    "terms_accepted": True,
    "roll_number": "1234",
    "gender": "Male",
    "student_id": "1234"
}

request = factory.post('/api/auth/register/', data, format='json')
view = RegisterView.as_view()

try:
    response = view(request)
    print("Response Status:", response.status_code)
    print("Response Data:", response.data)
except Exception as e:
    import traceback
    traceback.print_exc()
