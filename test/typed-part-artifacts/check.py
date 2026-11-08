#!/usr/bin/env python3
"""Independent after-the-whole-workflow source/STEP/ZIP/XML/mesh oracle.
No production validator, geometry executor, browser or server is imported.
"""
import argparse, hashlib, importlib.util, io, json, math, re, sys, zipfile
from pathlib import Path
from urllib.parse import urlparse, unquote
from xml.etree import ElementTree as ET
from step_oracle import inspect_step

WIDTHS={'initial':100,'edited':120,'reopened':120,'reedited':130}
NATIVE={'initial':'initial-source','edited':'edited-source','reopened':'edited-source','reedited':'reedited-source'}
NS={'m':'http://schemas.microsoft.com/3dmanufacturing/core/2015/02','s':'http://www.w3.org/2000/svg'}
IDENTITY=[1,0,0,0,1,0,0,0,1,0,0,0]
sha=lambda data:hashlib.sha256(data).hexdigest()
def require(ok,message):
    if not ok:raise ValueError(message)
def near(a,b,t=1e-6):require(isinstance(a,(int,float)) and math.isfinite(a) and abs(a-b)<=t,f'{a!r} != {b!r}')
def vector(a,b,t=1e-6):
    require(len(a)==len(b),'vector length')
    for x,y in zip(a,b):near(x,y,t)
def one(rows,label):require(len(rows)==1,f'one {label}, got {len(rows)}');return rows[0]
def truth(width):
    height=width/2;depth=width/5;radius=width/20;small=radius*.4;edge=width*.08
    bores=[(width/2,height/2,radius),(edge,edge,small),(width-edge,edge,small),(width-edge,height-edge,small),(edge,height-edge,small)]
    return {'bounds':{'min':[0,0,0],'max':[width,height,depth]},'bores':bores,'volume':(width*height-math.pi*sum(r*r for x,y,r in bores))*depth,'width':width,'height':height,'depth':depth,'diameter':2*radius}
def definitions(width):return [{'name':'width','dimension':'length','expression':f'mm({width})'},{'name':'height','dimension':'length','expression':'width / 2'},{'name':'depth','dimension':'length','expression':'width / 5'},{'name':'hole','dimension':'length','expression':'width / 10'},{'name':'corner','dimension':'length','expression':'hole * 0.4'},{'name':'edge','dimension':'length','expression':'width * 0.08'}]
def derive(native,binding,width,engine,definition):
    require(native['format']=='codi-jsketcher-project' and native['version']==3 and native['unit']=='millimeter','real native v3 envelope')
    project=native['project'];history=project['model']['history'];require([row['type'] for row in history]==['PLANE','WORKER_SELECTED_PROFILE_EXTRUDE_V2','WORKER_THROUGH_HOLES_V1','WORKER_THROUGH_HOLES_V1'],'only the integrated typed family')
    plane,p,c,k=[row['params'] for row in history];require(plane['orientation']=='XY' and plane['datum'] is None and plane['depth']==0,'actual canonical source plane')
    require(p['featureId']==binding['profile']['featureId'] and p['faceId']==binding['faceId'] and p['regionId']==binding['regionId'] and p['depth']=='depth' and p['bodyPolicy']=='separate','actual profile identity and saved binding')
    for value,expected,producer,kind in [(c,binding['center'],binding['profile'],'centered-through'),(k,binding['corners'],binding['center'],'four-corner-through')]:
        require(value['featureId']==expected['featureId'] and value['target']==producer['outputId'] and value['producerFeatureId']==producer['featureId'],'real hole target/producer')
        require(value['sourceFeatureId']==p['featureId'] and value['sourceFaceId']==p['faceId'] and value['sourceRegionId']==p['regionId'] and value['kind']==kind,'actual hole source identities')
        require(value['diameter']==('hole' if kind=='centered-through' else 'corner'),'persisted diameter name')
        if kind=='four-corner-through':require(value['offsetX']==value['offsetY']=='edge','persisted offsets')
    for value in (p,c,k):require(value['engine']=='occ' and value['engineRevision']==engine and value['unit']=='millimeter','unchanged explicit part backend')
    prefix='codi-physical-parameters:1\n';expression=project['model']['expressions'];require(expression.startswith(prefix),'typed source prefix');require(json.loads(expression[len(prefix):])==definitions(width),'exact authored formula DAG')
    source=one([row['data'] for row in project['sketches'] if row['id']==binding['faceId']],'saved real source');require(len(project['sketches'])==1 and len(source['objects'])==4,'one source with four actual segments')
    frame={'origin':[0,0,0],'x':[1,0,0],'y':[0,1,0],'z':[0,0,1]};require(source['metadata']['boundaryFrame']==frame,'saved datum frame')
    points=[];edges=set();objects={o['id']:o for o in source['objects']};require(len(objects)==4,'unique source IDs');constraints=source['stages'][0]['constraints']
    for o in source['objects']:
        require(o['type']=='Segment' and o['role'] is None and o['stage']==0,'ordinary source segment')
        a,b=[tuple(o['data'][end][axis] for axis in ('x','y')) for end in ('a','b')];points.extend((a,b));key=tuple(sorted((a,b)));require(key not in edges and a!=b,'distinct nonzero source edges');edges.add(key)
        bound=[r for r in constraints if r['typeId']=='SegmentLength' and r['objects']==[o['id']]]
        for row in bound:
            name=row['constants']['length'];require(name in ('width','height'),'named source driving length');near(math.dist(a,b),width if name=='width' else width/2)
    near(min(p[0] for p in points),0);near(min(p[1] for p in points),0);near(max(p[0] for p in points),width);near(max(p[1] for p in points),width/2)
    expected_corners=[(0,0),(width,0),(width,width/2),(0,width/2)];require(all(any(math.dist(p,c)<=1e-6 for c in expected_corners) for p in points),'source corner coordinates')
    require(len([r for r in constraints if r['typeId']=='SegmentLength' and r['constants']['length']=='width'])==1 and len([r for r in constraints if r['typeId']=='SegmentLength' and r['constants']['length']=='height'])==1,'actual two source bindings')
    require(native['drawings']==[definition],'same authored drawing definition persisted')
    datum=definition['datum'];require(datum=={'featureId':p['featureId'],'faceId':p['faceId'],'regionId':p['regionId']},'drawing source binding')
    require(definition['target']=={'featureId':k['featureId'],'operationType':'WORKER_THROUGH_HOLES_V1','engine':'occ','engineRevision':engine,'output':'complete-native-result'},'drawing actual output binding')
    for dim in definition['dimensions']:
        if dim['kind']=='source-distance':
            for name in ('from','to'):
                ref=dim[name];require(ref['featureId']==p['featureId'] and ref['faceId']==p['faceId'] and ref['regionId']==p['regionId'] and ref['curveType']=='segment' and ref['curveId'] in objects and ref['point'] in ('a','b'),'authentic source selector')
            axis={'datum-x':'x','datum-y':'y'}[dim['axis']];a,b=[objects[dim[key]['curveId']]['data'][dim[key]['point']][axis] for key in ('from','to')];near(abs(a-b),width if axis=='x' else width/2)
        if 'hole' in dim:require(dim['hole']=={'kind':'center-hole','featureId':c['featureId'],'sourceFeatureId':p['featureId'],'faceId':p['faceId'],'regionId':p['regionId'],'slot':'center','geometry':'cylinder'},'real centered hole witness selector')
    forbidden={'handle','nativeIndex','mesh','brep','resolvedValue','sourceSha256','snapshot'}
    require(not any(forbidden.intersection(row['params']) for row in history),'no derived runtime data in feature intents')
    m=native['manufacturing'];require(m['version']==1 and m['unit']=='millimeter' and re.fullmatch('sha256-[a-f0-9]{64}',m['revision']),'saved material geometry revision')
    require(m['materials']==[{'id':'pla','name':'PLA'}] and m['appearances']==[{'id':'blue','name':'Blue','color':'#3366ff'}],'exact material/color identities')
    alias=one(m['bindings'],'binding');require(alias['featureId']==k['featureId'] and alias['operationType']=='WORKER_THROUGH_HOLES_V1','actual final producer binding')
    require(m['objects']==[{'id':'plate','name':'Typed mounting plate','regions':[{'id':'main','bodyId':alias['id'],'materialId':'pla','appearanceId':'blue','transform':IDENTITY}]}],'saved printable part/material intent')
    return {'truth':truth(width),'source':source,'history':history,'metadata':m,'definition':definition,'bodyId':binding['corners']['outputId'],'featureId':k['featureId'],'engineRevision':engine}

def check3mf(raw,derived,mesh_inspect):
    require(len(raw)<=67108864,'3MF file cap')
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        names=z.namelist();require(len(names)==len(set(names)) and set(names)=={'[Content_Types].xml','_rels/','_rels/.rels','3D/','3D/3dmodel.model'},'closed ZIP members');require(z.testzip() is None,'actual ZIP CRCs')
        rel=ET.fromstring(z.read('_rels/.rels'));require(len(rel)==1 and rel[0].attrib['Target']=='/3D/3dmodel.model' and rel[0].attrib['Type']=='http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel','3MF root relationship')
        ct=ET.fromstring(z.read('[Content_Types].xml'));require(any(r.attrib.get('Extension')=='model' and r.attrib.get('ContentType')=='application/vnd.ms-package.3dmanufacturing-3dmodel+xml' for r in ct),'3MF content type')
        xml=z.read('3D/3dmodel.model');require(len(xml)<=48*1024*1024,'bounded model XML');model=ET.fromstring(xml);require(model.attrib['unit']=='millimeter','canonical 3MF mm');md={m.attrib['name']:m.text for m in model.findall('m:metadata',NS)}
        require(set(md)=={'codi:SourceRevision','codi:ManufacturingBindings'} and md['codi:SourceRevision']==derived['metadata']['revision'][7:],'actual saved manufacturing revision')
        p=json.loads(md['codi:ManufacturingBindings']);require(p['version']==1 and p['revision']==md['codi:SourceRevision'],'3MF provenance revision');part=one(p['parts'],'3MF part');region=one(part['regions'],'3MF region');pair=one(p['materialPairs'],'3MF material pair')
        require(part['id']=='plate' and part['name']=='Typed mounting plate' and region['id']=='main' and region['bodyId']==derived['bodyId'] and region['featureId']==derived['featureId'] and region['engine']=='occ' and region['engineRevision']==derived['engineRevision'],'real part/producer/build provenance')
        require(region['materialId']=='pla' and region['appearanceId']=='blue' and pair['materialId']=='pla' and pair['appearanceId']=='blue' and pair['index']==region['materialIndex']==0,'material mapping')
        resources=model.find('m:resources',NS);require(len(resources)==4,'one material and three component resources');ids=[int(r.attrib['id']) for r in resources];require(len(set(ids))==4,'unique resource IDs');objects={int(r.attrib['id']):r for r in resources.findall('m:object',NS)};require(len(objects)==3,'mesh/component/build objects')
        bases=one(resources.findall('m:basematerials',NS),'material table');require(int(bases.attrib['id'])==pair['resourceId']==region['materialResourceId'] and len(bases)==1 and bases[0].attrib=={'name':'PLA','displaycolor':'#3366FF'},'actual core material/color')
        def identity(element):
            if 'transform' in element.attrib:vector([float(x) for x in element.attrib['transform'].split()],IDENTITY,0)
        item=one(model.find('m:build',NS),'build item');require(int(item.attrib['objectid'])==part['buildResourceId'],'build resource association');identity(item)
        for current,target,name in [(part['buildResourceId'],region['componentResourceId'],'Typed mounting plate'),(region['componentResourceId'],region['meshResourceId'],'main')]:
            obj=objects[current];require(obj.attrib['type']=='model' and obj.attrib['name']==name and obj.find('m:mesh',NS) is None,'semantic component');ref=one(obj.find('m:components',NS),'component reference');require(int(ref.attrib['objectid'])==target,'component association');identity(ref)
        obj=objects[region['meshResourceId']];require(obj.attrib['type']=='model' and obj.attrib['name']=='main' and int(obj.attrib['pid'])==pair['resourceId'] and int(obj.attrib['pindex'])==0,'mesh material index')
        mesh=obj.find('m:mesh',NS);vr=mesh.find('m:vertices',NS);tr=mesh.find('m:triangles',NS);require(all(set(v.attrib)=={'x','y','z'} for v in vr) and all(set(t.attrib)=={'v1','v2','v3'} for t in tr),'exact mesh coordinates/indices')
        vertices=[tuple(float(v.attrib[k]) for k in ('x','y','z')) for v in vr];triangles=[tuple(int(t.attrib[k]) for k in ('v1','v2','v3')) for t in tr]
    return {'provenance':p,'geometry':mesh_inspect(vertices,triangles,derived['truth'],True)}

def check_svg(raw,derived,result,tokens):
    root=ET.fromstring(raw);d=derived['definition'];t=derived['truth'];require(root.tag=='{http://www.w3.org/2000/svg}svg','SVG namespace');require(root.attrib=={'width':'420mm','height':'297mm','viewBox':'0 0 420 297'},'physical sheet size');require(root.find('s:title',NS).text==d['title'],'drawing title')
    meta=json.loads(root.find('s:metadata',NS).text);require(meta['version']==1 and meta['drawingId']==d['drawingId'] and meta['revision']==result['sourceRevision']==tokens['revision'] and meta['geometryRevision']==tokens['geometryRevision'] and meta['quality']=='native-bound-drawing-references' and meta['status']=='available' and meta['dimensionRole']=='reference','actual drawing tokens/availability/quality');require(meta['curvePresentationTolerancePaperMm']==.02,'derived presentation tolerance')
    texts=root.findall('.//s:text',NS);require(not any('UNRESOLVED' in (x.text or '') for x in texts),'no hidden unresolved facts');require(any('Reference drawing' in (x.text or '') and 'scale 1:1' in x.text for x in texts),'explicit reference role and scale')
    expected={'width':('ΔX ',t['width']),'height':('ΔY ',t['height']),'depth':('ΔZ ',t['depth']),'hole-diameter':('Ø',t['diameter']),'hole-offset-x':('ΔX ',t['width']/2),'hole-offset-y':('ΔY ',t['height']/2)}
    for dim in d['dimensions']:
        row=one([x for x in texts if x.attrib.get('fill')=='#124' and abs(float(x.attrib['x'])-dim['label'][0])<1e-9 and abs(float(x.attrib['y'])-dim['label'][1])<1e-9],'dimension text at actual authored label');prefix,value=expected[dim['dimensionId']];require(row.text==prefix+f'{value:.3f} mm','component/distance/diameter label semantics')
    # Dimension anchor/witness lines are presentation annotations, not the HLR
    # geometry. Validate their labels above and keep them out of view bounds.
    geometry=[x for x in root.findall('.//s:path',NS) if x.attrib.get('stroke') not in ('#789','#246')];require(geometry,'actual projected paths');windows={'top':(110,100,t['width'],t['height']),'front':(110,190,t['width'],t['depth']),'right':(310,190,t['height'],t['depth'])};groups={name:[] for name in windows};top_bores=set()
    for element in root.iter():require('transform' not in element.attrib,'explicit baked paper coordinates; no unreviewed extra transforms')
    for element in geometry:
        text=element.attrib['d'];number=r'[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?';require(re.fullmatch('[ML ,]+',re.sub(number,'',text)) is not None,'only actual M/L polyline presentation');values=[float(x) for x in re.findall(number,text)];require(len(values)>=4 and len(values)%2==0,'path point pairs');points=list(zip(values[::2],values[1::2]));matches=[name for name,(x,y,w,h) in windows.items() if all(x-1e-6<=a<=x+w+1e-6 and y-h-1e-6<=b<=y+1e-6 for a,b in points)];name=one(matches,'source-derived view placement');groups[name].append(points)
        if name=='top':
            x,y,w,h=windows[name];local=[(a-x,y-b) for a,b in points];outer=any(all(abs(p[axis]-value)<=1e-6 for p in local) for axis,value in [(0,0),(0,w),(1,0),(1,h)])
            if not outer:
                found=[i for i,(cx,cy,r) in enumerate(t['bores']) if all(abs(math.hypot(a-cx,b-cy)-r)<=1e-6 for a,b in local)];top_bores.add(one(found,'actual projected circular bore'))
    require(top_bores==set(range(5)),'all five top-view circles')
    for name,paths in groups.items():
        require(paths,'all three actual views');points=[p for item in paths for p in item];x,y,w,h=windows[name];vector([min(p[0] for p in points),min(p[1] for p in points),max(p[0] for p in points),max(p[1] for p in points)],[x,y-h,x+w,y])
    return {'metadata':meta,'referenceDimensions':{name:value for name,(prefix,value) in expected.items()},'paperViewBounds':windows,'topBores':len(top_bores),'projectionRole':'derived sampled presentation; not an authoritative dimension witness'}

def main():
    parser=argparse.ArgumentParser();parser.add_argument('evidence',type=Path);parser.add_argument('--desktop-source',required=True,type=Path);args=parser.parse_args();folder=args.evidence.resolve();r=json.loads((folder/'receipt.json').read_text())
    require(r['status']=='PASS' and r['ownedContextClosed'] and r['sharedBrowserDisconnectedOnly'],'completed actual workflow and owned cleanup');require(r['syntheticGeometry'] is False and r['sourceSeeds'] is False and r['filesystemRace'] is False,'genuine ordinary workflow scope');require(r['sourcePins']==r['sourcePinsAfter'],'frozen inputs unchanged')
    module=args.desktop_source/'test/agent-cad-corpus/manufacturing-shared/oracle/mesh.py';pin=one([v for k,v in r['sourcePins'].items() if unquote(urlparse(k).path).endswith('/test/agent-cad-corpus/manufacturing-shared/oracle/mesh.py')],'independent mesh source pin');require(sha(module.read_bytes())==pin,'actual independent mesh source');spec=importlib.util.spec_from_file_location('independent_mesh',module);mesh=importlib.util.module_from_spec(spec);spec.loader.exec_module(mesh)
    native={};native_files={};binding=r['binding'];definition=r['definition']
    require(len(r['nativeSaves'])==3 and len(r['artifacts'])==12,'three saves and twelve complete artifacts')
    for row in r['nativeSaves']:
        require(row['label'] in ('initial-source','edited-source','reedited-source'),'known native phase');width={'initial-source':100,'edited-source':120,'reedited-source':130}[row['label']];raw=(folder/row['savedFile']).read_bytes();require(sha(raw)==row['sha256'] and len(raw)==row['bytes'],'actual synchronized native bytes');native[row['label']]=derive(json.loads(raw),binding,width,r['engineRevision'],definition);native_files[row['label']]={'sha256':sha(raw),'bytes':len(raw)}
    pinrows=[row for row in r['rows'] if row['label']=='Exact frozen composed runtime'];require(len(pinrows)==3,'initial plus two reopened runtime bindings')
    for row in pinrows:require({x['name']:x['sha256'] for x in row['assets']}==r['pins']['files'] and row['outer']['sha256']==r['pins']['outer']['sha256'],'actual all-file runtime hashes')
    export_rows={row['label'].split(': ',1)[1]:row for row in r['rows'] if row['label'].startswith('Real typed artifact files: ')};require(set(export_rows)==set(WIDTHS),'all actual complete export checkpoints')
    for phase,row in export_rows.items():
        body=one(row['before']['capture']['solids']['bodies'],'actual selected final output');require(body['id']==binding['corners']['outputId'] and body['featureId']==binding['corners']['featureId'],'real output identity');selection=body['selections'];require(selection['status']=='available','real public selection availability');plan=selection['plan'];require(plan['version']==2 and plan['featureId']==body['featureId'],'actual common selection producer')
        require(any(c['kind']=='sketch-profile' and c['featureId']==binding['profile']['featureId'] and c['regionId']==binding['regionId'] for c in plan['sourceContexts']),'actual inherited source context')
        depth=one([d for d in definition['dimensions'] if d['kind']=='plane-distance'],'native cap distance')
        for name,role in [('first','first-cap'),('second','last-cap')]:
            ref=depth[name];face=one([f for f in plan['faces'] if f['id']==ref['selectionId']],'actual exposed opaque face selector');require(face['role']==role and face['geometry']==ref['geometry']=='plane' and face['originFeatureId']==ref['originFeatureId']==binding['profile']['featureId'],'real retained cap role and origin, no ordinal/ID parsing')
    seen=set();exports=[]
    for row in r['artifacts']:
        phase,format=row['phase'],row['format'];require(phase in WIDTHS and format in ('step','3mf','svg') and (phase,format) not in seen,'one artifact per phase/format');seen.add((phase,format));raw=(folder/row['savedFile']).read_bytes();require(sha(raw)==row['sha256'] and len(raw)==row['bytes'],'actual exported bytes');commit=row['result'];require(commit['committed'] is True and commit['persistence']=='browser' and commit['serverStatus']=='not-verified' and commit['dirty'] is False,'truthful file commit and synchronization distinction');d=native[NATIVE[phase]]
        value=inspect_step(raw,d['truth']) if format=='step' else check3mf(raw,d,mesh.inspect) if format=='3mf' else check_svg(raw,d,commit,export_rows[phase]['before']['drawing']);exports.append({'phase':phase,'format':format,'sha256':sha(raw),'bytes':len(raw),'checked':value})
    require(seen=={(phase,format) for phase in WIDTHS for format in ('step','3mf','svg')},'all complete export sets')
    for row in r['rows']:
        if row['label'].startswith('Real typed artifact files:'):require(row['before']==row['after'],'exact read-only accepted state/token/resource preservation')
        if row['label'].endswith(' raw') and 'result' in row and 'classes' in row:
            s=row['before'];source=json.loads(s['capture']['native']['source']);coordinates=[o['data'][k]['x'] for o in source['objects'] for k in ('a','b')];width=max(coordinates)-min(coordinates);t=truth(width);body=one(s['capture']['solids']['bodies'],'native measured part');near(body['metrics']['nativeVolume'],t['volume']);require(row['after']==s,'native query preserves actual state');require([x['classification'] for x in row['result']['points']]==['outside','outside','outside','inside','outside'],'independent formula-derived native material/void classes')
    materials=[d['metadata'] for d in native.values()];require(len({m['revision'] for m in materials})==3,'real material revision review per geometry phase');base=json.loads(json.dumps(materials[0]));base.pop('revision');
    for m in materials[1:]:other=json.loads(json.dumps(m));other.pop('revision');require(other==base,'material identities preserved across real review')
    print(json.dumps({'status':'PASS','scope':'Independent complete actual typed artifact/source checks; analytic STEP subset, core3MF closed mesh and derived SVG, not general CAD interchange or physical printing','nativeFiles':native_files,'exports':exports},indent=2))

if __name__=='__main__':main()
