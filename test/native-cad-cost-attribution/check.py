#!/usr/bin/env python3
"""Run ONCE after the complete real public workflow, not between source edits.
Independent ZIP/source/STEP/core3MF/SVG checks; no production validator/kernel.
"""
import argparse, hashlib, importlib.util, json, math, sys
from pathlib import Path
from urllib.parse import urlparse, unquote
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'native-cad-container'))
from archive_oracle import read_archive
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'typed-part-artifacts'))
def require(ok,text):
    if not ok:raise ValueError(text)
def one(rows,text):require(len(rows)==1,text);return rows[0]
sha=lambda b:hashlib.sha256(b).hexdigest()
def load_artifact_oracle():
    file=Path(__file__).resolve().parents[1]/'typed-part-artifacts/check.py'
    spec=importlib.util.spec_from_file_location('typed_artifact_oracle',file);module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);return module

def finite(value):return isinstance(value,(int,float)) and not isinstance(value,bool) and math.isfinite(value)
def check_observations(r,a):
    count=0;labels=[]
    for row in r['rows']:
        result=row.get('result',{})
        if result.get('quality')!='native-re-evaluation-observation':continue
        before,after=row['before'],row['after'];require(before==after,'actual Native observation is read-only')
        width=row['expected']['width'];truth=a.truth(width);b=one(before['capture']['solids']['bodies'],'actual observed final body');m=b['metrics']
        require((b['id'],b['featureId'])==(r['binding']['corners']['outputId'],r['binding']['corners']['featureId']),'observed final body/producer')
        require(m['nativeValidity']['valid'] is True and m['resultKind']=='single-solid' and m['solidCount']==1,'actual Native solid validity')
        require('sha256:'+m['runtime']['jsSha256']+':'+m['runtime']['wasmSha256']==r['engineRevision'],'observed exact Native pair')
        a.near(m['nativeVolume'],truth['volume']);a.vector(m['nativeBounds']['min'],truth['bounds']['min']);a.vector(m['nativeBounds']['max'],truth['bounds']['max'])
        require(before['physical']['definitions']==a.definitions(width),'actual observed authored formula definitions')
        points=[[width/2,width/4,width/10],[width*.08,width*.08,width/10],[width-width*.08,width/2-width*.08,width/10],[width*.3,width/4,width/10],[width+1,width/4,width/10]]
        require(row['points']==points and row['classes']==['outside','outside','outside','inside','outside'],'original independent five-point oracle inputs')
        require(result['revision']==before['capture']['solids']['revision'] and result['bodyId']==b['id'] and result['featureId']==b['featureId'] and result['engineRevision']==r['engineRevision'] and result['unit']=='millimeter','actual observed source/runtime binding')
        require(result['points']==[{'point':point,'classification':kind} for point,kind in zip(points,row['classes'])],'actual material/void/outside Native classes')
        resources=before['ownership']['resources'];require(before['ownership']['processing'] is False and resources['cleanupFailed'] is False and all(resources[k]==0 for k in ('accepted','candidates','mounts')) and resources['owners']==resources['detached']<=3,'Native observation logical ownership')
        count+=1;labels.append(row['label'])
    require(labels==[name+' raw' for name in ['Genuinely authored and bound part','Formula edit drives actual native geometry','Rejected exports add no undo entry; actual prior formula restored','Actual formula Redo after export refusals','Fresh native Open retains typed source material and drawing','Reopened formula reedit regenerates native part','Mixed review/formula Undo restores previous saved geometry','Mixed formula/review Redo restores new manufacturing state','Second fresh Open preserves reedited typed manufacturing document']],'complete ordered creation/edit/travel/fresh Open actual Native observations');return count

def cost_ledger(folder,r):
    summary=json.loads((folder/'cost-summary.json').read_text());require(summary==r['cost'],'cost summary bound to complete receipt')
    require(r['profileMode']==summary['profileMode'] and summary['profileMode'] in ('ordinary','private'),'explicit actual chosen profile')
    require(r['instrumentation']['noForcedGC'] is True and r['instrumentation']['cold'] is False,'instrumentation limitations retained')
    events=[]
    with (folder/'cost-events.ndjson').open() as stream:
        for number,line in enumerate(stream,1):
            require(number<=100000,'bounded event source');event=json.loads(line);require(event['seq']==number and finite(event['atMS']),'ordered finite observer ledger');events.append(event)
    require(len(events)==summary['eventCount'] and events[-1]['kind']=='observer-finished','closed observer event stream')
    process=[e for e in events if e['kind']=='process-sample'];main=[e for e in events if e['kind'] in ('main-scope','main-final-drain') and not e['observation'].get('unavailable')]
    heaps=[e for e in events if e['kind']=='v8-heap'];worker_capacities=[e for e in events if e['kind']=='native-capacity' and (e.get('value') or {}).get('available') is True]
    scope_urls={t['id']:t['url'] for t in summary['targets']};has_pinned_bootstrap=any(Path(urlparse(name).path).name=='oci-verified-worker.js' for name in r['pins']['files'])
    capacities=[e for e in worker_capacities if has_pinned_bootstrap and Path(urlparse(scope_urls.get(e['scope'],e['url'])).path).name=='oci-verified-worker.js']
    network=[e for e in events if e['kind']=='network-completed'];gaps=[]
    if summary['eventDropped'] or summary['processSummary']['overflow']:gaps.append('observer/process bounded record overflow')
    if summary['errors']:gaps.append('top-level passive observation errors')
    if not process:gaps.append('no process samples')
    for e in process:
        require(finite(e['endedMS']) and e['endedMS']>=e['atMS'] and isinstance(e['records'],list),'process sampling interval')
        for row in e['records']:require(all(isinstance(row[k],int) and row[k]>=0 for k in ('rssBytes','pssBytes','privateBytes')),'physical sample byte counters')
        expected={k:sum(row[k] for row in e['records']) for k in ('rssBytes','pssBytes','privateBytes')} if e['records'] else None
        require(e['totals']==expected,'independent sampled process-tree totals')
    if any(not e['complete'] for e in process):gaps.append('one or more process-tree samples incomplete; maxima omit missing processes')
    if not heaps:gaps.append('no actual CDP heap-used sample')
    for e in heaps:require(finite(e['heap']['usedSize']) and finite(e['heap']['totalSize']) and 0<=e['heap']['usedSize']<=e['heap']['totalSize'],'actual used and capacity heap counters')
    if not capacities:gaps.append('Native heap capacity unavailable in actual transient Workers')
    for e in worker_capacities:require(isinstance(e['value']['bufferCapacityBytes'],int) and e['value']['bufferCapacityBytes']>0,'actual exposed Worker heap buffer capacity')
    if not main:gaps.append('no main-thread observation')
    if any(e['observation']['taskDropped'] or e['observation']['raf']['dropped'] for e in main):gaps.append('bounded main observation overflow')
    if any(not e['observation']['longTaskSupported'] for e in main):gaps.append('long-task API unsupported in an observed frame')
    startup=list({(e['pageId'],e.get('frameId'),e['observation']['timeOrigin']):{'pageId':e['pageId'],'frameId':e.get('frameId'),'timeOrigin':e['observation']['timeOrigin'],'installation':e['observation']['installation'],'readyStateAtInstall':e['observation']['readyStateAtInstall'],'beginMS':e['observation']['begin']} for e in main}.values())
    frame_scopes={}
    for e in main:
        o=e['observation'];identity=(e['pageId'],e.get('frameId',e.get('url')),o['timeOrigin']);s=frame_scopes.setdefault(identity,{'pageId':e['pageId'],'frameId':identity[1],'timeOrigin':o['timeOrigin'],'tasks':[],'rafGaps':[],'rafTicks':0,'visibility':set(),'firstObservedMS':o['begin'],'lastObservedMS':o['end']})
        s['tasks']+=o['tasks'];s['rafGaps']+=o['raf']['gaps'];s['rafTicks']+=o['raf']['ticks'];s['visibility'].add(o['visibility']);s['lastObservedMS']=max(s['lastObservedMS'],o['end'])
    for e in network:require(finite(e['encodedTransferBytes']) and e['encodedTransferBytes']>=0,'completed encoded receive bytes')
    unknown_network=[e for e in events if e['kind'] in ('network-unfinished','network-failed','network-completed-missing-request','network-overflow','target-observation-error')]
    if unknown_network:gaps.append('missing/unfinished/failed/passively missed network observations; never treated as zero')
    wasm=[e for e in network if e['request']['path'].endswith('.wasm')]
    if not wasm:gaps.append('no completed observed WASM request; no encoded-zero/cache assertion')
    network_scopes={}
    for e in network:
        s=network_scopes.setdefault(e['scope'],{'scope':e['scope'],'completedRequests':0,'completedEncodedReceiveBytes':0,'wasm':[]});s['completedRequests']+=1;s['completedEncodedReceiveBytes']+=e['encodedTransferBytes']
        if e['request']['path'].endswith('.wasm'):s['wasm'].append({'path':e['request']['path'],'response':e['request']['response'],'explicitCacheEvent':e['request']['cacheEvent'],'completedEncodedReceiveBytes':e['encodedTransferBytes']})
    origin=summary['timeOrigin'];phases=[]
    for p in summary['phases']:
        require(finite(p['startMS']) and finite(p['endMS']) and p['endMS']>=p['startMS'] and abs(p['wallMS']-(p['endMS']-p['startMS']))<1e-6,'actual instrumented public/fixture phase duration')
        related=[e for e in process if e['phase']==p['label']];inside=[e for e in related if e['atMS']>=p['startMS'] and e['endedMS']<=p['endMS']]
        maxbytes=lambda values,key:max((e['totals'][key] for e in values if e['totals'] is not None),default=None)
        scopes=[]
        for s in frame_scopes.values():
            tasks=[t for t in s['tasks'] if s['timeOrigin']+t['startMS']<origin+p['endMS'] and s['timeOrigin']+t['startMS']+t['durationMS']>origin+p['startMS']]
            raf=[g for g in s['rafGaps'] if s['timeOrigin']+g['startMS']<origin+p['endMS'] and s['timeOrigin']+g['startMS']+g['durationMS']>origin+p['startMS']]
            if tasks or raf:scopes.append({'pageId':s['pageId'],'frameId':s['frameId'],'overlappingLongTasks':tasks,'maxOverlappingLongTaskMS':max((t['durationMS'] for t in tasks),default=None),'overlappingRafGapsOver32MS':raf,'maxRecordedRafGapMS':max((g['durationMS'] for g in raf),default=None)})
        phases.append({**p,'processSamplesDuringWall':len(inside),'boundaryAndDuringSamples':len(related),'sampledDuringWallMaxPssBytes':maxbytes(inside,'pssBytes'),'sampledDuringWallMaxPrivateBytes':maxbytes(inside,'privateBytes'),'boundaryAndDuringMaxPssBytes':maxbytes(related,'pssBytes'),'boundaryAndDuringMaxPrivateBytes':maxbytes(related,'privateBytes'),'mainScopesWithRecordedOverlaps':scopes,'scopeMeaning':'No tasks listed is not zero work; scopes overlap and are never summed'})
        if p['role']=='public-command' and not inside:gaps.append('no complete in-wall process sample for '+p['label'])
    expected_commands={'save':4,'open-project':2,'export-worker-step':4,'export-core-3mf':5,'export-linked-part-drawing-svg':4}
    # Refused stale STEP/SVG calls are also instrumented public commands.
    expected_commands['export-worker-step']+=1;expected_commands['export-linked-part-drawing-svg']+=1
    by_id={}
    for command in r['commandPhases']:by_id[command['id']]=by_id.get(command['id'],0)+1;require(any(p['label']==command['label'] for p in phases),'public command phase bound to actual receipt')
    for key,count in expected_commands.items():require(by_id.get(key)==count,'complete retained actual public operation roster: '+key)
    require(any(p['role']=='post-close-idle' for p in phases),'normal-close fixed idle observed')
    post=[e for e in process if e['phase']=='post-normal-close-idle' and e['totals'] is not None]
    return {'status':'PARTIAL_OBSERVATION_COVERAGE' if gaps else 'SCOPED_OBSERVATIONS_RECORDED','gaps':sorted(set(gaps)),'instrumented':True,'profileMode':summary['profileMode'],'processCustody':summary['process'],'processSampledMaxPssBytes':max((e['totals']['pssBytes'] for e in process if e['totals']),default=None),'processSampledMaxPrivateBytes':max((e['totals']['privateBytes'] for e in process if e['totals']),default=None),'postCloseLastSample':post[-1] if post else None,'physicalMeaning':'sampled process-tree PSS/private lower bounds on continuous maxima; RSS is not physical unique-page memory','phases':phases,'mainInstallCoverage':startup,'removedFrames':len([e for e in events if e['kind']=='frame-detached']),'logicalResourceSamples':[{'observedAtMS':e['atMS'],'phase':e['phase'],'pageId':e['pageId'],'frameId':e.get('frameId'),'value':e['observation']['logicalResources']} for e in main if 'logicalResources' in e['observation']],'networkScopes':list(network_scopes.values()),'unknownNetworkObservations':len(unknown_network),'heapSamplesByScope':[{'scope':e['scope'],'targetKind':e['targetKind'],'observedAtMS':e['atMS'],'heap':e['heap']} for e in heaps],'nativeCapacitySamples':capacities,'otherWorkerHeapCapacitySamples':[e for e in worker_capacities if e not in capacities],'auditCopyPhases':[p['label'] for p in phases if p['role'] in ('harness-artifact-copy','harness-state')],'notObserved':['exact codec CPU or main hydration subphase wall','OPFS/file whole-hash scan byte totals','uploaded request/wire bytes or selected delta literal/copy totals','continuous physical peak or immediate OS release','large-source128MiB CAD or automatic geometry cache performance'],'capacityMeaning':'Actual ArrayBuffer capacity distinct from heap-used and physical RAM; Native classification requires an observed OCI bootstrap URL plus its pinned roster entry; unavailable is not zero','memorySla':None,'latencySla':None,'quotasChanged':False,'forcedGC':False}

def main():
    parser=argparse.ArgumentParser();parser.add_argument('evidence',type=Path);parser.add_argument('--desktop-source',type=Path,required=True);args=parser.parse_args();folder=args.evidence.resolve();r=json.loads((folder/'receipt.json').read_text());a=load_artifact_oracle()
    require(r['status']=='PASS' and r['ownedContextClosed'] and r['sharedBrowserDisconnectedOnly'],'complete workflow/cleanup');require(len(r['codecWorkers'])==3 and all(x['destroyed'] and '/native-archive.' in x['url'] for x in r['codecWorkers']),'actual observed owned codec target retirement');require(r['sourcePins']==r['sourcePinsAfter'],'source checkpoint unchanged');require(r['syntheticGeometry'] is False and r['sourceSeeds'] is False and r['filesystemRace'] is False,'genuine workflow only')
    expected={'initial-source':100,'unchanged-source':100,'edited-source':120,'reedited-source':130};require([row['label'] for row in r['nativeSaves']]==list(expected),'four actual archive saves')
    archives={};native={};costs=[];previous=None
    for row in r['nativeSaves']:
        file=folder/row['savedFile'];value=read_archive(file);require(value['sha256']==row['sha256'] and value['bytes']==row['bytes'],'normal saved/synchronized archive bytes')
        require(value['envelope']==row['acceptedEnvelope'],'actual .cad restores exactly the captured full authored envelope')
        require(value['rawSketches']=={x['id']:x['source'] for x in row['before']['capture']['native']['sketches']},'exact original accepted raw sketch text')
        derived=a.derive(value['envelope'],r['binding'],expected[row['label']],r['engineRevision'],r['definition']);native[row['label']]=derived;archives[row['label']]=value
        receipt=row['result'];codec=receipt['nativeArchive'];require(receipt['committed'] is True and receipt['archiveReuse']=='verified' and receipt['archiveRebaseVerificationBytes']==value['bytes'],'actual committed verified generation rebasing')
        require(codec['designRevision']==value['manifest']['designRevision'] and codec['entryCount']==len(value['manifest']['entries'])+1 and codec['archiveVerificationBytes']==value['bytes'],'issued root/directory/output verification cost')
        reusable=[] if previous is None else [path for path,entry in value['spans'].items() if path in previous['spans'] and entry['contentSha256']==previous['spans'][path]['contentSha256']]
        for path in reusable:require(value['spans'][path]['compressedSha256']==previous['spans'][path]['compressedSha256'] and value['spans'][path]['localSha256']==previous['spans'][path]['localSha256'],'unchanged canonical local/compressed record bytes')
        reused=sum(value['spans'][path]['compressedBytes'] for path in reusable);require(codec['reusedCompressedBytes']==reused,'actual codec-owned compressed reuse byte accounting')
        changed=sum(entry['bytes'] for entry in value['manifest']['entries'] if entry['path'] not in reusable);require(codec['changedEncodedBytes']==changed,'actual UTF-8 changed-entry encoding accounting')
        costs.append({'label':row['label'],'outerBytes':value['bytes'],'changedEntryUtf8Bytes':changed,'reusedCompressedBytes':reused,'preparedOutputHashBytes':codec['archiveVerificationBytes'],'committedRebaseHashBytes':receipt['archiveRebaseVerificationBytes'],'filesOuterIntegrityAndDeltaWork':'retained; not measured as zero by this codec receipt'})
        previous=value
    require(archives['initial-source']['sha256']==archives['unchanged-source']['sha256'] and costs[1]['changedEntryUtf8Bytes']==0 and costs[1]['reusedCompressedBytes']>0,'deterministic unchanged save/private reuse')
    # Bind reuse after genuine Open to actual verified archive entry identity,
    # independently of the codec's claimed costs or its observed target count.
    before_open=archives['edited-source'];after_open=archives['reedited-source']
    prior_drawing=one([entry for entry in before_open['manifest']['entries'] if entry['role']=='drawings'],'one prior saved drawing entry')
    next_drawing=one([entry for entry in after_open['manifest']['entries'] if entry['role']=='drawings'],'one reedited saved drawing entry')
    require(prior_drawing==next_drawing,'unchanged authored drawing descriptor across Open/reedit')
    drawing_path=prior_drawing['path'];prior_span=before_open['spans'][drawing_path];next_span=after_open['spans'][drawing_path]
    require(prior_span==next_span and prior_span['compressedBytes']>0,'exact nonempty drawing compressed/local record retained after Open')
    require(r['afterOpenReuse']=={'sourceLabel':'edited-source','sourceSha256':before_open['sha256'],'savedLabel':'reedited-source','savedSha256':after_open['sha256'],'reusedCompressedBytes':costs[3]['reusedCompressedBytes']},'genuine post-Open save receipt binding')
    require(costs[3]['reusedCompressedBytes']>=prior_span['compressedBytes'],'post-Open owner reuses actual unchanged drawing compressed span')
    drawing_reuse={'path':drawing_path,'logicalId':prior_drawing['logicalId'],'contentSha256':prior_span['contentSha256'],'compressedSha256':prior_span['compressedSha256'],'localSha256':prior_span['localSha256'],'compressedBytes':prior_span['compressedBytes']}
    pinrows=[x for x in r['rows'] if x['label']=='Exact frozen composed runtime'];require(len(pinrows)==3,'initial plus two genuine fresh runtime Opens')
    for row in pinrows:require({x['name']:x['sha256'] for x in row['assets']}==r['pins']['files'] and row['outer']['sha256']==r['pins']['outer']['sha256'],'exact served runtime/native/worker assets')
    module=args.desktop_source/'test/agent-cad-corpus/manufacturing-shared/oracle/mesh.py';pin=one([v for k,v in r['sourcePins'].items() if unquote(urlparse(k).path).endswith('/test/agent-cad-corpus/manufacturing-shared/oracle/mesh.py')],'mesh oracle pin');require(sha(module.read_bytes())==pin,'independent mesh source')
    spec=importlib.util.spec_from_file_location('independent_mesh',module);mesh=importlib.util.module_from_spec(spec);spec.loader.exec_module(mesh)
    exports=[];seen=set();export_rows={x['label'].split(': ',1)[1]:x for x in r['rows'] if x['label'].startswith('Real typed artifact files: ')}
    for row in r['artifacts']:
        phase,format=row['phase'],row['format'];require((phase,format) not in seen and phase in a.WIDTHS and format in ('step','3mf','svg'),'unique real export');seen.add((phase,format));raw=(folder/row['savedFile']).read_bytes();require(sha(raw)==row['sha256'] and len(raw)==row['bytes'],'actual artifact byte pins')
        d=native[a.NATIVE[phase]];result=row['result'];require(result['committed'] is True and result['dirty'] is False and result['persistence']=='browser' and result['serverStatus']=='not-verified','truthful ordinary file receipt')
        checked=a.inspect_step(raw,d['truth']) if format=='step' else a.check3mf(raw,d,mesh.inspect) if format=='3mf' else a.check_svg(raw,d,result,export_rows[phase]['before']['drawing'])
        exports.append({'phase':phase,'format':format,'sha256':sha(raw),'bytes':len(raw),'checked':checked})
    require(seen=={(phase,format) for phase in a.WIDTHS for format in ('step','3mf','svg')},'all twelve actual same-part artifact files')
    for row in export_rows.values():require(row['before']==row['after'],'read-only exports preserve complete accepted state')
    observations=check_observations(r,a)
    ledger=cost_ledger(folder,r)
    print(json.dumps({'status':'PASS','scope':'Complete actual tiny native-container workflow/artifacts and scoped instrumented cost attribution; no large-CAD/capacity/SLA claim','nativeArchives':[{k:v for k,v in row.items() if k!='filesOuterIntegrityAndDeltaWork'} for row in costs],'afterOpenDrawingReuse':drawing_reuse,'costLimits':{'FilesWholeBlobIntegrity':'still required; no zero-total-hash claim','mainThread':'existing ARC23 dirty comparisons and source hydration remain','memory':'not inferred from admitted capacity','derivedCache':'no public automatic producer in this workflow'},'exports':exports,'nativeObservations':observations,'costLedger':ledger},indent=2))
if __name__=='__main__':main()
