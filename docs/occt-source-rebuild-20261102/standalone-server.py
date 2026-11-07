import functools,http.server,sys
class Handler(http.server.SimpleHTTPRequestHandler):
 def end_headers(self):
  self.send_header('Content-Security-Policy', "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self' wss://ksu.codes; font-src 'self' data:; frame-src 'self' blob:; worker-src 'self' blob:; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'self'")
  super().end_headers()
http.server.ThreadingHTTPServer(('127.0.0.1',int(sys.argv[2])),functools.partial(Handler,directory=sys.argv[1])).serve_forever()
