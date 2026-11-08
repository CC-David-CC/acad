// Worker-only sufficient-domain proof; Native authority is the private ledger.
// The writer must still complete every existing per-region embedding check.
import {float64Dyadics} from './exactDyadicMeshPredicates.mjs';
import {captureBoxConstructionWitness} from '../../../../modules/engine/solid/boxConstructionWitness.mjs';
import {captureBoxSubtractConstruction} from '../../../../modules/engine/solid/rectilinearConstructionWitness.mjs';
const fail=reason=>{throw Object.assign(Error('Unqualified inset label interface: '+reason),{code:'UNQUALIFIED_REGION_INTERFACE',reason});};
const resource=reason=>{throw Object.assign(Error('Inset interface work budget exceeded'),{code:'RESOURCE_LIMIT',reason});};
const aborted=Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get;
const abs=x=>x<0n?-x:x,sub=(a,b)=>a.map((x,i)=>x-b[i]),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const nativeMeasurementTolerance=Object.freeze({volumeMm3:1e-6,boundsMm:1e-6});
// Exact convex SAT for POSITIVE-AREA triangle/open-rectangle intersection.
// Positive-Z triangle orientation is established by the caller. Boundary-only
// contact is allowed; no matching triangulation or coordinate welding required.
function intersectsOpenRectangle(q,minimum,maximum){
 for(let axis=0;axis<2;axis++){const values=q.map(p=>p[axis]);if(values.every(x=>x<=minimum[axis])||values.every(x=>x>=maximum[axis]))return false;}
 const corners=[[minimum[0],minimum[1]],[maximum[0],minimum[1]],[maximum[0],maximum[1]],[minimum[0],maximum[1]]];
 for(let i=0;i<3;i++){const a=q[i],b=q[(i+1)%3];if(corners.every(p=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0])<=0n))return false;}
 return true;
}
function faces(minimum,maximum,prefix){
 const d=maximum.map((x,i)=>x-minimum[i]),out=[];
 for(let axis=0;axis<3;axis++)for(let side=0;side<2;side++){
  const lo=minimum.slice(),hi=maximum.slice(),value=(side?maximum:minimum)[axis],other=[0,1,2].filter(i=>i!==axis);lo[axis]=hi[axis]=value;
  out.push({id:prefix+'-'+axis+'-'+side,axis,value,sign:side?1n:-1n,minimum:lo,maximum:hi,area:d[other[0]]*d[other[1]]});
 }return out;
}
export async function captureInsetPocketInterface({partId,regions},{signal}={}){
 if(typeof partId!=='string'||!partId||partId.length>128||!Array.isArray(regions)||regions.length!==2)fail('TWO_REGIONS_REQUIRED');
 if(regions[0].id===regions[1].id||regions[0].bodyId===regions[1].bodyId||regions[0].featureId===regions[1].featureId||regions[0].materialId===regions[1].materialId)fail('DISTINCT_REGION_PRODUCERS_AND_MATERIALS_REQUIRED');
 if(signal!==undefined)try{aborted.call(signal);}catch{throw Object.assign(Error('Expected intrinsic AbortSignal'),{code:'INVALID_REQUEST'});}
 const started=performance.now(),deadline=started+30000,guard=()=>{if(signal!==undefined&&aborted.call(signal))throw new DOMException('Inset interface cancelled','AbortError');if(performance.now()>deadline)resource('INTERFACE_DEADLINE');};
 let lastYield=started;const checkpoint=async()=>{guard();if(performance.now()-lastYield>=8){await new Promise(resolve=>setTimeout(resolve,0));lastYield=performance.now();guard();}};guard();
 const pockets=regions.filter(r=>r.sourceConstruction?.kind==='authored-box-subtract'),labels=regions.filter(r=>r.sourceConstruction?.kind==='authored-axis-aligned-box');
 if(pockets.length!==1||labels.length!==1)fail('BOX_SUBTRACT_AND_BOX_LABEL_REQUIRED');
 const pocket=pockets[0],label=labels[0],expected=r=>({bodyId:r.bodyId,featureId:r.featureId,engine:r.engine,engineRevision:r.engineRevision});
 const construction=captureBoxSubtractConstruction(pocket.sourceConstruction,expected(pocket)),labelConstruction=captureBoxConstructionWitness(label.sourceConstruction,expected(label));
 if(construction.engineRevision!==labelConstruction.engineRevision)fail('MIXED_BUILDS');
 const sources=float64Dyadics([construction.a.origin,construction.a.dimensions,construction.b.origin,construction.b.dimensions,labelConstruction.origin,labelConstruction.dimensions]);
 const inputs=[pocket,label].map(r=>{
  if(!Array.isArray(r.vertices)||r.vertices.length<4||r.vertices.length>150000||!Array.isArray(r.triangles)||r.triangles.length<4||r.triangles.length>100000)resource('INTERFACE_MESH_LIMIT');
  const mesh=float64Dyadics(r.vertices),triangles=r.triangles.map(t=>{if(!Array.isArray(t)||t.length!==3||!t.every(i=>Number.isSafeInteger(i)&&i>=0&&i<mesh.points.length)||new Set(t).size!==3)fail('INVALID_REGION_TRIANGLE');return t.slice();});guard();return {region:r,mesh,triangles};
 });
 const exponent=Math.min(sources.exponent,...inputs.map(x=>x.mesh.exponent)),scale=(p,from)=>p.map(x=>{const n=x<<BigInt(from-exponent);if(abs(n).toString(2).length>1152)resource('INTERFACE_COORDINATE_BITS');return n;});
 const rows=sources.points.map(p=>scale(p,sources.exponent)),baseMin=rows[0],baseMax=baseMin.map((x,i)=>x+rows[1][i]),toolMin=rows[2],toolMax=toolMin.map((x,i)=>x+rows[3][i]),labelMin=rows[4],labelMax=labelMin.map((x,i)=>x+rows[5][i]);
 for(const p of [baseMax,toolMax,labelMax])if(p.some(x=>abs(x).toString(2).length>1152))resource('INTERFACE_COORDINATE_BITS');
 if([0,1].some(i=>!(baseMin[i]<toolMin[i]&&toolMin[i]<toolMax[i]&&toolMax[i]<baseMax[i]))||!(baseMin[2]<toolMin[2]&&toolMin[2]<baseMax[2]&&baseMax[2]<toolMax[2]))fail('NOT_STRICT_BLIND_POSITIVE_Z_POCKET');
 const fillMin=toolMin,fillMax=[toolMax[0],toolMax[1],baseMax[2]];
 if(labelMin.some((x,i)=>x!==fillMin[i])||labelMax.some((x,i)=>x!==fillMax[i]))fail('LABEL_NOT_EXACT_FLUSH_POCKET_FILL');
 // Numerical reporting corroboration is separate from the exact geometry
 // predicates. This allowance never determines interface/patch membership.
 const a=construction.a,b=construction.b,maximum=a.origin.map((x,i)=>x+a.dimensions[i]),depth=maximum[2]-b.origin[2],expectedVolume=a.dimensions[0]*a.dimensions[1]*a.dimensions[2]-b.dimensions[0]*b.dimensions[1]*depth;
 if(!Number.isFinite(expectedVolume)||expectedVolume<=0||Math.abs(construction.native.volume-expectedVolume)>nativeMeasurementTolerance.volumeMm3||construction.native.bounds.min.some((x,i)=>Math.abs(x-a.origin[i])>nativeMeasurementTolerance.boundsMm)||construction.native.bounds.max.some((x,i)=>Math.abs(x-maximum[i])>nativeMeasurementTolerance.boundsMm))fail('NATIVE_MEASUREMENT_NOT_CORROBORATED');
 const baseFaces=faces(baseMin,baseMax,'outer'),pocketFaces=faces(fillMin,fillMax,'pocket'),openingArea=(fillMax[0]-fillMin[0])*(fillMax[1]-fillMin[1]);
 const top=baseFaces.find(f=>f.axis===2&&f.sign===1n);top.area-=openingArea;top.opening={minimum:fillMin,maximum:fillMax};
 const inner=pocketFaces.filter(f=>!(f.axis===2&&f.sign===1n)).map(f=>({...f,sign:-f.sign}));
 const patchSets=[[...baseFaces,...inner],faces(labelMin,labelMax,'label')];let triangleCount=0;
 for(let n=0;n<inputs.length;n++){
  const input=inputs[n],points=input.mesh.points.map(p=>scale(p,input.mesh.exponent)),patches=patchSets[n],areas=patches.map(()=>0n),counts=patches.map(()=>0),low=n===0?baseMin:labelMin,high=n===0?baseMax:labelMax;
  for(const p of points)if(p.some((x,i)=>x<low[i]||x>high[i]))fail('CONSTRUCTION_MESH_EXTENT_MISMATCH');
  for(let i=0;i<input.triangles.length;i++){
   const q=input.triangles[i].map(index=>points[index]),normal=cross(sub(q[1],q[0]),sub(q[2],q[0])),matches=[];
   for(let j=0;j<patches.length;j++){const f=patches[j];if(q.every(p=>p[f.axis]===f.value&&p.every((x,k)=>x>=f.minimum[k]&&x<=f.maximum[k])))matches.push(j);}
   if(matches.length!==1)fail('UNEXPECTED_POCKET_OR_LABEL_SURFACE');const j=matches[0],f=patches[j];
   if(normal[f.axis]*f.sign<=0n||normal.some((x,k)=>k!==f.axis&&x!==0n))fail('INVALID_REGION_SURFACE_ORIENTATION');
   if(f.opening&&intersectsOpenRectangle(q,f.opening.minimum,f.opening.maximum))fail('TRIANGLE_CROSSES_OPEN_POCKET');
   areas[j]+=normal[f.axis]*f.sign;counts[j]++;if(areas[j].toString(2).length>8192)resource('INTERFACE_INTERMEDIATE_BITS');
   triangleCount++;if((i&255)===0)await checkpoint();
  }
  for(let i=0;i<patches.length;i++)if(!counts[i]||areas[i]!==2n*patches[i].area)fail('INCOMPLETE_REGION_PATCH_COVERAGE');guard();
 }
 const interfaces=inner.map(f=>Object.freeze({patch:f.id,axis:f.axis,exactArea:Object.freeze({numerator:f.area.toString(),exponent:2*exponent})}));
 return Object.freeze({version:1,method:'positive-z-blind-pocket-inset-v1',scope:'derived-construction-and-mesh',partId,pocket:Object.freeze({regionId:pocket.id,bodyId:pocket.bodyId,featureId:pocket.featureId}),label:Object.freeze({regionId:label.id,bodyId:label.bodyId,featureId:label.featureId}),interfaces:Object.freeze(interfaces),requires:'per-region-embedded-shell-validation',nativeMeasurementTolerance,work:Object.freeze({triangles:triangleCount,elapsedMs:performance.now()-started})});
}

