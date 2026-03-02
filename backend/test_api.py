import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "campustrace_backend.settings")
django.setup()

from django.test import Client
from users.models import User
from administration.models import AdminRequest

client = Client()

# get super admin
sa = User.objects.filter(role='super_admin').first()
client.force_login(sa)

req = AdminRequest.objects.get(id=1)
# Reset status to pending for test
req.status = 'pending'
req.save()

# Submit API request
response = client.post(f'/api/administration/requests/{req.id}/approve/')
print("Status Code:", response.status_code)
print("Response Data:", response.json() if response.status_code in [200, 400, 403, 500] else response.content)
