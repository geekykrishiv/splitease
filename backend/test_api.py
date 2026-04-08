import urllib.request
import json
import traceback

try:
    # 1. Login
    req = urllib.request.Request(
        'http://localhost:8000/api/auth/login',
        data=json.dumps({'email': 'krish@example.com', 'password': 'password123'}).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req) as response:
        login_data = json.loads(response.read().decode('utf-8'))
        token = login_data['access_token']
        print(f"Login successful, token: {token[:20]}...")

    # 2. Get Me
    req_me = urllib.request.Request(
        'http://localhost:8000/api/auth/me',
        headers={'Authorization': f'Bearer {token}'}
    )
    with urllib.request.urlopen(req_me) as response:
        me_data = json.loads(response.read().decode('utf-8'))
        print("Me data:", me_data)

    # 3. Get Groups
    req_groups = urllib.request.Request(
        'http://localhost:8000/api/groups/',
        headers={'Authorization': f'Bearer {token}'}
    )
    with urllib.request.urlopen(req_groups) as response:
        groups_data = json.loads(response.read().decode('utf-8'))
        print("Groups count:", len(groups_data))

except Exception as e:
    print(f"Error: {e}")
    if hasattr(e, 'read'):
        print(e.read().decode('utf-8'))
    traceback.print_exc()
