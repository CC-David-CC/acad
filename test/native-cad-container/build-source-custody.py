#!/usr/bin/env python3
"""Read a completed build's bytes against its exact source commit.

This is build custody, not a geometry, Native behavior or browser qualification.
The caller retains stdout/stderr and supplies a new output filename.
"""
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys


def require(condition, message):
    if not condition:
        raise ValueError(message)


def digest(path):
    require(path.is_file() and not path.is_symlink(), 'Regular file required: ' + str(path))
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def main(root, commit, output):
    require(re.fullmatch(r'[a-f0-9]{40}', commit), 'Full source commit required')
    require(not output.exists(), 'Preserve first custody report')
    root = root.resolve(strict=True)

    def git(*args):
        return subprocess.check_output(['git', '-C', str(root), *args])

    def current():
        require(git('rev-parse', 'HEAD').decode().strip() == commit, 'Producer HEAD changed')
        require(not git('status', '--porcelain', '--untracked-files=no'), 'Tracked producer modified')

    current()
    bootstrap_path = 'modules/engine/mount/oci-verified-worker.js'
    bootstrap = digest(root / bootstrap_path)
    require(hashlib.sha256(git('show', commit + ':' + bootstrap_path)).hexdigest() == bootstrap,
            'Exact bootstrap Git blob differs')
    names = ('polygon-profile mechanical-profile boolean-history revolve-profile '
             'sweep-profile loft-profile adaptive-metrology step-export '
             'manufacturing-mesh shell circular mechanical-native').split()
    components, sources = [], {}
    for name in names:
        directory = root / '.build' / (name + '-assets')
        manifest_path = directory / 'component.json'
        manifest_digest = digest(manifest_path)
        manifest = json.loads(manifest_path.read_text())
        require(manifest['bootstrapSha256'] == bootstrap, 'Component bootstrap source differs')
        require(isinstance(manifest.get('files'), dict) and manifest['files'], 'Missing file roster')
        require(isinstance(manifest.get('sources'), dict) and manifest['sources'], 'Missing source roster')
        for relative, metadata in manifest['files'].items():
            path = Path(relative)
            require(not path.is_absolute() and '..' not in path.parts, 'Nonlocal component file')
            actual = directory / path
            require(actual.stat().st_size == metadata['bytes'], 'File length differs: ' + relative)
            require(digest(actual) == metadata['sha256'], 'File digest differs: ' + relative)
        for relative, expected in manifest['sources'].items():
            path = Path(relative)
            require(not path.is_absolute() and '..' not in path.parts, 'Nonlocal source path')
            require(manifest['files'][relative]['sha256'] == expected, 'Source/file roster disagreement')
            require(digest(root / path) == expected, 'Producer source differs: ' + relative)
            if relative not in sources:
                raw = git('show', commit + ':' + relative)
                require(hashlib.sha256(raw).hexdigest() == expected, 'Exact Git blob differs: ' + relative)
                sources[relative] = expected
            require(sources[relative] == expected, 'Cross-component source disagreement: ' + relative)
        require(digest(manifest_path) == manifest_digest, 'Component manifest changed')
        components.append(dict(component=name, manifestSha256=manifest_digest,
                               format=manifest['format'], bootstrapSha256=manifest['bootstrapSha256'],
                               workerSha256=manifest['workerSha256'], jsSha256=manifest['jsSha256'],
                               wasmSha256=manifest['wasmSha256'], sourceCount=len(manifest['sources']),
                               fileCount=len(manifest['files'])))
    current()
    report = dict(scope='completed build source/byte custody only; no Native or browser qualification',
                  core=commit, trackedSourceClean=True, components=components,
                  bootstrapSourceSha256=bootstrap,
                  actualSourceGitBlobSha256=sources, sourceCount=len(sources),
                  auditSourceSha256=digest(Path(__file__).resolve()))
    with output.open('x') as stream:
        json.dump(report, stream, indent=2)
        stream.write('\n')
    print(json.dumps(dict(scope=report['scope'], core=commit,
                          components=len(components), uniqueSources=len(sources), output=str(output))))


if __name__ == '__main__':
    main(Path(sys.argv[1]), sys.argv[2], Path(sys.argv[3]))
