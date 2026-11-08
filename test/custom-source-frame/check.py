#!/usr/bin/env python3
"""Independent AFTER-wholeflow oracle; no production validator/math imported.
make-bad creates only own CRC/SHA-correct negative files inside the whole run.
"""
import binascii, hashlib, importlib.util, json, math, sys, zlib
from pathlib import Path
base=Path(__file__).resolve().parents[1]/'native-cad-container'/'archive_oracle.py'
spec=importlib.util.spec_from_file_location('independent_zip',base);arc=importlib.util.module_from_spec(spec);spec.loader.exec_module(arc)
def require(ok,message):
    if not ok:raise ValueError(message)
def close(a,b,t=5e-8):require(math.isfinite(a) and abs(a-b)<=t,'numeric difference: '+str((a,b,t)))
def add(a,b):return [x+y for x,y in zip(a,b)]
def mul(a,n):return [x*n for x in a]
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def cross(a,b):return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]
def point(frame,p):return add(frame['origin'],[sum(frame[k][i]*p[j] for j,k in enumerate(('x','y','z'))) for i in range(3)])
identity={'origin':[0,0,0],'x':[1,0,0],'y':[0,1,0],'z':[0,0,1]}
def local_frame(placement):
    f=json.loads(json.dumps(placement['frame']))
    if placement['kind']=='rigid':
        axis=placement['axis'];axis=mul(axis,1/math.sqrt(dot(axis,axis)));c=math.cos(math.radians(placement['angleDegrees']));s=math.sin(math.radians(placement['angleDegrees']))
        def rotate(v):return add(add(mul(v,c),mul(cross(axis,v),s)),mul(axis,dot(axis,v)*(1-c)))
        f={'origin':add(add(placement['pivot'],rotate(add(f['origin'],mul(placement['pivot'],-1)))),placement['translation']),**{k:rotate(f[k]) for k in ('x','y','z')}}
    return f
def compose(parent,local):return {'origin':point(parent,local['origin']),**{k:[sum(parent[q][i]*local[k][j] for j,q in enumerate(('x','y','z'))) for i in range(3)] for k in ('x','y','z')}}
def model_frames(model,receipt):
    frames={};sources={};principals={};bindings=receipt['binding'];known={int(bindings['parent']['featureId']):bindings['parent']['faceId'],int(bindings['child']['featureId']):bindings['child']['faceId']}
    if receipt.get('secondary'):known.update({int(receipt['secondary']['parent']['featureId']):receipt['secondary']['parent']['faceId'],int(receipt['secondary']['source']['featureId']):receipt['secondary']['source']['faceId']})
    for row in model['history']:
        p=row['params'];fid=int(p['featureId'])
        if row['type']=='PLANE':
            # These are the actual current principal operation conventions,
            # independently stated, not imported from production basis code.
            basis={'XY':([1,0,0],[0,1,0],[0,0,1]),'XZ':([-1,0,0],[0,0,1],[0,1,0]),'ZY':([0,0,-1],[0,1,0],[1,0,0])}[p['orientation']]
            frame={'origin':mul(basis[2],p['depth']),**dict(zip(('x','y','z'),basis))};principals[fid]=frame;frames[fid]=frame
        elif row['type']=='SOURCE_FRAME_V1':
            parent=p['parent'];parent_frame=identity if parent is None else frames[int(parent['featureId'])]
            if parent is not None:require(parent['faceId']==known[int(parent['featureId'])],'exact actual source-parent locator')
            frame=compose(parent_frame,local_frame(p['placement']));frames[fid]=frame;sources[known[fid]]=frame
    return frames,sources
def check_source(model,sketches,receipt):
    frames,sources=model_frames(model,receipt)
    require(len({int(r['params']['featureId']) for r in model['history']})==len(model['history']),'unique canonical features')
    for sid,expected in sources.items():
        raw=sketches[sid];source=json.loads(raw) if isinstance(raw,str) else raw;actual=source['metadata']['boundaryFrame']
        for key in ('origin','x','y','z'):
            for a,b in zip(actual[key],expected[key]):close(a,b,1e-9)
        require(source['boundary']=={'lines':[],'arcs':[],'circles':[],'nurbses':[]},'no external boundary data silently dropped')
        if sid==receipt['binding']['child']['faceId']:
            value=json.loads(json.dumps(source));value['metadata']['boundaryFrame']=None;require(value==receipt['baselineLocal'],'exact complete local intent across frames')
    return frames
def rewrite_row(row,value):
    raw=json.dumps(value,ensure_ascii=False,separators=(',',':')).encode();encoder=zlib.compressobj(6,zlib.DEFLATED,-15);row.update(compressed=encoder.compress(raw)+encoder.flush(),bytes=len(raw),crc=binascii.crc32(raw)&0xffffffff);return raw
def make_bad(source,destination):
    source=Path(source);destination=Path(destination);destination.mkdir(parents=True,exist_ok=False);info=arc.read_archive(source);proof=json.loads((source.parent/'receipt.json').read_text());result=[]
    for kind,code in [('cache','STALE_FRAME'),('parent','INVALID_FRAME_DEPENDENCY')]:
        rows=[dict(r) for r in arc.structure(source.read_bytes())];manifest=json.loads(json.dumps(info['manifest']));parent=proof['binding']['parent'];child=proof['binding']['child']
        if kind=='cache':
            descriptor=next(e for e in manifest['entries'] if e['role']=='sketch' and e['logicalId']==parent['faceId']);value=json.loads(info['rawSketches'][parent['faceId']]);value['metadata']['boundaryFrame']['origin'][0]+=1
        else:
            descriptor=next(e for e in manifest['entries'] if e['role']=='model');value=info['envelope']['project']['model'];target=next(e for e in value['history'] if int(e['params']['featureId'])==parent['featureId']);target['params']['parent']={'featureId':child['featureId'],'faceId':child['faceId']}
        row=next(r for r in rows if r['path']==descriptor['path']);raw=rewrite_row(row,value);descriptor.update(bytes=len(raw),sha256=arc.sha(raw));manifest['designRevision']=arc.sha(arc.canonical(arc.root_record(manifest)));rows[-1]=arc.manifest_row(manifest);file=destination/(kind+'.cad');file.write_bytes(arc.rebuild(rows));arc.read_archive(file);result.append({'kind':kind,'code':code,'file':str(file.resolve()),'sourceSha256':info['sha256']})
    return result
def check(directory):
    directory=Path(directory);r=json.loads((directory/'receipt.json').read_text());require(r['status']=='PASS','whole run must pass before oracle');require(r['ownedContextClosed'] and r['sharedBrowserDisconnectedOnly'] and r['sourceUnchanged'] and r['remainingOwnedTargets']==[] and len(r['ownedContextIds'])>=5,'cleanup/source pins');require(not r['privateAuthoring'] and not r['sourceSeeds'],'public authoring only');require(len(r['saves'])==4 and len(r['malformed'])==2,'complete normal files and own negatives');require('phaseB OPEN' in r['scope'],'no C08 closure claim')
    for row in r['sourcePins']:require(hashlib.sha256((directory/row['file']).read_bytes()).hexdigest()==row['sha256'],'frozen source pin')
    for observation in r['observations']:
        state=observation['before'];native=state['capture']['native'];frames=check_source({'history':native['history']},{s['id']:s['source'] for s in native['sketches']},r);f=frames[int(r['binding']['child']['featureId'])];body=next(b for b in state['capture']['solids']['bodies'] if b['featureId']==r['profile']['featureId']);m=body['metrics'];close(m['nativeVolume'],1500,1e-6);require(m['nativeValidity']['valid'] and m['solidCount']==1,'actual Native one-solid result');require('sha256:'+m['runtime']['jsSha256']+':'+m['runtime']['wasmSha256']==r['engineRevision'],'exact Native pair')
        corners=[point(f,[x,y,z]) for x in (0,30) for y in (0,10) for z in (0,5)]
        for key,reduce in [('min',min),('max',max)]:
            for i,a in enumerate(m['nativeBounds'][key]):close(a,reduce(v[i] for v in corners),1e-6)
        q=observation['query'];require(q['quality']=='native-re-evaluation-observation' and [p['classification'] for p in q['points']]==['inside','outside','outside'],'actual Native point classes');
        for got,want in zip(q['points'],[point(f,[15,5,2.5]),point(f,[31,5,2.5]),point(f,[15,5,6])]):
            for a,b in zip(got['point'],want):close(a,b)
        fixed=next(b for b in state['capture']['solids']['bodies'] if b['featureId']==r['box']['featureId']);baseline_fixed=next(b for b in r['observations'][0]['before']['capture']['solids']['bodies'] if b['featureId']==r['box']['featureId']);require(fixed['metrics']==baseline_fixed['metrics'],'unrelated Native box facts unchanged');close(fixed['metrics']['nativeVolume'],6000,1e-6)
        if observation['secondaryObservation'] is not None:
            sid=r['secondary']['source']['faceId'];df=frames[int(r['secondary']['source']['featureId'])];ds=json.loads(next(x['source'] for x in native['sketches'] if x['id']==sid));circles=[o for o in ds['objects'] if o['type']=='Circle'];require(len(ds['objects'])==len(circles)==1,'actual secondary circle source');circle=circles[0]['data'];require(circle['r']==2 and circle['c']=={'x':0,'y':0},'unchanged local secondary intent');dp=next(x for x in native['history'] if int(x['params']['featureId'])==r['secondaryProfile']['featureId']);require(dp['params']['faceId']==sid and dp['params']['depth']==4,'actual source-bound secondary feature');db=next(b for b in state['capture']['solids']['bodies'] if b['featureId']==r['secondaryProfile']['featureId']);close(db['metrics']['nativeVolume'],math.pi*2**2*4,1e-6)
            for i in range(3):
                radial=2*math.hypot(df['x'][i],df['y'][i]);lo=df['origin'][i]+min(0,4*df['z'][i])-radial;hi=df['origin'][i]+max(0,4*df['z'][i])+radial;close(db['metrics']['nativeBounds']['min'][i],lo,1e-6);close(db['metrics']['nativeBounds']['max'][i],hi,1e-6)
            secondary=observation['secondaryObservation'];require([p['classification'] for p in secondary['points']]==['inside','outside'],'secondary actual Native classes')
            for got,want in zip(secondary['points'],[point(df,[0,0,2]),point(df,[3,0,2])]):
                for a,b in zip(got['point'],want):close(a,b)
        require(observation['before']==observation['after'],'read-only accepted state exact');usage=state['ownership']['resources'];require(not usage['cleanupFailed'] and usage['candidates']==usage['accepted']==usage['mounts']==0,'settled resources')
    for saved in r['saves']:
        info=arc.read_archive(directory/saved['savedFile']);require(info['sha256']==saved['sha256'],'actual native file hash');check_source(info['envelope']['project']['model'],info['rawSketches'],r);model=info['envelope']['project']['model'];before=saved['before']['capture']['native'];require(model['history']==before['history'],'saved exact authored history');require(model['counters']==before['counters'],'high-water persisted');require(info['rawSketches']=={s['id']:s['source'] for s in before['sketches']},'exact accepted source bytes saved');require(info['envelope'].get('presentation')=={'version':1,'lengthUnit':'inch'},'display presentation only')
    require(all(not row['error']['committed'] and not row['error']['possiblyCommitted'] for row in r['refusals']),'honest refusal outcomes')
    return {'status':'PASS','scope':'C08 phaseA AFTER-wholeflow source/frame/Native oracle; phaseB required/open','nativeObservations':len(r['observations']),'nativeFiles':len(r['saves']),'cache':'persisted derived witness, independently recomputed','geometricPositionBudgetMm':5e-8,'nativeBoundsToleranceMm':1e-6,'nativeVolumeToleranceMm3':1e-6,'notClaimed':['Native solid-face attachment','general mirror/assembly/typed frame support','Native validity from ZIP/mesh','50pm Native surface-bound certification']}
if __name__=='__main__':
    if len(sys.argv)==4 and sys.argv[1]=='make-bad':print(json.dumps(make_bad(sys.argv[2],sys.argv[3])))
    elif len(sys.argv)==2:print(json.dumps(check(sys.argv[1]),indent=2))
    else:raise SystemExit('check.py EVIDENCE | make-bad FILE.cad NEWDIR')
