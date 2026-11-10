"""Complete original-index finite analytic-prism artifact proof.
No producer math imports, welding, repair, fitted reference or strip heuristic.
CGAL exact 3D validity and exact projected triangle-set coverage are mandatory.
Half-cylinder coverage uses an injective linear chart on the declared half,
strict triangle Jacobians and whole-triangle radial extrema. This proves the
declared .01mm artifact budget, not 50pm kernel/material accuracy.
"""
import collections,hashlib,json,math,os,resource,selectors,signal,struct,subprocess,time
from fractions import Fraction as Q
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'library-validation'))
from cylindrical_surface_certificate import certify_full_cylinder,squared_radius_range,radial_error_squared_within
from planar_coverage import invoke_planar_coverage
from truth import need,one,facts,profile_patches,frame,INC,DEFL
sha=lambda x:hashlib.sha256(x).hexdigest()
def sub(a,b):return tuple(x-y for x,y in zip(a,b))
def cross(a,b):return(a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0])
def thaw(v):
 if hasattr(v,'items'):return{k:thaw(x)for k,x in v.items()}
 if type(v)in(list,tuple):return[thaw(x)for x in v]
 return v
def boundary(ids,triangles):
 edges=collections.defaultdict(list)
 for i in ids:
  t=triangles[i]
  for a,b in zip(t,t[1:]+t[:1]):edges[tuple(sorted((a,b)))].append((a,b))
 rows=[v[0]for v in edges.values()if len(v)==1];need(rows and all(len(v)<=2 for v in edges.values()),'complete patch boundary incidence')
 nxt={};incoming=collections.Counter()
 for a,b in rows:need(a not in nxt,'unbranched original indexed patch boundary');nxt[a]=b;incoming[b]+=1
 need(set(nxt)==set(incoming) and all(v==1 for v in incoming.values()),'actual indexed patch cycles')
 loops=[];remaining=set(nxt)
 while remaining:
  start=min(remaining);loop=[];p=start
  while p in remaining:remaining.remove(p);loop.append(p);p=nxt[p]
  need(p==start and len(loop)>=3,'closed original indexed loop');loops.append(loop)
 return loops
def global_cgal(vertices,triangles,config,directory):
 need(type(config)is dict and set(config)=={'executable','expected_executable_sha256','cpp_source','build_source'},'closed reviewed global CGAL config');exe=Path(config['executable']);cpp=Path(config['cpp_source']);s=config['build_source'];need(set(s)=={'commit','cppRelativePath','cppSha256','cgalVersion'} and s['cppRelativePath']=='test/library-validation/cgal/mesh_readonly.cpp' and s['cgalVersion']=='5.6','reviewed original 3D adapter anchors');need(len(s['commit'])==40 and all(c in '0123456789abcdef'for c in s['commit']),'actual compiled source commit');need(exe.is_absolute()and cpp.is_absolute()and exe.is_file()and cpp.is_file(),'actual reviewed executable/source paths');before={'executable':sha(exe.read_bytes()),'cpp':sha(cpp.read_bytes())};need(before=={'executable':config['expected_executable_sha256'],'cpp':s['cppSha256']},'actual executable/CPP anchors')
 repo=os.environ.get('CODI_ORACLE_CORE_GIT',str(Path(__file__).resolve().parents[2]));g=subprocess.run(['git','-C',repo,'show',s['commit']+':'+s['cppRelativePath']],capture_output=True,check=True);need(g.stdout==cpp.read_bytes(),'compiled CPP exact Git object')
 lines=[f'{len(vertices)} {len(triangles)}\n']
 for p in vertices:lines.append(' '.join(struct.pack('>d',x).hex()for x in p)+'\n')
 for t in triangles:lines.append(' '.join(map(str,t))+'\n')
 raw=''.join(lines).encode('ascii');need(len(raw)<=16777216,'original exact-bit text budget');directory=Path(directory);directory.mkdir(parents=False,exist_ok=False);(directory/'stdin.txt').write_bytes(raw)
 def limits():resource.setrlimit(resource.RLIMIT_AS,(1<<30,1<<30));resource.setrlimit(resource.RLIMIT_CPU,(120,120));resource.setrlimit(resource.RLIMIT_CORE,(0,0))
 # Nonblocking pipes enforce the output cap while the child runs; no unlimited
 # communicate buffer. The native child receives no arguments or file writes.
 with (directory/'stdin.txt').open('rb')as inp:
  p=subprocess.Popen([str(exe)],stdin=inp,stdout=subprocess.PIPE,stderr=subprocess.PIPE,preexec_fn=limits,start_new_session=True);sel=selectors.DefaultSelector();streams={};deadline=time.monotonic()+120;failure=None
  for key,stream in [('stdout',p.stdout),('stderr',p.stderr)]:os.set_blocking(stream.fileno(),False);sel.register(stream,selectors.EVENT_READ,key);streams[key]=bytearray()
  try:
   while sel.get_map():
    if time.monotonic()>deadline:failure='WALL_TIMEOUT';break
    for event,_ in sel.select(min(.1,max(0,deadline-time.monotonic()))):
     data=os.read(event.fileobj.fileno(),4096)
     if not data:sel.unregister(event.fileobj);continue
     streams[event.data]+=data
     if sum(map(len,streams.values()))>65536:failure='OUTPUT_LIMIT';break
    if failure:break
  finally:
   if failure and p.poll()is None:os.killpg(p.pid,signal.SIGKILL)
   try:code=p.wait(timeout=max(.1,deadline-time.monotonic()))
   except subprocess.TimeoutExpired:os.killpg(p.pid,signal.SIGKILL);code=p.wait();failure=failure or'WALL_TIMEOUT'
   sel.close()
   for stream in (p.stdout,p.stderr):stream.close()
 for k,v in streams.items():(directory/(k+'.txt')).write_bytes(bytes(v[:65536]))
 after={'executable':sha(exe.read_bytes()),'cpp':sha(cpp.read_bytes())};custody={'before':before,'after':after,'stdinSha256':sha(raw),'exitCode':code,'failure':failure,'budgets':{'virtualAddressBytes':1<<30,'cpuSeconds':120,'wallSeconds':120,'combinedOutputBytes':65536,'note':'virtual address limit is not measured RSS'}};(directory/'custody.json').write_text(json.dumps(custody,indent=2)+'\n');need(before==after,'actual adapter/source unchanged');need(failure is None and code==0 and not streams['stderr'],'actual global CGAL completed PASS process and no unexpected stderr')
 
 def pairs(rows):
  result={}
  for key,value in rows:need(key not in result,'unique actual report keys');result[key]=value
  return result
 report=json.loads(streams['stdout'],object_pairs_hook=pairs,parse_constant=lambda _:(_ for _ in ()).throw(ValueError('nonfinite CGAL report')));need(set(report)=={'version','adapter','scope','cgalVersion','status','reason','input','limits','degenerateFaces','insertionFailures','graph','selfIntersections','volumeBoundary','sourceIntent','deviationCertificate'},'closed actual CGAL report');need(report['version']==1 and report['adapter']=='codi-cgal-raw-mesh-v1' and report['status']=='PASS'and report['cgalVersion'].startswith('5.6'),'actual complete CGAL status/version');need(report['scope']=='geometric-validity-only'and report['reason']=='GEOMETRIC_CHECKS_COMPLETED'and report['sourceIntent']==report['deviationCertificate']=='NOT_RUN','actual scoped report, not invented source certificate');need(report['limits']=={'vertices':150000,'triangles':100000,'binaryBytes':8388608,'textBytes':16777216,'lineBytes':80,'detailsPerList':128,'outputBytes':65536},'actual unchanged adapter resource contract');need(report['input']=={'vertices':len(vertices),'triangles':len(triangles),'complete':True,'errorLine':None},'all original indices/counts');need(report['degenerateFaces']=={'count':0,'scanComplete':True,'complete':True,'ids':[]}and report['insertionFailures']=={'count':0,'scanComplete':True,'complete':True,'rows':[]},'complete face scans');q=report['graph'];need(set(q)=={'status','valid','triangular','closed','componentCount','componentDetailsComplete','components'},'closed actual graph report');need(q['status']=='PASS'and q['valid']is True and q['triangular']is True and q['closed']is True and q['componentCount']==1 and q['componentDetailsComplete']is True and q['components']==[{'firstFaceId':0,'faceCount':len(triangles)}],'complete connected closed original graph');need(report['selfIntersections']=={'status':'PASS','complete':True,'countAtLeast':0,'originalFacePairs':[]}and report['volumeBoundary']=={'status':'PASS','doesBoundAVolume':True},'complete exact intersection and volume boundary');return{'custody':custody,'report':report}
def inspect_mesh(vertices,triangles,e,config,directory):
 need(type(vertices)is list and type(triangles)is list and 0<len(vertices)<=150000 and 0<len(triangles)<=100000 and 32+24*len(vertices)+12*len(triangles)<=8388608,'original decoded mesh budgets');need(all(type(p)is list and len(p)==3 and all(type(x)is float and math.isfinite(x)for x in p)for p in vertices),'actual finite F64 vertices');need(all(type(t)is list and len(t)==3 and len(set(t))==3 and all(type(i)is int and 0<=i<len(vertices)for i in t)for t in triangles),'all original actual indices');need(len({tuple(t)for t in triangles})==len(triangles),'no duplicated original triangle');need(set(i for t in triangles for i in t)==set(range(len(vertices))),'no missing/orphan original vertex');need(set(config)=={'global','planar'},'reviewed exact validator configurations');directory=Path(directory);directory.mkdir(parents=False,exist_ok=False);global_report=global_cgal(vertices,triangles,config['global'],directory/'global')
 f=frame(e);o=list(map(Q,f['origin']));local=[tuple(Q(p[k])-o[k]for k in range(3))for p in vertices];T=Q(e['depth']);planes,cylinders=profile_patches(e);groups=collections.defaultdict(list);edge=collections.defaultdict(list);normals={};volumes=[]
 for i,t in enumerate(triangles):
  ps=[local[j]for j in t];n=cross(sub(ps[1],ps[0]),sub(ps[2],ps[0]));need(any(n),'nondegenerate exact triangle');normals[i]=n;need(all(-INC<=p[2]<=T+INC for p in ps),'all vertices in original finite axial domain');candidates=[]
  for z,key,sgn in [(Q(0),'bottom',-1),(T,'top',1)]:
   if all(abs(p[2]-z)<=INC for p in ps)and n[2]*sgn>0:candidates.append(key)
  for p in planes:
   a,b=tuple(map(Q,p['a'])),tuple(map(Q,p['b']));d=sub(b,a);l2=sum(x*x for x in d);outer=(d[1],-d[0],Q(0));
   if all((d[0]*(v[1]-a[1])-d[1]*(v[0]-a[0]))**2<=INC*INC*l2 and 0<=sum((v[k]-a[k])*d[k]for k in range(2))<=l2 for v in ps)and sum(n[k]*outer[k]for k in range(3))>0:candidates.append('plane-'+p['id'])
  for c in cylinders:
   center=tuple(map(Q,c['c']));radius=Q(c['r']);radials=[(v[0]-center[0],v[1]-center[1])for v in ps];rr=squared_radius_range(radials)
   if not all(radial_error_squared_within(v,radius,DEFL*DEFL)for v in rr):continue
   if not all(c['orientation']*(n[0]*v[0]+n[1]*v[1])>0 for v in radials):continue
   if not c.get('full')and not all(v[c['halfAxis']]*c['halfSign']>=0 for v in radials):continue
   candidates.append('wall-'+c['id'])
  key=one(candidates,'unambiguous original analytic patch');groups[key].append(i)
  for a,b in zip(t,t[1:]+t[:1]):edge[tuple(sorted((a,b)))].append((i,a,b))
  volumes.append(sum(ps[0][k]*cross(ps[1],ps[2])[k]for k in range(3))/6)
 expected={'top','bottom'}|{'plane-'+p['id']for p in planes}|{'wall-'+c['id']for c in cylinders};need(set(groups)==expected,'every authored patch covered, no extra triangle group');need(all(len(v)==2 and v[0][1:]==v[1][1:][::-1]for v in edge.values()),'all original edges two opposite indexed uses');need(len(vertices)-len(edge)+len(triangles)==2,'one genus-zero analytic prism shell')
 def planar(key,axes,orientation,outer):
  cfg=dict(config['planar']);cfg['output_dir']=str(directory/key);report=thaw(invoke_planar_coverage(vertices=vertices,triangles=triangles,selected_triangle_ids=groups[key],frame=f,projection_axes=axes,orientation=orientation,outer=outer,holes=[],**cfg));need(report['metadata']['status']=='PASS'and report['report']is not None and report['report']['status']=='PASS'and report['report']['input']['complete']is True and report['report']['domain']['complete']is True and report['report']['projectedTriangles']['scanComplete']is True and report['report']['union']['complete']is True and report['report']['union']['exactTriangleAreaEqualsUnion']is True and report['report']['union']['exactSymmetricDifferenceEmpty']is True,'mandatory complete exact planar set certificate '+key);return report
 reports={};rim_edges={};
 for key,sgn in [('bottom',-1),('top',1)]:
  loops=boundary(groups[key],triangles);loop=one(loops,'original cap outer boundary');reports[key]=planar(key,[0,1],sgn,{'kind':'indexed','vertexIds':loop});counts=collections.Counter();line_intervals=collections.defaultdict(list)
  for a,b in zip(loop,loop[1:]+loop[:1]):
   p,q=local[a],local[b];others=[v[0]for v in edge[tuple(sorted((a,b)))]if v[0]not in groups[key]];other=one(others,'actual cap/side shared edge');kind=one([name for name,ids in groups.items()if other in ids],'actual side owner');need(kind.startswith(('plane-','wall-')),'cap touches genuine original side');counts[kind]+=1
   if kind.startswith('plane-'):
    row=one([p for p in planes if 'plane-'+p['id']==kind],'original Segment');d=sub(tuple(map(Q,row['b'])),tuple(map(Q,row['a'])));l2=sum(v*v for v in d);a0=tuple(map(Q,row['a']));u=[sum((v[k]-a0[k])*d[k]for k in range(2))/l2 for v in (p,q)];line_intervals[kind].append(tuple(sorted(u)))
   else:
    c=one([c for c in cylinders if 'wall-'+c['id']==kind],'original Arc');rad=[(v[0]-Q(c['c'][0]),v[1]-Q(c['c'][1]))for v in (p,q)];need(all(abs(float(sum(x*x for x in v))**.5-c['r'])<=float(INC)for v in rad),'original rim endpoints on source support within declared plane incidence');need(all(radial_error_squared_within(v,Q(c['r']),DEFL*DEFL-max(abs(p[2]-(T if key=='top'else 0)),abs(q[2]-(T if key=='top'else 0)))**2)for v in squared_radius_range(rad)),'ENTIRE original rim chord meets combined analytic distance budget');rim_edges.setdefault((key,kind),[]).append((a,b))
  need(set(counts)==expected-{'top','bottom'},'all original source boundary members occur on each cap')
  for kind,intervals in line_intervals.items():
   intervals.sort();need(intervals[0][0]==0 and intervals[-1][1]==1 and all(a[1]==b[0]for a,b in zip(intervals,intervals[1:])),'entire exact original Segment rim once, without gap/overlap')
 for p in planes:
  key='plane-'+p['id'];a,b=p['a'],p['b'];axis=0 if a[0]!=b[0]else 1;other=1-axis;d=b[axis]-a[axis];need(a[other]==b[other],'frozen cardinal Segment artifact domain');sign=1 if d>0 else -1;corners=[[min(a[axis],b[axis]),0],[max(a[axis],b[axis]),0],[max(a[axis],b[axis]),float(T)],[min(a[axis],b[axis]),float(T)]];reports[key]=planar(key,[axis,2],sign,{'kind':'source-rectangle','corners':corners})
 for c in cylinders:
  key='wall-'+c['id']
  if c.get('full'):reports[key]=certify_full_cylinder(local,triangles,groups[key],c['c'],c['r'],0,T,c['orientation'],DEFL,INC);continue
  axis=1-c['halfAxis'];normal_axis=c['halfAxis'];sign=(1 if normal_axis==0 else -1)*c['halfSign']*c['orientation'];need(all(normals[i][normal_axis]*c['halfSign']*c['orientation']>0 for i in groups[key]),'strict linear half-cylinder projection regularity');center=c['c'][axis];radius=c['r'];corners=[[center-radius,0],[center+radius,0],[center+radius,float(T)],[center-radius,float(T)]];reports[key]=planar(key,[axis,2],sign,{'kind':'source-rectangle','corners':corners})
 volume=float(sum(volumes));truth=float(facts(e)['volume']);allowance=sum(math.pi*(2*c['r']*float(DEFL)+float(DEFL)**2)*float(T)for c in cylinders)+max(1e-5,abs(truth)*1e-12);need(volume>0 and abs(volume-truth)<=allowance,'positive actual volume within independently declared tessellation displacement budget')
 return{'quality':'original-index-complete-CGAL3D/exact-planar-union/analytic-half/full-cylinder','global':global_report,'patches':reports,'patchTriangleCounts':{k:len(v)for k,v in groups.items()},'originalVertices':len(vertices),'originalTriangles':len(triangles),'signedVolumeMm3':volume,'volumeAllowanceMm3':allowance,'artifactDeflectionMm':str(DEFL),'planeIncidenceMm':str(INC),'sourceAccuracyClaim':False}
