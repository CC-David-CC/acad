"""Assemble the actual sources for the pinned, single-threaded OpenCascade engine."""
import argparse
import hashlib
from pathlib import Path
import shutil
import subprocess
import zipfile


REPOS = {
    'libcascade': ('.', '341fa789f49ce73db76a0209d89ae518cc64a52d'),
    'occt': ('deps/OCCT', 'b8f597c677811d1f9f4d8a97f5ae2825c0353a42'),
    'rapidjson': ('deps/rapidjson', '24b5e7a8b27f42fa16b96fc70aade9106cf7102f'),
    'freetype': ('deps/freetype', 'de8b92dd7ec634e9e2b25ef534c54a3537555c11'),
    'emsdk': ('deps/emsdk', 'dfb9d1a46c3bb8f52e1e6324be23123b9d73c190'),
}
OCCT_DIFF = 'ef8292ae457e0395c2ea96400949d9ddf12c8e1881fa64d4c2d7818c7674b2a6'
VERSION_HEADER = 'src/FoundationClasses/TKernel/Standard/Standard_Version.hxx'


def git(repo, *args):
    return subprocess.check_output(['git','-C',str(repo),*args])


def digest(data, expected):
    if hashlib.sha256(data).hexdigest() != expected:
        raise ValueError('Source input differs from the qualified checkout')


def write_entry(archive, name, data):
    info = zipfile.ZipInfo(name, (1980,1,1,0,0,0))
    info.external_attr = 0o100644 << 16
    archive.writestr(info,data,compress_type=zipfile.ZIP_DEFLATED,compresslevel=6)


def source_notices(engine, dest):
    dest.mkdir(parents=True,exist_ok=False)
    for name,(sub,revision) in REPOS.items():
        repo = engine/sub
        if git(repo,'rev-parse','HEAD').decode().strip() != revision:
            raise ValueError(f'{name} differs from pinned source revision')
        subprocess.run(['git','-C',str(repo),'archive','--format=zip',f'--prefix={name}/',f'--output={dest / (name+"-source.zip")}',revision],check=True)
    config=(engine/'build-configs/webos-no-dynamic-execution.yml').read_bytes()
    digest(config,'18bcff132d7bc746442dac8c5789d7ce4c1d30007805d45cf1de61fb1e8440f7')
    patch=git(engine/'deps/OCCT','diff','--binary','--no-ext-diff','HEAD')
    digest(patch,OCCT_DIFF)
    header=(engine/'deps/OCCT'/VERSION_HEADER).read_bytes()
    digest(header,'e196ee2ccdad1faa9118de067afa3529cde5897ed663bae7c2c7321ee27c70d5')
    with zipfile.ZipFile(dest/'engine-build-inputs.zip','x') as z:
        write_entry(z,'libcascade/build-configs/webos-no-dynamic-execution.yml',config)
        write_entry(z,'occt-build.patch',patch)
        write_entry(z,'occt/'+VERSION_HEADER,header)
        write_entry(z,'README.txt',b'The base trees in the adjacent source archives are pinned in build/prepare-source-notices.py. The bindings builder applies its OCCT patches. This archive also contains their exact combined diff and generated version header. Use the enclosed full configuration for the single-threaded build. See the ACAD source tree and the upstream libcascade build documentation.\n')
    em=engine/'deps/emsdk/upstream/emscripten'
    if (em/'emscripten-version.txt').read_text().strip() != '"6.0.5"':
        raise ValueError('Unexpected Emscripten runtime source version')
    with zipfile.ZipFile(dest/'emscripten-runtime-source.zip','x') as z:
        for n in ('LICENSE','AUTHORS','emscripten-version.txt','src','system/lib','system/include','tools'):
            source=em/n
            for p in sorted(source.rglob('*')) if source.is_dir() else [source]:
                if p.is_file() and not p.is_symlink() and not any(x in ('__pycache__','.git') for x in p.parts) and p.suffix not in ('.pyc','.o','.a','.wasm'):
                    write_entry(z,'emscripten/'+p.relative_to(em).as_posix(),p.read_bytes())
    for sub,name in [('LICENSE','libcascade-license.txt'),('LICENSE.OCCT-Exception','libcascade-exception.txt'),
                       ('deps/OCCT/LICENSE_LGPL_21.txt','occt-license.txt'),('deps/OCCT/OCCT_LGPL_EXCEPTION.txt','occt-exception.txt'),
                       ('deps/freetype/LICENSE.TXT','freetype-license.txt'),('deps/freetype/docs/FTL.TXT','freetype-ftl.txt'),
                       ('deps/rapidjson/license.txt','rapidjson-license.txt'),('deps/emsdk/upstream/emscripten/LICENSE','emscripten-license.txt')]:
        shutil.copyfile(engine/sub,dest/name)


if __name__=='__main__':
    argparse=argparse.ArgumentParser(description=__doc__)
    argparse.add_argument('engine',type=Path)
    argparse.add_argument('destination',type=Path)
    opts=argparse.parse_args()
    source_notices(opts.engine.resolve(strict=True),opts.destination.resolve())
