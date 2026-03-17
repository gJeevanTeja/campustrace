import os
import django
from django.urls import resolve, reverse

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campustrace_backend.settings')
django.setup()

try:
    url = '/api/items/generate-questions/'
    match = resolve(url)
    print(f"URL: {url}")
    print(f"View: {match.view_name}")
    print(f"View Class: {match.func.view_class}")
except Exception as e:
    print(f"Resolution failed: {e}")

try:
    rev = reverse('generate-electronic-questions')
    print(f"Reverse: {rev}")
except Exception as e:
    print(f"Reverse failed: {e}")
