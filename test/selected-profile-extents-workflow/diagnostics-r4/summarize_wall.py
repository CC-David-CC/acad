#!/usr/bin/env python3
"""Additional offline observations, NOT a replacement/qualified mesh oracle."""
import argparse,collections,hashlib,json,math
from pathlib import Path
from fractions import Fraction as Q
import diagnose_mesh as d
sha=lambda b:hashlib.sha256(b).hexdigest()
def components(nodes,adj):
 remaining=set(nodes);parts=[]
 while remaining:
  seen=set();todo=[min(remaining)]
  while todo:
   i=todo.pop()
   if i not in seen:seen.add(i);todo.extend((adj[i]&remaining)-seen)
  remaining-=seen;parts.append(sorted(seen))
 return parts
def min_norm2(ps):
 cross=[d.det(a,b) for a,b in zip(ps,ps[1:]+ps[:1])]
 if d.area2(ps) and (all(v>=0 for v in cross) or all(v<=0 for v in cross)):return Q(0)
 distances=[]
 for a,b in zip(ps,ps[1:]+ps[:1]):
  delta=d.sub(b,a);den=sum(x*x for x in delta);t=max(Q(0),min(Q(1),-sum(x*y for x,y in zip(a,delta))/den)) if den else Q(0);distances.append(sum((a[i]+t*delta[i])**2 for i in range(2)))
 return min(distances)
def run(whole,out):
 raw=(whole/'receipt.json').read_bytes();r=json.loads(raw);item=next(x for x in r['artifacts'] if x['savedFile']=='blind-interval.3mf');export=next(x for x in r['exportSets'] if x['case']==item['case'] and x['label']==item['label']);source=export['before']['capture']['native']['source'];frame=json.loads(source)['metadata']['boundaryFrame'];meta,v,t,tokens=d.extract(whole/item['savedFile']);axes=[frame[k] for k in ('x','y','z')];local=[[sum((p[j]-frame['origin'][j])*axis[j] for j in range(3)) for axis in axes] for p in v];q=[tuple(Q(n) for n in p) for p in local];e=item['expected'];lo,hi=d.interval(e);h=e['holes'][0];c={'id':'hole0','c':[h['u'],h['v']],'r':h['radius'],'low':hi-h['depth'],'high':hi,'sign':-1,'blind':True};classified=[d.classify([local[j] for j in tri],e,lo,hi,[c]) for tri in t];labels=[('wall-'+c['id'] if x['label']=='wall' and len(x['candidates'])==1 else x['label']) for x in classified];ids={i for i,x in enumerate(labels) if x=='wall-hole0'};edge=collections.defaultdict(list);incident=collections.defaultdict(set)
 for i,tri in enumerate(t):
  for k in range(3):edge[tuple(sorted((tri[k],tri[(k+1)%3])))].append((i,tri[k],tri[(k+1)%3]));incident[tri[k]].add(i)
 adj=collections.defaultdict(set)
 for rows in edge.values():
  for a in rows:
   for b in rows:
    if a[0]!=b[0]:adj[a[0]].add(b[0])
 badlinks=[]
 for vertex,rows in incident.items():
  link=collections.defaultdict(set)
  for key,uses in edge.items():
   if vertex in key:
    for a in uses:
     for b in uses:
      if a[0]!=b[0]:link[a[0]].add(b[0])
  if any(len(link[i])!=2 for i in rows) or len(components(rows,link))!=1:badlinks.append(vertex)
 wallEdges={key:[u for u in uses if u[0] in ids] for key,uses in edge.items() if any(u[0] in ids for u in uses)};wallVertices={v for key in wallEdges for v in key};boundary={key for key,uses in wallEdges.items() if len(uses)==1};g=collections.defaultdict(set)
 for a,b in boundary:g[a].add(b);g[b].add(a)
 rims=[]
 for nodes in components(g,g):
  start=min(nodes);cycle=[start];previous=None;at=start
  while True:
   choices=g[at]-({previous} if previous is not None else set());nxt=min(choices)
   if nxt==start:break
   if nxt in cycle:raise ValueError('Repeated actual boundary index')
   cycle.append(nxt);previous,at=at,nxt
  xy=[(q[i][0]-Q(c['c'][0]),q[i][1]-Q(c['c'][1])) for i in cycle];turns=[d.det(a,b) for a,b in zip(xy,xy[1:]+xy[:1])];winding=0
  for a,b in zip(xy,xy[1:]+xy[:1]):
   if a[1]<=0<b[1] and d.det(a,b)>0:winding+=1
   elif b[1]<=0<a[1] and d.det(a,b)<0:winding-=1
  rimEdges={tuple(sorted((cycle[j],cycle[(j+1)%len(cycle)]))) for j in range(len(cycle))};neighbors=collections.Counter(','.join(sorted({labels[u[0]] for u in edge[key]})) for key in rimEdges)
  rims.append({'vertices0':cycle,'edges':len(rimEdges),'degrees':dict(collections.Counter(len(g[i]) for i in cycle)),'exactLocalZ':sorted({str(q[i][2]) for i in cycle}),'positiveAngularEdges':sum(n>0 for n in turns),'negativeAngularEdges':sum(n<0 for n in turns),'zeroAngularEdges':sum(n==0 for n in turns),'exactRayWinding':winding,'signedPolygonAreaExact':str(d.area2(xy)/2),'neighborLabels':dict(neighbors)})
 radialSigns=[];minimum=[];maximum=[];nearest=[];normalZ=[];zsets=collections.Counter()
 for i in sorted(ids):
  ps=[q[j] for j in t[i]];n=d.cross(d.sub(ps[1],ps[0]),d.sub(ps[2],ps[0]));xy=[(p[0]-Q(c['c'][0]),p[1]-Q(c['c'][1])) for p in ps];radialSigns.extend(c['sign']*(n[0]*p[0]+n[1]*p[1]) for p in xy);minimum.append(min_norm2(xy));maximum.extend(sum(x*x for x in p) for p in xy);normalZ.append(abs(n[2]));zsets[str(sorted({float(p[2]) for p in ps}))]+=1
  distances=[math.dist(local[t[i][a]][:2],local[t[i][b]][:2]) for a in range(3) for b in range(a) if local[t[i][a]][2]!=local[t[i][b]][2]];nearest.append(min(distances))
 result={'role':'diagnostic-only; no full cap/nonoverlap or acceptance certification','receiptSHA256':sha(raw),'artifactSHA256':meta['sha256'],'originalSourceSHA256':sha(source.encode()),'sourceFrame':frame,'sourceCylinder':c,'indexedClosedShell':{'vertexLinkCycleFailures0':badlinks,'triangleComponents':len(components(range(len(t)),adj))},'wall':{'triangleOrdinals0':sorted(ids),'vertices':len(wallVertices),'edges':len(wallEdges),'triangles':len(ids),'euler':len(wallVertices)-len(wallEdges)+len(ids),'triangleComponents':len(components(ids,adj)),'boundaryEdges':len(boundary),'boundaryDegreeCensus':dict(collections.Counter(len(x) for x in g.values())),'rimComponents':rims,'exactLocalVertexZ':sorted({str(q[i][2]) for i in wallVertices}),'triangleLevelCensus':dict(zsets),'minimumSignedRadialJacobianExact':str(min(radialSigns)),'minimumSignedRadialJacobianFloat':float(min(radialSigns)),'nonpositiveRadialJacobianVertexCount':sum(s<=0 for s in radialSigns),'maximumAbsoluteNormalZ':float(max(normalZ)),'minimumFullTriangleRadiusSquaredExact':str(min(minimum)),'minimumFullTriangleRadius':math.sqrt(float(min(minimum))),'maximumVertexRadiusSquaredExact':str(max(maximum)),'maximumVertexRadius':math.sqrt(float(max(maximum))),'minimumNearestCrossLevelXYDifference':min(nearest),'maximumNearestCrossLevelXYDifference':max(nearest),'zeroNearestCrossLevelCount':sum(n==0 for n in nearest)},'scriptPins':{p.name:sha(p.read_bytes()) for p in [Path(__file__),Path(d.__file__)]}}
 with out.open('x') as f:json.dump(result,f,indent=2);f.write('\n')
 print(json.dumps({'output':str(out),'wallTriangles':len(ids),'wallEuler':result['wall']['euler'],'wallComponents':result['wall']['triangleComponents'],'rims':[{k:x[k] for k in ['edges','exactLocalZ','exactRayWinding','neighborLabels']} for x in rims],'nonpositiveRadialJacobianVertexCount':result['wall']['nonpositiveRadialJacobianVertexCount'],'maximumNearestCrossLevelXYDifference':max(nearest),'minimumFullTriangleRadius':result['wall']['minimumFullTriangleRadius'],'vertexLinkCycleFailures0':badlinks},indent=2))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('whole',type=Path);p.add_argument('output',type=Path);a=p.parse_args();run(a.whole,a.output)
