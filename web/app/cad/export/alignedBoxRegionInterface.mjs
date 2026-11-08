// Worker-only exact construction/interface observations. The private candidate
// ledger authenticates Native membership; serialized witnesses cannot do that.
// Success is used together with writeCore3mf's unchanged complete per-region
// manifold/embedding/orientation checks, not as a replacement for those checks.
import {float64Dyadics} from './exactDyadicMeshPredicates.mjs';
import {captureBoxConstructionWitness} from '../../../../modules/engine/solid/boxConstructionWitness.mjs';
const fail=(reason,message=reason)=>{throw Object.assign(Error(message),{code:'UNQUALIFIED_REGION_INTERFACE',reason});};
const resource=reason=>{throw Object.assign(Error('Box interface work budget exhausted'),{code:'RESOURCE_LIMIT',reason});};
const nativeAborted=Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get;
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],minus=(a,b)=>a.map((x,i)=>x-b[i]),abs=x=>x<0n?-x:x;
const bitLimit=1152,intermediateLimit=8192,deadlineMs=30000;
export async function captureFullFaceBoxInterface({partId,regions},{signal}={}){
 if(typeof partId!=='string'||!partId||partId.length>128||!Array.isArray(regions)||regions.length!==2)fail('TWO_BOX_REGIONS_REQUIRED');
 if(regions[0].id===regions[1].id||regions[0].bodyId===regions[1].bodyId||regions[0].featureId===regions[1].featureId)fail('DISTINCT_REGION_PRODUCERS_REQUIRED');
 if(regions[0].materialId===regions[1].materialId)fail('DISTINCT_MATERIALS_REQUIRED');
 if(signal!==undefined)try{nativeAborted.call(signal);}catch{throw Object.assign(Error('Expected intrinsic AbortSignal'),{code:'INVALID_REQUEST'});}
 const started=performance.now(),deadline=started+deadlineMs,guard=()=>{if(signal!==undefined&&nativeAborted.call(signal))throw new DOMException('Interface validation cancelled','AbortError');if(performance.now()>deadline)resource('INTERFACE_DEADLINE');};
 let lastYield=started;const checkpoint=async()=>{guard();if(performance.now()-lastYield>=8){await new Promise(resolve=>setTimeout(resolve,0));lastYield=performance.now();guard();}};
 // Encoder-created arrays have no main-realm aliases. Convert each mesh and
 // its exact captured constructor before the first yield or observer callback.
 guard();const inputs=regions.map(r=>{
  if(!r.sourceConstruction)fail('MISSING_BOX_CONSTRUCTION');
  const construction=captureBoxConstructionWitness(r.sourceConstruction,{bodyId:r.bodyId,featureId:r.featureId,engine:r.engine,engineRevision:r.engineRevision});
  if(!Array.isArray(r.vertices)||r.vertices.length<4||r.vertices.length>150000||!Array.isArray(r.triangles)||r.triangles.length<4||r.triangles.length>100000)resource('INTERFACE_MESH_LIMIT');
  const mesh=float64Dyadics(r.vertices),source=float64Dyadics([construction.origin,construction.dimensions]);
  const triangles=r.triangles.map(t=>{if(!Array.isArray(t)||t.length!==3||!t.every(i=>Number.isSafeInteger(i)&&i>=0&&i<mesh.points.length)||new Set(t).size!==3)fail('INVALID_REGION_TRIANGLE');return t.slice();});
  guard();return {r,construction,mesh,source,triangles};
 });
 const exponent=Math.min(...inputs.flatMap(x=>[x.mesh.exponent,x.source.exponent]));
 const scale=(point,from)=>point.map(x=>{const n=x<<BigInt(from-exponent);if(abs(n).toString(2).length>bitLimit)resource('INTERFACE_COORDINATE_BITS');return n;});
 const boxes=[];let triangleCount=0;
 for(const input of inputs){
  const minimum=scale(input.source.points[0],input.source.exponent),dimensions=scale(input.source.points[1],input.source.exponent),maximum=minimum.map((x,i)=>x+dimensions[i]);
  if(dimensions.some(x=>x<=0n))fail('NONPOSITIVE_BOX_DIMENSION');
  if(maximum.some(x=>abs(x).toString(2).length>bitLimit))resource('INTERFACE_COORDINATE_BITS');
  const points=input.mesh.points.map(p=>scale(p,input.mesh.exponent)),areas=Array.from({length:6},()=>0n),faceCounts=new Uint32Array(6);
  for(const p of points)if(p.some((x,i)=>x<minimum[i]||x>maximum[i]))fail('BOX_CONSTRUCTION_MESH_MISMATCH');
  for(let i=0;i<input.triangles.length;i++){
   const q=input.triangles[i].map(index=>points[index]),normal=cross(minus(q[1],q[0]),minus(q[2],q[0]));let face=-1;
   for(let axis=0;axis<3;axis++)for(let side=0;side<2;side++)if(q.every(p=>p[axis]===(side?maximum:minimum)[axis])){if(face>=0)fail('DEGENERATE_REGION_TRIANGLE');face=axis*2+side;}
   if(face<0)fail('NONBOX_REGION_SURFACE');const axis=Math.floor(face/2),outward=face%2?1n:-1n;
   if(normal[axis]*outward<=0n||normal.some((x,j)=>j!==axis&&x!==0n))fail('INVALID_BOX_SURFACE_ORIENTATION');
   areas[face]+=normal[axis]*outward;faceCounts[face]++;
   if(areas[face].toString(2).length>intermediateLimit)resource('INTERFACE_INTERMEDIATE_BITS');
   triangleCount++;if((i&255)===0)await checkpoint();
  }
  for(let face=0;face<6;face++){const axis=Math.floor(face/2),axes=[0,1,2].filter(x=>x!==axis);if(!faceCounts[face]||areas[face]!==2n*dimensions[axes[0]]*dimensions[axes[1]])fail('INCOMPLETE_BOX_SURFACE');}
  boxes.push({minimum,maximum,dimensions,input});guard();
 }
 const [a,b]=boxes,overlap=a.minimum.map((x,i)=>(a.maximum[i]<b.maximum[i]?a.maximum[i]:b.maximum[i])-(x>b.minimum[i]?x:b.minimum[i]));
 if(overlap.every(x=>x>0n))fail('REGION_INTERIOR_OVERLAP');if(overlap.some(x=>x<0n))fail('DISCONNECTED_REGIONS');
 const zero=overlap.flatMap((x,i)=>x===0n?[i]:[]);if(zero.length!==1)fail(zero.length===2?'EDGE_ONLY_REGION_CONTACT':'POINT_ONLY_REGION_CONTACT');
 const axis=zero[0],other=[0,1,2].filter(i=>i!==axis);if(other.some(i=>a.minimum[i]!==b.minimum[i]||a.maximum[i]!==b.maximum[i]))fail('PARTIAL_FACE_INTERFACE');
 const direction=a.maximum[axis]===b.minimum[axis]?1:a.minimum[axis]===b.maximum[axis]?-1:0;if(!direction)fail('NONOPPOSING_REGION_INTERIORS');guard();
 // Response-local exact area representation avoids rounding a successful
 // partition proof into a numerical tolerance claim or a persisted trust flag.
 const area=a.dimensions[other[0]]*a.dimensions[other[1]];
 return Object.freeze({version:1,method:'full-face-box-adjacency-v1',scope:'derived-construction-and-mesh',partId,regions:Object.freeze(inputs.map(x=>Object.freeze({regionId:x.r.id,bodyId:x.r.bodyId,featureId:x.r.featureId}))),axis,directionFromFirst:direction,exactArea:Object.freeze({numerator:area.toString(),exponent:2*exponent}),requires:'per-region-embedded-shell-validation',work:Object.freeze({triangles:triangleCount,elapsedMs:performance.now()-started})});
}
