import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "campustrace_backend.settings")
django.setup()

from rest_framework.test import APIClient
from users.models import User
from administration.models import AdminRequest

client = APIClient()
sa = User.objects.filter(role='super_admin').first()
client.force_authenticate(user=sa)

try:
    req = AdminRequest.objects.get(id=1)
    req.status = 'pending'
    req.save()
    print(f"Approving request {req.id} for email {req.email}")

    response = client.post(f'/api/administration/requests/{req.id}/approve/')
    print("Status Code:", response.status_code)
    print("Response Data:", response.data)
except Exception as e:
    import traceback
    traceback.print_exc()
