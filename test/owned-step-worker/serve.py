"""Own loopback component/code server and bounded raw-Blob test sink only."""
import functools,http.server,pathlib,re,hashlib,json,sys,os
root=pathlib.Path(sys.argv[1]).resolve();out=pathlib.Path(sys.argv[2]).resolve();out.mkdir();port=int(sys.argv[3])
class Handler(http.server.SimpleHTTPRequestHandler):
 def end_headers(self):
  self.send_header('Content-Security-Policy',"default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'; connect-src 'self'; object-src 'none'");self.send_header('Cache-Control','no-store');super().end_headers()
 def do_GET(self):
  if self.path=='/':self.path='/index.html'
  super().do_GET()
 def do_POST(self):
  label=self.path.removeprefix('/__export/')
  try:size=int(self.headers['Content-Length'])
  except:self.send_error(400);return
  if not self.path.startswith('/__export/') or not re.fullmatch('[a-z0-9-]{1,64}',label) or not 0<size<=8388608:self.send_error(400);return
  target=out/(label+'.step')
  if target.exists():self.send_error(409);return
  h=hashlib.sha256();left=size
  with target.open('xb') as f:
   while left:
    b=self.rfile.read(min(left,65536))
    if not b:raise IOError('Truncated test Blob')
    f.write(b);h.update(b);left-=len(b)
  body=json.dumps({'bytes':size,'sha256':h.hexdigest()}).encode();self.send_response(200);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',port),functools.partial(Handler,directory=str(root)));print(f'pid={os.getpid()} root={root} output={out} port={port}',flush=True);server.serve_forever()
