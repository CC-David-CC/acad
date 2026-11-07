#!/usr/bin/env python3
import argparse,os
from http.server import HTTPServer,SimpleHTTPRequestHandler
p=argparse.ArgumentParser();p.add_argument('--root',required=True);p.add_argument('--port',type=int,required=True);a=p.parse_args();os.chdir(a.root)
class Handler(SimpleHTTPRequestHandler):
 def end_headers(self):
  self.send_header('Content-Security-Policy',"default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'; connect-src 'self'");super().end_headers()
HTTPServer(('127.0.0.1',a.port),Handler).serve_forever()
