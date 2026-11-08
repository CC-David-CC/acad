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
function corroborate(prepared,value){
 const r=captureNativeCircularObservation(value),circles=prepared.request.region.circles,eps=CIRCULAR_LIMITS.supportIncidenceMm;if(r.relation!==prepared.request.region.descriptor.relation)fail('Native and represented source relation disagree.');const incidence=(c,p)=>Math.abs(Math.hypot(p[0]-c.center[0],p[1]-c.center[1])-c.radius)<=eps;
 for(const event of r.events){if(!circles.every(c=>incidence(c,event.point)))fail('Actual Native event fails its original source equations.');if(event.branch!=='tangent'&&circularEventSide(circles[0],circles[1],event.point)!==(event.branch==='left'?1:-1))fail('Actual Native event changed its source branch.');}
 const coverage=[0,0];for(const span of r.spans)for(const f of span.fragments){const aa=f.a[0]**2+f.a[1]**2,bb=f.b[0]**2+f.b[1]**2,ab=f.a[0]*f.b[0]+f.a[1]*f.b[1],mid=(aa+bb)/2,spread=Math.hypot((aa-bb)/2,ab);if(mid<=spread||f.a[0]*f.b[1]-f.a[1]*f.b[0]<=0)fail('Native circular support orientation is unqualified.');for(const owner of span.owners){const c=circles[owner],residual=Math.hypot(f.center[0]-c.center[0],f.center[1]-c.center[1])+Math.max(Math.abs(Math.sqrt(mid-spread)-c.radius),Math.abs(Math.sqrt(mid+spread)-c.radius));if(residual>eps)fail('Actual Native support fails the original circle equation.');coverage[owner]+=f.last-f.first;}if(span.range!=='full'){const t=f.first+(f.last-f.first)/2,point=[f.center[0]+f.a[0]*Math.cos(t)+f.b[0]*Math.sin(t),f.center[1]+f.a[1]*Math.cos(t)+f.b[1]*Math.sin(t)],side=circlePointSign(circles[1-span.owners[0]],point);if(side!==(span.range==='inside-other'?-1:1))fail('Native source interval changed its actual inside/outside branch.');}}
 if(coverage.some((n,i)=>Math.abs(n-2*Math.PI)*circles[i].radius>eps))fail('Actual Native intervals do not cover each original source circle.');
 const pair=circles.map(c=>c.id),semantic=loop=>loop.map(u=>({owners:r.spans[u.span].owners.map(i=>pair[i]),range:r.spans[u.span].range,orientation:u.orientation})).filter((u,i,all)=>i===0||canonicalCircular(u)!==canonicalCircular(all[i-1]));
 // Preserve Native wire order while coalescing semantic seam occurrences.
 // Rotate only afterward, just as circularPrismSelectionIndex.semanticLoop does.
 // Full fragment indices/intervals/coverage remain unchanged and checked above.
 const cycle=loop=>{const rows=semantic(loop);if(rows.length>1&&canonicalCircular(rows[0])===canonicalCircular(rows.at(-1)))rows.pop();return canonicalCircularCycle(rows);};
 for(const cell of r.cells){const spec=circularBoundarySpecification(pair,r.relation,cell.mask);if(canonicalCircular(cycle(cell.outer))!==canonicalCircular(canonicalCircularCycle(spec.outer))||canonicalCircular(cell.holes.map(cycle))!==canonicalCircular(spec.holes.map(canonicalCircularCycle)))fail('Actual Native cell coverage/wire semantics changed.');}
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
