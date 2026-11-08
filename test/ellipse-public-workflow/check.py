#!/usr/bin/env python3
"""Independent whole exported-native/source oracle; run after full workflow.
No production geometry/codec/solver imports. Own negative archives derive ONLY
from a real public authored/normal-saved native archive during that workflow.
"""
import binascii,copy,hashlib,json,math,sys,zlib
from decimal import Decimal,localcontext
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'native-cad-container'))
from archive_oracle import read_archive,structure,rebuild,manifest_row,canonical,root_record
sha=lambda b:hashlib.sha256(b).hexdigest()
def require(ok,text):
    if not ok:raise ValueError(text)
def one(rows,text):require(len(rows)==1,text);return rows[0]
def data_number(v):require(type(v) in (int,float) and math.isfinite(v),'finite actual Number');return Decimal(v) if type(v) is int else Decimal.from_float(v)
def ellipse(data):
    require(set(data)=={'c','rx','ry','rot'} and set(data['c'])=={'x','y'},'canonical actual Ellipse source')
    c=data['c'];x,y,a,b,t=[data_number(v) for v in (c['x'],c['y'],data['rx'],data['ry'],data['rot'])]
    require(a>Decimal('1e-9') and b>Decimal('1e-9'),'existing supported axis envelope, not mathematical domain theorem')
    # Independent Decimal arithmetic on exact represented binary64 inputs.
    # Fixture angles |t|<7; reduce with100-digit pi. Taylor terms decrease after
    # a finite prefix and the omitted alternating tail is <1e-94. Decimal110
    # arithmetic contributes far less than this finite fixture's50pm budget.
    with localcontext() as ctx:
        ctx.prec=110
        pi=Decimal('3.14159265358979323846264338327950288419716939937510582097494459230781640628620899862803482534211706798214808651')
        require(abs(t)<7,'finite frozen oracle angle domain; unsupported is not invalid source')
        while t>pi:t-=2*pi
        while t<-pi:t+=2*pi
        sin=t;term=t
        for k in range(1,256):
            term*=-(t*t)/Decimal((2*k)*(2*k+1));sin+=term
            if abs(term)<Decimal('1e-100'):break
        else:raise ValueError('oracle sine work bound')
        cos=Decimal(1);term=Decimal(1)
        for k in range(1,256):
            term*=-(t*t)/Decimal((2*k-1)*(2*k));cos+=term
            if abs(term)<Decimal('1e-100'):break
        else:raise ValueError('oracle cosine work bound')
        hx=(a*a*cos*cos+b*b*sin*sin).sqrt();hy=(a*a*sin*sin+b*b*cos*cos).sqrt()
        # These are derived source expectations, not invented observations of
        # canvas bounds, kernel area, topology, manufacturing or physical matter.
        return {'areaMM2':str(pi*a*b),'analyticBounds':{'min':[str(x-hx),str(y-hy)],'max':[str(x+hx),str(y+hy)]},'physicalCoordinateBudgetMM':'5e-8','principalAxisEndpoints':[[str(x+a*cos),str(y+a*sin)],[str(x-b*sin),str(y+b*cos)],[str(x-a*cos),str(y-a*sin)],[str(x+b*sin),str(y-b*cos)]]}
def expected_observation(row,binding):
    state=row['state'];source=json.loads(state['accepted']['native']['source']);obj=one([o for o in source['objects'] if o['id']==binding['ellipseId']],'actual bound Ellipse');require(obj['type']=='Ellipse' and obj['data']==row['expected'],'exact requested retained source, no coordinate epsilon')
    observed=one([e for e in state['inspection']['ellipses'] if e['id']==binding['ellipseId']],'actual ellipse observation');actual={'c':observed['c'],'rx':observed['rx'],'ry':observed['ry'],'rot':observed['rotationRadians']};require(actual==row['expected'] and observed['centerId']==binding['centerId'],'exact full-vector axes/rotation/center observation')
    require(observed['encoding']=='canonical-center-axes' and observed['canEdit'] and observed['reason'] is None,'actual editable canonical representation')
    if any(o['id']==binding['tinyId'] for o in source['objects']):
        tiny=one([o for o in source['objects'] if o['id']==binding['tinyId']],'actual tiny source');e=one([e for e in state['inspection']['ellipses'] if e['id']==binding['tinyId']],'actual tiny inspection');wanted={'c':{'x':0,'y':0},'rx':5e-9,'ry':2e-9,'rot':-.25};require(tiny['data']==wanted and {'c':e['c'],'rx':e['rx'],'ry':e['ry'],'rot':e['rotationRadians']}==wanted,'EXACT tiny semiaxes catch semantic clamp even below50pm')
    require(not state['accepted']['solids']['bodies'],'ordinary open source, not invented BRep')
    free=one([o for o in source['objects'] if o['id']==binding['unrelatedId']],'unrelated actual Point');require(free['type']=='Point' and free['data']=={'x':7,'y':9},'unrelated original point')
    return source,ellipse(obj['data'])
def make_negative(source,dest,face_id,ellipse_id):
    archive=read_archive(source);rows=structure(Path(source).read_bytes());manifest=archive['manifest'];entry=one([e for e in manifest['entries'] if e['role']=='sketch' and e['logicalId']==face_id],'actual source entry');original=json.loads(archive['rawSketches'][face_id]);original_row=one([o for o in original['objects'] if o['id']==ellipse_id],'actual public healthy Ellipse');require(original_row['type']=='Ellipse','healthy actual class');ellipse(original_row['data']);dest=Path(dest);dest.mkdir(parents=True,exist_ok=False);result=[]
    for kind,value in [('zero-axis',0),('negative-axis',-2),('outside-existing-envelope',1e-9)]:
        modified=copy.deepcopy(original);one([o for o in modified['objects'] if o['id']==ellipse_id],'own actual target')['data']['rx']=value
        body=json.dumps(modified,ensure_ascii=False,separators=(',',':'),allow_nan=False).encode();metadata=copy.deepcopy(manifest);descriptor=one([e for e in metadata['entries'] if e['path']==entry['path']],'same actual entry');descriptor['bytes']=len(body);descriptor['sha256']=sha(body);metadata['designRevision']=sha(canonical(root_record(metadata)));codec=zlib.compressobj(6,zlib.DEFLATED,-15);compressed=codec.compress(body)+codec.flush();replacement={'path':entry['path'],'method':8,'crc':binascii.crc32(body)&0xffffffff,'bytes':len(body),'compressed':compressed};updated=[replacement if row['path']==entry['path'] else manifest_row(metadata) if row['path']=='manifest.json' else row for row in rows];file=dest/(kind+'.cad');file.write_bytes(rebuild(updated));result.append({'kind':kind,'file':str(file.resolve()),'sourceSha256':archive['sha256'],'expectedCode':'INVALID_SKETCH_ENTITY_DOMAIN'})
    return result
def stable(s):
    v=copy.deepcopy(s);v['accepted']['solids'].pop('revision',None);v['accepted']['journal'].pop('revision',None);return v
def main(folder):
    folder=Path(folder);r=json.loads((folder/'receipt.json').read_text());require(r['status']=='PASS' and r['ownedContextClosed'] and r['sharedBrowserDisconnectedOnly'],'complete workflow+owned cleanup');require(not r['privateAuthoring'] and not r['sourceSeeds'] and not r['fakeSuccessfulReplies'],'no fabricated success/source');require(r['sourcePins']==r['sourcePinsAfter'],'frozen source');require({s['originalFile']:s['sha256'] for s in r['sourceSnapshots']}==r['sourcePins'],'complete source custody')
    for s in r['sourceSnapshots']:require(sha((folder/s['file']).read_bytes())==s['sha256'],'exact producer source snapshot')
    binding=r['binding'];commands=r['commandTrace'];created=one([t for t in commands if t['command']=='append-sketch-primitive' and t['outcome']=='accepted' and t['args']['kind']=='Ellipse' and t['value']['primitive']['id']==binding['ellipseId']],'genuine accepted public ellipse append');require(created['args']['data']=={'c':{'x':40,'y':20},'rx':10,'ry':5,'rot':0},'actual initial semiaxis intent')
    tiny=one([t for t in commands if t['command']=='append-sketch-primitive' and t['outcome']=='accepted' and t['args']['kind']=='Ellipse' and t['value']['primitive']['id']==binding['tinyId']],'genuine tiny append');require(tiny['args']['data']['rx']==5e-9 and tiny['args']['data']['ry']==2e-9,'tiny requested values')
    sources=[];derived=[];intents=[created['args']['data']]
    for t in commands:
        if t['command']=='edit-closed-sketch-ellipse' and t['outcome']=='accepted':
            require(t['args']['id']==binding['ellipseId'],'only intended ellipse edited');p={k:t['args'][k] for k in ('c','rx','ry','rot')};require(t['value']['ellipse']=={'id':binding['ellipseId'],**p},'actual request/receipt exact');intents.append(p)
    for row in r['observations']:
        require(row['expected'] in intents,'observation corroborates genuine accepted request or its exact journal travel');s,d=expected_observation(row,binding);sources.append(s);derived.append({'label':row['label'],**d})
    require(len(sources)>=20,'complete edit/refusal/travel/reopen observations');base=sources[0];unrelated=[o for o in base['objects'] if o['id']!=binding['ellipseId']];intent={k:v for k,v in base.items() if k!='objects'}
    for s in sources:require([o for o in s['objects'] if o['id'] not in (binding['ellipseId'],binding['tinyId'])]==unrelated and {k:v for k,v in s.items() if k!='objects'}==intent,'exact unrelated source/nongeometry intent')
    saves=[];require([x['label'] for x in r['nativeSaves']]==['initial','equal-axes','edited','reopened-reedited'],'four normal native saves')
    for s in r['nativeSaves']:
        archive=read_archive(folder/s['savedFile']);require(archive['sha256']==s['sha256'] and archive['bytes']==s['bytes'],'actual native server bytes');require(archive['rawSketches']=={x['id']:x['source'] for x in s['before']['accepted']['native']['sketches']},'exact source bytes survive archive');require(archive['envelope']['project']['model']['history']==s['before']['accepted']['native']['history'],'actual authored history retained');source=one([x['data'] for x in archive['envelope']['project']['sketches'] if x['id']==binding['faceId']],'source-bound archive Ellipse');o=one([o for o in source['objects'] if o['id']==binding['ellipseId']],'saved ellipse');require(o['type']=='Ellipse' and o['data']==s['expected'],'actual saved source requested parameters');ellipse(o['data']);require(s['result']['committed'] and s['result']['nativeArchive']['format']=='codi-cad-project','normal native Save receipt');saves.append({'label':s['label'],'sha256':s['sha256'],'bytes':s['bytes']})
    require(len(r['refusals'])>=10 and len(r['negativeArchives'])==3,'finite refusal coverage')
    for f in r['refusals']:require(stable(f['before'])==stable(f['after']) and not f['error']['committed'] and not f['error']['possiblyCommitted'],'exact rejected-state retention')
    for entry in r['negativeArchives']:
        require(sha((folder/entry['file']).read_bytes())==entry['sha256'] and entry['sourceSha256']==r['nativeSaves'][0]['sha256'],'own negative derivation and actual bytes');expected=one([f for f in r['refusals'] if f['label']=='Native Open rejects own '+entry['kind']+' before adoption'],'actual native admission refusal');require(expected['error']['code']==entry['expectedCode'],'actual native domain error, not dirty/stale precondition refusal')
    print(json.dumps({'status':'PASS','scope':'Independent ordinary source/parameters/native archive identities and analytic ellipse interpretation; no canvas/BRep/solid/region/tangency/nanoscale material claim','nativeSaves':saves,'observations':len(sources),'refusals':len(r['refusals']),'tinySemiaxes':'exact requested5e-9/2e-9 on actual source and inspection; no tolerance','derivedSourceGeometry':derived},indent=2))
if __name__=='__main__':
    if len(sys.argv)==6 and sys.argv[1]=='make-negative':print(json.dumps(make_negative(*sys.argv[2:])))
    elif len(sys.argv)==2:main(sys.argv[1])
    else:raise SystemExit('check.py EVIDENCE | make-negative SAVED.cad DEST FACE_ID ELLIPSE_ID')
