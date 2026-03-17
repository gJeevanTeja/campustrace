import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campustrace_backend.settings')
django.setup()

from django.test import RequestFactory
from django.contrib.auth import get_user_model
from rest_framework.test import force_authenticate
from items.views import ItemListCreateView
from colleges.models import College

User = get_user_model()
user = User.objects.first()

if not user.college:
    college = College.objects.first()
    if not college:
        college = College.objects.create(name='Test College', code='TC123')
    user.college = college
    user.save()

request = RequestFactory().post('/api/items/', {
    'title': 'Id card',
    'description': 'i have lost my id card',
    'category': 'id_card',
    'type': 'lost',
    'location': 'other',
    'use_current_location': False,
}, format='multipart')

force_authenticate(request, user=user)

view = ItemListCreateView.as_view()
try:
    response = view(request)
    if hasattr(response, 'render'):
        response.render()
    print("STATUS:", response.status_code)
    print("RESPONSE:", getattr(response, 'content', response.data))
except Exception as e:
    import traceback
    traceback.print_exc()
