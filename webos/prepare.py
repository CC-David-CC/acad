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
import subprocess
import tempfile
import zipfile

HERE = Path(__file__).resolve().parent
# Update only after reviewing the fork commit and the generated manifest.
FORK_COMMIT = 'c162e17c687625911cb48f8b88e5a190ee36db53'
DEFAULT_REPOSITORY = 'example.invalid:/srv/data/git/JSKetcher.git'
ENGINE_COMMIT = '5efaf53accb45bac475155fc4d5552642c19e91e'
ENGINE_REPOSITORY = 'https://github.com/Autodrop3d/occt-interpreter.git'
ENGINE_SHA256 = {'occt.wasm': 'fee4624786bb114de1d381340f05f0cdf47e6700b9fd62ef8a5dace82c8fda77',
                 'occt.js': '3c56e74e6e08411436a68fb930bab38aedd3137e4369af2bc67fd382e568787e'}
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


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo', default=DEFAULT_REPOSITORY, help='Git source containing the pinned fork commit')
    parser.add_argument('--engine-repo', default=ENGINE_REPOSITORY, help='Git source containing the pinned interpreter commit')
    parser.add_argument('--numeric-repo', default=NUMERIC_REPOSITORY, help='Git source containing the pinned numeric 1.2.6 commit')
    parser.add_argument('--manifold-research-input', type=Path, required=True, help='Hash-pinned local-only source-built Manifold artifacts and source archives')
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
        shutil.copyfile(root / 'LICENSE', staging / 'JSKETCHER-LICENSE.txt')
        occ = root / 'node_modules' / 'jsketcher-occ-engine'
        for src, dst in [('license.md', 'OCCT-exception.txt'), ('LICENSE_LGPL_21.txt', 'OCCT-LGPL-2.1.txt'),
                         ('opencascade-info.txt', 'OCCT-upstream-info.txt')]:
            shutil.copyfile(occ / src, staging / dst)
        (staging / 'PROVENANCE-LOCAL-ONLY.txt').write_text(
            'Experimental local build only. jSketcher fork commit: ' + FORK_COMMIT + '\n'
            'This build uses Open CASCADE Technology through jsketcher-occ-engine. '
            'The engine source archive contains interpreter commit ' + ENGINE_COMMIT + ', whose publish script names that same commit in the npm package version. '
            'The exact binary has not been reproduced from this source and the publish script does not establish a clean build. '
            'The npm occt.wasm SHA-256 is ' + ENGINE_SHA256['occt.wasm'] + '; occt.js SHA-256 is ' + ENGINE_SHA256['occt.js'] + '. '
            'numeric.js source commit ' + NUMERIC_COMMIT + ' has four concatenated inputs whose SHA-256 matches the pinned npm input ' + NUMERIC_INPUT_SHA256 + '; the embedded build transforms that input at build time. '
            'Manifold and Clipper2 source archives and a local build receipt are included; two builds used the same toolchain, which does not independently verify provenance. '
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
        # This identifies what this build produced and supports a future
        # independent comparison. It does not claim reproducible binaries.
        contents = [{'path': f.relative_to(staging).as_posix(), 'bytes': f.stat().st_size, 'sha256': sha256_file(f)}
                    for f in sorted(staging.rglob('*')) if f.is_file()]
        receipt = {'forkCommit': FORK_COMMIT, 'interpreterCommit': ENGINE_COMMIT, 'numericCommit': NUMERIC_COMMIT,
                   'numericInputSHA256': NUMERIC_INPUT_SHA256,
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
