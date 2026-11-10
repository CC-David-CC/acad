"""Offline normal build/stage custody; no product/Native imports or execution."""
import hashlib,json,os,subprocess,sys
from pathlib import Path
MISSING='sha256:dd666902fe926d69cc3c8843f5568c2a3e569f38ff49291baa2f248165b5ea99:8d5e537e0d7f9e12b8ae0eaf239c0be1080934ed12a24bf6e7f849c9135ed5a2'
SOURCE_PATHS=['package.json','webpack.config.js','test/polygon-profile-app-history/webpack.app.cjs','build/prepare-boolean-history-cohort.cjs','build/prepare-boolean-history-assets.cjs','build/boolean-history-assets-entry.cjs','build/stage-owned-profile-component.cjs','build/owned-profile-resource-closure.cjs','modules/engine/mount/catalogMount.ts','modules/engine/mount/engineCatalog.mjs','modules/engine/solid/solidOperandRuntime.mjs','web/app/cad/craft/workerSolidCommands.ts','web/app/cad/projectBundle.ts','web/app/cad/craft/craftBundle.ts','test/native-cad-container/stage.py','test/box-build-admission/build-recipe.sh','test/box-build-admission/fixture_custody.py']
def need(v,m):
    if not v:raise ValueError(m)
def sha(b):return hashlib.sha256(b).hexdigest()
def digest(p):
    h=hashlib.sha256();n=0
    with p.open('rb') as f:
        while True:
            b=f.read(1024*1024)
            if not b:break
            n+=len(b);need(n<=128*1024*1024,'individual public asset data bound');h.update(b)
    return {'sha256':h.hexdigest(),'bytes':n}
def git(root,*args):return subprocess.check_output(['git','-C',str(root),*args])
def write_new(path,value):
    with Path(path).open('x') as f:json.dump(value,f,indent=2);f.write('\n')
def build(root,commit,output):
    root=Path(root).resolve(strict=True)
    need(git(root,'rev-parse','HEAD').decode().strip()==commit,'exact normal build source')
    need(not git(root,'status','--porcelain','--untracked-files=no').strip(),'clean tracked normal build')
    need(not os.environ.get('CODI_BOOLEAN_HISTORY_NATIVE_DIR','').strip(),'actual omitted native input environment')
    entry=root/'.build/boolean-history-entry.mjs';entry_bytes=entry.read_bytes()
    need(entry_bytes==b'// Optional Boolean-history native assets were not explicitly configured.\nexport default null;\n','genuine ordinary null entry')
    need(not (root/'.build/boolean-history-assets').exists(),'no old optional stage')
    sources=[]
    for path in SOURCE_PATHS:
        raw=(root/path).read_bytes();blob=git(root,'rev-parse',commit+':'+path).decode().strip()
        need(raw==git(root,'cat-file','blob',blob),'actual source/Git blob')
        sources.append({'path':path,'blob':blob,**digest(root/path)})
    inventory={}
    for f in sorted((root/'dist').rglob('*')):
        need(not f.is_symlink(),'no symlinked dist')
        if f.is_file():inventory[f.relative_to(root/'dist').as_posix()]=digest(f)
    need(1<=len(inventory)<=20000 and sum(v['bytes'] for v in inventory.values())<=1024**3,'bounded full actual public build inventory')
    need(not any('boolean-history' in name for name in inventory),'no omitted optional assets emitted')
    need('static/index.bundle.js' in inventory and 'index-webos.html' in inventory,'real complete product build')
    value={'schema':'box-omission-build/1','source':commit,'sourceRoot':str(root),'omittedRevision':MISSING,'nativeInputConfigured':False,'entry':{'path':'.build/boolean-history-entry.mjs',**digest(entry)},'assetDirectoryAbsent':True,'sources':sources,'distFiles':inventory}
    write_new(output,value)
def stage(build_path,stage_root,pins_path,output):
    build_raw=Path(build_path).read_bytes();b=json.loads(build_raw);root=Path(stage_root).resolve(strict=True);apps_root=Path(str(root)+'-apps')
    raw=(apps_root/'apps.json').read_bytes();apps=json.loads(raw)['apps'];app=[a for a in apps if a['id']=='jsketcher'];need(len(app)==1,'one real CAD app');app=app[0]
    stage_raw=(root/'stage-pins.json').read_bytes();stage=json.loads(stage_raw);pins_raw=Path(pins_path).read_bytes();pins=json.loads(pins_raw)
    need(pins['source']==b['source'],'same built source');need(pins['outer']=={k:app[k] for k in ('bundleSHA256','sha256','path')},'actual outer tuple')
    core={k:v for k,v in app['files'].items() if k.startswith('node_modules/jsketcher-build/')}
    need(core==stage['files'],'actual complete staged Core asset metadata')
    need(set(b['distFiles'])=={k[len('node_modules/jsketcher-build/'):] for k in core}|set(stage['excluded']),'all generated files explicitly delivered or recorded excluded')
    for path,v in core.items():
        rel=path[len('node_modules/jsketcher-build/'):]
        need('boolean-history' not in path and v==b['distFiles'][rel],'no omitted assets or substituted Core input')
        need(digest(apps_root/'apps'/'jsketcher'/app['bundleSHA256']/path)==v,'stream actual staged bytes against metadata AND build')
    desktop_sources=[]
    for path,h in pins['files'].items():
        if not path.startswith('/'):
            need(path in b['distFiles'] and b['distFiles'][path]['sha256']==h,'every signed Core pin belongs to same real dist')
        else:
            name='active-system'+path;desktop=Path(stage['desktopSource']);blob=git(desktop,'rev-parse',pins['desktop']+':'+name).decode().strip();data=git(desktop,'cat-file','blob',blob);need(sha(data)==h and (desktop/name).read_bytes()==data,'actual same-Host static pin/source')
            desktop_sources.append({'path':name,'blob':blob,'sha256':h,'bytes':len(data)})

    value={'schema':'box-omission-stage/1','buildSha256':sha(build_raw),'source':b['source'],'desktop':pins['desktop'],'omittedRevision':MISSING,'catalogSha256':sha(raw),'catalogJSON':raw.decode('utf-8'),'stagePinsSha256':sha(stage_raw),'stagePinsJSON':stage_raw.decode('utf-8'),'signedPinsSha256':sha(pins_raw),'outer':pins['outer'],'files':core,'excluded':stage['excluded'],'desktopSources':desktop_sources,'stagedBytesVerified':True}
    write_new(output,value)
def verify_retained(root,receipt):
    root=Path(root);item=receipt['fixtureCustody'];build_raw=(root/item['buildFile']).read_bytes();stage_raw=(root/item['stageFile']).read_bytes()
    need(sha(build_raw)==item['buildSha256'] and sha(stage_raw)==item['stageSha256'],'unchanged actual generated custody')
    b=json.loads(build_raw);s=json.loads(stage_raw);pins_raw=(root/item['pinsFile']).read_bytes();need(sha(pins_raw)==item['pinsSha256'] and json.loads(pins_raw)==receipt['pins'] and s['signedPinsSha256']==sha(pins_raw),'actual retained signed pins')
    catalog_raw=s['catalogJSON'].encode('utf-8');stage_pins_raw=s['stagePinsJSON'].encode('utf-8');need(sha(catalog_raw)==s['catalogSha256'] and sha(stage_pins_raw)==s['stagePinsSha256'],'exact retained delivery metadata')
    app=[a for a in json.loads(catalog_raw)['apps'] if a['id']=='jsketcher'];need(len(app)==1,'one actual delivered CAD app');app=app[0];need(s['files']=={k:v for k,v in app['files'].items() if k.startswith('node_modules/jsketcher-build/')}==json.loads(stage_pins_raw)['files'] and s['excluded']==json.loads(stage_pins_raw)['excluded'] and s['outer']=={k:app[k] for k in ('bundleSHA256','sha256','path')},'all actual delivery records and outer ownership')
    need(b['schema']=='box-omission-build/1' and s['schema']=='box-omission-stage/1','exact custody schemas')
    need(b['source']==s['source']==receipt['pins']['source'] and s['desktop']==receipt['pins']['desktop'] and s['outer']==receipt['pins']['outer'],'actual runtime/Host/outer tuple')
    need(b['omittedRevision']==s['omittedRevision']==MISSING and s['buildSha256']==sha(build_raw) and b['nativeInputConfigured'] is False and b['assetDirectoryAbsent'] is True and s['stagedBytesVerified'] is True,'actual omitted registered cohort build/stage chain')
    need(b['entry']=={'path':'.build/boolean-history-entry.mjs','sha256':sha(b'// Optional Boolean-history native assets were not explicitly configured.\nexport default null;\n'),'bytes':len(b'// Optional Boolean-history native assets were not explicitly configured.\nexport default null;\n')},'actual null entry identity')
    need(not any('boolean-history' in path for path in b['distFiles']) and not any('boolean-history' in path for path in s['files']),'no optional graph in complete build or delivered metadata')
    need({x['path'] for x in b['sources']}==set(SOURCE_PATHS) and len(b['sources'])==len(SOURCE_PATHS),'exact build producer roster')
    for row in b['sources']:
        blob=git(Path(__file__).resolve().parents[2],'rev-parse',b['source']+':'+row['path']).decode().strip();raw=git(Path(__file__).resolve().parents[2],'cat-file','blob',blob)
        need(blob==row['blob'] and sha(raw)==row['sha256'] and len(raw)==row['bytes'],'actual normal build source/Git linkage')
    need(set(b['distFiles'])=={k[len('node_modules/jsketcher-build/'):] for k in s['files']}|set(s['excluded']),'full delivery census')
    need(all(v==b['distFiles'][k[len('node_modules/jsketcher-build/'):]] for k,v in s['files'].items()),'same actual emitted/delivered bytes')
    need(all(p in b['distFiles'] and b['distFiles'][p]['sha256']==h for p,h in receipt['pins']['files'].items() if not p.startswith('/')),'signed Core pins belong to full bound dist')
    host_rows=[x for x in receipt['sourceSnapshots'] if x['gitPath']=='test/agent-cad-corpus/sweep/signed-harness.mjs'];need(len(host_rows)==1,'actual Host Git authority')
    expected={('active-system'+p,h) for p,h in receipt['pins']['files'].items() if p.startswith('/')};need({(x['path'],x['sha256']) for x in s['desktopSources']}==expected and len(s['desktopSources'])==len(expected),'all signed Host static sources')
    for row in s['desktopSources']:
        blob=git(host_rows[0]['repo'],'rev-parse',receipt['pins']['desktop']+':'+row['path']).decode().strip();raw=git(host_rows[0]['repo'],'cat-file','blob',blob);need(blob==row['blob'] and sha(raw)==row['sha256'] and len(raw)==row['bytes'],'actual Host static Git source custody')

    return MISSING
if __name__=='__main__':
    if sys.argv[1]=='build':build(*sys.argv[2:])
    elif sys.argv[1]=='stage':stage(*sys.argv[2:])
    else:raise ValueError('build or stage')
