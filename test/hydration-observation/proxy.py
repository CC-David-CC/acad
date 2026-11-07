"""Disposable same-origin test proxy; forwards app unchanged, serves two pinned test Worker assets."""
import hashlib
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.request import urlopen
from urllib.parse import urlparse
from pathlib import Path
import os

UPSTREAM=os.environ.get('CODI_APP_UPSTREAM','http://127.0.0.1:20480')
if urlparse(UPSTREAM).hostname not in ('127.0.0.1','localhost','::1'):
 raise ValueError('loopback upstream required')
ASSETS={
 '/static/diag-transition.js':('/tmp/codi-transition-policy-fixture/static/worker.js','de90850d961327b206f311460bc3a221091289490e38968cc0df3e27bf985028'),
 '/static/verb.js':('/tmp/codi-transition-policy-fixture/static/verb.js','55f13091a656c635d1ebe3931a9b52236c65023549b7b69bc8278362f87686f3'),
}
class Handler(BaseHTTPRequestHandler):
 def do_GET(self):
  try:
   if self.path in ASSETS:
    path,expected=ASSETS[self.path];data=Path(path).read_bytes()
    if hashlib.sha256(data).hexdigest()!=expected: raise ValueError('asset pin mismatch')
    self.send_response(200);self.send_header('Content-Type','text/javascript');self.send_header('Content-Security-Policy',"default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'; connect-src 'self'");self.end_headers();self.wfile.write(data);return
   with urlopen(UPSTREAM+self.path,timeout=20) as response:
    self.send_response(response.status)
    for key,value in response.headers.items():
     if key.lower() not in ('transfer-encoding','connection','content-length'):self.send_header(key,value)
    self.end_headers();self.wfile.write(response.read())
  except Exception as error:
   self.send_error(502,str(error))
ThreadingHTTPServer(('127.0.0.1',int(os.environ.get('CODI_TEST_PORT','20585'))),Handler).serve_forever()
