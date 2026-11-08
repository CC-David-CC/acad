// Actual Native calls ONLY in the production OCI Worker's private environment.
import {captureNativeCircularObservation,captureNativeCircularFailure,circularFields,circularNativeStatus,CIRCULAR_NATIVE_ERRORS,CIRCULAR_LIMITS} from './ownedCircularArrangementProtocol.mjs';
import {circularBoundarySpecification,canonicalCircular,canonicalCircularCycle} from '../extrusion/circularArrangementDescriptor.mjs';
import {circlePointSign,circularEventSide} from '../extrusion/circularTopology.mjs';
import {validateOwnedTopology} from './ownedTopologyContract.mjs';
import {createCircularPrismSelectionIndexV2,validateCircularPrismConstruction,captureCircularSelectionBoundaryRef} from './circularPrismSelectionIndex.mjs';
export {captureCircularSelectionBoundaryRef,createCircularPrismSelectionIndexV2,CIRCULAR_NATIVE_ERRORS};
const fail=(message,code='ENGINE_FAILURE',cause)=>{throw Object.assign(Error(message),{code,...(cause===undefined?{}:{cause})});};
function native(env,prepared,name){
 const {Module,malloc,free,stringPointer}=env,values=prepared.nativeValues;let data=0,text=0,value,status,failure=null,cleanup=null;
 try{data=malloc(152);if(!data)fail('Native circular scratch allocation failed.','RESOURCE_LIMIT');Module.HEAPF64.set(values,data/8);if(name!==undefined){text=stringPointer(name);if(!text)fail('Native circular name allocation failed.','RESOURCE_LIMIT');}globalThis.__OCI_EXCHANGE_VAL=null;status=name===undefined?Module._ReadCircularArrangementV1(data,19):Module._CreateOwnedCircularCellV1(text,data,19,prepared.depth,prepared.mask);value=globalThis.__OCI_EXCHANGE_VAL;if(values.some((n,i)=>!Object.is(Module.HEAPF64[data/8+i],n)))fail('Native circular input payload changed.','CIRCULAR_INPUT_CHANGED');}
 catch(cause){failure={cause};}
 finally{globalThis.__OCI_EXCHANGE_VAL=null;for(const pointer of[text,data])if(pointer)try{free(pointer);}catch(cause){cleanup ||= {cause};}}
 if(cleanup)fail('Native circular scratch cleanup failed.','ENGINE_CLEANUP_FAILED',Object.assign(Error('Uncertain scratch release'),{cause:cleanup.cause,operationError:failure?.cause}));if(failure)throw failure.cause;const code=circularNativeStatus(status);if(code){const diagnostic=captureNativeCircularFailure(value,status);fail(diagnostic.error+' at '+diagnostic.stage,code);}return value;
}
const TAU=2*Math.PI;
const fragmentPoint=(f,t)=>[f.center[0]+f.a[0]*Math.cos(t)+f.b[0]*Math.sin(t),f.center[1]+f.a[1]*Math.cos(t)+f.b[1]*Math.sin(t)];
const separation=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
function directedOccurrence(r,use){const f=r.spans[use.span].fragments[use.fragment],forward=use.orientation==='FORWARD';return{use,f,start:fragmentPoint(f,forward?f.first:f.last),end:fragmentPoint(f,forward?f.last:f.first)};}
function semanticChains(loop,r){
 const groups=[];
 for(const use of loop){const last=groups.at(-1);if(last&&last.span===use.span&&last.orientation===use.orientation)last.uses.push(use);else groups.push({span:use.span,orientation:use.orientation,uses:[use]});}
 if(groups.length>1&&groups[0].span===groups.at(-1).span&&groups[0].orientation===groups.at(-1).orientation){groups[0].uses=groups.at(-1).uses.concat(groups[0].uses);groups.pop();}
 return groups;
}
function noInteriorEvent(f,event,eps){
 // Map an already-qualified actual event into THIS original Native conic only
 // for interval validation. Nothing is snapped, normalized or used as an ID.
 const dx=event.point[0]-f.center[0],dy=event.point[1]-f.center[1],det=f.a[0]*f.b[1]-f.a[1]*f.b[0],cos=(dx*f.b[1]-dy*f.b[0])/det,sin=(f.a[0]*dy-f.a[1]*dx)/det,angle=Math.atan2(sin,cos);
 if(!Number.isFinite(angle)||separation(fragmentPoint(f,angle),event.point)>eps)fail('Actual source event has no qualified parameter on this Native occurrence.');
 const period=Math.ceil((f.first-angle)/TAU);
 if(!Number.isSafeInteger(period))fail('Native circular event period is numerically unqualified.');
 for(const k of[period,period+1]){
  const t=angle+k*TAU;if(!Number.isFinite(t))fail('Native circular event interval is numerically unqualified.');
  if(t>f.first&&t<f.last){
   if(separation(fragmentPoint(f,t),event.point)>eps)fail('Actual source event parameter incidence is unqualified.');
   // Endpoint residual qualification is the EXISTING 1e-9mm bound. It neither
   // changes the Native interval nor identifies/merges topological vertices.
   if(separation(fragmentPoint(f,f.first),event.point)>eps&&separation(fragmentPoint(f,f.last),event.point)>eps)fail('Actual Native interval crosses a source event in its interior.');
  }
 }
}
function corroborate(prepared,value){
 const r=captureNativeCircularObservation(value),circles=prepared.request.region.circles,eps=CIRCULAR_LIMITS.supportIncidenceMm;
 if(r.relation!==prepared.request.region.descriptor.relation)fail('Native and represented source relation disagree.');
 const incidence=(c,p)=>Math.abs(Math.hypot(p[0]-c.center[0],p[1]-c.center[1])-c.radius)<=eps;
 for(const event of r.events){if(!circles.every(c=>incidence(c,event.point)))fail('Actual Native event fails its original source equations.');if(event.branch!=='tangent'&&circularEventSide(circles[0],circles[1],event.point)!==(event.branch==='left'?1:-1))fail('Actual Native event changed its source branch.');}
 for(const span of r.spans)for(const f of span.fragments){
  const aa=f.a[0]**2+f.a[1]**2,bb=f.b[0]**2+f.b[1]**2,ab=f.a[0]*f.b[0]+f.a[1]*f.b[1],mid=(aa+bb)/2,spread=Math.hypot((aa-bb)/2,ab);
  if(mid<=spread||f.a[0]*f.b[1]-f.a[1]*f.b[0]<=0)fail('Native circular support orientation is unqualified.');
  for(const owner of span.owners){
   const c=circles[owner],residual=Math.hypot(f.center[0]-c.center[0],f.center[1]-c.center[1])+Math.max(Math.abs(Math.sqrt(mid-spread)-c.radius),Math.abs(Math.sqrt(mid+spread)-c.radius));
   if(residual>eps||![f.first,f.last].every(t=>incidence(c,fragmentPoint(f,t))))fail('Actual Native support fails the original circle equation.');
  }
  if(span.range!=='full'){
   const point=fragmentPoint(f,f.first+(f.last-f.first)/2),side=circlePointSign(circles[1-span.owners[0]],point);
   if(side!==(span.range==='inside-other'?-1:1))fail('Native source interval changed its actual inside/outside branch.');
   for(const event of r.events)noInteriorEvent(f,event,eps);
  }
 }
 const pair=circles.map(c=>c.id),qualified=new Set();
 function chain(group){
  const span=r.spans[group.span],rows=group.uses.map(u=>directedOccurrence(r,u)),total=rows.reduce((sum,row)=>sum+(row.f.last-row.f.first),0),owner=span.owners[0];
  if(!Number.isFinite(total)||total<=0)fail('Actual Native source chain has no qualified positive traversal.');
  for(let i=1;i<rows.length;i++)if(separation(rows[i-1].end,rows[i].start)>eps)fail('Actual directed Native source chain is discontinuous.');
  const start=rows[0].start,end=rows.at(-1).end;
  if(span.range==='full'){
   if(rows.length!==1||span.owners.some(i=>Math.abs(total-TAU)*circles[i].radius>eps)||separation(start,end)>eps)fail('Actual full-circle occurrence does not traverse the complete original source exactly once.');
  }else{
   if(!(total<TAU)||!circles.every(c=>incidence(c,start)&&incidence(c,end)))fail('Actual trimmed source chain has unqualified traversal/endpoints.');
   // CCW inside on source0 runs right→left; on source1 it runs left→right.
   // Outside is the complement; wire reversal reverses the endpoint roles.
   let first=(owner===0?-1:1)*(span.range==='inside-other'?1:-1);if(group.orientation==='REVERSED')first=-first;
   const last=-first;
   for(const[point,branch]of[[start,first],[end,last]]){
    if(circularEventSide(circles[0],circles[1],point)!==branch)fail('Actual directed source chain changed its endpoint event branch.');
    const event=r.events.find(e=>e.branch===(branch===1?'left':'right'));if(!event||separation(point,event.point)>eps)fail('Actual directed source chain endpoint is not incident to its source event.');
   }
  }
  qualified.add(group.span);
  return{owners:span.owners.map(i=>pair[i]),range:span.range,orientation:group.orientation};
 }
 function loop(uses){
  const rows=uses.map(u=>directedOccurrence(r,u));
  for(let i=0;i<rows.length;i++)if(separation(rows[i].end,rows[(i+1)%rows.length].start)>eps)fail('Actual Native cell boundary is not a continuous directed loop.');
  return canonicalCircularCycle(semanticChains(uses,r).map(chain));
 }
 for(const cell of r.cells){
  const spec=circularBoundarySpecification(pair,r.relation,cell.mask);
  if(canonicalCircular(loop(cell.outer))!==canonicalCircular(canonicalCircularCycle(spec.outer))||canonicalCircular(cell.holes.map(loop))!==canonicalCircular(spec.holes.map(canonicalCircularCycle)))fail('Actual Native cell coverage/wire semantics changed.');
 }
 if(qualified.size!==r.spans.length)fail('An actual Native source chain was not independently qualified.');
 // Source membership is the complete semantic partition. Every neighboring
 // occurrence was checked above, including distinct phases/subdivisions. Never
 // sum these overlapping cell copies or discard one as a geometric duplicate.
 for(let owner=0;owner<2;owner++){
  const ranges=new Set(r.spans.filter((span,index)=>span.owners.includes(owner)&&qualified.has(index)).map(span=>span.range));
  if(r.relation==='proper-overlap'?(ranges.size!==2||!ranges.has('inside-other')||!ranges.has('outside-other')):(ranges.size!==1||!ranges.has('full')))fail('Original source-circle membership partition is incomplete.');
 }
 return r;
}

export function inspectOwnedCircularSource(env,prepared){
 const {Module}=env;if(typeof Module._ReadCircularArrangementV1!=='function'||typeof Module._CreateOwnedCircularCellV1!=='function')fail('The exact Native circular ABI is unavailable.','ENGINE_CAPABILITY_UNAVAILABLE');const before=Module._OwnedShapeNamesV2();let value;try{value=native(env,prepared);}finally{if(Module._OwnedShapeNamesV2()!==before)fail('Native circular read changed persistent ownership.','CIRCULAR_INPUT_CHANGED');}try{return corroborate(prepared,value);}catch(cause){const reason=typeof cause?.message==='string'?cause.message.slice(0,256):'Unspecified observation rejection';fail('Actual Native circular read failed its strict observation contract: '+reason,'ENGINE_FAILURE',cause);}
}

// The status-0 FFI contract proves exactly this new owned name; failures must
// leave the original count exact. Unexpected/malformed success is terminal at
// the enclosing Worker boundary: realm termination revokes module ownership.
export function createOwnedCircularResult(env,prepared,name){
 const {Module}=env,before=Module._OwnedShapeNamesV2();let created;
 try{created=native(env,prepared,name);}catch(cause){if(Module._OwnedShapeNamesV2()!==before)fail('Refused circular construction changed owned names.','CIRCULAR_INPUT_CHANGED',cause);throw cause;}
 try{
 const c=circularFields(created,['version','valid','solidCount','nativeVolume','nativeBounds','constructionProvenance']);
 if(c.version!==1||c.valid!==true||c.solidCount!==1||Module._OwnedShapeNamesV2()!==before+1)fail('Native circular success did not establish exactly one owned solid.');
 const expected=prepared.expected,tolerance=Math.max(1e-7,expected.volume*1e-9),bounds=circularFields(c.nativeBounds,['min','max']);
 if(!Number.isFinite(c.nativeVolume)||c.nativeVolume<=0||Math.abs(c.nativeVolume-expected.volume)>tolerance||['min','max'].some(k=>!Array.isArray(bounds[k])||bounds[k].length!==3||bounds[k].some((n,i)=>!Number.isFinite(n)||Math.abs(n-expected.bounds[k][i])>1e-6)))fail('Actual circular solid disagrees with independent source quantities.');
 corroborate(prepared,c.constructionProvenance?.profile);
 const topology=validateOwnedTopology(env.query('_ReadOwnedTopologyV1',name)),certificate=validateCircularPrismConstruction(c.constructionProvenance,topology,prepared),evidence=env.summarize(name,env.interrogate(name));
 if(!evidence||evidence.solidCount!==1||evidence.nativeValidity?.valid!==true||!Number.isFinite(evidence.nativeVolume)||Math.abs(evidence.nativeVolume-c.nativeVolume)>tolerance||['min','max'].some(k=>evidence.nativeBounds?.[k]?.length!==3||evidence.nativeBounds[k].some((n,i)=>!Number.isFinite(n)||Math.abs(n-bounds[k][i])>1e-9)))fail('Circular creation and independent owned-solid reporting disagree.');
 return{evidence,construction:c.constructionProvenance,certificate:{status:'available',data:certificate,sourceBinding:{scope:'solved-request',regionId:prepared.request.region.id,boundaryKind:'circular-source-spans',circularArrangementVersion:1}}};
 }catch(cause){if(cause?.code==='MEASUREMENT_PRECISION_UNRESOLVED')throw cause;fail('Actual Native circular success failed its validation contract; realm ownership is revoked.','ENGINE_FAILURE',cause);}
}
