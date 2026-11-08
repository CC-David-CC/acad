#!/usr/bin/env python3
"""AFTER complete actual workflow; independent equations and ZIP/source inspector.
Imports no production validator/planner/codec, does not run a solver/Native call.
"""
import hashlib, importlib.util, json, math, sys
from pathlib import Path
base=Path(__file__).resolve().parents[1]/'native-cad-container'/'archive_oracle.py'
spec=importlib.util.spec_from_file_location('independent_zip',base);arc=importlib.util.module_from_spec(spec);spec.loader.exec_module(arc)
def require(ok,message):
    if not ok:raise ValueError(message)
def one(rows,label):require(len(rows)==1,label);return rows[0]
def close(a,b,t=1e-6):require(isinstance(a,(float,int)) and math.isfinite(a) and abs(a-b)<=t,'quantity difference '+str((a,b,t)))
def circles(raw,ids):
    s=json.loads(raw) if isinstance(raw,str) else raw
    require(s['version']==3 and len(s['objects'])==2,'two genuine retained source Circle objects')
    require(sorted(o['id'] for o in s['objects'])==sorted(ids),'exact public source IDs')
    result=[]
    for identity in ids:
        o=one([o for o in s['objects'] if o['id']==identity],'actual source Circle')
        require(o['type']=='Circle' and o['role'] is None and o['stage']==0,'ordinary Circle source domain')
        require(set(o['data'])=={'c','r'} and set(o['data']['c'])=={'x','y'} and o['data']['r']>0,'actual source Circle data')
        result.append({'id':identity,'x':o['data']['c']['x'],'y':o['data']['c']['y'],'r':o['data']['r']})
    # Any persisted diameter must independently mean 2*r, not just agree with
    # another observation produced by the same Native builder.
    for stage in s['stages']:
        for row in stage['constraints']:
            if row['typeId']=='DiameterLength':
                target=one([c for c in result if row['objects']==[c['id']]],'actual diameter object')
                close(2*target['r'],float(row['constants']['diameter']),5e-8)
    return result

def truth(cs,mask,depth):
    a,b=cs;d=b['x']-a['x'];require(a['y']==b['y']==0 and d>=0,'frozen horizontal source frame')
    ra,rb=a['r'],b['r'];A=math.pi*ra*ra;B=math.pi*rb*rb;cross=[]
    if d==0:overlap=min(A,B)
    elif d>=ra+rb:overlap=0
    elif d<=abs(ra-rb):overlap=min(A,B)
    else:
        # Independent conventional segment-area formula; no production atan2,
        # exact-predicate, expected-area or construction-certificate imports.
        u=(d*d+ra*ra-rb*rb)/(2*d);v=math.sqrt(ra*ra-u*u)
        overlap=ra*ra*math.acos(u/ra)+rb*rb*math.acos((d-u)/rb)-d*v
        cross=[[a['x']+u,v],[a['x']+u,-v]]
    area=overlap if mask==3 else A-overlap if mask==1 else B-overlap
    require(area>0,'positive selected analytic material cell')
    extrema=cross[:]
    for owner,c in enumerate(cs):
        for p in [[c['x']-c['r'],0],[c['x']+c['r'],0],[c['x'],-c['r']],[c['x'],c['r']]]:
            other=cs[1-owner];q=(p[0]-other['x'])**2+(p[1]-other['y'])**2;inside=q<=other['r']**2;outside=q>=other['r']**2
            include=inside if mask==3 else (outside if owner==0 else inside) if mask==1 else (outside if owner==1 else inside)
            if include:extrema.append(p)
    require(extrema,'actual source extrema candidates')
    return area*depth,{'min':[min(p[0] for p in extrema),min(p[1] for p in extrema),0],'max':[max(p[0] for p in extrema),max(p[1] for p in extrema),depth]}

def material(cs,mask,depth,p):
    bits=sum((1<<i) for i,c in enumerate(cs) if (p[0]-c['x'])**2+(p[1]-c['y'])**2<c['r']**2)
    return 'inside' if 0<p[2]<depth and bits==mask else 'outside'
def semantic_mask(descriptor,ids,cs):
    if descriptor.get('kind')=='two-circle-arrangement-cell':
        require(descriptor['version']==3 and descriptor['sourceCircleIds']==sorted(ids),'two actual complete source owners')
        mask=sum(1<<i for i,identity in enumerate(ids) if identity in descriptor['coveringCircleIds'])
        for loop in [descriptor['outerBoundaryRefs']]+descriptor['holeBoundaryRefs']:
            for use in loop:
                require(use['orientation'] in ('FORWARD','REVERSED'),'explicit directed wire use')
                ref=use['boundaryRef'];span=ref['sourceSpan'];require(span['kind']=='circle-source-span' and set(span['owners'])<=set(ids),'actual source span owners')
                digest=hashlib.sha256(b'ACAD/circle-source-span/1\n'+arc.canonical(span)).hexdigest()
                require(ref['id']=='source-circle-span:1:'+digest,'independently hashed semantic source-event interval')
                require(span['range'] in ('full','inside-other','outside-other'),'finite actual source interval meaning')
                if span['range']=='full':require(not span['ends'],'full circle has no invented crossing')
                else:require([e['branch'] for e in span['ends']]==['left','right'] and all(e['sourceCircleIds']==sorted(ids) for e in span['ends']),'actual oriented two-source events')
        if descriptor['relation']=='coincident':
            refs=[u['boundaryRef']['sourceSpan'] for u in descriptor['outerBoundaryRefs']]
            require(len(refs)==1 and refs[0]['owners']==sorted(ids),'coincident boundary retains both authored owners')
        return mask
    outer=descriptor['outerCurveIds'];holes=descriptor['holeCurveIds'];require(len(outer)==1 and outer[0] in ids,'retained whole-circle outer source')
    index=ids.index(outer[0]);other=1-index
    if holes:require(holes==[[ids[other]]],'retained nested whole-circle hole');return 1<<index
    c,o=cs[index],cs[other]
    return 3 if math.hypot(c['x']-o['x'],c['y']-o['y'])+c['r']<=o['r'] and c['r']<o['r'] else 1<<index

def check_definition(case,model,raws,profiles,revision):
    cs=circles(raws[case['faceId']],case['ids']);f=case['fixture']
    require([[c['x'],c['y']] for c in cs]==f['centers'],'source centers unchanged across diameter/depth/repair/travel/Open')
    require(cs[1]['r']==f['radii'][1],'unrelated Circle B geometry unchanged exactly')
    all_ids=[int(row['params']['featureId']) for row in model['history']]
    require(len(all_ids)==len(set(all_ids)),'unique canonical feature producers')
    for p in profiles:
        op=one([o for o in model['history'] if int(o['params']['featureId'])==p['featureId']],'exact persisted authored selected feature')
        q=op['params'];require(op['type']=='WORKER_SELECTED_PROFILE_EXTRUDE_V2' and set(q)=={'version','unit','engine','engineRevision','featureId','faceId','regionId','depth','bodyPolicy'},'unchanged nine-field semantic feature schema')
        require(q['version']==1 and q['unit']=='millimeter' and q['engine']=='occ' and q['engineRevision']==revision and q['bodyPolicy']=='separate','one exact selected runtime and separate-body intent')
        require(q['faceId']==case['faceId'] and q['regionId']==p['regionId'] and q['depth']==p['depth'],'actual source/opaque region/depth retained')
        descriptor=case['regionDescriptors'][q['regionId']];require(semantic_mask(descriptor,case['ids'],cs)==p['mask'],'mask corroborated by actual public descriptor, never producer expected quantities')
    return cs

def run(directory):
    directory=Path(directory);r=json.loads((directory/'receipt.json').read_text());require(r['status']=='PASS','whole driver terminal PASS required');require(r['sourceUnchanged'] and r['ownedContextsClosed'] and r['sharedBrowserDisconnectedOnly'],'source/own-context custody')
    require([c['fixture']['id'] for c in r['cases']]==['lens','left-crescent','right-crescent','tangent','coincident','nested','disjoint','represented-boundaries','unsupported-global'],'all finite cases, no silent fixture omission')
    cases={c['fixture']['id']:c for c in r['cases']};saved=[];queries=0
    for row in r['observations']:
        require(row['before']==row['after'],'observation is exact read-only')
        case=cases[row['case']];n=row['before']['capture']['native'];model={'history':n['history']};cs=check_definition(case,model,{s['id']:s['source'] for s in n['sketches']},row['profiles'],r['engineRevision'])
        resources=row['before']['ownership']['resources'];require(not resources['cleanupFailed'] and resources['candidates']==resources['accepted']==resources['mounts']==0,'settled observation ownership')
        for observed in row['queries']:
            p=one([p for p in row['profiles'] if p['featureId']==observed['featureId']],'actual observation producer');body=one([b for b in row['before']['capture']['solids']['bodies'] if b['featureId']==p['featureId']],'actual Native result');m=body['metrics'];volume,bounds=truth(cs,p['mask'],p['depth'])
            require(m['nativeValidity']['valid'] and m['solidCount']==1 and m['resultKind']=='single-solid','valid positive Native single solid');require('sha256:'+m['runtime']['jsSha256']+':'+m['runtime']['wasmSha256']==r['engineRevision'],'exact compiled Native pair')
            close(m['nativeVolume'],volume)
            for k in ('min','max'):
                for actual,expected in zip(m['nativeBounds'][k],bounds[k]):close(actual,expected)
            q=observed['query'];require(q['bodyId']==body['id'] and q['featureId']==p['featureId'] and q['quality']=='native-re-evaluation-observation','actual authenticated point read')
            for sample in q['points']:require(sample['classification']==material(cs,p['mask'],p['depth'],sample['point']),'independent original circle/prism equations at actual Native query');queries+=1
    for row in r['saves']:
        info=arc.read_archive(directory/row['savedFile']);require(info['sha256']==row['sha256'] and info['bytes']==row['bytes'],'actual own server-verified archive bytes')
        project=info['envelope']['project'];native=row['before']['capture']['native'];require(project['model']['history']==native['history'] and project['model']['counters']==native['counters'],'exact persisted authored chronology/high-water')
        require({s['id']:s['data'] for s in project['sketches']}=={s['id']:json.loads(s['source']) for s in native['sketches']},'exact complete persisted source inventory')
        require(info['envelope'].get('presentation')==native['presentation'],'display units remain presentation metadata')
        check_definition(cases[row['case']],project['model'],info['rawSketches'],row['profiles'],r['engineRevision']);saved.append({'file':row['savedFile'],'sha256':info['sha256'],'entries':len(info['manifest']['entries'])})
    require(len(saved)==15,'three main lifecycle plus two per remaining six fixtures')
    require(queries>40,'actual finite Native points, no empty observation proof')
    require(any(row['label']=='Lost lens source edit refuses without retarget' and row['error']['code']=='STALE_REGION' for row in r['refusals']),'explicit lost-region refusal')
    require([b['fixture']['relation'] for b in r['boundaries']]==['disjoint','disjoint','disjoint','proper-overlap'],'frozen represented boundary source cases')
    for b in r['boundaries']:
        a,c=b['source'];dx=c['center'][0]-a['center'][0];require(dx==b['fixture']['distance'],'exact retained represented source distance')
        expected='disjoint' if dx>a['radius']+c['radius'] else 'proper-overlap';require(expected==b['fixture']['relation'],'independent finite represented relation')
    return {'status':'PASS','scope':'Independent actual ZIP32 CRC/SHA/source IDs/semantic span hashes/lens areas/extrema and Native material queries; not a new Native run or tiny-cell qualification','saved':saved,'actualClassifications':queries}
if __name__=='__main__':
    try:print(json.dumps(run(sys.argv[1]),indent=2))
    except Exception as error:print(json.dumps({'status':'FAIL','error':str(error)}));raise
