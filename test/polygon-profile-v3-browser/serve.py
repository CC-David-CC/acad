"""Read-only loopback fixture for exactly the frozen component closure."""
import argparse
import functools
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import json
from pathlib import Path
from urllib.parse import urlsplit, unquote

p=argparse.ArgumentParser();p.add_argument('--root',required=True);p.add_argument('--port',type=int,default=0);args=p.parse_args()
root=Path(args.root).resolve();manifest=json.loads((root/'component.json').read_text());allowed={'/'+x for x in manifest['files']}|{'/component.json'}
class Handler(SimpleHTTPRequestHandler):
    extensions_map={**SimpleHTTPRequestHandler.extensions_map,'.mjs':'text/javascript','.js':'text/javascript','.wasm':'application/wasm'}
    def end_headers(self):
        self.send_header('Content-Security-Policy',"default-src 'none'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'")
        self.send_header('X-Content-Type-Options','nosniff');self.send_header('Cache-Control','no-store');super().end_headers()
    def do_GET(self):
        path=unquote(urlsplit(self.path).path)
        if path=='/index.html':
            body=b'<!doctype html><meta charset="utf-8"><title>Frozen V3 Worker component</title>'
            self.send_response(200);self.send_header('Content-Type','text/html');self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)
        elif path in allowed:
            super().do_GET()
        else:
            self.send_error(404)
server=ThreadingHTTPServer(('127.0.0.1',args.port),functools.partial(Handler,directory=str(root)))
print(json.dumps({'port':server.server_port,'root':str(root),'files':len(allowed)}),flush=True)
server.serve_forever()
