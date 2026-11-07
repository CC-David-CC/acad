import argparse, functools, http.server
p=argparse.ArgumentParser();p.add_argument('--root',required=True);p.add_argument('--port',type=int,required=True);a=p.parse_args()
class Handler(http.server.SimpleHTTPRequestHandler):
 def end_headers(self):
  self.send_header('Content-Security-Policy',"default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'");super().end_headers()
http.server.ThreadingHTTPServer(('127.0.0.1',a.port),functools.partial(Handler,directory=a.root)).serve_forever()
