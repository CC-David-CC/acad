"""Prepare the source-built ACAD editor as a native app-builder input directory."""
import argparse
import hashlib
import html
import json
from pathlib import Path
import re
import shutil
import subprocess
import zipfile

ROOT=Path(__file__).resolve().parents[1]


def sha(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream,'sha256').hexdigest()


def copy(source, target):
    if not source.is_file() or source.is_symlink():
        raise ValueError(f'Expected a regular file at {source}')
    target.parent.mkdir(parents=True,exist_ok=True)
    if target.exists():
        raise ValueError(f'Duplicate destination {target}')
    shutil.copyfile(source,target)


def zip_entries(output, files):
    with zipfile.ZipFile(output,'x',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as archive:
        for name,path in sorted(files.items()):
            if not path.is_file() or path.is_symlink():
                raise ValueError(f'Unreviewed source entry {path}')
            info=zipfile.ZipInfo(name,(1980,1,1,0,0,0))
            info.external_attr=0o100644 << 16
            info.compress_type=zipfile.ZIP_DEFLATED
            with path.open('rb') as source, archive.open(info,'w') as dest:
                shutil.copyfileobj(source,dest)


def collect_frontend(sources):
    inputs=set()
    for name in ('webpack.config.js',*[f'webpack.{name}-worker.cjs' for name in ('headless-sketch','native-archive','physical-parameters','prism-semantic','project-validation')]):
        inputs.update(json.loads((ROOT/'.build/source-inputs'/(name+'.json')).read_text()))
    modules=ROOT/'node_modules'
    inventory={}
    packages=set()
    for raw in sorted(inputs):
        if not raw.startswith('node_modules/'):
            continue
        path=ROOT/raw
        if not path.resolve().is_relative_to(modules) or not path.is_file() or path.is_symlink():
            raise ValueError(f'Unexpected Webpack resource {raw}')
        inventory['installed/'+raw]=path
        segments=Path(raw).parts
        at=max(i for i,k in enumerate(segments) if k=='node_modules')+1
        if segments[at].startswith('.'):
            continue
        name='/'.join(segments[at:at+(2 if segments[at].startswith('@') else 1)])
        if name in ('@icons/material','timers','jsketcher-occ-engine','manifold-3d'):
            raise ValueError(f'Unsupported package compiled into the source engine: {name}')
        packages.add(ROOT/Path(*segments[:at])/name)
    packages.update([modules/'numeric',modules/'font-awesome'])
    for p in sorted(packages):
        for f in p.iterdir():
            if f.is_file() and not f.is_symlink() and (f.name=='package.json' or re.match(r'(?i)^(licen[cs]e|copying|copyright|notice|readme|patents)',f.name)):
                inventory['installed/'+f.relative_to(ROOT).as_posix()]=f
    for f in (modules/'numeric').glob('numeric-1.2.6.js'):
        inventory['installed/'+f.relative_to(ROOT).as_posix()]=f
    for f in (ROOT/'webos/notices').iterdir():
        if f.is_file():inventory['supplemental/'+f.name]=f
    for f in sorted((modules/'font-awesome/fonts').glob('fontawesome-webfont.*')):
        inventory['installed/'+f.relative_to(ROOT).as_posix()]=f
    zip_entries(sources/'frontend-source-and-notices.zip',inventory)
    return len(inputs),sorted(str(p.relative_to(ROOT)) for p in packages)


def package(args):
    target=args.output.resolve()
    target.mkdir(parents=True,exist_ok=False)
    viewer=target/'node_modules/jsketcher-build'
    sources=viewer/'sources'
    sources.mkdir(parents=True)
    for p in ROOT.joinpath('webos').glob('*.mjs'):
        copy(p,target/('editor-mount.mjs' if p.name=='index.mjs' else p.name))
    (target/'index.mjs').write_text("import {mount as mountEditor} from './editor-mount.mjs';\nexport const mount = host => mountEditor(host,{sourceRectangleOnly:true});\n")
    copy(ROOT/'webos/style.css',target/'style.css')
    for p in (ROOT/'webos/examples').rglob('*'):
        if p.is_file():copy(p,target/p.relative_to(ROOT/'webos'))
    for name in ('index-webos.html','css/toolkit.css','lib/verb.js','lib/pnltri.js','lib/diff_match_patch.js'):
        copy(ROOT/'web'/name,viewer/name)
    for f in (ROOT/'web/img').rglob('*'):
        if f.is_file() and f.suffix.lower() in ('.svg','.png','.gif','.jpg','.jpeg','.ico','.webp'):
            copy(f,viewer/f.relative_to(ROOT/'web'))
    font=ROOT/'node_modules/font-awesome'
    for rel in ('css/font-awesome.min.css','fonts/fontawesome-webfont.eot','fonts/fontawesome-webfont.svg','fonts/fontawesome-webfont.ttf','fonts/fontawesome-webfont.woff','fonts/fontawesome-webfont.woff2'):
        copy(font/rel,viewer/'lib-assets/font-awesome'/rel)
    chunks=sorted((ROOT/'dist/static').glob('*.js'))
    required=['index.bundle.js','sketcher.bundle.js']
    if not all(any(f.name==name for f in chunks) for name in required):raise ValueError('Missing editor bundles')
    for f in chunks:
        if f.name not in required and not re.fullmatch(r'(physical-parameters|sketch-solver|prism-semantic|native-archive|project-validator)\.[0-9a-f]+\.js',f.name):
            raise ValueError(f'Unqualified emitted chunk: {f.name}')
        copy(f,viewer/'static'/f.name)
    subprocess.run(['node',str(ROOT/'build/stage-source-occt.mjs'),str(args.engine/'dist'),str(viewer/'lib-assets/source-occt')],check=True)
    versions={'libcascade':'341fa789f49ce73db76a0209d89ae518cc64a52d','occt':'b8f597c677811d1f9f4d8a97f5ae2825c0353a42',
              'rapidjson':'24b5e7a8b27f42fa16b96fc70aade9106cf7102f','freetype':'de8b92dd7ec634e9e2b25ef534c54a3537555c11',
              'emsdk':'dfb9d1a46c3bb8f52e1e6324be23123b9d73c190'}
    for name,commit in versions.items():
        with zipfile.ZipFile(args.engine_sources/(name+'-source.zip')) as z:
            if z.comment.decode('ascii')!=commit:raise ValueError(f'{name} source archive differs from build pin')
    for p in sorted(args.engine_sources.iterdir()):
        if p.suffix not in ('.zip','.txt'):raise ValueError(f'Unexpected engine source entry {p.name}')
        copy(p,sources/p.name)
    copy(ROOT/'LICENSE',sources/'acad-license.txt')
    with zipfile.ZipFile(args.editor_source) as z:
        if z.comment.decode('ascii') != args.editor_commit:
            raise ValueError('Editor source archive does not match the requested Git commit')
    copy(args.editor_source,sources/'acad-source.zip')
    resources,packages=collect_frontend(sources)
    receipt={'editor':args.editor_commit,'engine':json.loads((viewer/'lib-assets/source-occt/receipt.json').read_text())['sourceEngine'],
             'webpackResources':resources,'npmPackages':packages,'sources':{p.name:sha(p) for p in sorted(sources.iterdir())}}
    (sources/'build-receipt.txt').write_text(json.dumps(receipt,indent=2,sort_keys=True)+'\n')
    names=sorted(p.name for p in sources.iterdir())
    (sources/'SOURCE-INDEX.html').write_text('<!doctype html><meta charset="utf-8"><title>CAD Modeler sources and licenses</title><ul>\n'+
       ''.join(f'<li><a href="{n}">{html.escape(n)}</a></li>\n' for n in names)+'</ul>\n')
    assets=sorted(str(p.relative_to(target)) for p in viewer.rglob('*') if p.is_file())
    (target/'app.json').write_text(json.dumps({'assets':assets},indent=2)+'\n')
    print(f'Prepared {len(assets)} app assets and {len(names)} on-demand sources/notices.')


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--engine',type=Path,required=True)
    parser.add_argument('--engine-sources',type=Path,required=True)
    parser.add_argument('--editor-source',type=Path,required=True)
    parser.add_argument('--editor-commit',required=True,type=lambda s:s if re.fullmatch('[0-9a-f]{40}',s) else parser.error('Expected an editor commit'))
    parser.add_argument('--output',type=Path,required=True)
    args=parser.parse_args()
    package(args)
