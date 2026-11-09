// Worker-only, response-local evidence. Caller must separately authenticate the
// actual tool creation/request and current source/owner/build. Never save slots.
import {validateOwnedBooleanResult} from './ownedBooleanContract.mjs';
import {validatePrismProvenance,validateOwnedTopology} from './ownedTopologyContract.mjs';
import {preparePolygonProfileExtrusion} from './polygonProfilePlan.mjs';
import {reconcileNativeSelectionClaims} from './booleanSelectionClaims.mjs';
const fail=(code,message)=>{throw Object.assign(Error(message),{code});};
const lengthTolerance=1e-7,directionTolerance=1e-8;
function fields(value,keys){
 if(!value||typeof value!=='object'||Array.isArray(value)||![null,Object.prototype].includes(Object.getPrototypeOf(value))||Reflect.ownKeys(value).length!==keys.length)fail('INVALID_REQUEST','Expected exact private cylinder witness fields.');
 const out={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('INVALID_REQUEST','Witness fields must be own data.');out[key]=d.value;}return out;
}
// A single-circle construction record is tiny. Capture Native-shaped own data
// before any provenance read; never invoke getters or retain caller aliases.
function captureConstruction(value){
 const active=new Set(),encoder=new TextEncoder();let nodes=0,bytes=0;
 const charge=n=>{bytes+=n;if(bytes>16384)fail('ENGINE_FAILURE','Tool construction exceeds its capture budget.');};
 function visit(v,depth){
  if(depth>12||++nodes>512)fail('ENGINE_FAILURE','Tool construction exceeds its work bound.');
  if(v===null||typeof v==='boolean'){charge(v===null?4:v?4:5);return v;}
  if(typeof v==='number'){if(!Number.isFinite(v))fail('ENGINE_FAILURE','Nonfinite construction value.');charge(JSON.stringify(v).length);return v;}
  if(typeof v==='string'){if(v.length>128)fail('ENGINE_FAILURE','Construction text exceeds its bound.');charge(encoder.encode(JSON.stringify(v)).byteLength);return v;}
  if(!v||typeof v!=='object'||active.has(v))fail('ENGINE_FAILURE','Construction must be acyclic own data.');
  const array=Array.isArray(v),prototype=Object.getPrototypeOf(v),keys=Reflect.ownKeys(v);
  if(!array&&prototype!==null&&prototype!==Object.prototype)fail('ENGINE_FAILURE','Construction must be plain data.');
  const length=array?Object.getOwnPropertyDescriptor(v,'length')?.value:null;
  if(array&&(!Number.isSafeInteger(length)||length>256||keys.length!==length+1)||!array&&keys.length>32)fail('ENGINE_FAILURE','Construction members exceed their bound.');
  const members=array?Array.from({length},(_,i)=>String(i)):keys,out=array?[]:Object.create(null);active.add(v);charge(2+Math.max(0,members.length-1));
  for(const key of members){
   if(typeof key!=='string'||!array&&(key.length>64||key==='__proto__'))fail('ENGINE_FAILURE','Invalid construction key.');
   const d=Object.getOwnPropertyDescriptor(v,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('ENGINE_FAILURE','Construction members must be own data.');
   if(!array)charge(encoder.encode(JSON.stringify(key)).byteLength+1);out[key]=visit(d.value,depth+1);
  }
  active.delete(v);return Object.freeze(out);
 }
 return visit(value,0);
}
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function sameSupport(a,b){
 return Math.abs(a.radius-b.radius)<=lengthTolerance&&Math.hypot(...cross(a.axis,b.axis))<=directionTolerance&&Math.hypot(...cross(a.origin.map((n,i)=>n-b.origin[i]),b.axis))<=lengthTolerance;
}
export function deriveCylinderCutWitness(value){
 const input=fields(value,['operation','sourceTopologies','result','topology','toolConstruction','toolRequest']);
 if(input.operation!=='subtract')fail('DRAWING_WITNESS_UNSUPPORTED_OPERATION','Only an actual captured subtract operation is supported.');
 const capturedConstruction=captureConstruction(input.toolConstruction);
 const prepared=preparePolygonProfileExtrusion(input.toolRequest);
 if(prepared.loops.length!==1||prepared.loops[0].kind!=='circle')fail('DRAWING_WITNESS_UNSUPPORTED_TOOL','A single circular prism tool is required.');
 const validation=validateOwnedBooleanResult(input.result,{sourceTopologies:input.sourceTopologies,topology:input.topology});
 if(validation.reason!==null)fail('DRAWING_WITNESS_UNAVAILABLE','Native correspondence is unavailable: '+validation.reason);
 if(input.result.empty||input.result.solidCount!==1)fail('DRAWING_WITNESS_UNAVAILABLE','A current single-solid cut result is required.');
 const source=input.sourceTopologies[1],construction=validatePrismProvenance(capturedConstruction,source,prepared);
 if(construction.status!=='available')fail('DRAWING_WITNESS_UNAVAILABLE','Tool construction provenance is unavailable.');
 const sourceFace=construction.data.sourceLoops[0].edges[0].sweptFace,tool=source.faces[sourceFace-1];
 if(tool.type!=='cylinder')fail('ENGINE_FAILURE','The native circular prism side is not cylindrical.');
 const circle=prepared.loops[0],frame=prepared.frame,origin=frame.origin.map((n,i)=>n+frame.x[i]*circle.center[0]+frame.y[i]*circle.center[1]);
 if(!sameSupport(tool.analytic,{origin,axis:frame.z,radius:circle.radius}))fail('DRAWING_WITNESS_INPUT_MISMATCH','The captured tool request and actual cylinder disagree.');
 // Native copy-to-working mapping is already composed into original-source
 // ancestry rows. Applying sourceCopyB here again would change their meaning.
 const ancestry=input.result.ancestryB.data,row=ancestry.faces[sourceFace-1];
 if(row.generated.faces.length)fail('DRAWING_WITNESS_UNAVAILABLE','Generated-face correspondence is outside this witness contract.');
 const claims=reconcileNativeSelectionClaims({sources:[{claims:[{kind:'face',id:'private-tool-cylinder',sourceIndex:sourceFace}],ancestry}],topology:input.topology});
 const resolved=claims.resolved.find(r=>r.kind==='face'&&r.id==='private-tool-cylinder');
 if(!resolved)fail('DRAWING_WITNESS_UNAVAILABLE','The tool cylinder has no unique surviving descendant.');
 const resultFace=claims.resolveFace('private-tool-cylinder'),face=input.topology.faces[resultFace-1];
 if(face.type!=='cylinder'||!sameSupport(tool.analytic,face.analytic))fail('ENGINE_FAILURE','The selected native descendant changed cylindrical support.');
 const cylinder=Object.freeze({origin:Object.freeze([...face.analytic.origin]),axis:Object.freeze([...face.analytic.axis]),radius:face.analytic.radius});
 return Object.freeze({version:1,unit:'millimeter',scope:'response-local',persistentIds:false,sourceCurveId:prepared.request.region.outer[0].id,sourceFace,resultFace,cylinder,diameter:2*cylinder.radius,method:'native-prism-cut-b-ancestry'});
}

// Actual single-prism seed; the owning Worker binds the constructor invocation.
// Used before that tool's real Native union inputs are released.
export function captureCylinderToolWitness(value){
 const input=fields(value,['topology','toolConstruction','toolRequest']);
 validateOwnedTopology(input.topology);
 const construction=captureConstruction(input.toolConstruction),prepared=preparePolygonProfileExtrusion(input.toolRequest);
 if(prepared.loops.length!==1||prepared.loops[0].kind!=='circle')fail('DRAWING_WITNESS_UNSUPPORTED_TOOL','A single circular prism tool is required.');
 const proof=validatePrismProvenance(construction,input.topology,prepared);
 if(proof.status!=='available')fail('DRAWING_WITNESS_UNAVAILABLE','Tool prism provenance is unavailable.');
 const sourceFace=proof.data.sourceLoops[0].edges[0].sweptFace,face=input.topology.faces[sourceFace-1],circle=prepared.loops[0],frame=prepared.frame;
 const origin=frame.origin.map((n,i)=>n+frame.x[i]*circle.center[0]+frame.y[i]*circle.center[1]);
 if(face?.type!=='cylinder'||!sameSupport(face.analytic,{origin,axis:frame.z,radius:circle.radius}))fail('DRAWING_WITNESS_INPUT_MISMATCH','The actual tool cylinder differs from its captured construction.');
 const cylinder=Object.freeze({origin:Object.freeze([...face.analytic.origin]),axis:Object.freeze([...face.analytic.axis]),radius:face.analytic.radius});
 return Object.freeze({version:1,unit:'millimeter',scope:'response-local',persistentIds:false,sourceCurveId:prepared.request.region.outer[0].id,sourceFace,resultFace:sourceFace,cylinder,diameter:2*cylinder.radius,method:'native-prism-construction'});
}
