#!/usr/bin/env python3
"""Run once AFTER the whole real public workflow; standard library only.
make-bad-state prepares own negative derivatives within that same workflow.
No production validator/kernel or successful source seed is imported.
"""
import argparse,binascii,copy,hashlib,json,math,re,sys,zlib
from pathlib import Path
from xml.etree import ElementTree as ET
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'native-cad-container'))
from archive_oracle import read_archive,structure,rebuild,manifest_row,canonical,root_record
def require(ok,text):
    if not ok:raise ValueError(text)
def one(rows,text):require(len(rows)==1,text);return rows[0]
def near(a,b):require(type(a) in (int,float) and math.isfinite(a) and abs(a-b)<=1e-6,f'{a} != {b}')
def vector(a,b):require(len(a)==len(b),'vector length');[near(x,y) for x,y in zip(a,b)]
sha=lambda b:hashlib.sha256(b).hexdigest()
def identity(value):
    if type(value) is str:require(re.fullmatch('[1-9][0-9]*',value) and str(int(value))==value,'canonical feature string');value=int(value)
    require(type(value) is int and 0<value<=9007199254740991,'positive safe authored identity');return value
def durable(value):
    v=copy.deepcopy(value)
    for row,key in [(v['controls'],'revision'),(v['controls'],'geometryRevision'),(v['capture']['solids'],'revision'),(v['capture']['journal'],'revision'),(v['metadata'],'documentRevision')]:row.pop(key,None)
    v.pop('ownership',None);return v
def source_rectangle(project,binding):
    source=one([r['data'] for r in project['sketches'] if r['id']==binding['faceId']],'one actual rectangle source')
    require(len(project['sketches'])==1 and len(source['objects'])==4,'one source/four original edges')
    require(source['metadata']['boundaryFrame']=={'origin':[0,0,0],'x':[1,0,0],'y':[0,1,0],'z':[0,0,1]},'actual source datum frame')
    points=[];seen=set();actual_edges=[]
    for row in source['objects']:
        require(row['type']=='Segment' and row['id'] not in seen,'distinct actual source segments');seen.add(row['id'])
        a,b=[tuple(row['data'][end][axis] for axis in ('x','y')) for end in ('a','b')];require(a!=b,'nonzero source edge');points.extend((a,b));actual_edges.append((a,b));require(abs(a[0]-b[0])<=1e-9 or abs(a[1]-b[1])<=1e-9,'ordinary axis aligned source')
    corners=[(0,0),(100,0),(100,50),(0,50)]
    def corner(point):return one([i for i,c in enumerate(corners) if math.dist(point,c)<=1e-9],'one known source corner within existing replay geometry bound')
    memberships=[corner(point) for point in points];require(all(memberships.count(i)==2 for i in range(4)),'four known source corners')
    edges={tuple(sorted((corner(a),corner(b)))) for a,b in actual_edges};require(edges=={(0,1),(1,2),(2,3),(0,3)},'independent four-edge rectangle, no duplicated or diagonal edges');return source
def derive(model,binding,engine,pointer=None):
    history=model['history'];require(0<len(history)<=256 and model['expressions']=='','finite numeric source')
    ids=[identity(op['params']['featureId']) for op in history];require(len(ids)==len(set(ids)),'global authored identity uniqueness')
    suppressed=[op for op in history if 'suppressed' in op];require(all(op['suppressed'] is True for op in suppressed),'canonical suppression true/omitted')
    require((type(model.get('historyStateVersion')) is int and model['historyStateVersion']==1) if suppressed else 'historyStateVersion' not in model,'derived-required marker')
    live={};known={};limit=len(history)-1 if pointer is None else pointer;require(-1<=limit<len(history),'history pointer')
    for index,op in enumerate(history):
        require(set(op)==({'type','params','suppressed'} if 'suppressed' in op else {'type','params'}),'exact authored operation state')
        p=op['params'];fid=identity(p['featureId']);kind=op['type'];require(kind in ('PLANE','WORKER_SOLID_BOX_V1','WORKER_SELECTED_PROFILE_EXTRUDE_V2','WORKER_THROUGH_HOLES_V1','WORKER_SOLID_EDGE_TREATMENT_V1'),'finite source vocabulary')
        if kind=='PLANE':require(p['orientation']=='XY' and type(p['depth']) in (int,float) and p['depth']==0 and p['datum'] is None,'unchanged principal source plane')
        else:require(p['engine']=='occ' and p['engineRevision']==engine and p['unit']=='millimeter' and type(p['version']) is int and p['version']==1,'exact backend/unit contract')
        if kind=='WORKER_SELECTED_PROFILE_EXTRUDE_V2':require(fid==binding['profile']['featureId'] and p['faceId']==binding['faceId'] and p['regionId']==binding['regionId'] and p['depth']==20 and p['bodyPolicy']=='separate','actual original selected source')
        if kind=='WORKER_SOLID_BOX_V1':require(fid==binding['box']['featureId'] and [p[k] for k in ('x','y','z','width','depth','height')]==[200,0,0,30,20,10],'unrelated box dimensions/origin')
        if kind=='WORKER_THROUGH_HOLES_V1':require(p['producerFeatureId'] in known and p['sourceFeatureId']==binding['profile']['featureId'] and p['sourceFaceId']==binding['faceId'] and p['sourceRegionId']==binding['regionId'] and p['kind']=='centered-through' and type(p['diameter']) in (int,float) and p['diameter']>0,'actual ordered hole binding')
        if kind=='WORKER_SOLID_EDGE_TREATMENT_V1':require(p['producerFeatureId'] in known and p['kind']=='fillet' and p['size']==3 and len(p['edgeIds'])==1,'actual one-edge R3 intent')
        known[fid]=op
        if index>limit or op.get('suppressed'):continue
        if kind=='WORKER_SELECTED_PROFILE_EXTRUDE_V2':live[fid]={'kind':'A','diameter':0,'radius':0,'volume':100000}
        elif kind=='WORKER_SOLID_BOX_V1':live[fid]={'kind':'B','volume':6000}
        elif kind in ('WORKER_THROUGH_HOLES_V1','WORKER_SOLID_EDGE_TREATMENT_V1'):
            parent=live.pop(p['producerFeatureId'],None);require(parent and parent['kind']=='A','actual active parent, never auto-retarget');value=copy.deepcopy(parent)
            if kind=='WORKER_THROUGH_HOLES_V1':require(value['diameter']==0,'one independent hole');value['diameter']=p['diameter'];value['volume']-=math.pi*(p['diameter']/2)**2*20
            else:value['radius']=3;value['volume']-=(9-9*math.pi/4)*20
            live[fid]=value
    require(type(model['counters']['featureId']) is int and model['counters']['featureId']>=max(ids),'counter high-water covers all authored IDs');return live
def native_observation(row,r):
    before,after=row['before'],row['after'];require(before==after,'native reads preserve exact accepted state/resources');model=before['metadata']['model'];require(model['history']==before['capture']['native']['history'],'one actual graph')
    live=derive(model,r['binding'],r['engineRevision'],before['metadata']['pointer']);bodies=before['capture']['solids']['bodies'];require(len(live)==len(bodies)==2 and {b['featureId'] for b in bodies}==set(live),'two genuine current outputs; no future aliases')
    for body in bodies:
        truth=live[body['featureId']];m=body['metrics'];near(m['nativeVolume'],truth['volume']);require(m['nativeValidity']['valid'] is True and type(m['solidCount']) is int and m['solidCount']==1 and m['resultKind']=='single-solid','actual native result evidence');require('sha256:'+m['runtime']['jsSha256']+':'+m['runtime']['wasmSha256']==r['engineRevision'],'native pair')
        vector(m['nativeBounds']['min'],[0,0,0] if truth['kind']=='A' else [200,0,0]);vector(m['nativeBounds']['max'],[100,50,20] if truth['kind']=='A' else [230,20,10])
    queries=row['queries'];prefix=before['metadata']['pointer']<len(model['history'])-1;include_box=row['label'] in ('Initial real centered hole and unrelated box','Healthy continuation after malformed own state Open');require(len(queries)==(0 if prefix else 2 if include_box else 1),'actual bounded native query roster; no fake prefix queries')
    for query in queries:
        require(query['quality']=='native-re-evaluation-observation' and query['engineRevision']==r['engineRevision'],'genuine bounded read receipt');truth=live[query['featureId']]
        expected=([[50,25,10],[20,25,10],[101,25,10],[50,25,21]],['outside' if truth['diameter'] else 'inside','inside','outside','outside']) if truth['kind']=='A' else ([[215,10,5],[235,10,5]],['inside','outside'])
        require([p['point'] for p in query['points']]==expected[0] and [p['classification'] for p in query['points']]==expected[1],'independent material/void observations')
    resources=after['ownership']['resources'];require(not after['ownership']['processing'] and all(resources[k]==0 for k in ('candidates','accepted','mounts')) and not resources['cleanupFailed'],'settled read resources');return bodies
def make_bad_state(source,destination):
    source=Path(source);dest=Path(destination);dest.mkdir(parents=True,exist_ok=False);original=read_archive(source);require(original['envelope']['project']['model'].get('historyStateVersion')==1,'own genuine suppressed source required');output=[]
    for kind in ('false-state','marker-version'):
        rows=structure(source.read_bytes());manifest=copy.deepcopy(original['manifest']);model=copy.deepcopy(original['envelope']['project']['model'])
        if kind=='false-state':next(op for op in model['history'] if op.get('suppressed'))['suppressed']=False
        else:model['historyStateVersion']=2
        body=canonical(model);codec=zlib.compressobj(6,zlib.DEFLATED,-15);compressed=codec.compress(body)+codec.flush();entry=one([e for e in manifest['entries'] if e['role']=='model'],'model descriptor');entry['bytes']=len(body);entry['sha256']=sha(body);manifest['designRevision']=sha(canonical(root_record(manifest)))
        for i,row in enumerate(rows):
            if row['path']=='authored/model.json':rows[i]={'path':row['path'],'method':8,'crc':binascii.crc32(body)&0xffffffff,'bytes':len(body),'compressed':compressed}
        rows[-1]=manifest_row(manifest);file=dest/(kind+'.cad');file.write_bytes(rebuild(rows));output.append({'kind':kind,'file':str(file.resolve()),'sourceSha256':original['sha256'],'expectedCode':'INVALID_HISTORY_STATE'})
    return output
def main():
    p=argparse.ArgumentParser();p.add_argument('evidence',type=Path);args=p.parse_args();folder=args.evidence.resolve();r=json.loads((folder/'receipt.json').read_text());require(r['status']=='PASS' and r['ownedContextClosed'] and r['sharedBrowserDisconnectedOnly'],'whole workflow and owned cleanup');require(r['sourcePins']==r['sourcePinsAfter'],'frozen source');require(not r['privateAuthoring'] and not r['sourceSeeds'] and not r['syntheticNative'],'no simulated successful geometry')
    require({row['originalFile']:row['sha256'] for row in r['sourceSnapshots']}==r['sourcePins'],'complete captured source roster')
    for row in r['sourceSnapshots']:require(sha((folder/row['file']).read_bytes())==row['sha256'],'frozen reviewed source copy')
    bodies=[native_observation(row,r) for row in r['observations']];require(len(bodies)>=20,'complete material/travel/read chain')
    source0=r['observations'][0]['before']['capture']['native']['sketches'];b0=one([b['metrics'] for b in bodies[0] if b['featureId']==r['binding']['box']['featureId']],'unrelated B')
    for row,group in zip(r['observations'],bodies):require(row['before']['capture']['native']['sketches']==source0,'exact unchanged source sketch text');require(one([b['metrics'] for b in group if b['featureId']==r['binding']['box']['featureId']],'B measurement')==b0,'unrelated exact native facts')
    # Runtime output IDs and saved manufacturing IDs are distinct opaque domains.
    # Bind the public assignment request to its actual discovered producer, then
    # retain the accepted manufacturing binding from BEFORE history changes.
    box=r['binding']['box'];assignment=one([row for row in r['commandTrace'] if row['command']=='assign-printable-parts' and row.get('outcome')=='accepted' and len(row['args']['parts'])==1],'original public box assignment')
    part=one(assignment['args']['parts'],'one assigned box');requested=one(part['regions'],'one requested box region')
    require(part['id']=='box' and requested['featureId']==box['featureId'] and requested['bodyId']==box['outputId'] and requested['materialId']=='pla' and requested['appearanceId']=='blue','actual runtime producer selected by public assignment')
    assigned=one([row for row in r['refusals'] if row['label']=='Assigned producer cannot disappear'],'original material guard')['before']['metadata']['manufacturing']
    box_binding=one([row for row in assigned['bindings'] if row['featureId']==box['featureId']],'accepted original box binding')
    require(box_binding['operationType']=='WORKER_SOLID_BOX_V1' and type(box_binding['id']) is str and bool(box_binding['id']),'authentic named manufacturing producer')
    box_part=one([row for row in assigned['objects'] if row['id']==part['id']],'accepted original printable box');box_region=one(box_part['regions'],'one original printable region')
    require(box_region['bodyId']==box_binding['id'] and box_region['materialId']==requested['materialId'] and box_region['appearanceId']==requested['appearanceId'],'original manufacturing region/producer association')
    archives={};rosters={};require([row['label'] for row in r['nativeSaves']]==['suppressed','restored-original','branch','branch-reedited'],'four ordinary native saves')
    for row in r['nativeSaves']:
        raw=(folder/row['savedFile']).read_bytes();archive=read_archive(folder/row['savedFile']);require(sha(raw)==row['sha256'] and len(raw)==row['bytes'],'real server-synchronized native bytes')
        envelope=archive['envelope'];model=envelope['project']['model'];require(model==row['before']['metadata']['model'],'saved whole authored model, not display snapshot');source_rectangle(envelope['project'],r['binding']);derive(model,r['binding'],r['engineRevision']);require(archive['rawSketches']=={s['id']:s['source'] for s in source0},'exact persisted original raw source')
        require(envelope['drawings']==[r['drawing']],'same valid drawing intent even unresolved');require(envelope['manufacturing']==row['before']['metadata']['manufacturing'],'actual material source persists');metadata=envelope['manufacturing'];require(len(metadata['bindings'])==len(metadata['objects'])==1,'only unrelated assignment');binding=metadata['bindings'][0]
        require(binding==box_binding and metadata['objects'][0]==box_part,'exact original manufacturing binding/object, no material auto-retarget');require(metadata['materials']==assigned['materials'] and metadata['appearances']==assigned['appearances'],'retained material/appearance definitions')
        require(row['result']['committed'] and row['result']['archiveReuse']=='verified','normal verified native Save');archives[row['label']]=archive;rosters[row['label']]={identity(op['params']['featureId']):op for op in model['history']}
    require(len(r['edgeDiscoveries'])==2,'two actual public edge selection snapshots')
    for proof in r['edgeDiscoveries']:
        edges=[edge for edge in proof['plan']['edges'] if edge['role']=='connector' and edge['geometry']=='line' and edge['originFeatureId']==r['binding']['profile']['featureId']];require(len(edges)==4 and len({e['id'] for e in edges})==4,'four real original connector selections')
        operation=next(roster[proof['filletFeatureId']] for roster in rosters.values() if proof['filletFeatureId'] in roster)
        require(operation['params']['producerFeatureId']==proof['producerFeatureId'] and operation['params']['target']==proof['bodyId'] and len(operation['params']['edgeIds'])==1 and operation['params']['edgeIds'][0] in {e['id'] for e in edges},'saved fillet selection came from actual source discovery')
    old={r['binding']['hole']['featureId'],r['fillet']['featureId']};new={r['branchHole']['featureId'],r['branchFillet']['featureId']};require(old.isdisjoint(new) and min(new)>max(old),'fresh branch IDs/high-water');require(all(rosters['suppressed'][fid]['suppressed'] is True for fid in old),'persisted suppressed suffix');require(all('suppressed' not in rosters['restored-original'][fid] for fid in old),'restored original identities')
    for label in ('branch','branch-reedited'):require(old.isdisjoint(rosters[label]) and new<=set(rosters[label]),'discarded suffix absent from saved graph');require('historyStateVersion' not in archives[label]['envelope']['project']['model'],'canonical marker omitted when active')
    require(rosters['branch'][r['branchHole']['featureId']]['params']['diameter']==6 and rosters['branch-reedited'][r['branchHole']['featureId']]['params']['diameter']==8,'actual reopened branch reedit')
    restored=one([row['state'] for row in r['rows'] if row['label']=='Branch Undo restores exact suppressed suffix'],'recorded branch Undo');restored_ops={identity(op['params']['featureId']):op for op in restored['capture']['native']['history']};require(restored_ops[r['fillet']['featureId']]['suppressed'] is True and all(restored_ops[fid]['params']==rosters['restored-original'][fid]['params'] for fid in old),'exact suppressed suffix definitions restored')
    for row in r['refusals']:require(durable(row['before'])==durable(row['after']) and not row['failure']['committed'] and not row['failure']['possiblyCommitted'],'refusal preserves graph/J/sources/metadata')
    for label in ('Originating hole size failure','Downstream hole failure from base resize'):
        failure=one([row['failure'] for row in r['refusals'] if row['label']==label],'actual originating/downstream refusal');require(failure['code']=='HOLE_OUTSIDE_PROFILE' and any(c.get('originatingFeatureId')==r['binding']['hole']['featureId'] for c in failure['chain']),'actual failing child differs from requested base edit')
    resize=one([row for row in r['commandTrace'] if row['command']=='edit-rectangle-dimensions' and row['args'].get('width')==8],'real requested source resize');require(resize['args']['faceId']==r['binding']['faceId'] and resize['args']['height']==5 and resize['outcome']=='refused' and any(c.get('originatingFeatureId')==r['binding']['hole']['featureId'] for c in resize['failure']['chain']),'source edit versus downstream operation evidence')
    noop=one([row for row in r['rows'] if row['label']=='Exact suppression no-op'],'no-op');require(noop['result']['changed'] is False and noop['before']==noop['after'],'no-op preserves exact state/revisions/resources')
    ns={'s':'http://www.w3.org/2000/svg'};svgs=[];require([row['label'] for row in r['svgFiles']]==['available-before-suppression','unresolved-suppressed-target','unresolved-removed-target'],'drawing available/unresolved roster')
    for row in r['svgFiles']:
        raw=(folder/row['savedFile']).read_bytes();require(sha(raw)==row['sha256'] and len(raw)==row['bytes'],'actual SVG bytes');root=ET.fromstring(raw);require(root.attrib['width']=='420mm' and root.attrib['height']=='297mm','physical sheet size');meta=json.loads(root.find('s:metadata',ns).text);require(meta['drawingId']==r['drawing']['drawingId'] and meta['dimensionRole']=='reference','derived drawing role');texts=[''.join(t.itertext()) for t in root.findall('.//s:text',ns)];expected='available' if row['label']=='available-before-suppression' else 'unresolved';require(meta['status']==expected,'truthful target availability')
        if expected=='available':require(any(re.fullmatch(r'ΔX\s+100(?:\.0+)?\s+mm',t) for t in texts),'independent source-axis100mm dimension')
        else:require(any('UNRESOLVED: width' in t for t in texts) and not any(re.fullmatch(r'ΔX\s+[0-9.]+\s+mm',t) for t in texts),'no stale factual dimension')
        svgs.append({'label':row['label'],'sha256':row['sha256'],'status':meta['status']})
    require(len(r['malformed'])==2 and all(row['sourceSha256']==archives['suppressed']['sha256'] and sha((folder/row['file']).read_bytes())==row['sha256'] for row in r['malformed']),'own negative archive lineage')
    pinrows=[row for row in r['rows'] if row['label']=='Exact frozen composed runtime'];require(len(pinrows)==5,'initial plus four fresh signed Opens')
    for row in pinrows:require({v['name']:v['sha256'] for v in row['assets']}==r['pins']['files'] and row['outer']['sha256']==r['pins']['outer']['sha256'],'exact composed assets')
    print(json.dumps({'status':'PASS','scope':'Independent finite shared history/source/native quantities/material/derived SVG subset; no blanket C07/Native validity/10pm geometric precision/interchange/performance claim','nativeObservations':len(bodies),'nativeArchives':[{'label':k,'sha256':v['sha256'],'bytes':v['bytes']} for k,v in archives.items()],'svg':svgs,'refusals':len(r['refusals'])},indent=2))
if __name__=='__main__':
    if len(sys.argv)==4 and sys.argv[1]=='make-bad-state':print(json.dumps(make_bad_state(sys.argv[2],sys.argv[3])))
    else:main()
