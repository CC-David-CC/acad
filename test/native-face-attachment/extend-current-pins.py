#!/usr/bin/env python3
"""Extend exact b3/78cc pins after streaming verification; metadata, not CAD proof."""
import argparse
import copy
import hashlib
import json
import os
from pathlib import Path

p = argparse.ArgumentParser(description=__doc__)
p.add_argument('--base-pins', type=Path, required=True)
p.add_argument('--apps', type=Path, required=True)
p.add_argument('--desktop-source', type=Path, required=True)
p.add_argument('--output', type=Path, required=True)
a = p.parse_args()
contract = json.loads(Path(__file__).with_name('current-b3-78cc-pin-contract.json').read_text())
base_bytes = a.base_pins.read_bytes()
if hashlib.sha256(base_bytes).hexdigest() != contract['basePinsSHA256']:
    raise SystemExit('Require the frozen original 178-pin input, byte for byte')
base = json.loads(base_bytes)
if (base['source'], base['desktop']) != (contract['source'], contract['desktop']):
    raise SystemExit('Core/Desktop tuple changed')
if len(base['files']) != 178:
    raise SystemExit('Require exactly 178 original entries')
for key in ('outer', 'filesApp'):
    if base[key] != contract[key]:
        raise SystemExit('Frozen app tuple changed: ' + key)
if a.output.exists() or a.output.is_symlink():
    raise SystemExit('Preserve every existing output; choose a new path')

def verify(file, expected_hash, expected_bytes=None):
    h, size = hashlib.sha256(), 0
    with file.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(chunk)
            size += len(chunk)
    if h.hexdigest() != expected_hash or (expected_bytes is not None and size != expected_bytes):
        raise SystemExit('Actual staged bytes differ: ' + str(file))

catalog = json.loads((a.apps / 'apps.json').read_text())['apps']
def mounted_app(app_id, expected):
    matches = [row for row in catalog if row['id'] == app_id]
    if len(matches) != 1:
        raise SystemExit('Require one actual app: ' + app_id)
    row = matches[0]
    if {k: row[k] for k in ('bundleSHA256', 'sha256', 'path')} != expected:
        raise SystemExit('Actual app catalog tuple differs: ' + app_id)
    root = a.apps / 'apps' / app_id / expected['bundleSHA256']
    verify(root / 'index.mjs', expected['sha256'])
    return root, row

cad_root, cad = mounted_app('jsketcher', contract['outer'])
mounted_app('files', contract['filesApp'])
inner_prefix = 'node_modules/jsketcher-build/'
inner = {k[len(inner_prefix):]: v for k, v in cad['files'].items() if k.startswith(inner_prefix)}
inner_root = cad_root / inner_prefix
for name, digest in base['files'].items():
    if name.startswith('/'):
        verify(a.desktop_source / 'active-system' / name.lstrip('/'), digest)
    else:
        record = inner.get(name)
        if not record or record['sha256'] != digest:
            raise SystemExit('An original pin differs from the actual catalog: ' + name)
        verify(inner_root / name, digest, record['bytes'])

result = copy.deepcopy(base)
for name, expected in contract['extensions'].items():
    if name in result['files']:
        raise SystemExit('Extension unexpectedly already present: ' + name)
    if inner.get(name) != expected:
        raise SystemExit('Attachment catalog hash/byte contract differs: ' + name)
    verify(inner_root / name, expected['sha256'], expected['bytes'])
    result['files'][name] = expected['sha256']
if len(result['files']) != 180:
    raise SystemExit('Require exactly 180 result entries')
unchanged = copy.deepcopy(result)
for name in contract['extensions']:
    del unchanged['files'][name]
if unchanged != base:
    raise SystemExit('The extension changed original metadata')
payload = (json.dumps(result, indent=2) + '\n').encode()
# Exclusive creation; no replacement or mutation of the original pin file.
with a.output.open('xb') as output:
    output.write(payload)
    output.flush()
    os.fsync(output.fileno())
print(json.dumps({'scope': 'stream-verified fixture metadata only; no CAD qualification',
                  'output': str(a.output), 'files': len(result['files']),
                  'sha256': hashlib.sha256(payload).hexdigest(),
                  'source': result['source'], 'desktop': result['desktop']}))
