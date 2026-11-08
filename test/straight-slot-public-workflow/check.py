#!/usr/bin/env python3
"""Whole-output independent exact source / native Arc+Segment / ZIP oracle.
No production geometry imports. Run only after the complete real workflow.
"""
import binascii,copy,hashlib,json,math,sys,zlib
from decimal import Decimal,localcontext
from fractions import Fraction
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'native-cad-container'))
from archive_oracle import read_archive,structure,rebuild,manifest_row,canonical,root_record
PI=Decimal('3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679')
COORD=Fraction(1,20_000_000) #50pm=5e-8mm, frozen before observations.
SCALAR=Decimal('1e-9') # Explicit finite fixture area(mm²)/perimeter(mm).
sha=lambda b:hashlib.sha256(b).hexdigest()
def require(v,text):
    if not v:raise ValueError(text)
def one(v,text):require(len(v)==1,text);return v[0]
def q(v):require(type(v) in (int,float) and math.isfinite(v),'finite actual Number');return Fraction(v)
def d(v):
    if isinstance(v,Fraction):return Decimal(v.numerator)/Decimal(v.denominator)
    return d(q(v))
def sqrtq(v):
    n=math.isqrt(v.numerator);m=math.isqrt(v.denominator)
    require(n*n==v.numerator and m*m==v.denominator,'oracle domain is exact rational-length horizontal/3-4-5 fixtures')
    return Fraction(n,m)
def point(p):return(q(p['x']),q(p['y']))
def model(expected):
    a=point(expected['a']);b=point(expected['b']);r=q(expected['radius']);dx=b[0]-a[0];dy=b[1]-a[1];length=sqrtq(dx*dx+dy*dy);require(length>0 and r>0,'positive independent Slot fixture')
    n=(-dy/length,dx/length);offset=lambda p,s:tuple(p[k]+s*r*n[k] for k in range(2));ap=offset(a,1);am=offset(a,-1);bp=offset(b,1);bm=offset(b,-1)
    geometry=[(a,b,None),(bp,ap,None),(ap,am,a),(am,bm,None),(bm,bp,b)]
    return geometry,length,r,(min(a[0],b[0])-r,min(a[1],b[1])-r,max(a[0],b[0])+r,max(a[1],b[1])+r),(dx/length,dy/length)
def sin(x):
    x=(x+PI)%(2*PI)-PI;term=x;total=x;k=1
    while True:
        term=-term*x*x/Decimal((2*k)*(2*k+1));new=total+term
        if new==total:return total
        total=new;k+=1
        require(k<200,'bounded independent Taylor series')
def cos(x):return sin(x+PI/2)
def stable(s):
    v=copy.deepcopy(s);v['accepted']['solids'].pop('revision',None);v['accepted']['journal'].pop('revision',None);return v
def source_parts(source,binding):
    rows=[o for o in source['objects'] if o['id'] not in binding['members']]
    intent=copy.deepcopy(source);intent['objects']=[]
    for stage in intent['stages']:
        for c in stage['constraints']:
            if c['typeId']=='StraightSlot' and c['objects'][0]==binding['slotId']:c['constants']['radius']='<literal radius>'
        stage['constraints']=[c for c in stage['constraints'] if not(c['typeId']=='DiameterLength' and c['objects'][0]==binding['members'][2])]
    return rows,intent
def inspect_observation(item,binding):
    require(item['before']==item['after'],'native primitive inspection read-only source/journal/resources')
    state=item['before'];source=json.loads(state['accepted']['native']['source']);slot=one([s for s in state['inspection']['slots'] if s['slotId']==binding['slotId']],'actual native inspected Slot');expected=item['expected'];g,length,r,bounds,direction=model(expected)
    require(slot['members']==binding['members'] and len(set(slot['members']))==5,'actual stable root identities')
    row=source['stages'][slot['stage']]['constraints'][slot['index']]
    require(row['typeId']=='StraightSlot' and row['objects']==binding['members'] and row['constants']=={'radius':str(expected['radius']) if isinstance(expected['radius'],int) else format(expected['radius'],'.17g')},'actual authored literal radius/declaration')
    axis=one([o for o in source['objects'] if o['id']==binding['slotId']],'actual primary axis');require(axis['data']=={'a':expected['a'],'b':expected['b']} and axis['role']=='construction','primary source endpoint intent EXACT, no tolerance')
    require(slot['canEdit'] and slot['reason'] is None and slot['radius']==expected['radius'] and len(slot['geometry'])==5,'actual native observation availability')
    errors=[];area=Decimal(0);perimeter=Decimal(0);observed_bounds=[];point_ids=[];pairs=[]
    for i,actual in enumerate(slot['geometry']):
        require(actual['id']==binding['members'][i] and actual['type']==('Arc' if i in (2,4) else 'Segment'),'actual native member root/type')
        points=[]
        for key,truth in zip(('a','b','c'),g[i]):
            if truth is None:require(actual[key] is None,'nonArc has no invented center');continue
            observed=actual[key];point_ids.append(observed['pointId']);delta=[abs(q(observed[k])-truth[j]) for j,k in enumerate(('x','y'))];require(all(e<=COORD for e in delta),'actual native member exceeds independent50pm endpoint/center reference');errors+=delta;points.append(point(observed));observed_bounds.append(tuple(d(v) for v in points[-1]))
        a,b=points[:2]
        if i in (1,3):
            area+=(d(a[0])*d(b[1])-d(a[1])*d(b[0]))/2;perimeter+=((d(b[0]-a[0]))**2+(d(b[1]-a[1]))**2).sqrt()
        if i in (2,4):
            c=points[2];radius=d(actual['radius']);require(abs(radius-d(r))<=SCALAR,'actual native radius parameter versus exact intent')
            angles=actual['angles'];require(len(angles)==2,'actual native Arc angle Params');start,end=map(d,angles);delta=(end-start)%(2*PI)
            if delta<0:delta+=2*PI
            require(abs(delta-PI)*radius<=d(COORD),'actual CCW semicircle, not shortest/full-circle branch')
            for angle,endpoint in zip((start,end),(a,b)):
                evaluated=(d(c[0])+radius*cos(angle),d(c[1])+radius*sin(angle));require(all(abs(evaluated[k]-d(endpoint[k]))<=d(COORD) for k in range(2)),'native Arc angular Params correspond to actual endpoint data')
            middle=start+delta/2;truth=tuple(d(g[i][2][k])+(1 if i==4 else -1)*d(r)*d(direction[k]) for k in range(2));measured=(d(c[0])+radius*cos(middle),d(c[1])+radius*sin(middle));require(all(abs(measured[k]-truth[k])<=d(COORD) for k in range(2)),'directed actual native outer cap midpoint')
            area+=(radius*radius*delta+d(c[0])*radius*(sin(end)-sin(start))+d(c[1])*radius*(cos(start)-cos(end)))/2;perimeter+=radius*delta
            for angle in (Decimal(0),PI/2,PI,3*PI/2):
                swept=(angle-start)%(2*PI)
                if swept<0:swept+=2*PI
                if swept<=delta:observed_bounds.append((d(c[0])+radius*cos(angle),d(c[1])+radius*sin(angle)))
        else:require(actual['radius'] is None and actual['angles'] is None,'Segment has no invented arc metadata')
    require(len(set(point_ids))==len(point_ids),'equal coordinates do not weld actual native endpoints')
    boundary=slot['geometry'];pairs=[(boundary[1]['b']['pointId'],boundary[2]['a']['pointId']),(boundary[2]['b']['pointId'],boundary[3]['a']['pointId']),(boundary[3]['b']['pointId'],boundary[4]['a']['pointId']),(boundary[4]['b']['pointId'],boundary[1]['a']['pointId'])]
    for a,b in pairs:require(any(c['typeId']=='PCoincident' and c['objects'] in ([a,b],[b,a]) for c in source['stages'][slot['stage']]['constraints']),'actual saved endpoint junction, no identity welding')
    ideal_area=2*d(r)*d(length)+PI*d(r)**2;ideal_perimeter=2*d(length)+2*PI*d(r)
    require(abs(area-ideal_area)<=SCALAR,'independent Green-integral area from actual native members');require(abs(perimeter-ideal_perimeter)<=SCALAR,'actual native boundary perimeter')
    observed=(min(p[0] for p in observed_bounds),min(p[1] for p in observed_bounds),max(p[0] for p in observed_bounds),max(p[1] for p in observed_bounds));require(all(abs(observed[k]-d(bounds[k]))<=d(COORD) for k in range(4)),'analytic full-locus coordinate bounds')
    return source,point_ids,errors,{'label':item['label'],'maxEndpointErrorMM':str(max(map(d,errors),default=Decimal(0))),'areaMM2':str(area),'expectedAreaMM2':str(ideal_area),'perimeterMM':str(perimeter),'boundsMM':list(map(str,observed))}
def make_negative(file,dest,face,slot_id,geometry_json):
    info=read_archive(file);original=json.loads(info['rawSketches'][face]);entry=one([e for e in info['manifest']['entries'] if e['role']=='sketch' and e['logicalId']==face],'own sketch entry');slot=one([c for s in original['stages'] for c in s['constraints'] if c['typeId']=='StraightSlot' and c['objects'][0]==slot_id],'actual publicly authored Slot');rows=structure(Path(file).read_bytes());dest=Path(dest);dest.mkdir(parents=True,exist_ok=False);result=[]
    geometry=json.loads(geometry_json);require([g['id'] for g in geometry]==slot['objects'],'actual source-bound observed member identities');junction=[geometry[1]['b']['pointId'],geometry[2]['a']['pointId']]
    for kind,code in [('aliased-member','INVALID_SLOT_SOURCE'),('wrong-cap-branch','INVALID_SLOT_BRANCH'),('radius-mismatch','SLOT_GEOMETRY_MISMATCH'),('duplicate-declaration','INVALID_SLOT_SOURCE'),('missing-junction','INVALID_SLOT_SOURCE')]:
        changed=copy.deepcopy(original);c=one([c for s in changed['stages'] for c in s['constraints'] if c['typeId']=='StraightSlot' and c['objects'][0]==slot_id],'own Slot');cap=one([o for o in changed['objects'] if o['id']==c['objects'][2]],'actual cap')
        if kind=='aliased-member':c['objects'][1]=c['objects'][3]
        elif kind=='wrong-cap-branch':cap['data']['a'],cap['data']['b']=cap['data']['b'],cap['data']['a']
        elif kind=='radius-mismatch':c['constants']['radius']='4'
        elif kind=='duplicate-declaration':changed['stages'][c['stage']]['constraints'].append(copy.deepcopy(c))
        else:
            # Exact actual inspected native endpoints, not opaque-ID grammar.
            stage=changed['stages'][c['stage']];actual=one([x for x in stage['constraints'] if x['typeId']=='PCoincident' and x['objects'] in (junction,list(reversed(junction)))],'actual inspected endpoint junction row');stage['constraints'].remove(actual)
        body=json.dumps(changed,ensure_ascii=False,separators=(',',':'),allow_nan=False).encode();m=copy.deepcopy(info['manifest']);e=one([e for e in m['entries'] if e['path']==entry['path']],'descriptor');e['bytes']=len(body);e['sha256']=sha(body);m['designRevision']=sha(canonical(root_record(m)));codec=zlib.compressobj(6,zlib.DEFLATED,-15);compressed=codec.compress(body)+codec.flush();replacement={'path':entry['path'],'method':8,'crc':binascii.crc32(body)&0xffffffff,'bytes':len(body),'compressed':compressed};file=dest/(kind+'.cad');file.write_bytes(rebuild([replacement if r['path']==entry['path'] else manifest_row(m) if r['path']=='manifest.json' else r for r in rows]));result.append({'kind':kind,'file':str(file.resolve()),'codes':[code]})
    return result
def main(folder):
    folder=Path(folder);r=json.loads((folder/'receipt.json').read_text());require(r['status']=='PASS' and r['ownedContextClosed'] and r['sharedBrowserDisconnectedOnly'],'whole terminal PASS/cleanup');require(r['sourcePins']==r['sourcePinsAfter'] and not r['privateAuthoring'] and not r['sourceSeeds'] and not r['syntheticReplies'],'source custody/genuine workflow')
    for row in r['sourceSnapshots']:require(sha((folder/row['file']).read_bytes())==row['sha256']==r['sourcePins'][row['originalFile']],'frozen source bytes')
    binding=r['binding'];creation=one([t for t in r['commandTrace'] if t['command']=='create-closed-sketch-slot' and t['outcome']=='accepted'],'actual registered creation');require(creation['value']['slot']['members']==binding['members'] and creation['value']['slot']['slotId']==binding['slotId'],'actual creation IDs')
    require(len(r['observations'])>=15,'full edit/travel/refusal/reopen observations');reports=[];all_errors=[];reference=None;identities=None
    for item in r['observations']:
        source,ids,errors,report=inspect_observation(item,binding);parts=source_parts(source,binding)
        if reference is None:reference=parts;identities=ids
        require(parts==reference and ids==identities,'retained unrelated source and real endpoint identities exact');reports.append(report);all_errors+=errors
    require([s['label'] for s in r['nativeSaves']]==['initial','edited','reopened-reedited'],'three normal Saves');saves=[]
    for s in r['nativeSaves']:
        raw=folder/s['savedFile'];info=read_archive(raw);require(info['sha256']==s['sha256'] and info['rawSketches'][binding['faceId']]==s['before']['accepted']['native']['source'],'actual My files/server native source custody');require(info['envelope']['project']['model']['history']==s['before']['accepted']['native']['history'],'same authoritative history');saves.append({'file':s['savedFile'],'sha256':info['sha256'],'bytes':info['bytes']})
    for item in r['refusals']:require(item['error'] and not item['error']['committed'] and not item['error']['possiblyCommitted'] and stable(item['before'])==stable(item['after']),'real refused request preserves accepted state')
    require(len(r['negativeArchives'])==5 and len(r['refusals'])>=11,'complete native/domain/refusal boundary coverage')
    result={'status':'PASS','scope':'source StraightSlot/native primitive geometry and archive workflow only; no BRep/regions','coordinateBudgetMM':'5e-8','areaBudgetMM2':'1e-9','perimeterBudgetMM':'1e-9','maxCoordinateErrorMM':str(max(map(d,all_errors),default=Decimal(0))),'observations':reports,'nativeFiles':saves};(folder/'oracle.json').write_text(json.dumps(result,indent=2)+'\n');return result
if __name__=='__main__':
    with localcontext() as context:
        context.prec=90
        if sys.argv[1]=='make-negative':print(json.dumps(make_negative(*sys.argv[2:])))
        else:print(json.dumps(main(sys.argv[1]),indent=2))
