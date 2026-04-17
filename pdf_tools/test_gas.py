import urllib.request
import json
import urllib.parse

url = 'https://script.google.com/macros/s/AKfycbysGawyBydG7mg0XXl5PPLxv03a6DDzKwLtDR5qcizp8egT_qAkrTLg3psHYnN98PtZDQ/exec'
payload = {
    'action': 'get_latest',
    'droneId': 'JU32636BA3D2',
    'date': '2026年04月',
    'filename': '飛行日誌_JU32636BA3D2_202604.pdf',
    'prefix': '飛行日誌'
}

req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'))
req.add_header('Content-Type', 'text/plain;charset=utf-8')

try:
    response = urllib.request.urlopen(req)
    result_bytes = response.read()
    result_str = result_bytes.decode('utf-8')
    result = json.loads(result_str)
    
    print(f"Status: {result.get('status')}")
    print(f"Filename: {result.get('filename')}")
    fv = result.get('fieldValues')
    if fv:
        if isinstance(fv, str):
            print(f"fieldValues (str): {fv[:200]} ...")
        else:
            print(f"fieldValues (dict keys): {list(fv.keys())[:10]} ...")
    else:
        print("No fieldValues found")

except Exception as e:
    print(f"Error: {e}")
