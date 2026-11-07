#!/usr/bin/env python3
import http.server,argparse,pathlib
p=argparse.ArgumentParser();p.add_argument('root',type=pathlib.Path);p.add_argument('port',type=int);a=p.parse_args()
files={'/sketch.js':a.root/'.build/selected-profile-loft/sketch/worker.js','/semantic.js':a.root/'.build/selected-profile-loft/semantic/worker.js','/lib/verb.js':a.root/'web/lib/verb.js'}
class H(http.server.BaseHTTPRequestHandler):
 def do_GET(self):
  if self.path=='/':body=b'<!doctype html><title>Source loft component</title>';typ='text/html'
  elif self.path in files:body=files[self.path].read_bytes();typ='text/javascript'
  else:self.send_error(404);return
  self.send_response(200);self.send_header('Content-Type',typ);self.send_header('Content-Length',str(len(body)));self.send_header('Cache-Control','no-store');self.send_header('Content-Security-Policy',"default-src 'none'; script-src 'self'; worker-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'");self.end_headers();self.wfile.write(body)
http.server.ThreadingHTTPServer(('127.0.0.1',a.port),H).serve_forever()
