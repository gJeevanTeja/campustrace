import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campustrace_backend.settings')
django.setup()

from items.models import Item, ClaimSession
from django.utils import timezone

# Check last 5 claim sessions
sessions = ClaimSession.objects.all().order_by('-created_at')[:5]

print(f"Checking {len(sessions)} most recent claim sessions:")
for s in sessions:
    print(f"\nID: {s.id}")
    print(f"Item: {s.item.title} (ID: {s.item.id})")
    print(f"Claimant: {s.claimant.username}")
    print(f"Status: {s.status}")
    print(f"Current Index: {s.current_question_index}")
    print(f"AI Questions count: {len(s.ai_questions)}")
    print(f"AI Questions: {s.ai_questions}")
    print(f"Item verification_questions: {s.item.verification_questions}")
    print(f"Item is_electronics: {s.item.is_electronics()}")

# check last 5 items
items = Item.objects.all().order_by('-created_at')[:5]
print(f"\nChecking {len(items)} most recent items:")
for i in items:
    print(f"\nID: {i.id}")
    print(f"Title: {i.title}")
    print(f"Category: {i.category}")
    print(f"Is Electronics: {i.is_electronics()}")
    print(f"Verification Questions: {i.verification_questions}")
