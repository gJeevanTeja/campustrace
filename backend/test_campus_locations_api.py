import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campustrace_backend.settings')
django.setup()

from django.test import RequestFactory
from django.contrib.auth import get_user_model
from rest_framework.test import force_authenticate
from colleges.views import CampusLocationListView

User = get_user_model()
user = User.objects.first()

request = RequestFactory().get('/api/admin/campus-locations/')
force_authenticate(request, user=user)

view = CampusLocationListView.as_view()
try:
    response = view(request)
    if hasattr(response, 'render'):
        response.render()
    print("RESPONSE:", getattr(response, 'content', response.data).decode('utf-8') if hasattr(response, 'content') else response.data)
except Exception as e:
    import traceback
    traceback.print_exc()
