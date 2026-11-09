"""Trusted OFFLINE planar coverage invocation; SOURCE ONLY until Root executes.

Only exact projected-set evidence. Original source/plane/cap/rim/material/global
CGAL/analytic displacement custody remains the caller's independent obligation.
No CLI, import-time work, geometry generation, repair or automatic fallback.
"""
import hashlib,json,math,os,re,resource,selectors,signal,stat,struct,subprocess,sys,threading,time
from pathlib import Path
from types import MappingProxyType

MAX_VERTICES=150000
MAX_TRIANGLES=100000
MESH_BYTES=8388608
TEXT_BYTES=16777216
OUTPUT_BYTES=65536
LINE_BYTES=80
DETAILS=128
ADDRESS_SPACE_BYTES=1073741824
CPU_SECONDS=120
WALL_SECONDS=120
SETTLEMENT_GRACE_SECONDS=2
CPP_RELATIVE='test/library-validation/cgal/planar_coverage.cpp'
LIMITS={'vertices':MAX_VERTICES,'triangles':MAX_TRIANGLES,'binaryBytes':MESH_BYTES,
 'textBytes':TEXT_BYTES,'lineBytes':LINE_BYTES,'detailsPerList':DETAILS,
 'outputBytes':OUTPUT_BYTES,'loopWork':2000000,'arrangementVertices':2000000,
 'arrangementEdges':4000000,'arrangementFaces':2000000,'measuredBoundaryVertices':8000000}
INPUT_REASONS=frozenset(('INPUT_IO_FAILURE INPUT_TRUNCATED INPUT_CHARACTER INPUT_SPACING '
 'INPUT_ROW_ARITY INPUT_TRAILING_DATA INPUT_DECIMAL_FORM INPUT_INTEGER_RANGE '
 'INPUT_SIGNED_AXIS INPUT_HEX_WIDTH INPUT_HEX_FORM INPUT_NONFINITE_COORDINATE '
 'INPUT_FRAME_NOT_SIGNED_PERMUTATION INPUT_FRAME_NOT_RIGHT_HANDED INPUT_VERSION '
 'INPUT_EMPTY_MESH INPUT_EMPTY_PATCH_OR_DOMAIN INPUT_PROJECTION '
 'INPUT_REPEATED_VERTEX_INDEX INPUT_DUPLICATE_SELECTED_ID INPUT_LOOP_ROLE_MODE '
 'INPUT_LOOP_SIZE INPUT_DUPLICATE_LOOP_VERTEX NO_ARGUMENTS_ACCEPTED').split())
FAIL_REASONS=frozenset(('DOMAIN_SOURCE_RECTANGLE_SHAPE DOMAIN_ZERO_EDGE '
 'DOMAIN_SELF_INTERSECTION DOMAIN_ZERO_AREA DOMAIN_ORIGINAL_ORIENTATION '
 'DOMAIN_HOLE_OUTSIDE DOMAIN_BOUNDARY_CONTACT DOMAIN_HOLES_OVERLAP '
 'PROJECTED_TRIANGLE_DOMAIN OVERLAP_AND_DOMAIN_MISMATCH POSITIVE_AREA_OVERLAP '
 'DOMAIN_SET_MISMATCH').split())
RESOURCE_REASONS=frozenset(('INPUT_TEXT_LIMIT INPUT_LINE_LIMIT DOMAIN_PAIR_WORK_LIMIT '
 'ARRANGEMENT_SIZE_LIMIT POLYGON_OUTPUT_LIMIT BOUNDARY_ENUMERATION_LIMIT '
 'INPUT_BINARY_LIMIT OUTPUT_LIMIT ALLOCATION_FAILURE').split())
ERROR_REASONS=frozenset(('EMPTY_VALIDATED_DOMAIN UNBOUNDED_FINITE_UNION '
 'UNION_ORIENTATION_INVARIANT UNION_NEGATIVE_AREA SELECTED_CENSUS_INVARIANT '
 'EMPTY_NONEMPTY_TRIANGLE_UNION UNION_AREA_EXCEEDS_TRIANGLE_SUM '
 'SET_DIFFERENCE_INVARIANT OUTPUT_IO_FAILURE CGAL_OR_ADAPTER_EXCEPTION').split())
TOP_KEYS=frozenset(('version adapter scope cgalVersion status reason input limits '
 'projection domain projectedTriangles union overlapLaterTriangles outsideTriangles '
 'sourceBinding planeIncidence globalMeshValidity analyticCircleDisplacement').split())

class _Refusal(Exception):
 def __init__(self,status,reason):
  self.status,self.reason=status,reason
  super().__init__(reason)

def _need(ok,reason,status='INPUT_INVALID'):
 if not ok:raise _Refusal(status,reason)

def _seq(value,minimum,maximum,reason):
 _need(type(value) in (list,tuple),reason)
 _need(minimum<=len(value)<=maximum,reason)
 return value

def _record(value,keys,reason):
 _need(type(value) is dict and len(value)==len(keys) and set(value)==set(keys),reason)
 return value

def _integer(value,minimum,maximum,reason):
 _need(type(value) is int and minimum<=value<=maximum,reason)
 return value

def _f64(value):
 _need(type(value) in (int,float),'ORIGINAL_F64_TYPE')
 if type(value)is int:_need(value.bit_length()<=1024,'ORIGINAL_F64_RANGE')
 try:result=float(value)
 except (OverflowError,ValueError):raise _Refusal('INPUT_INVALID','ORIGINAL_F64_RANGE')
 _need(math.isfinite(result),'ORIGINAL_F64_FINITE')
 if type(value)is int:_need(int(result)==value,'ORIGINAL_F64_INT_NOT_EXACT')
 return result

def _digest(value,reason):
 _need(type(value)is str and len(value)==64 and re.fullmatch('[a-f0-9]{64}',value)is not None,reason)
 return value

def _path(value,reason):
 _need(type(value)is str and 0<len(value)<=4096 and '\0'not in value,reason)
 path=Path(value)
 _need(path.is_absolute(),reason)
 return path

def _snapshot(vertices,triangles,selected,frame,axes,orientation,outer,holes):
 # Concrete sequence/type/count preflight occurs BEFORE tuple/set snapshots.
 _seq(vertices,1,MAX_VERTICES,'VERTEX_CENSUS')
 _seq(triangles,1,MAX_TRIANGLES,'TRIANGLE_CENSUS')
 nv,nt=len(vertices),len(triangles)
 _need(32+24*nv+12*nt<=MESH_BYTES,'CONTROLLED_MESH_BYTES','RESOURCE_LIMIT')
 for p in vertices:
  _seq(p,3,3,'VERTEX_ARITY')
  for x in p:_f64(x)
 for t in triangles:
  _seq(t,3,3,'TRIANGLE_ARITY')
  for v in t:_integer(v,0,nv-1,'ORIGINAL_VERTEX_INDEX')
  _need(t[0]!=t[1] and t[0]!=t[2] and t[1]!=t[2],'REPEATED_VERTEX_INDEX')
 _seq(selected,1,nt,'SELECTED_CENSUS')
 for v in selected:_integer(v,0,nt-1,'SELECTED_ORIGINAL_ID')
 _record(frame,('origin','x','y','z'),'FRAME_FIELDS')
 _seq(frame['origin'],3,3,'FRAME_ORIGIN')
 for x in frame['origin']:_f64(x)
 for k in('x','y','z'):
  _seq(frame[k],3,3,'FRAME_AXIS')
  for x in frame[k]:_integer(x,-1,1,'FRAME_AXIS')
 _seq(axes,2,2,'PROJECTION_AXES')
 for x in axes:_integer(x,0,2,'PROJECTION_AXES')
 _need(axes[0]!=axes[1],'PROJECTION_AXES')
 _integer(orientation,-1,1,'PROJECTED_ORIENTATION')
 _need(orientation!=0,'PROJECTED_ORIENTATION')
 _seq(holes,0,(nv+4)//3-1,'DOMAIN_LOOP_CENSUS')
 raw_loops=(outer,*holes)
 total=0
 for i,loop in enumerate(raw_loops):
  _need(type(loop)is dict and type(loop.get('kind'))is str,'DOMAIN_LOOP_RECORD')
  if loop['kind']=='indexed':
   _record(loop,('kind','vertexIds'),'DOMAIN_LOOP_RECORD')
   ids=_seq(loop['vertexIds'],3,nv+4-total,'DOMAIN_LOOP_CENSUS');total+=len(ids)
   for v in ids:_integer(v,0,nv-1,'DOMAIN_VERTEX_INDEX')
  else:
   _need(i==0 and loop['kind']=='source-rectangle','DOMAIN_LOOP_MODE')
   _record(loop,('kind','corners'),'DOMAIN_LOOP_RECORD')
   corners=_seq(loop['corners'],4,4,'SOURCE_RECTANGLE_ARITY');total+=4
   _need(total<=nv+4,'DOMAIN_LOOP_CENSUS')
   for p in corners:
    _seq(p,2,2,'SOURCE_RECTANGLE_ARITY')
    for x in p:_f64(x)
 # Detach from every caller alias. No geometry orientation/simple/coverage
 # predicate is reimplemented here; actual CGAL evaluates the exact protocol.
 v=tuple(tuple(_f64(x)for x in p)for p in vertices)
 t=tuple(tuple(row)for row in triangles)
 chosen=tuple(selected)
 _need(len(set(chosen))==len(chosen),'DUPLICATE_SELECTED_ID')
 origin=tuple(_f64(x)for x in frame['origin'])
 basis=tuple(tuple(frame[k])for k in('x','y','z'))
 _need(all(sum(x*x for x in a)==1 for a in basis) and
       all(sum(basis[i][j]*basis[k][j]for j in range(3))==0 for i in range(3)for k in range(i)),
       'FRAME_SIGNED_PERMUTATION')
 x,y,z=basis
 _need((x[1]*y[2]-x[2]*y[1],x[2]*y[0]-x[0]*y[2],x[0]*y[1]-x[1]*y[0])==z,
       'FRAME_RIGHT_HANDED')
 loops=[]
 for i,loop in enumerate(raw_loops):
  if loop['kind']=='indexed':
   ids=tuple(loop['vertexIds']);_need(len(set(ids))==len(ids),'DUPLICATE_LOOP_VERTEX')
   loops.append(('indexed',ids))
  else:loops.append(('source-rectangle',tuple(tuple(_f64(x)for x in p)for p in loop['corners'])))
 return {'vertices':v,'triangles':t,'selected':chosen,'origin':origin,'basis':basis,
         'axes':tuple(axes),'orientation':orientation,'loops':tuple(loops),
         'loopVertices':sum(len(p)for _,p in loops)}

def _bits(value):return struct.pack('>d',value).hex()

def _encode(snapshot,path):
 s=snapshot
 def rows():
  yield '1 '+str(len(s['vertices']))+' '+str(len(s['triangles']))+' '+str(len(s['selected']))+' '+str(len(s['loops']))
  yield ' '.join(map(_bits,s['origin']))
  for a in s['basis']:yield ' '.join(map(str,a))
  yield ' '.join(map(str,(*s['axes'],s['orientation'])))
  for p in s['vertices']:yield ' '.join(map(_bits,p))
  for t in s['triangles']:yield ' '.join(map(str,t))
  for i in s['selected']:yield str(i)
  for i,(kind,data)in enumerate(s['loops']):
   yield str(0 if i==0 else 1)+' '+str(0 if kind=='indexed'else 1)+' '+str(len(data))
   for p in data:yield str(p)if kind=='indexed'else' '.join(map(_bits,p))
 digest=hashlib.sha256();size=0;lines=0
 with path.open('xb')as stream:
  for text in rows():
   raw=text.encode('ascii')
   _need(len(raw)<=LINE_BYTES,'PROTOCOL_LINE_BYTES','RESOURCE_LIMIT')
   size+=len(raw)+1;lines+=1
   _need(size<=TEXT_BYTES,'PROTOCOL_TEXT_BYTES','RESOURCE_LIMIT')
   stream.write(raw+b'\n');digest.update(raw+b'\n')
 return {'file':path.name,'bytes':size,'lines':lines,'sha256':digest.hexdigest()}

def _hash_file(path):
 # Stream regular reviewed files; never materialize a binary in Python RAM.
 with path.open('rb')as stream:
  s=os.fstat(stream.fileno())
  _need(stat.S_ISREG(s.st_mode),'ANCHOR_NOT_REGULAR')
  h=hashlib.sha256();size=0
  for block in iter(lambda:stream.read(1048576),b''):h.update(block);size+=len(block)
  _need(size==s.st_size,'ANCHOR_CHANGED_DURING_HASH','CUSTODY_CHANGED')
 return {'path':str(path),'bytes':size,'sha256':h.hexdigest(),
         'device':s.st_dev,'inode':s.st_ino,'mode':stat.S_IMODE(s.st_mode),
         'mtimeNanoseconds':s.st_mtime_ns}

def _native_limits():
 resource.setrlimit(resource.RLIMIT_AS,(ADDRESS_SPACE_BYTES,ADDRESS_SPACE_BYTES))
 resource.setrlimit(resource.RLIMIT_CPU,(CPU_SECONDS,CPU_SECONDS))

def _run(executable,input_file,directory):
 start=time.monotonic()
 result={'started':False,'settled':False,'streamsSettled':False,'returnCode':None,
         'signal':None,'timedOut':False,'outputOverflow':False,'killError':False,
         'waitOwnershipLost':False,'invokerFailure':None,'wallSeconds':None,'exitObservedWallSeconds':None,
         'userCpuSeconds':None,'systemCpuSeconds':None,'peakResidentSetBytes':None,
         'peakResidentSetMeasurement':'Linux wait4 ru_maxrss KiB*1024',
         'addressSpaceLimitRole':'RLIMIT_AS virtual address-space limit, NOT peak RSS/capacity'}
 streams={k:{'file':k+'.bin','bytes':0,'observedBytesAtLeast':0,'truncated':False}
          for k in('stdout','stderr')}
 selector=selectors.DefaultSelector();proc=None;captured=0;kill_sent=False;stop_deadline=None
 outputs={};source=None
 def reap():
  if proc is None or result['returnCode']is not None or result['waitOwnershipLost']:return
  try:pid,status,usage=os.wait4(proc.pid,os.WNOHANG)
  except InterruptedError:return
  except ChildProcessError:
   result['waitOwnershipLost']=True;result['invokerFailure']='CHILD_WAIT_OWNERSHIP_LOST';return
  if pid:
   proc.returncode=os.waitstatus_to_exitcode(status);result['returnCode']=proc.returncode
   result['signal']=-proc.returncode if proc.returncode<0 else None;result['settled']=True
   result['userCpuSeconds']=usage.ru_utime;result['systemCpuSeconds']=usage.ru_stime
   result['peakResidentSetBytes']=usage.ru_maxrss*1024
   result['exitObservedWallSeconds']=time.monotonic()-start
   if result['exitObservedWallSeconds']>WALL_SECONDS:result['timedOut']=True
 def terminate():
  nonlocal kill_sent
  # Never signal a reaped/unknown owner or a reused PID/process group.
  if kill_sent or proc is None or result['returnCode']is not None or result['waitOwnershipLost']:return
  kill_sent=True
  try:os.killpg(proc.pid,signal.SIGKILL)
  except ProcessLookupError:pass  # Not proof of settlement; still reap own PID.
  except OSError:result['killError']=True
 try:
  for name in streams:outputs[name]=(directory/(name+'.bin')).open('xb')
  source=input_file.open('rb')
  proc=subprocess.Popen([str(executable)],stdin=source,stdout=subprocess.PIPE,stderr=subprocess.PIPE,
                        shell=False,cwd=str(directory),start_new_session=True,preexec_fn=_native_limits)
  result.update(started=True,pid=proc.pid,processGroup=proc.pid)
  for name,pipe in(('stdout',proc.stdout),('stderr',proc.stderr)):
   os.set_blocking(pipe.fileno(),False);selector.register(pipe,selectors.EVENT_READ,name)
  deadline=start+WALL_SECONDS
  while True:
   now=time.monotonic();reap()
   if result['waitOwnershipLost']:break
   if result['returnCode']is not None and stop_deadline is None:
    stop_deadline=now+SETTLEMENT_GRACE_SECONDS
   if now>=deadline and result['returnCode']is None:result['timedOut']=True
   if(result['timedOut']or result['outputOverflow'])and not kill_sent and result['returnCode']is None:
    terminate();stop_deadline=now+SETTLEMENT_GRACE_SECONDS
   if result['returnCode']is not None and not selector.get_map():
    result['streamsSettled']=True;break
   if stop_deadline is not None and now>=stop_deadline:break
   for key,_ in selector.select(.05):
    name=key.data
    try:raw=os.read(key.fileobj.fileno(),4096)
    except BlockingIOError:continue
    if not raw:
     selector.unregister(key.fileobj);key.fileobj.close();continue
    row=streams[name];row['observedBytesAtLeast']+=len(raw)
    room=max(0,OUTPUT_BYTES-captured);kept=raw[:room]
    if kept:outputs[name].write(kept);row['bytes']+=len(kept);captured+=len(kept)
    if len(kept)!=len(raw):row['truncated']=True;result['outputOverflow']=True
 except BaseException as error:
  result['invokerFailure']='PROCESS_IO_OR_LAUNCH_FAILURE'
  result['exceptionType']=type(error).__name__[:80];terminate()
 finally:
  # The child/group and pipes were created by this call; no user browser,
  # account, unrelated child or unknown/reaped process is signalled/closed.
  if proc is not None and result['returnCode']is None and not result['waitOwnershipLost']:
   terminate();until=stop_deadline if stop_deadline is not None else time.monotonic()+SETTLEMENT_GRACE_SECONDS
   while result['returnCode']is None and not result['waitOwnershipLost']and time.monotonic()<until:
    reap()
    if result['returnCode']is None:time.sleep(.02)
  for key in list(selector.get_map().values()):
   try:selector.unregister(key.fileobj);key.fileobj.close()
   except Exception:result['invokerFailure']='PIPE_CLOSE_FAILURE'
  try:selector.close()
  except OSError:result['invokerFailure']='SELECTOR_CLOSE_FAILURE'
  if source is not None:
   try:source.close()
   except OSError:result['invokerFailure']='INPUT_CLOSE_FAILURE'
  for stream in outputs.values():
   try:stream.close()
   except OSError:result['invokerFailure']='STREAM_CLOSE_FAILURE'
  result['wallSeconds']=time.monotonic()-start
 for name,row in streams.items():
  try:
   actual=_hash_file(directory/row['file']);row['sha256']=actual['sha256'];row['bytes']=actual['bytes']
  except Exception:
   row['sha256']=None;result['invokerFailure']='STREAM_HASH_FAILURE'
  row['complete']=result['streamsSettled']and not row['truncated']and row['sha256']is not None
 return result,streams

def _pairs(rows):
 result={}
 for k,v in rows:
  _need(k not in result,'REPORT_DUPLICATE_KEY','REPORT_INVALID');result[k]=v
 return result

def _fields(value,keys):
 _need(type(value)is dict and set(value)==set(keys),'REPORT_FIELDS','REPORT_INVALID')
 return value

def _int(value,lo,hi):
 _need(type(value)is int and lo<=value<=hi,'REPORT_INTEGER','REPORT_INVALID')
 return value

def _bool(value):
 _need(type(value)is bool,'REPORT_BOOLEAN','REPORT_INVALID')
 return value

def _nullable_int(value,lo,hi):
 if value is not None:_int(value,lo,hi)
def _nullable_bool(value):
 if value is not None:_bool(value)

def _detail(value,selected):
 d=_fields(value,('status','scanComplete','countAtLeast','idsComplete','originalTriangleIds'))
 _need(d['status']in('NOT_RUN','INCOMPLETE','TRUNCATED','COMPLETE'),'REPORT_DETAIL_STATUS','REPORT_INVALID')
 _bool(d['scanComplete']);_bool(d['idsComplete'])
 ids=d['originalTriangleIds'];_need(type(ids)is list and len(ids)<=DETAILS,'REPORT_DETAIL_IDS','REPORT_INVALID')
 for i in ids:_need(type(i)is int and i in selected,'REPORT_ORIGINAL_TRIANGLE_ID','REPORT_INVALID')
 _need(len(set(ids))==len(ids),'REPORT_DUPLICATE_DETAIL_ID','REPORT_INVALID')
 if d['status']=='NOT_RUN':
  _need(d['countAtLeast']is None and not ids and not d['scanComplete']and not d['idsComplete'],'REPORT_NOT_RUN_DETAIL','REPORT_INVALID')
 else:
  n=_int(d['countAtLeast'],len(ids),len(selected))
  _need(len(ids)==min(n,DETAILS),'REPORT_DETAIL_CENSUS','REPORT_INVALID')
  _need(d['scanComplete']==(d['status']=='COMPLETE'),'REPORT_DETAIL_COMPLETENESS','REPORT_INVALID')
  _need(d['idsComplete']==(d['scanComplete']and n==len(ids)),'REPORT_DETAIL_COMPLETENESS','REPORT_INVALID')
  if d['status']=='TRUNCATED':_need(n==DETAILS+1,'REPORT_DETAIL_TRUNCATION','REPORT_INVALID')
 return d

def _capture(raw,snapshot,build_source):
 _need(0<len(raw)<=OUTPUT_BYTES and raw.endswith(b'\n')and raw[:-1].strip()==raw[:-1],
       'REPORT_BYTES','REPORT_INVALID')
 try:r=json.loads(raw.decode('utf-8'),object_pairs_hook=_pairs,
                  parse_constant=lambda _:(_ for _ in()).throw(_Refusal('REPORT_INVALID','REPORT_NONFINITE')))
 except _Refusal:raise
 except (UnicodeError,ValueError,RecursionError):raise _Refusal('REPORT_INVALID','REPORT_JSON')
 _fields(r,TOP_KEYS)
 _need(type(r['version'])is int and r['version']==1 and r['adapter']=='codi-cgal-planar-coverage-v1'
       and r['scope']=='exact-projected-set-coverage-only'and r['cgalVersion']==build_source['cgalVersion'],
       'REPORT_IDENTITY','REPORT_INVALID')
 reasons={'PASS':{'EXACT_PROJECTED_COVERAGE'},'INPUT_INVALID':INPUT_REASONS,'FAIL':FAIL_REASONS,
          'RESOURCE_LIMIT':RESOURCE_REASONS,'ERROR':ERROR_REASONS}
 _need(type(r['status'])is str and r['status']in reasons and type(r['reason'])is str
       and r['reason']in reasons[r['status']],'REPORT_OUTCOME','REPORT_INVALID')
 for k in('sourceBinding','planeIncidence','globalMeshValidity','analyticCircleDisplacement'):
  _need(r[k]=='NOT_RUN','REPORT_SCOPE_AUTHORITY','REPORT_INVALID')
 _fields(r['limits'],LIMITS)
 _need(r['limits']==LIMITS and all(type(v)is int for v in r['limits'].values()),'REPORT_LIMITS','REPORT_INVALID')
 s=snapshot;nv,nt,nc,nl=len(s['vertices']),len(s['triangles']),len(s['selected']),len(s['loops'])
 inp=_fields(r['input'],('vertices','triangles','selectedTriangles','loops','loopVertices','complete',
                         'errorLine','errorOriginalTriangleId','errorLoopId'))
 for k,n in(('vertices',nv),('triangles',nt),('selectedTriangles',nc),('loops',nl),('loopVertices',s['loopVertices'])):_int(inp[k],0,n)
 _bool(inp['complete'])
 if inp['complete']:
  _need([inp[k]for k in('vertices','triangles','selectedTriangles','loops','loopVertices')]==[nv,nt,nc,nl,s['loopVertices']],'REPORT_INPUT_CENSUS','REPORT_INVALID')
  _need(inp['errorLine']is None,'REPORT_INPUT_COMPLETENESS','REPORT_INVALID')
 else:_nullable_int(inp['errorLine'],1,6+nv+nt+nc+nl+s['loopVertices']+1)
 _nullable_int(inp['errorOriginalTriangleId'],0,nt-1);_nullable_int(inp['errorLoopId'],0,nl-1)
 p=_fields(r['projection'],('exactSignedPermutationChecked','localAxes','expectedOriginalSign'))
 _bool(p['exactSignedPermutationChecked'])
 if p['exactSignedPermutationChecked']:
  _need(p['localAxes']==list(s['axes'])and all(type(v)is int for v in p['localAxes'])and
        type(p['expectedOriginalSign'])is int and p['expectedOriginalSign']==s['orientation'],'REPORT_PROJECTION','REPORT_INVALID')
 else:_need(p['localAxes']is None and p['expectedOriginalSign']is None,'REPORT_PROJECTION_UNKNOWN','REPORT_INVALID')
 domain=_fields(r['domain'],('status','complete','indexedLoops','sourceRectangleOuters','workUnits'))
 _need(domain['status']in('NOT_RUN','INCOMPLETE','COMPLETE'),'REPORT_DOMAIN_STATUS','REPORT_INVALID')
 _bool(domain['complete']);_need(domain['complete']==(domain['status']=='COMPLETE'),'REPORT_DOMAIN_COMPLETENESS','REPORT_INVALID')
 indexed=sum(k=='indexed'for k,_ in s['loops']);rect=nl-indexed
 _int(domain['indexedLoops'],0,indexed);_int(domain['sourceRectangleOuters'],0,rect);_int(domain['workUnits'],0,LIMITS['loopWork'])
 if inp['complete']:_need(domain['indexedLoops']==indexed and domain['sourceRectangleOuters']==rect,'REPORT_DOMAIN_CENSUS','REPORT_INVALID')
 selected=frozenset(s['selected'])
 tri=_fields(r['projectedTriangles'],('scanComplete','degenerate','wrongOriginalOrientation'));_bool(tri['scanComplete'])
 bad=_detail(tri['degenerate'],selected);reversed_rows=_detail(tri['wrongOriginalOrientation'],selected)
 _need(bad['scanComplete']==tri['scanComplete']and reversed_rows['scanComplete']==tri['scanComplete'],'REPORT_TRIANGLE_COMPLETENESS','REPORT_INVALID')
 if domain['complete']:_need(inp['complete']and p['exactSignedPermutationChecked'],'REPORT_DOMAIN_PHASE','REPORT_INVALID')
 if tri['scanComplete']:_need(domain['complete'],'REPORT_TRIANGLE_PHASE','REPORT_INVALID')
 union=_fields(r['union'],('complete','components','enumeratedBoundaryVertices','exactTriangleAreaEqualsUnion',
                         'exactSymmetricDifferenceEmpty','missingComponents','outsideComponents'))
 _bool(union['complete'])
 _nullable_int(union['components'],0,LIMITS['arrangementFaces'])
 _nullable_int(union['enumeratedBoundaryVertices'],0,LIMITS['measuredBoundaryVertices'])
 for k in('exactTriangleAreaEqualsUnion','exactSymmetricDifferenceEmpty'):_nullable_bool(union[k])
 for k in('missingComponents','outsideComponents'):_nullable_int(union[k],0,LIMITS['arrangementFaces'])
 overlap=_detail(r['overlapLaterTriangles'],selected);outside=_detail(r['outsideTriangles'],selected)
 if not union['complete']:_need(all(union[k]is None for k in union if k!='complete'),'REPORT_UNKNOWN_UNION','REPORT_INVALID')
 else:_need(tri['scanComplete']and domain['complete']and inp['complete'],'REPORT_UNION_PHASE','REPORT_INVALID')
 _need((union['components']is None)==(union['enumeratedBoundaryVertices']is None),'REPORT_UNION_ENUMERATION','REPORT_INVALID')
 if union['exactTriangleAreaEqualsUnion']is not None:_need(union['components']is not None,'REPORT_AREA_PHASE','REPORT_INVALID')
 if union['exactSymmetricDifferenceEmpty']is None:
  _need(union['missingComponents']is None and union['outsideComponents']is None,'REPORT_UNKNOWN_DIFFERENCE','REPORT_INVALID')
 else:
  _need(union['exactTriangleAreaEqualsUnion']is not None and type(union['missingComponents'])is int
        and type(union['outsideComponents'])is int,'REPORT_DIFFERENCE_PHASE','REPORT_INVALID')
  _need(union['exactSymmetricDifferenceEmpty']==(union['missingComponents']==union['outsideComponents']==0),
        'REPORT_SET_DIFFERENCE_STATE','REPORT_INVALID')

 if r['status']=='PASS':
  _need(inp['complete']and inp['errorOriginalTriangleId']is None and inp['errorLoopId']is None
        and p['exactSignedPermutationChecked']and domain['complete']and tri['scanComplete'],
        'REPORT_PASS_PHASES','REPORT_INVALID')
  for d in(bad,reversed_rows):
   _need(d=={'status':'COMPLETE','scanComplete':True,'countAtLeast':0,'idsComplete':True,'originalTriangleIds':[]},
         'REPORT_PASS_TRIANGLES','REPORT_INVALID')
  _need(union['complete']and union['components']==1 and type(union['enumeratedBoundaryVertices'])is int
        and union['enumeratedBoundaryVertices']>=3*nl and union['exactTriangleAreaEqualsUnion']is True
        and union['exactSymmetricDifferenceEmpty']is True and union['missingComponents']==0
        and union['outsideComponents']==0,'REPORT_PASS_SET_PROOF','REPORT_INVALID')
  for d in(overlap,outside):
   _need(d=={'status':'NOT_RUN','scanComplete':False,'countAtLeast':None,'idsComplete':False,'originalTriangleIds':[]},
         'REPORT_PASS_DIAGNOSTICS','REPORT_INVALID')
 return r

def _freeze(value):
 if type(value)is dict:return MappingProxyType({k:_freeze(v)for k,v in value.items()})
 if type(value)is list:return tuple(_freeze(v)for v in value)
 if type(value)is tuple:return tuple(_freeze(v)for v in value)
 return value

def invoke_planar_coverage(*,executable,expected_executable_sha256,cpp_source,build_source,
                          vertices,triangles,selected_triangle_ids,frame,projection_axes,
                          orientation,outer,holes,output_dir):
 """One native process, no arguments, no retries. See PLANAR-INVOKER.md.

 build_source exact record: commit,cppRelativePath,cppSha256,cgalVersion.
 Outer/holes exact records: indexed+vertexIds, or OUTER-only source-rectangle+
 corners. Caller has already authenticated source/rim/plane ownership; this
 function never infers it from a report or accepts a validity flag.
 """
 out=_path(output_dir,'OUTPUT_DIRECTORY');out.mkdir(mode=0o700,parents=False,exist_ok=False)
 metadata={'version':1,'role':'trusted-offline-planar-coverage-invocation',
           'scope':'exact-projected-set-coverage-only','status':'ERROR','reason':'NOT_COMPLETED',
           'input':None,'anchors':{},'limits':{'addressSpaceBytes':ADDRESS_SPACE_BYTES,
           'addressSpaceRole':'virtual address space, not resident set','cpuSeconds':CPU_SECONDS,
           'wallSeconds':WALL_SECONDS,'settlementGraceSeconds':SETTLEMENT_GRACE_SECONDS,
           'combinedStdoutStderrBytes':OUTPUT_BYTES,'reportBytes':OUTPUT_BYTES},
           'process':None,'streams':None,'reportCapture':{'status':'NOT_RUN','reason':None},
           'sourceBinding':'CALLER_REQUIRED','planeIncidence':'CALLER_REQUIRED',
           'globalMeshValidity':'CALLER_REQUIRED','analyticCircleDisplacement':'CALLER_REQUIRED'}
 report=None;exe=cpp=own=None;snapshot=None
 try:
  _need(sys.platform=='linux'and hasattr(os,'wait4'),'LINUX_WAIT4_REQUIRED','UNSUPPORTED')
  _need(threading.active_count()==1,'SINGLE_THREADED_OFFLINE_CALLER_REQUIRED','UNSUPPORTED')
  exe=_path(executable,'EXECUTABLE_PATH');cpp=_path(cpp_source,'CPP_SOURCE_PATH')
  expected=_digest(expected_executable_sha256,'EXPECTED_EXECUTABLE_SHA256')
  metadata['anchors']['expectedExecutableSha256']=expected
  anchor=_record(build_source,('commit','cppRelativePath','cppSha256','cgalVersion'),'BUILD_SOURCE_FIELDS')
  _need(type(anchor['commit'])is str and len(anchor['commit'])==40 and re.fullmatch('[a-f0-9]{40}',anchor['commit'])is not None,'BUILD_SOURCE_COMMIT')
  _need(type(anchor['cppRelativePath'])is str and anchor['cppRelativePath']==CPP_RELATIVE,'BUILD_SOURCE_CPP_PATH')
  _digest(anchor['cppSha256'],'BUILD_SOURCE_CPP_SHA256')
  _need(type(anchor['cgalVersion'])is str and len(anchor['cgalVersion'])<=12 and re.fullmatch(r'5\.6(?:\.[0-9]{1,3})?',anchor['cgalVersion'])is not None,'BUILD_SOURCE_CGAL_VERSION')
  anchor=dict(anchor);metadata['anchors']['reviewedBuildSource']=anchor
  own=Path(__file__).resolve()
  for name,path in(('executable',exe),('cppSource',cpp),('invokerSource',own)):
   metadata['anchors'][name]={'before':_hash_file(path),'after':None}
  _need(metadata['anchors']['executable']['before']['sha256']==expected,'EXECUTABLE_SHA256_MISMATCH','CUSTODY_CHANGED')
  _need(metadata['anchors']['cppSource']['before']['sha256']==anchor['cppSha256'],'CPP_SOURCE_SHA256_MISMATCH','CUSTODY_CHANGED')
  snapshot=_snapshot(vertices,triangles,selected_triangle_ids,frame,projection_axes,orientation,outer,holes)
  metadata['input']=_encode(snapshot,out/'stdin.txt')
  process,streams=_run(exe,out/'stdin.txt',out);metadata['process']=process;metadata['streams']=streams
  # Capture any complete bounded report even on a failed process, without ever
  # letting its PASS override process/output/custody failure.
  try:
   raw=(out/streams['stdout']['file']).read_bytes()
   if not raw:raise _Refusal('REPORT_INVALID','REPORT_MISSING')
   _need(streams['stdout']['complete'],'REPORT_STREAM_INCOMPLETE','REPORT_INVALID')
   report=_capture(raw,snapshot,anchor)
   metadata['reportCapture']={'status':'VALID','reason':None}
  except _Refusal as error:
   metadata['reportCapture']={'status':'MISSING'if error.reason=='REPORT_MISSING'else'INVALID','reason':error.reason}
  except Exception:
   metadata['reportCapture']={'status':'INVALID','reason':'REPORT_IO_FAILURE'}
  if not process['started']:metadata.update(status='ERROR',reason='CHILD_NOT_STARTED')
  elif not process['settled']or not process['streamsSettled']:
   metadata.update(status='PROCESS_UNSETTLED',reason='OWNED_PROCESS_OR_STREAMS_UNSETTLED')
  elif process['timedOut']:metadata.update(status='TIMEOUT',reason='WALL_LIMIT')
  elif process['outputOverflow']:metadata.update(status='RESOURCE_LIMIT',reason='OUTPUT_LIMIT')
  elif process['invokerFailure']is not None:metadata.update(status='ERROR',reason=process['invokerFailure'])
  elif process['returnCode']<0:metadata.update(status='PROCESS_FAILED',reason='CHILD_SIGNAL')
  elif metadata['reportCapture']['status']!='VALID':
   metadata.update(status='REPORT_INVALID',reason=metadata['reportCapture']['reason'])
  else:
   expected_exit=0 if report['status']=='PASS'else 2 if report['status']=='INPUT_INVALID'else 1
   if process['returnCode']!=expected_exit:
    metadata['reportCapture']={'status':'INVALID','reason':'REPORT_EXIT_STATUS'}
    metadata.update(status='REPORT_INVALID',reason='REPORT_EXIT_STATUS')
   elif report['status']=='PASS'and streams['stderr']['bytes']:
    metadata.update(status='ERROR',reason='UNEXPECTED_SUCCESS_STDERR')
   else:metadata.update(status=report['status'],reason=report['reason'])
 except _Refusal as error:metadata.update(status=error.status,reason=error.reason)
 except Exception as error:
  metadata.update(status='ERROR',reason='INVOKER_EXCEPTION',exceptionType=type(error).__name__[:80])
 finally:
  # Hash both actual source leaves and the reviewed binary after every attempted
  # invocation; a changed/missing anchor cannot coexist with a qualifying PASS.
  for name,path in(('executable',exe),('cppSource',cpp),('invokerSource',own)):
   row=metadata['anchors'].get(name)
   if row is None or path is None:continue
   try:
    row['after']=_hash_file(path)
    if row['before']!=row['after']:metadata.update(status='CUSTODY_CHANGED',reason='ANCHOR_BEFORE_AFTER_CHANGED')
   except Exception:metadata.update(status='CUSTODY_CHANGED',reason='ANCHOR_AFTER_UNAVAILABLE')
  if metadata['input']is not None:
   try:
    after=_hash_file(out/'stdin.txt');metadata['input']['sha256After']=after['sha256']
    if after['sha256']!=metadata['input']['sha256']or after['bytes']!=metadata['input']['bytes']:
     metadata.update(status='CUSTODY_CHANGED',reason='STDIN_CHANGED')
   except Exception:metadata.update(status='CUSTODY_CHANGED',reason='STDIN_AFTER_UNAVAILABLE')
  metadata['files']={'metadata':'invocation.json','capturedReport':None}
  if report is not None:
   raw_report=(json.dumps(report,sort_keys=True,separators=(',',':'),allow_nan=False)+'\n').encode()
   _need(len(raw_report)<=OUTPUT_BYTES,'CAPTURED_REPORT_BYTES','RESOURCE_LIMIT')
   with(out/'captured-report.json').open('xb')as stream:stream.write(raw_report)
   metadata['files']['capturedReport']={'file':'captured-report.json','bytes':len(raw_report),
                                      'sha256':hashlib.sha256(raw_report).hexdigest()}
  text=json.dumps(metadata,sort_keys=True,separators=(',',':'),allow_nan=False)+'\n'
  _need(len(text.encode())<=65536,'METADATA_BYTES','RESOURCE_LIMIT')
  with(out/'invocation.json').open('x')as stream:stream.write(text)
 return _freeze({'metadata':metadata,'report':report})
