#!/usr/bin/env python3
"""Whole-output independent Fraction reflection / native primitive / ZIP oracle.
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
def reflect(p,a,b):
    dx=b[0]-a[0];dy=b[1]-a[1];den=dx*dx+dy*dy;require(den>0,'actual nonzero reflection axis');t=((p[0]-a[0])*dx+(p[1]-a[1])*dy)/den
    return(2*(a[0]+t*dx)-p[0],2*(a[1]+t*dy)-p[1])
def source_parts(source,binding):
    independent=[o for o in source['objects'] if o['id'] not in [binding['axisId']]+binding['sourceIds']+binding['generatedIds']]
    intent=copy.deepcopy(source);intent['objects']=[]
    for stage in intent['stages']:
        for c in stage['constraints']:
            if c['typeId']=='DiameterLength' and c['objects']==[binding['sourceIds'][2]]:c['constants']['diameter']='<explicit circle edit>'
    return independent,intent
def primitive_points(row):
    data=row['data'];return[data] if row['type']=='Point' else [data['c']] if row['type']=='Circle' else [data[k] for k in (('a','b','c') if row['type']=='Arc' else ('a','b'))]
def coordinate_errors(measured,truth):
    delta=[abs(q(measured[k])-truth[j]) for j,k in enumerate(('x','y'))];require(all(e<=COORD for e in delta),'independent50pm coordinate budget');return delta
def cardinal_angle(p,c):
    x=p[0]-c[0];y=p[1]-c[1]
    require(x==0 or y==0,'independent Arc reference domain is the actual cardinal source fixtures, not a general geometry engine')
    return 0 if x>0 else 2 if x<0 else 1 if y>0 else 3
def inspect_observation(item,binding):
    require(item['before']==item['after'],'actual native reflection inspection is read-only');state=item['before'];source=json.loads(state['accepted']['native']['source']);byid={o['id']:o for o in source['objects']};inspection=state['inspection'];g=one([g for g in inspection['mirror']['generators'] if g['record']['generatedObjects']==binding['generatedIds']],'actual source-bound native Mirror');axis=one([a for a in inspection['mirror']['axes'] if a['id']==binding['axisId']],'native axis');saved_axis=byid[binding['axisId']];a,b=map(point,(saved_axis['data']['a'],saved_axis['data']['b']));errors=[]
    for saved,observed in zip((saved_axis['data']['a'],saved_axis['data']['b']),axis['geometry']['points']):errors+=coordinate_errors(observed,point(saved))
    for id,data in item['expected']:require(byid[id]['data']==data,'actual retained primary source equals exact public request/travel intent, no tolerance')
    require(g['supported'] and g['reason'] is None,'real qualified generator domain');require(g['record']==source['stages'][g['stage']]['generators'][g['index']] and g['record']['params']=={'reflectionLine':[binding['axisId']],'objects':binding['sourceIds']} and g['record']['generatedObjects']==binding['generatedIds'],'actual stage and ordered record custody')
    identities=[]
    for i,(src,out) in enumerate(zip(g['sources'],g['outputs'])):
        require(src['id']==binding['sourceIds'][i] and out['id']==binding['generatedIds'][i] and src['type']==out['type'],'actual source/output mapping');identities+=[p['pointId'] for p in src['points']+out['points']]
        saved=byid[src['id']];dest=byid[out['id']];source_points=primitive_points(saved);output_points=primitive_points(dest)
        # Stored source and cold native observations are SEPARATE measurable
        # facts. Both are checked against one retained-source analytic truth.
        for truth,actual in zip(source_points,src['points']):errors+=coordinate_errors(actual,point(truth))
        pairs=[(j,j) for j in range(len(source_points))]
        if src['type']=='Arc':pairs=[(0,1),(1,0),(2,2)]
        for u,v in pairs:
            truth=reflect(point(source_points[u]),a,b);errors+=coordinate_errors(output_points[v],truth);errors+=coordinate_errors(out['points'][v],truth)
        if src['type']=='Circle':
            require(saved['data']['r']==dest['data']['r']==src['radius']==out['radius'],'actual Circle radius parameter preserved exactly')
        if src['type']=='Arc':
            c=point(saved['data']['c']);first=point(saved['data']['a']);last=point(saved['data']['b']);r2=(first[0]-c[0])**2+(first[1]-c[1])**2;n=math.isqrt(r2.numerator);m=math.isqrt(r2.denominator);require(n*n==r2.numerator and m*m==r2.denominator,'finite rational Arc radius fixture');radius=Fraction(n,m);require((last[0]-c[0])**2+(last[1]-c[1])**2==r2,'actual saved source is circular')
            require(abs(q(src['radius'])-radius)<=Fraction(1,10**9) and abs(q(out['radius'])-radius)<=Fraction(1,10**9),'actual derived Arc scalar radii use retained1e-9mm comparison, not exact bit identity')
            start_quadrant=cardinal_angle(first,c);end_quadrant=cardinal_angle(last,c);quarter_sweep=(end_quadrant-start_quadrant)%4;require(quarter_sweep in (1,3),'real minor90/major270 reference branch');reference_start=PI*start_quadrant/2;sweep=PI*quarter_sweep/2
            for actual,reverse in ((src,False),(out,True)):
                start,end=map(d,actual['angles']);actual_sweep=(end-start)%(2*PI)
                if actual_sweep<0:actual_sweep+=2*PI
                require(actual_sweep>0 and abs(actual_sweep-sweep)*d(radius)<=d(COORD),'native actual CCW interval retains the full source branch')
                center=point(actual['points'][2]);r=d(actual['radius'])
                for t in (Decimal(0),Decimal('.25'),Decimal('.5'),Decimal('.75'),Decimal(1)):
                    theta=reference_start+(1-t if reverse else t)*sweep;x=d(c[0])+d(radius)*cos(theta);y=d(c[1])+d(radius)*sin(theta)
                    if reverse:
                        dx=d(b[0]-a[0]);dy=d(b[1]-a[1]);den=dx*dx+dy*dy;projection=((x-d(a[0]))*dx+(y-d(a[1]))*dy)/den;truth=(2*(d(a[0])+projection*dx)-x,2*(d(a[1])+projection*dy)-y)
                    else:truth=(x,y)
                    angle=start+t*actual_sweep;measured=(d(center[0])+r*cos(angle),d(center[1])+r*sin(angle));delta=[abs(measured[k]-truth[k]) for k in range(2)];require(all(e<=d(COORD) for e in delta),'actual native Arc locus vs independent retained-source reflection');errors += [Fraction(e) for e in delta]
    require(len(set(identities))==len(identities),'on-axis/overlapping copies retain actual distinct IDs');return source,identities,errors,{'label':item['label'],'maxCoordinateErrorMM':str(max(map(d,errors),default=Decimal(0))),'axis':saved_axis['data']}
def make_negative(file,dest,face,binding_json,inspection_json):
    binding=json.loads(binding_json);inspection=json.loads(inspection_json);info=read_archive(file);original=json.loads(info['rawSketches'][face]);entry=one([e for e in info['manifest']['entries'] if e['role']=='sketch' and e['logicalId']==face],'actual own sketch entry');observed=one([g for g in inspection['generators'] if g['record']['generatedObjects']==binding['generatedIds']],'actual observed generator');base=original['stages'][observed['stage']]['generators'][observed['index']];require(base==observed['record'],'actual saved generator custody');rows=structure(Path(file).read_bytes());dest=Path(dest);dest.mkdir(parents=True,exist_ok=False);results=[]
    for kind,code in [('alias-output','INVALID_MIRROR_SOURCE'),('missing-pair','INVALID_MIRROR_SOURCE'),('wrong-stage','INVALID_MIRROR_SOURCE'),('self-cycle','INVALID_MIRROR_SOURCE'),('stale-point','MIRROR_DERIVED_MISMATCH'),('wrong-arc-order','MIRROR_DERIVED_MISMATCH')]:
        changed=copy.deepcopy(original);g=changed['stages'][observed['stage']]['generators'][observed['index']]
        if kind=='alias-output':g['generatedObjects'][0]=g['params']['objects'][0]
        elif kind=='missing-pair':g['generatedObjects'].pop()
        elif kind=='wrong-stage':g['stage']=g['stage']+1
        elif kind=='self-cycle':g['params']['objects'][0]=g['generatedObjects'][0]
        elif kind=='stale-point':one([o for o in changed['objects'] if o['id']==g['generatedObjects'][0]],'actual Point cache')['data']['x']+=1
        else:
            arc=one([o for o in changed['objects'] if o['id']==g['generatedObjects'][3]],'actual Arc cache');arc['data']['a'],arc['data']['b']=arc['data']['b'],arc['data']['a']
        body=json.dumps(changed,ensure_ascii=False,separators=(',',':'),allow_nan=False).encode();m=copy.deepcopy(info['manifest']);e=one([e for e in m['entries'] if e['path']==entry['path']],'descriptor');e['bytes']=len(body);e['sha256']=sha(body);m['designRevision']=sha(canonical(root_record(m)));codec=zlib.compressobj(6,zlib.DEFLATED,-15);compressed=codec.compress(body)+codec.flush();replacement={'path':entry['path'],'method':8,'crc':binascii.crc32(body)&0xffffffff,'bytes':len(body),'compressed':compressed};saved=dest/(kind+'.cad');saved.write_bytes(rebuild([replacement if r['path']==entry['path'] else manifest_row(m) if r['path']=='manifest.json' else r for r in rows]));results.append({'kind':kind,'file':str(saved.resolve()),'codes':[code]})
    return results
def main(folder):
    folder=Path(folder);r=json.loads((folder/'receipt.json').read_text());require(r['status']=='PASS' and r['ownedContextClosed'] and r['sharedBrowserDisconnectedOnly'],'whole terminal PASS/cleanup');require(r['sourcePins']==r['sourcePinsAfter'] and not r['privateAuthoring'] and not r['sourceSeeds'] and not r['syntheticReplies'],'frozen producer/genuine workflow')
    for row in r['sourceSnapshots']:require(sha((folder/row['file']).read_bytes())==row['sha256']==r['sourcePins'][row['originalFile']],'actual source snapshot custody')
    binding=r['binding'];creation=one([t for t in r['commandTrace'] if t['command']=='create-closed-sketch-mirror' and t['outcome']=='accepted'],'actual shared generator creation');require(creation['value']['mirror']['generatedIds']==binding['generatedIds'] and creation['args']['sourceIds']==binding['sourceIds'],'real source/output creation identities')
    require(len(r['observations'])>=16,'complete source/axis/travel/reopen observations');initial=None;ids=None;errors=[];reports=[]
    for item in r['observations']:
        source,identity,delta,report=inspect_observation(item,binding);parts=source_parts(source,binding)
        if initial is None:initial=parts;ids=identity
        require(parts==initial and identity==ids,'exact unrelated source/nongeometric intent and actual identities');errors+=delta;reports.append(report)
    initial_source=json.loads(r['observations'][0]['before']['accepted']['native']['source']);require(one([o for o in initial_source['objects'] if o['id']==binding['axisId']],'initial real axis')['data']=={'a':{'x':0,'y':-10},'b':{'x':0,'y':30}},'registered actual initial axis')
    require([s['label'] for s in r['nativeSaves']]==['initial','edited','reopened-reedited'],'three normal Saves');saves=[]
    for saved in r['nativeSaves']:
        data=read_archive(folder/saved['savedFile']);require(data['sha256']==saved['sha256'] and data['rawSketches'][binding['faceId']]==saved['before']['accepted']['native']['source'] and data['envelope']['project']['model']['history']==saved['before']['accepted']['native']['history'],'independent actual ZIP/source/history custody');saves.append({'file':saved['savedFile'],'sha256':data['sha256'],'bytes':data['bytes']})
    for refusal in r['refusals']:require(refusal['error'] and not refusal['error']['committed'] and not refusal['error']['possiblyCommitted'] and stable(refusal['before'])==stable(refusal['after']),'actual refusal preserves full accepted state')
    require(len(r['negativeArchives'])==6 and len(r['refusals'])>=16,'complete graph/cache/source refusal boundaries')
    result={'status':'PASS','scope':'native shared sketch Mirror and native archive workflow only','coordinateBudgetMM':'5e-8','maxCoordinateErrorMM':str(max(map(d,errors),default=Decimal(0))),'observations':reports,'nativeFiles':saves};(folder/'oracle.json').write_text(json.dumps(result,indent=2)+chr(10));return result
if __name__=='__main__':
    with localcontext() as context:
        context.prec=90
        if sys.argv[1]=='make-negative':print(json.dumps(make_negative(*sys.argv[2:])))
        else:print(json.dumps(main(sys.argv[1]),indent=2))
