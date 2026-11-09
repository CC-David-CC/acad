// Private OCI ports only. Two scratch names consume the existing cumulative
// name budget; neither becomes a token, selection index or authored feature.
import {validateOwnedTopology} from './ownedTopologyContract.mjs';
import {validateOwnedBooleanResult} from './ownedBooleanContract.mjs';
import {captureDrawingSectionPacket} from './ownedDrawingSectionProtocol.mjs';
const fail=(message,code='DRAWING_SECTION_UNQUALIFIED')=>{throw Object.assign(Error(message),{code});};
const dot=(a,b)=>a.reduce((s,n,i)=>s+n*b[i],0),sub=(a,b)=>a.map((n,i)=>n-b[i]),add=(a,b)=>a.map((n,i)=>n+b[i]),mul=(a,n)=>a.map(x=>x*n),near=(a,b)=>Math.hypot(...sub(a,b))<=1e-7;
const axis=v=>v.length===3&&v.filter(n=>n!==0).length===1&&v.every(n=>n===0||n===1||n===-1);
const flat=f=>[...f.origin,...f.u,...f.v,...f.n];
// Only these actual Native port resource results are ordinary derived limits.
// Unknown port errors and preservation/cleanup failures retain their fatal paths.
const portError=value=>{const d=value&&typeof value==='object'?Object.getOwnPropertyDescriptor(value,'error'):null;return d&&Object.hasOwn(d,'value')&&typeof d.value==='string'?d.value:null;};
// Exact represented-coordinate embedding proof, not Native identity inference.
// At abs(coordinate)<=4e6, a common binary64 dyadic grid needs <=1097 bits.
// Differences, doubled midpoints and degree-two determinants/512-term area
// sums stay below2304 bits. There is no rational division or recursive growth.
function proveCapEmbedding(patches){
 const MAX_WORK=2000000,MAX_COORD_BITS=1100,rows=patches.flat(),points=new Map();let work=0;
 const tick=()=>{if(++work>MAX_WORK)fail('Section embedding predicate work exceeded','RESOURCE_LIMIT');};
 const same=(a,b)=>a[0]===b[0]&&a[1]===b[1];
 for(const row of rows)for(const [id,p]of [[row.a,row.start],[row.b,row.end]]){
  tick();if(!p.every(n=>Number.isFinite(n)&&Math.abs(n)<=4e6))fail('Section projected coordinates exceed the finite packet domain');
  if(points.has(id)&&!same(points.get(id),p))fail('One Native section vertex has inconsistent projected coordinates','ENGINE_FAILURE');points.set(id,p);
 }
 const view=new DataView(new ArrayBuffer(8)),decoded=new Map();let exponent=0,first=true;
 for(const [id,p]of points){const out=[];for(const number of p){tick();view.setFloat64(0,number,false);const bits=view.getBigUint64(0,false),raw=Number((bits>>52n)&2047n);let n=bits&((1n<<52n)-1n);if(raw)n|=1n<<52n;if(bits>>63n)n=-n;const e=raw?raw-1075:-1074;out.push({n,e});if(n&&(first||e<exponent)){exponent=e;first=false;}}decoded.set(id,out);}
 const exact=new Map();for(const [id,p]of decoded)exact.set(id,p.map(({n,e})=>{const value=n?n<<BigInt(e-exponent):0n;if((value<0n?-value:value).toString(2).length>MAX_COORD_BITS)fail('Section exact coordinate bit budget exceeded','RESOURCE_LIMIT');return value;}));
 const sign=n=>n<0n?-1:n>0n?1:0;
 const orient=(a,b,p,d=1n)=>{tick();return(b[0]-a[0])*(p[1]-a[1]*d)-(b[1]-a[1])*(p[0]-a[0]*d);};
 const within=(a,b,p,d=1n)=>[0,1].every(k=>p[k]>=(a[k]<b[k]?a[k]:b[k])*d&&p[k]<=(a[k]>b[k]?a[k]:b[k])*d);
 const winding=patches.map(patch=>{let area=0n;for(const row of patch){tick();const a=exact.get(row.a),b=exact.get(row.b);if(same(a,b))fail('Section has an exactly collapsed projected edge');area+=a[0]*b[1]-b[0]*a[1];}if(!area)fail('Section cap has exactly zero projected area');return sign(area);});
 const patchOf=new Map();patches.forEach((patch,index)=>patch.forEach(row=>patchOf.set(row,index)));
 for(let i=0;i<rows.length;i++)for(let j=i+1;j<rows.length;j++){
  tick();const a=rows[i],b=rows[j],pa=patchOf.get(a),pb=patchOf.get(b),A=exact.get(a.a),B=exact.get(a.b),C=exact.get(b.a),D=exact.get(b.b);
  if(a.edge===b.edge){if(pa===pb||a.a!==b.b||a.b!==b.a||winding[pa]!==winding[pb])fail('Shared cap edge does not separate opposite patch interiors');continue;}
  const o=[orient(A,B,C),orient(A,B,D),orient(C,D,A),orient(C,D,B)];
  if(sign(o[0])*sign(o[1])<0&&sign(o[2])*sign(o[3])<0)fail('Section cap boundaries cross without shared Native membership');
  if(o.every(n=>n===0n)){
   const k=A[0]!==B[0]?0:1;
   const aLow=A[k]<B[k]?A[k]:B[k],aHigh=A[k]>B[k]?A[k]:B[k];
   const bLow=C[k]<D[k]?C[k]:D[k],bHigh=C[k]>D[k]?C[k]:D[k];
   const lo=aLow>bLow?aLow:bLow,hi=aHigh<bHigh?aHigh:bHigh;
   if(hi>lo)fail('Different Native cap edges have overlapping interiors');
  }
  const contacts=[[a.a,A,C,D,o[2],b.a,b.b],[a.b,B,C,D,o[3],b.a,b.b],[b.a,C,A,B,o[0],a.a,a.b],[b.b,D,A,B,o[1],a.a,a.b]];
  for(const [id,p,q,r,value,start,end]of contacts)if(value===0n&&within(q,r,p)){
   // Equality is permitted only through the actual shared Native endpoint ID.
   // This rejects T-junctions and coincident-but-unshared vertices, including
   // contacts involving edges that will later cancel from the outline.
   if(id!==start&&id!==end)fail('Section contact lacks shared Native endpoint membership');
   if(pa===pb&&!((a.a===b.b)||(a.b===b.a)))fail('Section cap has a nonadjacent self-contact');
  }
 }
 const locate=(p,d,patch)=>{let inside=false;for(const row of patch){tick();const a=exact.get(row.a),b=exact.get(row.b),o=orient(a,b,p,d);if(!o&&within(a,b,p,d))return'boundary';if((a[1]*d>p[1])!==(b[1]*d>p[1])&&(b[1]>a[1]?o>0n:o<0n))inside=!inside;}return inside?'inside':'outside';};
 // The complete contact census above proves that every open edge interior
 // has constant membership in the other simple polygon. Its EXACT homogeneous
 // midpoint is therefore a certificate, not approximate coordinate sampling.
 // Both directions cover strict containment and containment with shared vertices.
 for(let i=0;i<patches.length;i++)for(let j=i+1;j<patches.length;j++)for(const [a,b]of [[patches[i],patches[j]],[patches[j],patches[i]]])for(const row of a){const p=exact.get(row.a),q=exact.get(row.b);if(locate([p[0]+q[0],p[1]+q[1]],2n,b)==='inside')fail('Section cap patch interiors overlap or contain one another');}
}
function capSet({created,source,cut,frame,cutterRole}){
 if(created.ancestryB.status!=='available')fail('The cut plane has no complete original-input ancestry');
 const construction=source.construction;
 if(!construction||Object.keys(construction).sort().join(',')!=='faces,kind,persistentIds,scope,version'||construction.version!==1||construction.scope!=='response-local'||construction.persistentIds!==false||construction.kind!=='box-builder-face-provenance'||source.topology.vertices.length!==8||source.topology.edges.length!==12||source.topology.faces.length!==6||construction.faces.length!==6)fail('The scratch box has no complete builder-face provenance','ENGINE_FAILURE');
 const roles=['X_MIN','X_MAX','Y_MIN','Y_MAX','Z_MIN','Z_MAX'],ids=new Set(),seen=new Set();let selected;
 for(const row of construction.faces){if(!row||Object.keys(row).sort().join(',')!=='face,role'||!roles.includes(row.role)||seen.has(row.role)||!Number.isInteger(row.face)||row.face<1||row.face>6||ids.has(row.face)||source.topology.faces[row.face-1].type!=='plane')fail('Malformed scratch constructor census','ENGINE_FAILURE');seen.add(row.role);ids.add(row.face);if(row.role===cutterRole)selected=row.face;}
 const coplanar=f=>f.type==='plane'&&axis(f.analytic.normal)&&Math.abs(dot(f.analytic.normal,frame.n))===1&&Math.abs(dot(sub(f.analytic.origin,frame.origin),frame.n))<=1e-7;
 if(!selected||!coplanar(source.topology.faces[selected-1]))fail('Builder support differs from the requested section','ENGINE_FAILURE');
 const relation=created.ancestryB.data.faces[selected-1];
 if(!relation||relation.source!==selected)fail('Cut ancestry does not identify the actual builder face','ENGINE_FAILURE');
 const caps=new Set([...relation.same.faces,...relation.modified.faces,...relation.generated.faces]);
 const all=cut.faces.filter(coplanar).map(f=>f.index);
 if(!caps.size||caps.size>16||all.length!==caps.size||all.some(id=>!caps.has(id)))fail('Cut-plane membership is incomplete or ambiguous');
 for(const id of caps){const f=cut.faces[id-1];if(!f||!coplanar(f)||!['FORWARD','REVERSED'].includes(f.orientation)||dot(f.analytic.normal,frame.n)*(f.orientation==='REVERSED'?-1:1)!==1)fail('Cut-cap orientation is not proven');}
 return [...caps].sort((a,b)=>a-b);
}
function packCaps(topology,faces,frame){
 const patches=[],occurrences=new Map();let uses=0;
 const project=p=>[dot(sub(p,frame.origin),frame.u),dot(sub(p,frame.origin),frame.v)];
 for(const id of faces){
  const f=topology.faces[id-1];if(f.wires.length!==1||f.wires[0].length<3)fail('Section requires simple one-wire line caps');
  const patch=[],vertices=new Set();
  for(const use of f.wires[0]){
   if(++uses>512)fail('Section edge-use capacity exceeded','RESOURCE_LIMIT');
   const edge=topology.edges[use.edge-1];if(use.seam||!['FORWARD','REVERSED'].includes(use.orientation)||edge.type!=='line'||edge.degenerated||edge.vertices.some(i=>i<1)||edge.vertices[0]===edge.vertices[1])fail('Section cap has an unsupported trim');
   const ends=edge.vertices.map(i=>topology.vertices[i-1].point),analytic=edge.range.map(t=>add(edge.analytic.origin,mul(edge.analytic.direction,t)));
   // Native edge parameter endpoints must authenticate actual vertex membership.
   if(!near(ends[0],analytic[0])||!near(ends[1],analytic[1]))fail('Section line endpoint membership differs');
   let [a,b]=edge.vertices;if(use.orientation==='REVERSED')[a,b]=[b,a];
   if(vertices.has(a))fail('Section cap is not a simple boundary');vertices.add(a);
   for(const p of [topology.vertices[a-1].point,topology.vertices[b-1].point])if(Math.abs(dot(sub(p,frame.origin),frame.n))>1e-7)fail('Section trim is outside its actual cap plane');
   if(patch.length&&patch[patch.length-1].b!==a)fail('Native section wire is not oriented and connected');
   const row={a,b,edge:use.edge,start:project(topology.vertices[a-1].point),end:project(topology.vertices[b-1].point),boundary:true};patch.push(row);
   if(!occurrences.has(use.edge))occurrences.set(use.edge,[]);occurrences.get(use.edge).push(row);
  }
  if(patch[patch.length-1].b!==patch[0].a)fail('Native section wire is open');
  patches.push(patch);
 }
 // Prove all self/interpatch contact and interior-disjointness BEFORE any
 // actual shared edge is canceled or omitted from the boundary census.
 proveCapEmbedding(patches);
 for(const rows of occurrences.values()){
  if(rows.length===2){if(rows[0].a!==rows[1].b||rows[0].b!==rows[1].a)fail('Internal cap edge uses disagree');for(const row of rows)row.boundary=false;}
  else if(rows.length!==1)fail('Section cap edge has ambiguous incidence');
 }
 const boundary=patches.flat().filter(e=>e.boundary),incoming=new Map(),outgoing=new Map();
 for(const e of boundary){if(incoming.has(e.b)||outgoing.has(e.a))fail('Section boundary has ambiguous branches');incoming.set(e.b,e);outgoing.set(e.a,e);}
 if(boundary.some(e=>!incoming.has(e.a)||!outgoing.has(e.b)))fail('Section boundary is not a complete loop set');
 const values=new ArrayBuffer(uses*96),tags=new ArrayBuffer(uses*4),data=new DataView(values),labels=new Uint8Array(tags);let index=0,area=0,arithmeticBound=0;
 for(let p=0;p<patches.length;p++){
  let sum=0,products=0,perimeter=0;for(const e of patches[p]){[...e.start,...e.end].forEach((n,j)=>data.setFloat64(index*96+j*8,n,true));labels.set([p,e.boundary?1:0,0,0],index*4);sum+=e.start[0]*e.end[1]-e.end[0]*e.start[1];products+=Math.abs(e.start[0]*e.end[1])+Math.abs(e.end[0]*e.start[1]);perimeter+=Math.hypot(...sub(e.end,e.start));index++;}if(!Number.isFinite(sum)||sum===0)fail('Section cap has no resolved positive area');area+=Math.abs(sum)/2;const worldScale=Math.max(1,...frame.origin.map(Math.abs),...topology.vertices.flatMap(v=>v.point.map(Math.abs)));arithmeticBound+=64*Number.EPSILON*(products+worldScale*perimeter);
 }
 if(!Number.isFinite(arithmeticBound)||arithmeticBound>1e-6)fail('Section area arithmetic is outside the finite measurement budget');
 return captureDrawingSectionPacket({metadata:{version:1,quality:'native-boolean-cap-set',frame:flat(frame),patchLengths:patches.map(p=>p.length),edgeCount:uses,boundaryCount:boundary.length,area,valueBytes:values.byteLength,tagBytes:tags.byteLength},values,tags},flat(frame));
}
export function readOwnedDrawingSection(env,{frame}){
 const {Module,targetName,query,stringPointer,free,allocateName,remaining}=env;
 if(![frame.u,frame.v,frame.n].every(axis))fail('Section requires an exact principal source frame');
 const target=validateOwnedTopology(query('_ReadOwnedTopologyV1',targetName)),metrics=query('_InspectOwnedSolidV2',targetName);
 if(metrics.version!==2||metrics.valid!==true||metrics.solidCount!==1||!(metrics.nativeVolume>0)||target.solidCount!==1)fail('Section requires the current valid positive native solid');
 const beforeNames=Module._OwnedShapeNamesV2(),sourceJSON=JSON.stringify(target),metricsJSON=JSON.stringify(metrics),attempted=[],known=new Set(),pointers=[];let output,failure=null;
 const cleanupFailure=(message,cause)=>{failure={cause:Object.assign(Error(message),{code:'ENGINE_CLEANUP_FAILED',cause,operationError:failure?.cause})};};
 if(remaining()<2)fail('Section requires two remaining native work names','RESOURCE_LIMIT');
 const j=frame.n.findIndex(n=>n!==0),sourceY=-frame.n[j],origin=metrics.nativeBounds.min.map(n=>n-1),max=metrics.nativeBounds.max.map(n=>n+1);
 if(sourceY===1)origin[j]=frame.origin[j];else max[j]=frame.origin[j];
 const dimensions=max.map((n,i)=>n-origin[i]),role=['X','Y','Z'][j]+(sourceY===1?'_MIN':'_MAX');
 if(origin.some((n,i)=>!Object.is(n+dimensions[i],max[i])))fail('Exact finite cutter bounds are not representable');
 if([...origin,...max,...dimensions].some(n=>!Number.isFinite(n)||Math.abs(n)>1e6)||dimensions.some(n=>n<=0)||origin.some((n,i)=>i!==j&&!(n<metrics.nativeBounds.min[i]))||max.some((n,i)=>i!==j&&!(n>metrics.nativeBounds.max[i]))||!(frame.origin[j]>metrics.nativeBounds.min[j]&&frame.origin[j]<metrics.nativeBounds.max[j]))fail('A finite exterior section cutter is not representable');
 if(target.faces.some(f=>f.type==='plane'&&Math.abs(dot(f.analytic.normal,frame.n))===1&&Math.abs(dot(sub(f.analytic.origin,frame.origin),frame.n))<=1e-7))fail('An original face coincides with the section support');
 const pointer=name=>{const p=stringPointer(name);if(!p)fail('Section scratch allocation failed','RESOURCE_LIMIT');pointers.push(p);return p;};
 try{
  const cutterName=allocateName(),resultName=allocateName(); // reserve BOTH before Native work
  const cutterPointer=pointer(cutterName),resultPointer=pointer(resultName),targetPointer=pointer(targetName);
  attempted.push(cutterName);globalThis.__OCI_EXCHANGE_VAL=null;Module._CreateOwnedBoxWithFacesV1(cutterPointer,...origin,...dimensions);const box=globalThis.__OCI_EXCHANGE_VAL;globalThis.__OCI_EXCHANGE_VAL=null;
  const boxError=portError(box);
  if(boxError==='BOX_CONSTRUCTION_RESOURCE_LIMIT')fail('Actual section box creation failed: '+boxError,'RESOURCE_LIMIT');
  if(!box||box.error||box.valid!==true||box.empty!==false||box.solidCount!==1||Module._OwnedShapeNamesV2()!==beforeNames+1)fail('Actual section box creation failed','ENGINE_FAILURE');
  known.add(cutterName);const cutter=validateOwnedTopology(query('_ReadOwnedTopologyV1',cutterName));
  if(!box.nativeBounds||['min','max'].some(k=>!Array.isArray(box.nativeBounds[k])||box.nativeBounds[k].length!==3||box.nativeBounds[k].some(n=>!Number.isFinite(n))))fail('Actual box bounds are unavailable','ENGINE_FAILURE');
  if(!box.construction||!Array.isArray(box.construction.faces)||box.construction.faces.length!==6)fail('Scratch box construction is unavailable','ENGINE_FAILURE');
  for(const row of box.construction.faces){const roleIndex=['X_MIN','X_MAX','Y_MIN','Y_MAX','Z_MIN','Z_MAX'].indexOf(row.role),k=Math.floor(roleIndex/2),face=cutter.faces[row.face-1];if(roleIndex<0||!face||face.type!=='plane'||!axis(face.analytic.normal)||Math.abs(face.analytic.normal[k])!==1||!Object.is(face.analytic.origin[k],roleIndex%2?max[k]:origin[k]))fail('Actual cutter side support differs from its builder role','ENGINE_FAILURE');}

  attempted.push(resultName);globalThis.__OCI_EXCHANGE_VAL=null;Module._ApplyOwnedBooleanHistoryV1(targetPointer,cutterPointer,resultPointer,2);const created=globalThis.__OCI_EXCHANGE_VAL;globalThis.__OCI_EXCHANGE_VAL=null;
  const booleanError=portError(created);
  if(booleanError==='BOOLEAN_RESOURCE_LIMIT')fail('Native section common failed: '+booleanError,'RESOURCE_LIMIT');
  if(!created||created.error)fail('Native section common failed'+(booleanError?': '+booleanError.slice(0,128):''),'ENGINE_FAILURE');
  if(Module._OwnedShapeNamesV2()!==beforeNames+2)fail('Section result ownership differs','ENGINE_FAILURE');
  known.add(resultName);const cut=validateOwnedTopology(query('_ReadOwnedTopologyV1',resultName));validateOwnedBooleanResult(created,{sourceTopologies:[target,cutter],topology:cut});
  if(created.empty||created.solidCount!==1||!(created.nativeVolume>0))fail('Section common is not a positive single solid');
  const faces=capSet({created,source:{topology:cutter,construction:box.construction},cut,frame,cutterRole:role});output=packCaps(cut,faces,frame);
 }catch(cause){failure={cause};}
 finally{
  globalThis.__OCI_EXCHANGE_VAL=null;
  for(const name of attempted.reverse()){
   let ptr=0;try{ptr=stringPointer(name);const before=Module._OwnedShapeNamesV2(),released=Module._ReleaseOwnedShapeV2(ptr);if(![0,1].includes(released)||known.has(name)&&released!==1||Module._OwnedShapeNamesV2()!==before-released)throw Error('Section scratch ownership could not be reconciled');}catch(cause){cleanupFailure('Section Native cleanup was not established',cause);}finally{if(ptr)try{free(ptr);}catch(cause){cleanupFailure('Section cleanup scratch release failed',cause);}}
  }
  try{if(Module._OwnedShapeNamesV2()!==beforeNames||JSON.stringify(query('_ReadOwnedTopologyV1',targetName))!==sourceJSON||JSON.stringify(query('_InspectOwnedSolidV2',targetName))!==metricsJSON)throw Error('Section changed its original Native input');}catch(cause){cleanupFailure('Section input preservation was not established',cause);}
  for(const p of pointers)try{free(p);}catch(cause){cleanupFailure('Section scratch cleanup was not established',cause);}
 }
 if(failure!==null)throw failure.cause;return output;
}
