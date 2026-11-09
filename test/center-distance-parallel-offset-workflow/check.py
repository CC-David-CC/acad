#!/usr/bin/env python3
"""AFTER terminal whole flow only: independent original equations and ZIP/source.
No production solver, validator, geometry engine or successful source fixture.
"""
import hashlib,json,math,sys
from decimal import Decimal,localcontext
from fractions import Fraction
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'native-cad-container'))
from archive_oracle import read_archive
B=Fraction(1,20000000) # source acceptance50pm=5e-8mm; not Native accuracy.
def require(ok,message):
    if not ok:raise ValueError(message)
def one(rows,message):require(len(rows)==1,'one '+message);return rows[0]
def F(v):
    require(type(v) in (int,float) and math.isfinite(v),'finite represented geometry')
    return Fraction.from_float(v) if type(v) is float else Fraction(v)
def D(v):
    v=F(v) if not isinstance(v,Fraction) else v
    return Decimal(v.numerator)/Decimal(v.denominator)
def near(actual,wanted):require(abs(F(actual)-Fraction(wanted))<=B,'source50pm coordinate')
def length(a,z):return (D(F(z['x'])-F(a['x']))**2+D(F(z['y'])-F(a['y']))**2).sqrt()
def source(state,b):return json.loads(one([r for r in state['capture']['native']['sketches'] if r['id']==b['faceId']],'actual main source')['source'])
def native_equal(a,z):
    for k in ('source','sketches','history','counters','expressions','presentation'):require(a['capture']['native'][k]==z['capture']['native'][k],'exact native source '+k)
def settled(state):
    o=state['ownership'];r=o['resources'];require(not o['processing'] and not r['cleanupFailed'] and all(r[k]==0 for k in ('accepted','candidates','mounts')) and r['owners']==r['detached'],'exact owned resource retirement')
    require(not state['capture']['solids']['bodies'],'sketch-only, no BRep inference')
def qvalues(row):
    definitions=row['definitions'];raw=row['before']['capture']['native']['expressions']
    if not definitions:require(raw=='','empty authoritative parameter source');return {}
    require(len(definitions)==3 and [x['name'] for x in definitions]==['centerSpacing','lineOffset','spare'] and all(x['dimension']=='length' for x in definitions),'actual three named lengths')
    require(definitions[2]=={'name':'spare','dimension':'length','expression':'mm(7)'},'unrelated named expression exact')
    prefix='codi-physical-parameters:1\n';require(raw.startswith(prefix) and json.loads(raw[len(prefix):])==definitions,'raw authoritative definitions')
    q={}
    for d in definitions:
        t=d['expression'];require(t.startswith('mm(') and t.endswith(')'),'explicit canonical unit formula');q[d['name']]=Fraction(t[3:-1])
    return q
def scalar(v,q):
    require(type(v) in (int,float,str),'literal or named field')
    if type(v) is str and v in q:return q[v]
    try:return Fraction(v) if type(v) is not float else F(v)
    except (ValueError,ZeroDivisionError):raise ValueError('undefined original scalar')
def side(v):require(type(v) is bool or v in ('true','false'),'literal side');return v is True or v=='true'
def signed(point,a,z):
    dx,dy=F(z['x'])-F(a['x']),F(z['y'])-F(a['y']);L=length(a,z);require(L>0,'nondegenerate actual support')
    cross=-dy*(F(point['x'])-F(a['x']))+dx*(F(point['y'])-F(a['y']))
    return D(cross)/L
def equations(rows,points,lines,q):
    for c in rows:
        typ=c['typeId'];refs=c['objects'];k=c.get('constants',{})
        if typ=='LockPoint':
            p=points[one(refs,'lock Point')]
            for axis in ('x','y'):require(abs(F(p[axis])-scalar(k[axis],q))<=B,'original LockPoint')
        elif typ=='PCoincident':
            a,z=[points[x] for x in refs]
            for axis in ('x','y'):require(abs(F(z[axis])-F(a[axis]))<=B,'original PCoincident')
        elif typ in ('SignedDistanceX','SignedDistanceY'):
            a,z=[points[x] for x in refs];axis='x' if typ.endswith('X') else 'y';require(abs(F(z[axis])-F(a[axis])-scalar(k['distance'],q))<=B,'original signed component')
        elif typ=='DistancePP':
            a,z=[points[x] for x in refs];distance=scalar(k['distance'],q);require(distance>=0 and abs(length(a,z)-D(distance))<=D(B),'ORIGINAL center Euclidean equation')
        elif typ=='DistancePL':
            a,z=lines[refs[1]]['a'],lines[refs[1]]['b'];value=scalar(k['distance'],q);require(value>=0 and abs(signed(points[refs[0]],a,z)-D(value)*(-1 if side(k['inverted']) else 1))<=D(B),'ORIGINAL supporting line equation')
        elif typ in ('Horizontal','Vertical','SegmentLength'):
            line=lines[one(refs,'ordered Segment')];a,z=line['a'],line['b'];dx,dy=F(z['x'])-F(a['x']),F(z['y'])-F(a['y'])
            if typ=='SegmentLength':require(abs(length(a,z)-D(scalar(k['length'],q)))<=D(B),'original SegmentLength')
            else:
                angle=scalar(k['angle'],q);axes={0:(1,0),90:(0,1),180:(-1,0),270:(0,-1)};require(angle in axes,'explicit original direction branch');ux,uy=axes[angle];require(abs(-uy*dx+ux*dy)<=B and ux*dx+uy*dy>0,'actual directed horizontal/vertical equation')
        elif typ=='Parallel':
            first,second=[lines[x] for x in refs];a,z=first['a'],first['b'];p,t=second['a'],second['b'];dx,dy=F(z['x'])-F(a['x']),F(z['y'])-F(a['y']);ex,ey=F(t['x'])-F(p['x']),F(t['y'])-F(p['y']);L=length(a,z);require(L>0 and length(p,t)>0,'two actual nondegenerate supports');angle=scalar(k['angle'],q);require(angle in (0,180),'actual Parallel direction class');require(abs(D(dx*ey-dy*ex)/L)<=D(B) and (dx*ex+dy*ey)*(1 if angle==0 else -1)>0,'ORIGINAL directed Parallel equation')
        else:raise ValueError('Unexpected actual fixture schema '+typ)
def check_observation(row,original):
    b=row['b'];s=source(row['before'],b);i=row['inspection'];q=qvalues(row);objects={o['id']:o for o in s['objects']};require(len(objects)==len(s['objects']) and len(s['stages'])==1 and not s['stages'][0]['generators'],'unique ordinary source, no generator seed')
    base=original['source'];require([[o[k] for k in ('id','type','role','stage')] for o in s['objects']]==[[o[k] for k in ('id','type','role','stage')] for o in base['objects']],'exact all object membership/IDs/roles/stages/order')
    require({k:v for k,v in s.items() if k not in ('objects','stages')}=={k:v for k,v in base.items() if k not in ('objects','stages')},'all nongeometry source fields/frame/boundary/dimensions/labels exact')
    require({k:v for k,v in s['stages'][0].items() if k!='constraints'}=={k:v for k,v in base['stages'][0].items() if k!='constraints'},'stage identity/generators exact')
    require([objects[x] for x in b['rectangleIds']]==[o for o in base['objects'] if o['id'] in b['rectangleIds']],'unrelated rectangle exact')
    require(objects[b['unrelated']]['data']=={'x':70,'y':70},'unrelated free Point exact')
    require(one([x for x in row['before']['capture']['native']['sketches'] if x['id']==b['controlFaceId']],'unrelated actual source')['source']==original['controlSource'],'other source exact')
    control=json.loads(original['controlSource']);require(len(control['objects'])==1 and control['objects'][0]['id']==b['controlPointId'] and control['objects'][0]['type']=='Point' and control['objects'][0]['data']=={'x':250,'y':250},'genuine independent Point/source retained')
    rect=[objects[x] for x in b['rectangleIds']];require(len(rect)==4 and all(o['type']=='Segment' for o in rect),'actual original rectangle roots')
    require({(tuple(o['data']['a'][k] for k in ('x','y')),tuple(o['data']['b'][k] for k in ('x','y'))) for o in rect}=={((100,100),(110,100)),((110,100),(110,110)),((110,110),(100,110)),((100,110),(100,100))},'independent exact unrelated rectangle geometry')
    points={};cold_points={};lines={o['id']:o['data'] for o in s['objects'] if o['type']=='Segment'};cold_lines={}
    for p in i['points']:
        require(p['id'] not in points and p['parentId'] in objects,'unique actual owned child');o=objects[p['parentId']];data=o['data']
        if o['type']=='Point':matched=data
        elif o['type']=='Circle':matched=data['c']
        elif o['type']=='Segment':matched=one([v for v in (data['a'],data['b']) if all(abs(F(v[a])-F(p[a]))<=B for a in ('x','y'))],'actual source endpoint')
        else:raise ValueError('Unexpected source geometry')
        for axis in ('x','y'):near(p[axis],F(matched[axis]))
        points[p['id']]=matched;cold_points[p['id']]=p
        if o['type']=='Segment':
            line=cold_lines.setdefault(o['id'],{});end='a' if matched is data['a'] else 'b';require(end not in line,'unique actual endpoint role');line[end]=p
    require(set(cold_lines)==set(lines) and all(set(x)=={'a','b'} for x in cold_lines.values()),'both endpoints of every actual Segment')
    for n,center in enumerate(b['centers']):
        c=objects[b['circleIds'][n]];p=one([p for p in i['points'] if p['id']==center],'actual center child');require(c['type']=='Circle' and p['parentId']==c['id'] and c['data']['r']==n+1,'actual Circle-center ownership/radii; no standalone Point proxy')
    rows=s['stages'][0]['constraints'];require(len(rows)==len(i['constraints']),'complete current cold/source equation census')
    strip=lambda c:{k:v for k,v in c.items() if k!='admission'}
    retained=[c for c in rows if c['typeId'] not in ('DistancePP','DistancePL')]
    require([strip(c) for c in retained]==[strip(c) for c in base['stages'][0]['constraints']],'ALL original authored constraint identity/constants/order retained exactly')
    for n,(c,t) in enumerate(zip(rows,i['constraints'])):
        require(t['typeId']==c['typeId'] and t['stage']==c['stage'] and t['index']==n and t['objects']==c['objects'] and t['constants']==c.get('constants',{}) and t['admission']==c['admission'],'exact source/cold identity/constants/admission')
        require(c['admission']['version']==1 and c['admission']['state'] in ('accepted','redundant'),'actual admitted original equations')
    equations(rows,points,lines,q);equations(rows,cold_points,cold_lines,q)
    def actual(typ,refs):return one([c for c in rows if c['typeId']==typ and c['objects']==refs],'authored '+typ)
    actual('PCoincident',[b['centers'][0],b['connector']['a']]);actual('PCoincident',[b['centers'][1],b['connector']['b']]);require(scalar(actual('Parallel',[b['reference']['root'],b['connector']['root']])['constants']['angle'],q)==0,'explicit positive3:4 branch, not a free-coordinate assumption')
    require(not any(c['typeId']=='SegmentLength' and c['objects']==[b['connector']['root']] for c in rows),'center distance is the actual spacing driver, not a fixed connector length')
    require(scalar(actual('Horizontal',[b['l0']['root']])['constants']['angle'],q)==0 and scalar(actual('Parallel',[b['l0']['root'],b['l1']['root']])['constants']['angle'],q)==0,'TRUE Parallel plus Horizontal authority for both supports')
    for label,refs,present,raw,want in [('DistancePP',b['centers'],row['presentPP'],row['rawPP'],row['spacing']),('DistancePL',[b['l1']['a'],b['l0']['root']],row['presentPL'],row['rawPL'],row['offset'])]:
        cs=[c for c in rows if c['typeId']==label and c['objects']==refs];ts=[t for t in i['dimensionTargets'] if t['typeId']==label and t['objects']==refs];require(len(cs)==len(ts)==(1 if present else 0),'current actual distance census')
        if present:
            c=cs[0];require(str(c['constants']['distance'])==str(raw) and scalar(c['constants']['distance'],q)==Fraction(want),'preserved actual raw field/name and authoritative value');require(ts[0]['canEdit'] and ts[0]['canRemove'],'real discoverable edit/remove');near(ts[0]['resolvedValue'],want)
            if label=='DistancePP':
                for actuals in (points,cold_points):
                    a,z=[actuals[x] for x in b['centers']];near(a['x'],0);near(a['y'],0);near(z['x'],Fraction(3*want,5));near(z['y'],Fraction(4*want,5));require(abs(length(a,z)-D(Fraction(want)))<=D(B),'actual centers satisfy ideal requested Euclidean distance')
            else:
                require(not side(c['constants']['inverted']),'same original side')
                for actuals,ls in ((points,lines),(cold_points,cold_lines)):
                    a,z=ls[b['l0']['root']]['a'],ls[b['l0']['root']]['b']
                    for end in ('a','b'):require(abs(signed(ls[b['l1']['root']][end],a,z)-D(Fraction(want)))<=D(B),'BOTH actual parallel support endpoints at requested offset')
                w=ts[0]['supportingLine'];require(w['lineId']==b['l0']['root'] and w['inverted'] is False and w['normalBasis']=='native-polar-angle' and w['quality']=='source-local-supporting-line-mm','actual Native polar support witness, not endpoint-distance proxy')
    require(row['before']==row['after'],'read-only observation exact state');settled(row['after'])
    history=row['before']['capture']['native']['history'];require(len(history)==2 and all(x['type']=='PLANE' for x in history),'one genuine two-source authored graph; no hidden solid/seed')
def run(folder):
    folder=Path(folder);r=json.loads((folder/'receipt.json').read_text());require(r['status']=='PASS' and not r['sourceSeeds'] and not r['privateAuthoring'] and not r['fakeReplies'],'actual complete success without successful fixture')
    require(r['coordinateMm']==5e-8 and r['sourcePins']==r['sourcePinsAfter'] and r['ownedContextsRetired'] and r['sharedBrowserDisconnectedOnly'],'frozen source and owned cleanup')
    for x in r['sourceSnapshots']:require(hashlib.sha256((folder/x['file']).read_bytes()).hexdigest()==x['sha256'],'retained producing source bytes')
    require(len(r['observations'])>=25 and len(r['travels'])>=16,'whole creation/removal/mixed typed travel observed')
    for row in r['observations']:check_observation(row,r['original'])
    require(len(r['refusals'])==8,'all distinct retained-domain/conflict/stale/foreign/binding refusals')
    codes=[x['error']['code'] for x in r['refusals']];require(codes.count('DIMENSION_REJECTED')==2 and codes.count('INVALID_VALUE')==2 and codes.count('BOUND_DIMENSION')==2 and codes.count('POINT_DISTANCE_TARGET')==1,'precise source-layer refusal codes')
    require(sum(x['error']['name']=='AbortError' for x in r['refusals'])==1,'inherited actual stale AbortError, no invented string code')
    for x in r['refusals']:require(x['before']==x['after'] and not x['error']['committed'] and not x['error']['possiblyCommitted'],'exact prepublication refusal preservation');settled(x['after'])
    noops=[x for x in r['rows'] if 'no-op' in x['label']];require(len(noops)==2 and all(x['before']==x['after'] and not x['result']['changed'] and not x['result']['authoredUndo'] for x in noops),'both exact creator no-ops')
    require(len(r['saves'])==2,'two genuine current .cad files');archives=[]
    for x in r['saves']:
        a=read_archive(folder/x['savedFile']);n=x['before']['capture']['native'];require(a['sha256']==x['sha256'] and a['bytes']==x['bytes'] and x['result']['committed'] and x['result']['persistence']=='browser','actual browser/server-equal committed archive')
        project=a['envelope']['project'];require(project['model']['history']==n['history'] and project['model']['counters']==n['counters'] and project['model']['expressions']==n['expressions'],'exact one graph/counters/formulas')
        require(a['rawSketches']=={s['id']:s['source'] for s in n['sketches']},'exact independently decoded two-source bytes')
        require(a['envelope'].get('presentation')==n['presentation'],'exact display-only state');require(x['before']['capture']==x['after']['capture'],'Save source/J/resources unchanged');archives.append({'file':x['savedFile'],'sha256':a['sha256'],'bytes':a['bytes'],'designRevision':a['manifest']['designRevision']})
    opens=[x for x in r['observations'] if x['label']=='Fresh normal .cad Open'];require(len(opens)==2,'two real fresh normal Opens')
    for op,saved in zip(opens,r['saves']):native_equal(op['before'],saved['before']);require(not op['before']['capture']['journal']['canUndo'] and not op['before']['capture']['journal']['canRedo'],'session journal resets on Open')
    return {'status':'PASS','scope':'Actual Circle-center Euclidean spacing plus Parallel-authorized support offset, source50pm/original equations/current .cad; no BRep or broad C04 claim','observations':len(r['observations']),'travels':len(r['travels']),'refusals':len(r['refusals']),'archives':archives}
if __name__=='__main__':
    with localcontext() as context:
        context.prec=90
        print(json.dumps(run(sys.argv[1]),indent=2))
