#!/usr/bin/env python3
"""Create the bounded Emscripten 2.0.30 runtime-source archive used by CAD."""
import argparse
import hashlib
from pathlib import Path
import zipfile

p = argparse.ArgumentParser(description=__doc__)
p.add_argument('emscripten', type=Path, help='Emscripten 2.0.30 SDK source directory')
p.add_argument('output', type=Path, help='new ZIP file')
a = p.parse_args()
root = a.emscripten.resolve(strict=True)
if (root / 'emscripten-revision.txt').read_text().strip() != 'f782b50a7f8dded7cd0e2c7ee4fed41ab743f5c0':
    raise ValueError('Unexpected Emscripten revision')
if a.output.exists() or a.output.is_symlink():
    raise ValueError('Output must not exist')
inputs = ['LICENSE', 'AUTHORS', 'emscripten-revision.txt', 'emscripten-version.txt',
          'src', 'system/include', 'system/lib/libc', 'system/lib/compiler-rt',
          'system/lib/libcxx', 'system/lib/libcxxabi', 'system/lib/dlmalloc.c',
          'system/lib/sbrk.c', 'system/lib/al.c', 'system/lib/gl', 'system/lib/html5']
paths = []
for name in inputs:
    item = root / name
    if item.is_symlink() or not item.exists(): raise ValueError('Missing or symlinked input: ' + name)
    paths.extend(item.rglob('*') if item.is_dir() else [item])
files = []
for item in paths:
    if item.is_symlink(): raise ValueError('Symlinked input: ' + str(item))
    if item.is_file(): files.append(item)
with zipfile.ZipFile(a.output, 'x', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for item in sorted(files, key=lambda x: x.relative_to(root).as_posix()):
        info = zipfile.ZipInfo(item.relative_to(root).as_posix(), (1980, 1, 1, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o100644 << 16
        archive.writestr(info, item.read_bytes())
print(hashlib.sha256(a.output.read_bytes()).hexdigest(), len(files))
