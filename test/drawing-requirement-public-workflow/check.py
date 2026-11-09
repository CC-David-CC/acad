#!/usr/bin/env python3
"""FIRST independent oracle AFTER the entire unchanged public workflow PASS.
Reads actual archived source/Native observations/SVG/file custody, never invokes
the app, geometry kernel, production parser or solver. No placement-search reuse.
"""
import copy,hashlib,json,math,subprocess,sys
from pathlib import Path
from collections import Counter
from fractions import Fraction
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'native-cad-container'))
from archive_oracle import read_archive
from truth import need,one,settled,requirement_observation,discovery,height_layout,FINE,INCIDENCE,DIRECTION
from svg_oracle import inspect_svg,project
from negative_archive import inspect as inspect_negative_archive
sha=lambda b:hashlib.sha256(b).hexdigest()
LOCAL=set('CONTRACT.md README.md example.mjs desktop-driver.mjs check.py truth.py requirement_math.py native_record.py svg_oracle.py negative_archive.py'.split())
PRODUCT=set('modules/drawing/linkedPartDrawingDefinition.mjs modules/engine/extrusion/selectedArrangementDescriptor.mjs modules/engine/extrusion/selectedRegionDescriptor.mjs modules/engine/mount/booleanSelectionClaims.mjs modules/engine/mount/drawingDetailClip.mjs modules/engine/mount/drawingReferenceFacts.mjs modules/engine/mount/drawingRequirementFacts.mjs modules/engine/mount/drawingRequirementProtocol.mjs modules/engine/mount/orthographicAnalyticRecord.mjs modules/engine/mount/ownedBoreAnnotationProtocol.mjs modules/engine/mount/ownedBoreReadProtocol.mjs modules/engine/mount/ownedDrawingReadProtocol.mjs modules/engine/mount/ownedDrawingSectionProtocol.mjs modules/engine/mount/ownedOrthographicReadProtocol.mjs modules/engine/mount/ownedTopologyContract.mjs modules/engine/mount/prismaticBoreFacts.mjs web/app/cad/export/linkedPartDrawingCaptionLayout.mjs web/app/cad/export/linkedPartDrawingRequirementForms.mjs web/app/cad/export/linkedPartDrawingSvg.mjs web/app/cad/export/linkedPartDrawingWarningLayout.mjs web/app/cad/craft/workerDrawingReadCommands.ts web/app/cad/craft/workerSolidCommands.ts test/native-cad-container/archive_oracle.py'.split())
HOST=set('test/agent-cad-corpus/sweep/signed-harness.mjs test/agent-cad-corpus/strict-join/oracle.mjs apps/system/jsketcher/drawing-commands.mjs apps/system/jsketcher/drawing-requirement-commands.mjs apps/system/jsketcher/drawing-export-command.mjs apps/system/jsketcher/index.mjs apps/system/jsketcher/inspect-state.mjs apps/system/jsketcher/file-export-outcome.mjs apps/system/jsketcher/scoped-command.mjs apps/system/jsketcher/examples/linked-drawing-requirements.mjs'.split())
def receipt_actor(r,receipt_sha):
 # A present future summary is usable ONLY with its actual post-launch
 # registry/session observation. Never turn malformed present data into legacy.
 if 'windowId'in r:
  window=r['windowId'];launch=r.get('launchActor')
  need(type(window)is str and bool(window) and type(launch)is dict and set(launch)=={'username','windowId','commandIds'} and launch['username']==r['username'] and launch['windowId']==window,'future actor captured after actual public launch')
  ids=launch['commandIds'];need(type(ids)is list and bool(ids) and all(type(v)is str and bool(v)for v in ids) and len(ids)==len(set(ids)) and ids==sorted(ids),'complete actual launched registry command IDs')
  need({'inspect-worker-drawing-requirement-targets','read-linked-part-drawing-requirements','export-linked-part-drawing-svg','save','open-project'}<=set(ids),'actual launch provides required scoped read/write commands')
  return window,{'basis':'post-launch-public-registry','expectedPageLocalWindowLabel':window,'launchCommandCount':len(ids),'scope':'page-local actor labels; not persistent global-window identity'}
 # This ONE historical receipt has a source-confirmed prelaunch omission.
 # Baseline contemporaneous writes/proofs are evidence, not a synthesized field.
 expected={'source':'82866bf0ee852f1d3b3892972f07d8af4cd8b9b0','hostSource':'796c9051331054746d81ea4ea0bb8ec8e8cf2bbd','acceptanceSource':'615716f87f74efc34ed6cd41660db07aa377f4a1','exampleSource':'796c9051331054746d81ea4ea0bb8ec8e8cf2bbd','engineRevision':'sha256:57b74074e0a249b917ac68357fbd003c37d1ab61897206886b575088e6995858:60dc956b08e01f43d08a48035a384e478e63bb34fb55f21a152c8cd12e8b8947'}
 need(receipt_sha=='7e063f524b934f245d90ab7c75e8f403e08fa94276612cfd190568cdf39787cb'and all(r.get(k)==v for k,v in expected.items()),'missing actor summary allowed ONLY for exact immutable R5 receipt and full producing tuple')
 need(r['pins']['source']==expected['source']and r['pins']['desktop']==expected['hostSource'],'exact actual R5 runtime pin sources')
 sources={('core','test/drawing-requirement-public-workflow/desktop-driver.mjs'):(expected['acceptanceSource'],'6d68571cfff6743e9bb95d7ab15f4f9247a13451','1efd089441f9bf781681c1c6e66d198ccfbce25d2f8016cc285268118ce4bcdd'),('desktop','test/agent-cad-corpus/sweep/signed-harness.mjs'):(expected['hostSource'],'0ddb1781ed2ee57e91153e2f20fabb70183f2c9f','1ba491dc1d3ba32518a7476445aa8178bacac14af33cb0b4604969543d514d10')}
 for (repository,relative),identity in sources.items():
  row=one([v for v in r['sourceSnapshots']if(v['repository'],v['relative'])==(repository,relative)],'exact historical executed actor-source anchor')
  need((row['commit'],row['gitBlobOID'],row['sha256'])==identity,'actual frozen prelaunch driver and public launch/getter/command harness identities')
 writes=r['writes'];need(type(writes)is list and len(writes)==15,'ALL15 actual R5 write actors required')
 baseline=writes[0];window=baseline['windowId'];need(type(window)is str and bool(window) and baseline['kind']=='svg'and baseline['label']=='baseline'and baseline['phase']=='settled'and baseline['username']==r['username'],'actor derives only from actual settled baseline write')
 need(all(w['sequence']==i and type(w['windowId'])is str and w['windowId']==window and w['username']==baseline['username']for i,w in enumerate(writes)),'all actual contemporaneous R5 actors agree with baseline, not a constant/default')
 refused=[w for w in writes if w['kind']=='expected-prewrite-refusal'];need(len(refused)==2 and {w['label']for w in refused}=={'Complete form outside paper','Repaired anchor inside declared height text'},'both actual guarded prewrite controls')
 proofs=[]
 for w in refused:
  for side in('beforeAbsence','afterAbsence'):
   proof=w[side];need(proof['username']==baseline['username']and type(proof['windowId'])is str and proof['windowId']==window and proof['file']==w['file']and proof['absent']is True and proof['method']=='browser-server-root-list','actual registered-window/session-root proof agrees with baseline actor')
   for inventory in('browserEntries','serverEntries'):
    entries=proof[inventory];need(type(entries)is list and len(entries)<=4096 and all(type(v)is dict for v in entries),'complete bounded own-root proof inventory')
    need(not any(v.get('path')==w['file']or v.get('name')==w['file'][1:]for v in entries),'independent historical browser/server membership absence')
   proofs.append(proof)
 need(len(proofs)==4 and all(v['owner']==proofs[0]['owner']for v in proofs),'all FOUR actual registered-window and current Files-owner proofs agree')
 return window,{'basis':'exact-historical-r5-baseline-write-and-four-source-bound-registry-proofs','receiptSHA256':receipt_sha,'expectedPageLocalWindowLabel':window,'writeActors':len(writes),'registeredRootProofs':len(proofs),'scope':'reader-local only; original summary remains absent; page-local recurrence is not global-window identity'}
def custody(directory,r):
 expected={('core','test/drawing-requirement-public-workflow/'+p)for p in LOCAL}|{('core',p)for p in PRODUCT}|{('desktop',p)for p in HOST}
 need(len(r['sourceSnapshots'])==len(expected) and {(p['repository'],p['relative'])for p in r['sourceSnapshots']}==expected,'complete exact executed acceptance/runtime/render transitive-leaf/Host-helper/example roster')
 for p in r['sourceSnapshots']:
  raw=(directory/p['file']).read_bytes();key=p['repository']+':'+p['relative'];need(sha(raw)==p['sha256']==r['sourcePins'][key]==r['sourcePinsAfter'][key],'all before/after snapshot SHA values')
  commit=r['exampleSource']if p['relative'].endswith('/linked-drawing-requirements.mjs')else r['hostSource']if p['repository']=='desktop'else r['acceptanceSource']if p['relative'].startswith('test/drawing-requirement-public-workflow/')else r['source']
  need(p['commit']==commit and len(commit)==40 and len(p['gitBlobOID'])==40,'producer versus acceptance versus example commit identities are separate')
  # Git object hash binds a portable byte snapshot even away from original
  # workstation. Optional repository access additionally proves commit:path.
  need(hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()==p['gitBlobOID'],'actual Git object bytes')
  if Path(p['root']).is_dir():
   result=subprocess.run(['git','-C',p['root'],'show',commit+':'+p['relative']],stdout=subprocess.PIPE,stderr=subprocess.PIPE)
   need(result.returncode==0 and result.stdout==raw,'frozen actual Git commit:path, never current-path inference')
 own=one([p for p in r['sourceSnapshots']if p['relative']=='test/drawing-requirement-public-workflow/example.mjs'],'executed example');host=one([p for p in r['sourceSnapshots']if p['relative'].endswith('/linked-drawing-requirements.mjs')],'actual exported public example')
 need((directory/own['file']).read_bytes()==(directory/host['file']).read_bytes(),'genuine public recipe byte identity')
 need(r['pins']['source']==r['source']and r['pins']['desktop']==r['hostSource']and len(r['pins']['files'])>0,'actual staged immutable runtime pin manifest')

def metadata_invariant(a,b):
 for s in(a,b):settled(s)
 need(a['capture']['native']==b['capture']['native']and a['capture']['solids']==b['capture']['solids']and a['ownership']==b['ownership']and a['lifecycle']==b['lifecycle'],'metadata changes no authored geometric source/history/material/Native resource/token')
 need(a['host']['documentToken']==b['host']['documentToken']and a['host']['path']==b['host']['path']and a['manufacturing']['metadata']==b['manufacturing']['metadata'],'metadata retains lifetime/path/material authority')

def check(directory):
 directory=Path(directory);receipt_raw=(directory/'receipt.json').read_bytes();r=json.loads(receipt_raw)
 need(r['status']=='PASS'and r['ownedContextsRetired']and r['sharedBrowserDisconnectedOnly']and r['pendingWrite']is None and not any(r[k]for k in('sourceSeeds','privateAuthoring','fakeReplies')),'entire real whole PASS +settled owned cleanup precedes oracle')
 need(r['budgets']=={'sourceMm':FINE,'nativeVolumeMm3':1e-6,'nativeBoundsMm':1e-6,'nativeReferenceMm':INCIDENCE,'nativeDirection':DIRECTION,'projectionMm':1e-6,'svgPaperChordMm':.02},'unchanged independently frozen accuracy/derived-presentation budgets');custody(directory,r)
 window_id,actor_evidence=receipt_actor(r,sha(receipt_raw))
 labels=[x['label']for x in r['observations']]
 required={'Real plain source and centered bore','Actual baseline A B C position finish fit','Actual removal retains physical model','Removal Undo exact v4','Removal Redo absent','Second removal Undo same v4','Edited position is authored intent only','Requirement value Undo0.20','Requirement value Redo0.25','Restore required position0.20','Original source resize150x30','Source resize Undo100x50','Source resize Redo150x30','Actual parent depth25','Parent depth Undo20','Parent depth Redo25','Actual live nominal12 clearance unchanged','Bore diameter Undo10','Bore diameter Redo12','Display inches retains raw millimeter and micrometer requirements','Display millimeters restores presentation only','Crowded layout retains real resolved geometry','Layout Undo restores exact authored label','Healthy protected read after finite layout refusal','Fresh Open normal','Healthy continuation after malformed wrong-ra-unit','Healthy continuation after malformed nonfinite-json-quantity','OWN reference is unresolved membership not another account','OWN membership Undo restores actual target','Real upstream union consumes original target','Actual upper cap loss retains unresolved intent','Fresh Open unresolved','Actual discovered repair resolves finite bore end','Repair Undo SAME actual upper-cap loss','Repair Redo SAME discovered reference','Fresh Open repaired','Actual live nominal14 after third native Open','Post-Open authored zone0.25 remains a requirement','Post-Open requirement Undo restores required0.20','Actual healthy continuation after third native cycle'}
 required|={'Blocked height label retains available repaired Native facts','Blocked-anchor layout Undo restores fixed initial height label'}
 need(required<=set(labels)and len(labels)==len(set(labels)),'all complete source/value/branch/repair/persistence/healthy continuation phases, no omitted positive step')
 first=r['observations'][0]['binding'];need(all(x['binding']['faceId']==first['faceId']and x['binding']['curveIds']==first['curveIds']and x['binding']['profile']==first['profile']and x['binding']['center']==first['center']for x in r['observations']),'one actual original source/member/constructor/hole identity through every replay')
 observed=[{'label':x['label'],'result':requirement_observation(x,r['engineRevision'])}for x in r['observations']]
 # Every actual discovery is separately associated with observed current source,
 # Native opaque selections and independent finite plane/material predicates.
 ds=[r['initialDiscovery'],*r['discoveries'],r['repairDiscovery']]
 for d in ds:
  need('before'in d and 'after'in d,'real discovery states recorded before/after operation, never reconstructed success')
  source_row=one([x for x in r['observations']if x['before']['capture']['solids']['revision']==d['before']['capture']['solids']['revision']and x['before']['capture']['native']==d['before']['capture']['native']][:1],'actual discovery same-source geometry')
  discovery(d,r['engineRevision'],source_row['binding'],source_row['expected'])
 for m in r['metadata']:
  metadata_invariant(m['before'],m['after']);need(m['result']['changed']is True and m['request']['revision']==m['before']['host']['revision']and m['request']['geometryRevision']==m['before']['capture']['solids']['revision'],'actual current metadata publication')
  need(m['after']['drawing']['definition']==m['definition']and m['result']['revision']==m['after']['host']['revision']and m['result']['geometryRevision']==m['after']['capture']['solids']['revision'],'actual published definition/receipt')
  need(m['after']['capture']['journal']['undoTarget']=={'kind':'document-metadata','domain':'linked-part-drawing','key':m['request'].get('drawingId',m['request'].get('definition',{}).get('drawingId'))},'one shared metadata J target')
 for t in r['travels']:
  need(t['before']['capture']['native']['counters']==t['after']['capture']['native']['counters'],'every real Undo/Redo preserves actual allocation highwater')
  need(t['target']==t['before']['capture']['journal']['undoTarget'if t['direction']=='undo'else'redoTarget']and t['result']['changed']is True,'genuine issued journal target/direction')
  if t['kind']=='metadata':metadata_invariant(t['before'],t['after']);need(t['after']['drawing']['definition']==t['definition'],'actual exact historical authored definition')
  else:need(t['kind']=='geometry-source'and t['before']['drawing']['definition']==t['after']['drawing']['definition'],'geometry-source travel never rewrites drawing intent')
 need(len([x for x in r['travels']if x['kind']=='geometry-source'])==6,'all three upstream source edits have actual Undo AND Redo')
 need(r['noop']['result']['changed']is False and r['noop']['before']==r['noop']['after'],'exact accepted metadata no-op, no J/token churn')
 codes={name:'INVALID_REQUEST'for name in('Duplicate datum symbol','Duplicate cross-collection ID','Duplicate requirement kind','Missing required datum C','Ordered datum precedence','Position quantity unit','Ra quantity unit','Zero position zone','Zero Ra maximum','Ra canonical conversion underflow','Null is not a numeric requirement','No modifier widening','Reversed hole deviations','Positive-clearance domain excludes interference','Source width is not live bore nominal','New form ordinary-view policy','Hypothetical definition is not accepted read authority')}
 codes.update({'Repaired anchor inside declared height text':'RESOURCE_LIMIT','Combined annotation17 preserves existing limit':'RESOURCE_LIMIT','Complete form outside paper':'RESOURCE_LIMIT','Actual old discovery tokens':None,'Actual old accepted-definition read tokens':None})
 need(len(r['refusals'])==len(codes)and set(x['label']for x in r['refusals'])==set(codes),'complete exact negative schema/unit/limit/membership/currentness/layout roster')
 for f in r['refusals']:
  need(f['before']==f['after']and f['error']['code']==codes[f['label']]and not f['error']['committed']and not f['error']['possiblyCommitted'],'precise actual refusal +ALL retained accepted state')
  if codes[f['label']]is None:need(f['error']['name']=='AbortError','actual stale token machine layer')
  if f['label']=='Complete form outside paper':need(f['error']['message']=='The authored requirement label has no complete supported legible paper box.','actual finite complete-form policy, not relaxed SVG criteria')
 for i,w in enumerate(r['writes']):
  need(w['sequence']==i and w['username']==r['username']and type(w['windowId'])is str and w['windowId']==window_id,'every submitted write exact owned actor/chronology')
  if w['kind']=='expected-prewrite-refusal':
   need(w['phase']=='settled-prewrite-refusal'and w['error']['code']=='RESOURCE_LIMIT'and not w['error']['committed']and not w['error']['possiblyCommitted'],'actual known prewrite outcome')
   for x in(w['beforeAbsence'],w['afterAbsence']):need(x['absent']is True and x['method']=='browser-server-root-list'and x['file']==w['file']and x['username']==r['username'],'actual complete own-file absence, not inferred from error/count')
  else:
   b=w['readback'];raw=(directory/b['savedFile']).read_bytes();need(w['phase']=='settled'and'error'not in w and len(raw)==b['byteLength']and sha(raw)==b['sha256'],'EVERY acknowledged write server-byte readback, unknown never closed')
 need(Counter(w['kind']for w in r['writes'])=={'svg':7,'save':4,'own-negative-fixture':2,'expected-prewrite-refusal':2},'all15 actual write attempts accounted for: original14 plus blocked-anchor prewrite control')
 need([s['label']for s in r['saves']]==['normal','unresolved','repaired','resaved-final']and[x['label']for x in r['reopens']]==['normal','unresolved','repaired'],'three exact native cycles and final post-Open resave')
 archives=[]
 for s in r['saves']:
  info=read_archive(directory/s['savedFile']);n=s['before']['capture']['native'];env=info['envelope'];model=env['project']['model']
  need(info['sha256']==s['sha256']and info['bytes']==s['byteLength'],'actual public server .cad bytes');need(model['history']==n['history']and model['expressions']==n['expressions']and model['counters']==n['counters'],'same original authored source/history/quantity/counters, no duplicate derived state')
  need(info['rawSketches']=={x['id']:x['source']for x in n['sketches']}and env['drawings']==[s['definition']]and env.get('presentation')==n['presentation']and env.get('manufacturing')is None,'exact ALL source bytes and raw v4/unit/label/ref intent, no stored resolved facts')
  need(s['before']['capture']==s['after']['capture']and s['before']['drawing']==s['after']['drawing'],'native Save preserves accepted source/J/metadata/geometry')
  need(one([v for v in env['drawings'][0]['dimensions']if v['dimensionId']=='height'],'saved original height')['label']==[40,70],'every actual native archive retains initial good height label, never transient obstruction')
  if s['label']!='resaved-final':
   op=one([x for x in r['reopens']if x['label']==s['label']],'actual fresh native Open');need(all(op['opened']['capture']['native'][k]==n[k]for k in('history','source','sketches','expressions','counters','presentation'))and op['opened']['drawing']['definition']==s['definition'],'fresh Open exact original model and authored refs')
   need(not op['opened']['capture']['journal']['canUndo']and not op['opened']['capture']['journal']['canRedo'],'Open does not restore fabricated session journal')
  archives.append({'file':s['savedFile'],'sha256':info['sha256'],'designRevision':info['manifest']['designRevision']})
 base=r['saves'][0];need(len(r['malformed'])==2 and {x['name']for x in r['malformed']}=={'wrong-ra-unit','nonfinite-json-quantity'},'actual own malformed archive scope')
 for f in r['malformed']:
  need(f['before']==f['after']and f['error']['code']==f['code']and not f['error']['committed']and not f['error']['possiblyCommitted'],'pre-adoption malformed Open exact complete state')
  proof=inspect_negative_archive(directory/base['savedFile'],directory/'malformed'/(f['name']+'.cad'),f['name']);need(proof==f['proof']and proof['negativeSha256']==f['sha256'],'negative-only actual saved drawings/manifest mutation proof')
 for before,after in ((r['tool']['before'],r['tool']['after']),(r['cover']['before'],one([x for x in r['observations']if x['label']=='Real upstream union consumes original target'],'actual union publication')['before'])):
  counter=copy.deepcopy(before['capture']['native']['counters']);counter['featureId']+=1
  need(after['capture']['native']['counters']==counter and after['ownership']['counters']==counter,'each genuine appended roof/union allocates EXACTLY one feature, other counters unchanged')
 repair=one(r['repairs'],'actual explicit repair');old,new=repair['broken'],repair['definition'];need(old['target']==new['target']and old['requirements'][0]==new['requirements'][0]and old['requirements'][2]==new['requirements'][2]and old['annotations']==new['annotations'],'actual finite bore/position/fit requirement IDs and values preserved through repair')
 a,b=copy.deepcopy(old),copy.deepcopy(new)
 for d in(a,b):
  for x in d['datumFeatures']:x.pop('reference')
  next(x for x in d['requirements']if x['kind']=='surface-finish').pop('target')
  dep=next(x for x in d['dimensions']if x['dimensionId']=='depth');dep.pop('first');dep.pop('second')
 need(a==b,'repair ONLY actual discovered plane references, not a relabeled success/new geometry')
 actualrefs=[x['reference']for x in repair['discovery']['result']['observation']['planes']if x['status']=='available']
 need(all(x['reference']in actualrefs for x in new['datumFeatures'])and next(x for x in new['requirements']if x['kind']=='surface-finish')['target']in actualrefs,'repair references actually discovered before publication')
 need(repair['undone']['drawing']['definition']==old and repair['redone']['drawing']['definition']==new and repair['repaired']['capture']['native']==repair['undone']['capture']['native']==repair['redone']['capture']['native'],'repair shared Undo/Redo SAME unresolved source and SAME Native model')
 control=r['blockedAnchor'];bad=copy.deepcopy(control['good']);one([v for v in bad['dimensions']if v['dimensionId']=='height'],'layout-only height edit')['label']=[80,70]
 need(control['good']==repair['definition']and control['bad']==bad and control['prior']==repair['repaired'],'obstruction is a SEPARATE exact one-label metadata edit after real Native repair')
 negative=one([x for x in r['observations']if x['label']==control['observationLabel']=='Blocked height label retains available repaired Native facts'],'actual blocked-layout Native read')
 need(negative['definition']==bad and negative['before']==negative['after']==control['published']==control['before']==control['after'] and negative['read']['status']=='available'and all(v['status']=='available'for key in('datumFeatures','requirements')for v in negative['read']['observation'][key]),'layout obstruction preserves actual available repaired geometry and all accepted state')
 publication=one([m for m in r['metadata']if m['label']=='Deliberate original height obstruction as separate layout edit'],'actual layout publication')
 need(publication['action']=='replace'and publication['before']==control['prior']and publication['after']==control['published']and publication['definition']==bad,'ordinary separate shared metadata transaction, not hidden repair rewrite')
 layout=height_layout(negative);B=layout['box'];top=one([v for v in bad['views']if v['basis']=='top'],'actual obstruction view');frame=one([v['frame']for v in negative['read']['observation']['viewFrames']if v['viewId']==top['viewId']],'actual protected top frame');scale=bad['sheet']['scale']['numerator']/bad['sheet']['scale']['denominator']
 anchors=[one([v for v in negative['read']['observation']['datumFeatures']if v['symbol']=='A'],'actual A')['facts']['anchor'],one([v for v in negative['read']['observation']['requirements']if v['kind']=='surface-finish'],'actual finish')['facts']['anchor']]
 projected=[project(top,frame,p,scale)for p in anchors]
 need(all(Fraction(B[0])<Fraction(p[0])<Fraction(B[2])and Fraction(B[1])<Fraction(p[1])<Fraction(B[3])for p in projected),'BOTH actual repaired Native anchors lie strictly INSIDE actual declared height text box, independently proving original obstruction')
 w=one([v for v in r['writes']if v['sequence']==control['writeSequence']],'actual submitted blocked-anchor export');error={'name':'Error','code':'RESOURCE_LIMIT','message':'The actual requirement anchor or port has no clear supported paper domain.','committed':False,'possiblyCommitted':False}
 need(w['kind']=='expected-prewrite-refusal'and w['label']=='Repaired anchor inside declared height text'and w['phase']=='settled-prewrite-refusal'and w['error']==error and w['before']==control['before']and w['after']==control['after']and'result'not in w,'precise actual no-clear-domain refusal without accepted write/state change')
 need(type(w['commandOrdinal'])is int and 0<=w['commandOrdinal']<len(r['commands']),'actual bounded export command ordinal')
 command=r['commands'][w['commandOrdinal']];need(command['command']=='export-linked-part-drawing-svg'and command['args']=={'revision':control['before']['host']['revision'],'path':w['file']}and command['error']==error and'result'not in command,'error belongs to the exact actual public export request')
 for absence in(w['beforeAbsence'],w['afterAbsence']):
  need(str(absence['windowId'])==str(w['windowId'])and absence['owner']==w['beforeAbsence']['owner'],'same actual owned window/Files owner across complete absence proofs')
  for inventory in('browserEntries','serverEntries'):
   entries=absence[inventory];need(type(entries)is list and len(entries)<=4096 and all(type(v)is dict for v in entries),'actual complete bounded own root inventory')
   need(not any(v.get('path')==w['file']or v.get('name')==w['file'][1:]for v in entries),'independent actual browser/server inventory membership proves blocked-anchor file absent, not a status flag')
 refusal=one([v for v in r['refusals']if v['label']==w['label']],'precise layout refusal');need(refusal['before']==control['before']and refusal['after']==control['after']and refusal['error']==error,'all-state refusal evidence agrees with real submitted write')
 undo=one([v for v in r['travels']if v['label']=='Blocked-anchor layout Undo restores fixed initial height label'],'real layout Undo')
 need(undo['direction']=='undo'and undo['kind']=='metadata'and undo['before']==control['after']and undo['after']==control['undone']and control['undone']['drawing']['definition']==control['good'],'actual shared Undo restores initial40 before unchanged repair travel')
 metadata_invariant(control['prior'],control['undone'])
 expected_svgs=['baseline','edited','consumed-target','cap-loss','repaired','final','resaved-final'];need([s['label']for s in r['svgs']]==expected_svgs,'all actual baseline/current/unresolved/repaired/post-Open SVGs')
 artifacts=[]
 for s in r['svgs']:
  raw=(directory/s['savedFile']).read_bytes();need(len(raw)==s['byteLength']and sha(raw)==s['sha256'],'actual SVG server-byte artifact custody')
  candidates=[x for x in r['observations']if x['before']==s['before']and x['definition']==s['definition']]
  row=one(candidates[-1:],'actual same-state protected Native metadata/projection read BEFORE SVG')
  need(s['result']['revision']==s['before']['host']['revision'],'actual issued SVG document revision')
  inspected=inspect_svg(raw,s,row)
  if s['label']=='repaired':need(inspected['repairedNontrivialLeader']is not None and inspected['repairedNontrivialLeader']['vertices']>2,'actual repaired SVG contains necessary routed leader, no straight-path shortcut')
  artifacts.append({'file':s['savedFile'],'result':inspected})
 last=r['observations'][-1];need(last['expected']['diameter']==14 and last['definition']['requirements'][0]['zone']['value']==.20 and last['expected']['datumLevel']==0,'genuine healthy source/requirement reedit AFTER third native Open')
 return{'status':'PASS','scope':'finite native-linked datum/position/Ra/DECLARED clearance authoring, geometry-binding lifecycle/three native cycles/actual visible SVG; NOT manufactured conformance, standards compliance or whole Gate1','sourceCoordinateBudgetMm':FINE,'sourceCoordinateBudgetPm':50,'observations':len(observed),'refusals':len(r['refusals']),'actorCustody':actor_evidence,'blockedAnchor':{'declaredHeightBox':B,'actualProjectedAnchors':projected,'recoveredBySharedUndo':True},'archives':archives,'artifacts':artifacts,'requirementsAreAuthoredIntent':True,'manufacturedConformance':False}
if __name__=='__main__':
 need(len(sys.argv)==3,'WHOLE NEW_FIRST_ORACLE_JSON');out=Path(sys.argv[2]);need(not out.exists(),'preserve FIRST oracle report')
 try:result=check(sys.argv[1])
 except Exception as e:result={'status':'FAIL','error':str(e)};out.write_text(json.dumps(result,indent=2)+'\n');raise
 out.write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
