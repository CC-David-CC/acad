#!/usr/bin/env python3
"""After one complete signed workflow: independent original rectangle equations.
No application/solver/production validator import; no geometry or report seed.
"""
import argparse, collections, hashlib, json, math
from fractions import Fraction as F
from pathlib import Path

def require(ok,message):
    if not ok:raise ValueError(message)
def near(a,b,t=1e-6):require(isinstance(a,(int,float)) and not isinstance(a,bool) and math.isfinite(a) and abs(a-b)<=t,f'{a!r} != {b!r}')
def one(rows,label):require(len(rows)==1,f'one {label}, got {len(rows)}');return rows[0]
def rank(matrix):
    a=[row[:] for row in matrix];r=0
    for col in range(len(a[0]) if a else 16):
        p=next((i for i in range(r,len(a)) if a[i][col]),None)
        if p is None:continue
        a[r],a[p]=a[p],a[r];v=a[r][col];a[r]=[x/v for x in a[r]]
        for i in range(len(a)):
            if i!=r and a[i][col]:v=a[i][col];a[i]=[x-v*y for x,y in zip(a[i],a[r])]
        r+=1
        if r==len(a):break
    return r

def inspect_source(source,inspection,binding,width,mode):
    require(source['version']==3 and len(source['objects'])==4 and len(source['stages'])==1,'ordinary four-segment native source')
    require(source['constants']=='' and source['dimensions']==[] and source['labels']==[] and source['stages'][0]['generators']==[],'no alternate expression/annotation/generator source')
    require(source['metadata']['boundaryFrame']==binding['frame']=={'origin':[0,0,0],'x':[1,0,0],'y':[0,1,0],'z':[0,0,1]},'same genuine source frame')
    require(all(not v for v in source['boundary'].values()),'no external geometry seed')
    objects={o['id']:o for o in source['objects']};require(len(objects)==4 and sorted(objects)==binding['segmentIds'],'stable source membership')
    points=inspection['points'];require(len(points)==8 and len({p['id'] for p in points})==8,'eight actual public endpoint identities')
    by_id={p['id']:p for p in points};require(all(p['parentId'] in objects for p in points),'actual endpoint parent membership')
    # Bind public point IDs to the actual saved endpoint coordinates. No opaque
    # ID syntax, :A/:B construction or constraint ordinal is used to author/map.
    ends={};corners=collections.Counter()
    for id,o in objects.items():
        require(o['type']=='Segment' and o['role'] is None and o['stage']==0,'nonconstruction ordinary source segments')
        a,b=[(o['data'][k]['x'],o['data'][k]['y']) for k in ('a','b')];require(math.dist(a,b)>1e-8,'nonzero Segment')
        rows=[p for p in points if p['parentId']==id];require(len(rows)==2,'two public endpoints per real segment')
        pair=[]
        for q in (a,b):
            p=one([p for p in rows if math.dist((p['x'],p['y']),q)<=1e-9],'endpoint-coordinate association');pair.append(p['id'])
            c=one([c for c in [(0,0),(width,0),(width,50),(0,50)] if math.dist(c,q)<=1e-6],'independent rectangle corner');corners[c]+=1
        require(pair[0]!=pair[1],'distinct actual segment endpoints');ends[id]=pair
    require(len(corners)==4 and set(corners.values())=={2},'exact four rectangle corners')
    cs=source['stages'][0]['constraints'];counts=collections.Counter(c['typeId'] for c in cs)
    require(counts==collections.Counter({'PCoincident':4,'Horizontal':2,'Vertical':2,'LockPoint':1,'SegmentLength':1 if mode=='under' else 2,**({'SignedDistanceX':1} if mode=='redundant' else {})}),'only actual supported original constraints')
    require(len(inspection['constraints'])==len(cs),'public and saved constraint census')
    columns={(p['id'],axis):i*2+j for i,p in enumerate(points) for j,axis in enumerate(('x','y'))};rows=[];residuals=[]
    def equation(terms,residual,unit):
        row=[F(0)]*16
        for id,axis,value in terms:require(id in by_id,'equation references an actual discovered point');row[columns[id,axis]]+=F(value)
        rows.append(row);residuals.append((residual,unit));near(residual,0,1e-8 if unit=='radian' else 1e-6)
    def point(id):require(id in by_id,'real equation point');return by_id[id]
    for index,c in enumerate(cs):
        require(c['stage']==0 and c['admission']['version']==1 and c['admission']['state'] in ('accepted','redundant'),'actual admitted authored row')
        public=inspection['constraints'][index];require(public['stage']==0 and public['index']==index and public['typeId']==c['typeId'] and public['objects']==c['objects'] and public['constants']==c.get('constants',{}) and public['admission']==c['admission'],'public original row identity')
        typ=c['typeId'];refs=c['objects'];constants=c.get('constants',{});start=len(rows)
        if typ=='PCoincident':
            a,b=[point(p) for p in refs]
            for axis in ('x','y'):equation([(a['id'],axis,1),(b['id'],axis,-1)],a[axis]-b[axis],'millimeter')
        elif typ=='LockPoint':
            p=point(one(refs,'locked point'));require(constants=={'x':'0','y':'0'},'actual origin lock')
            for axis in ('x','y'):equation([(p['id'],axis,1)],p[axis]-float(constants[axis]),'millimeter')
        elif typ in ('Horizontal','Vertical','SegmentLength'):
            id=one(refs,'actual segment');require(id in ends,'known segment');pa,pb=ends[id];a,b=point(pa),point(pb);dx,dy=b['x']-a['x'],b['y']-a['y'];length=math.hypot(dx,dy)
            if typ=='SegmentLength':
                target=float(constants['length']);require(target>0,'positive driving length');near(target,width if id==binding['bottomId'] else 50)
                # Derivative of the original squared-length polynomial. The
                # residual is independently checked in physical millimeters.
                equation([(pa,'x',-2*F(dx)),(pb,'x',2*F(dx)),(pa,'y',-2*F(dy)),(pb,'y',2*F(dy))],length-target,'millimeter')
            else:
                angle=float(constants['angle']);expected=math.radians(angle);actual=math.atan2(dy,dx);residual=math.atan2(math.sin(actual-expected),math.cos(actual-expected));axis='y' if typ=='Horizontal' else 'x'
                require(angle in ((0,180) if typ=='Horizontal' else (90,270)),'exact directed rectangle axis branch');equation([(pa,axis,-1),(pb,axis,1)],residual,'radian')
        elif typ=='SignedDistanceX':
            require(refs==binding['bottomPoints'],'actual directed bottom endpoints');a,b=[point(p) for p in refs];near(float(constants['distance']),width);require(c['admission']['state']=='redundant','satisfied redundant admission');equation([(refs[0],'x',-1),(refs[1],'x',1)],b['x']-a['x']-float(constants['distance']),'millimeter')
        else:raise ValueError('Unsupported original equation '+typ)
        residuals[start:]=[(v,u,index) for v,u in residuals[start:]]
    expected_rank=15 if mode=='under' else 16;require(len(rows)==(15 if mode=='under' else 17 if mode=='redundant' else 16),'independent physical equation census');actual_rank=rank(rows);require(actual_rank==expected_rank,'exact Fraction rank in actual Cartesian coordinates')
    return {'physicalCoordinates':16,'originalCartesianEquations':len(rows),'exactCartesianLocalRank':actual_rank,'cartesianLocalNullity':16-actual_rank,'internalNondegeneratePolarDefinitions':8,'residuals':residuals}

def inspect_report(row,binding):
    source=row['source'];require(source==json.loads(row['before']['capture']['native']['source']),'actual recorded source');require(row['after']==row['before'],'exact read-only accepted state/token/resource preservation')
    facts=inspect_source(source,row['inspection'],binding,row['width'],row['mode']);r=row['report'];d=r['localJacobian'];cs=source['stages'][0]['constraints'];require(r['revision']==row['targets']['revision'] and r['faceId']==binding['faceId'] and r['mode']=='saved' and r['scope']=='current-sketch-local-estimate','actual request/reply binding');require(r['status']==d['status']=='estimated','well-conditioned rectangle report')
    n=facts['physicalCoordinates']+8;m=facts['originalCartesianEquations']+8;rk=facts['exactCartesianLocalRank']+8
    require(d['variables']==n and d['equations']==m and d['rankLower']==d['rankUpper']==d['rank']==rk and d['localNullity']==d['nullityLower']==d['nullityUpper']==n-rk,'numerical estimate matches independent finite formulation')
    require(r.get('physicalDof') is None and d.get('physicalDof') is None,'no invented physical DOF');require(d['thresholds']=={'low':1e-12,'high':1e-8} and d['method']=='equilibrated-pivoted-mgs2','actual fixed numerical method/threshold band');require(d['zeroGradientRows']==d['nearZeroGradientRows']==[],'this regular rectangle is not mislabeled singular');require(d['auxiliaryVariables']==d['fixedExternalVariables']==0,'no hidden auxiliary/fixed-stage interpretation')
    require(len(r['admission'])==len(r['evidence'])==len(cs),'complete original authored row ownership');require(len(d['dependentRows'])==m-rk,'local dependent row census');groups=d['orderedContribution']['groups'];require(len(groups)==len(cs) and len(d['rowOrigins'])==m,'complete local row/group ownership')
    baseline=d['orderedContribution']['baseline'];require(baseline=={'status':'estimated','rankLower':8,'rankUpper':8,'increment':8},'actual internal polar baseline')
    previous=8
    for i,c in enumerate(cs):
        a,e,g=r['admission'][i],r['evidence'][i],groups[i];require(a=={'index':i,'typeId':c['typeId'],'objects':c['objects'],'state':c['admission']['state']},'admission is source membership, not rank inference');require(e['typeId']==c['typeId'] and e['state']==c['admission']['state'],'actual residual origin')
        expected=[(v,u) for v,u,index in facts['residuals'] if index==i];require(len(e['residuals'])==len(e['tolerances'])==len(e['units'])==len(expected),'all original equation residuals')
        for value,tolerance,unit,(independent,expected_unit) in zip(e['residuals'],e['tolerances'],e['units'],expected):
            require(unit==expected_unit and tolerance==(1e-8 if unit=='radian' else 1e-6),'unit-aware residual contract');near(value,0,tolerance);near(independent,0,tolerance)
        require(g['authoredIndex']==i and g['typeId']==c['typeId'] and g['status']=='estimated' and g['rankLower']==g['rankUpper'] and g['increment']==g['rankLower']-previous,'actual ordered contribution');previous=g['rankLower']
        if c['typeId']=='SignedDistanceX':require(g['increment']==0,'satisfied redundant width has no new local contribution')
    require(previous==rk,'all ordered groups cover current estimate')
    require(sum(o['internal'] for o in d['rowOrigins'])==8,'actual eight internal definition rows')
    for origin in d['rowOrigins']:
        if origin['internal']:require(origin['authoredIndex'] is None,'internal row is not authored intent')
        else:
            g=groups[origin['authoredIndex']];require(all(origin[k]==g[k] for k in ('constraintIndex','constraintId','typeId')),'original row belongs to the exact authored group')
    return {'label':row['label'],'width':row['width'],'mode':row['mode'],**{k:v for k,v in facts.items() if k!='residuals'},'reportedLocalRank':rk,'reportedLocalNullity':n-rk,'physicalDof':None}

def main():
    parser=argparse.ArgumentParser();parser.add_argument('evidence',type=Path);args=parser.parse_args();folder=args.evidence;receipt=json.loads((folder/'receipt.json').read_text())
    require(receipt['status']=='PASS' and receipt['ownedContextClosed'] and receipt['sharedBrowserDisconnectedOnly'],'complete ordinary workflow and owned cleanup');require(receipt['sourcePins']==receipt['sourcePinsAfter'],'executing inputs stable');require(receipt['privateAuthoring'] is False and receipt['sourceSeeds'] is False and receipt['fakeSuccessfulReplies'] is False,'genuine public source scope');require(receipt['n4Complete'] is False,'missing singular/nonconvergence not advertised complete');require({r['case'] for r in receipt['requiredOpen']}=={'singular-distance-zero','genuine-nonconvergence'},'explicit finite open requirements')
    own=Path(__file__).read_bytes();pins=[v for k,v in receipt['sourcePins'].items() if k.endswith('/current-solver-report-workflow/check.py')];require(pins==[hashlib.sha256(own).hexdigest()],'actual independent checker input')
    diagnostics=[r for r in receipt['rows'] if r.get('kind')=='diagnostic'];require(len(diagnostics)==7,'seven deliberately current reports across the complete chain');results=[inspect_report(r,receipt['binding']) for r in diagnostics]
    require([(r['width'],r['mode']) for r in diagnostics]==[(100,'full'),(100,'under'),(120,'under'),(100,'redundant'),(100,'redundant'),(120,'full'),(120,'full')],'frozen finite ordinary state chain')
    conflict=one([r for r in receipt['rows'] if r.get('kind')=='conflict'],'actual public contradiction attempt');outcome=conflict['outcome'];require(outcome['ok'] is False and outcome['error']['code']=='DISTANCE_CONFLICT' and not outcome['error']['committed'] and not outcome['error']['possiblyCommitted'],'typed actual refusal');require(conflict['before']==conflict['after'],'refusal preserves every captured accepted field');require(120>100,'independent |deltaX|<=length contradiction');cause=outcome['error']['admissionCause'];taxonomy={'algebraic-contradiction':'exact-reduced-row','approximate-reduction-rejection':'approximate-reduced-row','original-residual-failure':'original-equations','invalid-domain':'domain-check','numerical-convergence-failure':'solver-status','nonfinite-result':'finite-check','resource-limit':'resource-check','retained-validation-failure':'retained-validation','unclassified-rejection':'admission-membership'};require(taxonomy.get(cause['kind'])==cause['basis'],'actual cause is not relabeled from failure')
    require(len(receipt['saved'])==2,'two normal synchronized native files');saved=[]
    for row in receipt['saved']:
        raw=(folder/row['savedFile']).read_bytes();require(len(raw)==row['bytes'] and hashlib.sha256(raw).hexdigest()==row['sha256'],'actual browser/server/native bytes');native=json.loads(raw);require(native['format']=='codi-jsketcher-project' and native['version']==2 and native['unit']=='millimeter','native source envelope');project=native['project'];before=row['before']['capture']['native'];require(project['model']['history']==before['history'] and project['model']['counters']==before['counters'] and project['model']['expressions']==before['expressions']=='','exact original authored history/counters/empty parameters');require(len(project['model']['history'])==1 and project['model']['history'][0]['type']=='PLANE' and len(project['sketches'])==1,'one real source plane, no seeded solid')
        source=one([s['data'] for s in project['sketches'] if s['id']==receipt['binding']['faceId']],'saved actual sketch');require(source==json.loads(before['source']),'exact saved source/constraints/admission');sample=one([r for r in diagnostics if r['width']==row['width'] and r['mode']==row['mode'] and r['source']==source][:1],'real source inspection');inspect_source(source,sample['inspection'],receipt['binding'],row['width'],row['mode']);require('localJacobian' not in raw.decode() and 'constraintId' not in raw.decode(),'no diagnostic result/ephemeral locator persisted');saved.append({'file':row['savedFile'],'sha256':row['sha256'],'width':row['width'],'mode':row['mode']})
    require(len({s['sha256'] for s in saved})==2,'source really changed and resaved');runtime=[r for r in receipt['rows'] if r['label']=='Exact current composed runtime'];require(len(runtime)==3,'initial and two fresh Open runtime bindings')
    for row in runtime:require({a['name']:a['sha256'] for a in row['assets']}==receipt['pins']['files'] and row['outer']['sha256']==receipt['pins']['outer']['sha256'],'exact actual served runtime')
    print(json.dumps({'status':'PASS_SCOPED_CURRENT_RECTANGLE_REPORTS','n4Complete':False,'requiredOpen':receipt['requiredOpen'],'reports':results,'nativeFiles':saved,'contradiction':{'independentProof':'120 > length100 violates |deltaX|<=length','actualAdmissionCause':cause},'limits':['Exact independent rank is local to this finite nondegenerate Cartesian rectangle formulation.','Numerical report nullity is not physical DOF or global solvability.','No current public singular DistancePP or genuine nonconvergence case is claimed.']},indent=2))

if __name__=='__main__':main()
