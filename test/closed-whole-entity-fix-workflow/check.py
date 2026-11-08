#!/usr/bin/env python3
"""Independent AFTER-WHOLE ZIP/source/original-equation check. No solver import."""
import hashlib,json,math,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'native-cad-container'))
from archive_oracle import read_archive

def require(v,m):
    if not v:raise ValueError(m)
def one(a,m):require(len(a)==1,'one '+m);return a[0]
def near(a,b,t=5e-8):require(type(a) in (int,float) and math.isfinite(a) and abs(a-b)<=t,f'{a}!={b} within {t}')
def source(state,b):return json.loads(one([s for s in state['capture']['native']['sketches'] if s['id']==b['faceId']],'actual source')['source'])
def normalized(s):
    s=json.loads(json.dumps(s))
    for row in (s['host'],s['parameters'],s['capture']['journal'],s['capture']['solids']):row.pop('revision',None)
    return s
def typed(spec,source):
    if not spec['definitions']:return {}
    defs=spec['definitions'];r=spec['circle'];require(defs==[{'name':'thickness','dimension':'length','expression':f'mm({r})'},{'name':'diameter','dimension':'length','expression':'2 * thickness'}],'actual expected directed length formulas');prefix='codi-physical-parameters:1\n';require(source.startswith(prefix) and json.loads(source[len(prefix):])==defs,'exact authoritative typed source');return {'thickness':r,'diameter':2*r}
def val(v,q):
    try:return float(v)
    except (ValueError,TypeError):require(v in q,'actual registered typed length');return q[v]
def check_geometry(s,b,spec,i):
    require(s['version']==3 and len(s['stages'])==1 and not s['stages'][0]['generators'],'one actual ordinary stage');require(s['metadata']['boundaryFrame']=={'origin':[0,0,0],'x':[1,0,0],'y':[0,1,0],'z':[0,0,1]},'actual principal XY source');require(all(not x for x in s['boundary'].values()),'no source seeds');objects={o['id']:o for o in s['objects']};require(len(objects)==len(s['objects']),'unique roots')
    rect=[objects[id] for id in b['rectangleIds']];expected={((100,100),(110,100)),((110,100),(110,110)),((110,110),(100,110)),((100,110),(100,100))};actual={(tuple(o['data']['a'][k] for k in ('x','y')),tuple(o['data']['b'][k] for k in ('x','y'))) for o in rect};require(len(rect)==4 and all(o['type']=='Segment' for o in rect) and actual==expected,'unrelated rectangle exact');require(objects[b['unrelatedId']]['data']=={'x':7,'y':9},'unrelated free Point exact')
    values={}
    for name,e in b['entities'].items():
        o=objects[e['id']];require(o['type']==e['kind'],'actual entity class');d=o['data']
        if name=='segment':
            for part,w in zip(('a','b'),spec['segment']):
                for k,v in zip(('x','y'),w):near(d[part][k],v)
            dx,dy=d['b']['x']-d['a']['x'],d['b']['y']-d['a']['y'];near(math.hypot(dx,dy),13);values[e['id']]={'ax':d['a']['x'],'ay':d['a']['y'],'bx':d['b']['x'],'by':d['b']['y'],'length':math.hypot(dx,dy),'direction':math.atan2(dy,dx)}
        elif name=='circle':
            near(d['c']['x'],20);near(d['c']['y'],30);near(d['r'],spec[name]);values[e['id']]={'cx':d['c']['x'],'cy':d['c']['y'],'radius':d['r']}
        else:
            r=spec[name];expected={'a':(40+r,20),'b':(40,20+r),'c':(40,20)} if name=='quarter' else {'a':(70,20+r),'b':(70+r,20),'c':(70,20)}
            for p,w in expected.items():
                for k,v in zip(('x','y'),w):near(d[p][k],v)
            u=(d['a']['x']-d['c']['x'],d['a']['y']-d['c']['y']);v=(d['b']['x']-d['c']['x'],d['b']['y']-d['c']['y']);ra,rb=math.hypot(*u),math.hypot(*v);near(ra,r);near(rb,r);angle=math.atan2(u[0]*v[1]-u[1]*v[0],u[0]*v[0]+u[1]*v[1]);sweep=angle if angle>0 else angle+2*math.pi;near(sweep,math.pi/2 if name=='quarter' else 3*math.pi/2,1e-8);require(abs(d['a']['x']-d['b']['x'])>1e-6 or abs(d['a']['y']-d['b']['y'])>1e-6,'ordinary branch far from inherited near-endpoint full-Arc rule');values[e['id']]={**{p+k:d[p][k] for p in ('a','b','c') for k in ('x','y')},'radius':ra,'sweep':sweep}
    points={}
    for p in i['points']:
        o=objects[p['parentId']];choices=[o['data']] if o['type']=='Point' else [o['data'][k] for k in ('a','b','c') if k in o['data']];points[p['id']]=one([x for x in choices if abs(x['x']-p['x'])<=5e-8 and abs(x['y']-p['y'])<=5e-8],'actual source parent-owned point')
    return objects,points,values

def equations(s,b,spec,i,q,objects,points,values):
    fixed=[]
    for c in s['stages'][0]['constraints']:
        require(c['admission']['version']==1 and c['admission']['state'] in ('accepted','redundant'),'actual accepted final evidence');t,refs,k=c['typeId'],c['objects'],c.get('constants',{})
        if t.startswith('Fix'):
            require(t in ('FixSegment','FixCircle','FixArc') and len(refs)==1 and refs[0] in values,'actual whole entity root');wanted=values[refs[0]];require(set(k)==set(wanted),'whole snapshot fields, not a point-only lock');require(objects[refs[0]]['type']=={'FixSegment':'Segment','FixCircle':'Circle','FixArc':'Arc'}[t],'actual schema/type');fixed.append(refs[0])
            for key,v in wanted.items():require(isinstance(k[key],str),'new snapshot raw full-precision literal');near(float(k[key]),v,1e-8 if key in ('direction','sweep') else 1e-12)
            require(not one([r for r in i['dimensionTargets'] if r['stage']==c['stage'] and r['typeId']==t and r['objects']==refs],'non-editable Fix scalar row')['canEdit'],'Fix is not a scalar dimension')
        elif t=='PCoincident':
            a,z=[points[id] for id in refs]
            for key in ('x','y'):near(a[key],z[key])
        elif t=='LockPoint':
            a=points[one(refs,'actual datum')]
            for key in ('x','y'):near(a[key],float(k[key]))
        elif t in ('Horizontal','Vertical','SegmentLength'):
            d=objects[one(refs,'actual Segment')]['data'];a,z=d['a'],d['b']
            if t=='SegmentLength':near(math.hypot(z['x']-a['x'],z['y']-a['y']),val(k['length'],q))
            else:near(z['y' if t=='Horizontal' else 'x'],a['y' if t=='Horizontal' else 'x'])
        elif t in ('SignedDistanceX','SignedDistanceY'):
            a,z=[points[id] for id in refs];key='x' if t=='SignedDistanceX' else 'y';near(z[key]-a[key],val(k['distance'],q))
        elif t in ('RadiusLength','DiameterLength'):
            o=objects[one(refs,'actual circular owner')];d=o['data'];r=d['r'] if o['type']=='Circle' else math.hypot(d['a']['x']-d['c']['x'],d['a']['y']-d['c']['y']);near(r*(2 if t=='DiameterLength' else 1),val(k['diameter' if t=='DiameterLength' else 'length'],q))
        else:raise ValueError('Unexpected finite original equation '+t)
    require(set(fixed)=={b['entities'][n]['id'] for n in spec['fixed']} and len(fixed)==len(spec['fixed']),'exact Fix row membership; no blanket deletion')

def check(directory):
    directory=Path(directory);r=json.loads((directory/'receipt.json').read_text());require(r['status']=='PASS','actual complete whole workflow PASS');require(r['ownedContextsRetired'] and r['sharedBrowserDisconnectedOnly'],'owned cleanup only');require(r['sourcePins']==r['sourcePinsAfter'],'executed source immutable');require(not r['sourceSeeds'] and not r['privateAuthoring'] and not r['fakeReplies'],'public-only positive authoring')
    for row in r['sourceSnapshots']:require(hashlib.sha256((directory/row['file']).read_bytes()).hexdigest()==row['sha256'],'executed source snapshot')
    for row in r['observations']:
        require(row['before']==row['after'],'read-only exact state preservation');before=row['before'];resources=before['ownership']['resources'];require(not before['ownership']['processing'] and not resources['cleanupFailed'] and all(resources[k]==0 for k in ('candidates','accepted','mounts')) and resources['owners']==resources['detached'],'actual resource retirement');s=source(before,row['b']);q=typed(row['spec'],before['capture']['native']['expressions']);objects,points,values=check_geometry(s,row['b'],row['spec'],row['inspection']);equations(s,row['b'],row['spec'],row['inspection'],q,objects,points,values)
    for row in r['refusals']:require(normalized(row['before'])==normalized(row['after']) and not row['error']['committed'] and not row['error']['possiblyCommitted'],'refusal preserves durable state/J/source/resources except four opaque revisions')
    require(len(r['refusals'])>=9,'all fixed-motion/branch/stale/type/named refusals');noop=one([x for x in r['rows'] if x['label']=='Existing Fix no-op preserves real redo'],'real duplicate no-op');require(noop['before']==noop['after'] and noop['before']['capture']['journal']['canRedo'] and not noop['noop']['changed'] and noop['noop']['fixed']['existing'],'duplicate no-op preserves redo, not a distinct redundant row')
    circle=r['binding']['entities']['circle']['id'];created=one([x for x in r['commands'] if x['command']=='apply-closed-sketch-fix-entity' and x['args']['id']==circle and x.get('result',{}).get('fixed',{}).get('status')=='redundant' and x['result']['changed']][:1],'actual distinct redundant FixCircle');require(created['result']['fixed']['existing'] is False,'new row genuinely authored');require(any(row['label'].startswith('Remove separate diameter') and one([c for c in row['inspection']['fixedEntities']['rows'] if c['id']==circle],'actual reactivated Fix')['status']=='accepted' for row in r['observations']),'actual retained Fix reactivation')
    require([x['expectedNullity'] for x in r['reports']]==[8,4,4,3,2],'finite declared freedoms, not global physical DOF')
    for row in r['reports']:require(row['before']==row['after'] and row['result']['localJacobian']['localNullity']==row['expectedNullity'] and row['result'].get('physicalDof') is None,'actual local report scope')
    require(len(r['saves'])==3,'three native .cad save/fresh Open cycles');archives=[]
    for item in r['saves']:
        a=read_archive(directory/item['savedFile']);require(a['sha256']==item['sha256'] and a['bytes']==item['bytes'],'actual local/server bytes, independent CRC/SHA/ZIP32');e=a['envelope'];p=e['project'];n=item['before']['capture']['native'];m=p['model'];require(e['unit']=='millimeter' and e.get('presentation')==n['presentation'],'physical/presentation separation');require(m['history']==n['history'] and m['expressions']==n['expressions'] and m['counters']==n['counters'],'exact one authored graph/formulas/highwater');require(len(m['history'])==1 and m['history'][0]['type']=='PLANE','genuine public source producer, no BRep substitute');saved=one([s for s in p['sketches'] if s['id']==item['b']['faceId']],'actual saved source');require(saved['data']==source(item['before'],item['b']),'exact native whole Fix source/IDs/literal witness/name/branch');require(set(item['spec']['fixed'])=={'segment','circle','quarter','major'},'all ordinary whole entities remain fixed in each saved artifact');archives.append({'file':item['savedFile'],'sha256':a['sha256'],'designRevision':a['manifest']['designRevision']})
    return {'status':'PASS','scope':'finite whole-entity Fix shared source/.cad/typed travel; no near-coincident Arc50pm/global rank/BRep claim','observations':len(r['observations']),'refusals':len(r['refusals']),'archives':archives}
if __name__=='__main__':print(json.dumps(check(sys.argv[1]),indent=2))
