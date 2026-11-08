#!/usr/bin/env python3
"""Independent saved-intent/ZIP/XML/manifold/analytic fixture oracle, no CAD imports."""
from pathlib import Path
from collections import defaultdict
from xml.etree import ElementTree as E
import sys,json,math,zipfile,io,hashlib
NS={'m':'http://schemas.microsoft.com/3dmanufacturing/core/2015/02'}
sha=lambda b:hashlib.sha256(b).hexdigest()
sub=lambda a,b:tuple(x-y for x,y in zip(a,b))
dot=lambda a,b:sum(x*y for x,y in zip(a,b))
cross=lambda a,b:(a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0])
def winding(v,t,p):
 terms=[]
 for q in t:
  a,b,c=[sub(v[i],p)for i in q];la,lb,lc=[math.sqrt(dot(s,s))for s in [a,b,c]]
  terms.append(2*math.atan2(dot(a,cross(b,c)),la*lb*lc+dot(a,b)*lc+dot(b,c)*la+dot(c,a)*lb))
 return math.fsum(terms)/(4*math.pi)
def native_truth(native,binding,build):
 assert native['format']=='codi-jsketcher-project'and native['version']==2 and native['unit']=='millimeter'
 hist=native['project']['model']['history'];assert [x['type']for x in hist]==['PLANE','WORKER_SELECTED_PROFILE_EXTRUDE_V2','WORKER_THROUGH_HOLES_V1','WORKER_THROUGH_HOLES_V1','WORKER_SOLID_EDGE_TREATMENT_V1','WORKER_LINEAR_HOLE_PATTERN_V1']
 plane,p,c,f,t,n=[x['params']for x in hist];assert plane['orientation']=='XY'and plane['depth']==0 and plane['datum']is None
 for row in [p,c,f,t,n]:assert row['engine']=='occ'and row['unit']=='millimeter'and row['engineRevision']==build
 assert p['featureId']==binding['profile']['featureId']and p['faceId']==binding['faceId']and p['regionId']==binding['regionId']and p['bodyPolicy']=='separate'
 assert c['featureId']==binding['center']['featureId']and c['kind']=='centered-through'and c['target']==binding['profile']['outputId']and f['target']==binding['center']['outputId']and f['kind']=='four-corner-through'
 for h in [c,f]:assert h['sourceFeatureId']==p['featureId']and h['sourceFaceId']==p['faceId']and h['sourceRegionId']==p['regionId']
 assert t['featureId']==binding['fillet']['featureId']and t['kind']=='fillet'and t['edgeIds']==binding['edgeIds']and len(set(t['edgeIds']))==4 and t['target']==binding['corners']['outputId']
 assert n['featureId']==binding['pattern']['featureId']and n['target']==binding['fillet']['outputId']and n['seedFeatureId']==c['featureId']and n['axis']=='source-local-x-positive'
 sketches=native['project']['sketches'];assert len(sketches)==1 and sketches[0]['id']==p['faceId'];s=sketches[0]['data'];assert s['version']==3 and len(s['objects'])==4 and len(s['stages'])==1 and len(s['stages'][0]['constraints'])==11
 assert sorted(o['id']for o in s['objects'])==sorted(binding['curveIds']);coords=[(o['data'][key]['x'],o['data'][key]['y'])for o in s['objects']for key in ['a','b']];w=max(x for x,y in coords);h=max(y for x,y in coords);assert min(x for x,y in coords)==min(y for x,y in coords)==0
 assert all(o['type']=='Segment'and o['role']is None and o['stage']==0 for o in s['objects']);assert set(coords)=={(0,0),(w,0),(w,h),(0,h)}and all(coords.count(q)==2 for q in set(coords))
 d=p['depth'];r=t['size'];bores=[(w/2+i*n['spacing'],h/2,c['diameter']/2)for i in range(n['count'])]+[(x,y,f['diameter']/2)for x,y in [(f['offsetX'],f['offsetY']),(w-f['offsetX'],f['offsetY']),(w-f['offsetX'],h-f['offsetY']),(f['offsetX'],h-f['offsetY'])]]
 volume=(w*h-math.pi*sum(rad*rad for x,y,rad in bores)-4*r*r*(1-math.pi/4))*d
 probes=[]
 for x,y,rad in bores:probes.extend([([x,y,d/2],0),([x+rad+.25,y,d/2],1)])
 for x,y in [(.5,.5),(w-.5,.5),(w-.5,h-.5),(.5,h-.5)]:probes.append(([x,y,d/2],0))
 for x,y in [(r,r),(w-r,r),(w-r,h-r),(r,h-r)]:probes.append(([x,y,d/2],1))
 return {'width':w,'height':h,'depth':d,'radius':r,'bores':bores,'count':len(bores),'volume':volume,'probes':probes,'metadata':native['manufacturing']}
def identity(node):
 if 'transform'in node.attrib:assert [float(x)for x in node.attrib['transform'].split()]==[1,0,0,0,1,0,0,0,1,0,0,0]
def artifact(raw,truth,binding,build):
 with zipfile.ZipFile(io.BytesIO(raw))as z:
  assert len(z.namelist())==len(set(z.namelist()))==5 and z.testzip()is None and sum(i.file_size for i in z.infolist())<=64*1024*1024
  assert set(z.namelist())=={'[Content_Types].xml','_rels/','_rels/.rels','3D/','3D/3dmodel.model'}
  root=E.fromstring(z.read('3D/3dmodel.model'));assert root.attrib['unit']=='millimeter';md={n.attrib['name']:n.text for n in root.findall('m:metadata',NS)};assert md['codi:SourceRevision']==truth['metadata']['revision'][7:];provenance=json.loads(md['codi:ManufacturingBindings']);assert provenance['revision']==md['codi:SourceRevision']and provenance['version']==1 and len(provenance['parts'])==len(provenance['materialPairs'])==1
  part=provenance['parts'][0];assert part['id']=='original-plate'and part['name']=='Original parametric plate'and len(part['regions'])==1;region=part['regions'][0];assert region['id']=='main'and region['bodyId']==binding['pattern']['outputId']and region['featureId']==binding['pattern']['featureId']and region['engineRevision']==build and region['materialId']=='pla'and region['appearanceId']=='blue'
  resources=root.find('m:resources',NS);objects={int(o.attrib['id']):o for o in resources.findall('m:object',NS)};assert len(objects)==3 and len(resources)==4;pair=provenance['materialPairs'][0];mats=resources.findall('m:basematerials',NS);assert len(mats)==1 and int(mats[0].attrib['id'])==pair['resourceId']==region['materialResourceId']and len(mats[0])==1 and mats[0][0].attrib=={'name':'PLA','displaycolor':'#3366FF'}
  items=root.find('m:build',NS);assert len(items)==1 and int(items[0].attrib['objectid'])==part['buildResourceId'];identity(items[0]);group=objects[part['buildResourceId']];refs=group.find('m:components',NS);assert len(refs)==1 and int(refs[0].attrib['objectid'])==region['componentResourceId'];identity(refs[0]);component=objects[region['componentResourceId']];refs=component.find('m:components',NS);assert len(refs)==1 and int(refs[0].attrib['objectid'])==region['meshResourceId'];identity(refs[0]);obj=objects[region['meshResourceId']];assert int(obj.attrib['pid'])==pair['resourceId']and int(obj.attrib['pindex'])==0
  mesh=obj.find('m:mesh',NS);v=[tuple(float(x.attrib[k])for k in ['x','y','z'])for x in mesh.find('m:vertices',NS)];t=[tuple(int(x.attrib[k])for k in ['v1','v2','v3'])for x in mesh.find('m:triangles',NS)]
 assert 4<=len(v)<=150000 and 4<=len(t)<=100000 and all(all(math.isfinite(x)for x in p)for p in v)
 edges=defaultdict(list);links=defaultdict(list);adj=[set()for _ in t];seen=set()
 for i,q in enumerate(t):
  assert len(set(q))==3 and all(0<=n<len(v)for n in q);key=tuple(sorted(q));assert key not in seen;seen.add(key);assert any(cross(sub(v[q[1]],v[q[0]]),sub(v[q[2]],v[q[0]])))
  for j in range(3):
   x,y=q[j],q[(j+1)%3];edges[tuple(sorted((x,y)))].append((x,y,i));links[x].append((y,q[(j+2)%3]))
 assert len(links)==len(v)
 for uses in edges.values():assert len(uses)==2 and uses[0][:2]==uses[1][:2][::-1];i,j=uses[0][2],uses[1][2];adj[i].add(j);adj[j].add(i)
 for rows in links.values():
  graph=defaultdict(list)
  for x,y in rows:graph[x].append(y);graph[y].append(x)
  assert all(len(x)==2 for x in graph.values());todo=[next(iter(graph))];visited=set()
  while todo:
   x=todo.pop()
   if x not in visited:visited.add(x);todo.extend(graph[x])
  assert len(visited)==len(graph)
 todo=[0];visited=set()
 while todo:
  x=todo.pop()
  if x not in visited:visited.add(x);todo.extend(adj[x])
 assert len(visited)==len(t)and len(v)-len(edges)+len(t)==2-2*truth['count']
 w,h,d,r=[truth[k]for k in ['width','height','depth','radius']];lo=[min(p[i]for p in v)for i in range(3)];hi=[max(p[i]for p in v)for i in range(3)];assert all(abs(lo[i])<=1e-6 and abs(hi[i]-[w,h,d][i])<=1e-6 for i in range(3))
 # Every actual mesh vertex lies on the expected extruded analytic boundary.
 for x,y,z in v:
  inside=True;outer=min(abs(x),abs(x-w),abs(y),abs(y-h))<=1e-6
  for cx,cy,active in [(r,r,x<r and y<r),(w-r,r,x>w-r and y<r),(w-r,h-r,x>w-r and y>h-r),(r,h-r,x<r and y>h-r)]:
   if active:
    distance=math.hypot(x-cx,y-cy);inside=distance<=r+1e-6;outer=abs(distance-r)<=1e-6
  assert inside and all(math.hypot(x-cx,y-cy)>=rad-1e-6 for cx,cy,rad in truth['bores'])
  holes=any(abs(math.hypot(x-cx,y-cy)-rad)<=1e-6 for cx,cy,rad in truth['bores'])
  assert abs(z)<=1e-6 or abs(z-d)<=1e-6 or outer or holes
 origin=v[0];vol=math.fsum(dot(sub(v[x],origin),cross(sub(v[y],origin),sub(v[z],origin)))/6 for x,y,z in t);perimeter=2*(w+h-4*r)+2*math.pi*r+2*math.pi*sum(rad for x,y,rad in truth['bores']);allowance=(perimeter*.01+math.pi*(truth['count']+1)*.01**2)*d
 assert abs(vol-truth['volume'])<=allowance,(vol,truth['volume'],allowance)
 checks=[]
 for p,inside in truth['probes']:
  q=winding(v,t,p);assert abs(q-inside)<=1e-6,(p,inside,q);checks.append({'point':p,'expectedWinding':inside,'winding':q})
 triangles=[]
 for q in t:
  p=tuple(v[i]for i in q);triangles.append(min(p,p[1:]+p[:1],p[2:]+p[:2]))
 return {'meshVolume':vol,'analyticVolume':truth['volume'],'fixtureVolumeAllowanceMm3':allowance,'allowanceFormula':'(analytic perimeter*0.01 + pi*(holes+1)*0.01^2)*depth; bounded fixture acceptance, not a universal ideal-geometry certificate','vertices':len(v),'triangles':len(t),'euler':len(v)-len(edges)+len(t),'bounds':{'min':lo,'max':hi},'materialProbes':checks,'canonicalTrianglesSha256':sha(json.dumps(sorted(triangles),separators=(',',':')).encode()),'provenance':provenance}
def main(folder):
 r=json.loads((folder/'receipt.json').read_text());assert r['status']=='PASS'and r['sourcePins']==r['sourcePinsAfter']and r['ownedContextClosed']and r['sharedBrowserDisconnectedOnly']and not r['syntheticGeometry']and not r['sourceSeeds'];b=r['binding'];build=r['build'];truths={}
 for row in r['saved']:
  raw=(folder/row['savedFile']).read_bytes();assert len(raw)==row['bytes']and sha(raw)==row['sha256']
  if row['label']!='edited-source':truths[row['label']]=native_truth(json.loads(raw),b,build)
 truth=truths['final-source'];assert truth['width']==150 and truth['height']==30 and truth['depth']==25 and truth['count']==7
 exports=[]
 for row in r['exports']:
  if row['kind']!='3mf':continue
  raw=(folder/row['savedFile']).read_bytes();assert sha(raw)==row['sha256']and len(raw)==row['bytes'];value=artifact(raw,truth,b,build);exports.append({'file':row['savedFile'],'sha256':row['sha256'],**value})
 assert len(exports)==2 and exports[0]['canonicalTrianglesSha256']==exports[1]['canonicalTrianglesSha256'];print(json.dumps({'status':'PASS','scope':'Independent complete saved-intent/3MF ZIP/XML/one-part material binding/closed genus7 mesh/analytic fixture and voids; no new Native execution or external STEP reader','exports':exports},indent=2))
if __name__=='__main__':main(Path(sys.argv[1]).resolve())
