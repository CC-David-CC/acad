#!/usr/bin/env python3
"""Independent ZIP/XML/mesh oracle for the two explicitly scoped test exports."""
from collections import Counter
from math import isclose
from pathlib import Path
from xml.etree import ElementTree as ET
from zipfile import ZipFile
import sys

NS={'c':'http://schemas.microsoft.com/3dmanufacturing/core/2015/02'}
def check(path,width,ui=False):
 with ZipFile(path) as archive:
  assert archive.testzip() is None
  assert {'[Content_Types].xml','_rels/.rels','3D/3dmodel.model'} <= set(archive.namelist())
  root=ET.fromstring(archive.read('3D/3dmodel.model'))
 assert root.get('unit')=='millimeter'
 materials=root.findall('./c:resources/c:basematerials/c:base',NS)
 assert [(m.get('name'),m.get('displaycolor')) for m in materials]==([('PLA','#D24B4B'),('PETG','#4B78D2')] if ui else [('PLA','#FF0000'),('PETG','#0000FF')])
 objects={o.get('id'):o for o in root.findall('./c:resources/c:object',NS)}
 meshes=[o for o in objects.values() if o.find('c:mesh',NS) is not None]
 assert len(meshes)==2 and [m.get('pindex') for m in meshes]==['0','1']
 expected=[([0,0,0],[width,70,30],width*70*30-(width-4)*66*28),([0,0,27],[width,70,32],width*70*2+(width-4.6)*65.4*3)]
 for obj,(lo,hi,volume) in zip(meshes,expected):
  verts=[tuple(float(v.get(k)) for k in ('x','y','z')) for v in obj.findall('./c:mesh/c:vertices/c:vertex',NS)]
  tris=[tuple(int(t.get(k)) for k in ('v1','v2','v3')) for t in obj.findall('./c:mesh/c:triangles/c:triangle',NS)]
  assert len(tris)==28 and len(verts)==16
  assert all(isclose(min(v[i] for v in verts),lo[i],abs_tol=1e-7) and isclose(max(v[i] for v in verts),hi[i],abs_tol=1e-7) for i in range(3))
  edges=Counter(); signed=0
  for a,b,c in tris:
   assert len({a,b,c})==3 and all(0<=i<len(verts) for i in (a,b,c))
   for u,v in ((a,b),(b,c),(c,a)):edges[tuple(sorted((u,v)))]+=1
   x,y,z=verts[a],verts[b],verts[c]
   signed+=(x[0]*(y[1]*z[2]-y[2]*z[1])+x[1]*(y[2]*z[0]-y[0]*z[2])+x[2]*(y[0]*z[1]-y[1]*z[0]))/6
  assert all(n==2 for n in edges.values()) and isclose(signed,volume,rel_tol=1e-9,abs_tol=1e-6),(signed,volume)
 items=root.findall('./c:build/c:item',NS);assert len(items)==2 and len({i.get('objectid') for i in items})==2
 identity=(1,0,0,0,1,0,0,0,1,0,0,0)
 def unplaced(element):
  value=element.get('transform')
  if value is not None:
   actual=tuple(map(float,value.split()))
   assert len(actual)==12 and all(isclose(a,b,rel_tol=0,abs_tol=1e-12) for a,b in zip(actual,identity)),actual
 referenced=[]
 for item in items:
  unplaced(item)
  object_id=item.get('objectid');seen=set()
  while True:
   assert object_id not in seen and len(seen)<16
   seen.add(object_id);node=objects[object_id]
   children=node.findall('./c:components/c:component',NS)
   if node.find('c:mesh',NS) is not None:
    assert not children;referenced.append(object_id);break
   assert len(children)==1
   unplaced(children[0]);object_id=children[0].get('objectid')
 assert len(set(referenced))==2 and set(referenced)=={m.get('id') for m in meshes}
 print(f'PASS {path}: 2 build objects, 2 materials, 56 triangles, bounded closed meshes and volumes')
if __name__=='__main__':
 if len(sys.argv) not in (3,4) or (len(sys.argv)==4 and sys.argv[3]!='--ui'):raise SystemExit('usage: check-3mf.py INITIAL EDITED [--ui]')
 ui=len(sys.argv)==4
 check(Path(sys.argv[1]),100,ui);check(Path(sys.argv[2]),120,ui)
