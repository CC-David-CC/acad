// Research-only initial-construction proof. Never run against an edited
// descendant to relabel topology. Numeric indices are audit-local, not IDs.
const reject=(code,message)=>({status:'unsupported',reason:{code,message}}),axes=['X','Y','Z'];
export function captureBox(request){
 if(request?.op!=='solid.box.create'||request.version!==1||request.unit!=='millimeter'||![request.origin,request.dimensions].every(v=>Array.isArray(v)&&v.length===3&&v.every(n=>typeof n==='number'&&Number.isFinite(n)))||request.origin.some(n=>Math.abs(n)>1e6)||request.dimensions.some(n=>n<=0||n>1e6))return{status:'invalid-source',reason:{code:'INVALID_BOX_SOURCE',message:'Expected bounded positive millimeter box source.'}};
 const origin=Object.freeze(request.origin.slice()),dimensions=Object.freeze(request.dimensions.slice()),max=Object.freeze(origin.map((n,i)=>n+dimensions[i]));
 if(max.some((n,i)=>!Number.isFinite(n)||n<=origin[i]))return reject('SOURCE_EXTENTS_COLLAPSED','Binary64 source does not distinguish all minimum/maximum extents.');
 return Object.freeze({status:'captured',source:Object.freeze({kind:'box',unit:'millimeter',origin,dimensions,max})});
}
export function proveInitialBox(captured,catalog,evidence,featureId=501){
 if(captured?.status!=='captured')return captured;
 const fail=(code,message)=>{throw Object.assign(Error(message),{code});};
 try{
  if(!Number.isSafeInteger(featureId)||featureId<1)fail('INVALID_BOX_SOURCE','Expected an authored feature identity.');
  if(catalog?.version!==1||catalog.scope!=='response-local'||catalog.persistentIds!==false||catalog.valid!==true||catalog.solidCount!==1||evidence?.nativeValidity?.valid!==true||evidence.solidCount!==1)fail('NATIVE_VALIDITY_UNPROVED','A valid native single solid is required.');
  if(catalog.vertices?.length!==8||catalog.edges?.length!==12||catalog.faces?.length!==6)fail('BOX_TOPOLOGY_NOT_SIMPLE','Initial box requires complete8/12/6 native topology.');
  const s=captured.source,vertices=new Map(),cornerIds=new Set(),edgePairs=new Set(),edges=new Map(),faces=new Map(),faceRoles=new Map(),uses=new Map(),vertexEdges=new Map(),vertexFaces=new Map();
  for(const [i,v]of catalog.vertices.entries()){
   if(v.index!==i+1||!Array.isArray(v.point)||v.point.length!==3)fail('BOX_CORNER_UNPROVED','Incomplete native vertex catalog.');
   const bits=v.point.map((n,j)=>n===s.origin[j]?0:n===s.max[j]?1:-1);if(bits.includes(-1))fail('BOX_CORNER_UNPROVED','A native vertex is not an EXACT captured box corner.');
   const id=bits.join('');if(cornerIds.has(id))fail('BOX_CORNER_NOT_UNIQUE','Multiple native vertices occupy one source corner.');cornerIds.add(id);vertices.set(v.index,{point:v.point,bits});vertexEdges.set(v.index,[]);vertexFaces.set(v.index,[]);
  }
  if(cornerIds.size!==8)fail('BOX_CORNER_UNPROVED','All eight source corners must occur exactly once.');
  for(const [i,e]of catalog.edges.entries()){
   const ends=e.vertices?.map(v=>vertices.get(v));if(e.index!==i+1||e.type!=='line'||e.support!=='analytic-descriptor'||e.degenerated!==false||!ends||ends.length!==2||ends.some(v=>!v)||e.vertices[0]===e.vertices[1])fail('BOX_EDGE_UNPROVED','Every edge must be one nondegenerate analytic line between known vertices.');
   const varying=[0,1,2].filter(j=>ends[0].bits[j]!==ends[1].bits[j]);if(varying.length!==1)fail('BOX_EDGE_UNPROVED','An edge must connect corners differing in exactly one axis.');
   const axis=varying[0],key=e.vertices.slice().sort((a,b)=>a-b).join(':');if(edgePairs.has(key))fail('BOX_EDGE_NOT_UNIQUE','Duplicate native corner-edge incidence.');edgePairs.add(key);
   const a=e.analytic;if(!a||!Array.isArray(a.direction)||a.direction.length!==3||a.direction.some((n,j)=>j===axis?Math.abs(n)!==1:n!==0)||!Array.isArray(a.origin)||a.origin.length!==3||a.origin.some((n,j)=>j!==axis&&n!==ends[0].point[j]))fail('BOX_LINE_UNPROVED','Line support must EXACTLY agree with captured axis/corner incidence.');
   if(!Array.isArray(e.range)||e.range.length!==2||!e.range.every(Number.isFinite)||e.range[0]>=e.range[1])fail('BOX_LINE_UNPROVED','A finite nonempty native line interval is required.');
   const evaluated=e.range.map(t=>a.origin.map((n,j)=>n+t*a.direction[j]));if(evaluated[0].every((n,j)=>n===evaluated[1][j])||!ends.every(v=>evaluated.some(p=>p.every((n,j)=>n===v.point[j]))))fail('BOX_LINE_UNPROVED','Native line interval endpoints must cover both distinct captured corner endpoints exactly.');
   edges.set(e.index,{edge:e,axis,ends:e.vertices});for(const v of e.vertices)vertexEdges.get(v).push(e.index);uses.set(e.index,[]);
  }
  if([...vertexEdges.values()].some(xs=>xs.length!==3))fail('BOX_INCIDENCE_UNPROVED','Each corner requires exactly three distinct incident edges.');
  for(const [i,f]of catalog.faces.entries()){
   if(f.index!==i+1||f.type!=='plane'||f.support!=='analytic-descriptor'||!['FORWARD','REVERSED'].includes(f.orientation)||f.wires?.length!==1||f.wires[0].length!==4)fail('BOX_FACE_UNPROVED','Each face requires one four-line planar wire.');
   const ids=new Set(),vs=new Set(),degree=new Map();for(const use of f.wires[0]){
    const e=edges.get(use.edge);if(!e||ids.has(use.edge)||use.seam!==false||!['FORWARD','REVERSED'].includes(use.orientation))fail('BOX_INCIDENCE_UNPROVED','Face-edge incidence must be unique, nonseam and oriented.');ids.add(use.edge);uses.get(use.edge).push(f.index);
    for(const v of e.ends){vs.add(v);degree.set(v,(degree.get(v)||0)+1);}
   }
   if(vs.size!==4||[...degree.values()].some(n=>n!==2))fail('BOX_FACE_UNPROVED','Each face requires a closed rectangular four-corner cycle.');
   const candidates=[];for(let axis=0;axis<3;axis++)for(const bit of[0,1])if([...vs].every(v=>vertices.get(v).bits[axis]===bit))candidates.push({axis,bit});
   if(candidates.length!==1)fail('BOX_FACE_NOT_UNIQUE','Face source-side role must be unique from exact corner incidence.');
   const {axis,bit}=candidates[0],a=f.analytic,sign=f.orientation==='FORWARD'?1:-1;
   if(!a||a.origin?.[axis]!==s[bit?'max':'origin'][axis]||!Array.isArray(a.normal)||a.normal.length!==3||a.normal.some((n,j)=>j===axis?n*sign!==(bit?1:-1):n!==0))fail('BOX_PLANE_UNPROVED','Plane/outward orientation must exactly agree with the unique source side.');
   const role=axes[axis]+'_'+(bit?'MAX':'MIN');if(faceRoles.has(role))fail('BOX_FACE_NOT_UNIQUE','Two native faces claim one authored side.');faces.set(f.index,{role,axis,bit});faceRoles.set(role,f.index);for(const v of vs)vertexFaces.get(v).push(f.index);
  }
  if(faceRoles.size!==6||[...vertexFaces.values()].some(xs=>xs.length!==3))fail('BOX_INCIDENCE_UNPROVED','All six sides and three faces per corner must be covered.');
  const edgeRows=[],bindings={edges:{},faces:{}},pairs=new Set();
  const faceRows=[...faceRoles].sort(([a],[b])=>a.localeCompare(b)).map(([role,index])=>{const id='worker-box-selection:1:'+JSON.stringify([featureId,'face',role]);bindings.faces[id]=index;return{id,role,geometry:'plane'};});
  for(const [index,e]of edges){const adjacent=uses.get(index);if(adjacent.length!==2||adjacent[0]===adjacent[1])fail('BOX_INCIDENCE_UNPROVED','Each edge needs exactly two distinct native adjacent faces.');const fs=adjacent.map(n=>faces.get(n));if(fs[0].axis===fs[1].axis||fs.some(f=>e.axis===f.axis||e.ends.some(v=>vertices.get(v).bits[f.axis]!==f.bit)))fail('BOX_INCIDENCE_UNPROVED','Adjacent authored sides must be the edge fixed axes.');const roles=fs.map(f=>f.role).sort(),pair=roles.join(':');if(pairs.has(pair))fail('BOX_EDGE_NOT_UNIQUE','A source-side pair must identify exactly one native edge.');pairs.add(pair);const id='worker-box-selection:1:'+JSON.stringify([featureId,'edge',roles]);bindings.edges[id]=index;edgeRows.push({id,role:'intersection',incidentFaceRoles:roles,geometry:'line'});}
  edgeRows.sort((a,b)=>a.id.localeCompare(b.id));
  return{status:'available',scope:'initial-construction-only-prototype',plan:{version:2,featureId,regionId:null,sourceContext:{kind:'box',featureId},scope:'authored-source',source:'box-construction-proof',edges:edgeRows,faces:faceRows,unresolved:[]},responseLocalBindings:bindings,proof:{corners:8,edges:12,faces:6,coordinateRule:'EXACT_SOURCE_EXTENTS_AND_INCIDENCE',tolerance:0,nearestMatching:false,subsequentCoordinateRelabeling:false}};
 }catch(e){return reject(e.code||'BOX_ORIGIN_PROOF_FAILED',e.message);}
}
