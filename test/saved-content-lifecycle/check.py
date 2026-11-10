#!/usr/bin/env python3
"""Independent AFTER reader. No application/native code or validator import."""
import hashlib,importlib.util,json,math,re,subprocess,sys
from pathlib import Path
sys.dont_write_bytecode=True
sha=lambda x:hashlib.sha256(x).hexdigest()
def need(ok,msg):
 if not ok:raise ValueError(msg)
def load(p):return json.loads(Path(p).read_text())
def main(root,output):
 root=Path(root);out=Path(output);need(not out.exists(),'New FIRST output');r=load(root/'receipt.json')
 need(r['status']=='PASS' and r['ownedContextsRetired'] and r['pendingMutation'] is None,'Terminal settled whole')
 need(r['sourcePins']==r['sourcePinsAfter'] and r['checkoutsBefore']==r['checkoutsAfter'],'Source custody unchanged')
 for row in r['sourceSnapshots']:
  data=(root/row['snapshot']).read_bytes();need(sha(data)==row['sha256']==r['sourcePins'][row['role']+':'+row['relative']],'Frozen source bytes and before/after roster');need(len(data)<=8388608,'Bounded static producer source');blob=subprocess.run(['git','-C',row['root'],'show',row['commit']+':'+row['relative']],capture_output=True,check=True).stdout;need(blob==data,'Independent actual Git producer blob')
 need(r['workers'] and all(w['destroyed'] for w in r['workers']),'Actual observed owned codec retirement');need(not r['browserDialogs'],'No browser-native modals')
 observations={x['label']:x for x in r['observations']};expected={'Fresh empty model':False,'Authored representative project':True,'Width edit':True,'Refused stale save retains dirty content':True,'Undo returns exactly to saved content':False,'Redo restores unsaved content':True,'Fresh native Open':False,'Reopened edit':True,'Accepted New baseline':False,'Original own source restored after New':False,'Fresh Unicode JSON Open':False}
 for label,dirty in expected.items():
  row=observations[label];need(row['expected'] is dirty and row['info']['dirty'] is dirty and row['guard']['guard'] is dirty and row['guard']['cache']['equal'] is (not dirty),'Actual dirty and close cache '+label)
 labels={s['label']:s for s in r['saves']};need(set(labels)=={'rectangles-initial','rectangles-edited','unicode-initial','unicode-boundary'},'All saved revision families')
 spec=importlib.util.spec_from_file_location('independent_native_archive',Path(__file__).resolve().parents[1]/'native-cad-container/archive_oracle.py');archive=importlib.util.module_from_spec(spec);spec.loader.exec_module(archive)
 artifacts={}
 for label,s in labels.items():
  p=root/s['artifact']['savedFile'];raw=p.read_bytes();need(len(raw)==s['artifact']['bytes'] and sha(raw)==s['artifact']['sha256'],'Actual complete saved file hash')
  writes=[w for w in r['writes'] if w['submission']['label']==label];need(len(writes)==1 and writes[0]['acknowledged']==s['result'] and writes[0]['settled']==s['artifact'],'Submitted/acknowledged/server-settled file')
  need(s['result']['persistence']=='browser' and s['result']['dirty'] is False,'Known browser save')
  if s['format']=='cad':
   decoded=archive.read_archive(p);e=decoded['envelope'];need(decoded['sha256']==s['artifact']['sha256'],'Independent native container readback')
  else:e=archive.parse_json(raw)
  need(e['format']=='codi-jsketcher-project' and e['unit']=='millimeter' and e['version'] in (2,3),'Supported persisted authored envelope')
  before=s['before']['native'];need(e['project']['model']['history']==before['history'] and e['project']['model']['expressions']==before['expressions'] and e['project']['model']['counters']==before['counters'],'Preserved authored history/expression/counters')
  actual={x['id']:x['data'] for x in e['project']['sketches']};expected_source={x['id']:archive.parse_json(x['source'].encode()) for x in before['sketches']};need(actual==expected_source,'Independent exact original source sketch readback')
  artifacts[label]={'sha256':sha(raw),'bytes':len(raw),'envelope':e}
 need(len(artifacts['rectangles-initial']['envelope']['project']['sketches'])==16 and len(artifacts['rectangles-edited']['envelope']['project']['sketches'])==16,'Representative16sketch source retained')
 for label,width in [('rectangles-initial',100),('rectangles-edited',120)]:
  e=artifacts[label]['envelope'];by_id={x['id']:x['data'] for x in e['project']['sketches']}
  for index,created in enumerate(r['rectangles']):
   sketch=by_id[created['faceId']];segments=sketch['objects'];need(len(segments)==4 and all(x['type']=='Segment' for x in segments),'Four real source edges per rectangle')
   points=[(x['data'][end]['x'],x['data'][end]['y']) for x in segments for end in ('a','b')];xs=[p[0] for p in points];ys=[p[1] for p in points];expected_width=width if index==0 else 100
   need(min(xs)==index*200 and max(xs)==index*200+expected_width and min(ys)==0 and max(ys)==50,'Independent actual rectangle width/height/origin')
   need(len(set(points))==4 and all(points.count(p)==2 for p in set(points)),'Closed degree-two actual boundary')
 # Width change must be an authored change, not just a dirty flag transition.
 need(artifacts['rectangles-initial']['envelope']!=artifacts['rectangles-edited']['envelope'],'Edited native authored definition differs')
 unicode=r['unicode'];name='Boundary-🌐-material';need(unicode['materialName']==name,'Original public Unicode material requirement')
 first=(root/labels['unicode-initial']['artifact']['savedFile']).read_text();text=(root/labels['unicode-boundary']['artifact']['savedFile']).read_text();need('🌐' in first and '🌐' in text and '\ufffd' not in text,'Lossless astral Unicode persisted bytes')
 index=len(text[:text.index('🌐')].encode('utf-16-le'))//2;initial=len(first[:first.index('🌐')].encode('utf-16-le'))//2
 need(index%16384==16383 and index==unicode['boundaryIndex'] and initial==unicode['initialIndex'],'Independent real surrogate-boundary position')
 script=unicode['script'];initial_script=artifacts['unicode-initial']['envelope']['project']['model']['expressions'];encoded_length=len(json.dumps(initial_script,ensure_ascii=False,separators=(',',':')))-2;need(encoded_length==unicode['initialEncodedLength'],'Actual old expression encoding length');padding=(16383-(initial+len('pad = 1')-encoded_length)%16384+32768)%16384;need(unicode['padding']==padding and script=='pad = '+' '*padding+'1','One independently derived valid whitespace-only expression pad')
 need(artifacts['unicode-boundary']['envelope']['project']['model']['expressions']==script,'Exact padded authored expression persisted')
 for label in ['unicode-initial','unicode-boundary']:
  need(any(x.get('name')==name for x in artifacts[label]['envelope']['manufacturing']['materials']),'Original assigned Unicode material preserved')
 need(len(r['refusals'])==1,'One real stale Save refusal')
 refusal=r['refusals'][0];need(refusal['error']['message']=='The model changed; inspect it before saving.' and refusal['before']==refusal['after'] and refusal['fileBefore']==refusal['fileAfter'],'Exact refused Save preserves authored state and own file generation')
 dialogs=r['dialogs'];need(any(x['label']=='Cancel actual New' and x['result']['status']=='cancelled' for x in dialogs),'Cancelled New');need(any(x['label']=='Cancel actual Open' and x['result']['status']=='cancelled' for x in dialogs),'Cancelled Open');need(any(x['label']=='Explicitly discard to new model' and x['result']['status']=='opened' for x in dialogs),'Explicit discard New');need(any(x['label']=='Actual dirty window close cancelled' and x['preserved'] for x in dialogs),'Dirty close cancel');need(sum(x['label']=='Actual clean close without discard dialog' and x['closed'] for x in dialogs)>=2,'Actual clean close after cache adoption')
 need(len(r['resources'])>=4,'Representative passive resource observations')
 for row in r['resources']:
  need(row['codec'] and isinstance(row['mainUsedHeap'],(int,float)) and math.isfinite(row['mainUsedHeap']) and row['mainUsedHeap']>=0,'Actual main/codec samples')
  need(all(isinstance(x['usedSize'],(int,float)) and math.isfinite(x['usedSize']) and x['usedSize']>=0 for x in row['codec']),'Finite actual codec heap samples')
  need(row['mainUsedHeap']+sum(x['usedSize'] for x in row['codec'])<=1073741824,'Finite sampled JS1GiB bound')
  need(all(math.isfinite(x['duration']) and 0<=x['duration']<=1000 for x in row['tasks']),'Finite observed Main task bound')
 need(bool(r['cacheSamples']),'Natural cache observations present')
 for row in r['cacheSamples']:
  if row['cache']['equal'] is None:need(row['guard'] is True,'Unknown actual cache cannot close clean')
 need(r['unknownCacheObserved']==any(x['cache']['equal'] is None for x in r['cacheSamples']),'Honest observed unknown disposition')
 need(r['sourceOnlyObligations'],'Unexercised obligations remain explicit')
 result={'status':'PASS','scope':r['scope'],'wholeReceiptSha256':sha((root/'receipt.json').read_bytes()),'artifacts':{k:{x:v[x] for x in ('sha256','bytes')} for k,v in artifacts.items()},'dirtyObservations':len(expected),'ownedCodecWorkers':len(r['workers']),'sourceOnlyObligations':r['sourceOnlyObligations']};out.write_text(json.dumps(result,indent=2)+'\n');return result
if __name__=='__main__':
 need(len(sys.argv)==3,'WHOLE NEW_FIRST_OUTPUT');print(json.dumps(main(*sys.argv[1:])))
