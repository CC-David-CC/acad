#!/usr/bin/env python3
"""Independent actual-buffer mathematical oracle; not a production geometry model."""
import json,math,struct,sys
from pathlib import Path
from collections import defaultdict,Counter

def decode(file):
 b=Path(file).read_bytes();magic,n,t,p,q,a,z=struct.unpack_from('<8s6I',b);assert magic==b'CMESH001' and a==z==0 and 0<n<=150000 and 0<t<=100000;assert p==32 and q==32+24*n and len(b)==q+12*t<=8388608
 positions=list(struct.iter_unpack('<3d',b[p:q]));triangles=list(struct.iter_unpack('<3I',b[q:]));assert all(all(math.isfinite(v) for v in point) for point in positions);return positions,triangles
sub=lambda a,b:tuple(x-y for x,y in zip(a,b))
dot=lambda a,b:sum(x*y for x,y in zip(a,b))
cross=lambda a,b:(a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0])
def check_topology(p,triangles):
 edges=defaultdict(list);unique=set();links=defaultdict(list)
 for i,t in enumerate(triangles):
  assert len(set(t))==3 and all(0<=v<len(p) for v in t);key=tuple(sorted(t));assert key not in unique;unique.add(key);area=cross(sub(p[t[1]],p[t[0]]),sub(p[t[2]],p[t[0]]));assert dot(area,area)>0
  for j in range(3):
   a,b=t[j],t[(j+1)%3];edges[tuple(sorted((a,b)))].append((a,b,i));links[a].append((b,t[(j+2)%3]))
 assert len(links)==len(p)
 for uses in edges.values():assert len(uses)==2 and uses[0][:2]==uses[1][:2][::-1]
 for pairs in links.values():
  graph=defaultdict(list)
  for a,b in pairs:graph[a].append(b);graph[b].append(a)
  assert all(len(v)==2 for v in graph.values());todo=[next(iter(graph))];seen=set()
  while todo:
   a=todo.pop()
   if a not in seen:seen.add(a);todo.extend(graph[a])
  assert len(seen)==len(graph)
 return len(p)-len(edges)+len(triangles)
def volume(p,triangles):
 origin=p[0];return math.fsum(dot(sub(p[a],origin),cross(sub(p[b],origin),sub(p[c],origin)))/6 for a,b,c in triangles)
def winding(p,triangles,point):
 values=[]
 for t in triangles:
  a,b,c=[sub(p[i],point) for i in t];la,lb,lc=[math.sqrt(dot(v,v)) for v in (a,b,c)];values.append(2*math.atan2(dot(a,cross(b,c)),la*lb*lc+dot(a,b)*lc+dot(b,c)*la+dot(c,a)*lb))
 return math.fsum(values)/(4*math.pi)
def check(file,kind):
 p,tri=decode(file);euler=check_topology(p,tri);actual=volume(p,tri);assert actual>0;lo=[min(v[i] for v in p) for i in range(3)];hi=[max(v[i] for v in p) for i in range(3)];row={'kind':kind,'vertices':len(p),'triangles':len(tri),'euler':euler,'meshVolumeMM3':actual,'meshBounds':{'min':lo,'max':hi}}
 if kind=='box':
  source=6000.;assert euler==2;assert all(abs(lo[i])<=1e-9 and abs(hi[i]-[10,20,30][i])<=1e-9 for i in range(3));assert abs(actual-source)<=1e-7;probes=[([5,10,15],1),([12,5,5],0)];bound=1e-7
 else:
  radii=[5] if kind=='cylinder' else [5,2];assert euler==(2 if kind=='cylinder' else 0);h=12;source=math.pi*(25-(4 if kind=='annulus' else 0))*h;assert abs(lo[2])<=1e-9 and abs(hi[2]-h)<=1e-9;assert all(abs(lo[i]+5)<=.01+1e-10 and abs(hi[i]-5)<=.01+1e-10 for i in (0,1));rings={r:set() for r in radii}
  for t in tri:
   points=[p[i] for i in t];cap=any(all(abs(v[2]-z)<=1e-9 for v in points) for z in (0,h))
   for index,v in zip(t,points):
    rr=math.hypot(v[0],v[1]);assert rr<=5+1e-9 and rr>=(2-1e-9 if kind=='annulus' else 0);assert -1e-9<=v[2]<=h+1e-9
   if not cap:
    matches=[r for r in radii if all(abs(math.hypot(v[0],v[1])-r)<=1e-9 for v in points)];assert len(matches)==1
    for index,v in zip(t,points):
     if abs(v[2])<=1e-9:rings[matches[0]].add(index)
  losses=[];samples=[]
  for r,indices in rings.items():
   angles=sorted(math.atan2(p[i][1],p[i][0])%(2*math.pi) for i in indices);assert len(angles)>=3;deltas=[(angles[(i+1)%len(angles)]-a)%(2*math.pi) for i,a in enumerate(angles)];assert all(0<d<=.1+1e-10 for d in deltas);sag=max(r*(1-math.cos(d/2)) for d in deltas);assert sag<=.01+1e-10;loss=math.fsum(r*r*(d-math.sin(d))/2 for d in deltas);losses.append(loss);samples.append({'radius':r,'samples':len(angles),'maxAngularStep':max(deltas),'maxSagMm':sag,'circleAreaLossMM2':loss})
  polygon=source-h*losses[0]+(h*losses[1] if len(losses)>1 else 0);assert abs(actual-polygon)<=1e-6;bound=h*.01*2*math.pi*sum(radii)+1e-6;assert abs(actual-source)<=bound;row.update(boundarySampling=samples,polyhedralFormulaVolumeMM3=polygon,formulaArithmeticResidualMM3=abs(actual-polygon));probes=[([0,0,6],1),([6,0,6],0)] if kind=='cylinder' else [([0,0,6],0),([3.5,0,6],1),([6,0,6],0)]
 row.update(sourceVolumeMM3=source,sourceApproximationResidualMM3=abs(actual-source),sourceApproximationBoundMM3=bound,pointChecks=[])
 for point,expected in probes:
  observed=winding(p,tri,point);assert abs(observed-expected)<=1e-8;row['pointChecks'].append({'point':point,'expectedMaterial':bool(expected),'actualMeshWinding':observed})
 return row
if __name__=='__main__':
 directory=Path(sys.argv[1]);rows=[check(directory/(name+'.mesh'),name) for name in ['box','cylinder','annulus']];print(json.dumps({'status':'PASS','scope':'Independent actual native binary mesh topology/source-analytic approximation/points; not shared manufacturing or 3MF','rows':rows},indent=2))
