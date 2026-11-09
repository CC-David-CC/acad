"""Independent finite triangle/patch audit for this actual blind-plate workflow.
No production geometry imports. Mesh deflection is .01mm, not BRep/source truth.
"""
import math
from collections import Counter,defaultdict

def require(value,message):
 if not value:raise ValueError(message)
def inspect_finite_blind_mesh(vertices,triangles,e):
 inc=1e-6;delta=.01;r=e['diameter']/2;t=e['thickness'];floor=t-e['depth']
 require(0<delta<r and 0<floor<t,'finite ordinary mesh oracle domain')
 def sub(a,b):return tuple(x-y for x,y in zip(a,b))
 def cross(a,b):return(a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0])
 def segment_distance(a,b):
  ax,ay=a[0]-50,a[1]-25;dx,dy=b[0]-a[0],b[1]-a[1];q=dx*dx+dy*dy
  u=max(0,min(1,-(ax*dx+ay*dy)/q)) if q else 0
  return math.hypot(ax+u*dx,ay+u*dy)
 def radial_min(ps):
  # Closest XY point is the center itself or an actual edge point.
  signs=[]
  for a,b in zip(ps,ps[1:]+ps[:1]):signs.append((b[0]-a[0])*(25-a[1])-(b[1]-a[1])*(50-a[0]))
  area=(ps[1][0]-ps[0][0])*(ps[2][1]-ps[0][1])-(ps[1][1]-ps[0][1])*(ps[2][0]-ps[0][0])
  if area and (all(x>=0 for x in signs) or all(x<=0 for x in signs)):return 0
  return min(segment_distance(a,b) for a,b in zip(ps,ps[1:]+ps[:1]))
 labels=[];areas=defaultdict(list);edges=defaultdict(list);incident=defaultdict(set)
 patch_names={'x-min','x-max','y-min','y-max','bottom','top','floor','wall'}
 for i,tri in enumerate(triangles):
  ps=[vertices[j] for j in tri];n=cross(sub(ps[1],ps[0]),sub(ps[2],ps[0]));area=math.hypot(*n)/2
  require(math.isfinite(area) and area>0,'nondegenerate finite actual triangle')
  rho=[math.hypot(p[0]-50,p[1]-25) for p in ps];patch=None
  for axis,value,label,sign in [(0,0,'x-min',-1),(0,100,'x-max',1),(1,0,'y-min',-1),(1,50,'y-max',1),(2,0,'bottom',-1)]:
   if all(abs(p[axis]-value)<=inc for p in ps):require(n[axis]*sign>0,'actual outward outer patch winding');patch=label;break
  if patch is None and all(abs(p[2]-t)<=inc for p in ps):
   require(n[2]>0 and radial_min(ps)>=r-delta,'finite top triangles preserve the actual circular opening');patch='top'
  if patch is None and all(abs(p[2]-floor)<=inc for p in ps):
   require(n[2]>0 and max(rho)<=r+delta,'finite floor triangles remain inside the circular disk');patch='floor'
  if patch is None:
   require(all(floor-inc<=p[2]<=t+inc for p in ps) and max(rho)<=r+delta and radial_min(ps)>=r-delta,'entire actual wall triangle stays in finite cylindrical annular error band')
   center=[math.fsum(p[k] for p in ps)/3 for k in range(3)];require(n[0]*(center[0]-50)+n[1]*(center[1]-25)<0,'actual inward cylindrical wall winding');patch='wall'
  labels.append(patch);areas[patch].append(area)
  for j in range(3):
   a,b=tri[j],tri[(j+1)%3];edges[tuple(sorted((a,b)))].append((i,a,b));incident[a].add(i)
 require(set(labels)==patch_names,'every actual finite surface patch exists');require(set(incident)==set(range(len(vertices))),'all actual vertices belong to the shell')
 adjacency=[set() for _ in triangles]
 for key,uses in edges.items():
  require(len(uses)==2 and uses[0][1:]==uses[1][1:][::-1],'actual shared oriented mesh edge')
  a,b=uses[0][0],uses[1][0];adjacency[a].add(b);adjacency[b].add(a)
 def connected(ids):
  ids=set(ids);todo=[next(iter(ids))];seen=set()
  while todo:
   i=todo.pop()
   if i in seen:continue
   seen.add(i);todo.extend(j for j in adjacency[i] if j in ids and j not in seen)
  return seen==ids
 require(connected(range(len(triangles))),'one connected actual finite shell')
 for patch in patch_names:require(connected(i for i,p in enumerate(labels) if p==patch),'connected actual '+patch+' patch')
 # Edge manifoldness alone does not rule out a bow-tie vertex.
 for vertex,ids in incident.items():
  graph={i:set() for i in ids}
  for i in ids:
   tri=triangles[i]
   for j in range(3):
    edge=tuple(sorted((tri[j],tri[(j+1)%3])))
    if vertex in edge:graph[i].update(use[0] for use in edges[edge] if use[0]!=i)
  require(all(len(v)==2 for v in graph.values()),'actual vertex-link cycle degree');seen=set();todo=[next(iter(ids))]
  while todo:
   i=todo.pop()
   if i not in seen:seen.add(i);todo.extend(graph[i]-seen)
  require(seen==ids,'one actual vertex-link cycle')
 def rim(other,z):
  rows=[key for key,uses in edges.items() if {labels[u[0]] for u in uses}=={'wall',other}];require(len(rows)>=3,'actual '+other+' circular rim edges');graph=defaultdict(set)
  for a,b in rows:graph[a].add(b);graph[b].add(a)
  require(all(len(v)==2 for v in graph.values()),'unbranched actual '+other+' rim');start=min(graph);cycle=[start];visited={start};previous=None;current=start
  while True:
   choices=graph[current]-({previous} if previous is not None else set());nxt=min(choices)
   if nxt==start:break
   require(nxt not in visited and len(cycle)<len(graph),'simple actual circular rim cycle');cycle.append(nxt);visited.add(nxt);previous,current=current,nxt
  require(len(cycle)==len(graph)==len(rows),'one complete actual circular rim')
  ps=[vertices[v] for v in cycle];angles=[]
  for p,q in zip(ps,ps[1:]+ps[:1]):
   require(abs(p[2]-z)<=inc and abs(math.hypot(p[0]-50,p[1]-25)-r)<=delta,'actual finite circular rim vertex')
   require(segment_distance(p,q)>=r-delta,'whole actual rim chord within circular deflection band')
   a,b=(p[0]-50,p[1]-25),(q[0]-50,q[1]-25);angle=math.atan2(a[0]*b[1]-a[1]*b[0],a[0]*b[0]+a[1]*b[1]);require(0<abs(angle)<math.pi,'ordinary actual directed circular chord');angles.append(angle)
  require(all(a>0 for a in angles) or all(a<0 for a in angles),'consistent angular rim traversal');require(abs(abs(math.fsum(angles))-2*math.pi)<=1e-9,'one full actual circular rim winding')
  area=abs(math.fsum((p[0]-50)*(q[1]-25)-(q[0]-50)*(p[1]-25) for p,q in zip(ps,ps[1:]+ps[:1])))/2
  require(abs(area-math.pi*r*r)<=math.pi*(2*r*delta+delta*delta),'actual circular rim area within declared mesh error');return {'edges':len(rows),'area':area}
 top=rim('top',t);lower=rim('floor',floor);a={k:math.fsum(v) for k,v in areas.items()};area_roundoff=max(1e-6,128*math.ulp(max(5000,max(a.values()))))
 require(abs(a['floor']-lower['area'])<=area_roundoff,'complete actual floor triangulation fills its circular rim')
 require(abs(a['top']+top['area']-5000)<=area_roundoff,'complete actual top triangulation excludes exactly its circular rim')
 for label,expected in [('bottom',5000),('x-min',50*t),('x-max',50*t),('y-min',100*t),('y-max',100*t)]:require(abs(a[label]-expected)<=area_roundoff,'complete actual finite outer patch '+label)
 require(2*math.pi*(r-delta)*e['depth']-area_roundoff<=a['wall']<=2*math.pi*(r+delta)*e['depth']+area_roundoff,'actual finite cylindrical wall area at declared mesh error')
 return {'quality':'independent-finite-triangle-patch-and-circular-rim-audit','deflectionMm':delta,'planeIncidenceMm':inc,'patchTriangles':dict(Counter(labels)),'patchAreas':a,'topRim':top,'floorRim':lower,'connectedShell':True,'vertexLinks':'one-cycle','windingRadiansBudget':1e-9}
