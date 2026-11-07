#!/usr/bin/env python3
"""Test a freshly built app and pinned Worker runtime on disposable loopback."""
import argparse
import functools
import hashlib
import http.server
import json
import os
from pathlib import Path
import shutil
import socket
import subprocess
import tempfile
import threading
import time
import urllib.request

p = argparse.ArgumentParser()
p.add_argument('--node', required=True)
p.add_argument('--puppeteer', required=True)
p.add_argument('--chromium', required=True)
p.add_argument('--profile-parent', type=Path, required=True)
p.add_argument('--occ-js', type=Path, required=True)
p.add_argument('--occ-wasm', type=Path, required=True)
p.add_argument('--cdp-port', type=int, default=19983)
p.add_argument('--result-dir', type=Path, required=True)
p.add_argument('--tests', nargs='+', choices=('craft-engine-resources', 'craft-publication', 'craft-private-replay',
    'rectangle-creation', 'brep-vertex-ids', 'project-document-lifetime'),
    default=['craft-engine-resources', 'craft-publication', 'craft-private-replay',
             'rectangle-creation', 'brep-vertex-ids', 'project-document-lifetime'])
a = p.parse_args()
root = Path(__file__).resolve().parents[2]
a.result_dir.mkdir(parents=True, exist_ok=False)
results = a.result_dir.resolve()
with socket.socket() as s:
    s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    s.bind(('127.0.0.1', a.cdp_port))
fixture_parent = Path(tempfile.mkdtemp(prefix='codi-craft-resources-'))
fixture = fixture_parent / 'site'
profile = Path(tempfile.mkdtemp(prefix='codi-craft-resources-', dir=a.profile_parent))
chrome = server = None
log = (results / 'process.log').open('w')
env = dict(os.environ, PUPPETEER_CORE_PATH=a.puppeteer,
           CODI_TEST_CDP=f'http://127.0.0.1:{a.cdp_port}/')
rows = []

class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, message, *args):
        log.write((message % args) + '\n')

    def end_headers(self):
        self.send_header('Content-Security-Policy',
            "default-src 'self'; script-src 'self' blob: 'wasm-unsafe-eval'; "
            "worker-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'")
        super().end_headers()

try:
    subprocess.run([a.node, '--check', 'test/webos/craft-engine-resources-browser.test.cjs'], cwd=root, check=True)
    subprocess.run(['python3', 'test/engine-extrude/prepare-fixture.py', '--output', str(fixture),
        '--occ-js', str(a.occ_js.resolve(strict=True)), '--occ-wasm', str(a.occ_wasm.resolve(strict=True)),
        '--sketch-worker', str(root / '.build/headless-sketch-worker/worker.js'),
        '--verb', str(root / 'dist/lib/verb.js'), '--node', a.node], cwd=root, check=True)
    shutil.copytree(root / 'dist', fixture, dirs_exist_ok=True)
    for name in ('index', 'sketcher'):
        digest = hashlib.sha256((fixture / f'static/{name}.bundle.js').read_bytes()).hexdigest()
        env['CODI_CAD_'+('SKETCH' if name == 'sketcher' else 'INDEX')+'_SHA'] = digest
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Handler, directory=str(fixture)))
    env['JSKETCHER_TEST_URL'] = f'http://127.0.0.1:{server.server_port}/'
    threading.Thread(target=server.serve_forever, daemon=True).start()
    chrome = subprocess.Popen([a.chromium, '--headless=new', '--no-first-run', '--disable-background-networking',
        '--remote-debugging-address=127.0.0.1', f'--remote-debugging-port={a.cdp_port}',
        '--user-data-dir=' + str(profile), 'about:blank'], stdout=log, stderr=log)
    deadline = time.monotonic() + 30
    while True:
        try:
            with urllib.request.urlopen(env['CODI_TEST_CDP'] + 'json/version', timeout=1) as response:
                response.read()
            break
        except Exception:
            if time.monotonic() > deadline:
                raise
            time.sleep(.2)
    for test in a.tests:
        path = f'test/webos/{test}-browser.test.cjs'
        start = time.monotonic()
        result = subprocess.run([a.node, path], cwd=root, env=env, capture_output=True, text=True, timeout=180)
        row = dict(test=path, exitCode=result.returncode, seconds=time.monotonic()-start,
                   output=result.stdout+result.stderr, sourceSHA256=hashlib.sha256((root/path).read_bytes()).hexdigest())
        rows.append(row)
        receipt = dict(source=subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip(),
                       bundleHashes={name:env['CODI_CAD_'+name+'_SHA'] for name in ('INDEX', 'SKETCH')}, tests=rows)
        (results / 'results.json').write_text(json.dumps(receipt, indent=2) + '\n')
        print(json.dumps(row), flush=True)
        if result.returncode:
            raise RuntimeError(test + ' failed; retained result and process log')
finally:
    if chrome:
        try:
            subprocess.run([a.node, '-e', "(async()=>{const p=require(process.env.PUPPETEER_CORE_PATH);"
                "const b=await p.connect({browserURL:process.env.CODI_TEST_CDP});await b.close()})().catch(()=>process.exitCode=1)"],
                env=env, capture_output=True, timeout=15)
            chrome.wait(timeout=10)
        except Exception:
            chrome.terminate()
            try:
                chrome.wait(timeout=10)
            except subprocess.TimeoutExpired:
                chrome.kill(); chrome.wait()
    if server:
        server.shutdown(); server.server_close()
    log.close()
    # A snap launcher can exit before the browser. Keep any still-used profile.
    processes = subprocess.check_output(['ps', '-eo', 'args='], text=True)
    if str(profile) not in processes:
        shutil.rmtree(profile)
    else:
        (results / 'retained-profile.txt').write_text(str(profile) + '\n')
    shutil.rmtree(fixture_parent)
