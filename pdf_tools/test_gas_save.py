import urllib.request
import json
import base64

payload = {
    "action": "save_append",
    "droneId": "JU32636BA3D2",
    "date": "2026年05月",
    "filename": "test_data.json",
    "prefix": "飛行日誌",
    "fileData": base64.b64encode(b'{"test": "123"}').decode('utf-8'),
    "fieldValues": {"test": "123"}
}

req = urllib.request.Request(
    'https://script.google.com/macros/s/AKfycbysGawyBydG7mg0XXl5PPLxv03a6DDzKwLtDR5qcizp8egT_qAkrTLg3psHYnN98PtZDQ/exec',
    data=json.dumps(payload).encode('utf-8'),
    headers={'Content-Type': 'text/plain;charset=utf-8'}
)

try:
    with urllib.request.urlopen(req) as res:
        print(res.read().decode('utf-8'))
except Exception as e:
    print("Error:", e)
