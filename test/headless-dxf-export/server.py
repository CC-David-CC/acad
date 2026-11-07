from http.server import HTTPServer, SimpleHTTPRequestHandler
import os
os.chdir(os.environ.get('CODI_DXF_TEST_ROOT', '/mnt/data10tb/codi-headless-dxf-test-output-20261105'))
class Handler(SimpleHTTPRequestHandler):
 def end_headers(self):
  self.send_header('Content-Security-Policy', "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'")
  super().end_headers()
HTTPServer(('127.0.0.1', int(os.environ.get('CODI_DXF_TEST_PORT', '20586'))), Handler).serve_forever()
