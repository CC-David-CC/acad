#!/usr/bin/env python3
"""Independent saved-source/analytic oracle; run only after the ENTIRE workflow.
No production encoder, solver, topology provider or expected-metrics helper.
"""
import hashlib, importlib.util, itertools, json, math, sys
from pathlib import Path

def need(ok,message):
    if not ok:raise ValueError(message)
def near(a,b,t=5e-8):need(isinstance(a,(int,float)) and not isinstance(a,bool) and math.isfinite(a) and abs(a-b)<=t,f'{a} != {b}')
def one(rows,label):need(len(rows)==1,label);return rows[0]
def local(text):
    value=json.loads(text) if isinstance(text,str) else json.loads(json.dumps(text));value['metadata']['boundaryFrame']=None;return value

def basis(p):
    d=p['depth'];need(isinstance(d,(int,float)) and math.isfinite(d) and abs(d)<=1e8,'canonical numeric signed depth')
    if p['orientation']=='XY':return [0,0,d],[[1,0,0],[0,1,0],[0,0,1]]
    if p['orientation']=='XZ':return [0,d,0],[[-1,0,0],[0,0,1],[0,1,0]]
    need(p['orientation']=='ZY','principal orientation');return [d,0,0],[[0,0,-1],[0,1,0],[1,0,0]]
def world(point,p):
    o,axes=basis(p);return [o[i]+sum(axes[k][i]*point[k] for k in range(3)) for i in range(3)]
def unworld(point,p):
    o,axes=basis(p);return [sum(axis[i]*(point[i]-o[i]) for i in range(3)) for axis in axes]
def bounds(low,high,p):
    corners=[world(q,p) for q in itertools.product(*zip(low,high))];return {'min':[min(q[i] for q in corners) for i in range(3)],'max':[max(q[i] for q in corners) for i in range(3)]}
def frame(actual,p,z=0):
    origin,axes=basis(p);expected={'origin':world([0,0,z],p),'x':axes[0],'y':axes[1],'z':axes[2]};need(set(actual)==set(expected),'frame fields')
    for key in expected:
        for a,b in zip(actual[key],expected[key]):near(a,b,5e-8 if key=='origin' else 1e-12)
def source_truth(native,b,build,has_child):
    history=native['history'];plane=history[b['index']];p=plane['params'];need(plane['type']=='PLANE' and set(p)=={'featureId','orientation','datum','depth'} and int(p['featureId'])==b['featureId'] and p['datum'] is None,'actual principal saved identity')
    sources={s['id']:json.loads(s['source']) for s in native['sketches']};s=sources[b['faceId']];objects=s['objects'];need(len(objects)==4 and all(o['type']=='Segment' and o['role'] is None and o['stage']==0 for o in objects),'actual four authored segments')
    edges=[o['data'] for o in objects];expected=[((0,0),(10,0)),((10,0),(10,6)),((10,6),(0,6)),((0,6),(0,0))]
    for edge,(aa,bb) in zip(edges,expected):
        need(set(edge)=={'a','b'},'segment data')
        for key,point in [('a',aa),('b',bb)]:near(edge[key]['x'],point[0]);near(edge[key]['y'],point[1])
    need(len(s['stages'])==1 and len(s['stages'][0]['constraints'])==11 and not s['stages'][0]['generators'],'original dimensioned rectangle intent')
    profile=one([e for e in history if e['type']=='WORKER_SELECTED_PROFILE_EXTRUDE_V2' and e['params']['featureId']==b['profile']['featureId']],'actual original selected feature')['params'];need(len(profile)==9 and profile['faceId']==b['faceId'] and profile['engineRevision']==build and profile['engine']=='occ' and profile['depth']==4 and profile['bodyPolicy']=='separate','real selected profile contract')
    hole=one([e for e in history if e['type']=='WORKER_THROUGH_HOLES_V1' and e['params']['featureId']==b['hole']['featureId']],'actual semantic hole')['params'];need(len(hole)==12 and hole['target']==b['profile']['outputId'] and hole['producerFeatureId']==b['profile']['featureId'] and hole['sourceFeatureId']==b['profile']['featureId'] and hole['sourceFaceId']==b['faceId'] and hole['sourceRegionId']==profile['regionId'] and hole['kind']=='centered-through' and hole['diameter']==2 and hole['engineRevision']==build,'real source-bound hole intent')
    frame(s['metadata']['boundaryFrame'],p)
    for identity,value in sources.items():need(local(value)==b['locals'][identity],'unchanged original local source/constraints/IDs/rulers')
    need(next(v['source'] for v in native['sketches'] if v['id']==b['unrelated']['faceId'])==b['unrelatedBytes'],'unrelated exact source bytes')
    other=sources[b['unrelated']['faceId']];point=one(other['objects'],'actual unrelated Point');need(point['type']=='Point' and point['id']==b['unrelatedPointId'] and point['data']=={'x':100,'y':100},'actual unrelated Point identity')
    result={'pose':{'orientation':p['orientation'],'depth':p['depth']},'main':{'volume':240-4*math.pi,'bounds':bounds([0,0,0],[10,6,4],p)}}
    if has_child:
        sf=one([e for e in history if e['type']=='SOURCE_FRAME_V1' and e['params']['featureId']==b['attached']['featureId']],'actual Native-bound child source')['params'];need(set(sf)=={'version','unit','featureId','parent','placement'} and sf['version']==1 and sf['unit']=='millimeter','exact child source intent');parent=sf['parent'];need(parent['kind']=='native-planar-face' and parent['bodyId']==b['hole']['outputId'] and parent['featureId']==b['hole']['featureId'] and parent['originFeatureId']==parent['sourceFeatureId']==b['profile']['featureId'] and parent['sourceFaceId']==b['faceId'] and parent['sourceRegionId']==profile['regionId'] and parent['engineRevision']==build and parent['framePolicy']=='extrusion-cap-source-datum-v1','actual causal Native parent')
        child=sources[b['attached']['faceId']];circle=one(child['objects'],'actual child circle');need(circle['type']=='Circle' and circle['id']==b['childCircle']['primitive']['id'] and circle['data']=={'c':{'x':2,'y':2},'r':0.5},'actual child authored circle');frame(child['metadata']['boundaryFrame'],p,4)
        ext=one([e for e in history if e['type']=='WORKER_SELECTED_PROFILE_EXTRUDE_V2' and e['params']['featureId']==b['child']['featureId']],'actual child extrusion')['params'];need(ext['faceId']==b['attached']['faceId'] and ext['depth']==1 and ext['engineRevision']==build and ext['bodyPolicy']=='separate','child real source/build')
        result['child']={'volume':math.pi/4,'bounds':bounds([1.5,1.5,4],[2.5,2.5,5],p)}
    return result

def clean(s):
    r=s['ownership']['resources'];need(not s['ownership']['processing'] and not r['cleanupFailed'] and all(r[k]==0 for k in ('candidates','accepted','mounts')) and r['owners']==r['detached']<=3,'retired Native owner/mounts')
def classify(point,pose,child=False):
    # This fixture uses exact binary halves/integers in principal bases, not a
    # general near-boundary classifier or universal Native-tolerance policy.
    x,y,z=unworld(point,pose)
    if child:
        radial=(x-2)**2+(y-2)**2
        if z<4 or z>5 or radial>0.25:return 'outside'
        return 'boundary' if z in (4,5) or radial==0.25 else 'inside'
    radial=(x-5)**2+(y-3)**2
    if x<0 or x>10 or y<0 or y>6 or z<0 or z>4 or radial<1:return 'outside'
    return 'boundary' if x in (0,10) or y in (0,6) or z in (0,4) or radial==1 else 'inside'
def observation(row,b,build):
    s=row['before'];need(row['after']==s,'raw same-document read-only state/revisions/tokens');truth=source_truth(s['capture']['native'],b,build,row['hasChild']);need(truth['pose']==row['pose'],'actual source-derived pose');clean(s);bodies=s['capture']['solids']['bodies'];need(len(bodies)==(2 if row['hasChild'] else 1),'actual output count')
    for name,receipt in [('main',b['hole'])]+([('child',b['child'])] if row['hasChild'] else []):
        body=one([r for r in bodies if r['featureId']==receipt['featureId']],'exact actual Native producer');need(body['id']==receipt['outputId'],'returned body identity');m=body['metrics'];need(m['nativeValidity']['valid'] is True and m['solidCount']==1 and m['resultKind']=='single-solid','valid one Native solid');need('sha256:'+m['runtime']['jsSha256']+':'+m['runtime']['wasmSha256']==build,'exact Native runtime');near(m['nativeVolume'],truth[name]['volume'],1e-6)
        for key in ('min','max'):
            for actual,expected in zip(m['nativeBounds'][key],truth[name]['bounds'][key]):near(actual,expected)
        q=one([q for q in row['queries'] if q['bodyId']==body['id']],'genuine Native classifier');reply=q['result'];need(reply['quality']=='native-re-evaluation-observation' and reply['revision']==s['capture']['solids']['revision'] and reply['bodyId']==body['id'] and reply['featureId']==body['featureId'] and reply['engineRevision']==build and reply['engine']=='occ' and reply['unit']=='millimeter','current Native query binding');expected=[classify(p,truth['pose'],name=='child') for p in q['points']];need(reply['points']==[{'point':p,'classification':c} for p,c in zip(q['points'],expected)],'independent analytic material/void/boundary classification')
def ui_content(state):
    s=json.loads(json.dumps(state));s['view'].pop('wizard');s['capture']['solids'].pop('revision');s['capture']['journal'].pop('revision');s['host'].pop('revision');return s

def main(folder):
    r=json.loads((folder/'receipt.json').read_text());b=r['binding'];need(r['status']=='PASS','run ENTIRE workflow before oracle');need(r['sourcePins']==r['sourcePinsAfter'] and r['ownedContextClosed'] and r['sharedBrowserDisconnectedOnly'],'source freeze/owned cleanup');need(all(r[k] is False for k in ('privateAuthoring','sourceSeeds','fakeUI')),'genuine public authoring and real UI')
    expected=['Real PLANE depth Apply XY5','Real PLANE orientation and depth Apply XZ7','Real PLANE negative depth and orientation Apply ZY-3','Real no-op draft Apply finishes at tip','Healthy correction after actual draft refusal','Native child complete closure real Apply XZ3'];need([q['label'] for q in r['applications']]==expected,'all required real OK paths')
    for row in r['applications']:
        before,after=row['before'],row['after'];need(before['view']['pointer']==b['index']-1 and after['view']['pointer']==len(after['capture']['native']['history'])-1,'one prefix-to-tip Apply');need(row['drafted']['capture']['native']==before['capture']['native'],'draft is not accepted source/history/geometry');entry=row['entry'];need(entry['kind']==('history-position' if row['noOp'] else 'source-frame'),'single proper authored event')
        if row['noOp']:need(before['capture']['native']==after['capture']['native'],'position-only no-op preserves exact source bytes')
        old,new=before['capture']['native'],after['capture']['native'];need(old['counters']==new['counters'] and old['expressions']==new['expressions'] and old['presentation']==new['presentation'] and old['materialRevision']==new['materialRevision'],'unrelated state/IDs preserved');need(len(old['history'])==len(new['history']),'no substituted feature')
        for i,(a,c) in enumerate(zip(old['history'],new['history'])):
            if i==b['index']:need(a['type']==c['type']=='PLANE' and all(a['params'][k]==c['params'][k] for k in ('featureId','datum')),'only requested principal placement')
            else:need(a==c,'full suffix authored intent exact')
        if not row['noOp']:
            p=entry['reviewPosition'];need(p['beforePointer']==b['index']-1 and p['afterPointer']==after['view']['pointer'] and json.loads(p['beforeSignature'])==old['history'] and json.loads(p['afterSignature'])==new['history'],'actual reviewed operation/head signatures');j=after['view']['journalData'];prior=j['entries'][j['cursor']-2];need(prior['kind']=='history-position' and prior['afterSignature']==p['beforeSignature'],'one existing journal chronology')
        for event in row['trace']:
            if event['pointer']==after['view']['pointer']:need(event['parameters']['orientation']==row['next']['orientation'] and event['parameters']['depth']==row['next']['depth'],'no accepted temporary old tip')
            else:need(event['pointer']==b['index']-1,'no accepted temporary pointer')
    need(len(r['travels'])==18,'D/P real UI UndoRedo and no-op position travel')
    for row in r['travels']:
        s=row['after'];need(s['view']['pointer']==row['pointer'] and not s['view']['wizard']['active'],'actual passive travel target');need(s['capture']['native']['counters']==row['before']['capture']['native']['counters'],'travel preserves high-water');p=s['capture']['native']['history'][b['index']]['params'];need(p['depth']==row['expected']['depth'] and p['orientation']==row['expected']['orientation'],'actual travel restores recorded principal intent')
        if row['pointer']==-1:need(s['capture']['solids']['bodies']==[],'actual prefix projection, no filtered/fabricated final body')
    need([q['invalid'] for q in r['nativeCancels']]==[False,True],'ordinary and invalid Native-graph Cancel')
    for row in r['nativeCancels']:
        before,draft,cancelled=row['before'],row['drafted'],row['cancelled'];need(draft['view']['wizard']['active'] and ui_content(draft)==ui_content(before),'genuine separate draft');need(cancelled['view']['pointer']==-1 and not cancelled['view']['wizard']['active'] and ui_content(cancelled)==ui_content(before) and cancelled['view']['wizard']['request']['params']==before['view']['wizard']['request']['params'],'Cancel only discards draft at same prefix');need(row['restored']['view']['pointer']==len(row['restored']['capture']['native']['history'])-1,'registered Undo recovers full tip')
    for row in r['observations']:observation(row,b,r['build'])
    need(len(r['refusals'])==8,'six active-draft refusals plus real UI-domain and stale identity refusals')
    for row in r['refusals']:
        need(row['error']['code'] in ('UNAVAILABLE','INVALID_REQUEST','STALE_HISTORY'),'specific source-owned refusal')
        if row['error']['code']=='INVALID_REQUEST':
            before,after=row['before'],row['after'];need(ui_content(before)==ui_content(after) and before['view']['wizard']['request']['params']==after['view']['wizard']['request']['params'] and after['view']['wizard']['active'] and after['view']['wizard']['state']['error']['code']=='INVALID_REQUEST','retained draft and visible actual error')
        else:need(row['before']==row['after'] and not row['error']['committed'] and not row['error']['possiblyCommitted'],'exact rejected accepted state')
    labels=['xy5-depth','xy-negative-after-recovery','native-child-xz3','native-child-zy-negative-reedited'];need([s['label'] for s in r['saves']]==labels,'four complete native Save/sync/Open cycles')
    spec=importlib.util.spec_from_file_location('independent_archive',Path(__file__).resolve().parents[1]/'native-cad-container'/'archive_oracle.py');archive=importlib.util.module_from_spec(spec);spec.loader.exec_module(archive)
    for row in r['saves']:
        file=folder/row['savedFile'];raw=file.read_bytes();need(len(raw)==row['bytes'] and hashlib.sha256(raw).hexdigest()==row['sha256'],'browser/server actual bytes');info=archive.read_archive(file);native=row['before']['capture']['native'];model=info['envelope']['project']['model'];need(all(model[k]==native[k] for k in ('history','counters','expressions')),'independent native authored graph/IDs');need(info['rawSketches']=={s['id']:s['source'] for s in native['sketches']},'independent exact source bytes');need(row['after']['capture']==row['before']['capture'],'Save retains canonical/authoritative state');source_truth(native,b,r['build'],row['hasChild']);opened=row['opened'];need(not opened['capture']['journal']['canUndo'],'fresh native Open resets session Undo');need(all(opened['capture']['native'][k]==native[k] for k in ('history','source','expressions','counters','sketches','presentation')),'fresh Open canonical source/IDs/frame persistence')
    result={'status':'PASS','scope':'finite numeric principal Apply, D/P UI travel, Native-child closure and .cad persistence; broader C12 remains open','applications':len(r['applications']),'uiTravels':len(r['travels']),'nativeObservations':len(r['observations']),'nativePoints':sum(len(q['points']) for o in r['observations'] for q in o['queries']),'savedArchives':4,'sourcePins':r['sourcePins']};(folder/'independent-check.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
if __name__=='__main__':
    if len(sys.argv)!=2:raise SystemExit('usage: check.py EVIDENCE_AFTER_WHOLE_PASS')
    main(Path(sys.argv[1]).resolve())
