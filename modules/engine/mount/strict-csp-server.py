"""Disposable loopback-only static server for the engine worker tests."""
import http.server
import os

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        blob = " blob:" if os.environ.get('CODI_ALLOW_BLOB') == '1' else ''
        self.send_header('Content-Security-Policy', "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'" + blob + "; worker-src 'self'; connect-src 'self'")
        super().end_headers()

os.chdir(os.environ['CODI_ENGINE_TEST_ROOT'])
http.server.ThreadingHTTPServer(('127.0.0.1', int(os.environ.get('CODI_ENGINE_TEST_PORT', '19353'))), Handler).serve_forever()
