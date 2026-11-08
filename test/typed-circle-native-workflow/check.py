#!/usr/bin/env python3
"""AFTER-WHOLE independent actual .cad/CRC/source and cylinder oracle.
No production codec, evaluator, solver, geometry generator or validator imports.
"""
import hashlib,json,math,re,sys
from decimal import Decimal,localcontext
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'native-cad-container'))
from archive_oracle import read_archive
PI=Decimal('3.14159265358979323846264338327950288419716939937510582097494459230781640628620899862803482534211706798214808651')
PREFIX='codi-physical-parameters:1\n'
def require(ok,msg):
    if not ok:raise ValueError(msg)
def one(rows,label):require(len(rows)==1,'one '+label);return rows[0]
def near(x,y,t=5e-8):require(type(x) in (int,float) and math.isfinite(x) and abs(x-float(y))<=t,f'{x} differs from {y}; budget {t}')
def normalized(state):
    s=json.loads(json.dumps(state))
    for row in (s['host'],s['physical'],s['capture']['journal'],s['capture']['solids']):row.pop('revision',None)
    return s
def quantities(state):
    text=state['capture']['native']['expressions']
    if text=='':require(state['physical']['definitions']==[],'literal definitions');return Decimal(5),Decimal(20),False
    require(text.startswith(PREFIX),'actual v1 physical source, not a substituted document')
    definitions=json.loads(text[len(PREFIX):]);require(definitions==state['physical']['definitions'],'saved raw definitions equal public inspection')
    require([r['name'] for r in definitions]==['radius','height','occ','millimeter'] and all(r['dimension']=='length' for r in definitions),'exact finite definitions, no reserved-name workaround')
    rows={r['name']:r['expression'] for r in definitions};match=re.fullmatch(r'mm\((\d+(?:\.\d+)?)\)',rows['radius']);require(match is not None,'finite independently interpreted radius literal');r=Decimal(match.group(1));require(r>0,'positive radius');require(rows['height']=='4 * radius' and rows['occ']=='mm(1)' and rows['millimeter']=='mm(2)','actual formulas and alias definitions')
    for name,value in (('radius',r),('height',4*r),('occ',1),('millimeter',2)):
        q=one([q for q in state['physical']['quantities'] if q['name']==name],'current '+name);require(q['dimension']=='length' and q['unit']=='millimeter','canonical length quantity');near(q['value'],value,1e-12)
    require('selectedRectangles' not in state['physical'],'no rectangle alias for Circle');candidate=one(state['physical']['selectedProfiles'],'generic source candidate');require(candidate['sourceProfile']=='selected-source' and candidate['sourceQualification']=='requires-worker-validation','truthful metadata, not fake rectangle qualification')
    return r,4*r,True

def source(state,b,r,bound):
    src=json.loads(one([row for row in state['capture']['native']['sketches'] if row['id']==b['faceId']],'actual source')['source'])
    require(src['version']==3 and len(src['stages'])==1 and not src['stages'][0]['generators'],'ordinary real source')
    require(src['metadata']['boundaryFrame']=={'origin':[0,0,0],'x':[1,0,0],'y':[0,1,0],'z':[0,0,1]},'actual source frame exact')
    require(all(not v for v in src['boundary'].values()),'no private boundary seed')
    require(len(src['objects'])==2 and len({o['id'] for o in src['objects']})==2,'Circle plus retained Point; no surrogate rectangle')
    circle=one([o for o in src['objects'] if o['id']==b['id']],'real selected Circle');require(circle['type']=='Circle' and circle['role'] is None and circle['stage']==0 and circle['data']['c']=={'x':0,'y':0},'actual free center preserved');near(circle['data']['r'],r,1e-9)
    extra=one([o for o in src['objects'] if o['id']==b['unrelatedId']],'unrelated actual Point');require(extra['type']=='Point' and extra['data']=={'x':7,'y':9},'unrelated source preservation')
    constraints=src['stages'][0]['constraints'];row=one(constraints,'actual RadiusLength row');require(row['typeId']=='RadiusLength' and row['objects']==[b['id']] and set(row['constants'])=={'length'},'registered original equation and ordered identity');require(str(row['constants']['length'])==('radius' if bound else '5'),'raw authored radius binding retained');require(row['admission']['state'] in ('accepted','redundant'),'actual admission not assumed by formula')
    # Original equation: measured Circle radius = resolved authored length.
    near(circle['data']['r'],r,1e-9)
    return src

def settled(s):
    require(s['ownership']['processing'] is False,'no active publication');resources=s['ownership']['resources'];require(resources['cleanupFailed'] is False and all(resources[k]==0 for k in ('candidates','accepted','mounts')) and resources['owners']==resources['detached'],'cleanup/resource preservation')
def native(s,b,r,h,build):
    history=s['capture']['native']['history'];require(len(history)==2 and history[0]['type']=='PLANE' and history[1]['type']=='WORKER_SELECTED_PROFILE_EXTRUDE_V2','one original graph and actual Circle feature')
    p=history[1]['params'];require(p['featureId']==b['body']['featureId'] and p['faceId']==b['faceId'] and p['regionId']==b['regionId'] and p['engineRevision']==build and p['engine']=='occ' and p['unit']=='millimeter' and p['depth']==('height' if s['capture']['native']['expressions'] else 20),'exact saved source/build/region/units; literal aliases not reinterpreted')
    body=one(s['capture']['solids']['bodies'],'real native output');require(body['id']==b['body']['outputId'] and body['featureId']==b['body']['featureId'],'actual producer/output binding');m=body['metrics'];require(m['nativeValidity']['valid'] is True and m['solidCount']==1 and m['resultKind']=='single-solid' and 'sha256:'+m['runtime']['jsSha256']+':'+m['runtime']['wasmSha256']==build,'real Native result/build')
    with localcontext() as ctx:ctx.prec=90;volume=PI*r*r*h
    near(m['nativeVolume'],volume,1e-6)
    for k,values in (('min',(-r,-r,0)),('max',(r,r,h))):
        for x,y in zip(m['nativeBounds'][k],values):near(x,y,1e-7+1e-12)
    settled(s);return str(volume)
def classification(p,r,h):
    x,y,z=p;rad=math.hypot(x,y);r=float(r);h=float(h)
    if z<0 or z>h or rad>r:return 'outside'
    return 'boundary' if z in (0,h) or rad==r else 'inside'

def check(directory):
    directory=Path(directory);receipt=json.loads((directory/'receipt.json').read_text());require(receipt['status']=='PASS' and receipt['ownedContextsRetired'] and receipt['sharedBrowserDisconnectedOnly'],'whole workflow terminal/cleanup');require(receipt['sourceSeeds'] is False and receipt['privateAuthoring'] is False and receipt['fakeReplies'] is False,'genuine public authoring contract');require(receipt['sourcePins']==receipt['sourcePinsAfter'],'frozen producing source')
    for row in receipt['sourceSnapshots']:require(hashlib.sha256((directory/row['file']).read_bytes()).hexdigest()==row['sha256'] and receipt['sourcePins'][row['originalFile']]==row['sha256'],'retained producer source bytes')
    require(len(receipt['observations'])>=15,'complete creation/edit/travel/display/Open observations');points=0;observations=[]
    for row in receipt['observations']:
        before=row['before'];require(before==row['after'],'read-only state/source/J/resources unchanged');r,h,bound=quantities(before);require(row['radius']==float(r) and row['height']==float(h) and row['bound']==bound,'driver labels corroborated by actual source, not oracle authority');source(before,row['binding'],r,bound);volume=native(before,row['binding'],r,h,receipt['engineRevision']);q=row['query'];request=row['input'];require(q['quality']=='native-re-evaluation-observation','genuine native classification')
        for key in ('revision','bodyId','featureId','unit','engine','engineRevision'):require(q[key]==request[key],'query actual binding')
        require(q['points']==[{'point':p,'classification':classification(p,r,h)} for p in request['points']],'independent cylinder material/void/cap truth');points+=len(q['points']);observations.append({'label':row['label'],'radiusMM':str(r),'heightMM':str(h),'volumeMM3':volume})
    failures=receipt['refusals'];require(len(failures)==7,'stale, four formula/domain, bound-erasure and nonrectangle controls')
    for row in failures:require(row['error'] and not row['error']['committed'] and not row['error']['possiblyCommitted'] and normalized(row['before'])==normalized(row['after']),'atomic refusal preserves complete accepted data/resources; only four opaque revisions reissued')
    require(one([r for r in failures if r['label']=='Numeric edit cannot erase named RadiusLength'],'binding refusal')['error']['code']=='BOUND_DIMENSION','named binding not replaced by literal')
    require(any(r['label']=='Circle is not a rectangle width/height target' for r in failures),'actual Circle rectangle-control refusal')
    noop=one([r for r in receipt['rows'] if r['label']=='Definition no-op preserves exact tokens/redo'],'no-op');require(noop['noop']['changed'] is False and noop['before']==noop['after'],'no-op preserves exact token/J/redo')
    require(len(receipt['saves'])==3,'three actual normal .cad saves');artifacts=[]
    for i,row in enumerate(receipt['saves']):
        archive=read_archive(directory/row['savedFile']);require(archive['sha256']==row['sha256'] and archive['bytes']==row['bytes'],'actual synchronized archive bytes/CRC/manifest hashes');envelope=archive['envelope'];require(envelope['unit']=='millimeter' and envelope['format']=='codi-jsketcher-project','native canonical unit');project=envelope['project'];model=project['model'];before=row['before'];native_before=before['capture']['native'];require(model['history']==native_before['history'] and model['expressions']==native_before['expressions'] and model['counters']==native_before['counters'],'one exact saved authored graph/source/high-water');require(envelope.get('presentation')==native_before['presentation'],'persisted presentation');r,h,bound=quantities(before);require(r==6+i and h==4*r and bound,'independent saved formula progression6/7/8');s=one([s for s in project['sketches'] if s['id']==row['binding']['faceId']],'saved genuine source');require(s['data']==source(before,row['binding'],r,bound),'saved source/IDs/frame/raw binding exact');native(before,row['binding'],r,h,receipt['engineRevision']);require(row['after']['capture']==before['capture'],'Save changes no accepted source/model/J');artifacts.append({'file':row['savedFile'],'sha256':archive['sha256'],'designRevision':archive['manifest']['designRevision'],'radiusMM':str(r)})
    commands=receipt['commands'];require(any(r['command']=='create-empty-sketch-plane' for r in commands) and not any(r['command']=='create-rectangle-sketch' for r in commands),'genuine empty plane, no rectangle proxy');require(any(r['command']=='apply-closed-sketch-radius' and r['args']['radius']==5 for r in commands),'real Radius5 creator');require(any(r['command']=='edit-closed-sketch-dimension' and r['args'].get('value')=='radius' for r in commands),'real named RadiusLength edit');require(sum(r['command']=='travel-authored-edit' for r in commands)>=10,'shared mixed journal travel');require(sum(r['label'].startswith('Fresh .cad Open') for r in receipt['observations'])==3,'three actual fresh Open replays')
    mixed=one([row for row in receipt['rows'] if row['label']=='Creation append shares chronology with physical and Radius bindings'],'mixed chronology');require(mixed['undone']['capture']['solids']['bodies']==[],'actual creation Undo removes Native output');require(mixed['before']['capture']['native']['counters']==mixed['undone']['capture']['native']['counters']==mixed['after']['capture']['native']['counters'],'mixed travel preserves feature high-water')
    return {'status':'PASS','scope':'finite genuine typed Circle, original equation/source identity, Native material/void/caps and .cad artifacts; no broad profile/Arc qualification','observations':observations,'nativePoints':points,'archives':artifacts}
if __name__=='__main__':print(json.dumps(check(sys.argv[1]),indent=2))
