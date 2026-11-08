#!/usr/bin/env python3
"""Whole workflow independent native-source and actual evaluated-point oracle.
Fraction arithmetic, standard-library ZIP, no production geometry imports.
make-negative is used ONLY on an actual own healthy public saved archive.
"""
import binascii,copy,hashlib,json,math,sys,zlib
from fractions import Fraction
from functools import lru_cache
from pathlib import Path
from decimal import Decimal,localcontext
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'native-cad-container'))
from archive_oracle import read_archive,structure,rebuild,manifest_row,canonical,root_record
sha=lambda b:hashlib.sha256(b).hexdigest()
BUDGET=Fraction(1,20_000_000) #50pm=5e-8mm; never loosened per observed result.
def require(ok,message):
    if not ok:raise ValueError(message)
def one(rows,text):require(len(rows)==1,text);return rows[0]
def q(v):require(type(v) in (int,float) and math.isfinite(v),'finite represented actual Number');return Fraction(v)
def decimal(v):
    with localcontext() as c:c.prec=90;return str(Decimal(v.numerator)/Decimal(v.denominator))
def controls(row):
    d=row['data']
    if row['type']=='BezierCurve':require(set(d)=={'cp1','cp2','cp3','cp4'},'canonical native Bezier writer');return [d[k] for k in ('cp1','cp2','cp3','cp4')]
    require(row['type']=='BSpline' and d['degree']==3 and d['type']=='Clamped' and d['method']==0 and d['CVModel'] is True and d['interpolation'] is False and 'closedBasePoints' not in d,'actual declared CV mode');require(4<=len(d['cPoints'])<=64,'control bound');n=len(d['cPoints']);expected=[Fraction(0)]*3+[Fraction(i,n-3) for i in range(n-2)]+[Fraction(1)]*3;require([q(k) for k in d['kValues']]==expected,'exact actual quasi-uniform source knots (frozen4/5-control dyadic fixtures)');return [{k:p[k] for k in ('x','y')} for p in d['cPoints']]
def evaluate(row,t):
    p=controls(row);t=q(t);require(0<=t<=1,'actual source parameter domain');points=[(q(c['x']),q(c['y'])) for c in p]
    if row['type']=='BezierCurve':
        v=1-t;weights=[v**3,3*v*v*t,3*v*t*t,t**3];return tuple(sum(w*c[axis] for w,c in zip(weights,points)) for axis in range(2))
    U=[q(k) for k in row['data']['kValues']];n=len(points)
    if t==U[n]:return points[-1] # Mathematical closed clamped endpoint, independent of native implementation.
    @lru_cache(None)
    def basis(i,degree):
        if degree==0:return Fraction(1) if U[i]<=t<U[i+1] else Fraction(0)
        a=U[i+degree]-U[i];b=U[i+degree+1]-U[i+1]
        return (Fraction(0) if a==0 else (t-U[i])/a*basis(i,degree-1))+(Fraction(0) if b==0 else (U[i+degree+1]-t)/b*basis(i+1,degree-1))
    weights=[basis(i,3) for i in range(n)];require(sum(weights)==1 and all(w>=0 for w in weights),'partition/convexity of actual basis');return tuple(sum(w*c[axis] for w,c in zip(weights,points)) for axis in range(2))
def stable(state):
    v=copy.deepcopy(state);v['accepted']['solids'].pop('revision',None);v['accepted']['journal'].pop('revision',None);return v
def make_negative(source,dest,face_id,bezier_id,spline_id):
    base=read_archive(source);manifest=base['manifest'];entry=one([e for e in manifest['entries'] if e['role']=='sketch' and e['logicalId']==face_id],'actual sketch descriptor');original=json.loads(base['rawSketches'][face_id]);bezier=one([o for o in original['objects'] if o['id']==bezier_id],'actual healthy Bezier');spline=one([o for o in original['objects'] if o['id']==spline_id],'actual healthy5-control spline');require(len(controls(bezier))==4 and len(controls(spline))==5,'positive baseline came from real public create');rows=structure(Path(source).read_bytes());dest=Path(dest);dest.mkdir(parents=True,exist_ok=False);result=[]
    for kind,code in [('constant-bezier','INVALID_SKETCH_ENTITY_DOMAIN'),('knot-order','INVALID_SPLINE_DATA'),('alias-conflict','INVALID_SPLINE_DATA'),('stale-derived','SPLINE_DERIVED_MISMATCH'),('bounded-resource','SPLINE_RESOURCE_LIMIT')]:
        modified=copy.deepcopy(original);a=one([o for o in modified['objects'] if o['id']==bezier_id],'own Bezier');b=one([o for o in modified['objects'] if o['id']==spline_id],'own spline')
        if kind=='constant-bezier':a['data']={k:copy.deepcopy(a['data']['cp1']) for k in ('cp1','cp2','cp3','cp4')}
        elif kind=='knot-order':b['data']['kValues'][4]=-.5
        elif kind=='alias-conflict':b['data']['cPoints'][1]['id']=b['data']['cPoints'][0]['id']
        elif kind=='stale-derived':b['data']['fPoints'][1]['y']+=1
        else:
            d=b['data'];d['cPoints']+=[{'id':'negative-cv-limit-'+str(i),'x':70,'y':0} for i in range(60)];d['kValues']=[0]*3+[i/62 for i in range(63)]+[1]*3
            # This is a negative over-cap source, never a positive mathematical
            # or native-geometry seed. Resource admission must run before construction.
        body=json.dumps(modified,ensure_ascii=False,separators=(',',':'),allow_nan=False).encode();m=copy.deepcopy(manifest);descriptor=one([e for e in m['entries'] if e['path']==entry['path']],'same actual entry');descriptor['bytes']=len(body);descriptor['sha256']=sha(body);m['designRevision']=sha(canonical(root_record(m)));codec=zlib.compressobj(6,zlib.DEFLATED,-15);compressed=codec.compress(body)+codec.flush();replacement={'path':entry['path'],'method':8,'crc':binascii.crc32(body)&0xffffffff,'bytes':len(body),'compressed':compressed};updated=[replacement if row['path']==entry['path'] else manifest_row(m) if row['path']=='manifest.json' else row for row in rows];file=dest/(kind+'.cad');file.write_bytes(rebuild(updated));result.append({'kind':kind,'file':str(file.resolve()),'codes':[code],'sourceSha256':base['sha256']})
    return result
def main(folder):
    folder=Path(folder);r=json.loads((folder/'receipt.json').read_text());require(r['status']=='PASS' and r['ownedContextClosed'] and r['sharedBrowserDisconnectedOnly'],'terminal whole workflow/cleanup');require(not r['privateAuthoring'] and not r['sourceSeeds'] and not r['syntheticReplies'],'genuine input/workflow flags');require(r['sourcePins']==r['sourcePinsAfter'],'frozen producer sources');require({row['originalFile']:row['sha256'] for row in r['sourceSnapshots']}==r['sourcePins'],'complete source custody')
    for row in r['sourceSnapshots']:require(sha((folder/row['file']).read_bytes())==row['sha256'],'exact frozen producer source')
    binding=r['binding'];ids=[binding[k] for k in ('bezierId','spline4Id','spline5Id','reverseId')];commands=r['commandTrace'];created={}
    for id in ids:
        t=one([t for t in commands if t['command']=='append-sketch-primitive' and t['outcome']=='accepted' and t['value']['primitive']['id']==id],'actual accepted native curve creation');require(t['args']['kind'] in ('BezierCurve','BSpline'),'actual registered kind');created[id]=t
    all_errors=[];initial_rows=None;initial_intent=None;point_ids={};count=0;observations=[]
    for item in r['observations']:
        require(item['before']==item['after'],'read-only whole state exact');state=item['before'];source=json.loads(state['accepted']['native']['source']);wanted=dict(item['expected']);require(set(wanted)==set(ids),'explicit four native curve bindings');require(not state['accepted']['solids']['bodies'],'not a fabricated BRep claim')
        unrelated=[o for o in source['objects'] if o['id'] not in ids];intent={k:v for k,v in source.items() if k!='objects'}
        if initial_rows is None:initial_rows=unrelated;initial_intent=intent
        require(unrelated==initial_rows and intent==initial_intent,'exact unrelated objects/constraints/frame/metadata');require(one([o for o in unrelated if o['id']==binding['unrelatedId']],'unrelated Point')['data']=={'x':7,'y':9},'unrelated coordinates')
        for id in ids:
            row=one([o for o in source['objects'] if o['id']==id],'bound actual native source');observed=one([c for c in state['inspection']['curves'] if c['id']==id],'actual inspected curve');p=controls(row);require(p==wanted[id] and [{'x':v['x'],'y':v['y']} for v in observed['controls']]==p,'EXACT actual requested/source/inspection controls, not a50pm allowance');require(observed['canEdit'] and observed['canEvaluate'] and observed['type']==row['type'],'actual mode discovery');actual_ids=[v['pointId'] for v in observed['controls']];require(len(set(actual_ids))==len(actual_ids),'distinct real ownership even at equal positions')
            if id not in point_ids:point_ids[id]=actual_ids
            require(actual_ids==point_ids[id],'native control identities survive edits/travel/reopen')
            if row['type']=='BSpline':require(actual_ids==[p['id'] for p in row['data']['cPoints']] and [v['pointId'] for v in observed['derived']]==[p['id'] for p in row['data']['fPoints']],'persisted real control/derived ID custody')
            sample=one([s for s in item['samples'] if s['id']==id],'actual owned native sample reply');require(sample['faceId']==binding['faceId'] and sample['type']==row['type'] and sample['quality']=='native-sketch-curve-evaluation' and sample['observation']=='verified-cold-replay' and sample['unit']=='millimeter' and sample['coordinates']=='sketch-local' and sample['boundaryFrame']==state['inspection']['boundaryFrame'],'real source/frame/space/quality binding')
            require([s['parameter'] for s in sample['samples']]==[0,.25,.5,.75,1,.5,2/3],'actual parameters/order/duplicate and endpoint1')
            errors=[]
            for s in sample['samples']:
                expected=evaluate(row,s['parameter']);delta=[abs(q(s[k])-expected[j]) for j,k in enumerate(('x','y'))];require(all(e<=BUDGET for e in delta),'actual native sample exceeds frozen50pm per-coordinate independent reference');all_errors+=delta;errors.append([decimal(e) for e in delta]);count+=1
            observations.append({'label':item['label'],'id':id,'type':row['type'],'sampleErrorsMM':errors})
    require(len(r['observations'])>=20,'complete whole edit/travel/refusal/reopen sequence');first=r['observations'][0];firstsource=json.loads(first['before']['accepted']['native']['source'])
    for id,expected in [(binding['bezierId'],(25,Fraction(15,2))),(binding['spline4Id'],(45,Fraction(15,2))),(binding['spline5Id'],(65,10)),(binding['reverseId'],(85,Fraction(15,2)))]:require(evaluate(one([o for o in firstsource['objects'] if o['id']==id],'first source'),.5)==expected,'independent actual initial cubic midpoint')
    forward=one([o for o in firstsource['objects'] if o['id']==binding['bezierId']],'forward cubic');reverse=one([o for o in firstsource['objects'] if o['id']==binding['reverseId']],'reverse cubic')
    for t in (0,.25,.5,.75,1):a=evaluate(forward,1-t);b=evaluate(reverse,t);require((b[0]-60,b[1])==a,'actual source reversal branch, no silent direction rewrite')
    require(any('zero endpoint handle' in o['label'] for o in r['observations']) and any('collinear' in o['label'] for o in r['observations']),'legitimate degenerate-derivative/linear-locus positives')
    for t in commands:
        if t['command']=='edit-closed-sketch-control-points' and t['outcome']=='accepted':require(t['value']['curve']=={'id':t['args']['id'],'points':t['args']['points']},'actual public parameter request/receipt binding')
    saves=[];require([s['label'] for s in r['nativeSaves']]==['initial','edited','reopened-reedited'],'three real native saves')
    for s in r['nativeSaves']:
        archive=read_archive(folder/s['savedFile']);require(archive['sha256']==s['sha256'] and archive['bytes']==s['bytes'],'actual server-synchronized native archive bytes/CRC/hash');require(archive['rawSketches']=={x['id']:x['source'] for x in s['before']['accepted']['native']['sketches']},'EXACT actual raw source archive entries');require(archive['envelope']['project']['model']['history']==s['before']['accepted']['native']['history'],'native authored history exact');source=one([x['data'] for x in archive['envelope']['project']['sketches'] if x['id']==binding['faceId']],'actual native source ID');wanted=dict(s['expected'])
        for id in ids:require(controls(one([o for o in source['objects'] if o['id']==id],'saved curve'))==wanted[id],'actual saved source controls')
        require(s['result']['committed'] and s['result']['nativeArchive']['format']=='codi-cad-project','real native Save receipt');saves.append({'label':s['label'],'sha256':s['sha256'],'bytes':s['bytes']})
    require(len(r['refusals'])>=14 and len(r['negativeArchives'])==5,'finite ordinary/malformed native refusal roster')
    for item in r['refusals']:require(stable(item['before'])==stable(item['after']) and not item['error']['committed'] and not item['error']['possiblyCommitted'],'last-good rejected-state preservation')
    for item in r['negativeArchives']:
        require(sha((folder/item['file']).read_bytes())==item['sha256'] and item['sourceSha256']==r['nativeSaves'][0]['sha256'],'own negative artifact lineage');f=one([f for f in r['refusals'] if f['label']=='Native Open refuses own '+item['kind']],'actual own Open refusal');require(f['error']['code'] in item['codes'],'truthful domain/unsupported/resource failure, not dirty/stale precondition')
    print(json.dumps({'status':'PASS','scope':'Independent actual native planar cubic sample accuracy in finite0..100mm fixtures +exact source/control/native archive identity, not BRep/regions/tangency/3D/universal accuracy','physicalCoordinateBudgetMM':'5e-8','nativeObservedPoints':count,'maxExactReferenceErrorMM':decimal(max(all_errors,default=Fraction(0))),'nativeSaves':saves,'observations':observations},indent=2))
if __name__=='__main__':
    if len(sys.argv)==7 and sys.argv[1]=='make-negative':print(json.dumps(make_negative(*sys.argv[2:])))
    elif len(sys.argv)==2:main(sys.argv[1])
    else:raise SystemExit('check.py EVIDENCE | make-negative SOURCE DEST FACE_ID BEZIER_ID SPLINE_ID')
