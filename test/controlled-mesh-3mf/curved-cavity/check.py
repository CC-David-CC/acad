#!/usr/bin/env python3
"""Independent bounded closed-cylinder-cavity math; no new geometry engine."""
from pathlib import Path
import json,hashlib,math,importlib.util,sys
root=Path(__file__).parent;d=Path(sys.argv[1]);load=lambda n:json.loads((d/n).read_text());n=load('native-receipt.json');e=load('encoder-receipt.json');sha=lambda b:hashlib.sha256(b).hexdigest()
assert n['runtimePins']['jsSha256']=='32eec74e3019d9e2d767c9016f05aa3daa49441c6102423a269d67b9c7f02a08'and n['runtimePins']['wasmSha256']=='abbf2aa02a6f2101c600aa1eedd20fa80ab2db206e677ca860d9c5103cdfbfcc'
assert sha((root/'native-probe.cjs').read_bytes())==n['runtimePins']['probeSha256']and sha((root/'native-runner.cjs').read_bytes())==n['runtimePins']['runnerSha256']
for name,pin in e['sourcePinsBefore'].items():assert sha((root.parent.parent.parent/name).read_bytes())==pin,name
assert n['status']=='PASS'and n['finalOwnedNames']==0 and all(x['result']==1 for x in n['nameReleases']);assert n['release']['reply']['released'] and n['release']['reply']['activeCount']==0 and not n['releaseAgain']['reply']['released'];assert n['before']==n['after']and n['outerBefore']==n['outerAfter']and n['innerBefore']==n['innerAfter'];assert all(p['state']==p['actual']for p in n['points']);assert n['before']['metrics']['valid']and n['before']['metrics']['solidCount']==1 and n['before']['census']['counts']['shells']==2
assert abs(n['before']['metrics']['nativeVolume']-268*math.pi)<=1e-6;assert n['before']['metrics']['nativeBounds']=={'min':[-5,-5,0],'max':[5,5,12]};assert sha((d/n['mesh']['file']).read_bytes())==n['mesh']['sha256']==e['meshSha256'];assert sha((d/'native-receipt.json').read_bytes())==e['nativeReceiptSha256'];assert e['status']=='PASS'and e['sourcePinsBefore']==e['sourcePinsAfter'];assert e['production']['code']=='UNSUPPORTED_MESH_DOMAIN' and e['production']['inputsConsumed']and e['production']['fileCommitted']is False;assert e['diagnostic']['chain'][-1]['message']=='Ambiguous overlapping shell bounds';assert all(w['terminated']for w in e['productionWorkers'])and e['diagnosticWorkerTerminated']
spec=importlib.util.spec_from_file_location('mesh',root.parent.parent/'owned-manufacturing-mesh-worker/check-mesh.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);p,t=m.decode(d/n['mesh']['file']);assert m.check_topology(p,t)==4
# Split using exact shared indexed edges. No proximity welding or identity claim.
adj={i:set()for i in range(len(t))};uses={}
for i,tri in enumerate(t):
 for j in range(3):
  k=tuple(sorted((tri[j],tri[(j+1)%3])));old=uses.get(k)
  if old is None:uses[k]=i
  else:adj[i].add(old);adj[old].add(i)
components=[];unseen=set(adj)
while unseen:
 todo=[next(iter(unseen))];seen=set()
 while todo:
  i=todo.pop()
  if i not in seen:seen.add(i);todo.extend(adj[i]-seen)
 unseen-=seen;components.append(sorted(seen))
assert len(components)==2;rows=[];formula=0
for indices in components:
 vertices=sorted({v for i in indices for v in t[i]});remap={v:i for i,v in enumerate(vertices)};points=[p[v]for v in vertices];triangles=[tuple(remap[v]for v in t[i])for i in indices];assert m.check_topology(points,triangles)==2;actual=m.volume(points,triangles);radius=5 if actual>0 else 2;height,z0,sign=(12,0,1)if actual>0 else(8,2,-1)
 assert all(abs(math.hypot(v[0],v[1])-radius)<=1e-8 and(any(abs(v[2]-z)<=1e-8 for z in[z0,z0+height]))for v in points)
 for tri in triangles:
  q=[points[i]for i in tri];normal=m.cross(m.sub(q[1],q[0]),m.sub(q[2],q[0]));caps=[z for z in[z0,z0+height]if all(abs(v[2]-z)<=1e-8 for v in q)]
  if caps:assert normal[2]*sign*(1 if caps[0]>z0 else -1)>0
  else:
   assert sign*(normal[0]*sum(v[0]for v in q)+normal[1]*sum(v[1]for v in q))>0
   aa=[math.atan2(v[1],v[0])for v in q];assert all(min((a-b)%(2*math.pi),(b-a)%(2*math.pi))<=.1+1e-10 for a in aa for b in aa)
 angles=sorted(math.atan2(v[1],v[0])%(2*math.pi)for v in points if abs(v[2]-z0)<=1e-8);deltas=[(angles[(i+1)%len(angles)]-a)%(2*math.pi)for i,a in enumerate(angles)];assert all(0<x<=.1+1e-10 for x in deltas);sag=max(radius*(1-math.cos(x/2))for x in deltas);assert sag<=.01+1e-10;poly=sign*height*radius**2*math.fsum(math.sin(x)for x in deltas)/2;assert abs(actual-poly)<=1e-6;formula+=poly;rows.append({'radius':radius,'height':height,'z0':z0,'orientedMeshVolume':actual,'polygonFormulaVolume':poly,'maxAngularStep':max(deltas),'maxSagMm':sag,'vertices':len(points),'triangles':len(triangles)})
assert len([x for x in rows if x['radius']==5])==len([x for x in rows if x['radius']==2])==1
actual=m.volume(p,t);assert abs(actual-formula)<=1e-6;bound=.01*2*math.pi*(5*12+2*8)+1e-6;assert abs(actual-268*math.pi)<=bound;probes=[]
for point,expected in[([0,0,6],0),([0,0,1],1),([4,0,6],1),([6,0,6],0)]:
 w=m.winding(p,t,point);assert abs(w-expected)<=1e-8;probes.append({'point':point,'expectedMaterial':bool(expected),'meshWinding':w})
print(json.dumps({'status':'PASS','nativeVolume':n['before']['metrics']['nativeVolume'],'analyticVolume':268*math.pi,'meshVolume':actual,'approximationResidual':abs(actual-268*math.pi),'approximationBound':bound,'shells':rows,'points':probes,'writerGap':'CONFIRMED: Ambiguous overlapping shell bounds','scope':'Genuine Native component+bounded independent fixture math; no general nesting/source-authority/public3MF certificate'},indent=2))
