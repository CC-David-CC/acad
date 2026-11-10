#!/usr/bin/env python3
"""One separately pinned AFTER wrapper for the unchanged stdout-only checker.
No product imports. Root alone executes after review and terminal whole PASS.
"""
import hashlib
import json
import os
from pathlib import Path
import stat
import subprocess
import sys

sys.dont_write_bytecode = True
CHUNK = 1048576
MAX_FILE = 128 * CHUNK
MAX_TOTAL = 1024 * CHUNK
MAX_FILES = 10000
MAX_ENTRIES = 20000
MAX_SOURCE = 2 * CHUNK
MAX_RESULT = 8 * CHUNK
HELPERS = (
    'test/associative-source-projection-workflow/check.py',
    'test/associative-source-projection-workflow/dxf_oracle.py',
    'test/native-cad-container/archive_oracle.py',
)
WRAPPER = 'test/associative-source-projection-workflow/run-artifact-oracle.py'


def need(value, message):
    if not value:
        raise ValueError(message)


def oid(value):
    need(isinstance(value, str) and len(value) == 40 and
         all(c in '0123456789abcdef' for c in value), 'explicit full Git commit')
    return value


def safe_path(value, new=False):
    need(isinstance(value, (str, Path)) and len(str(value)) <= 4096,
         'bounded filesystem path')
    path = Path(value)
    need(path.is_absolute() and '..' not in path.parts, 'absolute bounded path')
    current = Path(path.anchor)
    for index, part in enumerate(path.parts[1:], 1):
        current /= part
        if new and index == len(path.parts)-1:
            need(not os.path.lexists(current), 'exclusive NEW output path')
            break
        st = current.lstat()
        need(not stat.S_ISLNK(st.st_mode), 'no symlink path component')
        need(stat.S_ISDIR(st.st_mode) or index == len(path.parts)-1,
             'directory ancestors')
    return path


def identity(st):
    return st.st_dev, st.st_ino, st.st_mode, st.st_size, st.st_mtime_ns


def stream_file(path, maximum=MAX_FILE):
    safe_path(path)
    before = path.lstat()
    need(stat.S_ISREG(before.st_mode) and before.st_size <= maximum,
         'bounded regular input')
    digest = hashlib.sha256()
    fd = os.open(path, os.O_RDONLY | getattr(os, 'O_NOFOLLOW', 0))
    with os.fdopen(fd, 'rb') as source:
        need(identity(os.fstat(source.fileno())) == identity(before),
             'input identity before streaming')
        for block in iter(lambda: source.read(CHUNK), b''):
            digest.update(block)
        need(identity(os.fstat(source.fileno())) == identity(before),
             'input unchanged during streaming')
    need(identity(path.lstat()) == identity(before), 'input pathname unchanged')
    return {'bytes': before.st_size, 'sha256': digest.hexdigest()}


def inventory(root):
    safe_path(root)
    need(root.is_dir(), 'real original whole directory')
    files = {}
    total = 0
    entries = 0
    directories = [(root, 0)]
    while directories:
        directory, depth = directories.pop()
        for path in directory.iterdir():
            entries += 1
            need(entries <= MAX_ENTRIES and depth+1 <= 64,
                 'bounded whole tree entries/depth')
            safe_path(path)
            st = path.lstat()
            if stat.S_ISDIR(st.st_mode):
                directories.append((path, depth+1))
                continue
            need(len(files) < MAX_FILES, 'whole file count bound')
            total += st.st_size
            need(total <= MAX_TOTAL, 'whole aggregate1GiB bound')
            files[str(path.relative_to(root))] = stream_file(path)
    need('receipt.json' in files, 'original whole receipt')
    return dict(sorted(files.items()))


def git(root, *args):
    result = subprocess.run(['git', '-C', str(root), *args],
                            capture_output=True, check=True)
    return result.stdout


def checkout(root, commit):
    safe_path(root)
    need(root.is_dir(), 'real source checkout')
    top = git(root, 'rev-parse', '--show-toplevel').decode().strip()
    head = git(root, 'rev-parse', 'HEAD').decode().strip()
    status = git(root, 'status', '--porcelain=v1', '--untracked-files=all').decode()
    need(safe_path(top) == root and head == commit and status == '',
         'actual clean source root/HEAD')
    return {'root': str(root), 'commit': commit, 'status': status}


def source_record(root, commit, relative):
    path = safe_path(root / relative)
    record = stream_file(path, MAX_SOURCE)
    size = int(git(root, 'cat-file', '-s', commit+':'+relative))
    need(size == record['bytes'] and size <= MAX_SOURCE, 'bounded source Git blob')
    raw = git(root, 'show', commit+':'+relative)
    need(len(raw) == size and hashlib.sha256(raw).hexdigest() == record['sha256'],
         'working source equals exact committed blob')
    return {'root': str(root), 'path': str(path), 'relative': relative, 'commit': commit,
            'gitBlobOID': git(root, 'rev-parse', commit+':'+relative).decode().strip(),
            **record}


def write_new(path, value):
    with path.open('x') as target:
        target.write(json.dumps(value, indent=2)+'\n')


def main(whole, output, producer_root, producer_commit, verifier_commit):
    whole = safe_path(whole)
    output = safe_path(output, new=True)
    producer_root = safe_path(producer_root)
    verifier_root = safe_path(Path(__file__).absolute().parents[2])
    need(safe_path(Path(__file__).absolute()) == verifier_root/WRAPPER,
         'actual pinned wrapper entry path')
    producer_commit, verifier_commit = oid(producer_commit), oid(verifier_commit)
    need(producer_root != verifier_root, 'separate producer and verifier checkouts')
    for root in (whole, producer_root, verifier_root):
        need(output != root and root not in output.parents,
             'AFTER output outside immutable inputs and source checkouts')
    sources_before = {'producer': checkout(producer_root, producer_commit),
                      'verifier': checkout(verifier_root, verifier_commit)}
    records = [source_record(verifier_root, verifier_commit, WRAPPER)]
    for relative in HELPERS:
        producer = source_record(producer_root, producer_commit, relative)
        verifier = source_record(verifier_root, verifier_commit, relative)
        need({k: producer[k] for k in ('bytes', 'sha256', 'gitBlobOID')} ==
             {k: verifier[k] for k in ('bytes', 'sha256', 'gitBlobOID')},
             'checker/import assertions unchanged from producing commit')
        records.extend([producer, verifier])
    before = inventory(whole)
    with (whole/'receipt.json').open() as source:
        receipt = json.load(source)
    need(receipt['status'] == 'PASS' and receipt['ownedContextsRetired'] and
         receipt['remainingOwnedTargets'] == [] and receipt['pendingWrite'] is None and
         receipt['sourceUnchanged'] and receipt['sharedBrowserDisconnectedOnly'] and
         not any(receipt.get(k) for k in ('pendingOpen', 'pendingMutation',
                                         'retainedOutcome', 'uncertainMutation')),
         'complete terminal whole/known settlement before independent reader')
    need(receipt['pins']['source'] == producer_commit, 'actual producing Core commit')
    for relative in HELPERS:
        rows = [r for r in receipt['sourceRoster']
                if r['repo'] == str(producer_root) and r['path'] == relative]
        need(len(rows) == 1 and rows[0]['commit'] == producer_commit,
             'unchanged checker/import bound to actual original producer roster')
    # The frozen child loads its own receipt; retain only bounded custody
    # metadata in this parent while it runs, not a duplicate parsed tree.
    del receipt, rows
    output.mkdir()
    custody = {'scope': 'AFTER independent projection checker only; no product execution',
               'sourcesBefore': sources_before, 'sourceRecords': records,
               'wholeReceiptSha256': before['receipt.json']['sha256'], 'before': before,
               'interpreter': {'executable': sys.executable, 'version': sys.version},
               'limits': {'fileBytes': MAX_FILE, 'totalBytes': MAX_TOTAL,
                          'files': MAX_FILES, 'entries': MAX_ENTRIES, 'chunkBytes': CHUNK}}
    write_new(output/'custody-before.json', custody)
    code = None
    failure = None
    try:
        with (output/'oracle.stdout.log').open('xb') as stdout, \
             (output/'oracle.stderr.log').open('xb') as stderr:
            result = subprocess.run(
                [sys.executable, '-B', str(verifier_root/HELPERS[0]), str(whole)],
                cwd=verifier_root, stdout=stdout, stderr=stderr, timeout=180)
            code = result.returncode
    except Exception as error:
        failure = {'name': type(error).__name__, 'message': str(error)}
    finally:
        try:
            custody['after'] = inventory(whole)
            custody['sourcesAfter'] = {
                'producer': checkout(producer_root, producer_commit),
                'verifier': checkout(verifier_root, verifier_commit)}
            custody['sourceRecordsAfter'] = [
                source_record(Path(row['root']), row['commit'], row['relative']) for row in records]
            custody['inputsUnchanged'] = custody['after'] == before
            custody['sourcesUnchanged'] = (custody['sourcesAfter'] == sources_before and
                                           custody['sourceRecordsAfter'] == records)
        except Exception as error:
            custody['afterError'] = {'name': type(error).__name__, 'message': str(error)}
            custody['inputsUnchanged'] = False
            custody['sourcesUnchanged'] = False
        custody['returnCode'] = code
        custody['processFailure'] = failure
        write_new(output/'custody.json', custody)
    need(custody['inputsUnchanged'] and custody['sourcesUnchanged'],
         'unchanged whole/source custody after checker')
    need(failure is None and code == 0, 'FIRST checker failed/refused; retain logs, no retry')
    stdout = output/'oracle.stdout.log'
    need(stdout.stat().st_size <= MAX_RESULT and
         (output/'oracle.stderr.log').stat().st_size <= MAX_RESULT, 'bounded checker output')
    with stdout.open() as source:
        value = json.load(source)
    need(isinstance(value, dict) and value.get('status') == 'PASS',
         'actual complete independent checker PASS')
    write_new(output/'FIRST-ORACLE.json', value)
    first = stream_file(output/'FIRST-ORACLE.json', MAX_RESULT)
    return {'status': 'PASS', 'wholeReceiptSha256': custody['wholeReceiptSha256'],
            'firstOracleSha256': first['sha256'], 'custody': str(output/'custody.json')}


if __name__ == '__main__':
    need(len(sys.argv) == 6,
         'WHOLE NEW_AFTER PRODUCER_ROOT PRODUCER_COMMIT VERIFIER_COMMIT')
    print(json.dumps(main(*sys.argv[1:])))
