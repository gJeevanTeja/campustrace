import os
import django

# Set up Django environment properly
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "campustrace_backend.settings")
django.setup()

from rest_framework.test import APIClient
from users.models import User
from colleges.models import Category, Block, CampusLocation

def test_student_access():
    client = APIClient()
    # Find any student with a college
    student = User.objects.filter(role='student', college_id__isnull=False).first()
    if not student:
        # Try finding ANY user if no student with college
        student = User.objects.filter(college_id__isnull=False).first()
        
    if not student:
        print("No user with college found!")
        # Create one for testing if database is empty or links are broken
        from colleges.models import College
        c = College.objects.first()
        if not c:
            c = College.objects.create(name="Test College", email_domain="test.com")
        student = User.objects.create_user(email="teststudent@test.com", password="password123", name="Test Student", college=c)

    print(f"Testing as user: {student.email}, College: {student.college.name if student.college else 'None'} (ID: {student.college_id})")
    client.force_authenticate(user=student)
    
    print("\n--- Categories ---")
    res = client.get('/api/admin/categories/')
    print("Status:", res.status_code)
    if res.status_code == 200:
        data = res.data
        results = data.get('results') if isinstance(data, dict) else data
        print(f"Count: {len(results) if results else 0}")
        if results:
            print(f"First 2: {results[:2]}")
    else:
        print("Error Data:", res.data)

    print("\n--- Blocks ---")
    res = client.get('/api/admin/blocks/')
    print("Status:", res.status_code)
    if res.status_code == 200:
        data = res.data
        results = data.get('results') if isinstance(data, dict) else data
        print(f"Count: {len(results) if results else 0}")
    
    print("\n--- Campus Locations ---")
    res = client.get('/api/admin/campus-locations/')
    print("Status:", res.status_code)
    if res.status_code == 200:
        data = res.data
        results = data.get('results') if isinstance(data, dict) else data
        print(f"Count: {len(results) if results else 0}")

if __name__ == "__main__":
    test_student_access()
