#!/usr/bin/env python3
# Owned private component and bounded artifact sink, never an account/service.
import argparse,functools,http.server,json,hashlib,re
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('root');p.add_argument('output');p.add_argument('port',type=int);a=p.parse_args();out=Path(a.output);out.mkdir()
class Handler(http.server.SimpleHTTPRequestHandler):
 def end_headers(self):
  self.send_header('Content-Security-Policy',"default-src 'none'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'; connect-src 'self'; style-src 'none'; object-src 'none'; base-uri 'none'");self.send_header('Cache-Control','no-store');super().end_headers()
 def do_POST(self):
  if not re.fullmatch(r'/__mesh/[a-z0-9-]+',self.path):self.send_error(404);return
  try:n=int(self.headers.get('Content-Length','0'))
  except ValueError:self.send_error(400);return
  if not 1<=n<=8388608 or self.headers.get('Transfer-Encoding'):self.send_error(413);return
  data=self.rfile.read(n)
  if len(data)!=n:self.send_error(400);return
  file=out/(self.path.rsplit('/',1)[1]+'.mesh')
  try:
   with file.open('xb') as f:f.write(data)
  except FileExistsError:self.send_error(409);return
  response=json.dumps({'file':file.name,'bytes':n,'sha256':hashlib.sha256(data).hexdigest()}).encode();self.send_response(200);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(response)));self.end_headers();self.wfile.write(response)
http.server.ThreadingHTTPServer(('127.0.0.1',a.port),functools.partial(Handler,directory=a.root)).serve_forever()
