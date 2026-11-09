"""Independent exact lifecycle/Git/write custody checks for the one frozen whole."""
import hashlib,json,re,subprocess
from pathlib import Path

def need(ok,why):
 if not ok:raise ValueError(why)
def one(rows,label):need(len(rows)==1,'one '+label);return rows[0]
def verify_roster(directory,r):
 declared=json.loads((Path(__file__).parent/'producer-roster.json').read_text());need(declared['version']==1,'exact roster format');metadata=r['producerRoster'];need(metadata['version']==1 and metadata['acceptanceSource']==r['acceptanceSource'] and metadata['core']==r['pins']['source'] and metadata['desktop']==r['pins']['desktop'],'exact separate acceptance/producing tuple')
 sections=[('acceptance','ACAD',r['acceptanceSource'],False,'acceptance'),('core','ACAD',r['pins']['source'],False,'product-anchor'),('desktop','Desktop',r['pins']['desktop'],False,'product-and-helper'),('native','Native',declared['nativeSource'],True,'native-source'),('nativeProof','Native',declared['nativeQualification'],True,'native-proof'),('componentProof','ACAD',r['pins']['source'],False,'component-proof')]
 expected={(repo,commit,name,bare,role) for section,repo,commit,bare,role in sections for name in declared[section]};rows=metadata['rows'];need(len(rows)==len(expected) and {(x['repository'],x['commit'],x['path'],x['bare'],x['role']) for x in rows}==expected,'exact complete acceptance-helper and producer-anchor roster')
 need(('Desktop',r['pins']['desktop'],'test/agent-cad-corpus/strict-join/oracle.mjs',False,'product-and-helper') in expected,'actual transitive signed-harness canonical helper included')
 snapshots=r['sourceSnapshots'];need(len(snapshots)==len(rows) and len({x['originalFile'] for x in snapshots})==len(rows),'one snapshot per actual Git association');pins={};roots={}
 for row in rows:
  need(re.fullmatch('[a-f0-9]{40}',row['commit']) and re.fullmatch('[a-f0-9]{40}',row['gitBlob']),'actual Git objects');relative=row['path'];need(not Path(relative).is_absolute() and '..' not in Path(relative).parts,'fixed relative Git path');need(isinstance(row['root'],str) and Path(row['root']).is_absolute(),'actual repository root')
  prior=roots.setdefault(row['repository'],row['root']);need(prior==row['root'],'same repository for each role');identity=row['repository']+'@'+row['commit']+':'+relative;need(row['originalFile']==identity,'actual repo/commit/path association');source=one([x for x in snapshots if x['originalFile']==identity],'associated snapshot');raw=(directory/source['file']).read_bytes();sha=hashlib.sha256(raw).hexdigest();need(len(raw)==row['bytes'] and sha==row['sha256']==source['sha256'],'exact snapshot bytes/size/SHA')
  need(hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()==row['gitBlob'],'independent Git blob recomputation');args=['git','--git-dir='+row['root']] if row['bare'] else ['git','-C',row['root']];readback=subprocess.run(args+['show',row['commit']+':'+relative],stdout=subprocess.PIPE,stderr=subprocess.PIPE);need(readback.returncode==0 and readback.stdout==raw,'independent exact Git commit/path readback')
  if row['worktreePath'] is not None:need(row['worktreePath']==str(Path(row['root'])/relative),'actual executed helper path');pins[row['worktreePath']]=sha
  else:need(row['role'] in ('native-source','native-proof','component-proof'),'only retained nonexecuted linkage has no worktree file')
 need(r['sourcePins']==r['sourcePinsAfter']==pins,'exact complete executing source/helper and product-anchor pin set')
 core_example=one([x for x in rows if x['role']=='acceptance' and x['path'].endswith('/example.mjs')],'Core public recipe');host_example=one([x for x in rows if x['repository']=='Desktop' and x['path']=='apps/system/jsketcher/examples/source-bound-counterbore.mjs'],'host public recipe');need(core_example['sha256']==host_example['sha256'],'exact public recipe bytes')

def expected_points(e):
 W,H,T=e['width'],e['height'],e['thickness'];cx,cy=W/2,H/2;r,R=e['throughDiameter']/2,e['stepDiameter']/2;s=T-e['stepDepth'];ring=(r+R)/2
 if not r:return [[cx,cy,T/2],[cx,cy,0],[cx,cy,T+.5]]
 return [[cx,cy,T/2],[cx,cy,0],[cx,cy,T],[cx+ring,cy,s/2],[cx+ring,cy,s],[cx+ring,cy,s+e['stepDepth']/2],[cx+r,cy,s/2],[cx+R,cy,s+e['stepDepth']/2],[cx+R+.5,cy,s/2],[cx+R+.5,cy,s+e['stepDepth']/2],[cx,cy,T+.5]]

PHASES=['literal-constructor','counterbore-create','creation-undo','creation-redo','step8','diameters6-10','parent25','undo-parent','undo-diameters','undo-step','redo-step','redo-diameters','redo-parent','source-width120','source-height60','undo-height','undo-width','healthy-step7','restore-step8','named-bind','named-binding-undo','named-binding-redo','inch-display','first-fresh-open','reopened-named-edit','reopened-named-undo','reopened-named-redo','second-fresh-open','second-open-continuation','malformed-equal-depth-continuation','malformed-reversed-diameters-continuation','malformed-wrong-entry-continuation']
EXPECTED=[(100,50,20,0,0,0,False),(100,50,20,4,8,6,False),(100,50,20,0,0,0,False),(100,50,20,4,8,6,False),(100,50,20,4,8,8,False),(100,50,20,6,10,8,False),(100,50,25,6,10,8,False),(100,50,20,6,10,8,False),(100,50,20,4,8,8,False),(100,50,20,4,8,6,False),(100,50,20,4,8,8,False),(100,50,20,6,10,8,False),(100,50,25,6,10,8,False),(120,50,25,6,10,8,False),(120,60,25,6,10,8,False),(120,50,25,6,10,8,False),(100,50,25,6,10,8,False),(100,50,25,6,10,7,False),(100,50,25,6,10,8,False),(100,50,25,6,10,8,True),(100,50,25,6,10,8,False),(100,50,25,6,10,8,True),(100,50,25,6,10,8,True),(100,50,25,6,10,8,True),(100,50,30,6,10,7,True),(100,50,25,6,10,8,True),(100,50,30,6,10,7,True)]+[(100,50,30,6,10,7,True)]*5
REFUSALS=[('Independent source cannot replace counterbore datum','COUNTERBORE_ENTRY_UNRESOLVED',False),('Creation step equals thickness','COUNTERBORE_STEP_NOT_INTERIOR',False),('Equal diameters cannot simplify to THRU','COUNTERBORE_DIAMETER_ORDER',False),('Caller cannot substitute backend build','INVALID_REQUEST',False),('Zero step argument domain','INVALID_REQUEST',False),('Negative step argument domain','INVALID_REQUEST',False),('Equal thickness refuses without conversion','COUNTERBORE_STEP_NOT_INTERIOR',True),('Oversize step refuses without clamp','COUNTERBORE_STEP_NOT_INTERIOR',True),('Reversed diameters refuse','COUNTERBORE_DIAMETER_ORDER',False),('Actual containment required','COUNTERBORE_OUTSIDE_PROFILE',True),('Downstream parent equality atomic','COUNTERBORE_STEP_NOT_INTERIOR',True),('Stale revision before candidate','STALE_HISTORY',False),('Cannot erase named binding','BOUND_DIMENSION',False),('Named interior-step equality','COUNTERBORE_STEP_NOT_INTERIOR',True),('Named diameter order','COUNTERBORE_DIAMETER_ORDER',True),('Changed geometry requires material review before3MF','MANUFACTURING_REVIEW_REQUIRED',False)]

def verify_phases(r):
 need([x['phase'] for x in r['observations']]==PHASES,'exact ordered complete positive phase roster')
 for row,expected in zip(r['observations'],EXPECTED):
  e=row['dimensions'];need(tuple(e[k] for k in ('width','height','thickness','throughDiameter','stepDiameter','stepDepth'))+(row['bound'],)==expected,'frozen requested intent for '+row['phase'])
 travel=one(r['creationTravel'],'creation event');
 for key,index in [('before',0),('created',1),('undone',2),('redone',3)]:need(travel[key]==r['observations'][index]['before'],'exact creation travel/observation association')
 created_counters=travel['created']['capture']['native']['counters'];need(all(x['before']['capture']['native']['counters']==created_counters for x in r['observations'][1:]),'all later edit/travel/Open/negative continuations retain exact high water')
 need([(x['label'],x['error']['code'],x['candidate']) for x in r['refusals']]==REFUSALS,'all exact negative semantics and actual candidate custody')
 travels=[x['args']['direction'] for x in r['commands'] if x['command']=='travel-authored-edit' and 'result' in x];need(travels==['undo','redo','undo','undo','undo','redo','redo','redo','undo','undo','undo','redo','undo','redo'],'exact immediate creation and mixed actual travel sequence')
 need([x['label'] for x in r['saves']]==['counterbore-initial','counterbore-reedited'] and [x['label'] for x in r['reopens']]==['counterbore-initial','counterbore-reedited'],'both exact native save/fresh-Open cycles')
 need([(x['label'],x['format']) for x in r['artifacts']]==[(label,fmt) for label in ('initial','reopened-reedited') for fmt in ('step','3mf','svg')],'six actual format-specific exports in settlement order')
 need([x['label'] for x in r['exportSets']]==['initial','reopened-reedited'] and all(x['before']==x['after'] for x in r['exportSets']),'exact same accepted source/J/presentation/material/export state')
 noops=[x for x in r['rows'] if x['label']=='Three-field no-op exact J/state'];need(len(noops)==1 and noops[0]['noop']['changed'] is False and noops[0]['before']==noops[0]['after'],'actual semantic no-op exact-state preservation')
 for row in r['observations']:
  s=row['before'];need(s['lifecycle']['pointer']==len(s['capture']['native']['history'])-1,'all observed models are settled complete tips')

def verify_writes(directory,r):
 expected=[('export-step','initial'),('export-3mf','initial'),('export-svg','initial'),('save','counterbore-initial'),('expected-prewrite-refusal','Changed geometry requires material review before3MF'),('export-step','reopened-reedited'),('export-3mf','reopened-reedited'),('export-svg','reopened-reedited'),('save','counterbore-reedited'),('negative-fixture','negative-equal-depth'),('negative-fixture','negative-reversed-diameters'),('negative-fixture','negative-wrong-entry')]
 writes=r['writes'];need([(x['kind'],x['label']) for x in writes]==expected and 'pendingWrite' not in r,'one exact sequential write roster, no unresolved write custody')
 owners={x['username'] for x in writes};need(len(owners)==1,'same actual own account through fresh contexts');username=next(iter(owners));need(isinstance(username,str) and username,'actual own account')
 for i,row in enumerate(writes):
  window=row['windowId'];need(window,'actual owned window for THIS write');need(row['sequence']==i and row['phase']=='settled' and row['file'].startswith('/Counterbore-'+username),'each unique submitted own write actually settled');rb=row['readback'];need(rb['file']==row['file'],'same actual own readback path')
  if row['kind']=='expected-prewrite-refusal':
   refused=one([x for x in r['refusals'] if x['label']==row['label']],'known prewrite refusal');need(row['failure']==refused['error'] and row['afterAbsence']==refused['after'],'same known refusal and readonly absence observation');need(rb['absent'] is True and rb['method']=='browser-server-root-list' and rb['username']==username and rb['windowId']==str(window) and isinstance(rb['owner'],str) and rb['owner'],'scoped actual complete browser+server listing custody')
   need(set(rb)=={'absent','method','file','username','windowId','owner','browserEntries','serverEntries'},'exact scoped absence record');
   for side in ('browserEntries','serverEntries'):
    entries=rb[side];need(isinstance(entries,list) and len(entries)<=4096,'bounded complete own root listing');names=[]
    for entry in entries:
     need(set(entry)==({'path','name','directory'} if side=='browserEntries' else {'name','directory','bytes'}) and isinstance(entry['name'],str) and 0<len(entry['name'].encode())<=255 and '/' not in entry['name'] and type(entry['directory']) is bool,'actual root entry shape');names.append(entry['name'])
     if side=='browserEntries':need(entry['path']=='/'+entry['name'],'actual root path/name binding')
     else:need(entry['bytes'] is None if entry['directory'] else type(entry['bytes']) is int and entry['bytes']>=0,'actual server size')
    need(len(names)==len(set(names)),'unique complete root entries')
   need(not any(x.get('path')==row['file'] or x.get('name')==row['file'][1:] for x in rb['browserEntries']) and not any(x.get('name')==row['file'][1:] for x in rb['serverEntries']),'known unreviewed file absent in both own stores');continue
  raw=(directory/rb['savedFile']).read_bytes();need(hashlib.sha256(raw).hexdigest()==rb['sha256'] and len(raw)==rb['bytes'],'actual settled browser/server byte equality readback');result=row['result']
  if row['kind']=='negative-fixture':
   negative=one([x for x in r['malformed'] if 'negative-'+x['name']==row['label']],'submitted malformed fixture');need(negative['negativeReadback']==rb and negative['own']==row['file'] and negative['sha256']==rb['sha256'],'same written and independently checked malformed bytes');need(result['path']==row['file'] and result['sha256']==rb['sha256'] and result['status']=='pending' and isinstance(result['version'],str) and result['version'],'actual mirror write receipt and subsequent settled server readback')
  else:
   need(result['committed'] is True and result['persistence']=='browser','actual committed own browser write receipt')
   source=one([x for x in (r['saves'] if row['kind']=='save' else r['artifacts']) if x['label']==row['label'] and (row['kind']=='save' or x['format']==row['kind'][7:])],'settled export/save');need(source['result']==result and all(source[k]==rb[k] for k in ('file','savedFile','sha256','bytes')),'exact result/artifact/readback binding')
