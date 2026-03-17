import sys
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campustrace_backend.settings')
import django
django.setup()

from items.models import Item, ClaimSession
from users.models import User
from items.views import VerifyClaimView, SubmitAIAnswerView
from rest_framework.test import APIRequestFactory, force_authenticate

factory = APIRequestFactory()
item = Item.objects.get(id=78)

# we need a user who didn't post the item
user = User.objects.exclude(id=item.user_id).first()
if not user:
    print("No other user found")
    sys.exit()

print(f"Testing with user {user.username} on item {item.id}")

# Delete preexisting sessions
ClaimSession.objects.filter(claimant=user).delete()

import json

# Test verify-claim
request = factory.post(f'/api/items/{item.id}/verify-claim/')
force_authenticate(request, user=user)
view = VerifyClaimView.as_view()
res = view(request, pk=item.id)
print("VERIFY RESPONSE CODE:", res.status_code)
print(json.dumps(res.data, indent=2) if hasattr(res, 'data') else res.content)

# Test submit-ai-answer
request2 = factory.post(f'/api/items/{item.id}/submit-ai-answer/', {'answer': ''}, format='json')
force_authenticate(request2, user=user)
view2 = SubmitAIAnswerView.as_view()
res2 = view2(request2, item_id=item.id)
print("SUBMIT RESPONSE CODE:", res2.status_code)
print(json.dumps(res2.data, indent=2) if hasattr(res2, 'data') else res2.content)
