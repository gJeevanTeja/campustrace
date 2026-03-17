import os
import sys
import django

sys.path.append(os.getcwd())

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campustrace_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from users.rewards_logic import grant_reward_points, update_user_level, check_and_assign_badges
from items.models import Item, ClaimSession
from users.models import RewardTransaction

User = get_user_model()

def test_rewards():
    # 1. Create a dummy user
    user, created = User.objects.get_or_create(
        username='test_reward_user',
        defaults={'name': 'Test User', 'email': 'test@example.com'}
    )
    user.reward_points = 0
    user.level = 'Beginner Helper'
    user.badges = []
    user.successful_returns = 0
    user.save()
    
    # Clear previous transactions for this user
    RewardTransaction.objects.filter(user=user).delete()

    print(f"Initial State: Points={user.reward_points}, Level={user.level}, Badges={user.badges}")

    # 2. Test Point Granting (+50 for return)
    grant_reward_points(user, 50, "Test Return", "return")
    user.refresh_from_db()
    print(f"After +50 points: Points={user.reward_points}, Status: {'PASS' if user.reward_points == 50 else 'FAIL'}")

    # 3. Test Level Progression
    # Supporter at 100
    grant_reward_points(user, 60, "More points", "return")
    user.refresh_from_db()
    print(f"After +60 more (Total 110): Level={user.level}, Status: {'PASS' if user.level == 'Campus Supporter' else 'FAIL'}")

    # 4. Test Badge Assignment (First Finder)
    # The grant_reward_points logic calls check_and_assign_badges and increments successful_returns if category is 'return'
    # Wait, let's check the logic in rewards_logic.py
    print(f"Badges: {user.badges}, Returns: {user.successful_returns}")
    print(f"First Finder Badge Status: {'PASS' if 'First Finder' in user.badges else 'FAIL'}")

    # 5. Test Tech Saver Badge
    item = Item.objects.create(
        title="Test iPhone",
        category="Electronics",
        user=user, # owner doesn't matter for categories check usually, but let's see
        type="lost"
    )
    # We need to simulate a return of this item
    grant_reward_points(user, 50, "Returned iPhone", "return", item)
    user.refresh_from_db()
    print(f"Badges after returning Electronics: {user.badges}")
    print(f"Tech Saver Badge Status: {'PASS' if 'Tech Saver' in user.badges else 'FAIL'}")

    # 6. Test Hero Level (700+)
    grant_reward_points(user, 600, "Huge bonus", "bonus")
    user.refresh_from_db()
    print(f"After +600 (Total {user.reward_points}): Level={user.level}, Status: {'PASS' if user.level == 'Campus Hero' else 'FAIL'}")

if __name__ == '__main__':
    test_rewards()
