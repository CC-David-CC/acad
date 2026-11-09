"""Independent AFTER-WHOLE finite geometry; no CAD/Native implementation imports.

All patch predicates use the exact represented binary64 coordinates (Fraction).
Native-to-analytic comparisons alone retain the existing 1e-6 mm/area budget.
Public packets contain no Native edge IDs: cancellation here is geometric
reconciliation, NOT an independent assertion about private Native membership.
"""
import math
from fractions import Fraction as F
from collections import defaultdict

def require(ok, why):
 if not ok: raise AssertionError(why)

def cross(a,b,c): return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])
def area(p): return sum(a[0]*b[1]-a[1]*b[0] for a,b in zip(p,p[1:]+p[:1]))/2
def between(a,b,p): return cross(a,b,p)==0 and all(min(a[k],b[k])<=p[k]<=max(a[k],b[k]) for k in (0,1))
def intersects(a,b,c,d):
 x,y,z,w=cross(a,b,c),cross(a,b,d),cross(c,d,a),cross(c,d,b)
 return (x*y<0 and z*w<0) or any((q==0 and between(s,t,p)) for q,s,t,p in ((x,a,b,c),(y,a,b,d),(z,c,d,a),(w,c,d,b)))

def simple(p):
 require(3<=len(p)<=512 and len(set(p))==len(p),'distinct positive finite cap vertices')
 require(area(p)!=0,'positive cap area')
 for i,(a,b) in enumerate(zip(p,p[1:]+p[:1])):
  require(a!=b,'nonzero cap edge')
  for j,(c,d) in enumerate(zip(p,p[1:]+p[:1])):
   if j<=i: continue
   if j==i+1 or (i==0 and j==len(p)-1):
    common=set((a,b))&set((c,d));require(len(common)==1,'adjacent edge endpoint')
    q=next(iter(common));u=a if a!=q else b;v=c if c!=q else d
    require(not between(q,u,v) and not between(q,v,u),'no adjacent retracing')
   else: require(not intersects(a,b,c,d),'simple cap has no nonadjacent contact/crossing')

def triangulate(p):
 simple(p);q=list(p if area(p)>0 else reversed(p))
 # Removing an exact between-point is private triangulation, not packet healing.
 changed=True
 while changed and len(q)>3:
  changed=False
  for i,b in enumerate(q):
   if between(q[i-1],q[(i+1)%len(q)],b): q.pop(i);changed=True;break
 result=[]
 while len(q)>3:
  found=False
  for i,b in enumerate(q):
   a,c=q[i-1],q[(i+1)%len(q)]
   if cross(a,b,c)<=0: continue
   if any(all(cross(s,t,v)>=0 for s,t in ((a,b),(b,c),(c,a))) for v in q if v not in (a,b,c)): continue
   result.append([a,b,c]);q.pop(i);found=True;break
  require(found,'independent finite simple polygon triangulation')
 require(cross(*q)>0,'positive final triangle');result.append(q)
 require(sum(area(t) for t in result)==abs(area(p)),'exact triangulation area conservation')
 return result

def clip(subject,convex):
 out=list(subject)
 for a,b in zip(convex,convex[1:]+convex[:1]):
  if not out: break
  old=out;out=[];p=old[-1];fp=cross(a,b,p)
  for q in old:
   fq=cross(a,b,q)
   if (fq>=0)!=(fp>=0):
    t=fp/(fp-fq);out.append(tuple(p[k]+t*(q[k]-p[k]) for k in (0,1)))
   if fq>=0: out.append(q)
   p,fp=q,fq
 return out

def rect(x0,x1,y0,y1): return [(x0,y0),(x1,y0),(x1,y1),(x0,y1)]

def finite_cap(patches,flags,expected,rectangles,metadata_area):
 """Whole finite union proof plus all observed patch/boundary ownership flags."""
 polys=[[tuple(F(v) for v in a) for a,b in edges] for edges in patches]
 tris=[triangulate(p) for p in polys];uses=defaultdict(list)
 for pi,edges in enumerate(patches):
  for ei,(a,b) in enumerate(edges):
   a,b=tuple(map(F,a)),tuple(map(F,b));uses[tuple(sorted((a,b)))].append((pi,a,b,flags[pi][ei]))
 boundaries=[]
 for key,rows in uses.items():
  require(len(rows) in (1,2),'at most two geometric cap-edge occurrences')
  if len(rows)==1:
   pi,a,b,tag=rows[0];require(tag==1,'all unpaired geometric edges are boundary-tagged');boundaries.append((a,b))
  else:
   p,a,b,tag=rows[0];q,c,d,other=rows[1]
   require(p!=q and a==d and b==c and tag==other==0,'internal geometric edge has two opposite patch uses')
 # Exact observed union: no positive-area overlaps, including contained patches.
 for i,ts in enumerate(tris):
  for other in tris[i+1:]:
   for t in ts:
    for u in other: require(not clip(t,u) or abs(area(clip(t,u)))==0,'actual cap patches have disjoint interiors')
 edgekeys=list(uses)
 for i,(a,b) in enumerate(edgekeys):
  for c,d in edgekeys[i+1:]:
   shared=set((a,b))&set((c,d))
   if shared:
    q=next(iter(shared));u=b if a==q else a;v=d if c==q else c
    require(not between(q,u,v) and not between(q,v,u),'no partial collinear overlap between distinct cap edges')
   else: require(not intersects(a,b,c,d),'cap partition is embedded, with no unreported intersections')
 incoming,outgoing=defaultdict(int),defaultdict(int)
 for a,b in boundaries: outgoing[a]+=1;incoming[b]+=1
 require(incoming==outgoing and all(v==1 for v in incoming.values()),'finite boundary cycles have exactly one incoming/outgoing geometric use')
 exact_area=sum(abs(area(p)) for p in polys);target=sum((F(x1)-F(x0))*(F(y1)-F(y0)) for x0,x1,y0,y1 in rectangles)
 require(abs(float(exact_area)-metadata_area)<=1e-6 and abs(float(exact_area-target))<=1e-6,'actual whole material area independently matches finite analytic union')
 # Tile the union of expanded finite analytic material rectangles into disjoint
 # cells. Exact triangle clipping proves EVERY patch point lies in that union;
 # a min-distance-to-infinite-support check would not establish this.
 tol=F(1e-6);boxes=[(F(a)-tol,F(b)+tol,F(c)-tol,F(d)+tol) for a,b,c,d in rectangles]
 xs=sorted({v for a,b,c,d in boxes for v in (a,b)});ys=sorted({v for a,b,c,d in boxes for v in (c,d)})
 tiles=[rect(a,b,c,d) for a,b in zip(xs,xs[1:]) for c,d in zip(ys,ys[1:]) if any(l<=(a+b)/2<=r and lo<=(c+d)/2<=hi for l,r,lo,hi in boxes)]
 for ts in tris:
  for t in ts:
   covered=sum(abs(area(p)) for tile in tiles if (p:=clip(t,tile)))
   require(covered==area(t),'entire finite triangle lies inside expected material, not the void/exterior')
 coverage=[[] for _ in expected]
 for a,b in boundaries:
  matches=[]
  for i,(p,q) in enumerate(expected):
   v=[q[k]-p[k] for k in (0,1)];length=math.hypot(*v);ts=[]
   for s in (a,b):
    t=sum((float(s[k])-p[k])*v[k] for k in (0,1))/(length*length)
    if not -1e-6/length<=t<=1+1e-6/length or math.dist([float(z) for z in s],[p[k]+t*v[k] for k in (0,1)])>1e-6: break
    ts.append(t)
   if len(ts)==2: matches.append((i,sorted(ts),1e-6/length))
  require(len(matches)==1,'each finite boundary belongs to exactly one analytic material span');i,ts,budget=matches[0];coverage[i].append((ts,budget))
 for intervals in coverage:
  end=0
  for (a,b),budget in sorted(intervals):
   require(abs(a-end)<=budget and b>a,'no missing/duplicated finite boundary coverage');end=b
  require(intervals and abs(end-1)<=intervals[-1][1],'complete finite analytic boundary span')
 return {'kind':'exact-represented-geometric-cap-reconciliation','nativeIdentityIndependent':False,'patches':len(polys),'triangles':sum(map(len,tris)),'area':float(exact_area)}

def chord_certificate(curve,a,b,points,paper,scale,evaluate):
 require(len(points)>=2,'finite SVG curve')
 if curve['line']: require(len(points)==2,'line uses exactly its two real endpoints')
 else: require(len(points)-1<=65536,'bounded conic presentation')
 errors=[]
 for i,q in enumerate(points):
  p=paper(evaluate(curve,a+(b-a)*i/(len(points)-1)))
  require(all(math.isfinite(x) for x in q),'finite paper coordinates');errors.append(math.dist(q,p))
  require(errors[-1]<=1e-6,'SVG vertex is actual analytic point under paper map')
 if not curve['line']:
  # Linear interpolation remainder for every t in EVERY chord interval, not
  # midpoint sampling: ||r''|| h²/8, plus observed endpoint serialization error.
  bound=scale*(math.hypot(*curve['a'])+math.hypot(*curve['b']))*((b-a)/(len(points)-1))**2/8
  for x,y in zip(errors,errors[1:]): require(bound+max(x,y)<=.02,'each complete analytic conic chord meets .02 mm PAPER error bound')
