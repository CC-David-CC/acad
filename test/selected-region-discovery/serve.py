"""Exact-file loopback fixture; never a public source or desktop deployment."""
import argparse,functools,http.server
from urllib.parse import urlsplit
p=argparse.ArgumentParser();p.add_argument('--root',required=True);p.add_argument('--port',required=True,type=int);a=p.parse_args()
allowed={'/test/selected-region-discovery/'+name for name in ('index.html','worker.mjs','fixtures.mjs')}
allowed.update('/'+name for name in ('modules/engine/extrusion/selectedSketchProfile.mjs','modules/engine/mount/selectedProfilePlan.mjs','modules/workbenches/modeler/features/extrude/authoredRegions.mjs','modules/workbenches/modeler/features/extrude/profilePlan.mjs'))
class Handler(http.server.SimpleHTTPRequestHandler):
 def do_GET(self):
  if urlsplit(self.path).path not in allowed:self.send_error(404);return
  super().do_GET()
 def end_headers(self):
  self.send_header('Content-Security-Policy',"default-src 'none'; script-src 'self'; worker-src 'self'; connect-src 'self'");super().end_headers()
http.server.ThreadingHTTPServer(('127.0.0.1',a.port),functools.partial(Handler,directory=a.root)).serve_forever()
