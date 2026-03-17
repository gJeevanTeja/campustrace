from .models import RewardTransaction

def update_user_level(user):
    """Update user level based on reward points."""
    points = user.reward_points
    if points >= 700:
        user.level = 'Campus Hero'
    elif points >= 300:
        user.level = 'Trusted Finder'
    elif points >= 100:
        user.level = 'Campus Supporter'
    else:
        user.level = 'Beginner Helper'
    user.save(update_fields=['level'])

def check_and_assign_badges(user, item=None):
    """Check and assign badges based on user performance."""
    badges = user.badges or []
    new_badges = []
    
    # First Finder
    if user.successful_returns == 1 and 'First Finder' not in badges:
        new_badges.append('First Finder')
    
    # Honest Helper
    if user.successful_returns >= 5 and 'Honest Helper' not in badges:
        new_badges.append('Honest Helper')
        
    # Campus Guardian
    if user.successful_returns >= 20 and 'Campus Guardian' not in badges:
        new_badges.append('Campus Guardian')
        
    # Tech Saver
    if item and item.category.lower() in ['electronics', 'phones', 'laptops'] and 'Tech Saver' not in badges:
        new_badges.append('Tech Saver')
        
    if new_badges:
        user.badges = list(set(badges + new_badges))
        user.save(update_fields=['badges'])
        return new_badges
    return []

def grant_reward_points(user, points, description, category, item=None):
    """Grant points to a user and log the transaction."""
    if points <= 0:
        return
        
    user.reward_points += points
    if category == 'return':
        user.successful_returns += 1
        
    user.save(update_fields=['reward_points', 'successful_returns'])
    
    RewardTransaction.objects.create(
        user=user,
        points=points,
        description=description,
        category=category,
        item=item
    )
    
    # Check for bonuses
    if category == 'return' and user.successful_returns % 5 == 0:
        bonus_points = 100
        user.reward_points += bonus_points
        user.save(update_fields=['reward_points'])
        RewardTransaction.objects.create(
            user=user,
            points=bonus_points,
            description=f"Bonus for returning {user.successful_returns} items",
            category='bonus',
            item=item
        )
    
    update_user_level(user)
    new_badges = check_and_assign_badges(user, item)
    return new_badges
