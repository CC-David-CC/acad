#!/usr/bin/env python3
"""Record isolated native acquisition; verify .deb bytes against apt metadata.

Run after the hash-required wheel acquisition/install and apt download/extraction.
Package identities come from control metadata, not epoch-escaped local filenames.
"""
import argparse
import hashlib
import json
from pathlib import Path
import platform
import subprocess


def fields(text):
    return {line.split(':', 1)[0]: line.split(':', 1)[1].strip()
            for line in text.splitlines()
            if line and not line.startswith(' ') and ':' in line}


def run(base):
    paragraphs = (base/'apt-package-metadata.txt').read_text().strip().split('\n\n')
    metadata = [fields(p) for p in paragraphs]
    expected = {(m['Package'], m['Version']): m for m in metadata if 'Filename' in m}
    records = []
    required_wheel_hashes = {line.split('--hash=sha256:')[1].strip()
                             for line in (base/'requirements-native.txt').read_text().splitlines()
                             if '--hash=sha256:' in line}
    wheel_hashes = set()
    for kind in ('debs', 'wheels'):
        for path in sorted((base/kind).iterdir()):
            digest = hashlib.sha256(path.read_bytes()).hexdigest()
            row = {'file': str(path.relative_to(base)), 'bytes': path.stat().st_size,
                   'sha256': digest}
            if kind == 'debs':
                control = fields(subprocess.check_output(
                    ['dpkg-deb', '-f', str(path), 'Package', 'Version'], text=True))
                meta = expected[(control['Package'], control['Version'])]
                if digest != meta['SHA256'] or path.stat().st_size != int(meta['Size']):
                    raise ValueError('apt metadata mismatch: '+str(path))
                row.update(package=meta['Package'], version=meta['Version'],
                           aptIndexHashMatches=True)
            else:
                if digest not in required_wheel_hashes:
                    raise ValueError('wheel not in hashed requirements: '+str(path))
                wheel_hashes.add(digest)
            records.append(row)
    if wheel_hashes != required_wheel_hashes:
        raise ValueError('incomplete wheel acquisition')
    report = {'role': 'isolated native validator acquisition; no CAD runtime change',
              'python': platform.python_version(), 'platform': platform.platform(),
              'artifacts': records,
              'compiler': subprocess.check_output(['c++', '--version'], text=True).splitlines()[0],
              'cmake': subprocess.check_output(['cmake', '--version'], text=True).splitlines()[0],
              'pythonDistributions': json.loads(subprocess.check_output(
                  [str(base/'venv/bin/python'), '-m', 'pip', 'list', '--format=json'], text=True))}
    for name in ('gmp', 'mpfr'):
        path = next(Path('/lib/x86_64-linux-gnu').glob('lib'+name+'.so.*')).resolve()
        report.setdefault('existingRuntimeLibraries', []).append({
            'path': str(path), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()})
    configs = list((base/'prefix').rglob('CGALConfig.cmake'))
    report['cgalConfigs'] = [str(p) for p in configs]
    report['scriptSHA256'] = hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
    with (base/'acquisition.json').open('x') as stream:
        json.dump(report, stream, indent=2)
        stream.write('\n')
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('environment', type=Path)
    run(parser.parse_args().environment)
