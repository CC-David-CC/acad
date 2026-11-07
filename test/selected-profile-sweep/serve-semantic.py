"""Loopback-only blank host for a production semantic Worker component."""
import functools
import http.server
import pathlib
import sys

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Content-Security-Policy', "default-src 'none'; script-src 'self'; worker-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'")
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def do_GET(self):
        if self.path == '/':
            body = b'<!doctype html><meta charset="utf-8"><title>Worker component test</title>'
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        elif self.path == '/worker.js':
            super().do_GET()
        else:
            self.send_error(404)

directory = pathlib.Path(sys.argv[1]).resolve(strict=True)
assert (directory / 'worker.js').is_file()
http.server.ThreadingHTTPServer(('127.0.0.1', int(sys.argv[2])), functools.partial(Handler, directory=str(directory))).serve_forever()
