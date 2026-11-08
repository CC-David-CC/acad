#!/usr/bin/env python3
"""AFTER-wholeflow independent ZIP/source/analytic oracle, never production code.
make-bad writes only own CRC/SHA-correct negative files during the complete run.
"""
import binascii, hashlib, importlib.util, json, math, sys, zlib
from pathlib import Path
base=Path(__file__).resolve().parents[1]/'native-cad-container'/'archive_oracle.py'
spec=importlib.util.spec_from_file_location('independent_zip',base);arc=importlib.util.module_from_spec(spec);spec.loader.exec_module(arc)
def require(ok,message):
    if not ok:raise ValueError(message)
def close(a,b,t=5e-8):require(math.isfinite(a) and abs(a-b)<=t,'numeric difference '+str((a,b,t)))
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
def frame_close(a,b,t=1e-9):
    for key in ('origin','x','y','z'):
        for actual,expected in zip(a[key],b[key]):close(actual,expected,t)
def one(rows,label):require(len(rows)==1,label);return rows[0]
def feature(model,fid):return one([row for row in model['history'] if int(row['params']['featureId'])==int(fid)],'one saved feature '+str(fid))
def known_sources(receipt):return {int(receipt[key]['featureId']):receipt[key]['faceId'] for key in ('profileSource','alternateSource','attached')}
def source_frames(model,receipt):
    known=known_sources(receipt);by_id={};by_face={}
    for row in model['history']:
        if row['type']!='SOURCE_FRAME_V1':continue
        p=row['params'];fid=int(p['featureId']);parent=p['parent']
        if parent is None:parent_frame=identity
        elif parent.get('kind')=='native-planar-face':
            # This finite oracle uses the original selected extrusion directly.
            # It does not infer arbitrary current topology from nominal depth.
            constructor=feature(model,parent['sourceFeatureId']);cp=constructor['params']
            require(constructor['type']=='WORKER_SELECTED_PROFILE_EXTRUDE_V2' and int(parent['featureId'])==int(parent['sourceFeatureId'])==int(parent['originFeatureId']),'actual direct extrusion-cap fixture')
            require(parent['sourceFaceId']==cp['faceId'] and parent['sourceRegionId']==cp['regionId'],'exact saved source/region locator')
            require(parent['engine']=='occ' and parent['engineRevision']==cp['engineRevision']==receipt['engineRevision'],'one explicit native cohort')
            require(parent['framePolicy']=='extrusion-cap-source-datum-v1','explicit datum policy')
            source=by_face[cp['faceId']];parent_frame={**source,'origin':point(source,[0,0,cp['depth']])}
        else:
            require(parent['faceId']==known[int(parent['featureId'])],'actual earlier source locator');parent_frame=by_id[int(parent['featureId'])]
        f=compose(parent_frame,local_frame(p['placement']));by_id[fid]=f;by_face[known[fid]]=f
    return by_id,by_face
def check_source(model,sketches,receipt,baseline=True):
    ids=[int(row['params']['featureId']) for row in model['history']];require(len(ids)==len(set(ids)),'globally unique canonical feature IDs')
    frames,by_face=source_frames(model,receipt)
    for sid,want in by_face.items():
        raw=sketches[sid];value=json.loads(raw) if isinstance(raw,str) else raw;frame_close(value['metadata']['boundaryFrame'],want)
        require(value['boundary']=={'lines':[],'arcs':[],'circles':[],'nurbses':[]},'no external source boundary drop')
        if baseline and sid==receipt['attached']['faceId']:
            detached=json.loads(json.dumps(value));detached['metadata']['boundaryFrame']=None;require(detached==receipt['baselineLocal'],'exact complete local circle/constraints/identity intent')
    return frames,by_face
def rewrite_row(row,value):
    # Model canonical keys are required by the genuine archive validator too.
    raw=arc.canonical(value);encoder=zlib.compressobj(6,zlib.DEFLATED,-15);row.update(compressed=encoder.compress(raw)+encoder.flush(),bytes=len(raw),crc=binascii.crc32(raw)&0xffffffff);return raw
def make_bad(source,destination):
    source=Path(source);destination=Path(destination);destination.mkdir(parents=True,exist_ok=False);info=arc.read_archive(source);proof=json.loads((source.parent/'receipt.json').read_text());result=[]
    for kind,code in [('cache','STALE_FRAME'),('parent','INVALID_FRAME_DEPENDENCY')]:
        rows=[dict(r) for r in arc.structure(source.read_bytes())];manifest=json.loads(json.dumps(info['manifest']));attached=proof['attached']
        if kind=='cache':
            descriptor=one([e for e in manifest['entries'] if e['role']=='sketch' and e['logicalId']==attached['faceId']],'own attached source entry');value=json.loads(info['rawSketches'][attached['faceId']]);value['metadata']['boundaryFrame']['origin'][2]+=1
        else:
            descriptor=one([e for e in manifest['entries'] if e['role']=='model'],'own model entry');value=json.loads(json.dumps(info['envelope']['project']['model']));target=feature(value,attached['featureId']);require(all(int(r['params']['featureId'])!=999999 for r in value['history']),'own negative ID is absent');target['params']['parent']['featureId']=999999;target['params']['parent']['bodyId']='own-negative-body'
        row=one([r for r in rows if r['path']==descriptor['path']],'entry row');raw=rewrite_row(row,value);descriptor.update(bytes=len(raw),sha256=arc.sha(raw));manifest['designRevision']=arc.sha(arc.canonical(arc.root_record(manifest)));rows[-1]=arc.manifest_row(manifest);file=destination/(kind+'.cad');file.write_bytes(arc.rebuild(rows));arc.read_archive(file);result.append({'kind':kind,'code':code,'file':str(file.resolve()),'sourceSha256':info['sha256']})
    return result
def cylinder_bounds(frame):
    center=point(frame,[50,25,0]);bounds={'min':[],'max':[]}
    for i in range(3):
        radial=5*math.hypot(frame['x'][i],frame['y'][i]);bounds['min'].append(center[i]+min(0,10*frame['z'][i])-radial);bounds['max'].append(center[i]+max(0,10*frame['z'][i])+radial)
    return bounds
def inverse(frame,world):return [dot(add(world,mul(frame['origin'],-1)),frame[k]) for k in ('x','y','z')]
def material_cylinder(frame,world):
    x,y,z=inverse(frame,world);return 'inside' if (x-50)**2+(y-25)**2<25 and 0<z<10 else 'outside'
def check_native(observation,receipt):
    require(observation['before']==observation['after'],'Native read accepted state exact');state=observation['before'];native=state['capture']['native'];model={'history':native['history']};frames,by_face=check_source(model,{s['id']:s['source'] for s in native['sketches']},receipt)
    frame=frames[int(receipt['attached']['featureId'])];actual_frame=one([r for r in state['frames']['features'] if r['featureId']==receipt['attached']['featureId']],'accepted frame');frame_close(actual_frame['frame'],frame)
    child=one([b for b in state['capture']['solids']['bodies'] if b['featureId']==receipt['child']['featureId']],'actual child body');metrics=child['metrics'];require(metrics['nativeValidity']['valid'] and metrics['solidCount']==1,'actual valid native single solid');close(metrics['nativeVolume'],250*math.pi,1e-6);require('sha256:'+metrics['runtime']['jsSha256']+':'+metrics['runtime']['wasmSha256']==receipt['engineRevision'],'exact native byte pair')
    expected=cylinder_bounds(frame)
    for key in ('min','max'):
        for a,b in zip(metrics['nativeBounds'][key],expected[key]):close(a,b,1e-6)
    query=observation['query'];require(query['quality']=='native-re-evaluation-observation' and query['bodyId']==child['id'] and query['featureId']==child['featureId'],'actual bound native query');require([p['classification'] for p in query['points']]==['inside','outside','outside'],'independent expected material/void observations')
    for p in query['points']:require(p['classification']==material_cylinder(frame,p['point']),'original cylinder equation at actual queried point')
    definition=feature(model,receipt['child']['featureId']);require(definition['params']['faceId']==receipt['attached']['faceId'] and definition['params']['depth']==10,'stable source-bound child extrusion')
    for key in ('parent','alternative'):
        body=one([b for b in state['capture']['solids']['bodies'] if b['featureId']==receipt[key]['featureId']],'actual '+key+' body');p=feature(model,receipt[key]['featureId'])['params'];close(body['metrics']['nativeVolume'],100*50*p['depth'],1e-6)
    parent=feature(model,receipt['parent']['featureId'])['params'];pf=by_face[parent['faceId']];xmin=140 if parent['regionId']==receipt.get('reselectedRegionId') else 0
    for p in observation['parentQuery']['points']:
        x,y,z=inverse(pf,p['point']);expected='inside' if xmin<x<xmin+100 and 0<y<50 and 0<z<parent['depth'] else 'outside';require(p['classification']==expected,'original transformed rectangle/prism material equation')
    usage=state['ownership']['resources'];require(not usage['cleanupFailed'] and usage['candidates']==usage['accepted']==usage['mounts']==0,'settled observation owner')
def check_discovery(row,receipt):
    require(row['before']==row['after'],'planar observation is read-only');state=row['before'];native=state['capture']['native'];model={'history':native['history']};_,frames=check_source(model,{s['id']:s['source'] for s in native['sketches']},receipt,False)
    reply=row['reply'];require(reply['quality']=='native-re-evaluation-planar-attachment' and reply['engineRevision']==receipt['engineRevision'],'actual planar read quality and build')
    for item in reply['parents']:
        p=item['parent'];observation=item['observation'];constructor=feature(model,p['sourceFeatureId'])['params'];source=frames[constructor['faceId']];wanted={**source,'origin':point(source,[0,0,constructor['depth']])}
        require(p['bodyId']==reply['bodyId'] and p['featureId']==reply['featureId'] and p['sourceRegionId']==constructor['regionId'],'actual current body/source binding');require(observation['role']=='last-cap' and observation['quality']=='native-owned-planar-attachment' and observation['scope']=='response-local','native planar evidence, not display cache');frame_close(observation['frame'],wanted)
        plane=observation['plane'];normal=mul(plane['normal'],1 if plane['orientation']=='FORWARD' else -1);close(dot(normal,wanted['z']),1,1e-12);close(dot(add(wanted['origin'],mul(plane['origin'],-1)),normal),0,1e-9)
def check(directory):
    directory=Path(directory);r=json.loads((directory/'receipt.json').read_text());require(r['status']=='PASS','whole workflow must PASS before independent oracle');require(r['ownedContextClosed'] and r['sharedBrowserDisconnectedOnly'] and r['sourceUnchanged'] and r['remainingOwnedTargets']==[],'owned cleanup and source preservation');require(len(r['ownedContextIds'])>=4 and len(r['saves'])==4 and len(r['malformed'])==2,'complete actual save/open/negative workflow');require(not r['privateAuthoring'] and not r['sourceSeeds'],'public actual authoring only')
    for row in r['sourcePins']:require(hashlib.sha256((directory/row['file']).read_bytes()).hexdigest()==row['sha256'],'frozen source receipt pin')
    for observation in r['observations']:check_native(observation,r)
    require(len(r['discoveries'])>=3,'actual native parent discoveries')
    for row in r['discoveries']:check_discovery(row,r)
    for index,saved in enumerate(r['saves']):
        info=arc.read_archive(directory/saved['savedFile']);require(info['sha256']==saved['sha256'],'normal native file integrity');model=info['envelope']['project']['model'];check_source(model,info['rawSketches'],r);before=saved['before']['capture']['native'];require(model['history']==before['history'] and model['counters']==before['counters'],'exact saved authored history/high-water');require(info['rawSketches']=={s['id']:s['source'] for s in before['sketches']},'saved exact accepted source bytes');require(info['envelope'].get('presentation')=={'version':1,'lengthUnit':'inch'},'unit presentation separated from physical size')
        parent=feature(model,r['attached']['featureId'])['params']['parent'];actual_id=r['parent']['featureId'] if index<2 else r['alternative']['featureId'];require(parent['featureId']==actual_id,'explicit original/repaired parent chronology');discovered=[item['parent'] for row in r['discoveries'] for item in row['reply']['parents'] if item['parent']['featureId']==actual_id];require(any(parent==p for p in discovered),'exact saved locator from real public native discovery, no grammar/ordinal inference')
    require(all(not row['error']['committed'] and not row['error']['possiblyCommitted'] for row in r['refusals']),'honest rejection outcomes');require({x['kind'] for x in r['malformed']}=={'cache','parent'},'native cache and dependency negatives')
    return {'status':'PASS','scope':'finite C08 native extrusion-cap attachment AFTER-wholeflow','nativeObservations':len(r['observations']),'nativeFiles':len(r['saves']),'geometricPositionBudgetMm':5e-8,'derivedCacheEqualityMm':1e-9,'nativeBoundsToleranceMm':1e-6,'nativeVolumeToleranceMm3':1e-6,'notClaimed':['arbitrary topology or prefix wizard Apply','Native BRep/catalog/tolerance/name preservation inferred from app state','50pm surface-bound certification']}
if __name__=='__main__':
    if len(sys.argv)==4 and sys.argv[1]=='make-bad':print(json.dumps(make_bad(sys.argv[2],sys.argv[3])))
    elif len(sys.argv)==2:print(json.dumps(check(sys.argv[1]),indent=2))
    else:raise SystemExit('check.py EVIDENCE | make-bad OWN.cad NEWDIR')
