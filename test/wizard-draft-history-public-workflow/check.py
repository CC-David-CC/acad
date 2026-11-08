#!/usr/bin/env python3
"""Independent after-whole-workflow checks. Never creates/authors a model.
Uses the existing nonproduction ZIP/CRC/SHA/source reader, not the app codec.
No execution is claimed by committing this preparation.
"""
import copy, hashlib, importlib.util, json, math, sys
from pathlib import Path


def require(ok, message):
    if not ok:
        raise ValueError(message)


def near(actual, expected, message):
    require(isinstance(actual, (int, float)) and math.isfinite(actual)
            and abs(actual-expected) <= 1e-6, message)


def ui_content(state):
    result = copy.deepcopy(state)
    del result['view']['wizard']
    del result['capture']['solids']['revision']
    del result['capture']['journal']['revision']
    del result['host']['revision']
    return result


def source_and_ids(native, binding, width, build):
    history = native['history']
    require([r['type'] for r in history] == ['PLANE', 'WORKER_SOLID_BOX_V1'], 'one original two-entry graph')
    plane, box = [r['params'] for r in history]
    require(set(plane) == {'featureId', 'orientation', 'depth', 'datum'}, 'exact genuine independent plane intent')
    require(int(plane['featureId']) == binding['plane']['featureId'] and plane['orientation'] == 'XY'
            and plane['depth'] == 20 and plane['datum'] is None, 'source plane identity/depth remain exact')
    require(box == dict(version=1, unit='millimeter', engine='occ', engineRevision=build,
                        featureId=binding['box']['featureId'], x=0, y=0, z=0,
                        width=width, depth=10, height=10), 'exact public authored box intent')
    require(native['counters'] == binding['counters'], 'feature high-water/counters preserved')
    require(native['expressions'] == '' and native['presentation'] is None, 'literal millimeter fixture')
    require(native['sketches'] == binding['originalSketches'] and len(native['sketches']) == 1,
            'same complete actual source inventory/bytes')
    sketch = native['sketches'][0]
    require(sketch['id'] == binding['plane']['faceId'] and sketch['source'] == native['source'], 'actual source binding, no parsed IDs')
    data = json.loads(sketch['source'])
    require(data['objects'] == data['dimensions'] == data['labels'] == [] and data['constants'] == '', 'source remains genuinely empty')
    require(len(data['stages']) == 1 and data['stages'][0]['constraints'] == data['stages'][0]['generators'] == [], 'no hidden sketch equations/generators')
    require(all(data['boundary'][key] == [] for key in ('lines', 'arcs', 'circles', 'nurbses')), 'no hidden profile')
    require(data['metadata']['boundaryFrame'] == dict(origin=[0,0,20], x=[1,0,0], y=[0,1,0], z=[0,0,1]), 'actual source-frame identity/depth')


def clean_owner(state):
    owner = state['ownership']; usage = owner['resources']
    require(owner['processing'] is False and usage['cleanupFailed'] is False
            and all(usage[k] == 0 for k in ('candidates','accepted','mounts'))
            and usage['owners'] == usage['detached'], 'candidate/native owner cleanup')


def observation(row, binding, build):
    before, after, width = row['before'], row['after'], row['width']
    require(before == after, 'raw read-only state and all tokens preserved')
    source_and_ids(before['capture']['native'], binding, width, build)
    require(before['view']['pointer'] == 1 and before['view']['wizard']['request'] is None
            and before['view']['wizard']['active'] is False, 'real full tip after recovery')
    bodies = before['capture']['solids']['bodies']; require(len(bodies) == 1, 'one actual native box')
    body = bodies[0]; m = body['metrics']
    require(body['id'] == binding['box']['outputId'] and body['featureId'] == binding['box']['featureId'], 'actual producer/output binding')
    require(m['nativeValidity']['valid'] is True and m['resultKind'] == 'single-solid' and m['solidCount'] == 1, 'native positive single solid')
    require('sha256:'+m['runtime']['jsSha256']+':'+m['runtime']['wasmSha256'] == build, 'exact measured native cohort')
    near(m['nativeVolume'], width*10*10, 'independent analytic box volume')
    for key, values in [('min',[0,0,0]),('max',[width,10,10])]:
        require(len(m['nativeBounds'][key]) == 3, 'three axes')
        for actual, expected in zip(m['nativeBounds'][key], values): near(actual, expected, 'analytic box bounds')
    clean_owner(before)
    request, query = row['input'], row['query']
    require(request['points'] == [[width/2,5,5],[width+1,5,5],[0,5,5]], 'independently chosen solid/exterior/boundary points')
    require(query['quality'] == 'native-re-evaluation-observation' and query['version'] == 1, 'genuine native query quality')
    for key in ('revision','bodyId','featureId','engine','engineRevision','unit'): require(query[key] == request[key], 'query binding '+key)
    require(request['bodyId'] == body['id'] and request['featureId'] == body['featureId']
            and request['revision'] == before['capture']['solids']['revision'] and request['engineRevision'] == build, 'query current producer/build/revision')
    require(query['points'] == [dict(point=p,classification=c) for p,c in zip(request['points'],['inside','outside','boundary'])], 'actual analytic native point results')


def cycle(row, binding, build):
    require(row['kind'] in ('round-trip-no-op','changed'), 'finite real draft kind')
    baseline, preview, draft, cancelled, recovered = [row[k] for k in ('baseline','preview','draft','cancelled','recovered')]
    source_and_ids(baseline['capture']['native'], binding, 10, build)
    for state in (preview, draft, cancelled, row['redo']):
        require(state['view']['pointer'] == -1 and state['capture']['solids']['bodies'] == [], 'accepted empty prefix, no invented body')
        source_and_ids(state['capture']['native'], binding, 10, build); clean_owner(state)
    require(preview['view']['wizard']['request']['type'] == 'PLANE' and preview['view']['wizard']['request']['params']['depth'] == 20
            and preview['view']['wizard']['active'] is False and preview['view']['wizard']['insertion'] is None, 'genuine private-issued passive PLANE preview')
    require(draft['view']['wizard']['active'] is True and draft['view']['wizard']['insertion'] is None, 'actual no-op/changed draft is active')
    expected = copy.deepcopy(preview['view']['wizard']['request']['params'])
    if row['kind'] == 'changed': expected['depth'] = 21
    require(draft['view']['wizard']['request']['params'] == expected, 'real UI request changes only intended draft depth')
    require(ui_content(draft) == ui_content(preview), 'UI draft leaves accepted source/model/J content exact')
    failure = row['failure']; require(failure['code'] == 'UNAVAILABLE' and failure['committed'] is False and failure['possiblyCommitted'] is False, 'precise competing registered history refusal')
    require(row['rejected'] == draft, 'refusal preserves every raw state token/field')
    require(cancelled['view']['wizard']['active'] is False
            and cancelled['view']['wizard']['request']['params'] == preview['view']['wizard']['request']['params']
            and ui_content(cancelled) == ui_content(preview), 'Cancel only discards draft; accepted prefix/J exact')
    before, after = baseline['view']['journalData'], recovered['view']['journalData']
    require(before is not None and after is not None and after['document'] == before['document'], 'actual full-tip journal custody')
    require(after['cursor'] == before['cursor'] and after['revision'] == before['revision']+2
            and len(after['entries']) == before['cursor']+1 and after['entries'][:before['cursor']] == before['entries'][:before['cursor']], 'prefix append and normal Undo chronology')
    entry = after['entries'][before['cursor']]
    require(entry == row['positionEntry'] and entry['kind'] == 'history-position' and entry['beforePointer'] == 1
            and entry['afterPointer'] == -1 and entry['beforeSignature'] == entry['afterSignature'], 'actual position entry, no revision-string parsing')
    require(recovered['view']['pointer'] == row['returned']['view']['pointer'] == 1
            and row['redo']['view']['wizard']['active'] is False, 'normal journal Redo/Undo returns actual prefix/tip')
    for state in (recovered,row['returned']): source_and_ids(state['capture']['native'], binding, 10, build)


def main(directory):
    receipt = json.loads((directory/'receipt.json').read_text())
    require(receipt['status'] == 'PASS', 'whole workflow must finish before independent checks')
    require(receipt['sourcePins'] == receipt['sourcePinsAfter'] and receipt['ownedContextClosed'] is True
            and receipt['sharedBrowserDisconnectedOnly'] is True, 'source freeze/owned context cleanup')
    require(all(receipt[key] is False for key in ('privateAuthoring','sourceSeeds','fakeUI')), 'public authoring/trusted events only')
    binding, build = receipt['binding'], receipt['build']
    require([row['kind'] for row in receipt['cycles']] == ['round-trip-no-op','changed'], 'both no-op and actual changed draft cycles')
    for row in receipt['cycles']: cycle(row,binding,build)
    require(len(receipt['observations']) == 14 and {row['width'] for row in receipt['observations']} == {10,12,14}, 'complete recovery/edit/travel/Open native observations')
    for row in receipt['observations']: observation(row,binding,build)
    spec=importlib.util.spec_from_file_location('c12_independent_archive',Path(__file__).resolve().parents[1]/'native-cad-container'/'archive_oracle.py')
    reader=importlib.util.module_from_spec(spec); spec.loader.exec_module(reader)
    require([row['label'] for row in receipt['saves']] == ['width12','width14'], 'two normal native Save/sync/Open cycles')
    for row in receipt['saves']:
        require(row['result']['committed'] is True and row['result']['persistence'] == 'browser', 'actual Save outcome')
        raw=(directory/row['savedFile']).read_bytes()
        require(len(raw) == row['bytes'] and hashlib.sha256(raw).hexdigest() == row['sha256'], 'actual saved server bytes')
        archive=reader.read_archive(directory/row['savedFile']); envelope=archive['envelope']; model=envelope['project']['model']; before=row['before']['capture']['native']
        require(envelope['version'] == 2 and envelope['unit'] == 'millimeter', 'drawing-free current native envelope')
        require(row['after']['capture'] == row['before']['capture'], 'Save does not alter accepted native/J/metrics')
        require(all(model[key] == before[key] for key in ('history','counters','expressions')), 'exact native authored graph/counters')
        require(archive['rawSketches'] == {r['id']:r['source'] for r in before['sketches']}, 'exact accepted source bytes retained')
        source_and_ids(before,binding,row['width'],build)
    opens=[row for row in receipt['observations'] if row['label'] in ('Fresh native Open after wizard recovery','Reedited/resaved native Open')]
    require(len(opens) == 2 and all(row['before']['capture']['journal']['canUndo'] is False for row in opens), 'fresh native Open resets session journal')
    result=dict(status='PASS',scope='finite actual PLANE draft Cancel plus shared history and native persistence; Apply remains OPEN',cycles=2,nativeObservations=len(receipt['observations']),nativePoints=3*len(receipt['observations']),savedArchives=2,sourcePins=receipt['sourcePins'])
    (directory/'independent-check.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps(result,indent=2))


if __name__ == '__main__':
    require(len(sys.argv) == 2, 'usage: check.py EVIDENCE_AFTER_WHOLE_PASS')
    main(Path(sys.argv[1]).resolve())
