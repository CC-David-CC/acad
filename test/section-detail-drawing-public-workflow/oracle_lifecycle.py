"""Exact producer, finite phase and state-machine checks after the WHOLE run."""
import json,re,hashlib,subprocess
from pathlib import Path

LOCAL=['desktop-driver.mjs','example.mjs','check.py','README.md','CONTRACT.md','oracle_geometry.py','oracle_svg.py','oracle_lifecycle.py','SOURCE.md']
CORE=['modules/engine/extrusion/selectedRegionDescriptor.mjs','test/isometric-drawing-public-workflow/check.py','test/four-bore-drawing-public-workflow/check.py','test/four-bore-drawing-public-workflow/example.mjs','test/native-cad-container/archive_oracle.py']
DESKTOP=['test/agent-cad-corpus/sweep/signed-harness.mjs','test/agent-cad-corpus/strict-join/oracle.mjs','apps/system/jsketcher/drawing-bore-commands.mjs','apps/system/jsketcher/drawing-commands.mjs','apps/system/jsketcher/index.mjs']
PHASES=['Retained original four-view v3 definition','Actual center cap section and physical corner detail2:1','Six-view replacement Undo exact four views','Six-view replacement Redo SAME six roles','Real conic partial aperture, physical diameter unchanged','Detail crop Undo actual full intervals','Detail crop Redo SAME partial intervals','Parent paper scale1:2, detail remains absolute2:1','Parent paper scale Undo','Parent paper scale Redo keeps detail absolute2','Source width150 actual recomputation','Width Undo','Width Redo','Actual height30 depth25 centerD14','Fresh signed Open first','Actual corner diameter5, paper diameter10','Corner radius edit Undo physical4/paper8','Corner radius edit Redo physical5/paper10','Actual corner diameter4 restored before edited SVG','Real cover consumed the original drawing target','Real roof section from current Boolean cap topology','Real roof/tool Undo recovery','Real fillet identity cannot provide section/detail bore facts','Fresh signed Open unresolved','Explicit SAME-reference section/detail repair','Repair Undo exact unresolved references','Repair Redo exact repaired references','Quota boxes Undo retained original part','Healthy post-refusal source/bore reedit','Fresh signed Open final','Final current read after third native Open','Final healthy reedit after third fresh Open']
SVG=['original','partial-detail','half-parent-scale','edited','actual-roof','invalid-reference','final','resaved-final']
SAVES=['first','unresolved','final','resaved-after-third-open']

def sources(root,p,need):
 roster={('core','test/section-detail-drawing-public-workflow/'+n) for n in LOCAL}|{('core',n) for n in CORE}|{('desktop',n) for n in DESKTOP}
 rows=p['sourceSnapshots'];need(len(rows)==len(roster) and {(x['repository'],x['relative']) for x in rows}==roster and len(p['sourcePins'])==len(roster),'exact transitive executing helper and producer-anchor source roster')
 for x in rows:
  raw=(root/x['file']).read_bytes();digest=hashlib.sha256(raw).hexdigest();need(len(raw)<=8388608 and digest==x['sha256']==p['sourcePins'][x['originalFile']],'actual executed source snapshot hash')
  need(x['originalFile']==str(Path(x['root'])/x['relative']),'exact repository/path source association')
  commit=p['acceptanceSource'] if x['relative'].startswith('test/section-detail-drawing-public-workflow/') else p['pins']['source'] if x['repository']=='core' else p['pins']['desktop']
  need(x['commit']==commit and re.fullmatch('[a-f0-9]{40}',commit),'exact producer commit binding')
  oid=hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest();need(oid==x['gitBlobOID'],'independent snapshot Git object identity')
  result=subprocess.run(['git','-C',x['root'],'show',commit+':'+x['relative']],stdout=subprocess.PIPE,stderr=subprocess.PIPE)
  need(result.returncode==0 and result.stdout==raw,'independent exact producer/helper commit:path readback')

def refusal(x,need,settled):
 before,after=x['before'],x['after'];settled(before);settled(after);error=x['error']
 need(error and not error['committed'] and not error['possiblyCommitted'],'honest prepublication refusal')
 if not x.get('candidate'):need(after==before,'pre-candidate refuses with exact tokens/epoch/source/J/host/resources');return
 need(error['code']=='HOLE_OUTSIDE_PROFILE','actual geometric predicate failure')
 for s in (before,after):
  need(type(s['lifecycle']['epoch']) is int and s['lifecycle']['epoch']>=0 and type(s['lifecycle']['generation']) is int,'actual generation/epoch domain')
  for t in (s['host']['revision'],s['drawing']['revision'],s['capture']['solids']['revision'],s['drawing']['geometryRevision']):need(isinstance(t,str) and 0<len(t)<=256,'bounded actual token')
  need(s['host']['revision']==s['drawing']['revision'] and s['capture']['solids']['revision']==s['drawing']['geometryRevision'],'actual document/geometry inspection token provenance')
  match=re.fullmatch(r'(\d+):(\d+):(.+)',s['capture']['journal']['revision']);need(match and int(match[1])==s['lifecycle']['generation'] and match[3]==s['host']['revision'],'exact generation/J-header/document ownership')
 need(after['lifecycle']['epoch']==before['lifecycle']['epoch']+1 and after['host']['revision']!=before['host']['revision'] and after['capture']['solids']['revision']!=before['capture']['solids']['revision'],'one failed candidate invalidates observed epoch/document/geometry')
 need(after['capture']['journal']['revision'].rsplit(':',1)[0]==before['capture']['journal']['revision'].rsplit(':',1)[0],'J chronology header unchanged')
 def durable(s):
  s=json.loads(json.dumps(s));s['lifecycle'].pop('epoch');s['host'].pop('revision');s['drawing'].pop('revision');s['drawing'].pop('geometryRevision');s['capture']['journal'].pop('revision');s['capture']['solids'].pop('revision');return s
 need(durable(after)==durable(before),'ONLY the epoch and five linked inspection tokens change; exact source/definitions/host/J/resources preserved')

def counters(before,after,feature_id,need):
 a,b=before['capture']['native']['counters'],after['capture']['native']['counters']
 need(type(a['featureId']) is int and b=={**a,'featureId':a['featureId']+1} and type(feature_id) is int and feature_id==b['featureId'],'one actually issued featureId+1, every other counter exact')

def lifecycle(root,p,need,settled):
 sources(root,p,need)
 cases=['original','translated-negative'];need([c['name'] for c in p['cases']]==cases and all(c['status']=='PASS' for c in p['cases']),'exact two datum cases')
 need([c['origin'] for c in p['cases']]==[[0,0],[-70,-35]],'both genuinely distinct authored datum origins')
 for collection in ('observations','svgs','saves','reopens','travels','replacements','detailTravels','scaleTravels','quotas','noops','refusals','repairs','negatives','issuances'):need(all(x['case'] in cases for x in p[collection]),'no foreign/unreviewed case in '+collection)
 for case in cases:
  rows=[x for x in p['observations'] if x['case']==case];expected=PHASES if case=='original' else [x for x in PHASES if x!='Quota boxes Undo retained original part']
  need([r['label'] for r in rows]==expected and len(set(expected))==len(expected),'exact ordered unique full observation-phase roster '+case)
  origin=[0,0] if case=='original' else [-70,-35];need(all(r['dimensions']['origin']==origin for r in rows),'exact same authored datum through every phase '+case)
  need([(x['label'],Path(x['savedFile']).suffix) for x in p['svgs'] if x['case']==case]==[(x,'.svg') for x in SVG],'all unique eight SVG formats/phases '+case)
  need([(x['label'],Path(x['savedFile']).suffix) for x in p['saves'] if x['case']==case]==[(x,'.cad') for x in SAVES],'all four current .cad save phases '+case)
  need([x['label'] for x in p['reopens'] if x['case']==case]==SAVES[:3],'all three genuinely fresh Opens '+case)
  owner=next(c['username'] for c in p['cases'] if c['name']==case);need(isinstance(owner,str) and owner,'actual ordinary own signed account identity')
  for x in [x for x in p['svgs']+p['saves'] if x['case']==case]:
   need(x['writeOwner']['username']==owner and x['writeOwner']['windowId'] and x['writeOwner']['browserContextId'] and x['result']['committed'] is True and x['result']['persistence']=='browser' and x['result']['path']==x['file'],'actual own path/context and acknowledged submitted write')
   need(x['file'].startswith('/Section-detail-') and owner in x['file'] and x['before']['lifecycle']==x['after']['lifecycle'],'own files only; durable handoff does not alter source lifetime')
   if x in p['svgs']:need(x['result']['sourceRevision']==x['before']['host']['revision'],'exact SVG export source revision receipt')
   else:need(x['after']['host']['path']==x['file'] and x['after']['host']['dirty'] is False,'normal .cad Save installs exact own path/clean baseline')
  refs=[x for x in p['refusals'] if x['case']==case]
  need([(x['label'],x.get('candidate',False)) for x in refs]==[('Three members cannot claim four THRU',False),('Old discovery revision refuses',False),('Impossible actual corner offset',True),('Detail scale is exact2:1',False)],'exact four negative phases '+case)
  need([x['error']['code'] for x in (refs[0],refs[2],refs[3])]==['INVALID_REQUEST','HOLE_OUTSIDE_PROFILE','INVALID_REQUEST'] and refs[1]['error']['name']=='AbortError','exact authoritative negative codes and native abort semantics')
  for x in refs:refusal(x,need,settled)
  for kind in ('replacements','detailTravels','scaleTravels','repairs','noops','negatives'):need(len([x for x in p[kind] if x['case']==case])==1,'unique actual '+kind+' '+case)
  travels=[x for x in p['travels'] if x['case']==case]
  travel_phases=[('undo','Six-view replacement Undo exact four views'),('redo','Six-view replacement Redo SAME six roles'),('undo','Detail crop Undo actual full intervals'),('redo','Detail crop Redo SAME partial intervals'),('undo','Parent paper scale Undo'),('redo','Parent paper scale Redo keeps detail absolute2'),('undo','Width Undo'),('redo','Width Redo'),('undo','Corner radius edit Undo physical4/paper8'),('redo','Corner radius edit Redo physical5/paper10'),('undo','Repair Undo exact unresolved references'),('redo','Repair Redo exact repaired references')]
  need([(x['direction'],x['label']) for x in travels]==travel_phases,'exact actual shared travel phase/order roster')
  for x in travels:
   need(x['target']==x['before']['capture']['journal']['undoTarget' if x['direction']=='undo' else 'redoTarget'] and x['before']['capture']['native']['counters']==x['after']['capture']['native']['counters'],'actual current J target and retained counters through travel')
  # Source dimensions must genuinely reach each declared phase, not repeated
  # counts of an unchanged successful packet.
  dimensions={x['label']:x['dimensions'] for x in rows}
  expectations={'Retained original four-view v3 definition':(100,50,20,10,4),'Source width150 actual recomputation':(150,50,20,10,4),'Width Undo':(100,50,20,10,4),'Width Redo':(150,50,20,10,4),'Actual height30 depth25 centerD14':(150,30,25,14,4),'Actual corner diameter5, paper diameter10':(150,30,25,14,5),'Corner radius edit Undo physical4/paper8':(150,30,25,14,4),'Corner radius edit Redo physical5/paper10':(150,30,25,14,5),'Actual corner diameter4 restored before edited SVG':(150,30,25,14,4),'Healthy post-refusal source/bore reedit':(140,30,22,12,4),'Final healthy reedit after third fresh Open':(142,30,22,12,4)}
  for label,vals in expectations.items():need(tuple(dimensions[label][k] for k in ('width','height','depth','centerDiameter','cornerDiameter'))==vals,'actual source dimensions by phase '+label)
 need([(x['case'],x['level']) for x in p['quotas']]==[('original',31),('original',32)],'BOTH exact work boundary cases, not duplicated one case')
 need(p['creationTravels']==[],'no inferred or synthetic drawing-creation travel')
 need(len(p['issuances'])==24,'actual two roof tool/Boolean pairs plus twenty quota boxes')
 for i in p['issuances']:counters(i['before'],i['after'],i['feature']['featureId'],need)
 for case in cases:
  issued=[i for i in p['issuances'] if i['case']==case];ids=[x['feature']['featureId'] for x in issued];need(len(ids)==len(set(ids)) and ids==sorted(ids),'issued/retired identities never reused within a document')
  cover=next(x for x in p['negatives'] if x['case']==case);tools=[x for x in issued if x['phase'].startswith('cover-')]
  need([x['phase'] for x in tools]==['cover-tool','cover-union'] and [x['feature'] for x in tools]==[cover['tool'],cover['producer']],'actual cover issuance binds history receipts')
  need(cover['restored']['capture']['native']['counters']==tools[-1]['after']['capture']['native']['counters'],'roof/tool Undo retains exact highwater/other counters')
  need(all(str(x['featureId']) not in {str(r['params']['featureId']) for r in cover['restored']['capture']['native']['history']} for x in (cover['tool'],cover['producer'])),'both actually retired roof IDs absent from restored history')
 quota=[i for i in p['issuances'] if i['phase'].startswith('quota-')];need([i['phase'] for i in quota]==['quota-'+str(i) for i in range(20)],'all twenty distinct actual quota allocations')
 recovery=p['quotaRecovery'];need([i['feature'] for i in quota]==recovery['tools'] and recovery['restored']['capture']['native']['counters']==quota[-1]['after']['capture']['native']['counters'],'all twenty Undo operations retain precise allocated highwater')
 history_ids={str(r['params']['featureId']) for r in recovery['restored']['capture']['native']['history']};need(not ({str(i['feature']['featureId']) for i in quota}&history_ids),'no retired quota feature remains published')
 # Final source edits, repair, Save and reopening must not refund issued IDs.
 for case in cases:
  high=max(i['feature']['featureId'] for i in p['issuances'] if i['case']==case)
  for s in [x for x in p['saves'] if x['case']==case and x['label'] in ('final','resaved-after-third-open')]:need(s['before']['capture']['native']['counters']['featureId']==high,'Save/Open retains actual retired feature highwater')
