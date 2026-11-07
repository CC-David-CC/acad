#!/usr/bin/env python3
"""Independent AFTER-workflow JSON/XML oracle. Standard library; no app imports."""
import argparse, hashlib, json, math, re, sys
from pathlib import Path
from urllib.parse import urlparse, unquote
import xml.etree.ElementTree as ET

NS={'s':'http://www.w3.org/2000/svg'}
ORIGINS={'original':[0,0], 'negative-datum':[-80,-40]}
FRAMES={'top':([1,0,0],[0,1,0],[0,0,1]),'front':([1,0,0],[0,0,1],[0,-1,0]),'right':([0,1,0],[0,0,1],[1,0,0])}
PHASES={'original':(100,50,20,10),'reopened':(150,30,25,14),'unresolved':(150,30,25,12),'final':(150,30,25,12)}
sha=lambda b:hashlib.sha256(b).hexdigest()

def require(ok,message):
    if not ok: raise ValueError(message)
def near(a,b,tol=1e-6):
    require(isinstance(a,(int,float)) and math.isfinite(a) and abs(a-b)<=tol,f'{a!r} != {b!r} within {tol}')
def vector(a,b,tol=1e-6):
    require(len(a)==len(b),'vector length');[near(x,y,tol) for x,y in zip(a,b)]
def one(rows,label):
    require(len(rows)==1,f'{label}: expected one, got {len(rows)}');return rows[0]
def objects(source): return {o['id']:o for o in source['objects']}
def measures(history,source):
    h={int(o['params']['featureId']):o for o in history}
    profile=one([o for o in history if o['type']=='WORKER_SELECTED_PROFILE_EXTRUDE_V2'],'profile')
    hole=one([o for o in history if o['type']=='WORKER_THROUGH_HOLES_V1'],'hole')
    segments=list(objects(source).values());require(len(segments)==4 and all(o['type']=='Segment' for o in segments),'four genuine saved Segments')
    xy=[o['data'][k] for o in segments for k in ('a','b')]
    x0=min(p['x'] for p in xy);y0=min(p['y'] for p in xy);w=max(p['x'] for p in xy)-x0;hh=max(p['y'] for p in xy)-y0
    require(all(min(abs(p['x']-a) for a in (x0,x0+w))<=1e-6 and min(abs(p['y']-a) for a in (y0,y0+hh))<=1e-6 for p in xy),'axis-aligned source corners')
    for i,o in enumerate(segments): vector(list(o['data']['b'].values()),list(segments[(i+1)%4]['data']['a'].values()))
    return h,profile,hole,(x0,y0,w,hh,profile['params']['depth'],hole['params']['diameter'])
def expected_values(m):
    x,y,w,h,d,diam=m;return {'width':w,'height':h,'depth':d,'hole-diameter':diam,'hole-offset-x':abs(x+w/2),'hole-offset-y':abs(y+h/2)}
def source_point(ref,source):
    obj=objects(source)[ref['curveId']];require(obj['type']=='Segment' and ref['curveType']=='segment','actual source curve kind')
    p=obj['data'][ref['point']];return [p['x'],p['y'],0]
def definition_refs(definition,history,source,case,plan=None,broken=False):
    h,p,hole,m=measures(history,source);b=case['binding'];dt=definition['datum'];t=definition['target']
    require(dt=={'featureId':p['params']['featureId'],'faceId':p['params']['faceId'],'regionId':p['params']['regionId']},'datum matches genuine selected constructor, opaque region exact')
    require(t['featureId']==b['last']['featureId'] and h[t['featureId']]['type']==t['operationType'],'target actual producer operation')
    require(t['engine']=='occ' and t['engineRevision']==p['params']['engineRevision'] and t['output']=='complete-native-result','exact native target build/policy')
    ids=[]
    for dim in definition['dimensions']:
        if dim['kind']=='source-distance':
            for k in ('from','to'):
                r=dim[k];require(all(r[z]==dt[z] for z in ('featureId','faceId','regionId')),'source-point datum custody');source_point(r,source);ids.append(r['curveId'])
        elif dim['kind']=='plane-distance':
            require(dim['axis']=='datum-normal' and dim['viewId'] in ('front','right'),'normal dimension visible view')
            for role,k in [('first-cap','first'),('last-cap','second')]:
                r=dim[k];require(r['originFeatureId']==dt['featureId'] and r['geometry']=='plane','native cap authored origin')
                if plan is not None:
                    found=one([v for v in plan['faces'] if v['id']==r['selectionId']],'actual recorded cap key')
                    require(found['role']==role and found['geometry']=='plane' and found['originFeatureId']==dt['featureId'],'key matches actual recorded cap role; no key parsing')
                ids.append(r['selectionId'])
        else:
            r=dim['hole'];require(r['sourceFeatureId']==dt['featureId'] and r['faceId']==dt['faceId'] and r['regionId']==dt['regionId'],'hole source custody')
            target=h.get(r['featureId']);require(target is not None,'reference feature is actual history member')
            require((target['type']=='WORKER_THROUGH_HOLES_V1') != broken,'valid vs deliberately unresolved hole reference kind')
            if not broken: require(r['featureId']==hole['params']['featureId'],'actual semantic hole ID')
            ids.append(str(r['featureId']))
    require(set(definition)=={'version','unit','drawingId','title','target','datum','sheet','views','dimensions'},'saved definition fields contain no solved facts')
    forbidden={'handle','nativeIndex','measurements','value','values','anchors','frame','mesh','brep'}
    def no_facts(v):
        if isinstance(v,dict):
            require(not(forbidden & set(v)),'definition contains runtime/measurement field');[no_facts(x) for x in v.values()]
        elif isinstance(v,list): [no_facts(x) for x in v]
    no_facts(definition)
    require([v['basis'] for v in definition['views']]==['top','front','right'],'three saved named views')
    require(definition['sheet']=={'width':420,'height':297,'scale':{'numerator':1,'denominator':1}},'fixed independently expected physical sheet/scale')
    return m,ids

def check_read(row,case,engine):
    before=row['before'];require(before==row['after'],'serialized accepted state/tokens/counters/resources before==after')
    n=before['capture']['native'];source=json.loads(n['source']);history=n['history'];definition=row['definition'];read=row['read'];broken=row['unresolved']
    body=one([b for b in before['capture']['solids']['bodies'] if b['featureId']==definition['target']['featureId']],'current output')
    require(body['selections']['status']=='available','actual exposed selection map')
    m,ids=definition_refs(definition,history,source,case,body['selections']['plan'],broken)
    require(read['revision']==before['drawing']['revision'] and read['geometryRevision']==before['drawing']['geometryRevision'],'actual document/geometry binding')
    require(read['target']=={'bodyId':body['id'],'featureId':body['featureId'],'engine':'occ','engineRevision':engine},'read current body/producer/build tuple')
    require(read['status']==('unresolved' if broken else 'available'),'read status')
    obs=read['observation'];require(obs['quality']=='native-bound-drawing-references' and obs['scope']=='response-local' and obs['unit']=='millimeter','native reference quality/unit')
    require(obs['datumFrame']=={'origin':[0,0,0],'x':[1,0,0],'y':[0,1,0],'z':[0,0,1]},'source datum frame independent identity')
    for frame,view in zip(obs['viewFrames'],definition['views']):
        u,v,nn=FRAMES[view['basis']];require(frame=={'viewId':view['viewId'],'frame':{'origin':[0,0,0],'u':u,'v':v,'n':nn}},'independent right-handed view convention')
    values=expected_values(m);x,y,w,h,d,diam=m
    for dim,fact in zip(definition['dimensions'],obs['dimensions']):
        require((fact['dimensionId'],fact['kind'])==(dim['dimensionId'],dim['kind']),'dimension map/order')
        if broken and dim['kind'] in ('hole-diameter','hole-offset'):
            require(fact['status']=='unresolved' and fact['value'] is None and fact['quality'] is None and fact['anchors']==[] and fact['reason'],'lost reference has no factual value');continue
        require(fact['status']=='available' and fact['reason'] is None,'available dimension');near(fact['value'],values[dim['dimensionId']])
        a,b=fact['anchors'];
        if dim['kind']=='source-distance':
            vector(a,source_point(dim['from'],source));vector(b,source_point(dim['to'],source));near(abs(b[0 if dim['axis']=='datum-x' else 1]-a[0 if dim['axis']=='datum-x' else 1]),fact['value'])
        elif dim['kind']=='plane-distance':
            vector(a[:2],b[:2]);near(a[2],0);near(b[2],d);near(abs(b[2]-a[2]),fact['value'])
        elif dim['kind']=='hole-diameter':
            vector([(a[i]+b[i])/2 for i in range(2)],[x+w/2,y+h/2]);near(math.dist(a,b),diam)
        else:
            k=0 if dim['axis']=='datum-x' else 1;near(a[k],0);near(b[k],(x+w/2,y+h/2)[k]);near(abs(b[k]-a[k]),fact['value'])
    for view,definition_view in zip(read['views'],definition['views']):
        meta=view['metadata'];require(view['viewId']==definition_view['viewId'] and view['status']=='available','actual projection present')
        require(meta['quality']=='native-brep-orthographic' and meta['persistentIds'] is False and meta['copyTShapesDisjoint'] is True,'projection derived/disjoint')
        u,v,nn=FRAMES[definition_view['basis']];vector(meta['frame'],[0,0,0,*u,*v,*nn],0)
        require(sum(meta['groupCounts'])==meta['fragmentCount']>0,'complete eight-group count')
        require(view['values']['byteLength']==meta['valueBytes']==96*meta['fragmentCount'] and view['tags']['byteLength']==meta['tagBytes']==4*meta['fragmentCount'],'record layout/bytes')
    metrics=body['metrics'];volume=w*h*d-math.pi*(diam/2)**2*d-2*(9-9*math.pi/4)*d-d
    near(metrics['nativeVolume'],volume);vector(metrics['nativeBounds']['min'],[x,y,0]);vector(metrics['nativeBounds']['max'],[x+w,y+h,d])
    require(metrics['nativeValidity']['valid'] is True and metrics['solidCount']==1,'recorded validity/count (not inferred from SVG)')
    r=before['ownership']['resources'];require(all(r[k]==0 for k in ('mounts','candidates','accepted')) and r['cleanupFailed'] is False,'settled observation resources')
    return {'case':case['name'],'revision':read['revision'],'geometryRevision':read['geometryRevision'],'unresolved':broken,'dimensions':values,'nativeVolumeError':abs(metrics['nativeVolume']-volume),'referencedIds':ids}

TOKEN=re.compile(r'[ML]|[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?')
def path_points(text):
    require(not TOKEN.sub('',text).replace(',','').strip(),'unexpected SVG path syntax')
    tokens=TOKEN.findall(text);points=[];command=None;i=0
    while i<len(tokens):
        if tokens[i] in ('M','L'): command=tokens[i];i+=1
        require(command is not None and i+1<len(tokens) and tokens[i] not in ('M','L') and tokens[i+1] not in ('M','L'),'SVG coordinate pair')
        p=[float(tokens[i]),float(tokens[i+1])];require(all(math.isfinite(v) for v in p),'finite SVG point');points.append(p);i+=2
    require(len(points)>=2,'nonempty path');return points

def check_svg(root_dir,item,receipt,case):
    filename=item['savedFile'];raw=(root_dir/filename).read_bytes();require(sha(raw)==item['sha256'] and len(raw)==item['byteLength'],'SVG actual bytes/hash')
    stage=filename[len(case['name'])+1:-4];w,h,d,diam=PHASES[stage];x,y=ORIGINS[case['name']];cx=x+w/2;cy=y+h/2
    row=one([r for r in receipt['rows'] if r.get('artifact',{}).get('savedFile')==filename],'export state row');require(row['before']==row['after'],'SVG readonly state equality')
    definition=row['before']['drawing']['definition'];read_match=one([r for r in receipt['rows'] if 'read'in r and r['case']==case['name'] and r['read']['revision']==row['before']['drawing']['revision'] and r['read']['geometryRevision']==row['before']['drawing']['geometryRevision']][:1],'matching real read binding')
    require(read_match['definition']==definition,'SVG definition bound to observed source')
    xml=ET.fromstring(raw);require(xml.tag=='{'+NS['s']+'}svg','namespaced actual XML root');require(xml.attrib=={'width':'420mm','height':'297mm','viewBox':'0 0 420 297'},'physical mm SVG dimensions/viewBox')
    require(all('transform' not in el.attrib for el in xml.iter()),'no hidden display transform or scale')
    require(not xml.findall('.//s:script',NS) and not xml.findall('.//s:foreignObject',NS),'no active SVG elements')
    meta=json.loads(one(xml.findall('s:metadata',NS),'SVG metadata').text)
    require(meta['drawingId']==definition['drawingId'] and meta['revision']==row['before']['drawing']['revision'] and meta['geometryRevision']==row['before']['drawing']['geometryRevision'],'SVG exact document/geometry tokens')
    status='unresolved' if stage=='unresolved' else 'available';require(meta['status']==status and meta['dimensionRole']=='reference' and meta['quality']=='native-bound-drawing-references','derived reference status/quality')
    near(meta['curvePresentationTolerancePaperMm'],.02,0)
    texts=xml.findall('.//s:text',NS);labels=[t.text or '' for t in texts];require(all(v in labels for v in ('top','front','right')),'all three named views')
    require(labels[0]==definition['title'],'title replacement/restore')
    expected=expected_values((x,y,w,h,d,diam));unresolved=[]
    for dim in definition['dimensions']:
        factlabel='UNRESOLVED: '+dim['dimensionId'] if stage=='unresolved' and 'hole' in dim else ('Ø' if dim['kind']=='hole-diameter' else 'L ' if dim['kind']=='edge-length' else 'ΔZ ' if dim['kind']=='plane-distance' else 'ΔX ' if dim['axis']=='datum-x' else 'ΔY ')+f"{expected[dim['dimensionId']]:.3f} mm"
        matches=[t for t in texts if t.text==factlabel and [float(t.attrib['x']),float(t.attrib['y'])]==dim['label']];one(matches,'label at authored paper coordinates')
        if factlabel.startswith('UNRESOLVED'): unresolved.append(dim['dimensionId']);require(matches[0].get('fill')=='#a00','explicit unresolved appearance')
    require(len([t for t in labels if t.startswith('UNRESOLVED:')])==(3 if stage=='unresolved' else 0),'exact unresolved count/no ghost factual labels')
    groups=xml.findall('s:g',NS);require(len(groups)==2,'presentation groups')
    geometry=[el for el in groups[0] if el.tag=='{'+NS['s']+'}path' and el.get('stroke') in (None,'#777')]
    bounds={'top':[110+x,100-(y+h),110+x+w,100-y],'front':[110+x,190-d,110+x+w,190],'right':[310+y,190-d,310+y+h,190]}
    by_view={k:[] for k in bounds}
    for el in geometry:
        pts=path_points(el.attrib['d']);members=[name for name,(a,b,c,e) in bounds.items() if all(a-1e-6<=p[0]<=c+1e-6 and b-1e-6<=p[1]<=e+1e-6 for p in pts)]
        name=one(members,'unambiguous projection layout region');by_view[name].append((el,pts))
    for name,paths in by_view.items():
        require(paths,'nonempty '+name+' geometry');pts=[p for _,pp in paths for p in pp];vector([min(p[0] for p in pts),min(p[1] for p in pts),max(p[0] for p in pts),max(p[1] for p in pts)],bounds[name])
        require(any(el.get('stroke-dasharray')=='2 1' for el,_ in paths),'hidden HLR paths in '+name)
    center=[110+cx,100-cy];circle=[]
    for el,pts in by_view['top']:
        if len(pts)>=8 and math.dist(pts[0],pts[-1])<1e-6 and all(abs(math.dist(p,center)-diam/2)<1e-6 for p in pts):circle.append(pts)
    require(circle,'actual SVG full bore-circle radius/location, independent of label')
    for name,axis_center in [('front',110+cx),('right',310+cy)]:
        for side in (-1,1):
            wall=axis_center+side*diam/2
            candidates=[pts for el,pts in by_view[name] if el.get('stroke-dasharray')=='2 1' and all(abs(p[0]-wall)<1e-6 for p in pts) and abs(min(p[1] for p in pts)-(190-d))<1e-6 and abs(max(p[1] for p in pts)-190)<1e-6]
            require(candidates,'analytic hidden bore wall '+name+str(side))
    return {'file':filename,'sha256':sha(raw),'status':status,'expectedDimensionsMm':expected,'projectedBoundsPaperMm':bounds,'geometryPaths':len(geometry),'boreCirclePaths':len(circle),'unresolvedLabels':unresolved,'documentRevision':meta['revision'],'geometryRevision':meta['geometryRevision']}

def check_native(root_dir,item,receipt,case):
    filename=item['savedFile'];raw=(root_dir/filename).read_bytes();require(sha(raw)==item['sha256'] and len(raw)==item['bytes'],'native actual bytes/hash')
    n=json.loads(raw);require(set(n)=={'format','version','unit','project','drawings'} and n['format']=='codi-jsketcher-project' and n['version']==3 and n['unit']=='millimeter','actual native v3 envelope')
    require(len(n['drawings'])==1 and n['drawings'][0]==item['definition'],'saved definition exact, no solved projection')
    history=n['project']['model']['history'];source=one(n['project']['sketches'],'one actual saved sketch')['data'];broken=filename.endswith('-unresolved.jsketcher.json')
    m,ids=definition_refs(n['drawings'][0],history,source,case,broken=broken);x,y=ORIGINS[case['name']];vector(m,[x,y,150,30,25,14 if filename.endswith('-edited.jsketcher.json') else 12])
    require([int(o['params']['featureId'])for o in history]==[1,2,3,4,5] and n['project']['model']['counters']=={'featureId':5},'stable original IDs/highwater')
    require(n['project']['model']['expressions']=='' and n['project']['model']['assembly']==[],'no unrelated typed/assembly rewrite')
    constraints=source['stages'][0]['constraints'];lengths=[float(c['constants']['length'])for c in constraints if c['typeId']=='SegmentLength'];require(sorted(lengths)==[30,150],'persisted actual driving constraints')
    require(source['metadata']['boundaryFrame']=={'origin':[0,0,0],'x':[1,0,0],'y':[0,1,0],'z':[0,0,1]},'native source construction frame')
    p=history[1]['params'];hole=history[2]['params'];require(hole['sourceFeatureId']==p['featureId'] and hole['producerFeatureId']==p['featureId'] and hole['sourceFaceId']==p['faceId'] and hole['sourceRegionId']==p['regionId'],'semantic constructor binding')
    treatments=history[3:];require([(o['params']['kind'],o['params']['size'])for o in treatments]==[('fillet',3),('chamfer-equal',1)],'retained treatment definitions')
    for i,o in enumerate(treatments,3):require(o['params']['producerFeatureId']==int(history[i-1]['params']['featureId']) and len(o['params']['edgeIds'])==2,'original treatment chain, two actual keys')
    require(all(o['params'].get('engineRevision',receipt['engineRevision'])==receipt['engineRevision'] for o in history),'one exact saved backend revision')
    for dim in n['drawings'][0]['dimensions']:
        if dim['kind']=='plane-distance':
            matching=[r for r in receipt['rows'] if 'read'in r and r['case']==case['name']]
            for key in ('first','second'):
                require(any(any(f['id']==dim[key]['selectionId'] for b in r['before']['capture']['solids']['bodies'] for f in b.get('selections',{}).get('plan',{}).get('faces',[]))for r in matching),'saved native reference belongs to actual observed selection map')
    return {'file':filename,'sha256':sha(raw),'sourceGeometryMm':m,'authoredReferenceIds':ids,'deliberatelyUnresolved':broken,'featureIds':[1,2,3,4,5],'savedDefinitionOnly':True}

def main():
    parser=argparse.ArgumentParser();parser.add_argument('input',type=Path);parser.add_argument('--output',type=Path,required=True);args=parser.parse_args();root=args.input.resolve();r=json.loads((root/'receipt.json').read_text())
    result={'scope':'Standalone Python after-complete-workflow SVG/native artifact review; no production validators, Native execution, browser or geometry authoring. Not full E22.','status':'PASS','inputReceiptSha256':sha((root/'receipt.json').read_bytes()),'oracleSha256':sha(Path(__file__).read_bytes()),'runtimePins':r['pins'],'svg':[],'native':[],'reads':[],'failures':[]}
    def run(label,fn):
        try:return fn()
        except Exception as error:result['status']='FAIL';result['failures'].append({'scope':label,'type':type(error).__name__,'message':str(error)});return None
    def pins():
        require(r['status']=='PASS' and len(r['rows'])==56 and len(r['svgFiles'])==8 and len(r['nativeSaves'])==6,'complete actual input corpus')
        require(r['sourcePins']==r['sourceHashesAfter'],'frozen producer source pins before/after')
        records=[]
        for uri,want in r['sourcePins'].items():
            path=Path(unquote(urlparse(uri).path));actual=sha(path.read_bytes());require(actual==want,'current source differs from recorded pin '+path.name);records.append({'path':str(path),'sha256':actual})
        for row in r['rows']:
            if 'assets'in row:
                require({v['name']:v['sha256']for v in row['assets']}==r['pins']['files'],'served asset map differs')
                require(row['outer']['sha256']==r['pins']['outer']['sha256'],'served outer hash')
        require(r['engineRevision']=='sha256:'+r['pins']['files']['static/manufacturing-mesh/manufacturing-mesh-occ-portable.js']+':'+r['pins']['files']['static/manufacturing-mesh/manufacturing-mesh-occ.wasm'],'exact native JS/WASM pair')
        return records
    result['sourceVerification']=run('source/runtime pins',pins)
    cases={c['name']:c for c in r['cases']}
    for row in r['rows']:
        if 'read'in row:
            value=run('read '+row['case']+' '+row['read']['revision'],lambda row=row:check_read(row,cases[row['case']],r['engineRevision']));
            if value:result['reads'].append(value)
    for item in r['svgFiles']:
        value=run(item['savedFile'],lambda item=item:check_svg(root,item,r,cases[item['case']]));
        if value:result['svg'].append(value)
    for item in r['nativeSaves']:
        value=run(item['savedFile'],lambda item=item:check_native(root,item,r,cases[item['case']]));
        if value:result['native'].append(value)
    result['limitations']=['SVG polylines are presentation; successful XML/label/geometry checks do not prove arbitrary Native validity or engineering drawing compliance.','Native facts are recorded genuine observations, not a fresh independent kernel execution.','Only fixed plate/center-hole/edge-treatment cases and the two datum origins are covered.','No rotated datum, changed sheet scale, edge-length dimension, all lost-reference categories or human editing UI is qualified.','JSON/XML use SHA-256 byte identity; no ZIP or CRC applies.']
    args.output.parent.mkdir(parents=True,exist_ok=True);require(not args.output.exists(),'use fresh output receipt');args.output.write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({'status':result['status'],'svg':len(result['svg']),'native':len(result['native']),'reads':len(result['reads']),'failures':result['failures']},indent=2));return 0 if result['status']=='PASS' else 1
if __name__=='__main__':sys.exit(main())
