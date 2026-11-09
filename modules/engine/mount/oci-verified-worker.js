// Research bootstrap. Trusted packaging must pin this file itself. It hashes
// runtime bytes before execution and never creates window/document shims.
// One native-runtime initializer and one asynchronous operation own the realm.
let workerPhase = 'new';
function closeWorker(){workerPhase='closed';self.close();}
let maxNames = 8, nextName = 0, safeOwnedMode = false, selectedVersion = 2, edgeTreatmentMode = false, booleanHistoryMode = false, throughHoleMode = false, linearHolePatternMode = false, revolveMode = false, sweepMode = false, loftMode = false, stepExportMode = false, nativeRuntimeRevision = null;
let sweepRefusalCodes=[],loftRefusalCodes=[],loftPreparationRefusalCodes=[];
let exactSignedMeshVolume=null, volumeScratch=null;
let orthographicReadMode=false,orthographicAPI=null,orthographicCodec=null;
let drawingReferencesMode=false,drawingFactsAPI=null;
let planarAttachmentsMode=false,planarAttachmentFacts=null;
const selectedDrawingCylinders=new Map();
let manufacturingMeshMode=false,manufacturingAPI=null,manufacturingCodec=null;
let shellMode=false,shellAPI=null,shellWorker=null;
const shapes = new Map(), prismProfiles = new Map(), centeredResults = new Map(), enclosureShapes = new Map();
const selectedPrismProvenance=new Map();
// Full response-local graph stays in this realm; main receives a small certificate.
const circularPrismConstruction=new Map();
let circularMode=false,circularWorker=null,circularPlan=null;
const circularCapture=()=>circularMode?circularWorker.captureCircularSelectionBoundaryRef:undefined;
const selectedSelectionIndices=new Map();
const selectedSourceProfiles=new Map();
// Ephemeral authenticated causal witnesses, never sourceContexts or saved
// geometry. Descendants may retain a witness after its old result is disposed.
const selectedHoleStates=new Map();
const freezeOwnedData=v=>{if(v&&typeof v==='object'){for(const x of Object.values(v))freezeOwnedData(x);Object.freeze(v);}return v;};
function bindHoleSourceProducer(token,featureId){
 const state=selectedHoleStates.get(token);
 if(state&&state.source.token===token&&state.producerFeatureId===null)selectedHoleStates.set(token,Object.freeze({...state,producerFeatureId:featureId,featureIds:Object.freeze([featureId])}));
}
function carryHoleState(parentToken,token,producerFeatureId,featureId,hole=null,sourceToken=null){
 const state=selectedHoleStates.get(parentToken);
 if(!state||state.producerFeatureId!==producerFeatureId||state.featureIds.length>=32||state.featureIds.includes(featureId)||!shapes.has(state.source.token)||selectedSourceProfiles.get(state.source.token)!==state.source.profile)return;
 let holes=state.holes;
 if(hole){
  if(state.source.token!==sourceToken||holes.length>=16||holes.some(h=>h.intent.featureId===featureId||['engineRevision','sourceFeatureId','sourceFaceId','sourceRegionId'].some(k=>h.intent[k]!==hole[k])))return;
  holes=Object.freeze([...holes,Object.freeze({source:state.source,intent:hole})]);
 }
 selectedHoleStates.set(token,Object.freeze({source:state.source,producerFeatureId:featureId,featureIds:Object.freeze([...state.featureIds,featureId]),holes}));
}
// Selected-owned results are charged once, including consumed intermediates.
// This bounds unique result work/display, not native peak allocation or RSS.
const selectedResultTriangles=new Map();let selectedTriangleTotal=0;const selectedTriangleLimit=100000;
const resourceLimit=message=>{throw Object.assign(Error(message),{code:'RESOURCE_LIMIT'});};
function releaseSelectedName(name){const before=Module._OwnedShapeNamesV2(),ptr=str2C(name);let released;try{released=Module._ReleaseOwnedShapeV2(ptr);}finally{_free(ptr);}if(released!==1||Module._OwnedShapeNamesV2()!==before-1)bad('Native budget-refusal release failed');}
function chargeSelectedResult(name,evidence){
 if(!safeOwnedMode)return;const triangles=evidence?.triangles;
 if(!Number.isSafeInteger(triangles)||triangles<0)bad('Invalid selected result triangle count');
 if(selectedResultTriangles.has(name)){if(selectedResultTriangles.get(name)!==triangles)bad('Selected result tessellation changed');return;}
 if(triangles>selectedTriangleLimit-selectedTriangleTotal){releaseSelectedName(name);resourceLimit('Selected candidate cumulative result triangle budget exhausted');}
 selectedResultTriangles.set(name,triangles);selectedTriangleTotal+=triangles;
}
function checkSelectedMesh(name,evidence){if(safeOwnedMode&&(!selectedResultTriangles.has(name)||selectedResultTriangles.get(name)!==evidence.triangles))bad('Selected mesh does not match its charged result');}
const bad = message => { throw Error(message); };
// Only the root-mounted immutable app namespace may reuse the HTTP cache.
// Every body is still cryptographically verified. Other mounts stay no-store.
function immutableRuntimeAssetURL(url,raw){
 if(url.username||url.password||url.search||url.hash||(raw!==url.pathname&&raw!==url.href))return false;
 const match=/^\/assets\/desktop\/apps\/[a-z][a-z0-9-]{0,31}\/[a-f0-9]{64}\/(.+)$/.exec(url.pathname);
 return !!match&&match[1].split('/').every(part=>part&&part!=='.'&&part!=='..'&&/^[A-Za-z0-9._@~-]+$/.test(part));
}
class RuntimeAssetIntegrityError extends Error {}
async function verifiedAsset(asset, max) {
 if(!asset||typeof asset.sha256!=='string'||!/^[0-9a-f]{64}$/.test(asset.sha256)||typeof asset.path!=='string')bad('Invalid asset manifest');
 const url=new URL(asset.path,self.location.origin);
 if(url.origin!==self.location.origin||url.search||url.hash||url.username||url.password)bad('Asset must be same-origin');
 const immutable=immutableRuntimeAssetURL(url,asset.path);
 async function load(cache){
  const response=await fetch(url.href,{credentials:'omit',redirect:'error',cache});
  if(!response.ok||!response.body)bad('Runtime fetch failed');
  const reader=response.body.getReader(),chunks=[];let total=0,complete=false;
  try{while(true){const{value,done}=await reader.read();if(done){complete=true;break;}total+=value.byteLength;if(total>max)throw new RuntimeAssetIntegrityError('Runtime asset exceeds budget');chunks.push(value);}}
  finally{if(!complete)try{await reader.cancel();}catch{}reader.releaseLock();}
  const bytes=new Uint8Array(total);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}chunks.length=0;
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
  if(digest!==asset.sha256)throw new RuntimeAssetIntegrityError('Runtime digest mismatch');
  return bytes;
 }
 try{return await load(immutable?'force-cache':'no-store');}
 catch(error){if(!immutable||!(error instanceof RuntimeAssetIntegrityError))throw error;}
 // The failed attempt's body/chunks are out of scope and never executed. One
 // reload can repair a stale/corrupt HTTP-cache entry; there is no CacheStorage.
 return load('reload');
}

function call(command, args) {
  const ptrs = []; let array = 0;
  const alloc = text => {const n = lengthBytesUTF8(text)+1, p = _malloc(n); if (!p) bad('WASM allocation failed'); ptrs.push(p); stringToUTF8Array(text,HEAP8,p,n); return p;};
  try {
    const name = alloc(command), strings = [command,...args].map(x => alloc(String(x)));
    array = _malloc(strings.length*4); if (!array) bad('WASM allocation failed');
    strings.forEach((p,i) => Module.setValue(array+i*4,p,'i32'));
    const rc = Module._CallCommand(name, strings.length, array); if (rc !== 0) bad('OCC command failed: '+command+' ('+rc+')');
  } finally {if (array) _free(array); for (const p of ptrs) _free(p);}
}
// The pinned interpreter retains raw names for point/curve registries. Keep
// every command argument alive until the entire bounded Worker is terminated.
// gcarc is exceptional: its successful segment return value is 1, not 0.
const retained=[];
function callProfile(command, args, success=0) {
  let array=0;
  const alloc=text=>{const n=lengthBytesUTF8(text)+1,p=_malloc(n);if(!p)bad('WASM allocation failed');retained.push(p);stringToUTF8Array(text,HEAP8,p,n);return p;};
  try {const name=alloc(command),strings=[command,...args].map(x=>alloc(String(x)));array=_malloc(strings.length*4);if(!array)bad('WASM allocation failed');strings.forEach((p,i)=>Module.setValue(array+i*4,p,'i32'));const rc=Module._CallCommand(name,strings.length,array);if(rc!==success)bad('OCC profile command failed: '+command+' ('+rc+')');}
  finally {if(array)_free(array);}
}
// Only the exact structured native refusal is a precision failure. Free-form
// diagnostics and malformed envelopes retain the generic integrity failure.
function throwNativeMeasurementFailure(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value)))return;
 const code=Object.getOwnPropertyDescriptor(value,'error'),version=Object.getOwnPropertyDescriptor(value,'version');
 if(Reflect.ownKeys(value).length===2&&code?.enumerable&&Object.hasOwn(code,'value')&&code.value==='MEASUREMENT_PRECISION_UNRESOLVED'&&version?.enumerable&&Object.hasOwn(version,'value')&&[1,2,3].includes(version.value))throw Object.assign(Error('Native mass integration precision was unresolved'),{code:code.value});
}
function ownedJSON(method,name) {
  if(typeof Module[method]!=='function')bad('Native owned-shape capability is unavailable');
  const ptr=str2C(name);try{globalThis.__OCI_EXCHANGE_VAL=null;Module[method](ptr);const result=globalThis.__OCI_EXCHANGE_VAL;throwNativeMeasurementFailure(result);if(!result||result.error)bad('Native owned-shape query failed');return result;}
  finally{_free(ptr);globalThis.__OCI_EXCHANGE_VAL=null;}
}
function interrogate(name) {
  if(safeOwnedMode)return ownedJSON('_ReadOwnedMeshV2',name);
  const ptr=str2C(name);retained.push(ptr);let result;
  try {globalThis.__OCI_EXCHANGE_VAL=null;Module._Interogate(ptr,false);result=globalThis.__OCI_EXCHANGE_VAL;}
  finally {globalThis.__OCI_EXCHANGE_VAL=null;}
  return result;
}
function readProductionHistory() {
  globalThis.__OCI_EXCHANGE_VAL=null;
  try {Module._GetProductionHistory();return globalThis.__OCI_EXCHANGE_VAL;}
  finally {globalThis.__OCI_EXCHANGE_VAL=null;}
}
// Area vector of the authored polygon, translated before cross products to
// avoid cancellation at a distant origin. Positive orientation is required.
function expectedPrismVolume(vertices, direction, depth) {
  if (!Array.isArray(vertices) || vertices.length!==4 || vertices.some(p=>!Array.isArray(p)||p.length!==3||p.some(n=>!Number.isFinite(n))) ||
      !Array.isArray(direction) || direction.length!==3 || direction.some(n=>!Number.isFinite(n)) || !Number.isFinite(depth) || depth<=0) bad('Invalid prism volume inputs');
  const origin=vertices[0], area=[0,0,0];
  for (let i=0;i<vertices.length;i++) {
    const a=vertices[i].map((n,j)=>n-origin[j]),b=vertices[(i+1)%vertices.length].map((n,j)=>n-origin[j]);
    area[0]+=(a[1]*b[2]-a[2]*b[1])/2;
    area[1]+=(a[2]*b[0]-a[0]*b[2])/2;
    area[2]+=(a[0]*b[1]-a[1]*b[0])/2;
  }
  const volume=area.reduce((sum,n,i)=>sum+n*direction[i],0)*depth;
  if (!Number.isFinite(volume) || volume<=0) bad('Degenerate or incorrectly oriented prism profile');
  return volume;
}
// One reusable <=7.2MB measurement scratch, retained until Worker close.
function exactOrientedMesh(result){
 if(typeof exactSignedMeshVolume!=='function')bad('Exact mesh integral was not initialized');
 if(!volumeScratch)volumeScratch=new Float64Array(100000*9);
 const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];let triangles=0,offset=0;
 for(const face of result.faces){
  if(typeof face.inverted!=='boolean'||!Array.isArray(face.tess))bad('Missing oriented tessellation');
  for(const item of face.tess){
   const tri=item?.[0];if(!Array.isArray(tri)||tri.length!==3||++triangles>100000)bad('Invalid triangles');
   for(let j=0;j<3;j++){
    const p=tri[face.inverted&&j!==0?3-j:j];if(!Array.isArray(p)||p.length!==3)bad('Invalid vertex');
    for(let axis=0;axis<3;axis++){const value=p[axis];if(typeof value!=='number'||!Number.isFinite(value))bad('Invalid vertex');min[axis]=Math.min(min[axis],value);max[axis]=Math.max(max[axis],value);volumeScratch[offset++]=value;}
   }
  }
 }
 return{triangles,bounds:{min,max},signedVolume:exactSignedMeshVolume(volumeScratch.subarray(0,offset)).signedVolume};
}
function profileEvidence(result, prepared, history, baseFace) {
  if(!result||!Array.isArray(result.faces)||result.faces.length!==6)bad('Prism did not return six faces');
  const quant=n=>Math.round(n*1e6), vertex=p=>p.map(quant).join(','), edges=new Map();
  let triangles=0;const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
  const faceVertices=result.faces.map(face=>{
    if(!Array.isArray(face.tess))bad('Missing tessellation');const vertices=new Set();
    for(const item of face.tess){const tri=item?.[0];if(!Array.isArray(tri)||tri.length!==3||++triangles>100000)bad('Invalid triangle');
      for(const p of tri){if(!Array.isArray(p)||p.length!==3||p.some(n=>!Number.isFinite(n)))bad('Invalid vertex');vertices.add(vertex(p));for(let i=0;i<3;i++){min[i]=Math.min(min[i],p[i]);max[i]=Math.max(max[i],p[i]);}}
      for(let i=0;i<3;i++){const a=vertex(tri[i]),b=vertex(tri[(i+1)%3]);if(a===b)bad('Degenerate triangle');const k=[a,b].sort().join('|'),entry=edges.get(k)||{count:0,direction:0};entry.count++;entry.direction+=(a<b?1:-1)*(face.inverted?-1:1);edges.set(k,entry);}

    }return vertices;
  });
  const baseEdges=baseFace?.faces?.[0]?.loops?.[0],usedBaseRefs=new Set();
  if(baseFace?.faces?.length!==1 || baseFace.faces[0]?.loops?.length!==1 || !Array.isArray(baseEdges) || baseEdges.length!==4)bad('Expected one bounded four-edge base face');
  const provenance=prepared.edges.map((edge,i)=>{
    const a=prepared.worldVertices[i],b=prepared.worldVertices[(i+1)%4],d=prepared.direction.map(n=>n*prepared.depth),points=[a,b,a.map((x,j)=>x+d[j]),b.map((x,j)=>x+d[j])].map(vertex);
    const matches=faceVertices.flatMap((set,index)=>points.every(p=>set.has(p))?[index]:[]);
    if(matches.length!==1)bad('Could not match an authored edge to a unique swept face');
    const av=vertex(a),bv=vertex(b);
    const baseMatches=baseEdges.filter(e=>Array.isArray(e.a)&&e.a.length===3&&e.a.every(Number.isFinite)&&Array.isArray(e.b)&&e.b.length===3&&e.b.every(Number.isFinite)&&
      ((vertex(e.a)===av&&vertex(e.b)===bv)||(vertex(e.a)===bv&&vertex(e.b)===av)));
    if(baseMatches.length!==1 || !Number.isSafeInteger(baseMatches[0].ref) || !Array.isArray(history?.generated))bad('Missing unique base-edge ancestry');
    const source=baseMatches[0].ref;if(usedBaseRefs.has(source))bad('Base-edge ancestry is not bijective');usedBaseRefs.add(source);
    const links=history.generated.filter(x=>Array.isArray(x.source)&&x.source[0]==='EDGE'&&x.source[1]===source).flatMap(x=>Array.isArray(x.targets)?x.targets:[]).filter(x=>Array.isArray(x)&&x[0]==='FACE');
    const faceRef=result.faces[matches[0]]?.ref;
    if(!Number.isSafeInteger(faceRef)||typeof result.faces[matches[0]].inverted!=='boolean'||links.length!==1||links[0][1]!==faceRef)bad('Kernel history did not prove the swept-face source');
    return {sourceEdgeId:edge.id,sourceReversed:edge.reversed,baseEdgeReversed:vertex(baseMatches[0].a)!==av,faceOrdinal:matches[0],faceInverted:result.faces[matches[0]].inverted===true,binding:'kernel-history-and-geometric-match'};
  });
  if(usedBaseRefs.size!==4 || new Set(provenance.map(p=>p.faceOrdinal)).size!==4)bad('Ambiguous swept faces');
  // Report only bounded structural capabilities. Native ptr/ref values and
  // edgeRef numbers never cross the realm and are not persistent identities.
  const edgeUses=new Map(),surfaceTypes=[],loopLengths=[],edgeFields=new Set(),curveTypes=new Set();
  for(const face of result.faces){
    if(!face.surface||!Array.isArray(face.loops)||face.loops.length>32)bad('Invalid topology summary');
    surfaceTypes.push(typeof face.surface.TYPE==='string'?face.surface.TYPE:'unreported');
    loopLengths.push(face.loops.map(loop=>{
      if(!Array.isArray(loop)||loop.length>128)bad('Invalid topology summary');
      for(const e of loop){if(!e||!Number.isSafeInteger(e.edgeRef)||e.edgeRef<1)bad('Missing edge grouping');edgeUses.set(e.edgeRef,(edgeUses.get(e.edgeRef)||0)+1);curveTypes.add(typeof e.curve?.TYPE==='string'?e.curve.TYPE:'unreported');Object.keys(e).filter(k=>!['ptr','ref','edgeRef'].includes(k)).forEach(k=>edgeFields.add(k));}return loop.length;
    }));
  }
  const topologySummary={surfaceTypes,loopLengths,edgeFieldNames:[...edgeFields].sort(),curveTypes:[...curveTypes].sort(),uniqueEdgeGroups:edgeUses.size,edgeUseCounts:[...edgeUses.values()].sort((a,b)=>a-b)};
  const integral=exactOrientedMesh(result);if(integral.triangles!==triangles)bad('Inconsistent oriented mesh');
  return {evidence:{faces:result.faces.length,triangles,bounds:{min,max},signedVolume:integral.signedVolume,triangulatedClosed:[...edges.values()].every(e=>e.count===2),triangleOrientationConsistent:[...edges.values()].every(e=>e.direction===0),topologySummary},provenance};
}
function nativeSolidFacts(name,ownedMetrics=null) {
  let value=ownedMetrics,method='occ-owned-solid-v2';
  if(value!==null){
    const bounds=value.nativeBounds;
    if(Object.keys(value).sort().join(',')!=='nativeBounds,nativeVolume,solidCount,valid,version'||value.version!==2||value.valid!==true||!Number.isSafeInteger(value.solidCount)||value.solidCount<0||!Number.isFinite(value.nativeVolume)||(value.solidCount===0?Math.abs(value.nativeVolume)>1e-12:value.nativeVolume<=0)||!bounds||Object.keys(bounds).sort().join(',')!=='max,min'||!['min','max'].every(k=>Array.isArray(bounds[k])&&bounds[k].length===3&&bounds[k].every(Number.isFinite))||bounds.min.some((n,i)=>n>bounds.max[i]))bad('Invalid native owned solid inspection');
  }else{
    if(typeof Module._InspectAnalyticV1!=='function')return null;
    const ptr=str2C(name);
    try{globalThis.__OCI_EXCHANGE_VAL=null;Module._InspectAnalyticV1(ptr);value=globalThis.__OCI_EXCHANGE_VAL;}
    finally{_free(ptr);globalThis.__OCI_EXCHANGE_VAL=null;}
    if(!value||value.version!==1||value.scope!=='response-local'||typeof value.valid!=='boolean'||!Number.isSafeInteger(value.solidCount)||value.solidCount<0||!Number.isFinite(value.signedVolume)||(value.solidCount===0&&Math.abs(value.signedVolume)>1e-12))bad('Invalid native solid inspection');
    if(!value.valid)bad('Native OCC result is invalid');
    method='occ-inspect-analytic-v1';
  }
  let nativeTopology=null;
  if(typeof Module._InspectTopologyCensusV1==='function'){
    const pointer=str2C(name);let census;
    try{globalThis.__OCI_EXCHANGE_VAL=null;Module._InspectTopologyCensusV1(pointer);census=globalThis.__OCI_EXCHANGE_VAL;}
    finally{_free(pointer);globalThis.__OCI_EXCHANGE_VAL=null;}
    const keys=['compounds','compsolids','solids','shells','faces','wires','edges','vertices'];
    if(!census||census.version!==1||census.scope!=='response-local'||census.isNull!==false||!Number.isSafeInteger(census.shapeType)||census.shapeType<0||census.shapeType>8||!Number.isSafeInteger(census.directChildren)||census.directChildren<0||census.directChildren>100000||!census.counts||Object.keys(census.counts).sort().join(',')!==keys.slice().sort().join(',')||keys.some(k=>!Number.isSafeInteger(census.counts[k])||census.counts[k]<0||census.counts[k]>100000)||census.counts.solids!==value.solidCount)bad('Invalid native topology census');
    nativeTopology={version:1,method:'occ-topology-census-v1',shapeType:census.shapeType,directChildren:census.directChildren,counts:census.counts};
  }
  return {solidCount:value.solidCount,nativeValidity:{method,valid:value.valid},nativeTopology};
}
function summarize(name, result) {
  if (!result && safeOwnedMode) result=interrogate(name);
  if (!result) {
    const ptr = str2C(name);
    try {globalThis.__OCI_EXCHANGE_VAL = null; Module._Interogate(ptr, false); result = globalThis.__OCI_EXCHANGE_VAL;}
    finally {_free(ptr); globalThis.__OCI_EXCHANGE_VAL = null;}
  }
  if (!result || !Array.isArray(result.faces) || result.faces.length > 1000) bad('Invalid OCC result');
  // Nonempty owned results use one qualified whole-solid read, not the legacy
  // face dump (which has a separate32-face diagnostic cap). Reuse it below.
  const metrics=safeOwnedMode&&result.faces.length>0?ownedJSON('_InspectOwnedSolidV2',name):null;
  const facts=nativeSolidFacts(name,metrics);
  // Faces alone cannot distinguish a genuine empty volume from a failed
  // interrogation or a lower-dimensional contact result.
  if (result.faces.length === 0) {
    if(!facts||facts.solidCount!==0||!facts.nativeTopology||facts.nativeTopology.shapeType!==0||facts.nativeTopology.directChildren!==0||['solids','compsolids','shells','faces','wires','edges','vertices'].some(k=>facts.nativeTopology.counts[k]!==0))return null;
    return {...(booleanHistoryMode?{nativeVolume:0,nativeBounds:null}:{}),faces:0,triangles:0,bounds:null,signedVolume:0,empty:true,resultKind:'empty',...facts,materialRegions:null,voidRegions:null,validLevel0:null,validLevel2:null,manifoldPredicate:null,volumeQuality:'tessellation-signed-integral'};
  }
  if(facts?.solidCount===0)return null;
  const integral=exactOrientedMesh(result),triangles=integral.triangles,{min,max}=integral.bounds,signed=integral.signedVolume;
  return {...(metrics?{nativeVolume:metrics.nativeVolume,nativeBounds:metrics.nativeBounds}:{}),faces:result.faces.length,triangles,bounds:{min,max},signedVolume:signed,empty:false,resultKind:facts?(facts.solidCount===1?'single-solid':'multi-solid'):'unclassified-nonempty',solidCount:facts?.solidCount??null,nativeValidity:facts?.nativeValidity??null,nativeTopology:facts?.nativeTopology??null,materialRegions:null,voidRegions:null,validLevel0:null,validLevel2:null,manifoldPredicate:null,volumeQuality:'tessellation-signed-integral'};
}
function nameFor(token) {const name=shapes.get(token); if (!name) bad('Unknown or disposed handle'); return name;}
function allocateName() {if (nextName>=maxNames) {if(safeOwnedMode)resourceLimit('OCC name budget exhausted');bad('OCC name budget exhausted');} return 'm'+(++nextName);}
function createOwnedProfileResult(prepared,name,version){
  const f=prepared.frame,values=[prepared.depth,...f.origin,...f.x,...f.y,...f.z,prepared.loops.length];
  if(version===3){values.length=0;values.push(...prepared.nativeValues);}else for(const loop of prepared.loops)if(loop.kind==='circle')values.push(1,...loop.center,loop.radius);else values.push(0,...loop.vertices.flat());
  const beforeNames=Module._OwnedShapeNamesV2(),ptr=str2C(name),data=_malloc(values.length*8);if(!data){_free(ptr);bad('Native profile allocation failed');}
  let created;try{HEAPF64.set(values,data/8);globalThis.__OCI_EXCHANGE_VAL=null;Module[version===3?'_CreateSelectedProfileV3':'_CreateSelectedProfileV2'](ptr,data,values.length);created=globalThis.__OCI_EXCHANGE_VAL;}finally{_free(data);_free(ptr);globalThis.__OCI_EXCHANGE_VAL=null;}
  if(created?.error==='MEASUREMENT_PRECISION_UNRESOLVED'){if(Module._OwnedShapeNamesV2()!==beforeNames)bad('Refused profile published an owned name');throwNativeMeasurementFailure(created);}
  if(!created||created.error||created.version!==version||created.valid!==true||created.solidCount!==1||Module._OwnedShapeNamesV2()!==beforeNames+1)bad('Native selected-profile construction failed');
  const expected=prepared.expected,tol=Math.max(1e-7,expected.volume*1e-9);
  if(Math.abs(created.nativeVolume-expected.volume)>tol||['min','max'].some(k=>!Array.isArray(created.nativeBounds?.[k])||created.nativeBounds[k].some((x,i)=>!Number.isFinite(x)||Math.abs(x-expected.bounds[k][i])>1e-6)))bad('Native profile geometry disagrees with analytic inputs');
  const evidence=summarize(name,interrogate(name));if(!evidence||evidence.solidCount!==1)bad('Profile result is not one valid solid');
  return {created,evidence};
}
function createOwnedRevolveResult(prepared,name){
 const values=prepared.nativeValues,before=Module._OwnedShapeNamesV2(),ptr=str2C(name),data=_malloc(values.length*8);let published=false;
 if(!data){_free(ptr);bad('Native revolution allocation failed');}
 try{
  HEAPF64.set(values,data/8);globalThis.__OCI_EXCHANGE_VAL=null;
  Module._CreateOwnedRevolveV1(ptr,data,values.length,...prepared.nativeAxis,prepared.request.angleRadians);
  const created=globalThis.__OCI_EXCHANGE_VAL;
  if(values.some((n,i)=>!Object.is(n,HEAPF64[data/8+i])))bad('Native revolution changed its captured face payload');
  if(created?.error){
   if(Module._OwnedShapeNamesV2()!==before)bad('Refused revolution published an owned name');
   throwNativeMeasurementFailure(created);
   if(!['REVOLVE_INVALID_REQUEST','REVOLVE_INVALID_PROFILE','REVOLVE_INVALID_AXIS','REVOLVE_AXIS_NOT_COPLANAR','REVOLVE_PROFILE_CROSSES_AXIS','REVOLVE_INVALID_ANGLE','REVOLVE_UNSUPPORTED_PROFILE','REVOLVE_FAILED','REVOLVE_INVALID_RESULT','REVOLVE_RESOURCE_LIMIT'].includes(created.error))bad('Native revolution integrity failure: '+String(created.error));
   throw Object.assign(Error(created.error),{code:created.error});
  }
  if(!created||Object.keys(created).sort().join(',')!=='nativeBounds,nativeVolume,solidCount,valid,version'||created.version!==1||created.valid!==true||created.solidCount!==1||!Number.isFinite(created.nativeVolume)||created.nativeVolume<=0||Module._OwnedShapeNamesV2()!==before+1)bad('Invalid native revolution result');
  const evidence=summarize(name,interrogate(name));
  if(!evidence||evidence.empty||evidence.solidCount!==1||evidence.nativeValidity?.valid!==true||evidence.nativeVolume!==created.nativeVolume||JSON.stringify(evidence.nativeBounds)!==JSON.stringify(created.nativeBounds))bad('Native revolution measurements disagree');
  chargeSelectedResult(name,evidence);published=true;return evidence;
 }finally{
  _free(data);_free(ptr);globalThis.__OCI_EXCHANGE_VAL=null;
  if(!published&&Module._OwnedShapeNamesV2()===before+1)releaseSelectedName(name);
 }
}
function createOwnedSweepResult(prepared,name){
 const values=prepared.nativeValues,before=Module._OwnedShapeNamesV2(),ptr=str2C(name),data=_malloc(values.length*8);let published=false,pathData=0;
 if(!data){_free(ptr);bad('Native sweep allocation failed');}
 try{
  pathData=_malloc(prepared.nativePathValues.length*8);if(!pathData)bad('Native sweep path allocation failed');HEAPF64.set(prepared.nativePathValues,pathData/8);
  HEAPF64.set(values,data/8);globalThis.__OCI_EXCHANGE_VAL=null;
  Module._CreateOwnedSweepV1(ptr,data,values.length,pathData,prepared.nativePathValues.length);
  const created=globalThis.__OCI_EXCHANGE_VAL;
  if(values.some((n,i)=>!Object.is(n,HEAPF64[data/8+i])))bad('Native sweep changed its captured face payload');
  if(prepared.nativePathValues.some((n,i)=>!Object.is(n,HEAPF64[pathData/8+i])))bad('Native sweep changed path payload');
  if(created?.error){
   if(Module._OwnedShapeNamesV2()!==before)bad('Refused sweep published an owned name');
   throwNativeMeasurementFailure(created);
   if(!sweepRefusalCodes.includes(created.error))bad('Native sweep integrity failure: '+String(created.error));
   throw Object.assign(Error(created.error),{code:created.error});
  }
  if(!created||Object.keys(created).sort().join(',')!=='nativeBounds,nativeVolume,solidCount,valid,version'||created.version!==1||created.valid!==true||created.solidCount!==1||!Number.isFinite(created.nativeVolume)||created.nativeVolume<=0||Module._OwnedShapeNamesV2()!==before+1)bad('Invalid native sweep result');
  const evidence=summarize(name,interrogate(name));
  if(!evidence||evidence.empty||evidence.solidCount!==1||evidence.nativeValidity?.valid!==true||evidence.nativeVolume!==created.nativeVolume||JSON.stringify(evidence.nativeBounds)!==JSON.stringify(created.nativeBounds))bad('Native sweep measurements disagree');
  chargeSelectedResult(name,evidence);published=true;return evidence;
 }finally{
  if(pathData)_free(pathData);_free(data);_free(ptr);globalThis.__OCI_EXCHANGE_VAL=null;
  if(!published&&Module._OwnedShapeNamesV2()===before+1)releaseSelectedName(name);
 }
}
function createOwnedLoftResult(prepared,name){
 const arrays=[...prepared.nativeSections,prepared.nativeCorrespondence],before=Module._OwnedShapeNamesV2(),ptr=str2C(name),pointers=[];let published=false;
 try{
  for(const values of arrays){const data=_malloc(values.length*8);if(!data)bad('Native loft allocation failed');pointers.push(data);HEAPF64.set(values,data/8);}
  globalThis.__OCI_EXCHANGE_VAL=null;Module._CreateOwnedLoftV1(ptr,pointers[0],arrays[0].length,pointers[1],arrays[1].length,pointers[2],arrays[2].length);
  const created=globalThis.__OCI_EXCHANGE_VAL;
  if(arrays.some((values,j)=>values.some((n,i)=>!Object.is(n,HEAPF64[pointers[j]/8+i]))))bad('Native loft changed its captured input payload');
  if(created?.error){
   if(Module._OwnedShapeNamesV2()!==before)bad('Refused loft published an owned name');
   throwNativeMeasurementFailure(created);
   if(created.error==='LOFT_INPUT_CHANGED')throw Object.assign(Error('Native loft input preservation failed'),{code:'LOFT_INPUT_CHANGED'});
   if(!loftRefusalCodes.includes(created.error))bad('Native loft integrity failure: '+String(created.error));
   throw Object.assign(Error(created.error),{code:created.error});
  }
  if(!created||Object.keys(created).sort().join(',')!=='nativeBounds,nativeVolume,solidCount,valid,version'||created.version!==1||created.valid!==true||created.solidCount!==1||!Number.isFinite(created.nativeVolume)||created.nativeVolume<=0||Module._OwnedShapeNamesV2()!==before+1)bad('Invalid native loft result');
  const evidence=summarize(name,interrogate(name));
  if(!evidence||evidence.empty||evidence.solidCount!==1||evidence.nativeValidity?.valid!==true||evidence.nativeVolume!==created.nativeVolume||JSON.stringify(evidence.nativeBounds)!==JSON.stringify(created.nativeBounds))bad('Native loft measurements disagree');
  chargeSelectedResult(name,evidence);published=true;return evidence;
 }finally{for(const p of pointers)_free(p);_free(ptr);globalThis.__OCI_EXCHANGE_VAL=null;if(!published&&Module._OwnedShapeNamesV2()===before+1)releaseSelectedName(name);}
}
async function exportOwnedSTEP(msg){
 const api=await import(new URL('./ownedStepExportProtocol.mjs',self.location.href));
 if(!msg||Reflect.ownKeys(msg).sort().join(',')!=='kind,seq,tokens'||!Number.isSafeInteger(msg.seq)||msg.seq<1||!Array.isArray(msg.tokens)||msg.tokens.length<1||msg.tokens.length>32||Reflect.ownKeys(msg.tokens).length!==msg.tokens.length+1)bad('Invalid STEP export request');
 const tokens=[];for(let i=0;i<msg.tokens.length;i++){const d=Object.getOwnPropertyDescriptor(msg.tokens,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value')||typeof d.value!=='string'||!d.value||d.value.length>256||tokens.includes(d.value))bad('Invalid STEP token');tokens.push(d.value);}
 const names=tokens.map(nameFor),beforeNames=Module._OwnedShapeNamesV2(),beforeNext=nextName,parts=[];
 let packed=0,scratch=0,resource=null,failure=null,output;
 const invoke=(method,...args)=>{globalThis.__OCI_EXCHANGE_VAL=null;try{const status=Module[method](...args);return {status,reply:globalThis.__OCI_EXCHANGE_VAL};}finally{globalThis.__OCI_EXCHANGE_VAL=null;}};
 const release=requireReleased=>{const call=invoke('_ReleaseOwnedStepExportV1',resource);api.checkStepNativeStatus(call.status,call.reply,'step.export.release');api.captureStepRelease(call.reply,resource,requireReleased);resource=null;};
 try{
  const bytes=new TextEncoder().encode(names.map(name=>name+'\0').join(''));if(bytes.byteLength<2||bytes.byteLength>2080)bad('Invalid packed STEP source names');
  packed=_malloc(bytes.byteLength);if(!packed)bad('STEP name allocation failed');new Uint8Array(HEAP8.buffer,packed,bytes.byteLength).set(bytes);
  const start=invoke('_BeginOwnedStepExportV1',packed,bytes.byteLength,names.length);api.checkStepNativeStatus(start.status,start.reply,'step.export.begin');const begin=api.captureStepBegin(start.reply,names.length);resource=begin.resourceId;
  self.postMessage({kind:'step-export-begun',seq:msg.seq,op:'solid.step.export'});
  await new Promise(resolve=>setTimeout(resolve,0));
  scratch=_malloc(65536);if(!scratch)bad('STEP read allocation failed');let offset=0;
  while(offset<begin.byteLength){
   const capacity=Math.min(65536,begin.byteLength-offset),call=invoke('_ReadOwnedStepExportV1',resource,offset,scratch,capacity);api.checkStepNativeStatus(call.status,call.reply,'step.export.read');const read=api.captureStepRead(call.reply,{resourceId:resource,offset,capacity,byteLength:begin.byteLength});
   parts.push(new Uint8Array(new Uint8Array(HEAP8.buffer,scratch,read.length)));offset+=read.length;
   if(parts.length>128)bad('STEP chunk work exceeded its bound');
   if(offset<begin.byteLength)await new Promise(resolve=>setTimeout(resolve,0));
  }
  const end=invoke('_ReadOwnedStepExportV1',resource,offset,scratch,1);api.checkStepNativeStatus(end.status,end.reply,'step.export.read');api.captureStepRead(end.reply,{resourceId:resource,offset,capacity:1,byteLength:begin.byteLength});
  release(true);
  const blob=new Blob(parts,{type:'application/octet-stream'});if(blob.size!==begin.byteLength)bad('STEP Blob size changed');
  output={blob,metadata:api.stepExportMetadata(begin)};
 }catch(cause){failure={cause};}
 finally{
  if(resource!==null)try{release(false);}catch(cause){failure={cause:Object.assign(Error('STEP resource cleanup was not established'),{code:'ENGINE_CLEANUP_FAILED',cause,operationError:failure?.cause})};}
  try{if(scratch)_free(scratch);if(packed)_free(packed);}catch(cause){failure={cause:Object.assign(Error('STEP scratch cleanup failed'),{code:'ENGINE_CLEANUP_FAILED',cause,operationError:failure?.cause})};}
  parts.length=0;
  if(Module._OwnedShapeNamesV2()!==beforeNames||nextName!==beforeNext||tokens.some((token,i)=>shapes.get(token)!==names[i]))failure={cause:Object.assign(Error('STEP export changed its native inputs'),{code:'STEP_EXPORT_INPUT_CHANGED',operationError:failure?.cause})};
 }
 if(failure)throw failure.cause;return output;
}

async function readOwnedManufacturingMesh(msg){
 const api=manufacturingAPI;
 if(!api||!manufacturingCodec||!msg||Reflect.ownKeys(msg).sort().join(',')!=='angularDeflectionRadians,kind,linearDeflectionMm,maxTriangles,maxVertices,relative,seq,token')bad('Invalid manufacturing mesh request');
 const captured={};for(const key of ['kind','seq','token','linearDeflectionMm','angularDeflectionRadians','relative','maxVertices','maxTriangles']){const d=Object.getOwnPropertyDescriptor(msg,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))bad('Manufacturing mesh fields must be own data');captured[key]=d.value;}
 if(captured.kind!=='solid-manufacturing-mesh'||!Number.isSafeInteger(captured.seq)||captured.seq<1||typeof captured.token!=='string'||!captured.token||captured.token.length>256)bad('Invalid manufacturing routing');
 const controls=api.captureManufacturingControls({linearDeflectionMm:captured.linearDeflectionMm,angularDeflectionRadians:captured.angularDeflectionRadians,relative:captured.relative,maxVertices:captured.maxVertices,maxTriangles:captured.maxTriangles});
 const name=nameFor(captured.token),beforeNames=Module._OwnedShapeNamesV2(),beforeNext=nextName,beforeTriangles=selectedTriangleTotal,beforeResults=selectedResultTriangles.size,names=new TextEncoder().encode(name+'\0');
 let namePointer=0,scratch=0,resource=null,bytes=null,output,failure=null,inputWritten=false;
 const invoke=(method,...args)=>{globalThis.__OCI_EXCHANGE_VAL=null;try{const status=Module[method](...args);return{status,reply:globalThis.__OCI_EXCHANGE_VAL};}finally{globalThis.__OCI_EXCHANGE_VAL=null;}};
 const release=required=>{const call=invoke('_ReleaseOwnedManufacturingMeshV1',resource);api.checkManufacturingNativeStatus(call.status,call.reply,'manufacturing.mesh.release');api.captureManufacturingRelease(call.reply,resource,required);resource=null;};
 try{
  if(names.length<2||names.length>65)bad('Invalid private manufacturing name');namePointer=_malloc(names.length);if(!namePointer)throw Object.assign(Error('Manufacturing argument allocation failed'),{code:'MANUFACTURING_MESH_RESOURCE_LIMIT'});new Uint8Array(HEAP8.buffer,namePointer,names.length).set(names);inputWritten=true;
  const start=invoke('_BeginOwnedManufacturingMeshV1',namePointer,names.length,controls.linearDeflectionMm,controls.angularDeflectionRadians,controls.relative?1:0,controls.maxVertices,controls.maxTriangles);api.checkManufacturingNativeStatus(start.status,start.reply,'manufacturing.mesh.begin');const begin=api.captureManufacturingBegin(start.reply,controls);resource=begin.resourceId;
  self.postMessage({kind:'manufacturing-mesh-begun',seq:captured.seq,op:'solid.manufacturing.mesh.read'});await new Promise(resolve=>setTimeout(resolve,0));
  scratch=_malloc(65536);if(!scratch)throw Object.assign(Error('Manufacturing scratch allocation failed'),{code:'MANUFACTURING_MESH_RESOURCE_LIMIT'});try{bytes=new ArrayBuffer(begin.byteLength);}catch(cause){throw Object.assign(Error('Manufacturing buffer allocation failed'),{code:'MANUFACTURING_MESH_RESOURCE_LIMIT',cause});}const target=new Uint8Array(bytes);let offset=0,chunks=0;
  while(offset<begin.byteLength){const capacity=Math.min(65536,begin.byteLength-offset),call=invoke('_ReadOwnedManufacturingMeshV1',resource,offset,scratch,capacity);api.checkManufacturingNativeStatus(call.status,call.reply,'manufacturing.mesh.read');const read=api.captureManufacturingRead(call.reply,{resourceId:resource,offset,capacity,byteLength:begin.byteLength});target.set(new Uint8Array(HEAP8.buffer,scratch,read.length),offset);offset+=read.length;if(++chunks>128)bad('Manufacturing mesh chunk work exceeded bound');if(offset<begin.byteLength)await new Promise(resolve=>setTimeout(resolve,0));}
  const end=invoke('_ReadOwnedManufacturingMeshV1',resource,offset,scratch,1);api.checkManufacturingNativeStatus(end.status,end.reply,'manufacturing.mesh.read');api.captureManufacturingRead(end.reply,{resourceId:resource,offset,capacity:1,byteLength:begin.byteLength});release(true);
  output=manufacturingCodec.decodeManufacturingMesh(bytes,begin,controls);
 }catch(cause){failure={cause};}
 finally{
  if(resource!==null)try{release(false);}catch(cause){failure={cause:Object.assign(Error('Manufacturing mesh resource cleanup was not established'),{code:'ENGINE_CLEANUP_FAILED',cause,operationError:failure?.cause})};}
  try{if(Module._OwnedShapeNamesV2()!==beforeNames||nextName!==beforeNext||selectedTriangleTotal!==beforeTriangles||selectedResultTriangles.size!==beforeResults||shapes.get(captured.token)!==name||inputWritten&&names.some((n,i)=>n!==new Uint8Array(HEAP8.buffer,namePointer,names.length)[i]))failure={cause:Object.assign(Error('Manufacturing mesh changed its owned source'),{code:'MANUFACTURING_MESH_INPUT_CHANGED',operationError:failure?.cause})};}catch(cause){failure={cause:Object.assign(Error('Manufacturing source verification failed'),{code:'ENGINE_FAILURE',cause,operationError:failure?.cause})};}
  for(const pointer of [scratch,namePointer])if(pointer)try{_free(pointer);}catch(cause){failure={cause:Object.assign(Error('Manufacturing scratch cleanup failed'),{code:'ENGINE_CLEANUP_FAILED',cause,operationError:failure?.cause})};}
  bytes=null;
 }
 if(failure)throw failure.cause;return output;
}

async function readOwnedOrthographic(msg){
 const api=orthographicAPI;
 if(!api||!orthographicCodec||!msg||Reflect.ownKeys(msg).sort().join(',')!=='frame,kind,seq,token'||!Number.isSafeInteger(msg.seq)||msg.seq<1||typeof msg.token!=='string'||!msg.token||msg.token.length>256||!Array.isArray(msg.frame)||msg.frame.length!==12||Reflect.ownKeys(msg.frame).length!==13)bad('Invalid owned orthographic read');
 const frame=[];for(let i=0;i<12;i++){const d=Object.getOwnPropertyDescriptor(msg.frame,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value')||typeof d.value!=='number'||!Number.isFinite(d.value)||Math.abs(d.value)>1e6)bad('Invalid orthographic frame data');frame.push(d.value);}
 const name=nameFor(msg.token),beforeNames=Module._OwnedShapeNamesV2(),beforeNext=nextName,names=new TextEncoder().encode(name+'\0');
 let namePointer=0,framePointer=0,scratch=0,resource=null,bytes=null,output,failure=null,inputWritten=false;
 const invoke=(method,...args)=>{globalThis.__OCI_EXCHANGE_VAL=null;try{const status=Module[method](...args);return{status,reply:globalThis.__OCI_EXCHANGE_VAL};}finally{globalThis.__OCI_EXCHANGE_VAL=null;}};
 const release=required=>{const call=invoke('_ReleaseOwnedOrthographicReadV1',resource);api.checkOrthographicNativeStatus(call.status,call.reply,'orthographic.read.release');api.captureOrthographicRelease(call.reply,resource,required);resource=null;};
 try{
  if(names.length<2||names.length>65)bad('Invalid private orthographic name');
  namePointer=_malloc(names.length);framePointer=_malloc(96);if(!namePointer||!framePointer)throw Object.assign(Error('Orthographic argument allocation failed'),{code:'ORTHOGRAPHIC_RESOURCE_LIMIT'});
  new Uint8Array(HEAP8.buffer,namePointer,names.length).set(names);HEAPF64.set(frame,framePointer/8);inputWritten=true;
  const start=invoke('_BeginOwnedOrthographicReadV1',namePointer,names.length,framePointer,12);api.checkOrthographicNativeStatus(start.status,start.reply,'orthographic.read.begin');const begin=api.captureOrthographicBegin(start.reply);resource=begin.resourceId;
  self.postMessage({kind:'orthographic-read-begun',seq:msg.seq,op:'solid.drawing.orthographic.read'});
  await new Promise(resolve=>setTimeout(resolve,0));
  scratch=_malloc(65536);if(!scratch)throw Object.assign(Error('Orthographic read allocation failed'),{code:'ORTHOGRAPHIC_RESOURCE_LIMIT'});bytes=new Uint8Array(begin.byteLength);let offset=0,chunks=0;
  while(offset<begin.byteLength){const capacity=Math.min(65536,begin.byteLength-offset),call=invoke('_ReadOwnedOrthographicReadV1',resource,offset,scratch,capacity);api.checkOrthographicNativeStatus(call.status,call.reply,'orthographic.read.chunk');const read=api.captureOrthographicChunk(call.reply,{resourceId:resource,offset,capacity,byteLength:begin.byteLength});bytes.set(new Uint8Array(HEAP8.buffer,scratch,read.length),offset);offset+=read.length;if(++chunks>64)bad('Orthographic chunk work exceeded its bound');if(offset<begin.byteLength)await new Promise(resolve=>setTimeout(resolve,0));}
  const end=invoke('_ReadOwnedOrthographicReadV1',resource,offset,scratch,1);api.checkOrthographicNativeStatus(end.status,end.reply,'orthographic.read.chunk');api.captureOrthographicChunk(end.reply,{resourceId:resource,offset,capacity:1,byteLength:begin.byteLength});release(true);
  output=orthographicCodec.decodeAndPackOrthographic(bytes.buffer,frame);
 }catch(cause){failure={cause};}
 finally{
  if(resource!==null)try{release(false);}catch(cause){failure={cause:Object.assign(Error('Orthographic resource cleanup was not established'),{code:'ENGINE_CLEANUP_FAILED',cause,operationError:failure?.cause})};}
  try{if(Module._OwnedShapeNamesV2()!==beforeNames||nextName!==beforeNext||shapes.get(msg.token)!==name||inputWritten&&(frame.some((n,i)=>!Object.is(n,HEAPF64[framePointer/8+i]))||names.some((n,i)=>n!==new Uint8Array(HEAP8.buffer,namePointer,names.length)[i])))failure={cause:Object.assign(Error('Orthographic read changed its owned input'),{code:'ORTHOGRAPHIC_INPUT_CHANGED',operationError:failure?.cause})};}catch(cause){failure={cause:Object.assign(Error('Orthographic input verification failed'),{code:'ENGINE_FAILURE',cause,operationError:failure?.cause})};}
  for(const pointer of [scratch,framePointer,namePointer])if(pointer)try{_free(pointer);}catch(cause){failure={cause:Object.assign(Error('Orthographic scratch cleanup failed'),{code:'ENGINE_CLEANUP_FAILED',cause,operationError:failure?.cause})};}
  bytes=null;
 }
 if(failure)throw failure.cause;return output;
}

async function applyOwnedBooleanResult(aName,bName,name,kind){
  const {validateOwnedTopology}=await import(new URL('./ownedTopologyContract.mjs',self.location.href));
  const sourceTopologies=[aName,bName].map(name=>validateOwnedTopology(ownedJSON('_ReadOwnedTopologyV1',name)));
  const before=Module._OwnedShapeNamesV2(),pointers=[];let created;
  try{
    const pointer=text=>{const p=str2C(text);pointers.push(p);return p;};
    const a=pointer(aName),b=pointer(bName),out=pointer(name);globalThis.__OCI_EXCHANGE_VAL=null;
    Module._ApplyOwnedBooleanHistoryV1(a,b,out,{union:0,subtract:1,common:2}[kind]);created=globalThis.__OCI_EXCHANGE_VAL;
  }finally{for(const p of pointers)_free(p);globalThis.__OCI_EXCHANGE_VAL=null;}
  const {validateOwnedBooleanResult,BOOLEAN_REFUSAL_CODES}=await import(new URL('./ownedBooleanContract.mjs',self.location.href));
  if(created?.error){
    if(Module._OwnedShapeNamesV2()!==before)bad('Refused Boolean published a native result');
   throwNativeMeasurementFailure(created);
    if(!BOOLEAN_REFUSAL_CODES.includes(created.error))bad('Native Boolean integrity failed: '+String(created.error));
    throw Object.assign(Error(created.error),{code:created.error});
  }
  if(Module._OwnedShapeNamesV2()!==before+1)bad('Invalid native Boolean ownership');
  const topology=validateOwnedTopology(ownedJSON('_ReadOwnedTopologyV1',name)),validation=validateOwnedBooleanResult(created,{sourceTopologies,topology});
  const evidence=summarize(name,interrogate(name));
  if(!evidence||evidence.solidCount!==created.solidCount||evidence.empty!==created.empty||Math.abs(evidence.nativeVolume-created.nativeVolume)>Math.max(1e-7,Math.abs(created.nativeVolume)*1e-9)||JSON.stringify(evidence.nativeBounds)!==JSON.stringify(created.nativeBounds))bad('Boolean result measurements disagree');
  return {created,topology,sourceTopologies,validation,evidence};
}
async function readOwnedDrawingReferences(msg){
 if(!drawingReferencesMode||!msg||Reflect.ownKeys(msg).sort().join(',')!=='definition,kind,producerFeatureId,seq,sourceToken,token')bad('Invalid owned drawing read');
 const definition=drawingFactsAPI.captureDrawingDefinition(msg.definition),name=nameFor(msg.token);nameFor(msg.sourceToken);
 const target=selectedSelectionIndices.get(msg.token),source=selectedSelectionIndices.get(msg.sourceToken),sourceProfile=selectedSourceProfiles.get(msg.sourceToken);
 if(!target||target.featureId!==msg.producerFeatureId||definition.target.featureId!==msg.producerFeatureId||definition.target.engineRevision!==nativeRuntimeRevision)bad('Drawing target producer/runtime is not current');
 if(!sourceProfile||sourceProfile.version===4||sourceProfile.region.boundaryProvenance||!source||source.featureId!==definition.datum.featureId||sourceProfile.region.id!==definition.datum.regionId)return drawingFactsAPI.unresolvedOwnedDrawingReferences(definition,'DRAWING_DATUM_UNAVAILABLE');
 const {validateOwnedTopology}=await import(new URL('./ownedTopologyContract.mjs',self.location.href)),topology=validateOwnedTopology(ownedJSON('_ReadOwnedTopologyV1',name));
 return drawingFactsAPI.resolveOwnedDrawingReferences({definition,topology,index:target.index,sourceProfile,sourceFeatureId:source.featureId,sourceRegionId:sourceProfile.region.id,cylinders:selectedDrawingCylinders.get(msg.token)||[]});
}
async function createOwnedThroughHoleResult(msg){
  const {captureOwnedHoleIntent}=await import(new URL('../solid/ownedHoleIntent.mjs',self.location.href));
  const request=captureOwnedHoleIntent(msg.request),refuse=(code,message)=>{throw Object.assign(Error(message),{code});};
  if(request.engineRevision!==nativeRuntimeRevision)refuse('INVALID_REQUEST','Hole intent belongs to another native runtime');
  const targetName=nameFor(msg.parentToken),sourceName=nameFor(msg.sourceToken),target=selectedSelectionIndices.get(msg.parentToken),source=selectedSelectionIndices.get(msg.sourceToken),sourceProfile=selectedSourceProfiles.get(msg.sourceToken);
  if(!target||!source||target.featureId!==request.producerFeatureId||source.featureId!==request.sourceFeatureId)refuse('INVALID_SELECTION_BINDING','Hole source or target producer is stale');
  if(sourceProfile?.version===4)refuse('UNSUPPORTED_PROFILE','Through holes require the supported whole rectangle source, not a circular arrangement cell');
  if(!target.index||!source.index||!sourceProfile)refuse('SELECTION_UNAVAILABLE','A genuine selected source extrusion is required');
  if(source.index.plan.source!=='prism-construction-history'||sourceProfile.region.id!==request.sourceRegionId||!target.index.plan.sourceContexts.some(c=>c.kind==='sketch-profile'&&c.featureId===request.sourceFeatureId&&c.regionId===request.sourceRegionId))refuse('STALE_SOURCE','The current target has no matching source construction');
  if(target.index.plan.sourceContexts.some(c=>c.featureId===request.featureId))refuse('INVALID_REQUEST','A hole feature cannot reuse a construction identity');
  const targetMetrics=ownedJSON('_InspectOwnedSolidV2',targetName),{planOwnedThroughHoles}=await import(new URL('./ownedThroughHolePlan.mjs',self.location.href)),plan=planOwnedThroughHoles({request,sourceProfile,targetMetrics});
  const cost=request.kind==='centered-through'?2:8;return{...await cutOwnedBoreTools(targetName,target,plan,targetMetrics,request.featureId,cost,{prior:selectedDrawingCylinders.get(msg.parentToken)||[],intent:request}),request};
}
async function cutOwnedBoreTools(targetName,target,plan,targetMetrics,featureId,cost,drawing=null){
  const refuse=(code,message)=>{throw Object.assign(Error(message),{code});};
  const {preparePolygonProfileExtrusion}=await import(new URL('./polygonProfilePlan.mjs',self.location.href)),live=new Set(),counts=[];
  const release=name=>{if(!live.has(name))bad('Internal hole name is not owned');releaseSelectedName(name);live.delete(name);};
  const charge=(name,evidence)=>{try{chargeSelectedResult(name,evidence);}catch(e){if(e?.code==='RESOURCE_LIMIT')live.delete(name);throw e;}counts.push(evidence.triangles);};
  let complete=false,finalName;
  try{
    const tools=[],trackBores=drawingReferencesMode&&drawing?.intent&&['centered-through','four-corner-through'].includes(drawing.intent.kind);
    if(trackBores&&(!Array.isArray(plan.slots)||plan.slots.length!==plan.toolProfiles.length))bad('Semantic bore slots differ from actual tool invocations');
    for(const [toolIndex,profile] of plan.toolProfiles.entries()){
      const prepared=preparePolygonProfileExtrusion(profile),name=allocateName(),result=createOwnedProfileResult(prepared,name,3);live.add(name);charge(name,result.evidence);tools.push({name,volume:result.created.nativeVolume,...(trackBores?{slot:plan.slots[toolIndex],prepared,construction:result.created.constructionProvenance}:{})});
    }
    const seed=async(t,topology)=>{
      try{const {captureCylinderToolWitness}=await import(new URL('./cylinderCutWitness.mjs',self.location.href));return Object.freeze({slot:t.slot,status:'available',reason:null,intent:drawing.intent,witness:captureCylinderToolWitness({topology,toolConstruction:t.construction,toolRequest:t.prepared.request})});}
      catch(e){if(!['DRAWING_WITNESS_UNAVAILABLE','DRAWING_WITNESS_UNSUPPORTED_TOOL'].includes(e?.code))throw e;return Object.freeze({slot:t.slot,status:'unresolved',reason:e.code,failedFeatureId:featureId,intent:drawing.intent});}
    };
    const carry=(rows,observation,topology)=>observation.status==='available'?drawingFactsAPI.propagateDrawingCylinders(rows,observation.data,topology,featureId):Object.freeze(rows.map(row=>row.status==='available'?Object.freeze({...row,status:'unresolved',reason:'DRAWING_REFERENCE_UNRESOLVED',failedFeatureId:featureId}):row));
    let tool=tools[0],expectedToolVolume=tool.volume;
    for(let i=1;i<tools.length;i++){
      const name=allocateName(),result=await applyOwnedBooleanResult(tool.name,tools[i].name,name,'union');live.add(name);charge(name,result.evidence);expectedToolVolume+=tools[i].volume;
      if(result.created.solidCount!==i+1||Math.abs(result.created.nativeVolume-expectedToolVolume)>Math.max(1e-7,expectedToolVolume*1e-9))refuse('TOOL_DOMAIN','Native tools did not retain the requested disjoint bores');
      let cylinders;
      if(trackBores){
       const prior=tool.cylinders||Object.freeze([await seed(tool,result.sourceTopologies[0])]),next=Object.freeze([await seed(tools[i],result.sourceTopologies[1])]);
       cylinders=Object.freeze([...carry(prior,result.created.ancestryA,result.topology),...carry(next,result.created.ancestryB,result.topology)]);
      }
      release(tool.name);release(tools[i].name);tool={name,volume:result.created.nativeVolume,...(trackBores?{cylinders}:{})};
    }
    finalName=allocateName();const result=await applyOwnedBooleanResult(targetName,tool.name,finalName,'subtract');live.add(finalName);charge(finalName,result.evidence);
    const expected=plan.expectedRemovedVolume,removed=targetMetrics.nativeVolume-result.created.nativeVolume,tolerance=Math.max(128*Number.EPSILON*Math.max(Math.abs(targetMetrics.nativeVolume),Math.abs(result.created.nativeVolume)),expected*1e-8);
    if(expected<=8*tolerance)refuse('TOOL_DOMAIN','Bore removal is below this model volume measurement resolution');
    if(result.created.empty||result.created.solidCount!==1||removed<=0||Math.abs(removed-expected)>tolerance)refuse('UNSUPPORTED_TARGET','The target does not retain the supported full prismatic material at every bore');
    let index=null,reason=result.validation.reason;
    if(!reason){const {deriveInheritedSelectionIndexV2}=await import(new URL('./selectionLineageIndex.mjs',self.location.href));try{index=deriveInheritedSelectionIndexV2({sourceIndex:target.index,ancestry:result.created.ancestryA.data,topology:result.topology,featureId:featureId},circularCapture());}catch(e){if(!['SELECTION_RESOURCE_LIMIT','SELECTION_UNAVAILABLE'].includes(e?.code))throw e;reason=e.code;}}
    if(JSON.stringify(ownedJSON('_InspectOwnedSolidV2',targetName))!==JSON.stringify(targetMetrics))bad('Hole operation changed its original target');
    if(counts.length!==cost)bad('Hole work accounting differs from native results');
    let cylinders=null;
    if(drawingReferencesMode){
      cylinders=result.created.ancestryA.status==='available'?drawingFactsAPI.propagateDrawingCylinders(drawing?.prior||[],result.created.ancestryA.data,result.topology,featureId):Object.freeze((drawing?.prior||[]).map(r=>r.status==='available'?Object.freeze({...r,status:'unresolved',reason:'DRAWING_REFERENCE_UNRESOLVED',failedFeatureId:featureId}):r));
      if(trackBores){
        const members=tool.cylinders||Object.freeze([await seed(tool,result.sourceTopologies[1])]);
        const current=carry(members,result.created.ancestryB,result.topology).map(row=>row.status==='available'?Object.freeze({...row,witness:Object.freeze({...row.witness,method:'native-prism-cut-b-ancestry'})}):row);
        cylinders=Object.freeze([...cylinders,...current]);
      }
    }
    complete=true;return{name:finalName,index,reason,cylinders,evidence:result.evidence,work:{version:1,nativeResults:cost,resultTriangles:counts}};
  }finally{for(const name of [...live])if(!complete||name!==finalName)release(name);}
}

async function createOwnedLinearHolePattern(msg){
 const {captureOwnedLinearHolePatternIntent,linearHolePatternNativeCost}=await import(new URL('../solid/ownedLinearHolePatternIntent.mjs',self.location.href));
 const request=captureOwnedLinearHolePatternIntent(msg.request),cost=linearHolePatternNativeCost(request.count),refuse=(code,message)=>{throw Object.assign(Error(message),{code});};
 if(request.engineRevision!==nativeRuntimeRevision)refuse('INVALID_REQUEST','Pattern belongs to another native runtime');
 const targetName=nameFor(msg.parentToken);nameFor(msg.sourceToken);
 const target=selectedSelectionIndices.get(msg.parentToken),source=selectedSelectionIndices.get(msg.sourceToken),state=selectedHoleStates.get(msg.parentToken),sourceProfile=selectedSourceProfiles.get(msg.sourceToken);
 if(!target||target.featureId!==request.producerFeatureId)refuse('INVALID_SELECTION_BINDING','Pattern target producer is stale');
 if(!state||state.producerFeatureId!==request.producerFeatureId||state.source.token!==msg.sourceToken||state.source.profile!==sourceProfile)refuse('UNSUPPORTED_TARGET_PATH','The target has no authenticated supported source/hole/edge path');
 const seeds=state.holes.filter(h=>h.intent.featureId===request.seedFeatureId);
 if(seeds.length!==1||seeds[0].source!==state.source||seeds[0].intent.kind!=='centered-through')refuse('UNSUPPORTED_SEED','The target has no unique successful centered seed witness');
 const seed=seeds[0].intent;
 if(sourceProfile?.version===4)refuse('UNSUPPORTED_PROFILE','Linear hole patterns require the supported whole rectangle source');
 if(!source||source.featureId!==seed.sourceFeatureId||!sourceProfile||sourceProfile.region.id!==seed.sourceRegionId)refuse('STALE_SOURCE','The live constructor differs from the successful seed source');
 if(!target.index||!source.index)refuse('SELECTION_UNAVAILABLE','The current target/source inherited selections are unavailable');
 if(state.featureIds.includes(request.featureId)||request.featureId===seed.sourceFeatureId)refuse('INVALID_REQUEST','A new pattern cannot reuse causal feature identity');
 const targetMetrics=ownedJSON('_InspectOwnedSolidV2',targetName),{planOwnedLinearHolePattern}=await import(new URL('./ownedLinearHolePatternPlan.mjs',self.location.href)),plan=planOwnedLinearHolePattern({request,seed,existingHoles:state.holes.map(h=>h.intent),sourceProfile,targetMetrics});
 return{...await cutOwnedBoreTools(targetName,target,plan,targetMetrics,request.featureId,cost,{prior:selectedDrawingCylinders.get(msg.parentToken)||[]}),request};
}

self.onmessage = async event => {
  const msg=event.data;let loftPreparedBinding=null;
  if(workerPhase==='closed')return;
  if(workerPhase==='initializing'||workerPhase==='busy'||workerPhase==='ready'&&msg?.kind==='init'){
    self.postMessage({kind:'refused',seq:msg?.seq,code:'BUSY',error:workerPhase==='initializing'?'Native runtime initialization is already in progress.':workerPhase==='busy'?'A native operation is already in progress.':'Native runtime initialization already completed.'});return;
  }
  const initializing=workerPhase==='new';
  workerPhase=initializing?'initializing':'busy';
  try {
    if (initializing) {
      if (msg?.kind!=='init' || msg.manifest?.version!==1) bad('Initialization required');
      safeOwnedMode=msg.nativeOwnership===2;maxNames=safeOwnedMode?32:8;
      if(msg.selectedProfileVersion!==undefined&&msg.selectedProfileVersion!==3)bad('Unsupported selected profile version');
      selectedVersion=msg.selectedProfileVersion===3?3:2;if(selectedVersion===3&&!safeOwnedMode)bad('Polygon profiles require owned native shapes');
      if(msg.edgeTreatments!==undefined&&msg.edgeTreatments!==1)bad('Unsupported edge treatment version');
      edgeTreatmentMode=msg.edgeTreatments===1;if(edgeTreatmentMode&&(!safeOwnedMode||selectedVersion!==3))bad('Edge treatments require owned polygon shapes');
      if(msg.booleanHistory!==undefined&&msg.booleanHistory!==1)bad('Unsupported Boolean history version');
      booleanHistoryMode=msg.booleanHistory===1;if(booleanHistoryMode&&!edgeTreatmentMode)bad('Boolean history requires the owned mechanical runtime');
      if(msg.throughHoles!==undefined&&msg.throughHoles!==1)bad('Unsupported through-hole version');
      throughHoleMode=msg.throughHoles===1;if(throughHoleMode&&!booleanHistoryMode)bad('Through holes require owned Boolean history');
      const exactModule=await import(new URL('./exactMeshVolume.mjs',self.location.href));
      if(typeof exactModule.measureExactSignedMeshVolume!=='function'||exactModule.MAX_EXACT_VOLUME_TRIANGLES!==100000)bad('Exact mesh integral module unavailable');
      exactSignedMeshVolume=exactModule.measureExactSignedMeshVolume;
      if(msg.linearHolePatterns!==undefined&&msg.linearHolePatterns!==1)bad('Unsupported linear hole pattern version');
      linearHolePatternMode=msg.linearHolePatterns===1;if(linearHolePatternMode&&!throughHoleMode)bad('Linear patterns require the owned through-hole runtime');
      if(msg.revolve!==undefined&&msg.revolve!==1)bad('Unsupported revolution version');
      revolveMode=msg.revolve===1;if(revolveMode&&(!safeOwnedMode||selectedVersion!==3))bad('Revolution requires owned polygon profiles');
      if(msg.sweep!==undefined&&msg.sweep!==1)bad('Unsupported sweep version');
      sweepMode=msg.sweep===1;if(sweepMode&&(!safeOwnedMode||selectedVersion!==3))bad('Sweep requires owned polygon profiles');
      if(sweepMode){const codes=await import(new URL('../solid/ownedSweepIntent.mjs',self.location.href));sweepRefusalCodes=codes.SWEEP_NATIVE_REFUSALS;}
      if(msg.loft!==undefined&&msg.loft!==1)bad('Unsupported loft version');
      if(msg.circularArrangementVersion!==undefined&&msg.circularArrangementVersion!==1)bad('Unsupported circular arrangement version');
      let circularRuntime=false;
      if(msg.circularArrangementVersion===1){
        if(!safeOwnedMode||selectedVersion!==3||!booleanHistoryMode||msg.shell!==1)bad('Circular arrangements require the complete owned selection-plan-v2 cohort');
        // Root supplies this literal-only module after compiling the frozen CPP.
        // Missing resource/pair mismatch fails initialization, never falls back.
        const pins=await import(new URL('./ownedCircularNativeContract.mjs',self.location.href));
        if(typeof pins.matchesCircularRuntime!=='function'||!pins.matchesCircularRuntime(msg.manifest.js?.sha256,msg.manifest.wasm?.sha256))bad('Circular Native pair is not the explicitly reviewed cohort');
        [circularWorker,circularPlan]=await Promise.all([import(new URL('./ownedCircularWorker.mjs',self.location.href)),import(new URL('./circularArrangementPlan.mjs',self.location.href))]);
        circularRuntime=true;circularMode=true;
      }
      const shellRuntime=circularRuntime||msg.manifest.js?.sha256==='57b74074e0a249b917ac68357fbd003c37d1ab61897206886b575088e6995858'&&msg.manifest.wasm?.sha256==='60dc956b08e01f43d08a48035a384e478e63bb34fb55f21a152c8cd12e8b8947';
      if(msg.shell!==undefined&&(msg.shell!==1||!shellRuntime||!safeOwnedMode||selectedVersion!==3||!booleanHistoryMode))bad('Shell requires its explicit owned Native cohort');
      if(msg.planarAttachments!==undefined&&(msg.planarAttachments!==1||!shellRuntime||msg.shell!==1||!throughHoleMode||!booleanHistoryMode))bad('Planar attachments require the explicit owned shell/source cohort');
      planarAttachmentsMode=msg.planarAttachments===1;if(planarAttachmentsMode)planarAttachmentFacts=await import(new URL('./nativePlanarAttachmentFacts.mjs',self.location.href));
      shellMode=msg.shell===1;if(shellMode)[shellAPI,shellWorker]=await Promise.all([import(new URL('./ownedShellProtocol.mjs',self.location.href)),import(new URL('./ownedShellWorker.mjs',self.location.href))]);
      const manufacturingRuntime=shellMode&&shellRuntime||msg.manifest.js?.sha256==='32eec74e3019d9e2d767c9016f05aa3daa49441c6102423a269d67b9c7f02a08'&&msg.manifest.wasm?.sha256==='abbf2aa02a6f2101c600aa1eedd20fa80ab2db206e677ca860d9c5103cdfbfcc';
      if(msg.manufacturingMesh!==undefined&&(msg.manufacturingMesh!==1||!manufacturingRuntime||msg.orthographicRead!==1||msg.stepExport!==1||msg.adaptiveMetrology!==1||msg.loft!==1))bad('Manufacturing mesh requires its exact owned Native cohort');
      manufacturingMeshMode=msg.manufacturingMesh===1;if(manufacturingMeshMode){[manufacturingAPI,manufacturingCodec]=await Promise.all([import(new URL('./ownedManufacturingMeshProtocol.mjs',self.location.href)),import(new URL('./manufacturingMeshRecord.mjs',self.location.href))]);}
      const orthographicRuntime=manufacturingMeshMode&&manufacturingRuntime||msg.manifest.js?.sha256==='2f2e9f92b2b57024b372143c3f2f4aa3dc4999bad7f6636c36f0b0f599f04cb7'&&msg.manifest.wasm?.sha256==='26d94303a8561b0922acae5b921f486e857083d8febaa9638d1ebd0eff590018';
      if(msg.orthographicRead!==undefined&&(msg.orthographicRead!==1||!orthographicRuntime||msg.stepExport!==1||msg.adaptiveMetrology!==1||msg.loft!==1))bad('Orthographic read requires its exact owned Native cohort');
      orthographicReadMode=msg.orthographicRead===1;
      if(orthographicReadMode){[orthographicAPI,orthographicCodec]=await Promise.all([import(new URL('./ownedOrthographicReadProtocol.mjs',self.location.href)),import(new URL('./orthographicAnalyticRecord.mjs',self.location.href))]);}
      if(msg.drawingReferences!==undefined&&(msg.drawingReferences!==1||!orthographicReadMode||!throughHoleMode||!booleanHistoryMode))bad('Drawing references require the explicit owned orthographic/hole cohort');
      drawingReferencesMode=msg.drawingReferences===1;if(drawingReferencesMode)drawingFactsAPI=await import(new URL('./drawingReferenceFacts.mjs',self.location.href));
      const stepRuntime=orthographicReadMode&&orthographicRuntime||msg.manifest.js?.sha256==='ca349411fc9e27677bf27072497abb22077d80c28e27ef073266966d16b07733'&&msg.manifest.wasm?.sha256==='c154a4e04961a9a50108fadcf72eca54169ba4db2e9564d24519f197e0568c2f';
      if(msg.stepExport!==undefined&&(msg.stepExport!==1||!stepRuntime||msg.loft!==1||msg.adaptiveMetrology!==1))bad('STEP requires its exact owned adaptive runtime');
      stepExportMode=msg.stepExport===1;
      const adaptiveRuntime=stepExportMode&&stepRuntime||msg.manifest.js?.sha256==='ed06b634a3e81f9a51c89f75b3d65e03b8ace1fc483900ea2858eae8eff970a4'&&msg.manifest.wasm?.sha256==='bc8895ceb123e33aad68c8a1cf6322b5c0ccef9bfb129207defe1b8a5a7c893a';
      if(msg.adaptiveMetrology!==undefined&&(msg.adaptiveMetrology!==1||!adaptiveRuntime||msg.loft!==1))bad('Adaptive metrology requires its explicit owned runtime');
      const oldLoftRuntime=msg.manifest.js?.sha256==='5ce2aa94ecdd48dc16f0b9c3ad2a065ea1416ddb7d123c3168661e31ade0a1b5'&&msg.manifest.wasm?.sha256==='b18af4376fb0fb8b4aaa7478ede6b47346c331ee45e1198347c0a70232fd4180';
      loftMode=msg.loft===1;if(loftMode&&(!safeOwnedMode||selectedVersion!==3||!(oldLoftRuntime||adaptiveRuntime&&msg.adaptiveMetrology===1)))bad('Loft requires its explicit owned polygon runtime');
      if(loftMode){const codes=await import(new URL('../solid/ownedLoftIntent.mjs',self.location.href));loftRefusalCodes=codes.LOFT_NATIVE_REFUSALS;loftPreparationRefusalCodes=codes.LOFT_PREPARATION_REFUSALS;}
      nativeRuntimeRevision='sha256:'+msg.manifest.js?.sha256+':'+msg.manifest.wasm?.sha256;
      const [js,wasm] = await Promise.all([verifiedAsset(msg.manifest.js, 1048576),verifiedAsset(msg.manifest.wasm, 41943040)]);
      self.Module = {wasmBinary:wasm, onRuntimeInitialized:() => {if(workerPhase!=='initializing')return;try {Module._InitCommands();if(circularMode&&!['_ReadCircularArrangementV1','_CreateOwnedCircularCellV1'].every(name=>typeof Module[name]==='function'))bad('Native circular arrangement ABI unavailable');if(shellMode&&(!Module._CreateOwnedBoxWithFacesV1||!Module._ApplyOwnedShellV1))bad('Native shell/box provenance unavailable');if(selectedVersion===3&&(!Module._CreateSelectedProfileV3||!Module._ReadOwnedTopologyV1))bad('Native polygon bindings unavailable');if(edgeTreatmentMode&&typeof Module._ApplyOwnedEdgeTreatmentV1!=='function')bad('Native edge treatments unavailable');if(booleanHistoryMode&&typeof Module._ApplyOwnedBooleanHistoryV1!=='function')bad('Native Boolean history unavailable');if(loftMode&&typeof Module._CreateOwnedLoftV1!=='function')bad('Native loft unavailable');if(stepExportMode&&!['_BeginOwnedStepExportV1','_ReadOwnedStepExportV1','_ReleaseOwnedStepExportV1'].every(name=>typeof Module[name]==='function'))bad('Native STEP export unavailable');if(manufacturingMeshMode&&!['_BeginOwnedManufacturingMeshV1','_ReadOwnedManufacturingMeshV1','_ReleaseOwnedManufacturingMeshV1'].every(name=>typeof Module[name]==='function'))bad('Native manufacturing mesh unavailable');if(orthographicReadMode&&!['_BeginOwnedOrthographicReadV1','_ReadOwnedOrthographicReadV1','_ReleaseOwnedOrthographicReadV1'].every(name=>typeof Module[name]==='function'))bad('Native orthographic read unavailable');if(sweepMode&&typeof Module._CreateOwnedSweepV1!=='function')bad('Native sweep unavailable');if(revolveMode&&typeof Module._CreateOwnedRevolveV1!=='function')bad('Native revolution unavailable');workerPhase='ready';self.postMessage({kind:'ready'});} catch(e) {self.postMessage({kind:'error',error:String(e)});closeWorker();}}};
      const blob=URL.createObjectURL(new Blob([js], {type:'text/javascript'}));
      try {importScripts(blob);} finally {URL.revokeObjectURL(blob);}
      return;
    }
    if(safeOwnedMode){if(!['selected-profile-extrude','box','common','union','subtract','solid-mesh','dispose',...(shellMode?['solid-shell']:[]),...(planarAttachmentsMode?['solid-face-frame']:[]),...(selectedVersion===3?['solid-topology','solid-point-classify','solid-prism-selections']:[]),...(edgeTreatmentMode?['solid-edge-treatment']:[]),...(booleanHistoryMode?['solid-selections']:[]),...(throughHoleMode?['solid-through-holes']:[]),...(linearHolePatternMode?['solid-linear-hole-pattern']:[]),...(revolveMode?['selected-profile-revolve']:[]),...(sweepMode?['selected-profile-sweep']:[]),...(loftMode?['selected-profile-loft']:[]),...(stepExportMode?['solid-step-export']:[]),...(orthographicReadMode?['solid-orthographic-read']:[]),...(drawingReferencesMode?['solid-drawing-references']:[]),...(manufacturingMeshMode?['solid-manufacturing-mesh']:[])].includes(msg?.kind))bad('Unsupported selected-owned operation');if(['selected-profile-extrude','selected-profile-revolve','selected-profile-sweep','selected-profile-loft','box','common','union','subtract','solid-edge-treatment','solid-through-holes','solid-linear-hole-pattern','solid-shell'].includes(msg.kind)&&(typeof msg.token!=='string'||!msg.token||msg.token.length>256||shapes.has(msg.token)))bad('Invalid or already owned result token');}
    if(msg?.kind==='solid-manufacturing-mesh'&&manufacturingMeshMode){const result=await readOwnedManufacturingMesh(msg);try{self.postMessage({kind:'manufacturing-mesh-result',seq:msg.seq,token:msg.token,...result},[result.buffer]);if(result.buffer.byteLength!==0)throw Error('Manufacturing buffer was not detached');}catch(cause){throw Object.assign(Error('Manufacturing result publication failed'),{code:'MANUFACTURING_MESH_PUBLICATION_FAILED',cause});}return;}
    if(msg?.kind==='solid-orthographic-read'&&orthographicReadMode){const result=await readOwnedOrthographic(msg);try{self.postMessage({kind:'orthographic-read-result',seq:msg.seq,...result},[result.values,result.tags]);}catch(cause){throw Object.assign(Error('Orthographic result publication failed'),{code:'ORTHOGRAPHIC_PUBLICATION_FAILED',cause});}return;}
    if(msg?.kind==='solid-step-export'&&stepExportMode){const result=await exportOwnedSTEP(msg);try{self.postMessage({kind:'step-exported',seq:msg.seq,...result});}catch(cause){throw Object.assign(Error('STEP result publication failed'),{code:'STEP_EXPORT_PUBLICATION_FAILED',cause});}return;}
    if(msg?.kind==='selected-profile-loft'&&loftMode){
      const {prepareOwnedLoft}=await import(new URL('./ownedLoftPlan.mjs',self.location.href));
      const prepared=await prepareOwnedLoft(msg.request);
      // One job/deadline/lifetime. No plan cache, new public task or native
      // allocation precedes the exact binding of this same captured request.
      self.postMessage({kind:'loft-prepared',seq:msg.seq,binding:prepared.binding});loftPreparedBinding=prepared.binding;
      const name=allocateName(),evidence=createOwnedLoftResult(prepared,name);
      shapes.set(msg.token,name);self.postMessage({kind:'result',seq:msg.seq,evidence,binding:prepared.binding});return;
    }
    if(msg?.kind==='selected-profile-sweep'&&sweepMode){
      const {prepareOwnedSweep}=await import(new URL('./ownedSweepPlan.mjs',self.location.href));
      const prepared=await prepareOwnedSweep(msg.request),name=allocateName();
      const evidence=createOwnedSweepResult(prepared,name);
      shapes.set(msg.token,name);self.postMessage({kind:'result',seq:msg.seq,evidence,binding:prepared.binding});return;
    }
    if(msg?.kind==='selected-profile-revolve'&&revolveMode){
      const {prepareOwnedRevolve}=await import(new URL('./ownedRevolvePlan.mjs',self.location.href));
      const prepared=await prepareOwnedRevolve(msg.request),name=allocateName();
      const evidence=createOwnedRevolveResult(prepared,name);
      shapes.set(msg.token,name);self.postMessage({kind:'result',seq:msg.seq,evidence,binding:prepared.binding});return;
    }
    if(msg?.kind==='selected-profile-extrude'&&msg.request?.version===4){
      if(!circularMode)throw Object.assign(Error('Circular cells require the explicitly registered cohort.'),{code:'UNSUPPORTED_PROFILE'});
      const prepared=await circularPlan.verifyCircularCellExtrusion(msg.request),env={Module,malloc:_malloc,free:_free,stringPointer:str2C,query:ownedJSON,interrogate,summarize};
      // Actual read qualifies every source span without reserving a name.
      circularWorker.inspectOwnedCircularSource(env,prepared);
      const name=allocateName(),result=circularWorker.createOwnedCircularResult(env,prepared,name);
      chargeSelectedResult(name,result.evidence);shapes.set(msg.token,name);
      freezeOwnedData(prepared.request);freezeOwnedData(result.construction);
      circularPrismConstruction.set(msg.token,{prepared,construction:result.construction});selectedPrismProvenance.set(msg.token,result.certificate);selectedSourceProfiles.set(msg.token,prepared.request);
      self.postMessage({kind:'result',seq:msg.seq,evidence:result.evidence,binding:{regionId:prepared.request.region.id,unit:'millimeter',profileVersion:4},constructionProvenance:result.certificate});return;
    }
    if (msg?.kind==='selected-profile-extrude') {
      const method=selectedVersion===3?'_CreateSelectedProfileV3':'_CreateSelectedProfileV2';
      if(!safeOwnedMode||typeof Module[method]!=='function')bad('Native selected-profile capability unavailable');
      const planner=await import(new URL(selectedVersion===3?'./polygonProfilePlan.mjs':'./selectedProfilePlan.mjs',self.location.href));let prepared;
      try{prepared=(selectedVersion===3?planner.preparePolygonProfileExtrusion:planner.prepareSelectedProfileExtrusion)(msg.request);if(prepared.request.region.boundaryProvenance){if(!booleanHistoryMode)throw Object.assign(Error('Arrangement cells require selection-plan-v2 provenance.'),{code:'UNSUPPORTED_PROFILE'});const {verifyArrangementSpanKeys}=await import(new URL('../extrusion/selectedArrangementDescriptor.mjs',self.location.href));await verifyArrangementSpanKeys(prepared.request.region.boundaryProvenance);}}catch(e){self.postMessage({kind:'refused',seq:msg.seq,code:e?.code||'INVALID_REQUEST',error:String(e?.message||e)});return;}
      const name=allocateName(),{created,evidence}=createOwnedProfileResult(prepared,name,selectedVersion);
      let constructionProvenance;
      if(selectedVersion===3){
        const {validateOwnedTopology,validatePrismProvenance,bindPrismSourceSlots}=await import(new URL('./ownedTopologyContract.mjs',self.location.href));
        const topology=created.constructionProvenance?.status==='available'?validateOwnedTopology(ownedJSON('_ReadOwnedTopologyV1',name)):null;
        constructionProvenance=bindPrismSourceSlots(validatePrismProvenance(created.constructionProvenance,topology,prepared),prepared);
      }
      chargeSelectedResult(name,evidence);shapes.set(msg.token,name);if(selectedVersion===3)selectedPrismProvenance.set(msg.token,constructionProvenance);if(throughHoleMode){freezeOwnedData(prepared.request);selectedSourceProfiles.set(msg.token,prepared.request);const source=Object.freeze({token:msg.token,profile:prepared.request});selectedHoleStates.set(msg.token,Object.freeze({source,producerFeatureId:null,featureIds:Object.freeze([]),holes:Object.freeze([])}));}
      self.postMessage({kind:'result',seq:msg.seq,evidence,binding:{regionId:prepared.request.region.id,unit:'millimeter',...(selectedVersion===3?{profileVersion:3}:{})},...(selectedVersion===3?{constructionProvenance}:{})});return;
    }
    if(msg?.kind==='solid-through-holes'&&throughHoleMode){
      const result=await createOwnedThroughHoleResult(msg);shapes.set(msg.token,result.name);selectedSelectionIndices.set(msg.token,{featureId:result.request.featureId,index:result.index,reason:result.reason});carryHoleState(msg.parentToken,msg.token,result.request.producerFeatureId,result.request.featureId,result.request,msg.sourceToken);if(drawingReferencesMode)selectedDrawingCylinders.set(msg.token,result.cylinders||Object.freeze([]));
      self.postMessage({kind:'result',seq:msg.seq,evidence:result.evidence,hole:result.request,work:result.work});return;
    }
    if(msg?.kind==='solid-linear-hole-pattern'&&linearHolePatternMode){const result=await createOwnedLinearHolePattern(msg);shapes.set(msg.token,result.name);selectedSelectionIndices.set(msg.token,{featureId:result.request.featureId,index:result.index,reason:result.reason});if(drawingReferencesMode)selectedDrawingCylinders.set(msg.token,result.cylinders||Object.freeze([]));self.postMessage({kind:'result',seq:msg.seq,evidence:result.evidence,pattern:result.request,work:result.work});return;}
    if(msg?.kind==='solid-selections'&&booleanHistoryMode){
      const name=nameFor(msg.token);if(!Number.isSafeInteger(msg.featureId)||msg.featureId<1)bad('Invalid authored feature identity');
      const provenance=selectedPrismProvenance.get(msg.token),cached=selectedSelectionIndices.get(msg.token);let selection;
      if(cached&&cached.featureId!==msg.featureId)throw Object.assign(Error('The result has a different producing feature'),{code:'INVALID_SELECTION_BINDING'});
      if(cached)selection=cached.index?{status:'available',plan:cached.index.plan}:{status:'unavailable',reason:cached.reason};
      else{
        let index=null,reason=provenance?.reason||'NO_AUTHORED_SOURCE_SELECTIONS';
        if(provenance?.status==='available'){
          const {validateOwnedTopology}=await import(new URL('./ownedTopologyContract.mjs',self.location.href)),{createPrismSelectionIndex}=await import(new URL('./prismSelectionIndex.mjs',self.location.href)),{liftPrismSelectionIndexV2}=await import(new URL('./selectionLineageIndex.mjs',self.location.href));
          const topology=validateOwnedTopology(ownedJSON('_ReadOwnedTopologyV1',name));
          try{if(provenance.sourceBinding.boundaryKind==='circular-source-spans'){const native=circularPrismConstruction.get(msg.token);if(!circularMode||!native)bad('Private circular constructor graph is unavailable');index=circularWorker.createCircularPrismSelectionIndexV2(msg.featureId,native.construction,topology,native.prepared);}else if(provenance.sourceBinding.boundaryKind==='source-spans'){const {createArrangedPrismSelectionIndexV2}=await import(new URL('./arrangedPrismSelectionIndex.mjs',self.location.href));index=createArrangedPrismSelectionIndexV2(msg.featureId,provenance,topology);}else index=liftPrismSelectionIndexV2({sourceIndex:createPrismSelectionIndex(msg.featureId,provenance,topology),featureId:msg.featureId,regionId:provenance.sourceBinding.regionId,topology});}
          catch(e){if(!['SELECTION_RESOURCE_LIMIT','SELECTION_UNAVAILABLE'].includes(e?.code))throw e;reason=e.code;}
        }
        selectedSelectionIndices.set(msg.token,{featureId:msg.featureId,index,reason:index?null:reason});
        selection=index?{status:'available',plan:index.plan}:{status:'unavailable',reason};
      }
      bindHoleSourceProducer(msg.token,msg.featureId);self.postMessage({kind:'result',seq:msg.seq,token:msg.token,featureId:msg.featureId,selection});return;
    }
    if(msg?.kind==='solid-prism-selections'&&selectedVersion===3&&!booleanHistoryMode){
      const name=nameFor(msg.token);if(!Number.isSafeInteger(msg.featureId)||msg.featureId<1)bad('Invalid authored prism feature identity');
      const provenance=selectedPrismProvenance.get(msg.token),cached=edgeTreatmentMode?selectedSelectionIndices.get(msg.token):null;let selection;
      if(cached&&cached.featureId!==msg.featureId)throw Object.assign(Error('The result has a different producing feature'),{code:'INVALID_SELECTION_BINDING'});
      if(cached)selection=cached.index?{status:'available',plan:cached.index.plan}:{status:'unavailable',reason:cached.reason};
      else if(!provenance||provenance.status!=='available')selection={status:'unavailable',reason:provenance?.reason||'NOT_A_PRISM_RESULT'};
      else{
        const {validateOwnedTopology}=await import(new URL('./ownedTopologyContract.mjs',self.location.href)),{createPrismSelectionIndex}=await import(new URL('./prismSelectionIndex.mjs',self.location.href));
        try{const index=createPrismSelectionIndex(msg.featureId,provenance,validateOwnedTopology(ownedJSON('_ReadOwnedTopologyV1',name)));selection={status:'available',plan:index.plan};if(edgeTreatmentMode)selectedSelectionIndices.set(msg.token,{featureId:msg.featureId,index});}
        catch(e){if(e?.code!=='SELECTION_RESOURCE_LIMIT')throw e;selection={status:'unavailable',reason:e.code};}
      }
      self.postMessage({kind:'result',seq:msg.seq,token:msg.token,featureId:msg.featureId,selection});return;
    }
    if(msg?.kind==='solid-edge-treatment'&&edgeTreatmentMode){
      const sourceName=nameFor(msg.parentToken),source=selectedSelectionIndices.get(msg.parentToken);
      const refused=(code,message)=>{throw Object.assign(Error(message),{code});};
      if(![msg.featureId,msg.producerFeatureId].every(n=>Number.isSafeInteger(n)&&n>0)||msg.featureId===msg.producerFeatureId||!['fillet','chamfer-equal'].includes(msg.treatment)||typeof msg.size!=='number'||!Number.isFinite(msg.size)||msg.size<=0||msg.size>1e6||!Array.isArray(msg.edgeIds)||msg.edgeIds.length<1||msg.edgeIds.length>16||msg.edgeIds.some(id=>typeof id!=='string'||!id||id.length>16384)||new Set(msg.edgeIds).size!==msg.edgeIds.length)refused('EDGE_TREATMENT_INVALID_REQUEST','Invalid edge treatment data');
      if(!source?.index)refused('SELECTION_UNAVAILABLE','The owned result has no resolved authored edge selections');
      if(source.featureId!==msg.producerFeatureId)refused('INVALID_SELECTION_BINDING','The result has a different producing feature');
      if(booleanHistoryMode&&source.index.plan.sourceContexts.some(c=>c.featureId===msg.featureId))refused('EDGE_TREATMENT_INVALID_REQUEST','A new feature cannot reuse a construction origin');
      const indices=msg.edgeIds.map(id=>source.index.resolveEdge(id)),name=allocateName(),before=Module._OwnedShapeNamesV2();
      let a=0,b=0,data=0,created;
      try{
        a=str2C(sourceName);b=str2C(name);data=_malloc(indices.length*4);if(!data)bad('Native edge allocation failed');
        Module.HEAP32.set(indices,data/4);globalThis.__OCI_EXCHANGE_VAL=null;
        Module._ApplyOwnedEdgeTreatmentV1(a,b,data,indices.length,msg.treatment==='fillet'?0:1,msg.size);created=globalThis.__OCI_EXCHANGE_VAL;
      }finally{if(data)_free(data);if(b)_free(b);if(a)_free(a);globalThis.__OCI_EXCHANGE_VAL=null;}
      if(created?.error){
        if(Module._OwnedShapeNamesV2()!==before)bad('Refused edge treatment published a native result');
        throwNativeMeasurementFailure(created);
        if(!['EDGE_TREATMENT_INVALID_REQUEST','EDGE_TREATMENT_INVALID_INPUT','EDGE_TREATMENT_UNSUPPORTED','EDGE_TREATMENT_FAILED','EDGE_TREATMENT_INVALID_RESULT','EDGE_TREATMENT_RESOURCE_LIMIT'].includes(created.error))bad('Native edge treatment integrity failed: '+String(created.error));
        refused(created.error,created.error);
      }
      if(!created||created.version!==1||created.valid!==true||created.solidCount!==1||!Number.isFinite(created.nativeVolume)||created.nativeVolume<=0||Module._OwnedShapeNamesV2()!==before+1)bad('Invalid native edge result');
      const {validateOwnedTopology}=await import(new URL('./ownedTopologyContract.mjs',self.location.href));
      const lineage=await import(new URL(booleanHistoryMode?'./selectionLineageIndex.mjs':'./selectionAncestryIndex.mjs',self.location.href)),deriveSelectionAncestryIndex=booleanHistoryMode?lineage.deriveEdgeSelectionIndexV2:lineage.deriveSelectionAncestryIndex;
      const topology=validateOwnedTopology(ownedJSON('_ReadOwnedTopologyV1',name));let index=null,reason=null;
      try{index=deriveSelectionAncestryIndex({sourceIndex:source.index,ancestry:created.ancestry,topology,featureId:msg.featureId,kind:msg.treatment,selectedEdgeIds:msg.edgeIds},circularCapture());}
      catch(e){if(!['SELECTION_RESOURCE_LIMIT',...(booleanHistoryMode?['SELECTION_UNAVAILABLE']:[])].includes(e?.code))throw e;reason=e.code;}
      const evidence=summarize(name,interrogate(name));if(!evidence||evidence.solidCount!==1||Math.abs(evidence.nativeVolume-created.nativeVolume)>Math.max(1e-7,created.nativeVolume*1e-9))bad('Edge result measurements disagree');
      chargeSelectedResult(name,evidence);shapes.set(msg.token,name);selectedSelectionIndices.set(msg.token,{featureId:msg.featureId,index,reason});carryHoleState(msg.parentToken,msg.token,msg.producerFeatureId,msg.featureId);if(drawingReferencesMode)selectedDrawingCylinders.set(msg.token,drawingFactsAPI.propagateDrawingCylinders(selectedDrawingCylinders.get(msg.parentToken)||[],created.ancestry,topology,msg.featureId));
      self.postMessage({kind:'result',seq:msg.seq,evidence,treatment:{version:1,featureId:msg.featureId,producerFeatureId:msg.producerFeatureId,kind:msg.treatment,size:msg.size,edgeIds:msg.edgeIds}});return;
    }
    if(msg?.kind==='solid-face-frame'&&planarAttachmentsMode){
      if(Reflect.ownKeys(msg).sort().join(',')!=='framePolicy,kind,originFeatureId,producerFeatureId,selectionId,seq,sourceFeatureId,sourceRegionId,sourceToken,token')bad('Invalid attachment read');
      const name=nameFor(msg.token);nameFor(msg.sourceToken);const target=selectedSelectionIndices.get(msg.token),source=selectedSelectionIndices.get(msg.sourceToken),profile=selectedSourceProfiles.get(msg.sourceToken);
      if(!target||target.featureId!==msg.producerFeatureId||!source||source.featureId!==msg.sourceFeatureId||msg.originFeatureId!==msg.sourceFeatureId||!profile||profile.region.id!==msg.sourceRegionId)throw Object.assign(Error('The actual attachment constructor is unavailable'),{code:'UNRESOLVED_SOURCE',reason:'DATUM_CHANGED'});
      const {validateOwnedTopology}=await import(new URL('./ownedTopologyContract.mjs',self.location.href)),topology=validateOwnedTopology(ownedJSON('_ReadOwnedTopologyV1',name));
      if(topology.solidCount!==1)throw Object.assign(Error('Attachment requires one current valid native solid'),{code:'UNSUPPORTED_FRAME_PARENT',reason:'UNSUPPORTED_CAP'});
      const observation=planarAttachmentFacts.resolveNativePlanarAttachment({topology,index:target.index,sourceProfile:profile,request:msg});
      self.postMessage({kind:'result',seq:msg.seq,token:msg.token,producerFeatureId:msg.producerFeatureId,observation});return;
    }
    if(msg?.kind==='solid-drawing-references'&&drawingReferencesMode){const observation=await readOwnedDrawingReferences(msg);self.postMessage({kind:'result',seq:msg.seq,token:msg.token,producerFeatureId:msg.producerFeatureId,observation});return;}
    if(msg?.kind==='solid-topology'&&selectedVersion===3){
      const name=nameFor(msg.token),{validateOwnedTopology}=await import(new URL('./ownedTopologyContract.mjs',self.location.href));
      const topology=validateOwnedTopology(ownedJSON('_ReadOwnedTopologyV1',name));
      self.postMessage({kind:'result',seq:msg.seq,token:msg.token,topology});return;
    }
    if(msg?.kind==='solid-point-classify'&&selectedVersion===3){
      const name=nameFor(msg.token),p=msg.point;
      if(!Array.isArray(p)||p.length!==3||p.some(n=>typeof n!=='number'||!Number.isFinite(n)||Math.abs(n)>4e6))bad('Invalid classification point');
      const ptr=str2C(name);let result;try{result=Module._ClassifyOwnedPointV2(ptr,...p);}finally{_free(ptr);}
      if(!Number.isInteger(result)||result<0||result>3)bad('Native point classification failed');
      self.postMessage({kind:'result',seq:msg.seq,token:msg.token,classification:['inside','outside','boundary','unknown'][result]});return;
    }
    if (msg?.kind==='profile-extrude') {
      if(msg.researchTopology!==undefined && (!msg.researchTopology || typeof msg.researchTopology!=='object' || Object.keys(msg.researchTopology).join(',')!=='version' || msg.researchTopology.version!==1))bad('Invalid research topology request');
      const {prepareRectangleExtrusion}=await import(new URL('./rectangleProfileRequest.mjs',self.location.href));
      let prepared;
      try {prepared=await prepareRectangleExtrusion(msg.profile);}
      catch(e) {self.postMessage({kind:'refused',seq:msg.seq,code:e?.code||'INVALID_REQUEST',error:String(e?.message||e)});return;}
      const name=allocateName(),edgeNames=[];
      for(let i=0;i<4;i++){
        const a=prepared.worldVertices[i],b=prepared.worldVertices[(i+1)%4],pa=name+'p'+i+'a',pb=name+'p'+i+'b',curve=name+'c'+i,edge=name+'e'+i;
        callProfile('point',[pa,...a]);callProfile('point',[pb,...b]);callProfile('gcarc',[curve,'seg',pa,pb],1);callProfile('mkedge',[edge,curve]);edgeNames.push(edge);
      }
      const wire=name+'wire',face=name+'face';callProfile('wire',[wire,...edgeNames]);callProfile('mkplane',[face,wire]);
      callProfile('prism',[name,face,...prepared.direction.map(n=>n*prepared.depth)]);
      const history=readProductionHistory(),baseFace=interrogate(face),result=interrogate(name),checked=profileEvidence(result,prepared,history,baseFace);
      const delta=prepared.direction.map(n=>n*prepared.depth),vertices=[...prepared.worldVertices,...prepared.worldVertices.map(p=>p.map((n,i)=>n+delta[i]))], expectedMin=[0,1,2].map(i=>Math.min(...vertices.map(p=>p[i]))),expectedMax=[0,1,2].map(i=>Math.max(...vertices.map(p=>p[i])));
      const expectedVolume=expectedPrismVolume(prepared.worldVertices,prepared.direction,prepared.depth);
      if(!checked.evidence.triangulatedClosed||!checked.evidence.triangleOrientationConsistent||!Number.isFinite(checked.evidence.signedVolume)||checked.evidence.signedVolume<=0||Math.abs(checked.evidence.signedVolume-expectedVolume)>Math.max(1e-5,expectedVolume*1e-7)||checked.evidence.bounds.min.some((n,i)=>Math.abs(n-expectedMin[i])>1e-6)||checked.evidence.bounds.max.some((n,i)=>Math.abs(n-expectedMax[i])>1e-6))bad('Prism geometry failed mesh, orientation, bounds or volume checks');
      let portableTopology;
      if(msg.researchTopology!==undefined){const {extractPrismTopology}=await import(new URL('./profile-topology.mjs',self.location.href));portableTopology=extractPrismTopology(result,prepared,checked.provenance);}
      shapes.set(msg.token,name);prismProfiles.set(msg.token,prepared);self.postMessage({kind:'result',seq:msg.seq,...(portableTopology?{portableTopology}:{}),evidence:checked.evidence,provenance:{revision:prepared.revision,sketchDigest:prepared.sketchDigest,faceId:prepared.faceId,regionId:prepared.regionId,edgeFaces:checked.provenance}});return;
    }
    if (msg?.kind==='research-centered-cut') {
      // Explicit research operation only; no public controller capability yet.
      if(Object.keys(msg).sort().join(',')!=='kind,parent,request,seq,token'||!Number.isSafeInteger(msg.seq)||msg.seq<1||typeof msg.token!=='string'||!msg.token||msg.token.length>128||typeof msg.parent!=='string'||msg.parent===msg.token||shapes.has(msg.token))bad('Invalid centered cut envelope');
      if(typeof Module._PerformDrilledCutV1!=='function'){self.postMessage({kind:'refused',seq:msg.seq,code:'ENGINE_CAPABILITY_UNAVAILABLE',error:'Native analytic drilled-cut capability is unavailable'});return;}
      const parent=nameFor(msg.parent),profile=prismProfiles.get(msg.parent);if(!profile)bad('Parent is not a captured authored prism');
      const {planCenteredHole}=await import(new URL('./centeredHolePlan.mjs',self.location.href));const {validateCenteredCut}=await import(new URL('./centeredHoleTopology.mjs',self.location.href));let plan;
      try{plan=planCenteredHole(profile,msg.request)}catch(e){self.postMessage({kind:'refused',seq:msg.seq,code:e?.code||'INVALID_REQUEST',error:String(e?.message||e)});return;}
      if(shapes.get(msg.parent)!==parent||prismProfiles.get(msg.parent)!==profile||shapes.has(msg.token))bad('Parent or result changed before cut');
      const name=allocateName(),tool=name+'tool';callProfile('pcylinder',[tool,plan.radius,plan.depth+2*plan.margin]);callProfile('ttranslate',[tool,plan.center[0],plan.center[1],plan.center[2]-plan.margin]);
      const args=[parent,tool,name].map(n=>{const p=str2C(n);retained.push(p);return p});globalThis.__OCI_EXCHANGE_VAL=null;let topology;
      try{Module._PerformDrilledCutV1(...args);topology=globalThis.__OCI_EXCHANGE_VAL}finally{globalThis.__OCI_EXCHANGE_VAL=null}
      if(!topology||topology.error)bad('Native drilled cut failed');if(new TextEncoder().encode(JSON.stringify(topology)).byteLength>524288)bad('Native topology exceeds byte limit');
      const evidence=validateCenteredCut(topology,plan,profile);shapes.set(msg.token,name);
      centeredResults.set(msg.token,{profile,centerRequest:structuredClone(msg.request),topology});
      self.postMessage({kind:'result',seq:msg.seq,evidence,portableTopology:topology,binding:{unit:'millimeter',revision:plan.revision,sketchDigest:plan.sketchDigest,faceId:plan.faceId,regionId:plan.regionId,diameter:plan.radius*2}});return;
    }
    if (msg?.kind==='research-four-corner-cut') {
      if(Object.keys(msg).sort().join(',')!=='kind,parent,request,seq,token'||!Number.isSafeInteger(msg.seq)||msg.seq<1||typeof msg.token!=='string'||!msg.token||msg.token.length>128||typeof msg.parent!=='string'||!msg.parent||msg.parent===msg.token||shapes.has(msg.token))bad('Invalid four-corner cut envelope');
      if(typeof Module._ResearchFourCornerCut!=='function'){self.postMessage({kind:'refused',seq:msg.seq,code:'ENGINE_CAPABILITY_UNAVAILABLE',error:'Native four-corner capability is unavailable'});return;}
      const parent=nameFor(msg.parent),record=centeredResults.get(msg.parent);if(!record)bad('Parent is not a checked centered-hole result');
      const [{planFourCornerHoles},{validateFourCornerTopology}]=await Promise.all([import(new URL('./fourCornerHolePlan.mjs',self.location.href)),import(new URL('./fourCornerHoleTopology.mjs',self.location.href))]);
      let plan;try{plan=planFourCornerHoles(record.profile,record.centerRequest,msg.request)}catch(e){self.postMessage({kind:'refused',seq:msg.seq,code:e?.code||'INVALID_REQUEST',error:String(e?.message||e)});return;}
      if(shapes.get(msg.parent)!==parent||centeredResults.get(msg.parent)!==record||shapes.has(msg.token))bad('Centered result changed before cut');
      // One logical result creates four additional native names. Any failure
      // after allocation terminates the entire candidate worker.
      const name=allocateName(),tools=[];
      for(let i=0;i<4;i++){const c=plan.corners[i],tool=name+'t'+i;callProfile('pcylinder',[tool,c.radius,plan.depth+2*plan.margin]);callProfile('ttranslate',[tool,c.center[0],c.center[1],c.center[2]-plan.margin]);tools.push(tool);}
      const args=[parent,...tools,name].map(n=>{const p=str2C(n);retained.push(p);return p});globalThis.__OCI_EXCHANGE_VAL=null;let topology;
      try{Module._ResearchFourCornerCut(...args);topology=globalThis.__OCI_EXCHANGE_VAL}finally{globalThis.__OCI_EXCHANGE_VAL=null}
      if(!topology||topology.error)bad('Native four-corner cut failed');if(new TextEncoder().encode(JSON.stringify(topology)).byteLength>524288)bad('Native topology exceeds byte limit');
      const checked=validateFourCornerTopology(topology,record.topology,record.profile,record.centerRequest,msg.request);
      const evidence={bounds:checked.bounds,analyticVolume:checked.analyticVolume,meshVolume:checked.meshVolume,triangleCount:checked.triangleCount,parentFaceDescendants:topology.parentFaces.map(f=>f.same[0]??f.modified[0]),rimCount:10};
      const binding={unit:'millimeter',revision:plan.revision,sketchDigest:plan.sketchDigest,faceId:plan.faceId,regionId:plan.regionId,featureId:plan.featureId,parentFeatureId:plan.parentFeatureId,centerFeatureId:plan.centerFeatureId,sideIds:{...plan.sideIds},offsetX:plan.offsetX,offsetY:plan.offsetY,diameter:plan.diameter,centerDiameter:record.centerRequest.diameter};
      shapes.set(msg.token,name);self.postMessage({kind:'result',seq:msg.seq,evidence,portableTopology:topology,binding});return;
    }
    if (msg?.kind==='box') {
      if(shellMode){
        const request=shellAPI.captureShellBoxRequest({op:'solid.box.create',version:1,unit:'millimeter',origin:msg.origin,dimensions:msg.dimensions,featureId:msg.featureId});
        for(const record of selectedSelectionIndices.values())if(record.featureId===request.featureId||record.index?.plan.sourceContexts.some(c=>c.featureId===request.featureId))throw Object.assign(Error('Box construction origin is already used'),{code:'BOX_CONSTRUCTION_INVALID_REQUEST'});
        const name=allocateName(),result=shellWorker.createOwnedShellBox({Module,name,stringPointer:str2C,free:_free,query:ownedJSON,interrogate,summarize},request);
        chargeSelectedResult(name,result.evidence);shapes.set(msg.token,name);selectedSelectionIndices.set(msg.token,{featureId:request.featureId,index:result.index,reason:null});
        self.postMessage({kind:'result',seq:msg.seq,evidence:result.evidence,box:result.binding});return;
      }
      const name=allocateName(), o=msg.origin, d=msg.dimensions;
      if (![o,d].every(v => Array.isArray(v)&&v.length===3&&[0,1,2].every(i=>Object.hasOwn(v,i)&&Number.isFinite(v[i]))) || d.some(n=>n<=0||n>1e6) || o.some(n=>Math.abs(n)>1e6)) bad('Invalid box');
      call('box',[name,'-min',...o,'-size',...d,'-dir',0,0,1,'-xdir',1,0,0]);
      const evidence=summarize(name); if (!evidence) bad('Box produced no faces');
      chargeSelectedResult(name,evidence);shapes.set(msg.token,name); self.postMessage({kind:'result',seq:msg.seq,evidence}); return;
    }
    if(msg?.kind==='solid-shell'&&shellMode){
      shellAPI.shellData(msg,['kind','seq','token','parentToken','featureId','producerFeatureId','removedFaceIds','thickness','direction']);
      const request=shellAPI.shellBinding({version:1,featureId:msg.featureId,producerFeatureId:msg.producerFeatureId,removedFaceIds:msg.removedFaceIds,thickness:msg.thickness,direction:msg.direction}),parent=nameFor(msg.parentToken),source=selectedSelectionIndices.get(msg.parentToken);
      if(!source?.index)throw Object.assign(Error('Parent face selections are unavailable'),{code:'SELECTION_UNAVAILABLE'});
      if(source.featureId!==request.producerFeatureId)throw Object.assign(Error('Parent producing feature differs'),{code:'INVALID_SELECTION_BINDING'});
      const name=allocateName(),result=shellWorker.applyOwnedShell({Module,name,sourceName:parent,sourceIndex:source.index,stringPointer:str2C,malloc:_malloc,free:_free,query:ownedJSON,interrogate,summarize},request,circularCapture());
      if(shapes.get(msg.parentToken)!==parent||selectedSelectionIndices.get(msg.parentToken)!==source)bad('Shell parent changed during Native operation');
      chargeSelectedResult(name,result.evidence);shapes.set(msg.token,name);selectedSelectionIndices.set(msg.token,{featureId:request.featureId,index:result.index,reason:result.reason});
      // An offset does not preserve an authored through-hole/pattern constructor.
      if(drawingReferencesMode){const prior=selectedDrawingCylinders.get(msg.parentToken)||[];selectedDrawingCylinders.set(msg.token,result.ancestry.status==='available'?drawingFactsAPI.propagateDrawingCylinders(prior,result.ancestry.data,result.topology,request.featureId):Object.freeze(prior.map(row=>row.status==='available'?Object.freeze({...row,status:'unresolved',reason:'DRAWING_REFERENCE_UNRESOLVED',failedFeatureId:request.featureId}):row)));}
      self.postMessage({kind:'result',seq:msg.seq,evidence:result.evidence,shell:result.binding});return;
    }
    if(booleanHistoryMode&&['common','union','subtract'].includes(msg?.kind)){
      const refuse=(code,message)=>{throw Object.assign(Error(message),{code});};
      const sourceA=selectedSelectionIndices.get(msg.a),sourceB=selectedSelectionIndices.get(msg.b);
      if(![msg.featureId,msg.producerAFeatureId,msg.producerBFeatureId].every(n=>Number.isSafeInteger(n)&&n>0)||msg.featureId===msg.producerAFeatureId||msg.featureId===msg.producerBFeatureId)refuse('BOOLEAN_INVALID_REQUEST','Invalid Boolean feature identities');
      if(!sourceA||!sourceB||sourceA.featureId!==msg.producerAFeatureId||sourceB.featureId!==msg.producerBFeatureId)refuse('INVALID_SELECTION_BINDING','Boolean inputs must bind their current producing features');
      if([sourceA,sourceB].some(s=>s.index?.plan.sourceContexts.some(c=>c.featureId===msg.featureId)))refuse('BOOLEAN_INVALID_REQUEST','A new feature cannot reuse a construction origin');
      const name=allocateName(),{created,topology,validation,evidence}=await applyOwnedBooleanResult(nameFor(msg.a),nameFor(msg.b),name,msg.kind);
      let index=null,reason=validation.reason;
      if(!reason&&sourceA.index&&sourceB.index){
        const {deriveBooleanSelectionIndexV2}=await import(new URL('./selectionLineageIndex.mjs',self.location.href));
        try{index=deriveBooleanSelectionIndexV2({sources:[sourceA.index,sourceB.index],ancestries:[created.ancestryA.data,created.ancestryB.data],topology,featureId:msg.featureId},circularCapture());}
        catch(e){if(!['SELECTION_RESOURCE_LIMIT','SELECTION_UNAVAILABLE'].includes(e?.code))throw e;reason=e.code;}
      }else if(!reason)reason=sourceA.reason||sourceB.reason||'NO_AUTHORED_SOURCE_SELECTIONS';
      chargeSelectedResult(name,evidence);shapes.set(msg.token,name);selectedSelectionIndices.set(msg.token,{featureId:msg.featureId,index,reason});
      if(drawingReferencesMode){const inherited=[];for(const [token,observation]of [[msg.a,created.ancestryA],[msg.b,created.ancestryB]]){const prior=selectedDrawingCylinders.get(token)||[];inherited.push(...(observation.status==='available'?drawingFactsAPI.propagateDrawingCylinders(prior,observation.data,topology,msg.featureId):prior.map(r=>r.status==='available'?Object.freeze({...r,status:'unresolved',reason:'DRAWING_REFERENCE_UNRESOLVED',failedFeatureId:msg.featureId}):r)));}const seen=new Map();for(const row of inherited){const key=drawingFactsAPI.drawingCylinderKey(row),old=seen.get(key);seen.set(key,old?Object.freeze({...old,status:'unresolved',reason:'DRAWING_AMBIGUOUS_ANCESTRY',failedFeatureId:msg.featureId}):row);}const faces=new Map();for(const row of seen.values())if(row.status==='available')faces.set(row.witness.resultFace,(faces.get(row.witness.resultFace)||0)+1);selectedDrawingCylinders.set(msg.token,Object.freeze([...seen.values()].map(row=>row.status==='available'&&faces.get(row.witness.resultFace)>1?Object.freeze({...row,status:'unresolved',reason:'DRAWING_AMBIGUOUS_ANCESTRY',failedFeatureId:msg.featureId}):row)));}
      self.postMessage({kind:'result',seq:msg.seq,evidence,boolean:{version:1,featureId:msg.featureId,producerAFeatureId:msg.producerAFeatureId,producerBFeatureId:msg.producerBFeatureId,kind:msg.kind}});return;
    }
    if (['common','union','subtract'].includes(msg?.kind)) {
      const a=nameFor(msg.a), b=nameFor(msg.b); if (msg.a===msg.b) bad('Operands must be distinct');
      const name=allocateName(); call('bop',[a,b]); call({common:'bopcommon',union:'bopfuse',subtract:'bopcut'}[msg.kind],[name]);
      const evidence=summarize(name);
      if (!evidence) {self.postMessage({kind:'unsupported',seq:msg.seq,code:'EMPTY_OR_NON_SOLID_UNSUPPORTED'});return;}
      chargeSelectedResult(name,evidence);shapes.set(msg.token,name); self.postMessage({kind:'result',seq:msg.seq,evidence}); return;
    }
    if (msg?.kind==='enclosure-build') {
      try {
        const {enclosurePlan,enclosurePlanV2}=await import(new URL('./enclosurePlan.mjs',self.location.href));
        if(![1,2].includes(msg.version))throw Error('invalid enclosure version');const plan=(msg.version===2?enclosurePlanV2:enclosurePlan)(msg.plan);
        if(typeof msg.bodyToken!=='string'||typeof msg.lidToken!=='string'||!msg.bodyToken||!msg.lidToken||msg.bodyToken===msg.lidToken||shapes.has(msg.bodyToken)||shapes.has(msg.lidToken)||(msg.version===2&&(typeof msg.labelToken!=='string'||!msg.labelToken||msg.labelToken===msg.bodyToken||msg.labelToken===msg.lidToken||shapes.has(msg.labelToken)))) throw Error('invalid tokens');
        const mkbox=r=>{const name=allocateName();call('box',[name,'-min',...r.origin,'-size',...r.dimensions,'-dir',0,0,1,'-xdir',1,0,0]);return name;};
        const outer=mkbox(plan.body.outer),cavity=mkbox(plan.body.cavity),body=allocateName();
        call('bop',[outer,cavity]);call('bopcut',[body]);
        const cover=mkbox(plan.lid.cover),lip=mkbox(plan.lid.lip),baseLid=allocateName();
        call('bop',[cover,lip]);call('bopfuse',[baseLid]);let lid=baseLid,label=null;if(msg.version===2){label=mkbox(plan.label.box);lid=allocateName();call('bop',[baseLid,label]);call('bopcut',[lid]);}
        const verify=(name,expected,bounds)=>{
          const mesh=summarize(name);if(!mesh)throw Error('empty');
          if(mesh.bounds.min.some((x,i)=>Math.abs(x-bounds.min[i])>1e-6)||mesh.bounds.max.some((x,i)=>Math.abs(x-bounds.max[i])>1e-6)||Math.abs(mesh.signedVolume-expected)>Math.max(1e-6,expected*1e-9))throw Error('mesh mismatch');
          let p;try{p=str2C(name);globalThis.__OCI_EXCHANGE_VAL=null;Module._InspectAnalyticV1(p);const v=globalThis.__OCI_EXCHANGE_VAL;if(!v||v.version!==1||v.scope!=='response-local'||v.valid!==true||v.solidCount!==1||!Number.isFinite(v.signedVolume)||!Array.isArray(v.faces)||v.faces.length<1||v.faces.length>64||Math.abs(v.signedVolume-expected)>Math.max(1e-6,expected*1e-9))throw Error('native mismatch');return {nativeVolume:v.signedVolume,mesh};}finally{if(p)_free(p);globalThis.__OCI_EXCHANGE_VAL=null;}
        };
        const bodyEvidence=verify(body,plan.body.volume,plan.body.bounds),lidEvidence=verify(lid,plan.lid.volume,plan.lid.bounds),labelEvidence=label?verify(label,plan.label.volume,plan.label.bounds):null;
        let interfaceEvidence=null;
        if(label){
          // Reuse the now-private baseLid name as a fresh output sentinel: if
          // bopcommon fails without writing, the old positive solid refuses.
          call('bop',[lid,label]);call('bopcommon',[baseLid]);let pointer;
          try{pointer=str2C(baseLid);globalThis.__OCI_EXCHANGE_VAL=null;Module._InspectAnalyticV1(pointer);const v=globalThis.__OCI_EXCHANGE_VAL;if(!v||v.version!==1||v.scope!=='response-local'||v.valid!==true||v.solidCount!==0||!Number.isFinite(v.signedVolume)||Math.abs(v.signedVolume)>1e-7)throw Error('label interface overlap');interfaceEvidence={version:1,kind:'bounded-common-volume',engine:'occ',commonVolume:v.signedVolume};}finally{if(pointer)_free(pointer);globalThis.__OCI_EXCHANGE_VAL=null;}
        }
        const enclosureGroup={bodyToken:msg.bodyToken,lidToken:msg.lidToken,labelToken:msg.labelToken,interfaceEvidence};
        shapes.set(msg.bodyToken,body);shapes.set(msg.lidToken,lid);enclosureShapes.set(msg.bodyToken,{role:"BODY",evidence:bodyEvidence,read:false,group:enclosureGroup,plan:structuredClone(msg.plan)});enclosureShapes.set(msg.lidToken,{role:"LID",evidence:lidEvidence,read:false,group:enclosureGroup,plan:structuredClone(msg.plan)});if(label){shapes.set(msg.labelToken,label);enclosureShapes.set(msg.labelToken,{role:"LABEL",evidence:labelEvidence,read:false,group:enclosureGroup,plan:structuredClone(msg.plan)});}
        self.postMessage({kind:'result',seq:msg.seq,bodyToken:msg.bodyToken,lidToken:msg.lidToken,bodyEvidence,lidEvidence,...(label?{labelToken:msg.labelToken,labelEvidence,interfaceEvidence}:{})});
      }catch(e){self.postMessage({kind:'error',seq:msg.seq,error:'Enclosure construction failed'});closeWorker();}
      return;
    }
    if(msg?.kind==='enclosure-interface') {
      try {
        const body=enclosureShapes.get(msg.bodyToken),lid=enclosureShapes.get(msg.lidToken),label=enclosureShapes.get(msg.labelToken);
        if(!body||!lid||!label||body.role!=='BODY'||lid.role!=='LID'||label.role!=='LABEL'||body.group!==lid.group||body.group!==label.group||body.group.bodyToken!==msg.bodyToken||body.group.lidToken!==msg.lidToken||body.group.labelToken!==msg.labelToken||!body.group.interfaceEvidence||!lid.qualified||!label.qualified)throw Error('Invalid enclosure interface binding');
        const {qualifyEnclosureLabelContact}=await import(new URL('./enclosureLabelContact.mjs',self.location.href));
        const evidence=qualifyEnclosureLabelContact(lid.plan,lid.qualified,label.qualified,msg.maxDeviationMm);
        self.postMessage({kind:'result',seq:msg.seq,bodyToken:msg.bodyToken,lidToken:msg.lidToken,labelToken:msg.labelToken,commonVolume:body.group.interfaceEvidence.commonVolume,...evidence});
      } catch(e) {self.postMessage({kind:'error',seq:msg.seq,error:'Enclosure interface qualification failed'});closeWorker();}return;
    }
    if(msg?.kind==='enclosure-mesh'||msg?.kind==='enclosure-manufacturing') {
      try {
        const record=enclosureShapes.get(msg.token),manufacturing=msg.kind==='enclosure-manufacturing';
        if(!record||(manufacturing?record.manufacturingRead:record.read))throw Error('invalid enclosure token');
        if(manufacturing)record.manufacturingRead=true;else record.read=true;
        const raw=interrogate(nameFor(msg.token));if(!raw||!Array.isArray(raw.faces)||raw.faces.length<1||raw.faces.length>64)throw Error('invalid native result');
        const triangles=[];
        for(const face of raw.faces){if(typeof face.inverted!=='boolean'||!Array.isArray(face.tess))throw Error('invalid face');for(const item of face.tess){const tri=item?.[0];if(!Array.isArray(tri)||tri.length!==3||triangles.length>=512)throw Error('invalid triangle');const points=(face.inverted?[tri[0],tri[2],tri[1]]:tri);for(const p of points){if(!Array.isArray(p)||p.length!==3||![0,1,2].every(i=>Object.hasOwn(p,i)&&Number.isFinite(p[i])))throw Error('invalid point');}triangles.push(points);}}
        if(triangles.length<1)throw Error('empty');const buffer=new ArrayBuffer(triangles.length*9*8),out=new Float64Array(buffer);let index=0;for(const tri of triangles)for(const p of tri)for(const x of p)out[index++]=x;
        if(manufacturing){const {qualifyEnclosureManufacturingMesh}=await import(new URL('./enclosureManufacturingMesh.mjs',self.location.href)),q=qualifyEnclosureManufacturingMesh(buffer,triangles.length,record.plan,record.role,'occ',msg.maxDeviationMm);record.qualified={vertices:q.vertices.slice(),triangles:q.triangles.slice(),evidence:q.evidence};self.postMessage({kind:'result',seq:msg.seq,token:msg.token,role:record.role,verticesBuffer:q.vertices.buffer,trianglesBuffer:q.triangles.buffer,evidence:q.evidence},[q.vertices.buffer,q.triangles.buffer]);}
        else{const {validateEnclosureMesh}=await import(new URL('./enclosureMesh.mjs',self.location.href));validateEnclosureMesh(buffer,triangles.length,record.evidence);self.postMessage({kind:'result',seq:msg.seq,token:msg.token,role:record.role,triangleCount:triangles.length,buffer},[buffer]);}
      }catch(e){self.postMessage({kind:'error',seq:msg.seq,error:'Enclosure mesh read failed'});closeWorker();}return;
    }
    if (msg?.kind==='solid-mesh') {
      if (Object.keys(msg).sort().join(',')!=='kind,seq,token') bad('Invalid solid mesh request');
      const name=nameFor(msg.token),raw=interrogate(name),evidence=summarize(name,raw);
      if (!evidence) bad('No solid display mesh');checkSelectedMesh(name,evidence);
      const buffer=new ArrayBuffer(evidence.triangles*9*8),out=new Float64Array(buffer);let offset=0;
      for (const face of raw.faces) {
        if(typeof face.inverted!=='boolean')bad('Missing face orientation');
        for(const item of face.tess) {
          const tri=item[0],points=face.inverted?[tri[0],tri[2],tri[1]]:tri;
          for(const p of points)for(const coordinate of p)out[offset++]=coordinate;
        }
      }
      if(offset!==out.length)bad('Inconsistent solid mesh');
      const {createDisplayProjection}=await import(new URL('./displayProjection.mjs',self.location.href)),display=createDisplayProjection(buffer,evidence.triangles);
      self.postMessage({kind:'result',seq:msg.seq,token:msg.token,triangleCount:evidence.triangles,buffer,evidence,displayBuffer:display.buffer,displayStatus:display.status,displayReason:display.reason},[buffer,display.buffer]);return;
    }
    if (msg?.kind==='dispose') {const name=nameFor(msg.token);if(safeOwnedMode){const before=Module._OwnedShapeNamesV2(),ptr=str2C(name);let released;try{released=Module._ReleaseOwnedShapeV2(ptr);}finally{_free(ptr);}if(released!==1||Module._OwnedShapeNamesV2()!==before-1)bad('Native owned-shape release failed');} shapes.delete(msg.token);selectedPrismProvenance.delete(msg.token);circularPrismConstruction.delete(msg.token);selectedSelectionIndices.delete(msg.token);selectedSourceProfiles.delete(msg.token);selectedHoleStates.delete(msg.token);selectedDrawingCylinders.delete(msg.token);enclosureShapes.delete(msg.token);prismProfiles.delete(msg.token);centeredResults.delete(msg.token);self.postMessage({kind:'disposed',seq:msg.seq,...(safeOwnedMode?{released:true}:{})});return;}
    bad('Unsupported request');
  } catch(e) {if(circularMode&&msg?.kind==='selected-profile-extrude'&&msg.request?.version===4){const recoverable=['INVALID_REQUEST','INVALID_FRAME','INVALID_PROFILE','UNSUPPORTED_PROFILE','STALE_REGION','PROFILE_BELOW_RESOLUTION','RESOURCE_LIMIT','CIRCULAR_INVALID_REQUEST','CIRCULAR_UNSUPPORTED_RELATION','CIRCULAR_GEOMETRY_UNQUALIFIED','CIRCULAR_CONSTRUCTION_FAILED','CIRCULAR_PROVENANCE_UNRESOLVED','CIRCULAR_RESOURCE_LIMIT','CIRCULAR_NAME_COLLISION','CIRCULAR_ALLOCATION_FAILED','CIRCULAR_BUSY'];if(recoverable.includes(e?.code)){self.postMessage({kind:'refused',seq:msg.seq,code:e.code,error:String(e.message).slice(0,512)});return;}try{self.postMessage({kind:'error',seq:msg.seq,...(typeof e?.code==='string'?{code:e.code}:{}),error:String(e?.message||e).slice(0,512)});}finally{closeWorker();}return;}if(planarAttachmentsMode&&msg?.kind==='solid-face-frame'&&['UNRESOLVED_SOURCE','UNSUPPORTED_FRAME_PARENT','INVALID_FRAME_DEPENDENCY','STALE_FRAME','RESOURCE_LIMIT'].includes(e?.code)){self.postMessage({kind:'refused',seq:msg.seq,code:e.code,error:String(e.message).slice(0,512),reason:e.reason||'REFERENCE_MISSING'});return;}if(initializing){self.postMessage({kind:'error',error:String(e)});closeWorker();return;}if(shellMode&&['solid-shell','box'].includes(msg?.kind)){const codes=msg.kind==='box'?[...shellAPI.BOX_CONSTRUCTION_REFUSALS,'RESOURCE_LIMIT','INVALID_REQUEST']:shellAPI.SHELL_REFUSALS;if(codes.includes(e?.code)){self.postMessage({kind:'refused',seq:msg.seq,code:e.code,error:String(e.message).slice(0,512)});return;}try{self.postMessage({kind:'error',seq:msg.seq,...(typeof e?.code==='string'?{code:e.code}:{}),error:String(e?.message||e).slice(0,512)});}finally{closeWorker();}return;}if(manufacturingMeshMode&&msg?.kind==='solid-manufacturing-mesh'){if(manufacturingAPI.MANUFACTURING_MESH_REFUSAL_CODES.includes(e?.code)){self.postMessage({kind:'refused',seq:msg.seq,code:e.code,error:String(e.message).slice(0,512)});return;}try{self.postMessage({kind:'error',seq:msg.seq,...(typeof e?.code==='string'?{code:e.code}:{}),error:String(e?.message||e).slice(0,512)});}finally{closeWorker();}return;}if(orthographicReadMode&&msg?.kind==='solid-orthographic-read'){if(orthographicAPI.ORTHOGRAPHIC_REFUSAL_CODES.includes(e?.code)){self.postMessage({kind:'refused',seq:msg.seq,code:e.code,error:String(e.message).slice(0,512)});return;}try{self.postMessage({kind:'error',seq:msg.seq,...(typeof e?.code==='string'?{code:e.code}:{}),error:String(e?.message||e).slice(0,512)});}finally{closeWorker();}return;}if(stepExportMode&&msg?.kind==='solid-step-export'){const codes=['STEP_EXPORT_INVALID_REQUEST','STEP_EXPORT_EMPTY_INPUT','STEP_EXPORT_UNSUPPORTED_SHAPE','STEP_EXPORT_INVALID_SHAPE','STEP_EXPORT_ALIAS_INPUT','STEP_EXPORT_RESOURCE_LIMIT','STEP_EXPORT_FAILED'];if(codes.includes(e?.code)){self.postMessage({kind:'refused',seq:msg.seq,code:e.code,error:String(e.message).slice(0,512)});return;}try{self.postMessage({kind:'error',seq:msg.seq,...(typeof e?.code==='string'?{code:e.code}:{}),error:String(e?.message||e).slice(0,512)});}finally{closeWorker();}return;}if(e?.code==='MEASUREMENT_PRECISION_UNRESOLVED'){self.postMessage({kind:'error',seq:msg?.seq,code:e.code,error:String(e.message)});closeWorker();return;}if(loftMode&&msg?.kind==='selected-profile-loft'&&e?.code==='LOFT_INPUT_CHANGED'){self.postMessage({kind:'error',seq:msg.seq,code:e.code,error:String(e.message)});closeWorker();return;}if(loftMode&&msg?.kind==='selected-profile-loft'){
 const phase=loftPreparedBinding?'native':'preparation',codes=phase==='native'?[...loftRefusalCodes,'RESOURCE_LIMIT']:[...loftPreparationRefusalCodes,'INVALID_REQUEST','INVALID_FRAME','INVALID_PROFILE','UNSUPPORTED_PROFILE','UNSUPPORTED_REGION_TOPOLOGY','PROFILE_BELOW_RESOLUTION','OPEN_OR_AMBIGUOUS_PROFILE','ZERO_LENGTH_EDGE','OVERLAPPING_EDGES','SELF_INTERSECTION','SELF_TOUCHING_BOUNDARY','ZERO_AREA_PROFILE','UNREPRESENTABLE_AREA','RESOURCE_LIMIT'];
 if(codes.includes(e?.code)){self.postMessage({kind:'refused',seq:msg.seq,phase,code:e.code,error:String(e.message)});return;}
} if(sweepMode&&msg?.kind==='selected-profile-sweep'&&[...sweepRefusalCodes,'INVALID_REQUEST','INVALID_FRAME','INVALID_PROFILE','UNSUPPORTED_PROFILE','UNSUPPORTED_REGION_TOPOLOGY','PROFILE_BELOW_RESOLUTION','OPEN_OR_AMBIGUOUS_PROFILE','ZERO_LENGTH_EDGE','OVERLAPPING_EDGES','SELF_INTERSECTION','SELF_TOUCHING_BOUNDARY','ZERO_AREA_PROFILE','UNREPRESENTABLE_AREA','RESOURCE_LIMIT'].includes(e?.code)){self.postMessage({kind:'refused',seq:msg.seq,code:e.code,error:String(e.message)});return;}if(revolveMode&&msg?.kind==='selected-profile-revolve'&&['INVALID_REQUEST','INVALID_FRAME','INVALID_PROFILE','UNSUPPORTED_PROFILE','UNSUPPORTED_REGION_TOPOLOGY','PROFILE_BELOW_RESOLUTION','OPEN_OR_AMBIGUOUS_PROFILE','ZERO_LENGTH_EDGE','OVERLAPPING_EDGES','SELF_INTERSECTION','SELF_TOUCHING_BOUNDARY','ZERO_AREA_PROFILE','UNREPRESENTABLE_AREA','RESOURCE_LIMIT','REVOLVE_INVALID_REQUEST','REVOLVE_INVALID_PROFILE','REVOLVE_INVALID_AXIS','REVOLVE_AXIS_NOT_COPLANAR','REVOLVE_PROFILE_CROSSES_AXIS','REVOLVE_INVALID_ANGLE','REVOLVE_UNSUPPORTED_PROFILE','REVOLVE_FAILED','REVOLVE_INVALID_RESULT','REVOLVE_RESOURCE_LIMIT'].includes(e?.code)){self.postMessage({kind:'refused',seq:msg.seq,code:e.code,error:String(e.message)});return;}if(e?.code==='MESH_VOLUME_NUMERIC_RANGE'){self.postMessage({kind:'error',seq:msg?.seq,code:e.code,error:String(e.message)});closeWorker();return;}if(linearHolePatternMode&&msg?.kind==='solid-linear-hole-pattern'&&['INVALID_REQUEST','UNSUPPORTED_IDENTITY_OPERATION','UNSUPPORTED_SEED','UNSUPPORTED_TARGET_PATH','STALE_SOURCE','PATTERN_OVERLAP','PATTERN_OUTSIDE_PROFILE','PATTERN_DOMAIN','UNSUPPORTED_PROFILE','HOLE_OUTSIDE_PROFILE','HOLES_OVERLAP','UNSUPPORTED_TARGET','TOOL_DOMAIN','SELECTION_UNAVAILABLE','INVALID_SELECTION_BINDING','SELECTION_RESOURCE_LIMIT','RESOURCE_LIMIT','BOOLEAN_INVALID_REQUEST','BOOLEAN_INVALID_INPUT','BOOLEAN_NON_SOLID_INPUT','BOOLEAN_NON_SOLID_RESULT','BOOLEAN_FAILED','BOOLEAN_INVALID_RESULT','BOOLEAN_RESOURCE_LIMIT','BOOLEAN_COPY_FAILED'].includes(e?.code)){self.postMessage({kind:'refused',seq:msg.seq,code:e.code,error:String(e.message)});return;}if(throughHoleMode&&msg?.kind==='solid-through-holes'&&['INVALID_REQUEST','STALE_SOURCE','UNSUPPORTED_PROFILE','HOLE_OUTSIDE_PROFILE','HOLES_OVERLAP','UNSUPPORTED_TARGET','TOOL_DOMAIN','SELECTION_UNAVAILABLE','INVALID_SELECTION_BINDING','SELECTION_RESOURCE_LIMIT','BOOLEAN_INVALID_REQUEST','BOOLEAN_INVALID_INPUT','BOOLEAN_NON_SOLID_INPUT','BOOLEAN_NON_SOLID_RESULT','BOOLEAN_FAILED','BOOLEAN_INVALID_RESULT','BOOLEAN_RESOURCE_LIMIT','BOOLEAN_COPY_FAILED'].includes(e?.code)){self.postMessage({kind:'refused',seq:msg.seq,code:e.code,error:String(e.message)});return;}if(booleanHistoryMode&&['common','union','subtract'].includes(msg?.kind)&&['BOOLEAN_INVALID_REQUEST','BOOLEAN_INVALID_INPUT','BOOLEAN_NON_SOLID_INPUT','BOOLEAN_NON_SOLID_RESULT','BOOLEAN_FAILED','BOOLEAN_INVALID_RESULT','BOOLEAN_RESOURCE_LIMIT','BOOLEAN_COPY_FAILED','INVALID_SELECTION_BINDING','SELECTION_UNAVAILABLE'].includes(e?.code)){self.postMessage({kind:'refused',seq:msg?.seq,code:e.code,error:String(e.message)});return;}if(edgeTreatmentMode&&['solid-edge-treatment','solid-prism-selections','solid-selections'].includes(msg?.kind)&&['EDGE_TREATMENT_INVALID_REQUEST','EDGE_TREATMENT_INVALID_INPUT','EDGE_TREATMENT_UNSUPPORTED','EDGE_TREATMENT_FAILED','EDGE_TREATMENT_INVALID_RESULT','EDGE_TREATMENT_RESOURCE_LIMIT','UNRESOLVED_SELECTION','INVALID_SELECTION_BINDING','SELECTION_UNAVAILABLE'].includes(e?.code)){self.postMessage({kind:'refused',seq:msg?.seq,code:e.code,error:String(e.message)});return;}if(safeOwnedMode&&e?.code==='RESOURCE_LIMIT'){self.postMessage({kind:'refused',seq:msg?.seq,code:'RESOURCE_LIMIT',error:String(e.message)});return;}self.postMessage({kind:'error',seq:msg?.seq,error:String(e)});closeWorker();} finally {if(workerPhase==='busy')workerPhase='ready';}
};
