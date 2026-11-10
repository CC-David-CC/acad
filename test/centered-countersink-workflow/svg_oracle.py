"""Independent actual Native analytic-record and SVG conical projection oracle.
No production imports. Adapted finite record/path decoding from the retained
qualified isometric artifact checker, with separate countersink locus truth.
"""
from pathlib import Path as _DimensionPath
import importlib.util as _dimension_import
_dimension_spec=_dimension_import.spec_from_file_location('drawing_dimension_oracle',_DimensionPath(__file__).resolve().parents[1]/'drawing-dimension-oracle.py')
_dimension_oracle=_dimension_import.module_from_spec(_dimension_spec);_dimension_spec.loader.exec_module(_dimension_oracle)

import math,re,json,hashlib,struct
import xml.etree.ElementTree as ET
from truth import facts,need
sha=lambda b:hashlib.sha256(b).hexdigest()
NS={'s':'http://www.w3.org/2000/svg'}
def one(xs,m):need(len(xs)==1,'one '+m);return xs[0]
def near(x,y,t=1e-6):need(math.isfinite(x) and abs(x-y)<=t,f'{x} differs from {y}, budget {t}')
def vector(a,b,t=1e-6):need(len(a)==len(b),'vector length');[near(x,y,t) for x,y in zip(a,b)]
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
def covered_segment(a,z,curves):
    delta=[z[j]-a[j] for j in range(2)];length=math.hypot(*delta)
    intervals=[]
    for c in curves:
        if not c['line']:continue
        ps=[c['start'],c['end']]
        if any(abs(delta[0]*(p[1]-a[1])-delta[1]*(p[0]-a[0]))/length>1e-6 for p in ps):continue
        ts=sorted(sum((p[j]-a[j])*delta[j] for j in range(2))/length**2 for p in ps)
        if ts[1]>=0 and ts[0]<=1:intervals.append((max(0,ts[0]),min(1,ts[1])))
    end=0
    for lo,hi in sorted(intervals):
        if (lo-end)*length>1e-6:return False
        end=max(end,hi)
    return (1-end)*length<=1e-6

TOKEN=re.compile(r'[ML]|[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?')
def path_points(text):
    need(not TOKEN.sub('',text).replace(',','').strip(),'only emitted M/L SVG syntax');tokens=TOKEN.findall(text);out=[];i=0;command=None
    while i<len(tokens):
        if tokens[i] in ('M','L'):command=tokens[i];i+=1
        need(command is not None and i+1<len(tokens) and tokens[i] not in ('M','L') and tokens[i+1] not in ('M','L'),'actual SVG coordinate pair');out.append([float(tokens[i]),float(tokens[i+1])]);i+=2
    need(len(out)>=2,'nonempty path');return out


def full_circle(curves,cx,cy,radius):
    intervals=[]
    for c in curves:
        if c['line'] or math.dist(c['c'],[cx,cy])>1e-6:continue
        if abs(math.hypot(*c['a'])-radius)>1e-6 or abs(math.hypot(*c['b'])-radius)>1e-6 or abs(sum(x*y for x,y in zip(c['a'],c['b'])))>1e-6:continue
        sign=1 if c['a'][0]*c['b'][1]-c['a'][1]*c['b'][0]>0 else -1;phase=math.atan2(c['a'][1],c['a'][0]);a,b=sorted([phase+sign*t for t in c['range']]);need(0<b-a<=2*math.pi+1e-9,'actual finite circular projection interval')
        for k in range(math.floor(-b/(2*math.pi))-1,math.ceil((2*math.pi-a)/(2*math.pi))+2):
            lo,hi=max(0,a+k*2*math.pi),min(2*math.pi,b+k*2*math.pi)
            if hi>lo:intervals.append((lo,hi))
    end=0
    for lo,hi in sorted(intervals):
        if lo-end>1e-9:return False
        end=max(end,hi)
    return 2*math.pi-end<=1e-9

def check_read(row):
    before,after,read,d,e=row['before'],row['after'],row['read'],row['definition'],row['dimensions'];need(before==after,'actual read preserves complete accepted source/J/metadata/resources');need(read['revision']==before['drawing']['revision'] and read['geometryRevision']==before['capture']['solids']['revision'] and read['drawingId']==d['drawingId'] and read['status']=='available','actual current Native drawing binding');need(read['target']['featureId']==row['binding']['countersink']['featureId'],'actual current conical producer');o=read['observation'];need(o['quality']=='native-bound-drawing-references' and o['status']=='available' and o['datumFrame']=={'origin':[0,0,0],'x':[1,0,0],'y':[0,1,0],'z':[0,0,1]} and o['scope']=='response-local' and o['unit']=='millimeter' and o['featureId']==row['binding']['countersink']['featureId'],'actual source datum/quality');f=facts(e);r,R,s,T,cx,cy=(float(f[k]) for k in ('r','R','s','T','cx','cy'));dimensions={x['dimensionId']:x for x in o['dimensions']};need(set(dimensions)=={'width','height','thickness'},'only supported physical source/cap dimensions, NO cone annotation/THRU flags')
    for key,value in [('width',e['width']),('height',e['height']),('thickness',T)]:need(dimensions[key]['status']=='available','actual available dimension');near(dimensions[key]['value'],value)
    body=one(before['capture']['solids']['bodies'],'actual current drawing body');need(read['target']=={'bodyId':body['id'],'featureId':body['featureId'],'engine':'occ','engineRevision':d['target']['engineRevision']},'actual body/build-bound read');objects={o['id']:o for o in json.loads(before['capture']['native']['source'])['objects']};b=row['binding']
    for dim in d['dimensions']:
        fact=dimensions[dim['dimensionId']];need(fact['kind']==dim['kind'] and fact['reason'] is None and len(fact['anchors'])==2,'actual measured dimension/anchors')
        if dim['kind']=='source-distance':
            need(fact['quality']=='solved-source-datum','actual source quality')
            for ref,p in zip((dim['from'],dim['to']),fact['anchors']):
                need(ref['featureId']==b['profile']['featureId'] and ref['faceId']==b['faceId'] and ref['regionId']==b['regionId'] and ref['curveId'] in objects,'actual source identity');q=objects[ref['curveId']]['data'][ref['point']];vector(p,[q['x'],q['y'],0],5e-8)
        else:
            need(dim['kind']=='plane-distance' and fact['quality']=='native-brep-analytic','only actual cap plane distance')
            for ref,role in ((dim['first'],'first-cap'),(dim['second'],'last-cap')):
                face=one([f for f in body['selections']['plan']['faces'] if f['id']==ref['selectionId']],'actual opaque cap');need(face['role']==role and face['originFeatureId']==b['profile']['featureId'] and face['geometry']=='plane','actual inherited Native cap, not guessed ordinal')
            vector(fact['anchors'][0][:2],fact['anchors'][1][:2]);near(fact['anchors'][0][2],0);near(fact['anchors'][1][2],T)
    expectedFrames={'top':([1,0,0],[0,1,0],[0,0,1]),'front':([1,0,0],[0,0,1],[0,-1,0]),'right':([0,1,0],[0,0,1],[1,0,0])};result=[]
    need(len(read['views'])==len(o['viewFrames'])==len(d['views'])==3,'all three actual analytic projections')
    for view,frame,definition in zip(read['views'],o['viewFrames'],d['views']):
        need(view['viewId']==frame['viewId']==definition['viewId'],'actual view identity');axes=expectedFrames[definition['basis']];F=frame['frame'];vector(F['origin'],[0,0,0],5e-8)
        for key,axis in zip(('u','v','n'),axes):vector(F[key],axis,1e-12)
        curves=record_curves(view,[*F['origin'],*F['u'],*F['v'],*F['n']]);width=e['width'] if definition['basis']!='right' else e['height'];height=e['height'] if definition['basis']=='top' else T;bounds=[extrema(c) for c in curves];vector([min(b[0] for b in bounds),min(b[1] for b in bounds),max(b[2] for b in bounds),max(b[3] for b in bounds)],[0,0,width,height]);need(all(covered_segment(a,b,curves) for a,b in [([0,0],[width,0]),([width,0],[width,height]),([width,height],[0,height]),([0,height],[0,0])]),'full independently expected projected outer outline')
        if definition['basis']=='top':
            need(full_circle(curves,cx,cy,r) and full_circle(curves,cx,cy,R),'FULL actual shank/entry circular projection coverage, not labels/counts')
            for c in curves:
                if not c['line']:
                    need(any(math.dist(c['c'],[cx,cy])<=1e-6 and abs(math.hypot(*c['a'])-rad)<=1e-6 and abs(math.hypot(*c['b'])-rad)<=1e-6 and abs(sum(x*y for x,y in zip(c['a'],c['b'])))<=1e-6 for rad in (r,R)),'actual full/trimmed conic lies on one true projected rim');continue
                a,b=c['start'],c['end'];outer=any(abs(a[axis]-level)<=1e-6 and abs(b[axis]-level)<=1e-6 for axis,level in [(0,0),(0,e['width']),(1,0),(1,e['height'])]);radial=abs((a[0]-cx)*(b[1]-cy)-(a[1]-cy)*(b[0]-cx))<=1e-6 and all(r-1e-6<=math.dist(p,[cx,cy])<=R+1e-6 for p in (a,b)) and sum((a[i]-[cx,cy][i])*(b[i]-[cx,cy][i]) for i in range(2))>0;need(outer or radial,'actual line is source outline or a true conical generatrix projection')
        else:
            center=cx if definition['basis']=='front' else cy
            for sign in (-1,1):need(covered_segment([center+sign*r,0],[center+sign*r,s],curves),'full finite shank silhouette0..s');need(covered_segment([center+sign*r,s],[center+sign*R,T],curves),'full conical silhouette s..T; cylinder or step cannot substitute')
            for c in curves:
                bounds=extrema(c)
                if not c['line']:
                    candidates=[(z,rad) for z,rad in ((0,r),(s,r),(T,R)) if abs(c['c'][1]-z)<=1e-6 and abs(c['a'][1])+abs(c['b'][1])<=1e-6 and abs(c['c'][0]-center)<=1e-6 and abs(math.hypot(c['a'][0],c['b'][0])-rad)<=1e-6];need(candidates,'actual edge-on finite circular-rim conic');continue
                a,b=c['start'],c['end'];outer=any(abs(a[axis]-level)<=1e-6 and abs(b[axis]-level)<=1e-6 for axis,level in [(0,0),(0,width),(1,0),(1,T)]);rim=any(abs(a[1]-z)<=1e-6 and abs(b[1]-z)<=1e-6 and all(center-rad-1e-6<=p[0]<=center+rad+1e-6 for p in (a,b)) for z,rad in ((0,r),(s,r),(T,R)));shank=abs(a[0]-b[0])<=1e-6 and all(abs(p[0]-center)<=r+1e-6 and -1e-6<=p[1]<=s+1e-6 for p in(a,b));cone=all(s-1e-6<=p[1]<=T+1e-6 for p in(a,b)) and abs((a[0]-center)/(r+float(f['k'])*(a[1]-s))-(b[0]-center)/(r+float(f['k'])*(b[1]-s)))<=1e-6 and all(abs((p[0]-center)/(r+float(f['k'])*(p[1]-s)))<=1+1e-6 for p in(a,b));need(outer or rim or shank or cone,'every actual projected LINE follows original finite source/rim/shank/conical support')
        result.append(curves)
    need(sum(v['metadata']['valueBytes']+v['metadata']['tagBytes'] for v in read['views'])<=3276800,'actual aggregate analytic projection cap');return result

def inspect_svg(raw,item,readRow):
    need(0<len(raw)<=16*1024*1024,'actual SVG byte cap');curves=check_read(readRow);d=readRow['definition'];e=readRow['dimensions'];root=ET.fromstring(raw);S='{'+NS['s']+'}';need(root.tag==S+'svg' and root.attrib=={'width':'420mm','height':'297mm','viewBox':'0 0 420 297'},'exact physical SVG root grammar');need([x.tag for x in root]==[S+x for x in ('title','metadata','defs','rect','g','g')],'EXACT ordered title/metadata/baredefs/background/geometry/annotation grammar');title,meta,defs,background,geometry,annotations=list(root);need(title.attrib=={} and len(title)==0 and title.text==d['title'],'exact authored title');need(meta.attrib=={} and len(meta)==0,'bare metadata grammar');need(defs.attrib=={} and len(defs)==0,'actual renderer emits bare empty defs, no masking geometry');need(background.attrib=={'width':'100%','height':'100%','fill':'white'} and len(background)==0,'exact sole background');need(geometry.attrib=={'fill':'none','stroke':'#111','stroke-width':'.25'} and annotations.attrib=={'font-family':'sans-serif','font-size':'3'},'exact geometry/annotation style grammar');dimension_proof=_dimension_oracle.DimensionPresentation(root,d,need);metadata=dimension_proof.base_metadata();need(set(metadata)=={'version','drawingId','revision','geometryRevision','quality','status','curvePresentationTolerancePaperMm','dimensionRole'} and metadata['version']==1 and metadata['drawingId']==d['drawingId'] and metadata['revision']==item['issued']['revision']==readRow['before']['drawing']['revision'] and metadata['geometryRevision']==readRow['before']['capture']['solids']['revision'] and metadata['quality']=='native-bound-drawing-references' and metadata['status']=='available' and metadata['curvePresentationTolerancePaperMm']==.02 and metadata['dimensionRole']=='reference','exact current accepted-definition/revision/physical semantics')
    need(readRow['before']['drawing']['definition']==d and item['definition']==d,'actual accepted definition, no detached nominal substitute');expected=[(view,c) for view,cc in zip(d['views'],curves) for c in cc];all_paths=list(geometry);paths=[p for p in all_paths if p not in dimension_proof.paths];need(all(p.tag==S+'path' and len(p)==0 for p in all_paths) and len(paths)==len(expected) and len(all_paths)==len(expected)+len(dimension_proof.paths),'EXACT all Native fragments and independently rostered dimension paths, no filtered extras')
    for path,(view,c) in zip(paths,expected):
        attrs={'d'}|({'stroke','stroke-dasharray'} if c['hidden'] else set());need(set(path.attrib)==attrs and (not c['hidden'] or path.get('stroke')=='#777' and path.get('stroke-dasharray')=='2 1'),'exact V1 Native path grammar/visibility');points=path_points(path.attrib['d']);need([x for x in TOKEN.findall(path.attrib['d']) if x in ('M','L')]==['M']+['L']*(len(points)-1),'explicit emitted M then L grammar, no invisible move substitutions');need(len(points)==2 if c['line'] else len(points)>=2,'actual line/conic presentation');a,b=c['range']
        for i,p in enumerate(points):q=evaluate(c,a+(b-a)*i/(len(points)-1));vector(p,[view['paperOrigin'][0]+q[0],view['paperOrigin'][1]-q[1]])
        if not c['line']:need((math.hypot(*c['a'])+math.hypot(*c['b']))*((b-a)/(len(points)-1))**2/8<=.02+1e-12,'actual complete conic paper chord bound')
    factsById={f['dimensionId']:f for f in readRow['read']['observation']['dimensions']};frames={f['viewId']:f['frame'] for f in readRow['read']['observation']['viewFrames']}
    for j,dim in enumerate(d['dimensions']):
        view=one([v for v in d['views'] if v['viewId']==dim['viewId']],'actual dimension view');f=frames[view['viewId']]
        def paper(p):
            v=[p[i]-f['origin'][i] for i in range(3)];return[view['paperOrigin'][0]+sum(v[i]*f['u'][i] for i in range(3)),view['paperOrigin'][1]-sum(v[i]*f['v'][i] for i in range(3))]
        ends=list(map(paper,factsById[dim['dimensionId']]['anchors']));prefix='ΔX ' if dim['dimensionId']=='width' else 'ΔY ' if dim['dimensionId']=='height' else 'ΔZ ';value=e['width'] if dim['dimensionId']=='width' else e['height'] if dim['dimensionId']=='height' else e['thickness']
        dimension_proof.verify(dim['dimensionId'],[ends],prefix+format(value,'.3f')+' mm')
    texts=list(annotations);need(len(texts)==8 and all(t.tag==S+'text' and len(t)==0 for t in texts),'EXACT title/3dimensions/3captions/notice, no hidden SVG elements');need(texts[0].attrib=={'x':'8','y':'8'} and texts[0].text==d['title'],'exact visible authored title');values={'width':e['width'],'height':e['height'],'thickness':e['thickness']}
    for t,dim,prefix in zip(texts[1:4],d['dimensions'],('ΔX ','ΔY ','ΔZ ')):
        need(set(t.attrib)=={'x','y'}|set(dimension_proof.text_attributes(dim['dimensionId'])) and t.attrib['fill']=='#124' and t.text==prefix+format(values[dim['dimensionId']],'.3f')+' mm','exact actual physical source/cap label grammar');vector([float(t.attrib['x']),float(t.attrib['y'])],dim['label'])
    boxes=[]
    for t,view,cc in zip(texts[4:7],d['views'],curves):
        need(set(t.attrib)=={'x','y','data-view-caption-id','data-caption-role','data-caption-layout','font-family','font-size','textLength','lengthAdjust'} and t.attrib['data-view-caption-id']==view['viewId'] and t.attrib['data-caption-role']=='view' and t.attrib['data-caption-layout']=='observed-sheet-v1' and t.attrib['font-family']=='monospace' and t.attrib['font-size']=='3' and t.attrib['lengthAdjust']=='spacing' and t.text==view['basis'],'exact readable current caption grammar');x,y,length=(float(t.attrib[k]) for k in ('x','y','textLength'));need(all(math.isfinite(v) for v in (x,y,length)) and abs(length-len(view['basis'])*1.8)<=1e-9,'actual fixed-size caption length');box=[x-1,y-4,x+length+1,y+2];need(box[0]>=8 and box[1]>=16 and box[2]<=412 and box[3]<=281,'actual contained caption line box')
        bounds=[extrema(c) for c in cc];paperMaxY=view['paperOrigin'][1]-min(q[1] for q in bounds);need(box[1]-paperMaxY>=5,'actual padded caption clears OWN geometry by5mm');need(all(box[2]<=b[0] or b[2]<=box[0] or box[3]<=b[1] or b[3]<=box[1] for b in boxes),'caption boxes do not overlap');boxes.append(box)
    envelopes=[]
    for view,cc in zip(d['views'],curves):
        bounds=[extrema(c) for c in cc];ox,oy=view['paperOrigin'];envelopes.append([ox+min(q[0]for q in bounds),oy-max(q[3]for q in bounds),ox+max(q[2]for q in bounds),oy-min(q[1]for q in bounds)])
    dimension_proof.finish(envelopes)
    need(texts[7].attrib=={'x':'8','y':'292'} and texts[7].text==dimension_proof.footer('Reference drawing · available · scale 1:1'),'exact factual reference notice');need(not any('THRU' in(t.text or '') or 'UNRESOLVED' in(t.text or '') for t in texts),'no false conical THRU/angle annotation');return{'quality':'independent-original-cone/shank-projection/actual-Native-record/strict-SVG-grammar','views':3,'fragments':len(expected),'sourceDimensionsMm':[e['width'],e['height'],e['thickness']],'paperChordMm':.02,'coneAnnotationClaim':False,'captionOwnGeometryClearanceMm':5}
