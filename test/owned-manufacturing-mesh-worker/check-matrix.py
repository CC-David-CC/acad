#!/usr/bin/env python3
"""Independent bounded authored-fixture math over genuine binary buffers."""
import importlib.util,json,math,sys
from pathlib import Path
spec=importlib.util.spec_from_file_location('base',Path(__file__).with_name('check-mesh.py'));base=importlib.util.module_from_spec(spec);spec.loader.exec_module(base)

def points(p,t,probes):
 out=[]
 for point,material in probes:
  w=base.winding(p,t,point);assert abs(w-int(material))<=1e-8,(point,w,material);out.append({'point':point,'expectedMaterial':material,'meshWinding':w})
 return out

def plate(file,w,h,depth,treated=False,grid=False):
 p,t=base.decode(file);euler=base.check_topology(p,t);count=32 if grid else 5;assert euler==2-2*count
 holes=[(8+12*(i%8),7+12*(i//8),1) for i in range(32)] if grid else [(w/2,h/2,5),(8,8,2),(w-8,8,2),(8,h-8,2),(w-8,h-8,2)]
 arcs=[{'center':(x,y),'r':r,'start':0.,'sweep':2*math.pi,'inner':True} for x,y,r in holes]
 if treated:arcs.extend([{'center':(3,3),'r':3,'start':math.pi,'sweep':math.pi/2,'inner':False},{'center':(w-3,h-3),'r':3,'start':0.,'sweep':math.pi/2,'inner':False}])
 samples=[set() for _ in arcs];tolerance=1e-8
 def on(v,arc):return abs(math.hypot(v[0]-arc['center'][0],v[1]-arc['center'][1])-arc['r'])<=tolerance
 def linear(vertices):
  if any(all(abs(v[axis]-value)<=tolerance for v in vertices) for axis,value in [(0,0),(0,w),(1,0),(1,h)]):return True
  if treated and (all(abs((w-v[0])+v[1]-1)<=tolerance and -tolerance<=w-v[0]<=1+tolerance and -tolerance<=v[1]<=1+tolerance for v in vertices) or all(abs(v[0]+h-v[1]-1)<=tolerance and -tolerance<=v[0]<=1+tolerance and -tolerance<=h-v[1]<=1+tolerance for v in vertices)):return True
  return False
 for triangle in t:
  vertices=[p[i] for i in triangle]
  if any(all(abs(v[2]-z)<=tolerance for v in vertices) for z in (0,depth)):continue
  matches=[i for i,a in enumerate(arcs) if all(on(v,a) for v in vertices)]
  if not matches:assert linear(vertices),('unexplained lateral surface',vertices)
  else:
   assert len(matches)==1
   for index,v in zip(triangle,vertices):
    if abs(v[2])<=tolerance:samples[matches[0]].add(index)
 sampling=[];outerLoss=0.;innerLoss=0.;curvedLength=0.
 for arc,indices in zip(arcs,samples):
  assert len(indices)>=3;cx,cy=arc['center'];start=arc['start'];sweep=arc['sweep'];angular=[]
  for i in indices:
   a=(math.atan2(p[i][1]-cy,p[i][0]-cx)-start)%(2*math.pi)
   if abs(a-2*math.pi)<=1e-12:a=0.
   assert -1e-12<=a<=sweep+1e-12;angular.append(a)
  angular.sort();deltas=[b-a for a,b in zip(angular,angular[1:])]
  if sweep==2*math.pi:deltas.append(2*math.pi-angular[-1]+angular[0])
  else:assert abs(angular[0])<=1e-12 and abs(angular[-1]-sweep)<=1e-12
  assert all(0<d<=.1+1e-10 for d in deltas);sag=max(arc['r']*(1-math.cos(d/2)) for d in deltas);assert sag<=.01+1e-10;loss=math.fsum(arc['r']**2*(d-math.sin(d))/2 for d in deltas);curvedLength+=arc['r']*sweep
  if arc['inner']:innerLoss+=loss
  else:outerLoss+=loss
  sampling.append({'center':[cx,cy],'radius':arc['r'],'sweep':sweep,'samples':len(indices),'maxAngularStep':max(deltas),'maxSagMm':sag,'arcAreaLossMM2':loss})
 source=w*h*depth-depth*math.pi*sum(r*r for x,y,r in holes)
 if treated:source-=2*depth*9*(1-math.pi/4)+depth
 actual=base.volume(p,t);bound=depth*.01*curvedLength+1e-6;assert actual>0 and abs(actual-source)<=bound
 polygon=source+depth*innerLoss-depth*outerLoss;assert abs(actual-polygon)<=1e-6,(file,actual,polygon)
 lo=[min(v[i] for v in p) for i in range(3)];hi=[max(v[i] for v in p) for i in range(3)];assert all(abs(lo[i])<=1e-8 and abs(hi[i]-[w,h,depth][i])<=1e-8 for i in range(3))
 probes=[([x,y,depth/2],False) for x,y,r in holes]+[([2,h/2,depth/2],True),([w/2+10,h/2,depth/2],True)]
 if treated:probes.extend([([.5,.5,depth/2],False),([w-.5,h-.5,depth/2],False),([w-.2,.2,depth/2],False),([.2,h-.2,depth/2],False),([2,2,depth/2],True)])
 return{'file':Path(file).name,'vertices':len(p),'triangles':len(t),'euler':euler,'sourceVolumeMM3':source,'meshVolumeMM3':actual,'sourceApproximationResidualMM3':abs(actual-source),'sourceApproximationBoundMM3':bound,'polyhedralFormulaVolumeMM3':polygon,'formulaArithmeticResidualMM3':abs(actual-polygon),'boundarySampling':sampling,'pointChecks':points(p,t,probes)}
def planar(file,label,volume,lo,hi,probes,euler=2):
 p,t=base.decode(file);assert base.check_topology(p,t)==euler;actual=base.volume(p,t);assert abs(actual-volume)<=1e-7;assert all(abs(min(v[i] for v in p)-lo[i])<=1e-9 and abs(max(v[i] for v in p)-hi[i])<=1e-9 for i in range(3));return{'file':Path(file).name,'kind':label,'meshVolumeMM3':actual,'sourceVolumeMM3':volume,'sourceApproximationResidualMM3':abs(actual-volume),'pointChecks':points(p,t,probes),'euler':euler}
if __name__=='__main__':
 d=Path(sys.argv[1]);rows=[base.check(d/(name+'.mesh'),name) for name in ['box','cylinder','annulus']]
 for name,w,h,z in [('plate100',100,50,20),('plate150',150,30,25)]:rows.extend([plate(d/(name+'-five-holes.mesh'),w,h,z),plate(d/(name+'-treated.mesh'),w,h,z,True)])
 rows.append(plate(d/'plate32.mesh',100,50,20,grid=True))
 for name,v,lo,hi,probes,euler in [('union-overlap',1500,[0,0,0],[15,10,10],[([2,5,5],True),([12,5,5],True),([17,5,5],False)],2),('common-overlap',500,[5,0,0],[10,10,10],[([7,5,5],True),([2,5,5],False)],2),('subtract-overlap',500,[0,0,0],[5,10,10],[([2,5,5],True),([7,5,5],False)],2),('union-face',2000,[0,0,0],[20,10,10],[([5,5,5],True),([15,5,5],True),([25,5,5],False)],2),('cavity',784,[0,0,0],[10,10,10],[([5,5,5],False),([1,5,5],True)],4)]:rows.append(planar(d/(name+'.mesh'),name,v,lo,hi,probes,euler))
 rows.append(base.check(d/'healthy-box.mesh','box'));expected={r.get('file') for r in rows if r.get('file')}|{n+'.mesh' for n in ['box','cylinder','annulus','healthy-box']};assert {p.name for p in d.glob('*.mesh')}==expected
 print(json.dumps({'status':'PASS','scope':'Independent actual binary source-analytic approximation/topology/material-void fixture checks; not universal error/intersection or shared3MF certification','meshes':len(rows),'points':sum(len(x['pointChecks']) for x in rows),'rows':rows},indent=2))
