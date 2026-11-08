#!/usr/bin/env python3
"""Run only after the ONE complete public UI workflow, never a product codec."""
import hashlib, importlib.util, json, sys
from pathlib import Path


def load(name,file):
    spec=importlib.util.spec_from_file_location(name,file); module=importlib.util.module_from_spec(spec); spec.loader.exec_module(module); return module


def main(folder):
    test=Path(__file__).resolve().parents[1]
    math=load('frozen_c12_box_oracle',test/'wizard-draft-history-public-workflow'/'check.py')
    archive=load('independent_native_archive',test/'native-cad-container'/'archive_oracle.py')
    need=math.require;r=json.loads((folder/'receipt.json').read_text());b=r['binding'];build=r['build']
    need(r['status']=='PASS','whole workflow must finish before oracle')
    need(r['sourcePins']==r['sourcePinsAfter'] and r['ownedContextClosed'] and r['sharedBrowserDisconnectedOnly'],'source freeze and owned cleanup')
    need(all(r[k] is False for k in ('privateAuthoring','sourceSeeds','fakeUI')),'normal public authoring and real gestures')
    expected=[('Real splitter before box',0),('Real UI Undo from passive prefix',1),('Real UI Redo to passive prefix',0),('Real UI repeated Undo',1),
      ('Real selected feature EDIT',-1),('UI Undo after selected EDIT',1),('Real backward arrow',0),('Real forward arrow',1),
      ('Real comma history shortcut',0),('Real period history shortcut',1),('Real floating history row',-1),('Real floating Finish History Editing',1),
      ('Public registered empty prefix',-1),('Real UI Undo after draft Cancel',1),('UI width Undo after12',1),('UI width Redo12',1),('UI width Undo after14',1),('UI width Redo14',1)]
    need([(x['label'],x['expectedPointer']) for x in r['navigation']]==expected,'complete real navigation/UI travel chain')
    widths={'UI width Undo after12':10,'UI width Redo12':12,'UI width Undo after14':12,'UI width Redo14':14}
    for row in r['navigation']:
        before,after=row['before'],row['after'];width=widths.get(row['label'],10)
        need(after['view']['pointer']==row['expectedPointer'] and after['view']['wizard']['active'] is False,'published passive expected position')
        need(after['capture']['journal']['revision']!=before['capture']['journal']['revision'],'actual journal-backed navigation/travel token change')
        math.source_and_ids(after['capture']['native'],b,width,build);math.clean_owner(after)
        if row['kind']=='position':need(before['capture']['native']==after['capture']['native'],'navigation preserves full authored source/history/IDs/counters/material/presentation')
        if row['expectedPointer']<1:need(after['capture']['solids']['bodies']==[],'actual prefix contains no invented box')
    initial=r['observations'][0]['before']['view']['journalData'];after=r['navigation'][1]['after']['view']['journalData']
    need(after['cursor']==initial['cursor'] and after['revision']==initial['revision']+2 and len(after['entries'])==initial['cursor']+1,'first real UI Undo consumes exactly the registered position entry')
    need(after['entries'][:initial['cursor']]==initial['entries'][:initial['cursor']],'original journal prefix preserved')
    entry=after['entries'][initial['cursor']]
    need(entry['kind']=='history-position' and entry['beforePointer']==1 and entry['afterPointer']==0 and entry['beforeSignature']==entry['afterSignature'],'actual modern position delta')
    repeated=r['navigation'][3]['after']['view']['journalData'];need(repeated['cursor']==initial['cursor'] and repeated['revision']==initial['revision']+4 and repeated['entries']==after['entries'],'UI Redo+Undo use the same journal row')
    d=r['draftRefusal'];need(any('History navigation refused: UNAVAILABLE.' in text for text in d['toasts']),'actual visible bounded navigation refusal');need(d['draft']['view']['wizard']['active'] is True and d['draft']['view']['wizard']['request']['params']['depth']==21,'genuine active PLANE draft')
    need(math.ui_content(d['draft'])==math.ui_content(d['preview']) and d['rejected']==d['draft'],'real navigation refusal preserves raw accepted state and draft')
    need(d['cancelled']['view']['pointer']==-1 and not d['cancelled']['view']['wizard']['active'] and math.ui_content(d['cancelled'])==math.ui_content(d['preview']),'normal Cancel preserves accepted prefix')
    need(len(r['observations'])==16,'complete16 native observations')
    for row in r['observations']:math.observation(row,b,build)
    need([s['label'] for s in r['saves']]==['width12','width14'],'two Save/sync/freshOpen cycles')
    for row in r['saves']:
        file=folder/row['savedFile'];raw=file.read_bytes();need(len(raw)==row['bytes'] and hashlib.sha256(raw).hexdigest()==row['sha256'],'actual native browser/server bytes')
        info=archive.read_archive(file);model=info['envelope']['project']['model'];native=row['before']['capture']['native']
        need(row['result']['committed'] is True and row['result']['persistence']=='browser','real Save outcome')
        need(all(model[k]==native[k] for k in ('history','counters','expressions')),'native exact authored graph/counters')
        need(info['rawSketches']=={s['id']:s['source'] for s in native['sketches']},'exact source bytes and IDs')
        need(row['after']['capture']==row['before']['capture'],'Save preserves accepted native/J state')
    opens=[x for x in r['observations'] if x['label'] in ('Fresh native Open after wizard recovery','Reedited/resaved native Open')]
    need(len(opens)==2 and all(x['before']['capture']['journal']['canUndo'] is False for x in opens),'fresh native Open resets session Undo')
    result={'status':'PASS','scope':'finite real UI navigation/UndoRedo and native persistence; principal Apply remains OPEN','navigationEvents':18,'nativeObservations':16,'nativePoints':48,'savedArchives':2,'sourcePins':r['sourcePins']}
    (folder/'independent-check.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))


if __name__=='__main__':
    if len(sys.argv)!=2:raise SystemExit('usage: check.py EVIDENCE_AFTER_WHOLE_PASS')
    main(Path(sys.argv[1]).resolve())
