import functools,http.server,mimetypes,os,pathlib,sys
root=pathlib.Path(sys.argv[1]).resolve();port=int(sys.argv[2])
mimetypes.add_type('text/javascript','.mjs');mimetypes.add_type('application/wasm','.wasm')
class Handler(http.server.SimpleHTTPRequestHandler):
 def end_headers(self):
  self.send_header('Content-Security-Policy',"default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'; connect-src 'self'; object-src 'none'")
  self.send_header('Cache-Control','no-store');super().end_headers()
 def do_GET(self):
  if self.path=='/':self.path='/engine-test.html'
  super().do_GET()
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',port),functools.partial(Handler,directory=str(root)))
print(f'pid={os.getpid()} root={root} port={port}',flush=True);server.serve_forever()
