"""Independent analytic comparisons of the separate SAME-OCCT STEP observations.
No app/production geometry parser or guessed source/cap IDs. The actual SDK
reader is same-kernel evidence; the comparisons/expected material are separate.
"""
import math
from collections import defaultdict

def need(v,m):
 if not v:raise ValueError(m)
def near(x,y,t=1e-6):need(math.isfinite(x) and abs(x-y)<=t,f'actual artifact {x} differs from analytic {y}, budget {t}')
def inspect_step(observation,e,frame,lo,hi,volume,bounds,points,classes):
 o=observation;need(o['reader']=='same-OCCT-separate-build' and o['unit']=='millimeter' and o['valid'] and o['solidCount']==1 and o['shells']==1,'actual independently read single closed-solid STEP');near(o['volume'],volume,max(1e-6,abs(volume)*1e-9));need(len(o['bounds'])==6,'actual complete bounds')
 for x,y in zip(o['bounds'],bounds['min']+bounds['max']):near(x,y)
 need([p['point'] for p in o['points']]==points and [p['classification'] for p in o['points']]==classes,'actual exported material/void/boundary probes match independent analytic cells')
 axes=[frame[k] for k in ('x','y','z')]
 def local(p):return [sum((p[i]-frame['origin'][i])*axis[i] for i in range(3)) for axis in axes]
 def vector(p):return [sum(p[i]*axis[i] for i in range(3)) for axis in axes]
 cylinders=[]
 if e['kind']!='rectangle':cylinders.append({'id':'outer','c':(0,0),'radius':e['outer'],'depth':hi-lo,'sign':1})
 if e.get('inner'):cylinders.append({'id':'inner','c':(0,0),'radius':e['inner'],'depth':hi-lo,'sign':-1})
 for i,h in enumerate(e.get('holes',[])):cylinders.append({'id':'hole'+str(i),'c':(h['u'],h['v']),'radius':h['radius'],'depth':hi-lo if h['depth'] is None else h['depth'],'sign':-1,'floor':None if h['depth'] is None else hi-h['depth']})
 planar=defaultdict(float);curved=defaultdict(float)
 for face in o['faces']:
  need(face['area']>0 and math.isfinite(face['area']),'actual positive face measure')
  if face['kind']=='plane':
   p=local(face['origin']);n=[v*(-1 if face['orientation']=='REVERSED' else 1) for v in vector(face['normal'])];candidates=[]
   for axis,level,label,sign in [(2,lo,'bottom',-1),(2,hi,'top',1)]+([(0,0,'xmin',-1),(0,e['width'],'xmax',1),(1,0,'ymin',-1),(1,e['height'],'ymax',1)] if e['kind']=='rectangle' else [])+[(2,c['floor'],'floor-'+c['id'],1) for c in cylinders if c.get('floor') is not None]:
    if abs(p[axis]-level)<=1e-6 and abs(n[axis]-sign)<=1e-9 and all(abs(n[k])<=1e-9 for k in range(3) if k!=axis):candidates.append(label)
   need(len(candidates)==1,'actual plane support and outward direction is one expected patch');planar[candidates[0]]+=face['area']
  else:
   need(face['kind']=='cylinder','only declared finite surfaces');p=local(face['origin']);d=vector(face['axis']);need(abs(abs(d[2])-1)<=1e-9 and abs(d[0])<=1e-9 and abs(d[1])<=1e-9,'actual cylinder follows original source normal');cs=[c for c in cylinders if abs(c['radius']-face['radius'])<=1e-6 and math.dist(c['c'],p[:2])<=1e-6 and c['sign']==face['outwardRadialSign']];need(len(cs)==1,'actual cylinder support/radius/outward side matches exactly one authored patch');need(0<face['uRange'][1]-face['uRange'][0]<=2*math.pi+1e-9 and face['vRange'][1]>face['vRange'][0],'actual bounded noncollapsed surface parameter interval');curved[cs[0]['id']]+=face['area']
 area=e['width']*e['height'] if e['kind']=='rectangle' else math.pi*e['outer']**2;top=area-sum(math.pi*c['radius']**2 for c in cylinders if c['sign']==-1);bottom=area-sum(math.pi*c['radius']**2 for c in cylinders if c['sign']==-1 and c.get('floor') is None);expected={'top':top,'bottom':bottom}
 if e['kind']=='rectangle':expected.update(xmin=e['height']*(hi-lo),xmax=e['height']*(hi-lo),ymin=e['width']*(hi-lo),ymax=e['width']*(hi-lo))
 expected.update({'floor-'+c['id']:math.pi*c['radius']**2 for c in cylinders if c.get('floor') is not None});need(set(planar)==set(expected) and set(curved)=={c['id'] for c in cylinders},'complete actual surface roster, not volume alone')
 for label,value in expected.items():near(planar[label],value,max(1e-6,abs(value)*1e-9))
 for c in cylinders:near(curved[c['id']],2*math.pi*c['radius']*c['depth'],max(1e-6,2*math.pi*c['radius']*c['depth']*1e-9))
 return {'quality':'same-OCCT-readback/independent-analytic-surface-material-audit','faces':len(o['faces']),'planarAreas':dict(planar),'cylindricalAreas':dict(curved),'points':len(points),'boundsMmBudget':1e-6}
