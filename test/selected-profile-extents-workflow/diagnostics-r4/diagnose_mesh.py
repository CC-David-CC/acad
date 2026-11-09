#!/usr/bin/env python3
"""Offline diagnostic of already-produced own extent3MF artifacts; stdlib only.
No production imports, generation, welding, altered indices or acceptance claim.
"""
import argparse,collections,hashlib,json,math,struct,zipfile,xml.etree.ElementTree as ET
from pathlib import Path
INC=1e-6
DEFL=.01
NS={'m':'http://schemas.microsoft.com/3dmanufacturing/core/2015/02'}
sha=lambda raw:hashlib.sha256(raw).hexdigest()
def sub(a,b):return [x-y for x,y in zip(a,b)]
def cross(a,b):return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]
def det(a,b):return a[0]*b[1]-a[1]*b[0]
def area2(ps):return sum(det(a,b) for a,b in zip(ps,ps[1:]+ps[:1]))
def radial_min(ps,c):
 points=[(p[0]-c[0],p[1]-c[1]) for p in ps];signs=[det(a,b) for a,b in zip(points,points[1:]+points[:1])]
 if area2(points) and (all(v>=0 for v in signs) or all(v<=0 for v in signs)):return 0.
 values=[]
 for a,b in zip(points,points[1:]+points[:1]):
  v=sub(b,a);den=sum(x*x for x in v);t=max(0,min(1,-sum(x*y for x,y in zip(a,v))/den)) if den else 0;values.append(math.hypot(a[0]+t*v[0],a[1]+t*v[1]))
 return min(values)
def interval(e):
 if e['extent']=='one-sided':return sorted((0,e['distance']))
 if e['extent']=='symmetric':return [-e['length']/2,e['length']/2]
 if e['extent']=='two-sided':return [-e['negative'],e['positive']]
 raise ValueError('Unknown retained extent')
def floats(p):return [{'value':n,'hex':n.hex()} for n in p]
def classify(ps,e,lo,hi,cylinders):
 normal=cross(sub(ps[1],ps[0]),sub(ps[2],ps[0]));label=None
 if e['kind']=='rectangle':
  for axis,value,name,sign in ((0,0,'xmin',-1),(0,e['width'],'xmax',1),(1,0,'ymin',-1),(1,e['height'],'ymax',1)):
   if all(abs(p[axis]-value)<=INC for p in ps):return {'label':name,'orientation':normal[axis]*sign>0}
 for z,name,sign in ((lo,'bottom',-1),(hi,'top',1)):
  if all(abs(p[2]-z)<=INC for p in ps):return {'label':name,'orientation':normal[2]*sign>0}
 for c in cylinders:
  if c.get('blind') and all(abs(p[2]-c['low'])<=INC for p in ps):return {'label':'floor-'+c['id'],'orientation':normal[2]>0,'maximumRadius':max(math.hypot(p[0]-c['c'][0],p[1]-c['c'][1]) for p in ps)}
 candidates=[];old=[]
 for c in cylinders:
  radii=[math.hypot(p[0]-c['c'][0],p[1]-c['c'][1]) for p in ps];minimum=radial_min(ps,c['c']);support=all(c['low']-INC<=p[2]<=c['high']+INC for p in ps) and max(radii)<=c['r']+INC and minimum>=c['r']-DEFL-INC
  mid=[sum(p[k] for p in ps)/3 for k in range(3)];orientation=c['sign']*sum(normal[k]*(mid[k]-c['c'][k]) for k in (0,1));xy=sorted(set((p[0],p[1]) for p in ps))
  if support and orientation>0:
   row={'cylinder':c,'uniqueXY':len(xy),'xy':[list(p) for p in xy],'vertexRadiusResiduals':[r-c['r'] for r in radii],'triangleMinimumRadius':minimum,'maximumRadialDeflection':c['r']-minimum,'orientationDot':orientation,'z':[p[2] for p in ps]};candidates.append(row)
   if len(xy)==2:old.append(row)
 return {'label':'wall','orientation':all(c['orientationDot']>0 for c in candidates),'candidates':candidates,'oldCandidates':len(old),'normal':normal,'crossLength':math.hypot(*normal)}
def extract(file):
 raw=file.read_bytes()
 with zipfile.ZipFile(file) as archive:
  bad=archive.testzip()
  if bad is not None:raise ValueError('CRC failure '+bad)
  entry=archive.read('3D/3dmodel.model');root=ET.fromstring(entry)
 if root.attrib.get('unit')!='millimeter':raise ValueError('Unexpected actual units')
 objects={o.attrib['id']:o for o in root.findall('m:resources/m:object',NS)};leaves=[];seen=set()
 def visit(identity):
  if identity in seen:raise ValueError('Nonunique/cyclic printed object')
  seen.add(identity);obj=objects[identity];mesh=obj.find('m:mesh',NS)
  if mesh is not None:leaves.append((identity,mesh));return
  for child in obj.findall('m:components/m:component',NS):
   if 'transform' in child.attrib and list(map(float,child.attrib['transform'].split()))!=[1,0,0,0,1,0,0,0,1,0,0,0]:raise ValueError('Unsupported diagnostic component transform')
   visit(child.attrib['objectid'])
 items=root.findall('m:build/m:item',NS)
 if len(items)!=1:raise ValueError('Expected actual single build')
 item=items[0]
 if 'transform' in item.attrib and list(map(float,item.attrib['transform'].split()))!=[1,0,0,0,1,0,0,0,1,0,0,0]:raise ValueError('Unsupported diagnostic build transform')
 visit(item.attrib['objectid'])
 if len(leaves)!=1:raise ValueError('Expected actual one printed mesh')
 identity,mesh=leaves[0];vtext=[[n.attrib[k] for k in ('x','y','z')] for n in mesh.findall('m:vertices/m:vertex',NS)];vertices=[list(map(float,p)) for p in vtext];triangles=[[int(n.attrib[k]) for k in ('v1','v2','v3')] for n in mesh.findall('m:triangles/m:triangle',NS)]
 metadata={m.attrib.get('name'):m.text for m in root.findall('m:metadata',NS)}
 return {'sha256':sha(raw),'bytes':len(raw),'modelXMLSHA256':sha(entry),'meshObjectId':identity,'metadata':metadata},vertices,triangles,vtext

def run(whole,output):
 receipt_raw=(whole/'receipt.json').read_bytes();r=json.loads(receipt_raw)
 if r['status']!='PASS' or not r['ownedContextsRetired'] or r['sourcePins']!=r['sourcePinsAfter']:raise ValueError('Requires complete immutable wholePASS')
 report={'role':'diagnostic-only; NOT acceptance/qualification','receiptSHA256':sha(receipt_raw),'source':r['source'],'hostSource':r['hostSource'],'acceptance':r['acceptance'],'engineRevision':r['engineRevision'],'thresholdsCopiedForAttributionOnly':{'INC':INC,'DEFL':DEFL},'files':[],'firstOldStripFailure':None}
 for order,item in enumerate(r['artifacts']):
  if item['format']!='3mf':continue
  exported=[x for x in r['exportSets'] if x['case']==item['case'] and x['label']==item['label']]
  if len(exported)!=1:raise ValueError('Ambiguous actual captured export')
  state=exported[0]['before'];source_raw=state['capture']['native']['source'];source=json.loads(source_raw);frame=source['metadata']['boundaryFrame'];axes=[frame[k] for k in ('x','y','z')]
  if any(sum(x*x for x in a)!=1 or any(x not in(-1,0,1) for x in a) for a in axes):raise ValueError('Diagnostic requires exact retained axis permutation')
  meta,vertices,triangles,vtext=extract(whole/item['savedFile'])
  if meta['sha256']!=item['sha256'] or meta['bytes']!=item['bytes']:raise ValueError('Actual artifact differs from settled receipt')
  local=[[sum((p[j]-frame['origin'][j])*a[j] for j in range(3)) for a in axes] for p in vertices];e=item['expected'];lo,hi=interval(e);cylinders=[]
  if e['kind']!='rectangle':cylinders.append({'id':'outer','c':[0,0],'r':e['outer'],'low':lo,'high':hi,'sign':1})
  if e.get('inner'):cylinders.append({'id':'inner','c':[0,0],'r':e['inner'],'low':lo,'high':hi,'sign':-1})
  for i,h in enumerate(e.get('holes',[])):cylinders.append({'id':'hole'+str(i),'c':[h['u'],h['v']],'r':h['radius'],'low':lo if h['depth'] is None else hi-h['depth'],'high':hi,'sign':-1,'blind':h['depth'] is not None})
  rows=[];wallCounts=collections.Counter();labels=collections.Counter();edges=collections.defaultdict(list);invalid=[];volume=[]
  for i,t in enumerate(triangles):
   if len(set(t))!=3 or any(v<0 or v>=len(vertices) for v in t):invalid.append(i);continue
   ps=[local[j] for j in t];normal=cross(sub(ps[1],ps[0]),sub(ps[2],ps[0]));volume.append(sum(ps[0][k]*cross(ps[1],ps[2])[k] for k in range(3))/6)
   c=classify(ps,e,lo,hi,cylinders);labels[c['label']]+=1
   if c['label']=='wall':
    wallCounts[str((len(c['candidates']),c['oldCandidates'],tuple(x['uniqueXY'] for x in c['candidates'])))]+=1
    if c['oldCandidates']!=1:
     record={'triangleOrdinal0':i,'indices0':t,'world':[[*vertices[j]] for j in t],'worldXMLTokens':[vtext[j] for j in t],'local':ps,'localBinary64':[floats(p) for p in ps],'classification':c}
     # Exact closest represented-XY pair: diagnostic only, never a weld.
     pairs=[]
     for a in range(3):
      for b in range(a):pairs.append({'positions':[b,a],'indices':[t[b],t[a]],'distanceXY':math.dist(ps[b][:2],ps[a][:2]),'deltaXY':[ps[a][k]-ps[b][k] for k in (0,1)],'deltaZ':ps[a][2]-ps[b][2]})
     record['pairsByXYDistance']=sorted(pairs,key=lambda p:p['distanceXY']);rows.append(record)
     if report['firstOldStripFailure'] is None:report['firstOldStripFailure']={'file':item['savedFile'],'artifactOrder0':order,'triangleOrdinal0':i,'indices0':t}
   for j in range(3):a,b=t[j],t[(j+1)%3];edges[tuple(sorted((a,b)))].append((i,a,b))
  edgeBad=[{'edge0':list(k),'uses':v} for k,v in edges.items() if len(v)!=2 or v[0][1:]!=v[1][1:][::-1]]
  report['files'].append({'file':item['savedFile'],'artifactOrder0':order,'case':item['case'],'label':item['label'],'artifact':meta,'sourceRawSHA256':sha(source_raw.encode()),'frame':frame,'expected':e,'interval':[lo,hi],'cylinders':cylinders,'vertices':len(vertices),'triangles':len(triangles),'invalidIndexTriangles':invalid,'indexedEdges':len(edges),'badIndexedOppositeEdges':edgeBad[:16],'badIndexedOppositeEdgeCount':len(edgeBad),'euler':len(vertices)-len(edges)+len(triangles),'signedVolumeDiagnostic':math.fsum(volume),'triangleLabels':dict(labels),'wallCandidateCensus':dict(wallCounts),'oldStripFailureCount':len(rows),'oldStripFailures':rows[:12]})
 report['diagnosticScriptSHA256']=sha(Path(__file__).read_bytes())
 with output.open('x') as stream:json.dump(report,stream,indent=2);stream.write('\n')
 print(json.dumps({'output':str(output),'receiptSHA256':report['receiptSHA256'],'firstOldStripFailure':report['firstOldStripFailure'],'files':[{'file':x['file'],'triangles':x['triangles'],'oldStripFailureCount':x['oldStripFailureCount'],'wallCandidateCensus':x['wallCandidateCensus'],'badIndexedOppositeEdgeCount':x['badIndexedOppositeEdgeCount']} for x in report['files']]},indent=2))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('whole',type=Path);p.add_argument('output',type=Path);args=p.parse_args();run(args.whole,args.output)
