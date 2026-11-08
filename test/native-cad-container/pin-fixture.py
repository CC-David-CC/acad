#!/usr/bin/env python3
"""Record actual fixture bytes after normal build/staging; no CAD qualification.

Preserve the previous receipt's explicitly selected files, resolving changed
Worker content hashes from the new manifest. Never substitute its old digests.
Also pin every newly emitted authored-history state module.
"""
import argparse, hashlib, json, re, subprocess
from pathlib import Path

p = argparse.ArgumentParser(description=__doc__)
p.add_argument('--apps', type=Path, required=True)
p.add_argument('--core-source', type=Path, required=True)
p.add_argument('--desktop-source', type=Path, required=True)
p.add_argument('--previous-receipt', type=Path, required=True)
p.add_argument('--output', type=Path, required=True)
a = p.parse_args()
if a.output.exists():
    raise SystemExit('Preserve previous pins; select a fresh output')

def head(root):
    dirty = subprocess.check_output(['git', '-C', str(root), 'status', '--porcelain', '--untracked-files=no'], text=True)
    if dirty:
        raise SystemExit('Tracked source must be clean before recording pins')
    return subprocess.check_output(['git', '-C', str(root), 'rev-parse', 'HEAD'], text=True).strip()

def digest(file):
    h = hashlib.sha256()
    with file.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()

catalog = json.loads((a.apps / 'apps.json').read_text())['apps']
def app(name):
    matches = [row for row in catalog if row['id'] == name]
    if len(matches) != 1:
        raise SystemExit('Require exactly one real ' + name + ' app')
    row = matches[0]
    if digest(a.apps / row['path']) != row['sha256']:
        raise SystemExit('App entry bytes differ from builder manifest')
    return row

cad, files = app('jsketcher'), app('files')
prefix = 'node_modules/jsketcher-build/'
inner = {key[len(prefix):]: value for key, value in cad['files'].items() if key.startswith(prefix)}
old = json.loads(a.previous_receipt.read_text())['pins']['files']
selected = {}
for key in old:
    if key.startswith('/'):
        selected[key] = digest(a.desktop_source / 'active-system' / key.lstrip('/'))
        continue
    marker = re.sub(r'(?<=\.)[a-f0-9]{20}(?=\.js$)', '@HASH@', key)
    pattern = re.escape(marker).replace('@HASH@', '[a-f0-9]{20}')
    matches = [name for name in inner if re.fullmatch(pattern, name)]
    if len(matches) != 1:
        raise SystemExit('Require one actual manifest asset for ' + key)
    selected[matches[0]] = inner[matches[0]]['sha256']
for key, pin in inner.items():
    if key.endswith('/authoredHistoryState.mjs'):
        selected[key] = pin['sha256']
base = (a.apps / cad['path']).parent / prefix
for key, expected in selected.items():
    if not key.startswith('/') and digest(base / key) != expected:
        raise SystemExit('Actual inner fixture bytes differ: ' + key)
summary = lambda row: {key: row[key] for key in ['bundleSHA256', 'sha256', 'path']}
result = {'outer': summary(cad), 'filesApp': summary(files), 'files': selected,
          'source': head(a.core_source), 'desktop': head(a.desktop_source)}
a.output.write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({'scope': 'actual build metadata only; no qualification',
                  'files': len(selected), 'source': result['source'], 'desktop': result['desktop']}))
