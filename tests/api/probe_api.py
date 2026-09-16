import sys, json, urllib.request, urllib.error
sys.stdout.reconfigure(encoding='utf-8')

TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjI2MSwidmFpVHJvSWQiOjUsImlhdCI6MTc4OTM1OTIxOSwiZXhwIjoxNzg5OTY0MDE5fQ.NSNlmVH4imZANR8MLZWasBoVrQrWuNPw24sZGVQ_Cmg'

def post_json(url, data):
    try:
        data_bytes = json.dumps(data).encode('utf-8')
        req = urllib.request.Request(url, data=data_bytes, 
            headers={'User-Agent': 'Mozilla', 'Content-Type': 'application/json'}, method='POST')
        with urllib.request.urlopen(req, timeout=8) as r:
            return json.loads(r.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        return {'_status': e.code, '_body': body[:300]}

def get_json(url, token=None):
    try:
        headers = {'User-Agent': 'Mozilla'}
        if token:
            headers['Authorization'] = f'Bearer {token}'
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=8) as r:
            return json.loads(r.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return {'_status': e.code, '_body': e.read().decode('utf-8')[:200]}
    except Exception as e:
        return {'_error': str(e)}

# Re-login to get fresh token
r_login = post_json('http://localhost:5000/api/login', {
    'email': 'QTV_HeThong1@gmail.com',
    'password': '123456'
})
token = r_login.get('token', TOKEN)
print(f"Token obtained: {token[:40]}...")
print()

# Try various stats endpoints
endpoints = [
    '/api/operator/dashboard',
    '/api/operator/tin-dang',
    '/api/users',
    '/api/users/list',
    '/api/admin/thong-ke',
    '/api/operator/dashboard/stats',
    '/api/operator/thong-ke',
    '/api/operator/tin-dang?page=1&limit=5',
]

for ep in endpoints:
    r = get_json('http://localhost:5000' + ep, token)
    has_status = '_status' in r or '_error' in r
    if not has_status:
        print(f'OK {ep}:')
        print(json.dumps(r, ensure_ascii=False)[:400])
        print()
    else:
        print(f'FAIL {ep}: {r}')
