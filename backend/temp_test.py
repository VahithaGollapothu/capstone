import json, urllib.request
url = 'http://127.0.0.1:8000/api/v1/floorplan/generate'
payload = {
    "dimensions": "30x40",
    "rooms": 4,
    "floors": 2,
    "style": "modern",
    "budget": 150,
    "include_penthouse": False
}
data = json.dumps(payload).encode('utf-8')
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'}, method='POST')
try:
    with urllib.request.urlopen(req) as resp:
        print('Status:', resp.status)
        body = resp.read().decode()
        print('Response:', body)
except urllib.error.HTTPError as e:
    print('HTTPError:', e.code, e.read().decode())
except Exception as e:
    print('Error:', e)
