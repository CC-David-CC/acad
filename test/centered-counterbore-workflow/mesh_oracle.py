"""Independent finite triangle/patch audit for this actual stepped-counterbore workflow.
No production geometry imports. Mesh deflection is .01mm, not BRep/source truth.
"""
import math
from collections import Counter,defaultdict

def require(value,message):
 if not value:raise ValueError(message)
def inspect_finite_counterbore_mesh(vertices,triangles,e):
 inc=1e-6;delta=.01;r=e['throughDiameter']/2;R=e['stepDiameter']/2;t=e['thickness'];s=t-e['stepDepth'];W=e['width'];H=e['height'];cx=W/2;cy=H/2
 require(0<delta<r<R and R-r>2*delta and 0<s<t,'finite ordinary stepped mesh oracle domain')
 def sub(a,b):return tuple(x-y for x,y in zip(a,b))
 def cross(a,b):return(a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0])
 def segment_distance(a,b):
  ax,ay=a[0]-cx,a[1]-cy;dx,dy=b[0]-a[0],b[1]-a[1];q=dx*dx+dy*dy
  u=max(0,min(1,-(ax*dx+ay*dy)/q)) if q else 0
  return math.hypot(ax+u*dx,ay+u*dy)
 def radial_min(ps):
  # Closest XY point is the center itself or an actual edge point.
  signs=[]
  for a,b in zip(ps,ps[1:]+ps[:1]):signs.append((b[0]-a[0])*(cy-a[1])-(b[1]-a[1])*(cx-a[0]))
  area=(ps[1][0]-ps[0][0])*(ps[2][1]-ps[0][1])-(ps[1][1]-ps[0][1])*(ps[2][0]-ps[0][0])
  if area and (all(x>=0 for x in signs) or all(x<=0 for x in signs)):return 0
  return min(segment_distance(a,b) for a,b in zip(ps,ps[1:]+ps[:1]))
 labels=[];areas=defaultdict(list);edges=defaultdict(list);incident=defaultdict(set)
 patch_names={'x-min','x-max','y-min','y-max','bottom','top','shoulder','small-wall','large-wall'}
 for i,tri in enumerate(triangles):
  require(len(tri)==3 and len(set(tri))==3 and all(type(j) is int and 0<=j<len(vertices) for j in tri),'actual triangle membership')
  ps=[vertices[j] for j in tri];n=cross(sub(ps[1],ps[0]),sub(ps[2],ps[0]));area=math.hypot(*n)/2;require(math.isfinite(area) and area>0,'nondegenerate finite triangle')
  require(all(all(math.isfinite(v) for v in p) and -inc<=p[0]<=W+inc and -inc<=p[1]<=H+inc and -inc<=p[2]<=t+inc for p in ps),'finite source-bounded triangle')
  rho=[math.hypot(p[0]-cx,p[1]-cy) for p in ps];patch=None
  for axis,value,label,sign in [(0,0,'x-min',-1),(0,W,'x-max',1),(1,0,'y-min',-1),(1,H,'y-max',1)]:
   if all(abs(p[axis]-value)<=inc for p in ps):require(n[axis]*sign>0,'outward original side winding');patch=label;break
  if patch is None and all(abs(p[2])<=inc for p in ps):require(n[2]<0 and radial_min(ps)>=r-delta,'whole bottom triangle excludes small opening');patch='bottom'
  if patch is None and all(abs(p[2]-t)<=inc for p in ps):require(n[2]>0 and radial_min(ps)>=R-delta,'whole top triangle excludes large opening');patch='top'
  if patch is None and all(abs(p[2]-s)<=inc for p in ps):require(n[2]>0 and radial_min(ps)>=r-delta and max(rho)<=R+delta,'whole upward shoulder triangle is annular, never a disk');patch='shoulder'
  if patch is None:
   if all(-inc<=p[2]<=s+inc for p in ps) and max(rho)<=r+delta and radial_min(ps)>=r-delta:patch='small-wall'
   elif all(s-inc<=p[2]<=t+inc for p in ps) and max(rho)<=R+delta and radial_min(ps)>=R-delta:patch='large-wall'
   else:raise ValueError('Whole wall triangle leaves its actual finite cylindrical band')
   center=[math.fsum(p[k] for p in ps)/3 for k in range(3)];require(n[0]*(center[0]-cx)+n[1]*(center[1]-cy)<0,'actual inward cylindrical winding')
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
 require(len(vertices)-len(edges)+len(triangles)==0,'one actual through handle in connected oriented closed shell')
 def rim(first,second,z,radius):
  other=first+'-'+second
  rows=[key for key,uses in edges.items() if {labels[u[0]] for u in uses}=={first,second}];require(len(rows)>=3,'actual '+other+' circular rim edges');graph=defaultdict(set)
  for a,b in rows:graph[a].add(b);graph[b].add(a)
  require(all(len(v)==2 for v in graph.values()),'unbranched actual '+other+' rim');start=min(graph);cycle=[start];visited={start};previous=None;current=start
  while True:
   choices=graph[current]-({previous} if previous is not None else set());nxt=min(choices)
   if nxt==start:break
   require(nxt not in visited and len(cycle)<len(graph),'simple actual circular rim cycle');cycle.append(nxt);visited.add(nxt);previous,current=current,nxt
  require(len(cycle)==len(graph)==len(rows),'one complete actual circular rim')
  ps=[vertices[v] for v in cycle];angles=[]
  for p,q in zip(ps,ps[1:]+ps[:1]):
   require(abs(p[2]-z)<=inc and abs(math.hypot(p[0]-cx,p[1]-cy)-radius)<=delta,'actual finite circular rim vertex')
   require(segment_distance(p,q)>=radius-delta,'whole actual rim chord within circular deflection band')
   a,b=(p[0]-cx,p[1]-cy),(q[0]-cx,q[1]-cy);angle=math.atan2(a[0]*b[1]-a[1]*b[0],a[0]*b[0]+a[1]*b[1]);require(0<abs(angle)<math.pi,'ordinary actual directed circular chord');angles.append(angle)
  require(all(a>0 for a in angles) or all(a<0 for a in angles),'consistent angular rim traversal');require(abs(abs(math.fsum(angles))-2*math.pi)<=1e-9,'one full actual circular rim winding')
  area=abs(math.fsum((p[0]-cx)*(q[1]-cy)-(q[0]-cx)*(p[1]-cy) for p,q in zip(ps,ps[1:]+ps[:1])))/2
  require(abs(area-math.pi*radius*radius)<=math.pi*(2*radius*delta+delta*delta),'actual circular rim area within declared mesh error');return {'edges':len(rows),'area':area}
 bottom=rim('small-wall','bottom',0,r);inner=rim('small-wall','shoulder',s,r);outer=rim('large-wall','shoulder',s,R);top=rim('large-wall','top',t,R)
 # Every interpatch wall edge must be one of these actual rim pairs.
 allowed={frozenset(x) for x in [('small-wall','bottom'),('small-wall','shoulder'),('large-wall','shoulder'),('large-wall','top')]}
 for uses in edges.values():
  pair={labels[u[0]] for u in uses}
  if len(pair)==2 and any(p.endswith('-wall') for p in pair):require(frozenset(pair) in allowed,'no unsupported wall/patch junction')
 a={k:math.fsum(v) for k,v in areas.items()};roundoff=max(1e-6,128*math.ulp(max(W*H,max(a.values()))))
 require(abs(a['shoulder']-(outer['area']-inner['area']))<=roundoff,'complete upward annulus triangulation between actual two rims')
 require(abs(a['top']+top['area']-W*H)<=roundoff and abs(a['bottom']+bottom['area']-W*H)<=roundoff,'both complete cap triangulations exclude exactly their circular openings')
 for label,expected in [('x-min',H*t),('x-max',H*t),('y-min',W*t),('y-max',W*t)]:require(abs(a[label]-expected)<=roundoff,'complete original side patch '+label)
 for label,radius,height in [('small-wall',r,s),('large-wall',R,t-s)]:require(2*math.pi*(radius-delta)*height-roundoff<=a[label]<=2*math.pi*(radius+delta)*height+roundoff,'complete finite actual cylinder patch '+label)
 return {'quality':'independent-finite-counterbore-triangles-annulus-and-rims','deflectionMm':delta,'planeIncidenceMm':inc,'patchTriangles':dict(Counter(labels)),'patchAreas':a,'bottomRim':bottom,'innerShoulderRim':inner,'outerShoulderRim':outer,'topRim':top,'connectedShell':True,'vertexLinks':'one-cycle','eulerCharacteristic':0,'windingRadiansBudget':1e-9}
