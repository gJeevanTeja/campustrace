from django.db.models import Count, Avg, F
from django.db.models.functions import ExtractHour
from items.models import Item
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

def calculate_avg_return_time(college=None):
    queryset = Item.objects.filter(status='resolved')
    if college:
        queryset = queryset.filter(college=college)
    
    # Simple logic: diff between created_at and updated_at for resolved items
    # In a real app, you'd have a 'resolved_at' field
    avg_diff = queryset.annotate(
        duration=F('updated_at') - F('created_at')
    ).aggregate(avg_duration=Avg('duration'))['avg_duration']
    
    if avg_diff:
        days = avg_diff.days
        hours = avg_diff.seconds // 3600
        return f"{days}d {hours}h"
    return "N/A"

def get_college_metrics(college):
    total_lost = Item.objects.filter(college=college, type='lost').count()
    total_found = Item.objects.filter(college=college, type='found').count()
    resolved = Item.objects.filter(college=college, status='resolved').count()
    
    resolution_rate = round((resolved / total_lost * 100), 1) if total_lost > 0 else 0
    
    most_lost_category = (
        Item.objects.filter(college=college, type='lost')
        .values('category__name')
        .annotate(count=Count('id'))
        .order_by('-count')
        .first()
    )
    
    peak_hour = (
        Item.objects.filter(college=college)
        .annotate(hour=ExtractHour('created_at'))
        .values('hour')
        .annotate(count=Count('id'))
        .order_by('-count')
        .first()
    )
    
    active_users = User.objects.filter(college=college, is_active=True).count()
    
    # Weekly trend
    last_week = timezone.now() - timedelta(days=7)
    reports_this_week = Item.objects.filter(college=college, created_at__gte=last_week).count()
    
    # Category Distribution
    category_stats = list(
        Item.objects.filter(college=college)
        .values('category__name')
        .annotate(count=Count('id'))
        .order_by('-count')[:5]
    )

    return {
        "total_lost": total_lost,
        "total_found": total_found,
        "resolved_count": resolved,
        "resolution_rate": resolution_rate,
        "top_category": most_lost_category['category__name'] if most_lost_category else "None",
        "peak_hour": f"{peak_hour['hour']}:00" if peak_hour else "N/A",
        "active_users": active_users,
        "avg_return_time": calculate_avg_return_time(college),
        "reports_this_week": reports_this_week,
        "category_stats": category_stats
    }

def get_global_metrics():
    from colleges.models import College
    from administration.models import AdminRequest
    
    total_colleges = College.objects.count()
    total_users = User.objects.count()
    total_reports = Item.objects.count()
    pending_requests = AdminRequest.objects.filter(status='pending').count()
    
    total_lost = Item.objects.filter(type='lost').count()
    total_found = Item.objects.filter(type='found').count()
    resolved = Item.objects.filter(status='resolved').count()
    
    resolution_rate = round((resolved / total_lost * 100), 1) if total_lost > 0 else 0
    
    most_active_college = (
        Item.objects.values('college__name')
        .annotate(count=Count('id'))
        .order_by('-count')
        .first()
    )
    
    # Activity trend (last 7 days)
    activity_data = []
    for i in range(7):
        date = timezone.now().date() - timedelta(days=i)
        count = Item.objects.filter(created_at__date=date).count()
        activity_data.append({"date": date.strftime("%b %d"), "count": count})
    activity_data.reverse()

    return {
        "total_colleges": total_colleges,
        "total_users": total_users,
        "total_reports": total_reports,
        "pending_requests": pending_requests,
        "total_lost": total_lost,
        "total_found": total_found,
        "resolution_rate": resolution_rate,
        "most_active_college": most_active_college['college__name'] if most_active_college else "N/A",
        "reporting_activity": activity_data
    }
