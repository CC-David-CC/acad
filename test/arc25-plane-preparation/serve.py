"""Loopback-only actual-build fixture with the same strict CSP as root R10."""
import argparse
from functools import partial
from http.server import HTTPServer, SimpleHTTPRequestHandler

POLICY = (
    "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'; "
    "style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'"
)


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Content-Security-Policy", POLICY)
        super().end_headers()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", required=True, type=int)
    parser.add_argument("--directory", required=True)
    args = parser.parse_args()
    HTTPServer(("127.0.0.1", args.port), partial(Handler, directory=args.directory)).serve_forever()
