#!/usr/bin/env python3
"""Independent V2 ZIP/XML geometry and grouped-interface oracle."""
from collections import Counter
from math import isclose,sqrt
from pathlib import Path
from xml.etree import ElementTree as ET
from zipfile import ZipFile
import sys
N={'c':'http://schemas.microsoft.com/3dmanufacturing/core/2015/02'}
def near(a,b):return isclose(a,b,rel_tol=1e-9,abs_tol=1e-6)
def area(a,b,c):
 u=[b[i]-a[i] for i in range(3)];v=[c[i]-a[i] for i in range(3)]
 return sqrt((u[1]*v[2]-u[2]*v[1])**2+(u[2]*v[0]-u[0]*v[2])**2+(u[0]*v[1]-u[1]*v[0])**2)/2

def check(path,w,label_width):
 with ZipFile(path) as z:
  assert z.testzip() is None and {'[Content_Types].xml','_rels/.rels','3D/3dmodel.model'}<=set(z.namelist())
  root=ET.fromstring(z.read('3D/3dmodel.model'))
 assert root.get('unit')=='millimeter'
 materials=root.findall('./c:resources/c:basematerials/c:base',N)
 assert [(m.get('name'),m.get('displaycolor')) for m in materials]==[('PLA','#FF0000'),('PETG','#0000FF'),('PLA','#FFFFFF')]
 objects={o.get('id'):o for o in root.findall('./c:resources/c:object',N)}
 meshes={o.get('name'):o for o in objects.values() if o.find('c:mesh',N) is not None}
 assert set(meshes)=={'region-BODY','region-LID','region-LABEL'}
 expected={'region-BODY':([0,0,0],[w,70,30],w*70*30-(w-4)*66*28,28,'0'),
  'region-LID':([0,0,27],[w,70,32],w*70*2+(w-4.6)*65.4*3-label_width*20,44,'1'),
  'region-LABEL':([(w-label_width)/2,25,31],[(w+label_width)/2,45,32],label_width*20,12,'2')}
 data={}
 for name,obj in meshes.items():
  lo,hi,volume,count,pindex=expected[name];assert obj.get('pindex')==pindex
  vertices=[tuple(float(v.get(k)) for k in ('x','y','z')) for v in obj.findall('./c:mesh/c:vertices/c:vertex',N)]
  tris=[tuple(int(t.get(k)) for k in ('v1','v2','v3')) for t in obj.findall('./c:mesh/c:triangles/c:triangle',N)]
  assert len(tris)==count and all(near(min(v[i] for v in vertices),lo[i]) and near(max(v[i] for v in vertices),hi[i]) for i in range(3))
  edges=Counter();signed=0
  for a,b,c in tris:
   assert len({a,b,c})==3 and all(0<=i<len(vertices) for i in (a,b,c))
   for x,y in ((a,b),(b,c),(c,a)):edges[tuple(sorted((x,y)))]+=1
   x,y,z=vertices[a],vertices[b],vertices[c];signed+=(x[0]*(y[1]*z[2]-y[2]*z[1])+x[1]*(y[2]*z[0]-y[0]*z[2])+x[2]*(y[0]*z[1]-y[1]*z[0]))/6
  assert all(v==2 for v in edges.values()) and near(signed,volume),(name,signed,volume)
  data[name]=(vertices,tris)
 # Both sides' five rectangular contact faces: analytic plane, bounded extents
 # and total area. This is not physical tolerance testing.
 xl,xh=(w-label_width)/2,(w+label_width)/2
 def interface_area(mesh):
  vertices,tris=mesh;total=0
  for tri in tris:
   points=[vertices[i] for i in tri]
   inside=all(xl-1e-7<=p[0]<=xh+1e-7 and 25-1e-7<=p[1]<=45+1e-7 and 31-1e-7<=p[2]<=32+1e-7 for p in points)
   plane=any(all(near(p[axis],v) for p in points) for axis,v in [(0,xl),(0,xh),(1,25),(1,45),(2,31)])
   if inside and plane:total+=area(*points)
  return total
 assert near(interface_area(data['region-LID']),label_width*20+2*(label_width+20)) and near(interface_area(data['region-LABEL']),label_width*20+2*(label_width+20))
 build=root.findall('./c:build/c:item',N);assert len(build)==2
 def identity(node):
  return node.get('transform') in (None,'1 0 0 0 1 0 0 0 1 0 0 0')
 assert all(identity(item) for item in build)
 byname={objects[item.get('objectid')].get('name'):objects[item.get('objectid')] for item in build}
 assert set(byname)=={'Enclosure body','Enclosure lid'}
 body=byname['Enclosure body'].findall('./c:components/c:component',N);lid=byname['Enclosure lid'].findall('./c:components/c:component',N)
 assert len(body)==1 and len(lid)==2
 def resolve(component):
  assert identity(component)
  wrapper=objects[component.get('objectid')];leaves=wrapper.findall('./c:components/c:component',N);assert len(leaves)==1
  assert leaves[0].get('transform')=='1 0 0 0 1 0 0 0 1 0 0 0'
  return objects[leaves[0].get('objectid')].get('name')
 assert [resolve(c) for c in body]==['region-BODY'] and {resolve(c) for c in lid}=={'region-LID','region-LABEL'}
 print(f'PASS {path}: 2 objects, 3 regions, 84 triangles, expected volume/bounds and the expected paired interface')
if __name__=='__main__':
 if len(sys.argv)!=7:raise SystemExit('usage: check-typed-enclosure-3mf.py FIRST WIDTH LABEL_WIDTH SECOND WIDTH LABEL_WIDTH')
 check(Path(sys.argv[1]),float(sys.argv[2]),float(sys.argv[3]));check(Path(sys.argv[4]),float(sys.argv[5]),float(sys.argv[6]))
