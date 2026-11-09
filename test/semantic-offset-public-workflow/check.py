#!/usr/bin/env python3
"""After-whole independent source/geometry/archive oracle; no product imports.
make-bad-cache only prepares an own negative Open fixture during the full flow.
"""
import binascii,hashlib,json,math,sys,zlib
from decimal import Decimal,localcontext
from fractions import Fraction
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'native-cad-container'))
import archive_oracle as arc
B=Fraction(1,20000000)
def require(ok,text):
    if not ok:raise ValueError(text)
def one(rows,text):require(len(rows)==1,'one '+text);return rows[0]
def F(value):
    require(type(value) in (int,float) and math.isfinite(value),'finite represented numeric geometry')
    return Fraction.from_float(value) if type(value) is float else Fraction(value)
def D(value):
    value=value if isinstance(value,Fraction) else F(value)
    return Decimal(value.numerator)/Decimal(value.denominator)
def near(value,wanted):require(abs(F(value)-Fraction(wanted))<=B,'independent source50pm coordinate')
def source(state,b):return json.loads(one([r for r in state['capture']['native']['sketches'] if r['id']==b['faceId']],'actual source')['source'])
def settled(state):
    o=state['ownership'];r=o['resources'];require(not o['processing'] and not r['cleanupFailed'] and all(r[k]==0 for k in ('accepted','candidates','mounts')) and r['owners']==r['detached'] and not state['capture']['solids']['bodies'],'no stale/retained candidate/kernel result')
def quantities(row):
    definitions=row['definitions'];raw=row['before']['capture']['native']['expressions']
    if not definitions:require(raw=='','empty authoritative typed source');return {}
    require(len(definitions)==3 and definitions[0]['name']=='gap' and definitions[0]['dimension']=='length' and definitions[1]=={'name':'spare','dimension':'length','expression':'mm(7)'} and definitions[2]=={'name':'angle','dimension':'angle','expression':'deg(30)'},'exact typed definitions/literal unrelated names')
    prefix='codi-physical-parameters:1\n';require(raw.startswith(prefix) and json.loads(raw[len(prefix):])==definitions,'actual authoritative expression source')
    t=definitions[0]['expression'];require(t.startswith('mm(') and t.endswith(')'),'canonical unit expression');return {'gap':Fraction(t[3:-1])}
def scalar(value,quantities):
    if type(value) is str and value in quantities:return quantities[value]
    try:return F(value) if type(value) is float else Fraction(value)
    except (ValueError,ZeroDivisionError):raise ValueError('unsupported actual distance field/name')
def native_equal(a,b):
    for k in ('source','sketches','history','counters','expressions','presentation'):require(a['capture']['native'][k]==b['capture']['native'][k],'exact native '+k)
def observation(row,original):
    b=row['b'];s=source(row['before'],b);base=original['source'];objects={o['id']:o for o in s['objects']};q=quantities(row);require(len(objects)==len(s['objects']) and s['version']==3 and len(s['stages'])==1,'unique V3 ordinary source');require(s['metadata']==base['metadata'] and s['boundary']==base['boundary'] and all(not x for x in s['boundary'].values()),'same actual frame/empty-boundary authority')
    require({k:v for k,v in s.items() if k not in ('objects','stages')}=={k:v for k,v in base.items() if k not in ('objects','stages')},'all non-geometry authored source fields exact')
    require(one([r for r in row['before']['capture']['native']['sketches'] if r['id']==b['controlFaceId']],'actual other source')['source']==original['control'],'independent source exact')
    control=json.loads(original['control']);require(len(control['objects'])==1 and control['objects'][0]['id']==b['foreignRoot'] and control['objects'][0]['type']=='Point' and control['objects'][0]['data']=={'x':250,'y':250},'genuine unrelated Point/foreign source')
    roots={o['id']:o for o in base['objects']};require(set(roots)=={b['lineId'],b['circleId'],b['unrelatedId']},'all original public roots, no seed')
    for id,o in roots.items():require({k:v for k,v in objects[id].items() if k!='data'}=={k:v for k,v in o.items() if k!='data'},'exact original root identity/type/role/stage')
    line=objects[b['lineId']];circle=objects[b['circleId']];require(line['type']=='Segment' and circle['type']=='Circle' and objects[b['unrelatedId']]['data']=={'x':77,'y':99},'actual independent source types/unrelated free Point')
    for point,want in ((line['data']['a'],row['lineA']),(line['data']['b'],row['lineB']),(circle['data']['c'],row['center'])):
        for key,value in zip(('x','y'),want):near(point[key],value)
    require(circle['data']['r']==row['radius'],'source radius independent of center/distance')
    actual_rows=s['stages'][0]['constraints'];require(len(actual_rows)==(1 if row['hasRadius'] else 0),'complete original authored equation census')
    if row['hasRadius']:
        c=actual_rows[0];require(c['typeId']=='RadiusLength' and c['objects']==[b['circleId']] and set(c['constants'])=={'length'} and scalar(c['constants']['length'],q)==row['radius'],'actual retained RadiusLength equation');require(c['admission']['version']==1 and c['admission']['state'] in ('accepted','redundant'),'actual original row admission')
    require(len(row['inspection']['constraints'])==len(actual_rows),'actual cold equation census')
    for index,(stored,cold) in enumerate(zip(actual_rows,row['inspection']['constraints'])):require(cold['index']==index and cold['stage']==stored['stage'] and all(cold[k]==stored[k] for k in ('typeId','objects','constants','admission')),'actual cold/source equation identity/constants/evidence')
    active=[x for x in row['offsets'].values() if x['present']];generators=s['stages'][0]['generators'];inventory=row['inventory'];require(inventory['version']==1 and len(generators)==len(active)==len(inventory['offsets']) and len(objects)==len(roots)+len(active),'complete source/output/generator inventory')
    # Cold projected handles must come from actual owned parent primitives and
    # agree with the original stored source; no generated-ID parsing.
    by_parent={}
    for point in row['inspection']['points']:
        require(point['parentId'] in objects,'actual owned Point parent');by_parent.setdefault(point['parentId'],[]).append(point)
    for id,o in objects.items():
        candidates=[o['data']] if o['type']=='Point' else [o['data']['c']] if o['type']=='Circle' else [o['data']['a'],o['data']['b']]
        ps=by_parent.get(id,[]);require(len(ps)==len(candidates),'all actual native projected children')
        used=set()
        for p in ps:
            at=one([n for n,v in enumerate(candidates) if all(abs(F(p[a])-F(v[a]))<=B for a in ('x','y'))],'unique native-owned source coordinate');require(at not in used,'distinct owned endpoints');used.add(at)
    for label,record in row['offsets'].items():
        side=record['side']
        if not record['present']:require(record['outputId'] not in objects and not any(record['outputId'] in g['generatedObjects'] for g in generators),'removed generator/output absent');continue
        out=objects[record['outputId']];parent=objects[record['sourceId']];g=one([g for g in generators if g['generatedObjects']==[record['outputId']]],'real generator association');require(set(g)=={'typeId','stage','params','generatedObjects'} and g['typeId']=='Offset' and g['stage']==0 and g['params']=={'objects':[parent['id']],'distance':record['raw'],'side':side},'exact semantic intent/actual source/output/side/name')
        require(out['type']==parent['type'] and out['role']==parent['role'] and out['stage']==g['stage'],'same actual type/role/stage')
        distance=scalar(record['raw'],q);require(0<distance<=1000000 and distance==record['value'],'actual resolved typed/literal physical distance')
        r=one([r for r in inventory['offsets'] if r['outputId']==out['id']],'actual public Offset locator');require(r['sourceId']==parent['id'] and r['side']==side and r['distance']==record['raw'] and r['status']=='available' and r['canEdit'],'actual metadata association');near(r['resolvedDistance'],distance);require(not one([r for r in inventory['sources'] if r['id']==out['id']],'derived source row')['canOffset'],'generated output is readonly/ineligible')
        if out['type']=='Circle':
            require(side in ('outward','inward'),'circle semantic side');expected=F(parent['data']['r'])+distance*(1 if side=='outward' else -1);require(expected>Fraction(1,1000000000),'true noncollapsed Circle domain')
            for key in ('x','y'):near(out['data']['c'][key],F(parent['data']['c'][key]))
            require(abs(F(out['data']['r'])-expected)<=B,'independent exact represented radius±distance equation')
        else:
            require(side in ('left','right'),'Segment semantic side');a,z=parent['data']['a'],parent['data']['b'];dx,dy=F(z['x'])-F(a['x']),F(z['y'])-F(a['y']);L=(D(dx)**2+D(dy)**2).sqrt();require(L>Decimal('1e-9'),'nondegenerate actual Segment');sign=1 if side=='left' else -1
            for end in ('a','b'):
                p,v=parent['data'][end],out['data'][end];tx,ty=F(v['x'])-F(p['x']),F(v['y'])-F(p['y']);require(abs(D(tx)+D(dy*distance*sign)/L)<=D(B) and abs(D(ty)-D(dx*distance*sign)/L)<=D(B),'independent requested directed normal offset/end correspondence');require(abs(D(dx*ty-dy*tx)/L-D(distance*sign))<=D(B),'true signed support offset')
            for key in ('x','y'):require(abs((F(out['data']['b'][key])-F(out['data']['a'][key]))-(F(z[key])-F(a[key])))<=B,'same finite endpoint vector, no extension/miter')
    require(row['before']==row['after'],'read-only discovery exact state');settled(row['after'])
def make_bad_cache(directory):
    directory=Path(directory);receipt=json.loads((directory/'receipt.json').read_text());saved=receipt['saves'][-1];info=arc.read_archive(directory/saved['savedFile']);rows=arc.structure((directory/saved['savedFile']).read_bytes());manifest=json.loads(json.dumps(info['manifest']));face=saved['b']['faceId'];id=saved['offsets']['outward']['outputId'];source=json.loads(info['rawSketches'][face]);out=one([o for o in source['objects'] if o['id']==id],'actual genuine output to corrupt');require(out['type']=='Circle','actual output type');old=out['data']['r'];out['data']['r']=old+0.25
    raw=json.dumps(source,ensure_ascii=False,separators=(',',':')).encode();descriptor=one([r for r in manifest['entries'] if r['role']=='sketch' and r['logicalId']==face],'actual source entry');entry=one([r for r in rows if r['path']==descriptor['path']],'physical source member');codec=zlib.compressobj(6,zlib.DEFLATED,-15);compressed=codec.compress(raw)+codec.flush();entry.update({'compressed':compressed,'bytes':len(raw),'crc':binascii.crc32(raw)&0xffffffff});descriptor.update({'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()});manifest['designRevision']=arc.sha(arc.canonical(arc.root_record(manifest)));rows[-1]=arc.manifest_row(manifest);file=directory/'malformed-offset-cache.cad';require(not file.exists(),'exclusive own malformed output');file.write_bytes(arc.rebuild(rows));return {'file':str(file.resolve()),'code':'OFFSET_CACHE_CHANGED','sourceSha256':info['sha256'],'sourceId':face,'outputId':id,'beforeRadius':old,'afterRadius':out['data']['r'],'sha256':arc.sha(file.read_bytes())}
def run(directory):
    directory=Path(directory);r=json.loads((directory/'receipt.json').read_text());require(r['status']=='PASS' and not r['sourceSeeds'] and not r['privateAuthoring'] and not r['fakeReplies'],'actual whole success without fake sources');require(r['coordinateMm']==5e-8 and r['sourcePins']==r['sourcePinsAfter'] and r['ownedContextsRetired'] and r['sharedBrowserDisconnectedOnly'],'source custody/owned cleanup')
    for s in r['sourceSnapshots']:require(arc.sha((directory/s['file']).read_bytes())==s['sha256'],'actual frozen producing source snapshot')
    require(len(r['observations'])>=35 and len(r['travels'])>=25,'complete creation/edit/source/removal/typed travel')
    for row in r['observations']:observation(row,r['original'])
    before_radius=one([x for x in r['observations'] if x['label']=='Source before radius mutation'],'actual radius baseline');radius=one([x for x in r['observations'] if x['label']=='Real RadiusLength8 changes only Circle/output radii, independent center unchanged'],'actual radius change');center=one([x for x in r['observations'] if x['label']=='Actual center edit changes only Circle/output centers, independent radii unchanged'],'actual center change');b=r['binding'];a={o['id']:o for o in source(before_radius['before'],b)['objects']};z={o['id']:o for o in source(radius['before'],b)['objects']};t={o['id']:o for o in source(center['before'],b)['objects']}
    for id in [b['circleId'],radius['offsets']['outward']['outputId'],radius['offsets']['inward']['outputId']]:require(a[id]['data']['c']==z[id]['data']['c'] and z[id]['data']['r']==t[id]['data']['r'],'untouched Circle centers/radii BIT EXACT under independent mutation')
    for id in [b['lineId'],radius['offsets']['left']['outputId'],radius['offsets']['right']['outputId'],b['unrelatedId']]:require(a[id]==z[id]==t[id],'unrelated source/output BIT EXACT under Circle changes')
    require(len(r['refusals'])==15,'complete finite refusal cases including actual bad cache Open');codes=[x['error']['code'] for x in r['refusals']]
    for code,count in [('OFFSET_COLLAPSE',2),('OFFSET_SIDE',1),('OFFSET_TARGET',1),('INVALID_REQUEST',2),('GENERATED_TARGET',1),('INVALID_TARGET',1),('GENERATOR_REFERENCE',1),('UNSUPPORTED_SKETCH',1),('BOUND_DIMENSION',1),('DIMENSION_MISMATCH',1),('OFFSET_DISTANCE',1),('OFFSET_CACHE_CHANGED',1)]:require(codes.count(code)==count,'exact observed layer/code '+code)
    require(sum(x['error']['name']=='AbortError' for x in r['refusals'])==1,'actual stale lifecycle abort')
    for x in r['refusals']:require(x['before']==x['after'] and not x['error']['committed'] and not x['error']['possiblyCommitted'],'exact refusal preservation');settled(x['after'])
    noops=[x for x in r['rows'] if 'no-op' in x['label'] or x['label']=='Exact repeated creation preserves source/J'];require(len(noops)==2 and all(not x['result']['changed'] and not x['result']['authoredUndo'] and x['before']==x['after'] for x in noops),'exact no-op and redo preservation')
    require(len(r['saves'])==2,'two .cad saves');archives=[]
    for x in r['saves']:
        a=arc.read_archive(directory/x['savedFile']);n=x['before']['capture']['native'];require(a['sha256']==x['sha256'] and a['bytes']==x['bytes'] and x['result']['committed'] and x['result']['persistence']=='browser','browser/server-equal normal file');m=a['envelope']['project']['model'];require(m['history']==n['history'] and m['counters']==n['counters'] and m['expressions']==n['expressions'] and len(m['history'])==2 and all(h['type']=='PLANE' for h in m['history']),'one exact two-source authored graph/typed state, no kernel proxy');require(a['rawSketches']=={s['id']:s['source'] for s in n['sketches']} and a['envelope'].get('presentation')==n['presentation'],'exact original raw sources/cache and presentation');require(x['before']['capture']==x['after']['capture'],'Save preserves source/J');archives.append({'file':x['savedFile'],'sha256':a['sha256'],'bytes':a['bytes'],'designRevision':a['manifest']['designRevision']})
    opens=[x for x in r['observations'] if x['label']=='Fresh normal .cad Open retains source-owned offset'];require(len(opens)==2,'two normal fresh Opens')
    for op,saved in zip(opens,r['saves']):native_equal(op['before'],saved['before']);require(not op['before']['capture']['journal']['canUndo'] and not op['before']['capture']['journal']['canRedo'],'session journal reset')
    bad=r['malformed'];info=arc.read_archive(directory/bad['file']);base=arc.read_archive(directory/r['saves'][-1]['savedFile']);require(info['sha256']==bad['sha256'] and base['sha256']==bad['sourceSha256'],'own malformed artifact has real valid ZIP/CRC/hash, no integrity shortcut');changed=json.loads(info['rawSketches'][bad['sourceId']]);before=json.loads(base['rawSketches'][bad['sourceId']]);target=one([o for o in changed['objects'] if o['id']==bad['outputId']],'one actual cache change');require(target['data']['r']==bad['afterRadius'] and bad['afterRadius']==bad['beforeRadius']+0.25,'actual finite derived radius corruption');target['data']['r']=bad['beforeRadius'];require(changed==before and {k:v for k,v in info['rawSketches'].items() if k!=bad['sourceId']}=={k:v for k,v in base['rawSketches'].items() if k!=bad['sourceId']} and info['envelope']['project']['model']==base['envelope']['project']['model'] and info['envelope'].get('presentation')==base['envelope'].get('presentation'),'ONLY actual derived cache radius changed, original source/intent intact')
    return {'status':'PASS','scope':'Finite source-owned Segment/Circle Offset, explicit side, source50pm arithmetic/current .cad; not general loop/Arc/profile/projection/BRep qualification','observations':len(r['observations']),'travels':len(r['travels']),'refusals':len(r['refusals']),'archives':archives,'derivedCacheOpenRefusal':bad['code']}
if __name__=='__main__':
    with localcontext() as context:
        context.prec=90
        print(json.dumps(make_bad_cache(sys.argv[2]) if len(sys.argv)==3 and sys.argv[1]=='make-bad-cache' else run(sys.argv[1]),indent=2))
