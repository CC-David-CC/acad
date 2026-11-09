"""Independent finite conical/shank mesh surface proof, no production imports.
No welding. Closed indexed topology, exact dyadic projected planar overlap,
complete two annular walls with degree-one radial projection, actual shared
transition rim, NO floor, and declared full-triangle radial/chord error bands.
"""
import math
from collections import Counter,defaultdict
from decimal import Decimal,localcontext
from fractions import Fraction as Q
from truth import facts,need
INC=1e-6
DELTA=.01

def sub(a,b):return tuple(x-y for x,y in zip(a,b))
def cross(a,b):return(a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0])
def det(a,b):return a[0]*b[1]-a[1]*b[0]
def norm2(p):return sum(v*v for v in p)
def polygon_area(ps):return sum(det(a,b) for a,b in zip(ps,ps[1:]+ps[:1]))/2

def minimum_norm2(ps):
 signs=[det(a,b) for a,b in zip(ps,ps[1:]+ps[:1])]
 if polygon_area(ps) and (all(v>=0 for v in signs) or all(v<=0 for v in signs)):return Q(0)
 distances=[]
 for a,b in zip(ps,ps[1:]+ps[:1]):
  d=sub(b,a);den=norm2(d);t=max(Q(0),min(Q(1),-sum(x*y for x,y in zip(a,d))/den)) if den else Q(0);distances.append(norm2(tuple(x+t*y for x,y in zip(a,d))))
 return min(distances)
def overlap(a,b):
 for t in (a,b):
  for p,q in zip(t,t[1:]+t[:1]):
   n=(q[1]-p[1],p[0]-q[0]);x=[sum(u*v for u,v in zip(n,p)) for p in a];y=[sum(u*v for u,v in zip(n,p)) for p in b]
   if max(x)<=min(y) or max(y)<=min(x):return False
 return True

def no_overlap(rows,budget):
 rows=sorted([(min(p[0] for p in t),max(p[0] for p in t),min(p[1] for p in t),max(p[1] for p in t),t) for t in rows],key=lambda x:x[:4]);active=[]
 for row in rows:
  active=[x for x in active if x[1]>row[0]]
  for x in active:
   if x[3]<=row[2] or row[3]<=x[2]:continue
   budget[0]+=1;need(budget[0]<=2000000,'independent mesh-predicate resource limit');need(not overlap(x[4],row[4]),'no positive-area planar patch overlap')
  active.append(row)

def connected(ids,adj):
 ids=set(ids);need(ids,'nonempty actual patch');seen=set();todo=[next(iter(ids))]
 while todo:
  i=todo.pop()
  if i not in seen:seen.add(i);todo.extend((adj[i]&ids)-seen)
 return seen==ids

def inspect_conical_mesh(vertices,triangles,e):
 f=facts(e);r,R,s,T,k=(float(f[x]) for x in ('r','R','s','T','k'));cx,cy=float(f['cx']),float(f['cy']);need(0<len(vertices)<=150000 and 0<len(triangles)<=100000 and 32+24*len(vertices)+12*len(triangles)<=8388608,'qualified controlled-mesh budget');need(all(len(p)==3 and all(math.isfinite(x) for x in p) for p in vertices),'actual finite vertices');ps=[tuple(Q(x) for x in p) for p in vertices];center=(Q(cx),Q(cy));labels=[];edge=defaultdict(list);incident=defaultdict(set);patch=defaultdict(list);areas=defaultdict(list);volumes=[];budget=[0]
 for i,tri in enumerate(triangles):
  need(len(set(tri))==3 and all(type(v) is int and 0<=v<len(ps) for v in tri),'actual indexed triangle');p=[ps[j] for j in tri];n=cross(sub(p[1],p[0]),sub(p[2],p[0]));need(norm2(n)>0,'nondegenerate actual triangle');need(all(-INC<=float(q[0])<=e['width']+INC and -INC<=float(q[1])<=e['height']+INC and -INC<=float(q[2])<=T+INC for q in p),'all vertices in actual source prism');label=None
  for axis,value,name,sign in ((0,0,'xmin',-1),(0,e['width'],'xmax',1),(1,0,'ymin',-1),(1,e['height'],'ymax',1),(2,0,'bottom',-1),(2,T,'top',1)):
   if all(abs(float(q[axis])-value)<=INC for q in p):need(sign*n[axis]>0,'actual outward planar orientation');label=name;break
  if label is None:
   rho=[math.hypot(float(q[0])-cx,float(q[1])-cy) for q in p];cylinder=all(-INC<=float(q[2])<=s+INC and abs(rad-r)<=INC for q,rad in zip(p,rho));cone=all(s-INC<=float(q[2])<=T+INC and abs(rad-(r+k*(float(q[2])-s)))<=INC for q,rad in zip(p,rho));need(cylinder!=cone,'one finite cylindrical or conical wall, not an ambiguous transition sliver');label='shank' if cylinder else 'cone';need(all(n[0]*(q[0]-center[0])+n[1]*(q[1]-center[1])<0 for q in p),'exact represented inward radial orientation over ENTIRE triangle')
   if cone:need(n[2]>0,'true outward-to-void conical slope, no shoulder/floor substitution')
   # R(z) is affine and positive. The normalized radial image of an entire
   # triangle lies in the convex hull of its three normalized vertices, with
   # positive radius-weighted barycentric coefficients. Exact rational minimum
   # distance of that hull bounds EVERY point, not just sample centroids.
   with localcontext() as c:
    c.prec=100;rs=[f['r'] if cylinder else f['r']+f['k']*(Decimal(q[2].numerator)/Decimal(q[2].denominator)-f['s']) for q in p];need(min(rs)>0,'strict positive finite radial chart');normalized=[((q[0]-center[0])/Q(rad),(q[1]-center[1])/Q(rad)) for q,rad in zip(p,rs)];lower=1-Q(Decimal(str(DELTA+INC)))/Q(max(rs));need(lower>0 and minimum_norm2(normalized)>=lower*lower,'ENTIRE triangle within independently bounded circular/conical chord band')
  labels.append(label);projected=[tuple(q[j] for j in (1,2) if True) for q in p] if label in ('xmin','xmax') else [tuple(q[j] for j in (0,2)) for q in p] if label in ('ymin','ymax') else [(q[0],q[1]) for q in p];patch[label].append(projected);areas[label].append(math.sqrt(float(norm2(n)))/2)
  for j in range(3):u,v=tri[j],tri[(j+1)%3];edge[tuple(sorted((u,v)))].append((i,u,v));incident[u].add(i)
  volumes.append(float(sum(p[0][j]*cross(p[1],p[2])[j] for j in range(3))/6))
 expected={'xmin','xmax','ymin','ymax','bottom','top','shank','cone'};need(set(labels)==expected,'complete exact finite patch family, NO floor/shoulder');need(set(incident)==set(range(len(ps))),'no orphan vertex');adj=[set() for _ in triangles]
 for uses in edge.values():need(len(uses)==2 and uses[0][1:]==uses[1][1:][::-1],'closed opposite indexed edge uses');a,b=uses[0][0],uses[1][0];adj[a].add(b);adj[b].add(a)
 need(connected(range(len(triangles)),adj) and len(ps)-len(edge)+len(triangles)==0,'one connected actual genus-one boundary')
 for v,ids in incident.items():
  graph={i:set() for i in ids}
  for i in ids:
   for j in range(3):
    key=tuple(sorted((triangles[i][j],triangles[i][(j+1)%3])))
    if v in key:graph[i].update(x[0] for x in edge[key] if x[0]!=i)
  need(all(len(x)==2 for x in graph.values()) and connected(ids,graph),'one true cyclic vertex link, no bow tie')
 def ring(keys,z,radius):
  graph=defaultdict(set)
  for a,b in keys:graph[a].add(b);graph[b].add(a)
  need(len(graph)>=3 and all(len(x)==2 for x in graph.values()),'simple actual indexed finite rim');start=min(graph);cycle=[start];previous=None;current=start
  while True:
   nxt=min(graph[current]-({previous} if previous is not None else set()))
   if nxt==start:break
   need(nxt not in cycle and len(cycle)<len(graph),'simple rim cycle');cycle.append(nxt);previous,current=current,nxt
  need(len(cycle)==len(graph)==len(keys),'one complete finite rim');actualZ=ps[start][2];need(all(ps[i][2]==actualZ for i in cycle) and abs(float(actualZ)-z)<=INC,'actual constant-level rim, independently bounded source transition');xy=[(ps[i][0]-center[0],ps[i][1]-center[1]) for i in cycle];turns=[det(a,b) for a,b in zip(xy,xy[1:]+xy[:1])];need(all(t>0 for t in turns) or all(t<0 for t in turns),'strict angular progression, no phase welding');winding=0
  for a,b in zip(xy,xy[1:]+xy[:1]):
   need(abs(math.sqrt(float(norm2(a)))-radius)<=INC and minimum_norm2([a,b])>=Q(max(0,radius-DELTA-INC))**2,'entire actual rim chord within circular error budget')
   if a[1]<=0<b[1] and det(a,b)>0:winding+=1
   elif b[1]<=0<a[1] and det(a,b)<0:winding-=1
  need(abs(winding)==1,'exact dyadic ray-crossing winding ONE, not atan phase rounding');return {'area':abs(polygon_area(xy)),'z':actualZ,'edges':set(keys),'vertices':set(cycle),'winding':winding}
 def annulus(label,low,high,lower_neighbor,upper_neighbor,low_radius,high_radius):
  ids={i for i,x in enumerate(labels) if x==label};need(connected(ids,adj),'one connected actual '+label+' wall');uses={key:[u for u in rows if u[0] in ids] for key,rows in edge.items() if any(u[0] in ids for u in rows)};verts={v for key in uses for v in key};need(len(verts)-len(uses)+len(ids)==0,'actual wall topology annulus');boundary={key for key,rows in uses.items() if len(rows)==1};lower={key for key in boundary if {labels[u[0]] for u in edge[key]}=={label,lower_neighbor}};upper={key for key in boundary if {labels[u[0]] for u in edge[key]}=={label,upper_neighbor}};need(lower|upper==boundary and not(lower&upper),'ONLY actual lower/upper neighbor patches, no unclaimed wall contact');a=ring(lower,low,low_radius);b=ring(upper,high,high_radius);need(a['z']<b['z'] and all(a['z']<=ps[v][2]<=b['z'] for v in verts),'all actual wall triangles between their two exact rim levels');return a,b
 bottom,transition=annulus('shank',0,s,'bottom','cone',r,r);transition2,top=annulus('cone',s,T,'shank','top',r,R);need(transition['edges']==transition2['edges'] and transition['vertices']==transition2['vertices'] and transition['z']==transition2['z'],'ONE identical actual transition rim shared by both walls, not fitted circles')
 # Each connected wall is an annulus. Exact inward radial Jacobian sign at
 # every triangle vertex holds throughout each affine triangle. Both boundary
 # cycles wind once at distinct exact levels. Its proper positive radial map
 # therefore has degree1: one sheet at every angle/height, no fold or overlap.
 # Combined with the entire-triangle radial band this proves full wall extent;
 # it is stronger than radius samples or accumulated mesh volume.
 planar={'xmin':e['height']*T,'xmax':e['height']*T,'ymin':e['width']*T,'ymax':e['width']*T,'bottom':e['width']*e['height']-float(bottom['area']),'top':e['width']*e['height']-float(top['area'])};areaBudget=max(1e-6,128*math.ulp(e['width']*e['height']*max(1,T)))
 for label,value in planar.items():need(connected((i for i,x in enumerate(labels) if x==label),adj),'one connected planar '+label);no_overlap(patch[label],budget);need(abs(math.fsum(areas[label])-value)<=areaBudget,'complete nonoverlapping actual planar patch '+label)
 volume=math.fsum(volumes);sourceArea=2*(e['width']*e['height']+(e['width']+e['height'])*T);allowance=math.pi*(2*r*DELTA+DELTA**2)*T+math.pi*k*(T-s)**2*DELTA+INC*sourceArea+max(1e-5,abs(float(f['volume']))*1e-12);need(volume>0 and abs(volume-float(f['volume']))<=allowance,'actual mesh versus independently integrated conical deflection volume allowance')
 return {'quality':'independent-finite-plane/cone/shank/indexed-topology/radial-degree-proof','vertices':len(ps),'triangles':len(triangles),'euler':0,'signedVolume':volume,'volumeAllowance':allowance,'surfaceDeflectionMm':DELTA,'incidenceMm':INC,'actualTransitionZ':float(transition['z']),'sharedTransitionEdges':len(transition['edges']),'noAnnularFloor':True,'exactPlanarPairTests':budget[0],'patchTriangles':dict(Counter(labels))}
