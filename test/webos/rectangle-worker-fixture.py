"""Serve a prepared production Worker/client test directory only on loopback."""
import argparse
import http.server
import os
from pathlib import Path

p = argparse.ArgumentParser()
p.add_argument('--root', type=Path, required=True)
p.add_argument('--port', type=int, default=19931)
args = p.parse_args()
os.chdir(args.root.resolve(strict=True))
class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Content-Security-Policy', "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'; object-src 'none'")
        super().end_headers()
http.server.ThreadingHTTPServer(('127.0.0.1', args.port), Handler).serve_forever()
