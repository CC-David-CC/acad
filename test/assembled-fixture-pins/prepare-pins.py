#!/usr/bin/env python3
"""Exclusive exact assembled-fixture pin preparation; metadata, not CAD proof."""
import argparse,copy,hashlib,json,os,re,stat,subprocess
from pathlib import Path,PurePosixPath

def require(value,message):
    if not value:raise ValueError(message)
def digest(raw):return hashlib.sha256(raw).hexdigest()
def object_pairs(pairs):
    value={}
    for k,v in pairs:
        require(k not in value,'Duplicate JSON key');value[k]=v
    return value
def read_json(path,maximum=2097152):
    raw=path.read_bytes();require(0<len(raw)<=maximum,'Bounded metadata bytes: '+str(path))
    return raw,json.loads(raw.decode('utf-8'),object_pairs_hook=object_pairs,parse_constant=lambda v:(_ for _ in ()).throw(ValueError('Nonfinite JSON '+v)))
def git(repo,*args):
    r=subprocess.run(['git','-C',str(repo),*args],stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=False);require(r.returncode==0,'Git source custody failed: '+r.stderr.decode('utf-8',errors='replace')[:512]);return r.stdout

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    for name in ('base-pins','apps','stage','core-source','desktop-source','output'):parser.add_argument('--'+name,type=Path,required=True)
    a=parser.parse_args();contract_path=Path(__file__).with_name('assembled-r1-contract.json');contract_raw,c=read_json(contract_path)
    require(c['version']==1,'Known frozen contract version')
    supplied={'basePins':a.base_pins,'apps':a.apps,'stage':a.stage,'coreSource':a.core_source,'desktopSource':a.desktop_source}
    for key,path in supplied.items():require(path.resolve()==Path(c['paths'][key]).resolve(),'Use this exact frozen fixture/input: '+key)
    require(not a.output.exists() and not a.output.is_symlink() and a.output.parent.is_dir(),'Choose a NEW exclusive output in an existing directory')
    output=a.output.resolve()
    for directory in (a.apps,a.stage,a.core_source,a.desktop_source):require(not output.is_relative_to(directory.resolve()),'Output must not mutate fixture or producing source trees')
    base_raw,base=read_json(a.base_pins);require(digest(base_raw)==c['base']['sha256'] and len(base_raw)==c['base']['bytes'],'Preserve exact historical298-pin input')
    require(len(base['files'])==c['base']['files']==298 and all(base[k]==c['base'][k] for k in ('source','desktop','outer','filesApp')),'Historical receipt tuple differs')
    def heads():
        values={}
        for key,repo,pin in [('core',a.core_source,c['source']),('desktop',a.desktop_source,c['desktop'])]:
            head=git(repo,'rev-parse','HEAD').decode().strip();require(head==pin and re.fullmatch('[a-f0-9]{40}',head),'Exact compiled '+key+' source HEAD differs');require(not git(repo,'status','--porcelain','--untracked-files=no').strip(),'Tracked source changed: '+key);values[key]={'repo':str(repo.resolve()),'commit':head}
        return values
    before_heads=heads();metadata={}
    for key,expected in c['metadata'].items():
        path=Path(expected['path']);raw,value=read_json(path);require(len(raw)==expected['bytes'] and digest(raw)==expected['sha256'],'Frozen staging metadata differs: '+key);metadata[key]=(raw,value)
    catalog=metadata['catalog'][1];require(catalog['version']=='codi-public-apps/2' and catalog['hostAPI']==2,'Exact app catalog format')
    def mounted(app_id,tuple_):
        rows=[row for row in catalog['apps'] if row['id']==app_id];require(len(rows)==1,'One actual app '+app_id);row=rows[0];require({k:row[k] for k in ('bundleSHA256','sha256','path')}==tuple_,'Frozen app tuple changed: '+app_id)
        require(tuple_['path']=='assets/desktop/apps/'+app_id+'/'+tuple_['bundleSHA256']+'/index.mjs','Known actual app path schema');return a.apps/'apps'/app_id/tuple_['bundleSHA256'],row
    cad_root,cad=mounted('jsketcher',c['outer']);files_root,files_app=mounted('files',c['filesApp']);prefix=c['sourceInnerPrefix'];inner={name[len(prefix):]:v for name,v in cad['files'].items() if name.startswith(prefix)}
    require(len(inner)==c['manifestInnerFileCount'] and sum(v['bytes'] for v in inner.values())==c['manifestInnerBytes'],'Actual manifest census changed')
    stage=metadata['stagePins'][1];require(stage['desktopSource']==str(a.desktop_source) and stage['cadDist']==str(a.core_source/'dist') and stage['assetBytes']==c['manifestInnerBytes'],'Actual stage producer identity differs')
    require(metadata['builderConfig'][1]=={'source':str(a.stage),'output':str(a.apps),'apps':['jsketcher','files'],'entries':{'jsketcher':'system/jsketcher/index.mjs','files':'system/files/index.mjs'}},'Actual builder inputs differ')
    selected=c['files'];mapping=c['inheritedMappings'];require(set(mapping)==set(base['files']) and len(set(mapping.values()))==len(mapping) and all(name in selected for name in mapping.values()),'EVERY old logical pin retained exactly once')
    require(len(selected)==c['selectedFileCount']==367 and sum(v['bytes'] for v in selected.values())==c['selectedBytes']==314931800,'Frozen bounded pin selection differs')
    for name,record in selected.items():
        require(set(record)=={'sha256','bytes'} and re.fullmatch('[a-f0-9]{64}',record['sha256']) and type(record['bytes']) is int and record['bytes']>=0,'Exact bounded file record')
        if not name.startswith('/'):require(inner.get(name)==record and stage['files'].get(prefix+name)==record,'Catalog/stage association differs: '+name)
    for pref in c['cohortPrefixes']:
        require({k:v for k,v in inner.items() if k.startswith(pref)}=={k:v for k,v in selected.items() if k.startswith(pref)},'Whole emitted retained cohort omitted: '+pref)
    projection=sorted(name for name in inner if name.endswith('/sourceProjectionIntent.mjs') or name.endswith('/sourceFrameIntent.mjs') or name.endswith('/authoredFeatureIdentity.mjs'))
    require(projection==sorted(c['projectionResources']) and all(name in selected for name in projection),'All actual projection resource copies retained')
    for role,target in c['workerRoles'].items():require([name for name in inner if re.fullmatch('static/'+re.escape(role)+r'\.[a-f0-9]{20}\.js',name)]==[target] and target in selected,'One actual current Worker role: '+role)
    component_snapshots={}
    for pref,expected in c['components'].items():
        path=a.core_source/expected['path'];raw,v=read_json(path);require(len(raw)==expected['bytes'] and digest(raw)==expected['sha256'],'Actual component metadata differs: '+pref);component_snapshots[str(path)]=raw
        emitted={name[len(pref):]:record for name,record in inner.items() if name.startswith(pref)}
        require(emitted==expected['emittedFiles'] and len(v['files'])==expected['preparedFileCount'] and all(v['files'].get(name)==record for name,record in emitted.items()),'Actual emitted/prepared component association differs: '+pref)
        require(all(v[key]==expected[key] for key in ('bootstrapSha256','workerSha256','jsSha256','wasmSha256')),'Actual component Native/bootstrap binding differs: '+pref)
        require(all(v['sources'].get(name)==record['sha256'] for name,record in emitted.items() if name.endswith('.mjs')),'Verbatim emitted module/source binding differs: '+pref)
        if pref=='static/analytic-profile/':require(emitted==v['files'] and len(emitted)==25 and v['jsSha256']=='717767d46f3f260b1458d702e1e61d2a1a90f6e3c48400ac5943a11db577c484' and v['wasmSha256']=='47c9d4c96b61ba1a2792c72ccf1b7f2e22d5faa5b50948db144032436edeba25','Exact complete new analytic cohort')
    verified=[];stats={};streamed=0
    def verify(path,expected):
        nonlocal streamed
        path=path.resolve();s=path.stat();require(stat.S_ISREG(s.st_mode) and s.st_size==expected['bytes'],'Exact actual file size: '+str(path));identity=(s.st_dev,s.st_ino,s.st_size,s.st_mtime_ns);h=hashlib.sha256();size=0
        with path.open('rb') as stream:
            for chunk in iter(lambda:stream.read(1048576),b''):h.update(chunk);size+=len(chunk);require(size<=expected['bytes'],'Actual file grew: '+str(path))
        end=path.stat();require((end.st_dev,end.st_ino,end.st_size,end.st_mtime_ns)==identity and size==expected['bytes'] and h.hexdigest()==expected['sha256'],'Actual staged bytes differ: '+str(path));stats[str(path)]=identity;streamed+=size;verified.append(str(path))
    for root,row in ((cad_root,cad),(files_root,files_app)):
        r=row['files']['index.mjs'];require(r['sha256']==row['sha256'] and r['bytes']==row['bytes'],'Actual outer entry bytes');verify(root/'index.mjs',r)
    for name,expected in selected.items():
        if name.startswith('/'):
            require(name in base['files'] and name in ('/desktop-apps.js','/storage/browser/mirror.mjs','/storage/browser/account-context.mjs','/storage/browser/verified-content.mjs'),'Only retained actual host resources');path=a.desktop_source/'active-system'/name.lstrip('/')
        else:
            relative=PurePosixPath(name);require(not relative.is_absolute() and '..' not in relative.parts and str(relative)==name,'Exact relative asset path');path=cad_root/prefix/name;require(path.resolve().is_relative_to(cad_root.resolve()),'Selected asset belongs to actual app')
        verify(path,expected)
    # Source-tool custody is distinct from the immutable compiled producer.
    tool_root=Path(__file__).resolve().parents[2];tool_commit=git(tool_root,'rev-parse','HEAD').decode().strip();tool_sources=[]
    for name in ('prepare-pins.py','assembled-r1-contract.json','README.md'):
        path=Path(__file__).with_name(name);relative=path.resolve().relative_to(tool_root).as_posix();raw=path.read_bytes();blob=git(tool_root,'rev-parse',tool_commit+':'+relative).decode().strip();require(git(tool_root,'cat-file','blob',blob)==raw,'Source helper is actual committed bytes');tool_sources.append({'repo':str(tool_root),'commit':tool_commit,'path':relative,'blob':blob,'sha256':digest(raw),'bytes':len(raw)})
    require(heads()==before_heads,'Compiled source identities changed during pinning')
    require(a.base_pins.read_bytes()==base_raw,'Historical pins changed')
    for key,(raw,_) in metadata.items():require(Path(c['metadata'][key]['path']).read_bytes()==raw,'Staging metadata changed')
    for name,raw in component_snapshots.items():require(Path(name).read_bytes()==raw,'Component metadata changed')
    for name,identity in stats.items():
        s=Path(name).stat();require((s.st_dev,s.st_ino,s.st_size,s.st_mtime_ns)==identity,'Verified staged file changed after stream read')
    require(git(tool_root,'rev-parse','HEAD').decode().strip()==tool_commit and all(git(tool_root,'cat-file','blob',s['blob'])==(tool_root/s['path']).read_bytes() for s in tool_sources),'Tool source changed')
    result=copy.deepcopy(base);result.update(source=c['source'],desktop=c['desktop'],outer=c['outer'],filesApp=c['filesApp'],additionalCohortPrefixes=c['cohortPrefixes'],files={name:record['sha256'] for name,record in selected.items()})
    result['priorMultiprofileReceipt']={'sha256':c['base']['sha256'],'bytes':len(base_raw),'pins':base}
    result['pinPreparation']={'scope':'stream-verified selected fixture metadata, not CAD qualification','contractSHA256':digest(contract_raw),'compiledSources':before_heads,'toolSources':tool_sources,'inheritedMappings':mapping,'metadata':c['metadata'],'components':{pref:{k:v for k,v in r.items() if k not in ('emittedFiles',)} for pref,r in c['components'].items()},'selectedFileCount':len(selected),'selectedBytes':c['selectedBytes'],'manifestInnerBytes':c['manifestInnerBytes'],'streamedBytesIncludingOuterEntries':streamed}
    payload=(json.dumps(result,indent=2)+'\n').encode('utf-8')
    with a.output.open('xb') as target:target.write(payload);target.flush();os.fsync(target.fileno())
    print(json.dumps({'scope':result['pinPreparation']['scope'],'output':str(a.output),'sha256':digest(payload),'files':len(selected),'selectedBytes':c['selectedBytes'],'streamedBytesIncludingOuterEntries':streamed,'source':c['source'],'desktop':c['desktop']}))
if __name__=='__main__':main()
