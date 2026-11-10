#!/usr/bin/env python3
"""Independent AFTER-WHOLE drawing/source/native packet/SVG/current .cad oracle.
Standard library + existing independent ZIP reader; no production CAD imports.
"""
import json,math,hashlib,re,struct,sys
from pathlib import Path
from decimal import Decimal,localcontext
from collections import Counter
import xml.etree.ElementTree as ET
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'native-cad-container'))
from archive_oracle import read_archive
import importlib.util
_spec=importlib.util.spec_from_file_location('drawing_warning_oracle',Path(__file__).resolve().parents[1]/'drawing-warning-oracle.py');_warning=importlib.util.module_from_spec(_spec);_spec.loader.exec_module(_warning)
WARNING_SOURCE_ROSTER={
 ('core', 'test/drawing-reference-repair-public-workflow/README.md'),
 ('core', 'test/drawing-reference-repair-public-workflow/check.py'),
 ('core', 'test/drawing-reference-repair-public-workflow/desktop-driver.mjs'),
 ('core', 'test/drawing-reference-repair-public-workflow/example.mjs'),
 ('core', 'test/drawing-warning-oracle.py'), ('core', 'test/drawing-dimension-oracle.py'),
 ('core', 'test/native-cad-container/archive_oracle.py'),
 ('core', 'web/app/cad/export/linkedPartDrawingCaptionLayout.mjs'),
 ('core', 'web/app/cad/export/linkedPartDrawingSvg.mjs'), ('core', 'web/app/cad/export/linkedPartDrawingDimensionLayout.mjs'),
 ('core', 'web/app/cad/export/linkedPartDrawingRequirementForms.mjs'),
 ('core', 'web/app/cad/export/linkedPartDrawingWarningLayout.mjs'),
 ('desktop', 'test/agent-cad-corpus/strict-join/oracle.mjs'),
 ('desktop', 'test/agent-cad-corpus/sweep/signed-harness.mjs'),
}
PI=Decimal('3.14159265358979323846264338327950288419716939937510582097494459230781640628620899862803482534211706798214808651')
BUILD='sha256:32eec74e3019d9e2d767c9016f05aa3daa49441c6102423a269d67b9c7f02a08:abbf2aa02a6f2101c600aa1eedd20fa80ab2db206e677ca860d9c5103cdfbfcc'
FRAMES={'top':([1,0,0],[0,1,0],[0,0,1]),'front':([1,0,0],[0,0,1],[0,-1,0]),'right':([0,1,0],[0,0,1],[1,0,0])}
MASKS=((True,False,True,False),(False,True,False,True));NS={'s':'http://www.w3.org/2000/svg'};sha=lambda b:hashlib.sha256(b).hexdigest()
def need(ok,text):
    if not ok:raise ValueError(text)
def one(xs,text):need(len(xs)==1,'one '+text);return xs[0]
def near(x,y,t=1e-6):need(type(x) in (int,float) and math.isfinite(x) and abs(x-float(y))<=t,f'{x} differs from {y}; budget {t}')
def vector(x,y,t=1e-6):need(len(x)==len(y),'vector dimensions');[near(a,b,t) for a,b in zip(x,y)]
def settled(s):
    r=s['ownership']['resources'];need(not s['ownership']['processing'] and not r['cleanupFailed'] and all(r[k]==0 for k in ('candidates','accepted','mounts')) and r['owners']==r['detached'],'retired Native ownership');need(not s['lifecycle']['pipelineFailed'] and not s['lifecycle']['cleanupFailed'] and s['manufacturing'] is None,'healthy accepted source');need(s['lifecycle']['pointer']==len(s['capture']['native']['history'])-1,'actual complete tip')
def geometry(s):
    n=json.loads(json.dumps(s['capture']['native']));n.pop('materialRevision',None);return{'native':n,'bodies':s['capture']['solids']['bodies'],'outputs':s['capture']['solids']['outputs'],'manufacturing':s['manufacturing'],'ownership':s['ownership'],'lifecycle':s['lifecycle']}
def source_state(s,b,e,inspection):
    n=s['capture']['native'];source=one(n['sketches'],'one original sketch');need(source['id']==b['faceId'],'actual source ID');data=json.loads(source['source']);need(data['version']==3 and len(data['objects'])==4 and len(data['stages'])==1 and not data['stages'][0]['generators'],'original ordinary source');need(all(not x for x in data['boundary'].values()),'no hidden external boundary');need(data['metadata']['boundaryFrame']=={'origin':[0,0,0],'x':[1,0,0],'y':[0,1,0],'z':[0,0,1]},'actual source DATUM frame at0, not rectangle minimum');objects={x['id']:x for x in data['objects']};need(set(objects)==set(b['curveIds']) and len(objects)==4,'actual original curves');x,y=e['origin'];w,h=e['width'],e['height'];corners=[(x,y),(x+w,y),(x+w,y+h),(x,y+h)];counts=[0]*4;starts=[]
    for o in objects.values():
        need(o['type']=='Segment' and o['role'] is None and o['stage']==0,'ordinary real source Segment');ends=[]
        for p in (o['data']['a'],o['data']['b']):
            at=one([j for j,q in enumerate(corners) if abs(q[0]-p['x'])<=5e-8 and abs(q[1]-p['y'])<=5e-8],'source corner');counts[at]+=1;ends.append(at)
        need((ends[0]+1)%4==ends[1],'original directed rectangle branch');starts.append(ends[0])
    need(counts==[2]*4 and sorted(starts)==[0,1,2,3],'all source curves exactly once');points={}
    for p in inspection['points']:
        o=objects[p['parentId']];pt=one([q for q in (o['data']['a'],o['data']['b']) if abs(q['x']-p['x'])<=5e-8 and abs(q['y']-p['y'])<=5e-8],'actual public endpoint ownership');need(p['id'] not in points,'unique actual endpoint');points[p['id']]=pt
    need(len(points)==8,'all actual endpoints');rows=data['stages'][0]['constraints'];need(Counter(c['typeId'] for c in rows)=={'PCoincident':4,'LockPoint':1,'Horizontal':2,'Vertical':2,'SegmentLength':2},'eleven real original rows')
    for c in rows:
        need(c['admission']['state'] in ('accepted','redundant'),'actual solver-derived admission');k=c.get('constants',{});refs=c['objects'];t=c['typeId']
        if t=='PCoincident':
            a,z=[points[id] for id in refs]
            for axis in ('x','y'):near(a[axis],z[axis],5e-8)
        elif t=='LockPoint':
            p=points[one(refs,'lock')]
            for axis in ('x','y'):near(p[axis],float(k[axis]),5e-8)
        else:
            o=objects[one(refs,'Segment')];a,z=o['data']['a'],o['data']['b']
            if t=='SegmentLength':near(math.dist((a['x'],a['y']),(z['x'],z['y'])),float(k['length']),5e-8)
            else:near(a['y' if t=='Horizontal' else 'x'],z['y' if t=='Horizontal' else 'x'],5e-8)
    hist=n['history'];need([o['type'] for o in hist]==['PLANE','WORKER_SELECTED_PROFILE_EXTRUDE_V2','WORKER_THROUGH_HOLES_V1','WORKER_SOLID_EDGE_TREATMENT_V1','WORKER_SOLID_EDGE_TREATMENT_V1'],'one authentic source/profile/hole/treatment graph');need(int(hist[0]['params']['featureId'])==b['rectangle']['featureId'] and hist[0]['params']['orientation']=='XY' and hist[0]['params']['depth']==0 and hist[0]['params']['datum'] is None,'actual principal source plane');p=hist[1]['params'];hole=hist[2]['params'];need(len(p)==9 and p['featureId']==b['profile']['featureId'] and p['faceId']==b['faceId'] and p['regionId']==b['regionId'] and p['depth']==e['depth'] and p['bodyPolicy']=='separate','actual original extrusion intent')
    need(set(hole)=={'version','unit','engine','engineRevision','featureId','target','producerFeatureId','sourceFeatureId','sourceFaceId','sourceRegionId','kind','diameter'} and hole['featureId']==b['center']['featureId'] and hole['target']==b['profile']['outputId'] and hole['producerFeatureId']==b['profile']['featureId'] and hole['sourceFeatureId']==b['profile']['featureId'] and hole['sourceFaceId']==b['faceId'] and hole['sourceRegionId']==b['regionId'] and hole['kind']=='centered-through' and hole['diameter']==e['diameter'],'real semantic hole/cylinder source binding')
    for at,key,kind,parent,ids,size in [(3,'fillet','fillet',b['center'],b['filletEdges'],3),(4,'chamfer','chamfer-equal',b['fillet'],b['chamferEdges'],1)]:
        p=hist[at]['params'];need(set(p)=={'version','unit','engine','engineRevision','featureId','target','producerFeatureId','kind','edgeIds','size'} and p['featureId']==b[key]['featureId'] and p['kind']==kind and p['target']==parent['outputId'] and p['producerFeatureId']==parent['featureId'] and p['edgeIds']==ids and p['size']==size,'exact original treatment intent and actual opaque edges')
    for o in hist[1:]:need(o['params']['unit']=='millimeter' and o['params']['engine']=='occ' and o['params']['engineRevision']==BUILD,'one exact retained Native build')
    rows=b['connectors'];need(len(rows)==4 and len({r['id'] for r in rows})==4,'actual four connector identities');byid={r['id']:r for r in rows};need(set(b['filletEdges']).isdisjoint(b['chamferEdges']) and set(b['filletEdges']+b['chamferEdges'])==set(byid),'actual complementary selected pairs')
    for pair in (b['filletEdges'],b['chamferEdges']):need(len(pair)==2 and set(byid[pair[0]]['incidentCurveIds']).isdisjoint(byid[pair[1]]['incidentCurveIds']),'real opposite incidence without ID grammar')
    return data,objects

def expected_values(e):
    x,y=e['origin'];return {'width':e['width'],'height':e['height'],'depth':e['depth'],'hole-diameter':e['diameter'],'hole-offset-x':abs(x+e['width']/2),'hole-offset-y':abs(y+e['height']/2)}
def definition_check(definition,base,b,wrong):
    wanted=json.loads(json.dumps(base))
    if wrong:
        for d in wanted['dimensions']:
            if 'hole' in d:d['hole']['featureId']=b['fillet']['featureId']
    need(definition==wanted,'same complete authored definition; only actual hole-reference repair differs');need(definition['target']=={'featureId':b['last']['featureId'],'operationType':'WORKER_SOLID_EDGE_TREATMENT_V1','engine':'occ','engineRevision':BUILD,'output':'complete-native-result'},'actual target producer');need(definition['datum']=={'featureId':b['profile']['featureId'],'faceId':b['faceId'],'regionId':b['regionId']},'actual source datum');need(definition['sheet']=={'width':420,'height':297,'scale':{'numerator':1,'denominator':1}},'physical sheet mm scale1');need([v['basis'] for v in definition['views']]==['top','front','right'] and len(definition['dimensions'])==6,'three views/six original references');forbidden={'value','values','anchors','measurements','mesh','brep','nativeIndex','handle','frame'}
    def visit(v):
        if isinstance(v,dict):need(not(forbidden&set(v)),'no solved values or runtime authority persisted');[visit(x) for x in v.values()]
        elif isinstance(v,list):[visit(x) for x in v]
    visit(definition)
def record_curves(view,frame):
    meta=view['metadata'];need(view['status']=='available' and view['reason'] is None and meta['version']==1 and meta['layout']=='orthographic-f64le12-u8x4/1' and meta['quality']=='native-brep-orthographic' and meta['scope']=='response-local' and meta['persistentIds'] is False and meta['copyTShapesDisjoint'] is True,'actual response-local orthographic record');need(meta['frame']==frame,'authentic named view basis');count=meta['fragmentCount'];need(type(count) is int and 0<count<=8192 and len(meta['groupCounts'])==8 and sum(meta['groupCounts'])==count,'eight bounded ordered Native groups');buffers=[]
    for key,bytes_per in [('values',96),('tags',4)]:
        row=view[key];raw=bytes(row['bytes']);need(len(raw)==row['byteLength']==meta['valueBytes' if key=='values' else 'tagBytes']==count*bytes_per and sha(raw)==row['sha256'],'actual Native buffer bytes/hash/layout');buffers.append(raw)
    values,tags=buffers;curves=[];index=0
    for group,n in enumerate(meta['groupCounts']):
        need(type(n) is int and n>=0,'group count')
        for _ in range(n):
            numbers=list(struct.unpack_from('<12d',values,index*96));t=list(tags[index*4:index*4+4]);index+=1;need(all(math.isfinite(x) and abs(x)<=4e6 for x in numbers) and numbers[1]>numbers[0] and t[2]<=3,'finite actual analytic parameters');line=t[0]==0;need(t[0] in (0,1) and (t[1]==0 and t[3]==0 and numbers[10:12]==[0,0] if line else t[1] in (1,2) and t[3]==1),'actual analytic curve tags');curve={'range':numbers[:2],'start':numbers[2:4],'end':numbers[4:6],'c':numbers[6:8],'a':numbers[8:10],'b':numbers[10:12],'line':line,'hidden':bool(group%2)}
            for theta,want in zip(curve['range'],[curve['start'],curve['end']]):vector(evaluate(curve,theta),want,max(1e-9,math.hypot(*want)*1e-12))
            curves.append(curve)
    return curves

def evaluate(c,t):return [c['c'][j]+(c['a'][j]*t if c['line'] else c['a'][j]*math.cos(t)+c['b'][j]*math.sin(t)) for j in range(2)]
def extrema(c):
    ts=list(c['range'])
    if not c['line']:
        need(c['range'][1]-c['range'][0]<=2*math.pi+1e-9,'bounded fixture conic trim')
        for axis in (0,1):
            phase=math.atan2(c['b'][axis],c['a'][axis])
            for k in range(math.floor((ts[0]-phase)/math.pi)-1,math.ceil((ts[1]-phase)/math.pi)+2):
                theta=phase+k*math.pi
                if c['range'][0]<=theta<=c['range'][1]:ts.append(theta)
    ps=[evaluate(c,t) for t in ts];return [min(p[0] for p in ps),min(p[1] for p in ps),max(p[0] for p in ps),max(p[1] for p in ps)]
def point_class(p,e,mask):
    x,y,z=p;x0,y0=e['origin'];w,h,d=e['width'],e['height'],e['depth'];cx,cy=x0+w/2,y0+h/2;r=e['diameter']/2
    if x<x0 or x>x0+w or y<y0 or y>y0+h or z<0 or z>d:return 'outside'
    q=(x-cx)**2+(y-cy)**2
    if q<r*r:return 'outside'
    boundary=x in (x0,x0+w) or y in (y0,y0+h) or z in (0,d) or q==r*r
    for n,(u,v) in enumerate(((x-x0,y-y0),(x0+w-x,y-y0),(x0+w-x,y0+h-y),(x-x0,y0+h-y))):
        if mask[n] and u<3 and v<3:
            rr=(u-3)**2+(v-3)**2
            if rr>9:return 'outside'
            if rr==9:boundary=True
        elif not mask[n]:
            if u+v<1:return 'outside'
            if u+v==1:boundary=True
    return 'boundary' if boundary else 'inside'

def check_observation(row,case):
    s=row['before'];need(s==row['after'],'exact same-window source/definition/tokens/resource read preservation');settled(s);b,e=row['binding'],row['dimensions'];data,objects=source_state(s,b,e,row['sourceInspection']);definition_check(row['definition'],case['definition'],b,row['unresolved']);need(s['drawing']['definition']==row['definition'],'actual accepted authored definition');body=one(s['capture']['solids']['bodies'],'actual current Native target');need(len(s['capture']['solids']['outputs'])==1 and body['id']==b['last']['outputId'] and body['featureId']==b['last']['featureId'],'actual complete output/producer');m=body['metrics'];need(m['nativeValidity']['valid'] is True and m['solidCount']==1 and m['resultKind']=='single-solid' and 'sha256:'+m['runtime']['jsSha256']+':'+m['runtime']['wasmSha256']==BUILD,'actual valid exact-build Native body');x,y=e['origin'];w,h,d,diam=e['width'],e['height'],e['depth'],e['diameter'];
    with localcontext() as ctx:
        ctx.prec=100;ww,hh,dd,rr=[Decimal(str(v)) for v in (w,h,d,diam/2)];volume=ww*hh*dd-PI*rr*rr*dd-18*(1-PI/4)*dd-dd
    near(m['nativeVolume'],volume);vector(m['nativeBounds']['min'],[x,y,0]);vector(m['nativeBounds']['max'],[x+w,y+h,d])
    for k,v in {'solids':1,'shells':1,'faces':11,'edges':27,'vertices':18}.items():need(m['nativeTopology']['counts'][k]==v,'analytic treated one-hole census '+k)
    read=row['read'];need(read['revision']==s['drawing']['revision'] and read['geometryRevision']==s['drawing']['geometryRevision'] and read['target']=={'bodyId':body['id'],'featureId':body['featureId'],'engine':'occ','engineRevision':BUILD},'actual document/body/build-bound Native read');need(read['drawingId']==row['definition']['drawingId'] and read['status']==('unresolved' if row['unresolved'] else 'available'),'real resolved/unresolved status');o=read['observation'];need(o['quality']=='native-bound-drawing-references' and o['scope']=='response-local' and o['unit']=='millimeter','actual Native dimension witness');need(o['datumFrame']=={'origin':[0,0,0],'x':[1,0,0],'y':[0,1,0],'z':[0,0,1]},'actual DATUM origin, never rectangle minimum');need(o['status']==('unresolved' if row['unresolved'] else 'available') and o['reason']==('DRAWING_REFERENCES_UNRESOLVED' if row['unresolved'] else None),'actual aggregate reference status');values=expected_values(e);cx,cy=x+w/2,y+h/2
    need(len(o['dimensions'])==6 and len(o['viewFrames'])==len(read['views'])==3,'complete dimensions/views')
    for dim,fact in zip(row['definition']['dimensions'],o['dimensions']):
        need(fact['dimensionId']==dim['dimensionId'] and fact['kind']==dim['kind'],'same dimension identities/kinds')
        if row['unresolved'] and 'hole' in dim:
            need(fact['status']=='unresolved' and fact['reason']=='DRAWING_HOLE_WITNESS_UNAVAILABLE' and fact['value'] is None and fact['quality'] is None and fact['anchors']==[],'unresolved actual hole references contain no fictitious values');continue
        need(fact['status']=='available' and fact['reason'] is None,'real dimension available');near(fact['value'],values[dim['dimensionId']]);a,z=fact['anchors']
        if dim['kind']=='source-distance':
            for ref,anchor in [(dim['from'],a),(dim['to'],z)]:
                need(ref['featureId']==b['profile']['featureId'] and ref['faceId']==b['faceId'] and ref['regionId']==b['regionId'],'actual source point binding');pt=objects[ref['curveId']]['data'][ref['point']];vector(anchor,[pt['x'],pt['y'],0])
            need(fact['quality']=='solved-source-datum','source-derived quantity quality')
        elif dim['kind']=='plane-distance':
            for key,role in [('first','first-cap'),('second','last-cap')]:
                ref=dim[key];f=one([f for f in body['selections']['plan']['faces'] if f['id']==ref['selectionId']],'actual opaque cap reference');need(f['role']==role and f['originFeatureId']==b['profile']['featureId'] and f['geometry']=='plane','actual Native cap descriptor')
            vector(a[:2],z[:2]);near(a[2],0);near(z[2],d);need(fact['quality']=='native-brep-analytic','actual plane measurement quality')
        elif dim['kind']=='hole-diameter':vector([(a[j]+z[j])/2 for j in range(3)],[cx,cy,d/2]);near(math.dist(a,z),diam);need(fact['quality']=='native-prism-cut-lineage','actual cylinder lineage')
        else:
            vector(a,[0,cy,0] if dim['axis']=='datum-x' else [cx,0,0]);vector(z,[cx,cy,0]);need(fact['quality']=='native-prism-cut-lineage','actual signed anchors/nonnegative scalar distance')
    frames=[];curves=[]
    for view,frame,definition in zip(read['views'],o['viewFrames'],row['definition']['views']):
        u,v,n=FRAMES[definition['basis']];want={'viewId':definition['viewId'],'frame':{'origin':[0,0,0],'u':u,'v':v,'n':n}};need(frame==want and view['viewId']==definition['viewId'],'independent right-handed view convention');cc=record_curves(view,[0,0,0,*u,*v,*n]);bounds=[extrema(c) for c in cc];actual=[min(b[0] for b in bounds),min(b[1] for b in bounds),max(b[2] for b in bounds),max(b[3] for b in bounds)];expected={'top':[x,y,x+w,y+h],'front':[x,0,x+w,d],'right':[y,0,y+h,d]}[definition['basis']];vector(actual,expected);curves.append(cc);frames.append(want)
    q,request=row['pointReply'],row['pointRequest'];need(q['quality']=='native-re-evaluation-observation' and len(q['points'])==len(request['points'])==10,'actual Native point query')
    for k in ('revision','version','unit','engine','engineRevision','bodyId','featureId'):need(q[k]==request[k],'current point request binding')
    need(request['revision']==s['capture']['solids']['revision'] and request['bodyId']==body['id'] and request['featureId']==body['featureId'] and request['engineRevision']==BUILD,'current accepted point producer/build')
    matching=[j for j,mask in enumerate(MASKS) if q['points']==[{'point':p,'classification':point_class(p,e,mask)} for p in request['points']]];need(matching==[row['diagonal']] and row['diagonal']==case['diagonal'],'frozen opposite-fillet geometry/same selected IDs');return {'volume':str(volume),'curves':curves,'dimensions':values}

TOKEN=re.compile(r'[ML]|[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?')
def path_points(text):
    need(not TOKEN.sub('',text).replace(',','').strip(),'only emitted M/L SVG syntax');tokens=TOKEN.findall(text);out=[];i=0;command=None
    while i<len(tokens):
        if tokens[i] in ('M','L'):command=tokens[i];i+=1
        need(command is not None and i+1<len(tokens) and tokens[i] not in ('M','L') and tokens[i+1] not in ('M','L'),'actual SVG coordinate pair');out.append([float(tokens[i]),float(tokens[i+1])]);i+=2
    need(len(out)>=2,'nonempty path');return out

def check_svg(root,item,receipt,case):
    raw=(root/item['savedFile']).read_bytes();need(sha(raw)==item['sha256'] and len(raw)==item['byteLength'],'actual SVG server bytes');need(item['before']==item['after'],'SVG export exact readonly state/dirty/tokens');matches=[r for r in receipt['observations'] if r['case']==case['name'] and r['before']['drawing']['revision']==item['before']['drawing']['revision'] and r['before']['drawing']['geometryRevision']==item['before']['drawing']['geometryRevision'] and r['definition']==item['definition'] and geometry(r['before'])==geometry(item['before'])];need(matches,'actual prior Native read for SVG binding');row=matches[-1];checked=check_observation(row,case);d=item['definition'];xml=ET.fromstring(raw);need(xml.tag=='{'+NS['s']+'}svg' and xml.attrib=={'width':'420mm','height':'297mm','viewBox':'0 0 420 297'},'physical SVG sheet/units');need(all('transform' not in e.attrib for e in xml.iter()),'no hidden scale/transform');meta=json.loads(one(xml.findall('s:metadata',NS),'SVG metadata').text);need(meta['drawingId']==d['drawingId'] and meta['revision']==item['before']['drawing']['revision'] and meta['geometryRevision']==item['before']['drawing']['geometryRevision'] and meta['status']==('unresolved' if item['unresolved'] else 'available') and meta['dimensionRole']=='reference' and meta['quality']=='native-bound-drawing-references' and meta['curvePresentationTolerancePaperMm']==.02,'exact current derived SVG binding/semantics');texts=xml.findall('.//s:text',NS);need([t.text for t in texts][0]==d['title'],'same authored title')
    for dim in d['dimensions']:
        prefix='Ø' if dim['kind']=='hole-diameter' else 'ΔZ ' if dim['kind']=='plane-distance' else 'ΔX ' if dim['axis']=='datum-x' else 'ΔY ';label='UNRESOLVED: '+dim['dimensionId'] if item['unresolved'] and 'hole' in dim else prefix+f"{checked['dimensions'][dim['dimensionId']]:.3f} mm"
        if label.startswith('UNRESOLVED:'):continue
        t=one([t for t in texts if t.text==label and [float(t.attrib['x']),float(t.attrib['y'])]==dim['label']],'actual six label/value positions');need(t.get('fill')==('#a00' if label.startswith('UNRESOLVED') else '#124'),'truthful unresolved/factual appearance')
    need(len([t for t in texts if ''.join(t.itertext()).startswith('UNRESOLVED:')])==(3 if item['unresolved'] else 0),'no ghost numeric hole values');need(all(any(t.text==v['basis'] for t in texts) for v in d['views']),'all three named views')
    groups=xml.findall('s:g',NS);need(len(groups)==2,'geometry/annotation groups');paths=[p for p in groups[0] if p.tag=='{'+NS['s']+'}path' and p.get('stroke') in (None,'#777')];expected=[(view,c) for view,curves in zip(d['views'],checked['curves']) for c in curves];need(len(paths)==len(expected),'every actual Native analytic fragment reaches SVG')
    for path,(view,c) in zip(paths,expected):
        ps=path_points(path.attrib['d']);need((path.get('stroke-dasharray')=='2 1')==c['hidden'],'actual visibility category');need(len(ps)==2 if c['line'] else len(ps)>=2,'line endpoint/conic presentation');start,end=c['range']
        for j,p in enumerate(ps):
            theta=start+(end-start)*j/(len(ps)-1);q=evaluate(c,theta);vector(p,[view['paperOrigin'][0]+q[0],view['paperOrigin'][1]-q[1]])
        if not c['line']:
            curvature=math.hypot(*c['a'])+math.hypot(*c['b']);need(curvature*((end-start)/(len(ps)-1))**2/8<=.02+1e-12,'bounded SVG chord error in paper mm')
    _warning.check_dimension_diagnostics(xml,d,row['read']['observation'],checked['curves'],evaluate,path_points,need)
    # Independent source-to-view checks supplement Native-packet/SVG agreement.
    e=item['dimensions'];cx=e['origin'][0]+e['width']/2;cy=e['origin'][1]+e['height']/2;r=e['diameter']/2;top=checked['curves'][0]
    need(any(not c['line'] and abs(c['c'][0]-cx)<=1e-6 and abs(c['c'][1]-cy)<=1e-6 and abs(math.hypot(*c['a'])-r)<=1e-6 and abs(math.hypot(*c['b'])-r)<=1e-6 and abs(c['range'][1]-c['range'][0]-2*math.pi)<=1e-9 for c in top),'real complete projected bore circle independent of label')
    for view,center in [(1,cx),(2,cy)]:
        for side in (-1,1):need(any(c['hidden'] and c['line'] and abs(c['start'][0]-(center+side*r))<=1e-6 and abs(c['end'][0]-(center+side*r))<=1e-6 and all(abs(a-b)<=1e-6 for a,b in zip(sorted([c['start'][1],c['end'][1]]),[0,e['depth']])) for c in checked['curves'][view]),'actual hidden cylindrical wall spans depth')
    return {'file':item['savedFile'],'sha256':item['sha256'],'status':meta['status'],'nativeFragments':len(paths),'dimensions':checked['dimensions']}

def check_refusal_state(before,after,candidate):
    # Independently derive the six permitted differences from their actual
    # currentness relationships; no imported production predicate or token map.
    need(type(candidate) is bool,'explicit candidate-refusal classification');settled(before);settled(after)
    if not candidate:
        need(before==after,'pre-candidate refusal preserves full state, epoch and ALL tokens');return
    prefixes=[]
    for s in (before,after):
        epoch=s['lifecycle']['epoch'];generation=s['lifecycle']['generation'];need(type(epoch) is int and 0<=epoch<=9007199254740991 and type(generation) is int and 0<=generation<=9007199254740991,'actual bounded lifecycle headers')
        document=s['host']['revision'];geometry=s['capture']['solids']['revision']
        for t in (document,geometry,s['drawing']['revision'],s['drawing']['geometryRevision']):need(type(t) is str and 0<len(t)<=256,'bounded actual inspection token')
        need(s['drawing']['revision']==document and s['drawing']['geometryRevision']==geometry,'same current document and solids tokens in drawing inspection')
        journal=s['capture']['journal']['revision'];need(type(journal) is str and journal.endswith(':'+document),'journal suffix binds actual current document token')
        prefix=journal[:-len(document)];need(re.fullmatch(r'(?:0|[1-9][0-9]*):(?:0|[1-9][0-9]*):',prefix) is not None and prefix.startswith(str(generation)+':'),'source-bound journal generation/revision header');prefixes.append(prefix)
    need(after['lifecycle']['epoch']==before['lifecycle']['epoch']+1,'exactly one isolated candidate attempt')
    need(before['host']['revision']!=after['host']['revision'] and before['capture']['solids']['revision']!=after['capture']['solids']['revision'],'old document/geometry inspection tokens invalidated')
    need(prefixes[0]==prefixes[1] and after['capture']['journal']['revision']==prefixes[0]+after['host']['revision'],'journal changes ONLY exact document suffix, not authored revision')
    states=[]
    for s in (before,after):
        x=json.loads(json.dumps(s));del x['lifecycle']['epoch'];del x['capture']['solids']['revision'];del x['capture']['journal']['revision'];del x['host']['revision'];del x['drawing']['geometryRevision'];del x['drawing']['revision'];states.append(x)
    need(states[0]==states[1],'exact remaining accepted source/definition/body/J/association/file/resources after candidate refusal')

def check(directory):
    root=Path(directory);r=json.loads((root/'receipt.json').read_text());need(r['status']=='PASS' and r['engineRevision']==BUILD,'complete actual workflow first');need(r['sourcePins']==r['sourcePinsAfter'] and r['ownedContextsRetired'] and r['sharedBrowserDisconnectedOnly'],'immutable source/owned cleanup');need(not any(r[k] for k in ('sourceSeeds','privateAuthoring','fakeReplies')),'genuine authoring');need([c['name'] for c in r['cases']]==['original','negative-datum'] and all(c['status']=='PASS' for c in r['cases']),'both actual datum cases')
    _warning.verify_warning_sources(root,r,need,WARNING_SOURCE_ROSTER)
    cases={c['name']:c for c in r['cases']};reads=[]
    for row in r['observations']:reads.append({'case':row['case'],'label':row['label'],'volumeMM3':check_observation(row,cases[row['case']])['volume'],'unresolved':row['unresolved']})
    need(len(reads)==44,'all 44 actual Native drawing and point observations');need(len(r['repairs'])==2,'actual repair in both cases')
    for t in r['repairs']:
        b=t['binding'];definition_check(t['definition'],cases[t['case']]['definition'],b,False);definition_check(t['unresolvedDefinition'],cases[t['case']]['definition'],b,True);need(t['before']['drawing']['definition']==t['unresolvedDefinition'] and t['repaired']['drawing']['definition']==t['definition'] and t['undone']['drawing']['definition']==t['unresolvedDefinition'] and t['redone']['drawing']['definition']==t['definition'],'actual repair Undo restores SAME unresolved refs and Redo SAME repaired refs');need(geometry(t['before'])==geometry(t['repaired'])==geometry(t['undone'])==geometry(t['redone']),'repair/travel never changes actual Native source/body/IDs/counters/resources');target={'kind':'document-metadata','domain':'linked-part-drawing','key':t['definition']['drawingId']};need(t['repaired']['capture']['journal']['undoTarget']==target and t['undone']['capture']['journal']['redoTarget']==target,'real reference repair metadata event, not title/removal')
        for k in ('scope','canUndo','canRedo','undoTarget','redoTarget'):need(t['redone']['capture']['journal'][k]==t['repaired']['capture']['journal'][k],'same repair chronology after Redo')
        for state,unresolved in [(t['before'],True),(t['repaired'],False),(t['undone'],True),(t['redone'],False)]:need(any(o['case']==t['case'] and o['before']==state and o['unresolved']==unresolved for o in r['observations']),'actual Native observation for each reference repair side')
    need(len(r['refusals'])==6,'three precise refusals per case')
    for name in cases:
        rows=[x for x in r['refusals'] if x['case']==name];need([x['error']['code'] for x in rows]==['STALE_DOCUMENT','INVALID_REQUEST','HOLE_OUTSIDE_PROFILE'],'actual source-confirmed refusal layers')
        need([x['candidate'] for x in rows]==[False,False,True],'exact pre-candidate versus attempted-candidate cases')
        for row in rows:
            need(not row['error']['committed'] and not row['error']['possiblyCommitted'],'uncommitted precise refusal')
            if row['candidate']:need(row['command']=='edit-through-hole' and row['error']['code']=='HOLE_OUTSIDE_PROFILE','actual single failed candidate scope')
            check_refusal_state(row['before'],row['after'],row['candidate'])
    need(len(r['noops'])==2 and len(r['travels'])==26,'both no-ops and all actual shared travel events')
    for row in r['travels']:need(row['before']['capture']['native']['counters']==row['after']['capture']['native']['counters'],'shared travel original high-water')
    for row in r['noops']:need(row['result']['changed'] is False and row['before']==row['after'],'literal drawing no-op exact accepted state')
    need(len(r['saves'])==len(r['reopens'])==6,'three current .cad cycles per case');archives=[]
    for item in r['saves']:
        arc=read_archive(root/item['savedFile']);need(arc['sha256']==item['sha256'] and arc['bytes']==item['byteLength'],'actual server .cad ZIP CRC/SHA/designRevision');env=arc['envelope'];n=item['before']['capture']['native'];need(env['version']==3 and env['unit']=='millimeter' and env['drawings']==[item['definition']],'full actual drawing-bearing v3 custody');need(env['project']['model']['history']==n['history'] and env['project']['model']['counters']==n['counters'] and env['project']['model']['expressions']==n['expressions'],'same editable Native graph/high-water');need({s['id']:s['data'] for s in env['project']['sketches']}=={s['id']:json.loads(s['source']) for s in n['sketches']},'same actual source/constraints');definition_check(env['drawings'][0],cases[item['case']]['definition'],item['binding'],item['unresolved']);need(item['before']['capture']==item['after']['capture'] and item['before']['drawing']==item['after']['drawing'],'normal Save does not mutate accepted model/J/definition');archives.append({'file':item['savedFile'],'sha256':arc['sha256'],'designRevision':arc['manifest']['designRevision'],'unresolved':item['unresolved']})
    for item in r['reopens']:
        for k in ('history','source','sketches','expressions','counters','presentation'):need(item['opened']['capture']['native'][k]==item['before']['capture']['native'][k],'fresh Open retains '+k)
        need(item['opened']['drawing']['definition']==item['before']['drawing']['definition'] and not item['opened']['capture']['journal']['canUndo'] and not item['opened']['capture']['journal']['canRedo'],'fresh session retains intent and resets J')
    svgs=[check_svg(root,item,r,cases[item['case']]) for item in r['svgs']];need(len(svgs)==12,'six exact SVG phases per case')
    for name in cases:need((root/(name+'-normal-desktop.png')).is_file(),'actual normal viewable authored model')
    return {'status':'PASS','scope':'finite E22 definition-reference invalidation/repair UndoRedo with actual body, six references/three Native views and current .cad/SVG; not topology-induced loss/full drawing/Gate1','nativeReads':len(reads),'nativePointClasses':len(reads)*10,'reads':reads,'svg':svgs,'archives':archives}
if __name__=='__main__':print(json.dumps(check(sys.argv[1]),indent=2))
