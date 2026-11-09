#!/usr/bin/env python3
"""Freeze custody of already-produced diagnostic inputs; runs no CAD/library code."""
import argparse
import hashlib
import json
import subprocess
from pathlib import Path


def record(path):
    digest = hashlib.sha256()
    size = 0
    with path.open('rb') as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b''):
            digest.update(chunk)
            size += len(chunk)
    return {'bytes': size, 'sha256': digest.hexdigest()}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('evidence', type=Path)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    own = Path(__file__).resolve().parent
    root = own.parents[2]
    report = json.loads((own / 'actual-report.json').read_bytes())
    files = ['whole/receipt.json', 'first-oracle.json', 'after-whole-first.log',
             'reader-node24-r2.json', 'reader-source.json', 'FIRST-READER-FAILURE.json']
    files += ['whole/' + item['file'] for item in report['files']]
    result = {
        'role': 'custody-only; diagnostic inputs, not acceptance results',
        'baseCommit': 'f3da26bbe150524e99d3173bc2ac6458b47dd8cd',
        'evidenceCommit': '1991418d35b0a156fb906d6b81f57e3d5ce25457',
        'evidenceRoot': str(args.evidence.resolve()),
        'inputs': {name: record(args.evidence / name) for name in files},
        'diagnosticFiles': {name: record(own / name) for name in
                            ['diagnose_mesh.py', 'actual-report.json',
                             'summarize_wall.py', 'wall-statistics.json',
                             'freeze_inputs.py']},
        'oracleSource': {},
        'producingTuple': {name: report[name] for name in
                           ['source', 'hostSource', 'acceptance', 'engineRevision']},
    }
    for name in ['mesh_oracle.py', 'check.py', 'desktop-driver.mjs', 'CONTRACT.md']:
        relative = 'test/selected-profile-extents-workflow/' + name
        raw = subprocess.check_output(['git', '-C', str(root), 'show',
                                       result['baseCommit'] + ':' + relative])
        blob = subprocess.check_output(['git', '-C', str(root), 'rev-parse',
                                        result['baseCommit'] + ':' + relative]).decode().strip()
        result['oracleSource'][relative] = {'gitBlob': blob, 'bytes': len(raw),
                                           'sha256': hashlib.sha256(raw).hexdigest()}
    with args.output.open('x', encoding='utf-8') as target:
        json.dump(result, target, indent=2)
        target.write('\n')


if __name__ == '__main__':
    main()
