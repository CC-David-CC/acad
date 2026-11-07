#!/usr/bin/env python3
import argparse, http.server, functools
p=argparse.ArgumentParser();p.add_argument('root');p.add_argument('port',type=int);a=p.parse_args()
class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Content-Security-Policy', "default-src 'none'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'; connect-src 'self'; style-src 'none'; object-src 'none'; base-uri 'none'")
        self.send_header('Cache-Control','no-store');super().end_headers()
http.server.ThreadingHTTPServer(('127.0.0.1',a.port),functools.partial(Handler,directory=a.root)).serve_forever()
