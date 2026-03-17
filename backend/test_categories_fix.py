import requests

BASE_URL = "http://localhost:8001/api"

def get_tokens():
    import subprocess
    cmd = "python manage.py shell -c \"from users.models import User; from rest_framework_simplejwt.tokens import RefreshToken; sa = User.objects.filter(role='super_admin').first(); ca = User.objects.filter(role='college_admin').first(); print(f'SA:{RefreshToken.for_user(sa).access_token}'); print(f'CA:{RefreshToken.for_user(ca).access_token}')\""
    result = subprocess.check_output(cmd, shell=True, cwd="c:\\Users\\JEEVAN TEJA\\Desktop\\campustrace-main\\backend").decode()
    tokens = {}
    for line in result.splitlines():
        if line.startswith("SA:"): tokens['sa'] = line.split("SA:")[1].strip()
        if line.startswith("CA:"): tokens['ca'] = line.split("CA:")[1].strip()
    return tokens

def test_create(token, role):
    print(f"\nTesting {role}...")
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "name": f"Test Category {role}",
        "emoji": "🧪",
        "priority": 10,
        "active": True
    }
    response = requests.post(f"{BASE_URL}/admin/categories/", json=data, headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")

if __name__ == "__main__":
    tokens = get_tokens()
    if 'sa' in tokens:
        test_create(tokens['sa'], "Super Admin")
    if 'ca' in tokens:
        test_create(tokens['ca'], "College Admin")
