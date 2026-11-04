#!/usr/bin/env python3
"""Build a pinned jSketcher runtime for local experiments only.

This deliberately does not assert that the prebuilt OCCT Wasm has complete
corresponding source. Do not deploy the result until its provenance and all
runtime dependency obligations have been independently reviewed.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import stat
import subprocess
import tempfile
import zipfile
import xml.etree.ElementTree as ET

HERE = Path(__file__).resolve().parent
# Update only after reviewing the fork commit and the generated manifest.
FORK_COMMIT = '794c14a36d706a86ac3d834a536f97c34cc99e2f'
DEFAULT_REPOSITORY = 'example.invalid:/srv/data/git/JSKetcher.git'
ENGINE_COMMIT = '5efaf53accb45bac475155fc4d5552642c19e91e'
ENGINE_REPOSITORY = 'https://github.com/Autodrop3d/occt-interpreter.git'
ENGINE_SHA256 = {'occt.wasm': 'fee4624786bb114de1d381340f05f0cdf47e6700b9fd62ef8a5dace82c8fda77',
                 'occt.js': '3c56e74e6e08411436a68fb930bab38aedd3137e4369af2bc67fd382e568787e'}
# The shipped 2.1.1 build differs from upstream only by whitespace. Check
# both assets so a future version cannot silently reuse an unrelated notice.
PNLTRI_ASSET_SHA256 = '216d497c825d96a4c03ff387fa80feb0696b063ef8f3d76ab9521a5c6fcd129f'
PNLTRI_NOTICE_SHA256 = '3898350fd0df396d2045f5cabb7c9b52859ca6ec274ff2f6e0d30b3ef97b3a75'
PNLTRI_NOTICE = HERE / 'notices' / 'pnltri-MIT.txt'
# Byte-pinned vendored library and separately supplied upstream notices.
OTHER_VENDOR_INPUTS = {
    'lib/verb.js': ('55f13091a656c635d1ebe3931a9b52236c65023549b7b69bc8278362f87686f3', [
        ('verb-MIT.txt', 'VERB-LICENSE.txt', 'ecb6d0b090a248f5e3845fad33da9ed29aa170fd624e107d16a95f0e18b81e01')]),
    'lib/diff_match_patch.js': ('aac7655a215d8448d95d9871e8d8a40ac3d9aaf38d81ab2ccc43c1cd267b8fa3', [
        ('diff-match-patch-APACHE.txt', 'DIFF-MATCH-PATCH-LICENSE.txt', 'cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30'),
        ('diff-match-patch-header.txt', 'DIFF-MATCH-PATCH-COPYRIGHT.txt', '599ebff195998ef66252e80d07398d206e3c71f26e30a1676f86c2b19122a750')]),
}
CLIPPER_PACKAGE_SHA256 = '7b5f0993132342745915a54bebabaed842b7b5e13fb1f8f9fcbcefc5311c5845'
CLIPPER_NOTICES = [
    ('boost-1.0.txt', 'CLIPPER-LIB-BOOST-LICENSE.txt', 'c9bff75738922193e67fa726fa225535870d2aa1059f91452c411736284ad566'),
    ('clipper-lib-header.txt', 'CLIPPER-LIB-COPYRIGHT.txt', '1ea23a0f50d2885c7d9f71c9d5f22d8e021bbefff3084582078e0a7924a6603e'),
]
VENDOR_NOTICE_DIR = HERE / 'notices'
REGENERATOR_PACKAGE_FILE = 'babel-polyfill/node_modules/regenerator-runtime/runtime.js'
REGENERATOR_PACKAGE_SHA256 = 'c79f77316587802b9788b06f4b1a69caac03367a20ee27c984e3767082aaa9ca'
REGENERATOR_NOTICES = [
    ('regenerator-runtime-BSD.txt', 'REGENERATOR-RUNTIME-LICENSE.txt', 'acacd15e10610fc0aca63c3e09ba85910c302f17f4175ec3e5bb76ab5cba0de8'),
    ('regenerator-runtime-PATENTS.txt', 'REGENERATOR-RUNTIME-PATENTS.txt', '5663cbf7746947ee91d02c6d45163694238bd07ceadcfc3f6dab2fbe23b85b86'),
]

# A specific local research build, not an independently reproducible artifact.
ENGINE_TREE = 'f820351dd52207a3ad757bdeaf5510f7b4ae01fc'
ENGINE_SOURCE_NOTICES = {
    'LICENSE': ('OCCT-INTERPRETER-LICENSE.txt', 'edbdb645c995925144afe5aac6b405c58ede5ff03e7f50ed6e5edff5223ef679'),
    'occt/LICENSE_LGPL_21.txt': ('OCCT-LGPL-2.1.txt', 'e237fa56668030e928551ddd60f05df5fe957f75eab874bbd017e085ed722e7c'),
    'occt/OCCT_LGPL_EXCEPTION.txt': ('OCCT-exception.txt', '04580a884ea6cea294402649ff7b5cbb167d47462d1340a4ed33e550db10a81b'),
}
OCCT_SOURCE_INPUTS = {'occt.js': ENGINE_SHA256['occt.js'],
                      'occt.wasm': 'a2b2f7daf6a4eb98b975f8aec136f6cbaf2720295ea32e71edb13ff4c5ceaecb',
                      'build-receipt.json': 'c060fade266b5d33c8170f13c56f781be9493c3352e27715a3fc6804c27f0a00'}
NUMERIC_REPOSITORY = 'https://github.com/sloisel/numeric.git'
NUMERIC_COMMIT = '656fa1254be540f428710738ca9c1539625777f1'  # upstream tag v1.2.6
NUMERIC_INPUT_SHA256 = '5dcaba2016fd237091e3a17b0dc272fb21f0e2b15d7628f95a0ad0cd4cdf4020'
NUMERIC_NOTICE_SHA256 = {
    'license.txt': '0e94aada97f12dee6118064add9170484c55022f5d53206ee4407143cd36ddcd',
    'resources/LICENSE.quadprog': 'a96e914967c28cbfed070a5a94fa7c670205a657751fa7dd707df8e922d2d904',
}
# Research-only artifacts independently rebuilt twice on the same R730 toolchain.
MANIFOLD_COMMIT = '31afd71d17c7a94cfaeada83f657d7b42628ead6'
CLIPPER_COMMIT = '46f639177fe418f9689e8ddb74f08a870c71f5b4'
MANIFOLD_INPUTS = {
    'manifold.js': 'cd2031fd75cbbc812b550dd228f95b9fd666ae4da6557f840e3d3ed4cbed268b',
    'manifold.wasm': '7bb5f8ee10fcafdab78799b1e5dd2cdc7c282ea0bf8e7939c43f3ad34b823e3d',
    'manifold-source.zip': 'bbbf63586ccdc4d7074597095b518a7f4b08d7e244cdbcb276279f2253657ea1',
    'clipper2-source.zip': 'd33522abf638b382ecfdcc6f8cbe03e038b4142109b1d96fdc2a1a168d3f050c',
    'build-receipt.json': 'ca18607ef22692fb56e43be41dd2e33431d108b4fc1a7618b0c3258f105afd8b',
}
DESTINATION = HERE / 'node_modules' / 'jsketcher-build'
PREFIX = 'node_modules/jsketcher-build/'
PUBLIC_SUFFIXES = {'.js', '.html', '.json', '.css', '.wasm', '.svg', '.png',
                   '.jpg', '.jpeg', '.gif', '.ico', '.woff', '.woff2', '.ttf',
                   '.eot', '.txt'}
SAFE = re.compile(r'^(?:[a-zA-Z0-9_@+-][a-zA-Z0-9_@+.-]*/)*[a-zA-Z0-9_@+-][a-zA-Z0-9_@+.-]*$')


def run(*args, cwd=None, stdout=None, env=None):
    subprocess.run(args, cwd=cwd, check=True, stdout=stdout, env=env)


def sha256_file(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()



def copy_checked_input(source, target, expected):
    """Snapshot a regular, non-symlink input and hash the bytes actually copied."""
    fd = os.open(source, os.O_RDONLY | os.O_NOFOLLOW | os.O_CLOEXEC | os.O_NONBLOCK)
    try:
        source_stat = os.fstat(fd)
        if not stat.S_ISREG(source_stat.st_mode) or source_stat.st_size > 64 * 1024 * 1024:
            raise RuntimeError('OCCT research input is not a suitably sized regular file: ' + source.name)
        h = hashlib.sha256()
        with os.fdopen(fd, 'rb', closefd=False) as src, target.open('xb') as dst:
            for chunk in iter(lambda: src.read(1024 * 1024), b''):
                h.update(chunk)
                dst.write(chunk)
        if h.hexdigest() != expected:
            raise RuntimeError('OCCT research input differs from its pinned hash: ' + source.name)
    finally:
        os.close(fd)

def notices(node_modules, destination, index_bundle=None):
    """Collect installed package metadata and supplied notices, not source.

    This is intentionally broader than the deployed runtime: npm ci includes
    build dependencies. The archive does not establish which modules webpack
    included or whether the supplied notice files satisfy their licenses.
    """
    if node_modules.is_symlink() or not node_modules.is_dir():
        raise RuntimeError('Installed npm package directory is missing or symlinked')
    package_data = []
    metadata_errors = []
    # pathlib does not descend through package-directory symlinks. Record
    # those explicitly so they cannot silently disappear from the inventory.
    module_roots = [node_modules, *sorted(node_modules.rglob('node_modules'))]
    for module_root in module_roots:
        if module_root.is_symlink():
            metadata_errors.append({'path': module_root.relative_to(node_modules).as_posix(), 'reason': 'symlinked node_modules directory'})
            continue
        if not module_root.is_dir():
            continue
        for child in sorted(module_root.iterdir()):
            if child.name.startswith('.'):
                continue
            if child.is_symlink():
                metadata_errors.append({'path': child.relative_to(node_modules).as_posix(), 'reason': 'symlinked package or scope directory'})
            elif child.name.startswith('@') and child.is_dir():
                for scoped in sorted(child.iterdir()):
                    if scoped.is_symlink():
                        metadata_errors.append({'path': scoped.relative_to(node_modules).as_posix(), 'reason': 'symlinked package directory'})
    candidates = set()
    unresolved = []
    module_ids = []
    if index_bundle is not None:
        # Development webpack bundles expose module IDs in comments. This is
        # a review aid, not a complete or authoritative dependency graph:
        # external scripts, build transforms and alternate bundles are absent.
        code = index_bundle.read_text(encoding='utf-8')
        module_ids = sorted(set(re.findall(r'/\*{3}/\s*"(\./node_modules/[^"?]+)":', code)))
        for module_id in module_ids:
            # The fork's build-time precompiler emits a generated module at
            # this exact path from the separately hash-checked npm numeric
            # input. Associate it with numeric for the notice review, while
            # recording the alias rather than pretending it is unmodified.
            if module_id == './node_modules/.cache/codi-numeric/precompiled.js':
                numeric_metadata = node_modules / 'numeric' / 'package.json'
                try:
                    numeric_package = json.loads(numeric_metadata.read_text(encoding='utf-8'))
                except (OSError, ValueError, UnicodeDecodeError):
                    numeric_package = {}
                if numeric_package.get('name') == 'numeric' and numeric_package.get('version') == '1.2.6':
                    candidates.add('numeric')
                    continue
            current = (node_modules.parent / module_id).parent
            found = False
            while current.is_relative_to(node_modules):
                metadata = current / 'package.json'
                if metadata.is_file() and not metadata.is_symlink():
                    try:
                        parsed = json.loads(metadata.read_text(encoding='utf-8'))
                    except (ValueError, UnicodeDecodeError):
                        parsed = {}
                    if isinstance(parsed, dict) and isinstance(parsed.get('name'), str) and parsed.get('version'):
                        candidates.add(current.relative_to(node_modules).as_posix())
                        found = True
                        break
                current = current.parent
            if not found:
                unresolved.append(module_id)
    with zipfile.ZipFile(destination, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
        def add(name, contents):
            info = zipfile.ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, contents)
        for metadata in sorted(node_modules.rglob('package.json')):
            package = metadata.parent
            # A package root is directly under node_modules, or under one
            # npm scope. Ignore package.json files used for package subpaths.
            if package.parent.name != 'node_modules' and not (
                    package.parent.name.startswith('@') and package.parent.parent.name == 'node_modules'):
                continue
            rel = metadata.parent.relative_to(node_modules).as_posix()
            if metadata.is_symlink() or any(p.is_symlink() for p in metadata.parents if p != node_modules.parent):
                metadata_errors.append({'path': rel, 'reason': 'symlinked metadata or ancestor'})
                continue
            try:
                data = json.loads(metadata.read_text(encoding='utf-8'))
            except (OSError, ValueError, UnicodeDecodeError):
                metadata_errors.append({'path': rel, 'reason': 'unreadable or invalid package.json'})
                continue
            if not isinstance(data, dict) or not isinstance(data.get('name'), str):
                metadata_errors.append({'path': rel, 'reason': 'package name is missing or invalid'})
                continue
            entry = {'path': rel, 'name': data['name'], 'version': data.get('version'),
                     'license': data.get('license'), 'repository': data.get('repository'), 'noticeFiles': [],
                     'supplementalFiles': [], 'webpackCandidate': rel in candidates}
            add('metadata/' + rel + '/package.json', metadata.read_bytes())
            for license_file in sorted(metadata.parent.iterdir()):
                if not license_file.is_file() or license_file.is_symlink() or license_file.stat().st_size > 1024 * 1024:
                    continue
                if not re.match(r'^(license|licence|copying|notice)(?:[._-].*)?$', license_file.name, re.I):
                    continue
                add('licenses/' + rel + '/' + license_file.name, license_file.read_bytes())
                entry['noticeFiles'].append(license_file.name)
            # Some packages place attribution in a README or source header
            # rather than a separate license file. Preserve supplied evidence
            # for review; its presence does not establish license compliance.
            if not entry['noticeFiles']:
                extras = [file for file in package.iterdir()
                          if file.name.lower() in {'readme', 'readme.md', 'readme.txt'}]
                main = data.get('main')
                if isinstance(main, str) and main:
                    candidate = package / main
                    extras.extend([candidate, package / (main + '.js'), candidate / 'index.js'])
                for file in sorted(set(extras)):
                    if not file.is_relative_to(package) or not file.is_file() or file.is_symlink() or not file.resolve().is_relative_to(package.resolve()):
                        continue
                    if any(parent.is_symlink() for parent in file.parents if parent.is_relative_to(package)):
                        continue
                    if file.stat().st_size > 1024 * 1024:
                        continue
                    file_rel = file.relative_to(package).as_posix()
                    if '..' in Path(file_rel).parts:
                        continue
                    add('supplemental/' + rel + '/' + file_rel, file.read_bytes())
                    entry['supplementalFiles'].append(file_rel)
            package_data.append(entry)
        add('packages.json', json.dumps(package_data, indent=2, sort_keys=True) + '\n')
        missing = [item for item in package_data if not item['noticeFiles'] or
                   not isinstance(item['version'], str) or not item['version'].strip() or
                   not isinstance(item['license'], str) or not item['license'].strip()]
        add('needs-review.json', json.dumps(missing, indent=2, sort_keys=True) + '\n')
        add('metadata-errors.json', json.dumps(metadata_errors, indent=2, sort_keys=True) + '\n')
        add('webpack-candidates.json', json.dumps({'scope': 'heuristic module IDs from static/index.bundle.js only',
            'moduleIds': module_ids, 'packagePaths': sorted(candidates), 'unresolved': unresolved,
            'generatedAliases': {'./node_modules/.cache/codi-numeric/precompiled.js': 'numeric@1.2.6'}}, indent=2) + '\n')
        add('README.txt', 'Installed npm package metadata and supplied notices, including build-time packages. For packages without a separate notice, supplemental/ may contain their supplied README and entry point as evidence for review. This is not a complete corresponding-source archive. needs-review.json lists entries without a separate matched notice file or nonempty string version and license metadata; metadata-errors.json lists package roots whose metadata could not be inventoried. webpack-candidates.json heuristically maps development webpack module IDs from the main bundle; it is not a complete dependency graph, excludes standalone web/lib scripts and OCCT assets, and may miss loader or generated modules. Review all runtime dependencies and vendored web/lib scripts independently.\n')


# Runtime candidates whose package archives lacked complete notice metadata.
# Keep the exact installed package contents as evidence; this is not a claim
# that generated npm packages contain all preferred source or license terms.
MDI_LICENSE_SHA256 = '453b87202c008eac411015ddde3320dd93502e198d4d7e8a579eac8421ab4e81'
MDI_SVG_SHA256 = {'check.svg': '55e1f855014f31e49e3375fb102409a5f350abc58451deb27ad2e7b60afbdf69',
                   'unfold-more-horizontal.svg': '31ae0360f0e9896ad39fc8518cb8b8d86638210cb418aa96312920f58ac221c3'}
MDI_COMPONENTS = {'CheckIcon.js', 'UnfoldMoreHorizontalIcon.js'}

REVIEW_SOURCE_PACKAGES = {
    'babel-polyfill/node_modules/regenerator-runtime': ('regenerator-runtime', '0.10.5'),
    'clipper-lib': ('clipper-lib', '6.2.1'),
    'component-emitter': ('component-emitter', '1.1.3'),
    'numeric': ('numeric', '1.2.6'),
    'react-color/node_modules/@icons/material': ('@icons/material', '0.2.4'),
    'stream': ('stream', '0.0.2'),
    'timers': ('timers', '0.1.1'),
}

def review_package_sources(node_modules, destination):
    total = 0
    with zipfile.ZipFile(destination, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
        for relative, (name, version) in sorted(REVIEW_SOURCE_PACKAGES.items()):
            package = node_modules / relative
            if any(part.is_symlink() for part in (package, *package.parents) if part != node_modules.parent):
                raise RuntimeError('Symlink in candidate source package: ' + relative)
            data = json.loads((package / 'package.json').read_text(encoding='utf-8'))
            if data.get('name') != name or data.get('version') != version:
                raise RuntimeError('Candidate source package differs from reviewed version: ' + relative)
            for item in sorted(package.rglob('*')):
                if item.is_symlink():
                    raise RuntimeError('Symlink in candidate source package: ' + str(item))
                if not item.is_file():
                    continue
                # No nested dependencies; each independently reviewed package
                # is listed explicitly above.
                path = item.relative_to(package)
                if 'node_modules' in path.parts:
                    continue
                if relative == 'react-color/node_modules/@icons/material' and path.as_posix() not in {
                    'package.json', 'README.md', 'transform.js', 'CheckIcon.js', 'UnfoldMoreHorizontalIcon.js',
                    'svg/check.svg', 'svg/unfold-more-horizontal.svg',
                }:
                    continue
                size = item.stat().st_size
                total += size
                if size > 8 * 1024 * 1024 or total > 64 * 1024 * 1024:
                    raise RuntimeError('Candidate source archive exceeds its size bound')
                info = zipfile.ZipInfo(relative + '/' + path.as_posix(), date_time=(1980, 1, 1, 0, 0, 0))
                info.compress_type = zipfile.ZIP_DEFLATED
                info.external_attr = 0o100644 << 16
                archive.writestr(info, item.read_bytes())

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo', default=DEFAULT_REPOSITORY, help='Git source containing the pinned fork commit')
    parser.add_argument('--engine-repo', default=ENGINE_REPOSITORY, help='Git source containing the pinned interpreter commit')
    parser.add_argument('--numeric-repo', default=NUMERIC_REPOSITORY, help='Git source containing the pinned numeric 1.2.6 commit')
    parser.add_argument('--manifold-research-input', type=Path, required=True, help='Hash-pinned local-only source-built Manifold artifacts and source archives')
    parser.add_argument('--occt-source-research-input', type=Path, help='Optional exact local source-built OCCT candidate and receipt; experimental use only')
    parser.add_argument('--update-manifest', action='store_true', help='Write a reviewed candidate asset manifest')
    parser.add_argument('--experimental-local-only', action='store_true', help='Acknowledge this build is not cleared for public distribution')
    args = parser.parse_args()
    if not args.experimental_local_only:
        parser.error('jSketcher runtime source/license review is incomplete; pass --experimental-local-only for local tests only')
    manifold_input = args.manifold_research_input.resolve(strict=True)
    for name, expected in MANIFOLD_INPUTS.items():
        file = manifold_input / name
        if file.is_symlink() or not file.is_file() or sha256_file(file) != expected:
            raise RuntimeError('Manifold research input differs from its pinned hash: ' + name)
    receipt = json.loads((manifold_input / 'build-receipt.json').read_text())
    if (receipt.get('manifoldCommit') != MANIFOLD_COMMIT or receipt.get('clipperCommit') != CLIPPER_COMMIT
            or receipt.get('jsSha256') != MANIFOLD_INPUTS['manifold.js']
            or receipt.get('wasmSha256') != MANIFOLD_INPUTS['manifold.wasm']
            or receipt.get('flags') != ['-sDYNAMIC_EXECUTION=0', '-sEMBIND_AOT=1']):
        raise RuntimeError('Manifold source-build receipt is inconsistent')
    code = (manifold_input / 'manifold.js').read_text()
    if 'new Function(' in code or re.search(r'\beval\s*\(', code):
        raise RuntimeError('Manifold research input contains dynamic evaluation')
    with tempfile.TemporaryDirectory(prefix='codi-jsketcher-prepare-') as scratch:
        occt_input = None
        occt_receipt = None
        if args.occt_source_research_input is not None:
            source_input = args.occt_source_research_input
            if source_input.is_symlink() or not source_input.is_dir():
                raise RuntimeError('OCCT research input must be a real directory')
            occt_input = Path(scratch) / 'occt-input'
            occt_input.mkdir()
            for name, expected in OCCT_SOURCE_INPUTS.items():
                copy_checked_input(source_input / name, occt_input / name, expected)
            occt_receipt = json.loads((occt_input / 'build-receipt.json').read_text())
            if (occt_receipt.get('interpreterCommit') != ENGINE_COMMIT or
                    occt_receipt.get('interpreterTree') != ENGINE_TREE or
                    occt_receipt.get('jsSHA256') != OCCT_SOURCE_INPUTS['occt.js'] or
                    occt_receipt.get('wasmSHA256') != OCCT_SOURCE_INPUTS['occt.wasm'] or
                    occt_receipt.get('npmWasmSHA256') != ENGINE_SHA256['occt.wasm'] or
                    occt_receipt.get('bitwiseMatchesNpm') is not False or
                    occt_receipt.get('independentRebuildsMatch') is not False or
                    occt_receipt.get('licenseCleared') is not False or occt_receipt.get('localOnly') is not True):
                raise RuntimeError('OCCT source-build receipt is inconsistent')
        root = Path(scratch) / 'source'
        root.mkdir()
        run('git', 'init', '--quiet', str(root))
        run('git', '-C', str(root), 'fetch', '--quiet', '--depth=1', args.repo, FORK_COMMIT)
        run('git', '-C', str(root), 'checkout', '--quiet', '--detach', 'FETCH_HEAD')
        actual = subprocess.check_output(['git', '-C', str(root), 'rev-parse', 'HEAD'], text=True).strip()
        if actual != FORK_COMMIT:
            raise RuntimeError('The fetched jSketcher commit does not match the pin')
        run('npm', 'ci', '--ignore-scripts', '--no-audit', '--no-fund', cwd=root)
        for name, expected in ENGINE_SHA256.items():
            file = root / 'node_modules' / 'jsketcher-occ-engine' / name
            if hashlib.sha256(file.read_bytes()).hexdigest() != expected:
                raise RuntimeError('jsketcher-occ-engine artifact hash differs: ' + name)
        if occt_input is not None:
            for name in ('occt.js', 'occt.wasm'):
                out = root / 'node_modules' / 'jsketcher-occ-engine' / name
                shutil.copyfile(occt_input / name, out)
                if sha256_file(out) != OCCT_SOURCE_INPUTS[name]:
                    raise RuntimeError('Copied OCCT artifact hash mismatch: ' + name)
        numeric_input = root / 'node_modules' / 'numeric' / 'numeric-1.2.6.js'
        if sha256_file(numeric_input) != NUMERIC_INPUT_SHA256:
            raise RuntimeError('numeric 1.2.6 package source differs from the reviewed input')
        run('node', 'build/precompile-numeric.cjs', cwd=root)
        manifold_cache = root / 'node_modules' / '.cache' / 'codi-manifold'
        manifold_cache.mkdir(parents=True)
        for name in ('manifold.js', 'manifold.wasm'):
            shutil.copyfile(manifold_input / name, manifold_cache / name)
            if sha256_file(manifold_cache / name) != MANIFOLD_INPUTS[name]:
                raise RuntimeError('Copied Manifold artifact hash mismatch: ' + name)
        env = dict(os.environ, CODI_EMBED_NUMERIC='1', CODI_EMBED_MANIFOLD='1')
        run('npm', 'run', 'build', cwd=root, env=env)
        built = root / 'dist'
        if not (built / 'index-webos.html').is_file():
            raise RuntimeError('Pinned build did not produce index-webos.html')
        staging = Path(scratch) / 'jsketcher-build'
        staging.mkdir()
        for name in ('manifold-source.zip', 'clipper2-source.zip', 'build-receipt.json'):
            shutil.copyfile(manifold_input / name, staging / ('manifold-build-receipt.json' if name == 'build-receipt.json' else name))
        # Explicit public types only; skip development maps, standalone Sketcher,
        # upstream HTML with remote fonts, docs sources, and generated test code.
        for source in sorted(built.rglob('*')):
            if source.is_symlink():
                raise RuntimeError('Unexpected symlink in generated runtime: ' + str(source))
            if not source.is_file():
                continue
            rel = source.relative_to(built)
            if rel.name in {'.rev', 'index.html', 'sketcher.html', 'sketcher.bundle.js', 'webosTest.bundle.js'} or source.suffix.lower() in {'.map', '.md', '.less', '.otf'}:
                continue
            if source.suffix.lower() not in PUBLIC_SUFFIXES or not SAFE.fullmatch(rel.as_posix()):
                raise RuntimeError('Unexpected public runtime asset: ' + str(rel))
            out = staging / rel
            out.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(source, out)
        for asset in ('index-webos.html', 'static/index.bundle.js', 'lib-assets/jsketcher-occ-engine/occt.js', 'lib-assets/jsketcher-occ-engine/occt.wasm'):
            if not (staging / asset).is_file():
                raise RuntimeError('Required runtime asset is missing: ' + asset)
        # The validator runs off the UI thread. Verify its closed-inventory
        # bundle is present and is exactly the one referenced by the app.
        worker_files = list((staging / 'static').glob('project-validator.*.js'))
        if len(worker_files) != 1 or not re.fullmatch(r'project-validator\.[0-9a-f]{20}\.js', worker_files[0].name):
            raise RuntimeError('Expected exactly one content-addressed project validator worker')
        if worker_files[0].name.encode() not in (staging / 'static/index.bundle.js').read_bytes():
            raise RuntimeError('Main bundle does not reference the packaged project validator worker')
        # The notice archive's candidate mapping examines the main bundle.
        # Fail for worker-only npm module IDs until that mapping is reviewed;
        # this heuristic does not replace a full dependency/source audit.
        module_pattern = r'/\*{3}/\s*"(\./node_modules/[^"?]+)":'
        main_modules = set(re.findall(module_pattern, (staging / 'static/index.bundle.js').read_text(encoding='utf-8')))
        worker_modules = set(re.findall(module_pattern, worker_files[0].read_text(encoding='utf-8')))
        if worker_modules - main_modules:
            raise RuntimeError('Validator has worker-only npm modules requiring notice review')
        # The two bundled @icons/material components originate in mdi-svg.
        # Exact svg bytes and the upstream license are pinned independently.
        icon_prefix = './node_modules/react-color/node_modules/@icons/material/'
        icon_modules = {name for name in main_modules | worker_modules if name.startswith(icon_prefix)}
        expected_icons = {icon_prefix + name for name in MDI_COMPONENTS}
        if icon_modules != expected_icons:
            raise RuntimeError('Material icon bundle differs from the reviewed icon set')
        icon_svg = root / 'node_modules/react-color/node_modules/@icons/material/svg'
        for name, digest in MDI_SVG_SHA256.items():
            if sha256_file(icon_svg / name) != digest:
                raise RuntimeError('Material icon SVG differs from reviewed mdi-svg input: ' + name)
        icon_root = icon_svg.parent
        for component, svg_name in [('CheckIcon.js', 'check.svg'), ('UnfoldMoreHorizontalIcon.js', 'unfold-more-horizontal.svg')]:
            if component not in MDI_COMPONENTS:
                continue  # Isolated fixture may supply an empty icon set.
            source = (icon_root / component).read_text(encoding='utf-8')
            values = re.findall(r"d:\s*['\"]([^'\"]+)", source)
            paths = [element.get('d') for element in ET.fromstring((icon_svg / svg_name).read_bytes()).iter() if element.tag.endswith('path')]
            if len(values) != 1 or values[0] not in paths:
                raise RuntimeError('Material icon component does not match its reviewed SVG: ' + component)
        mdi_license = VENDOR_NOTICE_DIR / 'mdi-svg-2.2.43-LICENSE.txt'
        if mdi_license.is_symlink() or sha256_file(mdi_license) != MDI_LICENSE_SHA256:
            raise RuntimeError('mdi-svg license differs from reviewed upstream input')
        shutil.copyfile(mdi_license, staging / 'MDI-SVG-LICENSE.txt')
        selected_engine = OCCT_SOURCE_INPUTS if occt_input is not None else ENGINE_SHA256
        for name in ('occt.js', 'occt.wasm'):
            if sha256_file(staging / 'lib-assets/jsketcher-occ-engine' / name) != selected_engine[name]:
                raise RuntimeError('Built OCCT artifact differs from selected input: ' + name)
        if sha256_file(staging / 'lib/pnltri.js') != PNLTRI_ASSET_SHA256:
            raise RuntimeError('Vendored PNLTRI differs from reviewed asset')
        if PNLTRI_NOTICE.is_symlink() or sha256_file(PNLTRI_NOTICE) != PNLTRI_NOTICE_SHA256:
            raise RuntimeError('PNLTRI upstream notice differs from reviewed text')
        shutil.copyfile(PNLTRI_NOTICE, staging / 'PNLTRI-LICENSE.txt')
        if sha256_file(staging / 'PNLTRI-LICENSE.txt') != PNLTRI_NOTICE_SHA256:
            raise RuntimeError('Copied PNLTRI notice hash mismatch')
        for asset, (expected, notice_files) in OTHER_VENDOR_INPUTS.items():
            if sha256_file(staging / asset) != expected:
                raise RuntimeError('Vendored asset differs from reviewed input: ' + asset)
            for source_name, output_name, notice_hash in notice_files:
                notice = VENDOR_NOTICE_DIR / source_name
                if notice.is_symlink() or sha256_file(notice) != notice_hash:
                    raise RuntimeError('Vendored notice differs from reviewed text: ' + source_name)
                shutil.copyfile(notice, staging / output_name)
                if sha256_file(staging / output_name) != notice_hash:
                    raise RuntimeError('Copied vendored notice hash mismatch: ' + output_name)
        if sha256_file(root / 'node_modules' / REGENERATOR_PACKAGE_FILE) != REGENERATOR_PACKAGE_SHA256:
            raise RuntimeError('Bundled regenerator runtime differs from reviewed input')
        for source_name, output_name, notice_hash in REGENERATOR_NOTICES:
            notice = VENDOR_NOTICE_DIR / source_name
            if notice.is_symlink() or sha256_file(notice) != notice_hash:
                raise RuntimeError('Regenerator notice differs from reviewed text: ' + source_name)
            shutil.copyfile(notice, staging / output_name)
            if sha256_file(staging / output_name) != notice_hash:
                raise RuntimeError('Copied regenerator notice hash mismatch: ' + output_name)
        if sha256_file(root / 'node_modules/clipper-lib/clipper.js') != CLIPPER_PACKAGE_SHA256:
            raise RuntimeError('Bundled clipper-lib differs from reviewed input')
        for source_name, output_name, notice_hash in CLIPPER_NOTICES:
            notice = VENDOR_NOTICE_DIR / source_name
            if notice.is_symlink() or sha256_file(notice) != notice_hash:
                raise RuntimeError('Clipper-lib notice differs from reviewed text: ' + source_name)
            shutil.copyfile(notice, staging / output_name)
            if sha256_file(staging / output_name) != notice_hash:
                raise RuntimeError('Copied clipper-lib notice hash mismatch: ' + output_name)
        shutil.copyfile(root / 'LICENSE', staging / 'JSKETCHER-LICENSE.txt')
        occ = root / 'node_modules' / 'jsketcher-occ-engine'
        for src, dst in [('license.md', 'OCCT-exception.txt'), ('LICENSE_LGPL_21.txt', 'OCCT-LGPL-2.1.txt'),
                         ('opencascade-info.txt', 'OCCT-upstream-info.txt')]:
            shutil.copyfile(occ / src, staging / dst)
        (staging / 'PROVENANCE-LOCAL-ONLY.txt').write_text(
            ('Selected OCCT: source-built candidate ' + OCCT_SOURCE_INPUTS['occt.wasm'] +
             '. It differs from npm and another independent build also differed; broad equivalence is unproven. '
             if occt_input is not None else 'Selected OCCT: pinned npm artifact. ') +
            'Experimental local build only. jSketcher fork commit: ' + FORK_COMMIT + '\n'
            'This build uses Open CASCADE Technology through jsketcher-occ-engine. '
            'The engine source archive contains interpreter commit ' + ENGINE_COMMIT + ', whose publish script names that same commit in the npm package version. '
            'The exact binary has not been reproduced from this source and the publish script does not establish a clean build. '
            'The npm occt.wasm SHA-256 is ' + ENGINE_SHA256['occt.wasm'] + '; occt.js SHA-256 is ' + ENGINE_SHA256['occt.js'] + '. '
            'numeric.js source commit ' + NUMERIC_COMMIT + ' has four concatenated inputs whose SHA-256 matches the pinned npm input ' + NUMERIC_INPUT_SHA256 + '; the embedded build transforms that input at build time. '
            'Manifold and Clipper2 source archives and a local build receipt are included; two builds used the same toolchain, which does not independently verify provenance. '
            'Upstream notices are supplied for the separately shipped vendored PNLTRI, verb and diff-match-patch scripts and bundled regenerator runtime and clipper-lib. Their transitive inputs and complete corresponding source still require independent review. '
            'The provided archives and notices are not proof of complete corresponding source. '
            'Do not publish or distribute this runtime until the exact engine provenance, corresponding source, transitive dependency notices and license obligations are reviewed.\n', encoding='utf-8')
        run('git', '-C', str(root), 'archive', '--format=zip', '--output=' + str(staging / 'jsketcher-fork-source.zip'), FORK_COMMIT)
        engine = Path(scratch) / 'engine-source'
        engine.mkdir()
        run('git', 'init', '--quiet', str(engine))
        run('git', '-C', str(engine), 'fetch', '--quiet', '--depth=1', args.engine_repo, ENGINE_COMMIT)
        actual_engine = subprocess.check_output(['git', '-C', str(engine), 'rev-parse', 'FETCH_HEAD'], text=True).strip()
        if actual_engine != ENGINE_COMMIT:
            raise RuntimeError('The fetched interpreter commit does not match the pin')
        engine_tree = subprocess.check_output(['git', '-C', str(engine), 'rev-parse', 'FETCH_HEAD^{tree}'], text=True).strip()
        if engine_tree != ENGINE_TREE:
            raise RuntimeError('The fetched interpreter tree does not match the pin')
        for path, (target, expected) in ENGINE_SOURCE_NOTICES.items():
            contents = subprocess.check_output(['git', '-C', str(engine), 'show', ENGINE_COMMIT + ':' + path])
            if hashlib.sha256(contents).hexdigest() != expected:
                raise RuntimeError('Pinned interpreter license differs: ' + path)
            (staging / target).write_bytes(contents)
        run('git', '-C', str(engine), 'archive', '--format=zip', '--output=' + str(staging / 'occt-interpreter-source.zip'), ENGINE_COMMIT)
        numeric = Path(scratch) / 'numeric-source'
        numeric.mkdir()
        run('git', 'init', '--quiet', str(numeric))
        run('git', '-C', str(numeric), 'fetch', '--quiet', '--depth=1', args.numeric_repo, NUMERIC_COMMIT)
        if subprocess.check_output(['git', '-C', str(numeric), 'rev-parse', 'FETCH_HEAD'], text=True).strip() != NUMERIC_COMMIT:
            raise RuntimeError('The fetched numeric source commit does not match the pin')
        def numeric_file(name):
            return subprocess.check_output(['git', '-C', str(numeric), 'show', NUMERIC_COMMIT + ':' + name])
        inputs = b''.join(numeric_file(name) for name in ('src/numeric.js', 'src/seedrandom.js', 'src/quadprog.js', 'src/svd.js'))
        if hashlib.sha256(inputs).hexdigest() != NUMERIC_INPUT_SHA256:
            raise RuntimeError('Pinned numeric source files do not reproduce the npm package input')
        for name, target in [('license.txt', 'NUMERIC-LICENSE.txt'), ('resources/LICENSE.quadprog', 'NUMERIC-QUADPROG-LICENSE.txt')]:
            contents = numeric_file(name)
            if hashlib.sha256(contents).hexdigest() != NUMERIC_NOTICE_SHA256[name]:
                raise RuntimeError('Pinned numeric license differs: ' + name)
            (staging / target).write_bytes(contents)
        run('git', '-C', str(numeric), 'archive', '--format=zip', '--output=' + str(staging / 'numeric-source.zip'), NUMERIC_COMMIT)
        notices(root / 'node_modules', staging / 'dependency-notices.zip', staging / 'static/index.bundle.js')
        review_package_sources(root / 'node_modules', staging / 'runtime-source-candidates.zip')
        evidence = HERE / 'PROVENANCE-NOTES.md'
        if evidence.is_symlink() or not evidence.is_file() or evidence.stat().st_size > 128 * 1024:
            raise RuntimeError('Runtime provenance notes missing or unsafe')
        shutil.copyfile(evidence, staging / 'SOURCE-PROVENANCE.txt')
        # This identifies what this build produced and supports a future
        # independent comparison. It does not claim reproducible binaries.
        contents = [{'path': f.relative_to(staging).as_posix(), 'bytes': f.stat().st_size, 'sha256': sha256_file(f)}
                    for f in sorted(staging.rglob('*')) if f.is_file()]
        receipt = {'forkCommit': FORK_COMMIT, 'interpreterCommit': ENGINE_COMMIT, 'numericCommit': NUMERIC_COMMIT,
                   'numericInputSHA256': NUMERIC_INPUT_SHA256,
                   'projectValidatorWorker': {'path': worker_files[0].relative_to(staging).as_posix(), 'sha256': sha256_file(worker_files[0])},
                   'occtSelection': 'source-research' if occt_input is not None else 'npm',
                   'occtSourceResearchReceipt': occt_receipt,
                   'manifoldCommit': MANIFOLD_COMMIT, 'clipperCommit': CLIPPER_COMMIT,
                   'manifoldJsSHA256': MANIFOLD_INPUTS['manifold.js'], 'manifoldWasmSHA256': MANIFOLD_INPUTS['manifold.wasm'],
                   'packageLockSHA256': sha256_file(root / 'package-lock.json'),
                   'nodeVersion': subprocess.check_output(['node', '--version'], text=True).strip(),
                   'npmVersion': subprocess.check_output(['npm', '--version'], text=True).strip(),
                   'files': contents, 'reproducibleBuildVerified': False}
        (staging / 'BUILD-RECEIPT.json').write_text(json.dumps(receipt, indent=2, sort_keys=True) + '\n', encoding='utf-8')
        assets = sorted(PREFIX + f.relative_to(staging).as_posix() for f in staging.rglob('*') if f.is_file())
        manifest = {'assets': assets}
        manifest_path = HERE / 'app.json'
        if not args.update_manifest and (not manifest_path.exists() or json.loads(manifest_path.read_text(encoding='utf-8')) != manifest):
            raise RuntimeError('Generated runtime differs from app.json; review before updating its manifest')
        DESTINATION.parent.mkdir(parents=True, exist_ok=True)
        # Swap only a previously marked generated directory. Build the next
        # copy first and restore the old directory if publication fails.
        if DESTINATION.parent.is_symlink() or DESTINATION.is_symlink() or manifest_path.is_symlink():
            raise RuntimeError('Refusing to replace symlinked output or manifest')
        marker = DESTINATION / 'PROVENANCE-LOCAL-ONLY.txt'
        if DESTINATION.exists() and (not marker.is_file() or marker.is_symlink()):
            raise RuntimeError('Existing runtime is not marked as generated; refusing to replace it')
        next_dir = Path(tempfile.mkdtemp(prefix='.jsketcher-next-', dir=DESTINATION.parent))
        backup_dir = None
        manifest_tmp = None
        published = False
        try:
            shutil.copytree(staging, next_dir, dirs_exist_ok=True)
            if args.update_manifest:
                fd, name = tempfile.mkstemp(prefix='.jsketcher-app-', suffix='.json', dir=HERE)
                manifest_tmp = Path(name)
                with os.fdopen(fd, 'w', encoding='utf-8') as stream:
                    stream.write(json.dumps(manifest, indent=2) + '\n')
            if DESTINATION.exists():
                backup_dir = Path(tempfile.mkdtemp(prefix='.jsketcher-old-', dir=DESTINATION.parent))
                backup_dir.rmdir()
                os.replace(DESTINATION, backup_dir)
            os.replace(next_dir, DESTINATION)
            published = True
            if manifest_tmp is not None:
                os.replace(manifest_tmp, manifest_path)
                manifest_tmp = None
        except BaseException:
            if published:
                shutil.rmtree(DESTINATION)
            if backup_dir is not None and backup_dir.exists():
                os.replace(backup_dir, DESTINATION)
            raise
        finally:
            if next_dir.exists():
                shutil.rmtree(next_dir)
            if manifest_tmp is not None:
                manifest_tmp.unlink(missing_ok=True)
        if backup_dir is not None:
            shutil.rmtree(backup_dir)
        print(f'Prepared {len(assets)} experimental local-only jSketcher assets at {DESTINATION}')


if __name__ == '__main__':
    main()
