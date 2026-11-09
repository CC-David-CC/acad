"""Independent finite controlled-mesh audit for the authored prism domains.

Actual indices are authoritative connectivity: NO welding. Planar overlap uses
represented-binary64 Fraction predicates; cylindrical walls use complete exact
radial-projection coverage rather than identical-coordinate strips. Integration
is SOURCE ONLY until the full CGAL/planar/source/artifact packet is qualified.
This is an artifact approximation proof, never a 50pm BRep claim.
"""
import math
from pathlib import Path
import sys
from collections import Counter,defaultdict
from fractions import Fraction as Q
sys.path.insert(0,str(Path(__file__).resolve().parent.parent/'library-validation'))
from cylindrical_surface_certificate import certify_full_cylinder
from planar_patch_certificate import certify_planar_patches
INC=1e-6
DEFL=.01
def need(v,m):
 if not v:raise ValueError(m)
def sub(a,b):return tuple(x-y for x,y in zip(a,b))
def cross(a,b):return (a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0])
def det(a,b):return a[0]*b[1]-a[1]*b[0]
def area2(p):return sum(det(a,b) for a,b in zip(p,p[1:]+p[:1]))
def exact_overlap(a,b):
 # Positive-area intersection of two nondegenerate convex triangles. A boundary
 # contact is allowed here; actual indexed manifold topology is checked below.
 for p in (a,b):
  for u,v in zip(p,p[1:]+p[:1]):
   n=(v[1]-u[1],u[0]-v[0]);x=[n[0]*q[0]+n[1]*q[1] for q in a];y=[n[0]*q[0]+n[1]*q[1] for q in b]
   if max(x)<=min(y) or max(y)<=min(x):return False
 return True
def disjoint_triangles(rows,budget):
 rows=[tuple(tuple(Q(v) for v in p) for p in row) for row in rows];ordered=sorted([(min(p[0] for p in t),max(p[0] for p in t),min(p[1] for p in t),max(p[1] for p in t),t) for t in rows],key=lambda x:x[:4]);active=[]
 for lo,hi,bot,top,t in ordered:
  active=[a for a in active if a[1]>lo]
  for a in active:
   if a[3]<=bot or top<=a[2]:continue
   budget[0]+=1;need(budget[0]<=2000000,'independent exact-pair resource limit, not invalid geometry');need(not exact_overlap(t,a[4]),'no positive-area coplanar triangle overlap')
  active.append((lo,hi,bot,top,t))
def radial_min(ps,c):
 points=[(p[0]-c[0],p[1]-c[1]) for p in ps];s=[det(a,b) for a,b in zip(points,points[1:]+points[:1])]
 if area2(points) and (all(v>=0 for v in s) or all(v<=0 for v in s)):return 0.
 d=[]
 for a,b in zip(points,points[1:]+points[:1]):
  v=(b[0]-a[0],b[1]-a[1]);den=v[0]**2+v[1]**2;t=max(0,min(1,-(a[0]*v[0]+a[1]*v[1])/den)) if den else 0;d.append(math.hypot(a[0]+t*v[0],a[1]+t*v[1]))
 return min(d)
def inspect_mesh(vertices,triangles,e,frame,lo,hi,truth_volume,planar_config):
 need(0<len(vertices)<=150000 and 0<len(triangles)<=100000,'qualified per-artifact count limits');need(all(len(p)==3 and all(math.isfinite(v) for v in p) for p in vertices),'finite actual vertices');need(set(frame)=={'origin','x','y','z'},'actual original frame')
 # All frozen placements are exact orthonormal signed permutations. Refuse a
 # different readback contract rather than use an ill-conditioned inverse.
 axes=[frame[k] for k in ('x','y','z')];need(all(sum(v*v for v in a)==1 and all(v in (-1,0,1) for v in a) for a in axes) and all(sum(x*y for x,y in zip(a,b))==0 for i,a in enumerate(axes) for b in axes[:i]),'frozen axis-permutation frame')
 need(cross(axes[0],axes[1])==tuple(axes[2]),'source frame has preserved right handedness')
 # Keep original represented world coordinates exact BEFORE frame subtraction.
 # The float view is only the retained classifier/diagnostic path; the surface
 # certificate consumes these exact rational transformed values.
 local_exact=[tuple(sum((Q(p[j])-Q(frame['origin'][j]))*Q(axis[j]) for j in range(3)) for axis in axes) for p in vertices]
 local=[[float(x) for x in p] for p in local_exact];need(all(lo-INC<=p[2]<=hi+INC for p in local),'complete actual mesh interval');kind=e['kind'];rectangle=kind=='rectangle';outer=e.get('outer');inner=e.get('inner',0)
 cylinders=[]
 if not rectangle:cylinders.append({'id':'outer','c':(0,0),'r':outer,'low':lo,'high':hi,'sign':1})
 if inner:cylinders.append({'id':'inner','c':(0,0),'r':inner,'low':lo,'high':hi,'sign':-1})
 for i,h in enumerate(e.get('holes',[])):cylinders.append({'id':'hole'+str(i),'c':(h['u'],h['v']),'r':h['radius'],'low':lo if h['depth'] is None else hi-h['depth'],'high':hi,'sign':-1,'blind':h['depth'] is not None})
 labels=[];patches=defaultdict(list);areas=defaultdict(list);edge=defaultdict(list);incident=defaultdict(set);wall_faces=defaultdict(list);budget=[0];volumes=[]
 for i,tri in enumerate(triangles):
  need(len(set(tri))==3 and all(type(x) is int and 0<=x<len(local) for x in tri),'actual unique triangle indices');ps=[local[j] for j in tri];normal=cross(sub(ps[1],ps[0]),sub(ps[2],ps[0]));area=math.hypot(*normal)/2;need(area>0 and math.isfinite(area),'nonzero finite triangle area');label=None
  if rectangle:
   for axis,value,name,sign in ((0,0,'xmin',-1),(0,e['width'],'xmax',1),(1,0,'ymin',-1),(1,e['height'],'ymax',1)):
    if all(abs(p[axis]-value)<=INC for p in ps):need(normal[axis]*sign>0,'outward rectangular side orientation');label=name;patches[label].append([(p[1-axis],p[2]) for p in ps]);break
  for z,name,sign in ((lo,'bottom',-1),(hi,'top',1)):
   if label is None and all(abs(p[2]-z)<=INC for p in ps):need(normal[2]*sign>0,'outward cap winding');label=name;patches[name].append([(p[0],p[1]) for p in ps])
  for c in cylinders:
   if label is None and c.get('blind') and all(abs(p[2]-c['low'])<=INC for p in ps):need(normal[2]>0 and max(math.hypot(p[0]-c['c'][0],p[1]-c['c'][1]) for p in ps)<=c['r']+INC,'actual blind floor disk');label='floor-'+c['id'];patches[label].append([(p[0],p[1]) for p in ps])
  if label is None:
   cs=[c for c in cylinders if all(c['low']-INC<=p[2]<=c['high']+INC for p in ps) and max(math.hypot(p[0]-c['c'][0],p[1]-c['c'][1]) for p in ps)<=c['r']+INC and radial_min(ps,c['c'])>=c['r']-DEFL-INC];candidates=[]
   for c in cs:
    mid=[sum(p[k] for p in ps)/3 for k in range(3)]
    if c['sign']*(normal[0]*(mid[0]-c['c'][0])+normal[1]*(mid[1]-c['c'][1]))>0:candidates.append(c)
   c=one(candidates,'actual source cylindrical patch');label='wall-'+c['id'];wall_faces[c['id']].append(i)
  labels.append(label);areas[label].append(area)
  # Entire cap triangle stays in the appropriate finite material domain.
  if label in ('bottom','top'):
   if rectangle:need(all(-INC<=p[0]<=e['width']+INC and -INC<=p[1]<=e['height']+INC for p in ps),'entire planar rectangle cap within source')
   else:need(max(math.hypot(p[0],p[1]) for p in ps)<=outer+INC,'outer circular cap domain')
   for c in cylinders:
    if c['sign']==-1 and (label=='top' or c['low']==lo):need(radial_min(ps,c['c'])>=c['r']-DEFL-INC,'no cap triangles across finite circular void')
  for j in range(3):u,v=tri[j],tri[(j+1)%3];edge[tuple(sorted((u,v)))].append((i,u,v));incident[u].add(i)
  p,q,s=ps;volumes.append(sum(p[k]*cross(q,s)[k] for k in range(3))/6)
 need(set(incident)==set(range(len(vertices))),'no orphan vertices');adj=[set() for _ in triangles]
 for uses in edge.values():need(len(uses)==2 and uses[0][1:]==uses[1][1:][::-1],'closed indexed opposite edge uses');i,j=uses[0][0],uses[1][0];adj[i].add(j);adj[j].add(i)
 seen=set();todo=[0]
 while todo:
  i=todo.pop()
  if i not in seen:seen.add(i);todo.extend(adj[i]-seen)
 need(len(seen)==len(triangles),'one connected actual boundary shell')
 for v,ids in incident.items():
  graph={i:set() for i in ids}
  for i in ids:
   for k in range(3):
    key=tuple(sorted((triangles[i][k],triangles[i][(k+1)%3])))
    if v in key:graph[i].update(u[0] for u in edge[key] if u[0]!=i)
  need(all(len(g)==2 for g in graph.values()),'vertex link degree two');seen=set();todo=[next(iter(ids))]
  while todo:
   i=todo.pop()
   if i not in seen:seen.add(i);todo.extend(graph[i]-seen)
  need(seen==ids,'one vertex link cycle')
 def rim(c,z):
  edges=[key for key,uses in edge.items() if 'wall-'+c['id'] in {labels[u[0]] for u in uses} and any(labels[u[0]] in ('top','bottom','floor-'+c['id']) for u in uses) and all(abs(local[v][2]-z)<=INC for v in key)];g=defaultdict(set)
  for a,b in edges:g[a].add(b);g[b].add(a)
  need(len(g)>=3 and all(len(x)==2 for x in g.values()),'actual circular rim cycle');start=min(g);cycle=[start];previous=None;current=start
  while True:
   nxt=min(g[current]-({previous} if previous is not None else set()))
   if nxt==start:break
   need(nxt not in cycle and len(cycle)<len(g),'simple circular rim');cycle.append(nxt);previous,current=current,nxt
  need(len(cycle)==len(g)==len(edges),'one complete rim');ps=[(local[i][0]-c['c'][0],local[i][1]-c['c'][1]) for i in cycle];angles=[]
  for a,b in zip(ps,ps[1:]+ps[:1]):
   need(abs(math.hypot(*a)-c['r'])<=INC,'rim vertices on actual source circle');d=(b[0]-a[0],b[1]-a[1]);den=sum(x*x for x in d);t=max(0,min(1,-sum(x*y for x,y in zip(a,d))/den));need(math.hypot(a[0]+t*d[0],a[1]+t*d[1])>=c['r']-DEFL-INC,'entire circular chord deflection');angles.append(math.atan2(det(a,b),sum(x*y for x,y in zip(a,b))))
  need(all(x>0 for x in angles) or all(x<0 for x in angles),'consistent circle rim order');need(abs(abs(math.fsum(angles))-2*math.pi)<=1e-9,'one full rim winding');return abs(area2(ps))/2
 rims={c['id']:{'lower':rim(c,c['low']),'upper':rim(c,c['high'])} for c in cylinders};actual={k:math.fsum(v) for k,v in areas.items()};flat=e['width']*e['height'] if rectangle else rims['outer']['upper'];top=flat-sum(rims[c['id']]['upper'] for c in cylinders if c['sign']==-1);bottom=(e['width']*e['height'] if rectangle else rims['outer']['lower'])-sum(rims[c['id']]['lower'] for c in cylinders if c['sign']==-1 and c['low']==lo);expected={'top':top,'bottom':bottom}
 if rectangle:expected.update(xmin=e['height']*(hi-lo),xmax=e['height']*(hi-lo),ymin=e['width']*(hi-lo),ymax=e['width']*(hi-lo))
 expected.update({'floor-'+c['id']:rims[c['id']]['lower'] for c in cylinders if c.get('blind')});roundoff=max(1e-6,128*math.ulp(max(actual.values())))
 for key,value in expected.items():need(key in actual and abs(actual[key]-value)<=roundoff,'complete nonoverlapping planar patch area '+key)
 for key,rows in patches.items():disjoint_triangles(rows,budget)
 wall_certificates={c['id']:certify_full_cylinder(local_exact,triangles,wall_faces[c['id']],c['c'],c['r'],c['low'],c['high'],c['sign'],DEFL,INC) for c in cylinders}
 planar_certificates=certify_planar_patches(vertices,triangles,labels,local_exact,frame,e,cylinders,lo,hi,planar_config)
 need(planar_certificates['status']=='PASS' and planar_certificates['complete'] is True,'every expected indexed planar patch has complete current exact coverage')
 volume=math.fsum(volumes);allowance=sum(math.pi*(2*c['r']*DEFL+DEFL**2)*(c['high']-c['low']) for c in cylinders)+max(1e-5,abs(truth_volume)*1e-12);need(volume>0 and abs(volume-truth_volume)<=allowance,'positive volume within independent declared tessellation budget');need(set(actual)==set(expected)|{'wall-'+c['id'] for c in cylinders},'no missing or unclassified patches');euler=len(vertices)-len(edge)+len(triangles);expectedEuler=2-2*(int(bool(inner))+sum(h['depth'] is None for h in e.get('holes',[])));need(euler==expectedEuler,'actual independent shell genus matches authored through-void topology')
 return {'quality':'independent-indexed-manifold/finite-patch/exact-cylinder-coverage','vertices':len(vertices),'triangles':len(triangles),'euler':len(vertices)-len(edge)+len(triangles),'signedVolume':volume,'volumeAllowance':allowance,'deflectionMm':DEFL,'planeIncidenceMm':INC,'patchAreas':actual,'circularRims':rims,'cylindricalCertificates':wall_certificates,'planarCertificates':planar_certificates,'exactCoplanarPairTests':budget[0]}
def one(xs,label):need(len(xs)==1,'one '+label);return xs[0]
