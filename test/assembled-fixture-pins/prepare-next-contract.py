#!/usr/bin/env python3
"""Read-only fresh assembled tuple derivation and reviewed-contract pin preparation.
No build, loader, Native/Worker invocation, delivery or CAD qualification.
"""
import argparse, copy, hashlib, json, os, re, stat, subprocess
from pathlib import Path, PurePosixPath
META=2097152
CHUNK=1048576
COUNT=20000
ASSET=134217728
TOTAL=1073741824
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[1]
TOOL_FILES=['test/assembled-fixture-pins/'+n for n in ['prepare-next-contract.py','assembled-next-inputs.json','assembled-next-policy.json','assembled-r2-contract.json','README-next.md']]
def require(ok,message):
    if not ok:raise ValueError(message)
def sha(raw):return hashlib.sha256(raw).hexdigest()
def hex64(v):return isinstance(v,str) and re.fullmatch('[a-f0-9]{64}',v) is not None
def rel(v):
    require(isinstance(v,str) and 0<len(v)<=1024,'Bounded relative source/asset path');p=PurePosixPath(v)
    require(not p.is_absolute() and str(p)==v and all(x not in ('..','.') for x in p.parts) and ':' not in v and '\\' not in v,'Exact relative source/asset path');return v
def identity(path):
    s=path.stat();return(s.st_dev,s.st_ino,s.st_size,s.st_mtime_ns,s.st_ctime_ns)
def regular(root,name):
    root=Path(root);name=rel(name);p=root/name
    require(root.resolve(strict=True)==root and p.resolve(strict=True).is_relative_to(root),'Actual file remains under captured root')
    q=p
    while q!=root:
        require(not q.is_symlink(),'Symlinked staged/generated input: '+str(q));q=q.parent
    require(stat.S_ISREG(p.stat().st_mode),'Regular file required: '+str(p));return p
class Custody:
    def __init__(self):self.files={};self.streamed=0
    def hash(self,path,maximum=ASSET,expected=None):
        path=Path(path);require(not path.is_symlink() and stat.S_ISREG(path.stat().st_mode),'Regular immutable input');before=identity(path);require(0<=before[2]<=maximum,'Input exceeds byte bound: '+str(path));h=hashlib.sha256();size=0
        with path.open('rb') as f:
            for chunk in iter(lambda:f.read(CHUNK),b''):
                size+=len(chunk);require(size<=maximum,'Input grew beyond bound');h.update(chunk)
        require(identity(path)==before and size==before[2],'Input changed during stream: '+str(path));value={'sha256':h.hexdigest(),'bytes':size}
        if expected is not None:require(value==expected,'Actual input bytes differ: '+str(path))
        key=str(path);require(key not in self.files or self.files[key]==before,'Input identity changed between observations');self.files[key]=before;self.streamed+=size;return value
    def json(self,path):
        path=Path(path);record=self.hash(path,META)
        with path.open('rb') as f:raw=f.read(META+1)
        require(len(raw)==record['bytes'] and sha(raw)==record['sha256'] and identity(path)==self.files[str(path)],'Bounded metadata changed')
        def pairs(rows):
            d={}
            for k,v in rows:require(k not in d,'Duplicate JSON field');d[k]=v
            return d
        value=json.loads(raw.decode('utf-8'),object_pairs_hook=pairs,parse_constant=lambda x:(_ for _ in ()).throw(ValueError('Nonfinite JSON')))
        return record,value
    def fence(self):
        for name,old in self.files.items():require(identity(Path(name))==old,'Captured file changed before output: '+name)
def git(repo,args,maximum=META):
    p=subprocess.Popen(['git','-C',str(repo),*args],stdout=subprocess.PIPE,stderr=subprocess.DEVNULL)
    data=p.stdout.read(maximum+1)
    if len(data)>maximum:p.kill();p.wait();raise ValueError('Git custody output exceeds bounded metadata')
    p.stdout.close();require(p.wait()==0,'Git custody failed: '+args[0]);return data

def checkout(root,commit):
    root=Path(root).resolve(strict=True);require(re.fullmatch('[a-f0-9]{40}',commit),'Full expected Git commit required')
    require(Path(git(root,['rev-parse','--show-toplevel']).decode().strip()).resolve()==root,'Exact checkout root')
    head=git(root,['rev-parse','HEAD']).decode().strip();status=git(root,['status','--porcelain=v1','--untracked-files=all']).decode()
    require(head==commit and status=='','Actual clean checkout HEAD differs: '+str(root));return{'root':str(root),'commit':commit,'status':status}
def git_source(custody,role,root,commit,name):
    name=rel(name);path=regular(root,name);r=custody.hash(path,META);oid=git(root,['rev-parse',commit+':'+name],256).decode().strip();require(re.fullmatch('[a-f0-9]{40}',oid),'Actual Git blob identity')
    process=subprocess.Popen(['git','-C',str(root),'cat-file','blob',oid],stdout=subprocess.PIPE,stderr=subprocess.DEVNULL);h=hashlib.sha256();size=0
    while True:
        chunk=process.stdout.read(CHUNK)
        if not chunk:break
        size+=len(chunk)
        if size>META:process.kill();process.wait();raise ValueError('Source Git blob exceeds bounded source bytes')
        h.update(chunk)
    process.stdout.close();require(process.wait()==0 and {'sha256':h.hexdigest(),'bytes':size}==r,'Source is not actual committed Git blob: '+name)
    return{'role':role,'path':name,'gitBlobOID':oid,**r}
def records(v,host_paths=()):
    require(isinstance(v,dict) and len(v)<=COUNT,'Bounded exact file census');total=0
    for name,r in v.items():
        require(name in host_paths or not name.startswith('/'),'Only explicitly retained Host paths may be absolute');rel(name[1:] if name.startswith('/') else name);require(isinstance(r,dict) and set(r)=={'sha256','bytes'} and hex64(r['sha256']) and type(r['bytes']) is int and 0<=r['bytes']<=ASSET,'Exact bounded file record');total+=r['bytes']
    require(total<=TOTAL,'Actual staged/dist census exceeds1GiB');return total

def output(path,value,roots):
    path=Path(path);require(not path.exists() and not path.is_symlink() and path.parent.is_dir(),'Exclusive NEW output in existing directory');p=path.parent.resolve()/path.name
    require(all(not p.is_relative_to(Path(r)) for r in roots),'Output must stay outside source/build/stage/apps trees');raw=(json.dumps(value,indent=2)+'\n').encode();require(len(raw)<=META,'Output metadata exceeds2MiB')
    with p.open('xb') as f:f.write(raw);f.flush();os.fsync(f.fileno())
    return{'path':str(p),'sha256':sha(raw),'bytes':len(raw)}
def source_text(root,name):
    p=regular(root,name);require(p.stat().st_size<=META,'Small reviewed source text only')
    with p.open('rb') as f:raw=f.read(META+1)
    require(len(raw)<=META,'Bounded source text');return raw.decode('utf-8')

def derive(a):
    custody=Custody();tool=Path(__file__).resolve();require(tool==ROOT/'test/assembled-fixture-pins/prepare-next-contract.py','Actual helper path');roots={'acceptance':ROOT,'core':a.core_source.resolve(strict=True),'desktop':a.desktop_source.resolve(strict=True)};commits={'acceptance':a.acceptance_commit,'core':a.core_commit,'desktop':a.host_commit}
    require(Path.cwd().resolve()==ROOT and len(set(roots.values()))==3,'Run from separate actual acceptance checkout; compiled Core/Host roots distinct')
    before={role:checkout(root,commits[role]) for role,root in roots.items()};source_records={}
    def source(role,name):
        key=role+':'+name
        if key not in source_records:
            require(len(source_records)<COUNT,'Aggregate source census exceeds20000');source_records[key]=git_source(custody,role,roots[role],commits[role],name)
        return source_records[key]
    for name in TOOL_FILES:source('acceptance',name)
    policy_record,policy=custody.json(HERE/'assembled-next-policy.json');inputs_record,inputs=custody.json(HERE/'assembled-next-inputs.json');historical_record,historical=custody.json(ROOT/rel(policy['historicalContract']))
    require(policy['version']==inputs['version']==historical['version']==1 and policy['preserveEveryInheritedLogicalPin'] is True and policy['currentContractRequiresSeparateReview'] is True,'Frozen policy/inputs/contract semantics')
    require(policy['offlineCustodyBounds']=={'metadataBytes':META,'distFileCount':COUNT,'individualAssetBytes':ASSET,'distTotalBytes':TOTAL,'streamChunkBytes':CHUNK},'Reviewed bounds unchanged');require(policy['coreInnerPrefix']=='node_modules/jsketcher-build/','Known inner asset schema')
    base_record,base=custody.json(a.base_pins.resolve(strict=True));old_files=historical['files'];records(old_files,policy['retainedHostResourcePaths'])
    legacy=base_record['sha256']==historical['base']['sha256'] and base_record['bytes']==historical['base']['bytes']
    r2=all(base.get(k)==historical[k] for k in ['source','desktop','outer','filesApp']) and base.get('files')=={k:v['sha256'] for k,v in old_files.items()} and base.get('pinPreparation',{}).get('contractSHA256')==historical_record['sha256'] and base.get('pinPreparation',{}).get('selectedFileCount')==historical['selectedFileCount']
    require(legacy or r2,'Use exact known inherited298 receipt or actual historical r2 logical367 pins, never an arbitrary reduced base')
    if legacy:require(len(base['files'])==historical['base']['files'] and all(base[k]==historical['base'][k] for k in ['source','desktop','outer','filesApp']),'Exact original inherited tuple')
    apps=a.apps.resolve(strict=True);stage=a.stage.resolve(strict=True);core=roots['core'];desktop=roots['desktop'];require(len({apps,stage,*roots.values()})==5,'Separate actual source/stage/apps roots');metadata={}
    for key,p in [('catalog',apps/'apps.json'),('stagePins',stage/'stage-pins.json'),('builderConfig',stage/'builder-config.json')]:
        record,value=custody.json(p);metadata[key]={'path':str(p),**record};metadata[key]['value']=value
    catalog=metadata['catalog']['value'];staged=metadata['stagePins']['value'];builder=metadata['builderConfig']['value'];require(catalog['version']=='codi-public-apps/2' and catalog['hostAPI']==2,'Actual catalog format')
    require(builder=={'source':str(stage),'output':str(apps),'apps':['jsketcher','files'],'entries':{'jsketcher':'system/jsketcher/index.mjs','files':'system/files/index.mjs'}},'Actual reviewed CAD+Files builder inputs')
    require(staged['desktopSource']==str(desktop) and staged['cadDist']==str(core/'dist'),'Actual stage owner/source association')
    marker=regular(core,'dist/.rev');require(source_text(core,'dist/.rev').strip()==a.core_commit,'Actual marked dist revision differs');custody.hash(marker,128)
    def mounted(id):
        row=next((x for x in catalog['apps'] if x['id']==id),None);require(row is not None and sum(x['id']==id for x in catalog['apps'])==1,'Exactly one actual catalog app '+id);records(row['files']);require(hex64(row['bundleSHA256']) and row['path']=='assets/desktop/apps/'+id+'/'+row['bundleSHA256']+'/index.mjs','Actual mounted path schema');record={'sha256':row['sha256'],'bytes':row['bytes']};require(row['files'].get('index.mjs')==record,'Actual catalog entry record');root=apps/'apps'/id/row['bundleSHA256'];custody.hash(regular(root,'index.mjs'),expected=record);return root,row,{k:row[k] for k in ['bundleSHA256','sha256','path']}
    cad_root,cad,outer=mounted('jsketcher');files_root,files_app,files_tuple=mounted('files');prefix=policy['coreInnerPrefix'];inner={k[len(prefix):]:v for k,v in cad['files'].items() if k.startswith(prefix)};inner_bytes=records(inner);stage_inner={k[len(prefix):]:v for k,v in staged['files'].items() if k.startswith(prefix)};require(inner==stage_inner and len(stage_inner)==len(staged['files']) and staged['assetBytes']==inner_bytes,'Complete actual catalog/stage inner census differs')
    require(len(catalog['apps'])==2,'Explicit two-app isolated fixture only');selected={};mapping={};workers={};associations={}
    for role,spec in inputs['workers'].items():
        matches=[n for n in inner if re.fullmatch('static/'+re.escape(role)+r'\.[a-f0-9]{20}\.js',n)];require(len(matches)==1,'Exactly one fresh declared Worker role '+role);n=matches[0];workers[role]=n;selected[n]=inner[n];custody.hash(regular(core,spec['cache']),expected=inner[n]);source('core',spec['config']);source('core',spec['entry']);associations[role]={'emitted':n,**spec,'record':inner[n]}
    require(set(policy['requiredHashedWorkerRoles'])<=set(workers),'All old required Worker roles retained')
    old_worker_roles={n:role for role,n in historical['workerRoles'].items()}
    for n in old_files:
        if n.startswith('/'):
            require(n in policy['retainedHostResourcePaths'],'Known inherited Host resource');r=custody.hash(regular(desktop,'active-system/'+n[1:]));selected[n]=r;mapping[n]=n;source('desktop','active-system/'+n[1:]);continue
        role=old_worker_roles.get(n)
        if role is None:
            m=re.fullmatch(r'static/(.+)\.[a-f0-9]{20}\.js',n)
            if m and m.group(1) in workers:role=m.group(1)
        target=workers[role] if role else n;require(target in inner,'Missing inherited logical resource '+n);require(target not in mapping.values(),'Ambiguous inherited logical mapping');mapping[n]=target;selected[target]=inner[target]
    require(set(mapping)==set(old_files) and len(set(mapping.values()))==len(mapping),'EVERY inherited r2 logical obligation exactly once')
    base_mapping={name:mapping[name if r2 else historical['inheritedMappings'][name]] for name in base['files']};require(set(base_mapping)==set(base['files']),'All actual inherited base pins retained')
    components={};component_count=0
    for pref,meta_path in policy['componentPathsByEmittedPrefix'].items():
        emitted={n[len(pref):]:r for n,r in inner.items() if n.startswith(pref)}
        if not emitted:continue
        record,v=custody.json(regular(core,meta_path));component_count+=len(v['files']);require(component_count<=COUNT,'Aggregate prepared component census exceeds bound');records(v['files']);require(Path(v['output']).resolve()==core/str(Path(meta_path).parent),'Prepared component has actual captured output owner');require(all(v['files'].get(n)==r for n,r in emitted.items()),'Emitted/prepared component association '+pref)
        for key in ['bootstrapSha256','workerSha256','jsSha256','wasmSha256']:require(hex64(v[key]),'Actual component identity '+key)
        require(v['bootstrapSha256']==source('core','modules/engine/mount/oci-verified-worker.js')['sha256'],'Component bootstrap not actual captured common source')
        require(any(r['sha256']==v['jsSha256'] for n,r in emitted.items() if n.endswith('.js')) and any(r['sha256']==v['wasmSha256'] for n,r in emitted.items() if n.endswith('.wasm')) and any(r['sha256']==v['workerSha256'] for n,r in emitted.items() if n.endswith('.js')),'Actual component Native/Worker fields must refer to emitted bytes')
        for name,digest in v['sources'].items():require(source('core',name)['sha256']==digest,'Prepared component source differs from actual Git source '+name)
        for n,r in emitted.items():
            custody.hash(regular(core,str(Path(meta_path).parent/n)),expected=r)
            if n.endswith('.mjs'):require(v['sources'].get(n)==r['sha256'],'Verbatim prepared source association '+pref+n)
        components[pref]={'metadata':{'path':meta_path,**record},'format':v['format'],'properties':{k:x for k,x in v.items() if k not in ['files','sources','output']},'preparedFiles':v['files'],'emittedFiles':emitted,'sources':v['sources'],**{k:v[k] for k in ['bootstrapSha256','workerSha256','jsSha256','wasmSha256']}}
        if pref in policy['retainCompleteEmittedCohortPrefixes']:
            for n,r in emitted.items():selected[pref+n]=r
    require(set(policy['retainCompleteEmittedCohortPrefixes'])<=set(components),'Every retained complete cohort actually emitted')
    projection=[]
    for name in policy['allProjectionCopySourcePaths']:
        copies=[n for n in inner if n.endswith('/'+name)];require(copies,'Missing actual projection copies');projection+=copies
        for n in copies:require(inner[n]['sha256']==source('core',name)['sha256'],'Actual verbatim projection source');selected[n]=inner[n]
    verbatim={}
    for name in sorted(set(policy['verbatimChangedSourceCopies']+inputs['additionalVerbatimCopies'])):
        copies=[n for n in inner if n.endswith('/'+name)];require(copies,'Actual changed source has no emitted copy '+name);record=source('core',name);verbatim[name]=copies
        for n in copies:require(inner[n]['sha256']==record['sha256'],'Changed source copy not actual captured bytes '+n);selected[n]=inner[n]
    flat={};prepared=policy['flatSelectedProfile']['preparedDirectory'];require(policy['flatSelectedProfile']['componentManifest'] is None,'No invented flat component metadata');source('core',policy['flatSelectedProfile']['producerSource'])
    for name,spec in inputs['flatSelected'].items():
        record=custody.hash(regular(core,prepared+'/'+name));expected='static/'+name
        if name.endswith('.wasm'):
            matches=[n for n,r in inner.items() if re.fullmatch(r'static/[a-f0-9]{20}\.wasm',n) and r==record];require(len(matches)==1,'One actual flat legacy hashed WASM association');expected=matches[0]
        require(inner.get(expected)==record,'Actual flat prepared/emitted association '+name);selected[expected]=record;flat[name]={'emitted':expected,'kind':spec['kind'],'record':record}
        if spec['kind'] in ['verbatim','literal-rewrite']:
            source('core',spec['source']);text=source_text(core,spec['source'])
            if spec['kind']=='literal-rewrite':
                # Same documented string operation as the actual frozen producer.
                require(spec['before'] in text,'Actual reviewed flat rewrite input missing');text=text.replace(spec['before'],spec['after'])
            require(sha(text.encode())==record['sha256'],'Flat source/rewrite association differs');flat[name]['source']=spec['source']
    selected_producer=source_text(core,policy['flatSelectedProfile']['producerSource']);flat_literals={}
    for name in ['jsSha','wasmSha','bootstrapSha']:
        matches=re.findall(r"\b"+name+r"='([a-f0-9]{64})'",selected_producer);require(len(matches)==1,'Actual flat producer literal identity '+name);flat_literals[name]=matches[0]
    require(flat['selected-profile-occ-portable.js']['record']['sha256']==flat_literals['jsSha'] and flat['selected-profile-occ.wasm']['record']['sha256']==flat_literals['wasmSha'] and source('core','modules/engine/mount/oci-verified-worker.js')['sha256']==flat_literals['bootstrapSha'],'Flat Native/common bootstrap must match actual committed producer literals')
    for name in policy['bundledChangedSourceRoster']+inputs['coreSources']:source('core',name)
    host_stage={}
    for name in inputs['hostSources']:
        rec=source('desktop',name)
        if name.startswith('apps/system/jsketcher/'):
            staged_name='system/jsketcher/'+name[len('apps/system/jsketcher/'):];custody.hash(regular(stage,staged_name),expected={k:rec[k] for k in ['sha256','bytes']});host_stage[name]=staged_name
    for row in inputs['bundledSourceAssociations'].values():
        require(set(row['workerRoles'])<=set(workers),'Every declared bundled-source Worker role exists')
        for name in row['sources']:source('core',name)
    # Small real outer styles are catalog-bound too; no source-as-bundle claim.
    for root,row in [(cad_root,cad),(files_root,files_app)]:
        for name,rec in row['files'].items():
            if root==cad_root and name.startswith(prefix):continue
            custody.hash(regular(root,name),expected=rec)
    selected_bytes=sum(r['bytes'] for n,r in selected.items() if not n.startswith('/'));require(selected_bytes<=TOTAL and len(selected)<=COUNT,'Selected pin census exceeds reviewed bound')
    # Complete current staged inner census is checked, even when only the
    # inherited/added logical subset becomes browser fetch pins.
    for n,rec in inner.items():
        for root,path in [(core,'dist/'+n),(stage,'system/jsketcher/'+prefix+n),(cad_root,prefix+n)]:custody.hash(regular(root,path),expected=rec)
    after={role:checkout(root,commits[role]) for role,root in roots.items()};require(after==before,'Captured clean source identity changed');custody.fence()
    contract={'version':2,'scope':'actual offline assembled pin contract; NOT CAD or compiler-inclusion qualification','source':a.core_commit,'desktop':a.host_commit,'paths':{'coreSource':str(core),'desktopSource':str(desktop),'stage':str(stage),'apps':str(apps),'basePins':str(a.base_pins.resolve())},'sourceInnerPrefix':prefix,'compiledCheckouts':{k:v for k,v in before.items() if k!='acceptance'},'derivationAcceptance':before['acceptance'],'toolSourceRecords':[v for v in source_records.values() if v['role']=='acceptance'],'policy':policy_record,'supplementalInputs':inputs_record,'historicalContract':historical_record,'base':base_record,'outer':outer,'filesApp':files_tuple,'metadata':{k:{x:y for x,y in v.items() if x!='value'} for k,v in metadata.items()},'physicalInnerVerification':'complete-declared-inner-census-dist-stage-catalog','manifestInnerFileCount':len(inner),'manifestInnerBytes':inner_bytes,'inheritedLogicalMappings':mapping,'baseMappings':base_mapping,'workerRoles':workers,'workerAssociations':associations,'bundledSourceAssociations':inputs['bundledSourceAssociations'],'cohortPrefixes':policy['retainCompleteEmittedCohortPrefixes'],'components':components,'projectionResources':sorted(projection),'verbatimSourceCopies':verbatim,'flatSelected':flat,'flatProducerLiterals':flat_literals,'hostStagedSourceCopies':host_stage,'sourceRecords':sorted(source_records.values(),key=lambda x:(x['role'],x['path'])),'files':dict(sorted(selected.items())),'selectedFileCount':len(selected),'selectedBytes':sum(x['bytes'] for x in selected.values()),'streamedBytes':custody.streamed,'remainingAuthority':'Root normal-build provenance and later whole actual fetch/geometry/FIRST remain required; no programmatic assertion of bundled transitive compiler inclusion'}
    return contract,custody,roots,commits,before

def main():
    parser=argparse.ArgumentParser(description=__doc__);sub=parser.add_subparsers(dest='mode',required=True)
    for mode in ['derive','pins']:
        p=sub.add_parser(mode)
        for name in ['base-pins','apps','stage','core-source','desktop-source','output']:p.add_argument('--'+name,type=Path,required=True)
        for name in ['core-commit','host-commit','acceptance-commit']:p.add_argument('--'+name,required=True)
        if mode=='pins':p.add_argument('--reviewed-contract',type=Path,required=True)
    a=parser.parse_args();current,captured,roots,commits,before=derive(a);blocked=[ROOT,*[Path(current['paths'][k]) for k in ['coreSource','desktopSource','stage','apps']]]
    if a.mode=='derive':result=current
    else:
        custody=Custody();contract_path=a.reviewed_contract.resolve(strict=True);relative=contract_path.relative_to(ROOT).as_posix();contract_source=git_source(custody,'acceptance',ROOT,a.acceptance_commit,relative);contract_record,reviewed=custody.json(contract_path);require(reviewed['version']==2,'Explicit reviewed derived contract version')
        # A review commit may add the frozen contract while leaving helper
        # bytes unchanged. Actual current acceptance identity is separately kept.
        reviewed_compare=copy.deepcopy(reviewed)
        for name in ['derivationAcceptance','streamedBytes']:
            current.pop(name,None);reviewed_compare.pop(name,None)
        require(current==reviewed_compare,'Actual fresh tuple differs from the separately reviewed committed contract')
        base_record,base=custody.json(a.base_pins.resolve(strict=True));require(base_record==current['base'],'Inherited base changed');result=copy.deepcopy(base);result.update(source=current['source'],desktop=current['desktop'],outer=current['outer'],filesApp=current['filesApp'],additionalCohortPrefixes=current['cohortPrefixes'],files={n:r['sha256'] for n,r in current['files'].items()});result['inheritedAssembledReceipt']={'record':base_record,'pins':base};result['pinPreparation']={'scope':'offline stream-verified metadata; NOT CAD/Native qualification','reviewedContract':{'path':relative,**contract_record,'gitBlobOID':contract_source['gitBlobOID']},'compiledCheckouts':current['compiledCheckouts'],'acceptanceCheckout':checkout(ROOT,a.acceptance_commit),'sourceRecords':current['sourceRecords'],'baseMappings':current['baseMappings'],'inheritedLogicalMappings':current['inheritedLogicalMappings'],'selectedFileCount':current['selectedFileCount'],'selectedBytes':current['selectedBytes'],'hashStreamFileBytes':captured.streamed+custody.streamed,'metadata':current['metadata']};custody.fence()
    captured.fence();require({role:checkout(root,commits[role]) for role,root in roots.items()}==before,'Final source identities changed before exclusive output')
    receipt=output(a.output,result,blocked)
    captured.fence();require({role:checkout(root,commits[role]) for role,root in roots.items()}==before,'Source/inputs changed during output; retain failed artifact without retry')
    print(json.dumps({'scope':'source/build/stage pin metadata only; no CAD qualification','mode':a.mode,**receipt,'source':a.core_commit,'desktop':a.host_commit,'selectedFileCount':current['selectedFileCount'],'selectedBytes':current['selectedBytes'],'hashStreamFileBytes':captured.streamed+(custody.streamed if a.mode=='pins' else 0)}))
if __name__=='__main__':main()
