#!/usr/bin/env python3
"""Read-only loopback fixture: exact sketch worker plus data-only profile code."""
import argparse
import hashlib
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

POLICY = ("default-src 'none'; script-src 'self' 'wasm-unsafe-eval'; "
          "worker-src 'self'; connect-src 'self'; object-src 'none'; "
          "base-uri 'none'; form-action 'none'; frame-ancestors 'none'")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--dist', type=Path, required=True)
    parser.add_argument('--port', type=int, required=True)
    parser.add_argument('--expected-revision', required=True)
    parser.add_argument('--expected-worker-sha256', required=True)
    args = parser.parse_args()
    repo = Path(__file__).resolve().parents[2]
    dist = args.dist.resolve(strict=True)
    if (dist / '.rev').read_text().strip() != args.expected_revision:
        parser.error('The built source revision differs from the expected revision')
    workers = list((dist / 'static').glob('sketch-solver.*.js'))
    if len(workers) != 1:
        parser.error('Expected exactly one built sketch worker')
    if hashlib.sha256(workers[0].read_bytes()).hexdigest() != args.expected_worker_sha256:
        parser.error('The built sketch worker differs from its expected digest')
    paths = {
        '/static/worker.js': workers[0],
        '/lib/verb.js': dist / 'lib/verb.js',
        '/test/extrude/rectangle-profile-worker.mjs': repo / 'test/extrude/rectangle-profile-worker.mjs',
    }
    for name in ('rectangleProfileRequest.mjs', 'profilePlan.mjs', 'authoredRegions.mjs'):
        route = '/modules/workbenches/modeler/features/extrude/' + name
        paths[route] = repo / route[1:]
    # Pin the exact served bytes for this run. No private state or whole-repo route.
    assets = {route: path.read_bytes() for route, path in paths.items()}
    assets['/'] = b'<!doctype html><title>Data-only profile fixture</title>'
    manifest = {route: hashlib.sha256(body).hexdigest() for route, body in assets.items()}
    assets['/fixture-manifest.json'] = json.dumps({
        'revision': args.expected_revision, 'sha256': manifest, 'policy': POLICY,
    }, sort_keys=True).encode()

    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            route = urlsplit(self.path).path
            body = assets.get(route)
            if body is None:
                self.send_error(404)
                return
            self.send_response(200)
            kind = 'text/html' if route == '/' else ('application/json' if route.endswith('.json') else 'text/javascript')
            self.send_header('Content-Type', kind + '; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.send_header('Content-Security-Policy', POLICY)
            self.send_header('Cache-Control', 'no-store')
            self.send_header('X-Content-Type-Options', 'nosniff')
            self.end_headers()
            self.wfile.write(body)

        def log_message(self, *_):
            pass

    server = ThreadingHTTPServer(('127.0.0.1', args.port), Handler)
    print(json.dumps({'url': f'http://127.0.0.1:{args.port}/', 'manifest': manifest}), flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == '__main__':
    main()
