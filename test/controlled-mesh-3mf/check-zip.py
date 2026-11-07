#!/usr/bin/env python3
"""Independent zipfile/XML resource/provenance check and exact geometry preservation."""
import json,zipfile,hashlib,struct,sys,importlib.util
from pathlib import Path
from xml.etree import ElementTree as ET
root=Path(__file__).parent;directory=Path(sys.argv[1]);receipt=json.loads((directory/'receipt.json').read_text());assert receipt['status']=='PASS' and len(receipt['rows'])==16 and receipt['sourcePinsBefore']==receipt['sourcePinsAfter'] and all(w['terminated'] for w in receipt['workers'])
source=root.parent/'owned-manufacturing-mesh-worker/evidence-r3';raw=(source/'receipt.json').read_bytes();assert hashlib.sha256(raw).hexdigest()==receipt['source']['sha256'];native=json.loads(raw);byLabel={r['label']:r for r in native['actual']['meshes']};ns={'m':'http://schemas.microsoft.com/3dmanufacturing/core/2015/02'};out=[]
for row in receipt['rows']:
 b=(directory/row['file']).read_bytes();assert hashlib.sha256(b).hexdigest()==row['sha256'] and len(b)==row['metadata']['byteLength'] and row['inputsConsumed']
 with zipfile.ZipFile(directory/row['file'])as z:
  assert z.testzip()is None and set(z.namelist())=={'[Content_Types].xml','_rels/','_rels/.rels','3D/','3D/3dmodel.model'}
  rel=ET.fromstring(z.read('_rels/.rels'));assert list(rel)[0].attrib['Target']=='/3D/3dmodel.model'
  model=ET.fromstring(z.read('3D/3dmodel.model'));assert model.attrib['unit']=='millimeter'
  metas={m.attrib['name']:m.text for m in model.findall('m:metadata',ns)};assert metas['codi:SourceRevision']==row['metadata']['revision'];p=json.loads(metas['codi:ManufacturingBindings']);assert p['revision']==row['metadata']['revision'] and p['version']==1
  resources=model.find('m:resources',ns);objects={int(o.attrib['id']):o for o in resources.findall('m:object',ns)};base=resources.find('m:basematerials',ns);assert base.attrib['id']=='1' and len(base)==1 and base[0].attrib=={'name':'Authored label & <one>','displaycolor':'#B02030'}
  build=model.find('m:build',ns);assert len(build)==len(row['labels'])==len(p['parts'])
  for i,(part,label)in enumerate(zip(p['parts'],row['labels'])):
   expected=row['metadata']['parts'][i];assert part['id']==expected['id'] and part['name']==expected['name'] and part['buildResourceId']==int(build[i].attrib['objectid']);group=objects[part['buildResourceId']];assert group.attrib['name']==expected['name'];refs=group.find('m:components',ns);assert len(refs)==len(part['regions'])==1
   region=part['regions'][0];assert all(region[k]==v for k,v in expected['regions'][0].items());assert region['materialResourceId']==1 and region['materialIndex']==0
   component=objects[region['componentResourceId']];assert int(refs[0].attrib['objectid'])==region['componentResourceId'];inner=component.find('m:components',ns);assert len(inner)==1 and int(inner[0].attrib['objectid'])==region['meshResourceId'];assert inner[0].attrib['transform']=='1 0 0 0 1 0 0 0 1 0 0 0'
   obj=objects[region['meshResourceId']];assert obj.attrib['name']==region['id'] and obj.attrib['pid']=='1' and obj.attrib['pindex']=='0'
   mesh=obj.find('m:mesh',ns);positions=[tuple(float(v.attrib[k])for k in ['x','y','z'])for v in mesh.find('m:vertices',ns)];triangles=[tuple(int(v.attrib[k])for k in ['v1','v2','v3'])for v in mesh.find('m:triangles',ns)]
   src=byLabel[label];raw=(source/src['sink']['file']).read_bytes();assert hashlib.sha256(raw).hexdigest()==src['sink']['sha256'];_,nv,nt,po,io,_,_=struct.unpack_from('<8s6I',raw);assert positions==list(struct.iter_unpack('<3d',raw[po:io]));assert triangles==list(struct.iter_unpack('<3I',raw[io:]));assert len(positions)==nv and len(triangles)==nt
  assert p['materialPairs']==[{'id':'pair-0','materialId':'mat-a','appearanceId':'app-a','resourceId':1,'index':0}]
 out.append({'file':row['file'],'parts':len(row['labels']),'triangles':sum(byLabel[x]['metadata']['triangleCount']for x in row['labels']),'exactNativeMeshCoordinatesAndIndices':True})
print(json.dumps({'status':'PASS','exports':len(out),'scope':'Independent ZIP/CRC/XML/actual resource+provenance+exact recorded Native geometry preservation. No fresh Native/public app/manufacturing certificate.','rows':out},indent=2))
