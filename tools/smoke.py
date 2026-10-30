"""Smoke test a running Compose stack using only Python stdlib.

Run from project root: python tools/smoke.py
"""
import json
import secrets
import time
import urllib.request
from pathlib import Path

BASE = 'http://localhost:3000'
token = secrets.token_hex(32)

def request(path, body=None, content_type='application/json', identity=token):
    headers={'X-User-Token':identity}
    if body is not None:
        headers['Content-Type']=content_type
    with urllib.request.urlopen(urllib.request.Request(BASE+path,data=body,headers=headers),timeout=15) as response:
        return json.load(response)

templates=request('/api/templates')
assert len(templates)>=3
boundary='frame-'+secrets.token_hex(12)
image=(Path(__file__).resolve().parents[1]/'samples/sample-1.png').read_bytes()
body=(f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="sample.png"\r\nContent-Type: image/png\r\n\r\n'.encode()+image+f'\r\n--{boundary}--\r\n'.encode())
asset=request('/api/assets',body,'multipart/form-data; boundary='+boundary)
tasks=[]
for fail in [None,'CHECK','GENERATE','FINALIZE']:
    job=request('/api/tasks',json.dumps({'templateId':'portrait','assetIds':[asset['id']],'failStage':fail,'delayMs':100}).encode())
    tasks.append((job['id'],fail))
deadline=time.monotonic()+30
while time.monotonic()<deadline:
    history=request('/api/tasks')
    if len(history)==4 and all(t['status'] in ('SUCCEEDED','FAILED') for t in history):
        break
    time.sleep(.2)
else:
    raise AssertionError('Timed out waiting for terminal tasks')
for id,fail in tasks:
    job=next(t for t in history if t['id']==id)
    if fail:
        assert job['status']=='FAILED' and job['stage']==fail and job['error'],job
    else:
        assert job['status']=='SUCCEEDED' and job['stage']=='DONE',job
        with urllib.request.urlopen(BASE+job['resultUrl']) as response:
            assert response.read()==image
assert request('/api/tasks',identity=secrets.token_hex(32))==[]
print('PASS: templates, real upload, success, three failure stages, result bytes, user isolation')
