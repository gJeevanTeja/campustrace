import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campustrace_backend.settings')
django.setup()

from django.db import connection
from users.models import User

# Enable query logging
import logging
l = logging.getLogger('django.db.backends')
l.setLevel(logging.DEBUG)
l.addHandler(logging.StreamHandler())

try:
    u = User(email='test_sql3@mru.edu.in', name='test', student_id='S100')
    u.save()
except Exception as e:
    print("Caught:", e)

for q in connection.queries:
    print(q['sql'])
