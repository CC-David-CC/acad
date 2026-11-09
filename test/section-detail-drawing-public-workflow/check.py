#!/usr/bin/env python3
"""AFTER-WHOLE only: source equations, Native set/projection, cap boundaries,
analytic detail intervals, SVG physical scale and independent .cad CRC/SHA.
No production CAD or Native provider imported as an expectation generator.
"""
import json,math,struct,hashlib,sys,importlib.util,xml.etree.ElementTree as ET
from pathlib import Path
from collections import Counter
from oracle_geometry import finite_cap
from oracle_svg import physical_facts,verify_svg
from oracle_lifecycle import lifecycle
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'native-cad-container'))
from archive_oracle import read_archive
spec=importlib.util.spec_from_file_location('retained_bore_oracle',ROOT/'four-bore-drawing-public-workflow'/'check.py');bore=importlib.util.module_from_spec(spec);spec.loader.exec_module(bore)
iso=bore.iso;need,near,vector,one=iso.need,iso.near,iso.vector,iso.one
sha=lambda raw:hashlib.sha256(raw).hexdigest();NS=iso.NS

def raw(value):
 data=bytes(value['bytes']);need(len(data)==value['byteLength'] and sha(data)==value['sha256'],'actual transferred bytes/hash');return data

def section(view,e,mode):
 m=view['metadata'];need(set(m)=={'version','quality','frame','patchLengths','edgeCount','boundaryCount','area','valueBytes','tagBytes'} and m['quality']=='native-boolean-cap-set' and m['version']==1,'cap-set identity, never HLR');x,y=e['origin'];w,d,r=e['width'],e['depth'],e['centerDiameter']/2
 vector(m['frame'][:3],[x+w/2,y+e['height']/2,0]);vector(m['frame'][3:],[1,0,0,0,0,1,0,-1,0],1e-12);values,tags=raw(view['values']),raw(view['tags']);need(len(values)==m['valueBytes']==m['edgeCount']*96<=49152 and len(tags)==m['tagBytes']==m['edgeCount']*4<=2048 and 1<=len(m['patchLengths'])<=16 and all(type(n) is int and n>=3 for n in m['patchLengths']) and sum(m['patchLengths'])==m['edgeCount'],'bounded actual cap packet');at=0;area=0;boundaries=[];patches=[];flags=[]
 for p,count in enumerate(m['patchLengths']):
  need(count>=3,'actual simple cap wire');edges=[];total=0;patch_flags=[]
  for j in range(count):
   numbers=struct.unpack_from('<12d',values,at*96);t=list(tags[at*4:at*4+4]);at+=1;need(all(math.isfinite(n) and abs(n)<=4e6 for n in numbers) and numbers[4:]==(0,)*8 and t[0]==p and t[1] in(0,1) and t[2:]==[0,0],'actual section scalar/tag domain');a,z=list(numbers[:2]),list(numbers[2:4]);need(a!=z,'positive actual cap edge');
   if edges:need(edges[-1][1]==a,'exact Native connected edge observations')
   edges.append((a,z));patch_flags.append(t[1]);total+=a[0]*z[1]-a[1]*z[0]
   if t[1]:boundaries.append((a,z))
  need(edges[-1][1]==edges[0][0] and total!=0,'closed positive-area actual cap patch');area+=abs(total)/2;patches.append(edges);flags.append(patch_flags)
 near(area,m['area']);near(area,(w-2*r)*d+(2*w if mode=='cover' else 0),1e-6);need(len(boundaries)==m['boundaryCount'],'complete actual boundary-tag census, independently reconciled geometrically below')
 if mode=='cover':corners=[[-w/2,0],[-r,0],[-r,d],[r,d],[r,0],[w/2,0],[w/2,d+2],[-w/2,d+2]];expected=list(zip(corners,corners[1:]+corners[:1]))
 else:
  expected=[]
  for a,z in[(-w/2,-r),(r,w/2)]:
   corners=[[a,0],[z,0],[z,d],[a,d]];expected+=list(zip(corners,corners[1:]+corners[:1]))

 rectangles=[(-w/2,-r,0,d),(r,w/2,0,d)]+([(-w/2,w/2,d,d+2)] if mode=='cover' else [])
 finite_cap(patches,flags,expected,rectangles,m['area'])
 return patches,boundaries

def clipping(c,low,high):
 first,last=c['range'];events=[first,last]
 if c['line']:
  for j in(0,1):
   a,v=c['c'][j],c['a'][j]
   if v==0:
    if not low[j]<=a<=high[j]:return[]
   else:
    roots=sorted([(low[j]-a)/v,(high[j]-a)/v]);first=max(first,roots[0]);last=min(last,roots[1])
  return[(first,last)] if last>first else[]
 for j in(0,1):
  radius=math.hypot(c['a'][j],c['b'][j]);phase=math.atan2(c['b'][j],c['a'][j])
  if radius==0:
   if not low[j]<=c['c'][j]<=high[j]:return[]
   continue
  for bound in(low[j],high[j]):
   v=(bound-c['c'][j])/radius
   if not -1<v<1:continue
   alpha=math.acos(v)
   for base in(phase-alpha,phase+alpha):
    for k in range(math.floor((first-base)/(2*math.pi))-1,math.ceil((last-base)/(2*math.pi))+2):
     t=base+k*2*math.pi
     if first<t<last:events.append(t)
 events=sorted(events);need(all(a<z for a,z in zip(events,events[1:])), 'finite clear-root aperture events must remain distinct; no rounded-event dedup');return[(a,z) for a,z in zip(events,events[1:]) if all(low[j]-1e-12<=iso.evaluate(c,(a+z)/2)[j]<=high[j]+1e-12 for j in(0,1))]

def detail(view,parent,definition,e,frames):
 v=one([v for v in definition['views'] if v['basis']=='detail'],'detail');m=view['metadata'];need(m['quality']=='parent-analytic-trim-intervals' and m['parentViewId']==v['parentViewId'] and m['scale']=={'numerator':2,'denominator':1} and m['aperture']==v['aperture'],'actual derived intervals and absolute scale');parent_frame=frames[v['parentViewId']]['frame'];pf=[*parent_frame['origin'],*parent_frame['u'],*parent_frame['v'],*parent_frame['n']];curves=iso.record_curves(parent,pf);focus=bore.centers(e)[1];vector(m['frame'],[*focus,0,1,0,0,0,1,0,0,0,1]);vector(m['offset'],focus);need(m['parentFragmentCount']==len(curves),'authentic parent fragment index set')
 hw,hh=v['aperture']['halfWidth'],v['aperture']['halfHeight'];low=[focus[0]-hw,focus[1]-hh];high=[focus[0]+hw,focus[1]+hh];expected=[(i,a,z) for i,c in enumerate(curves) for a,z in clipping(c,low,high)]
 data=raw(view['intervals']);need(len(data)==m['intervalCount']*24<=98304 and m['intervalBytes']==len(data) and len(expected)==m['intervalCount'],'complete finite analytic clipping, no count-only result');result=[]
 for i,(expected_index,a,z) in enumerate(expected):
  index,t0,t1=struct.unpack_from('<3d',data,i*24);need(index==expected_index,'parent fragment identity');near(t0,a,1e-12);near(t1,z,1e-12);need(t1>t0,'positive retained trim');c=curves[int(index)]
  for t in(t0,(t0+t1)/2,t1):
   p=iso.evaluate(c,t);need(all(low[j]-1e-6<=p[j]<=high[j]+1e-6 for j in(0,1)),'all actual detail trims stay inside aperture')
  result.append((c,t0,t1))
 radius=e['cornerDiameter']/2
 for k in range(64):
  p=[focus[0]+radius*math.cos(k*math.pi/32),focus[1]+radius*math.sin(k*math.pi/32)]
  if all(low[j]+1e-6<p[j]<high[j]-1e-6 for j in(0,1)):need(any(bore.on_curve(p,{**c,'range':[a,z]}) for c,a,z in result),'full retained physical corner rim coverage')
 if hw==1.5:
  need(radius==2,'frozen partial fixture radius');ys=[math.sqrt(1.75),-math.sqrt(1.75)]
  ends=[iso.evaluate(c,t) for c,a,z in result if not c['line'] for t in(a,z)]
  for x in(-1.5,1.5):
   for y in ys:need(any(math.dist(p,[focus[0]+x,focus[1]+y])<=1e-6 for p in ends),'actual ±1.5 / ±sqrt1.75 trim endpoints')
 return result,curves

def observation(row):
 s,b,e,d=row['before'],row['binding'],row['dimensions'],row['definition'];iso.settled(s);need(row['after']==s,'strict readonly H/source/IDs/J/tokens/material/presentation/resources');objects,corner=bore.source(s,b,e,row['inspection']);need(corner==row['filletCorner'],'actual immutable selected corner');hist=s['capture']['native']['history'];plane=hist[0]['params']['featureId'];need(type(plane) is str and plane.isdecimal() and str(int(plane))==plane and int(plane)==b['rectangle']['featureId'],'exact persisted PLANE string/public safe integer dialect');need(s['capture']['native']['counters']['featureId']>=max([int(plane),*[x['params']['featureId'] for x in hist[1:]]]),'actual high-water')
 body=one(s['capture']['solids']['bodies'],'actual whole solid');need(body['id']==row['parent']['outputId'] and body['featureId']==row['parent']['featureId'],'actual producer');m=body['metrics'];need(m['nativeValidity']['valid'] and m['solidCount']==1 and m['resultKind']=='single-solid','actual Native positive valid single result');need('sha256:'+m['runtime']['jsSha256']+':'+m['runtime']['wasmSha256']==bore.BUILD,'exact Shell pair, never MFG alias');near(m['nativeVolume'],bore.volume(e,row['mode']));x,y=e['origin'];vector(m['nativeBounds']['min'],[x,y,0]);vector(m['nativeBounds']['max'],[x+e['width'],y+e['height'],e['depth']+(2 if row['mode']=='cover' else 0)])
 need(len(hist)==(7 if row['mode']=='cover' else 5),'exact finite authored source/feature roster')
 if row['mode']=='cover':
  tool,op=[x['params'] for x in hist[5:]];need([tool[k] for k in('x','y','z')]==[x,y,e['depth']] and [tool[k] for k in('width','depth','height')]==[e['width'],e['height'],2] and op['kind']=='union' and op['a']==b['last']['outputId'] and op['b']==row['tool']['outputId'] and tool['featureId']==row['tool']['featureId'] and op['featureId']==row['parent']['featureId'],'real box and Boolean roof, not a drawing surrogate')
 q=row['pointReply'];need(all(q[k]==row['pointRequest'][k] for k in('version','unit','revision','engine','engineRevision','bodyId','featureId')) and q['revision']==s['capture']['solids']['revision'] and len(q['points'])==21,'actual point request/native binding');need(q['quality']=='native-re-evaluation-observation' and q['points']==[{'point':p,'classification':bore.classify(p,e,corner,row['mode'])} for p in row['pointRequest']['points']],'independent material/void/cap Native classes');read=row['read'];need(read['revision']==s['host']['revision'] and read['geometryRevision']==s['capture']['solids']['revision'],'actual readonly tokens')
 if row['consumed']:need(read['target'] is None and not read['views'],'consumed target never follows a later producer');return{}
 need([v['viewId'] for v in read['views']]==[v['viewId'] for v in d['views']] and [v['viewId'] for v in read['observation']['viewFrames']]==[v['viewId'] for v in d['views']] and len(read['observation']['dimensions'])==len(d['dimensions']),'complete ordered role/dimension membership');physical_facts(row,objects,bore,iso);frames={f['viewId']:f for f in read['observation']['viewFrames']};views={v['viewId']:v for v in read['views']};result={}
 for v in d['views']:
  view=views[v['viewId']]
  if view['status']!='available':need(row['unresolved'] and v['basis'] in('detail','bore-center-section') and view['reason']=='DRAWING_HOLE_WITNESS_UNAVAILABLE','explicit genuine unresolved bore reference');continue
  if v['basis']=='bore-center-section':result['section']=section(view,e,row['mode']);continue
  if v['basis']=='detail':result['detail']=detail(view,views[v['parentViewId']],d,e,frames);continue
  f=frames[v['viewId']]['frame'];u,vv,n=iso.FRAMES[v['basis']];vector([*f['u'],*f['v'],*f['n']],[*u,*vv,*n],1e-12);vector(f['origin'],[0,0,0]);curves=iso.record_curves(view,[*f['origin'],*f['u'],*f['v'],*f['n']]);support=bore.supports(e,corner,row['mode'],u,vv)
  for c in curves:
   for i in range(17):need(any(bore.on_curve(iso.evaluate(c,c['range'][0]+(c['range'][1]-c['range'][0])*i/16),expected) for expected in support),'every Native line/conic lies on actual analytic source/body supports')
  result[v['basis']]=curves
 for dim,fact in zip(d['dimensions'],read['observation']['dimensions']):
  if fact['status']=='unresolved':need(row['unresolved'] and fact['value'] is None and not fact['anchors'],'unresolved is not a cached measurement');continue
  expected={'width':e['width'],'height':e['height'],'depth':e['depth'],'center-diameter':e['centerDiameter'],'section-depth':e['depth'],'detail-diameter':e['cornerDiameter']}[dim['dimensionId']];near(fact['value'],expected);need(len(fact['anchors'])==2,'actual physical anchors')
 return result

def svg(root,item,observations):
 matches=[r for r in observations if r['case']==item['case'] and r['definition']==item['definition'] and r['before']['host']['revision']==item['before']['host']['revision'] and r['before']['capture']==item['before']['capture']]
 row=one(matches[-1:],'actual source/J/doc-bound current Native read for SVG');return verify_svg(root,item,row,observation(row),iso,bore)

def main(root):
 p=json.loads((root/'receipt.json').read_text());need(p['status']=='PASS' and p['sourcePins']==p['sourcePinsAfter'] and p['ownedContextsRetired'] and not p['sourceSeeds'] and not p['privateAuthoring'] and not p['fakeReplies'],'whole terminal/source/owned cleanup');need([c['name'] for c in p['cases']]==['original','translated-negative'] and all(c['status']=='PASS' for c in p['cases']),'both genuine datum families');lifecycle(root,p,need,iso.settled);[observation(row) for row in p['observations']]
 need(len(p['replacements'])==len(p['detailTravels'])==len(p['scaleTravels'])==len(p['repairs'])==len(p['negatives'])==2 and len(p['saves'])==8 and len(p['reopens'])==6 and len(p['quotas'])==2,'complete finite lifecycle')
 for x in p['replacements']:need(x['undone']['drawing']['definition']==x['baseDefinition'] and x['redone']['drawing']['definition']==x['definition'] and x['undone']['capture']['native']==x['baseState']['capture']['native']==x['redone']['capture']['native'],'same metadata replacement Undo/Redo, no Native edit')
 for x in p['detailTravels']:need(x['unclip']['drawing']['definition']==x['full'] and x['reclip']['drawing']['definition']==x['partial'] and x['clipped']['capture']['native']==x['unclip']['capture']['native']==x['reclip']['capture']['native'],'actual linked detail crop travel')
 for x in p['scaleTravels']:need(x['half']['sheet']['scale']=={'numerator':1,'denominator':2} and x['scaleUndo']['drawing']['definition']==x['full'] and x['scaleRedo']['drawing']['definition']==x['half'] and x['halfState']['capture']['native']==x['scaleUndo']['capture']['native']==x['scaleRedo']['capture']['native'],'absolute2:1 detail independent from parent paper scale travel')
 for x in p['repairs']:
  need(x['undone']['drawing']['definition']==x['wrong'] and x['redone']['drawing']['definition']==x['definition'],'exact unresolved/reference repair Undo/Redo')
  for state in (x['repaired'],x['undone'],x['redone']):
   need(state['capture']['native']==x['beforeRepair']['capture']['native'] and state['capture']['solids']['bodies']==x['beforeRepair']['capture']['solids']['bodies'] and state['capture']['solids']['outputs']==x['beforeRepair']['capture']['solids']['outputs'] and state['manufacturing']==x['beforeRepair']['manufacturing'] and state['ownership']==x['beforeRepair']['ownership'] and state['lifecycle']==x['beforeRepair']['lifecycle'],'reference repair travel is metadata-only, exact source/geometry/material/highwater/resources')
 for x in p['noops']:need(x['noop']['changed'] is False and x['before']==x['after'],'exact metadata no-op')
 for x in p['quotas']:need(x['level'] in(31,32) and x['before']==x['after'] and x['budget']['plannedNativeResults']==x['level'] and x['budget']['withinLimit'] and one([v for v in x['read']['views'] if v['viewId']=='section'],'quota section')['reason']=='RESOURCE_LIMIT' and all(v['status']=='available' for v in x['read']['views'] if v['viewId']!='section'),'two scratch names remain inside32, old views/detail stay readable')

 archives=[]
 for x in p['saves']:
  arc=read_archive(root/x['savedFile']);need(arc['sha256']==x['sha256'] and arc['bytes']==x['byteLength'],'independent archive CRC/SHA/designRevision');env=arc['envelope'];n=x['before']['capture']['native'];need(env['version']==3 and env['unit']=='millimeter' and env.get('presentation')==n['presentation'] and env.get('manufacturing')==x['before']['manufacturing'] and env['drawings']==[x['definition']] and env['project']['model']['history']==n['history'] and env['project']['model']['counters']==n['counters'] and env['project']['model']['expressions']==n['expressions'],'one complete Native document including six-role definition');need({r['id']:r['data'] for r in env['project']['sketches']}=={r['id']:json.loads(r['source']) for r in n['sketches']},'exact original source/constraints retained');need(x['before']['capture']==x['after']['capture'] and x['before']['drawing']==x['after']['drawing'],'Save retains exact accepted drawing/source/J/counters');archives.append({'file':x['savedFile'],'sha256':arc['sha256'],'designRevision':arc['manifest']['designRevision']})
 for x in p['reopens']:
  need(x['before']['drawing']['definition']==x['opened']['drawing']['definition'] and not x['opened']['capture']['journal']['canUndo'] and not x['opened']['capture']['journal']['canRedo'],'fresh signed Open definition/custody')
  for k in('history','source','sketches','expressions','counters','presentation'):need(x['before']['capture']['native'][k]==x['opened']['capture']['native'][k],'exact fresh Open '+k)
 svgs=[svg(root,x,p['observations']) for x in p['svgs']];result={'status':'PASS','scope':p['scope'],'observations':len(p['observations']),'nativeClasses':sum(len(x['pointReply']['points']) for x in p['observations']),'archives':archives,'svgs':svgs,'capGeometricReconciliation':True,'capNativeIdentityIndependent':False,'independent':'saved source equations/finite nonoverlapping material cap union/geometric boundary cancellation/parent trim intersections/every conic chord bound/physical dimensions and full SVG/ZIP CRC SHA/exact source Git roster and lifecycle; no production CAD helpers'};print(json.dumps(result,indent=2));return result
if __name__=='__main__':main(Path(sys.argv[1]))
