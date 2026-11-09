// Worker-only facts; requirements are authored intent, never conformance.
export const DRAWING_REQUIREMENT_REFERENCE_REASONS=Object.freeze(['DRAWING_REFERENCE_UNRESOLVED','DRAWING_REFERENCE_MISSING','DRAWING_TYPE_CHANGED','DRAWING_SOURCE_CHANGED','DRAWING_HOLE_WITNESS_UNAVAILABLE','DRAWING_AMBIGUOUS_ANCESTRY','DRAWING_FINITE_EXTENT_UNQUALIFIED','DRAWING_AXIS_UNSUPPORTED','DRAWING_NO_DESCENDANT','DRAWING_MULTIPLE_DESCENDANTS','DRAWING_MERGED_DESCENDANT','NO_DESCENDANT','MULTIPLE_DESCENDANTS','MERGED_DESCENDANT','AUTHORED_REMOVAL','UNRESOLVED_SELECTION','DRAWING_PLANE_UNQUALIFIED','DRAWING_DATUM_FRAME_UNQUALIFIED','DRAWING_POSITION_AXIS_UNQUALIFIED','DRAWING_FIT_NOMINAL_UNAVAILABLE','DRAWING_FIT_LIMIT_DOMAIN','DRAWING_SURFACE_UNQUALIFIED']);
const reasons=new Set(DRAWING_REQUIREMENT_REFERENCE_REASONS);
export function drawingRequirementReferenceReason(error){const d=error&&typeof error==='object'?Object.getOwnPropertyDescriptor(error,'code'):null;return d&&Object.hasOwn(d,'value')&&reasons.has(d.value)?d.value:null;}
const unavailable=code=>{throw Object.assign(Error(code),{code});};
const fatal=message=>{throw Object.assign(Error(message),{code:'ENGINE_FAILURE'});};
const resource=message=>{throw Object.assign(Error(message),{code:'RESOURCE_LIMIT'});};
const TOL=1e-7,DIR=1e-8,sub=(a,b)=>a.map((v,i)=>v-b[i]),add=(a,b)=>a.map((v,i)=>v+b[i]),mul=(a,k)=>a.map(v=>v*k),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],norm=a=>Math.hypot(...a),near=(a,b)=>norm(sub(a,b))<=TOL;
const point=p=>Array.isArray(p)&&p.length===3&&p.every(v=>typeof v==='number'&&Number.isFinite(v)&&Math.abs(v)<=4e6),copy=p=>[...p];
const freeze=v=>{if(v&&typeof v==='object'){for(const x of Object.values(v))freeze(x);Object.freeze(v);}return v;};
export function createDrawingRequirementResolver({topology,index,frame,readBore}){
 if(index?.plan?.version!==2||typeof index.resolveFace!=='function'||typeof readBore!=='function'||!frame||!['origin','x','y','z'].every(k=>point(frame[k])))fatal('Current private requirement source/index is unavailable.');
 if(topology.valid!==true||topology.solidCount!==1)fatal('Requirements require actual valid single-solid topology.');
 const cache=new Map();
 function plane(reference){
  const key=reference.selectionId,prior=cache.get(key);if(prior){if(prior.origin!==reference.originFeatureId)unavailable('DRAWING_SOURCE_CHANGED');return prior.facts;}
  const descriptors=index.plan.faces.filter(d=>d.id===key);
  if(descriptors.length!==1||descriptors[0].originFeatureId!==reference.originFeatureId){const old=index.plan.unresolved.find(r=>r.kind==='face'&&r.id===key);if(old&&old.originFeatureId===reference.originFeatureId&&reasons.has(old.reason))unavailable(old.reason);unavailable('DRAWING_REFERENCE_UNRESOLVED');}
  const at=index.resolveFace(key);if(!Number.isSafeInteger(at)||at<1||at>topology.faces.length)fatal('Plane resolver returned invalid actual membership.');
  const face=topology.faces[at-1];if(face.type!=='plane'||reference.geometry!=='plane'||descriptors[0].geometry!=='plane')unavailable('DRAWING_TYPE_CHANGED');
  if(!['FORWARD','REVERSED'].includes(face.orientation)||!face.wires.length||face.wires.some(w=>!w.length))unavailable('DRAWING_PLANE_UNQUALIFIED');
  const support=face.analytic,vertices=new Set(),onPlane=p=>point(p)&&Math.abs(dot(sub(p,support.origin),support.normal))<=TOL;
  for(const wire of face.wires)for(const use of wire){
   if(!['FORWARD','REVERSED'].includes(use.orientation)||use.seam)unavailable('DRAWING_PLANE_UNQUALIFIED');const edge=topology.edges[use.edge-1];
   if(edge.degenerated||!['line','circle'].includes(edge.type)||!(edge.range[1]>edge.range[0])||edge.vertices.some(v=>!Number.isSafeInteger(v)||v<1||v>topology.vertices.length))unavailable('DRAWING_PLANE_UNQUALIFIED');
   const points=edge.vertices.map(v=>{vertices.add(v);return topology.vertices[v-1].point;});if(!points.every(onPlane))unavailable('DRAWING_PLANE_UNQUALIFIED');let ends;
   if(edge.type==='line'){if(!onPlane(edge.analytic.origin)||Math.abs(dot(edge.analytic.direction,support.normal))>DIR)unavailable('DRAWING_PLANE_UNQUALIFIED');ends=edge.range.map(t=>add(edge.analytic.origin,mul(edge.analytic.direction,t)));}
   else{const a=edge.analytic;if(!onPlane(a.center)||norm(cross(a.axis,support.normal))>DIR||Math.abs(dot(a.x,a.y))>DIR||norm(sub(cross(a.x,a.y),a.axis))>DIR||Math.abs(dot(a.x,support.normal))>DIR||Math.abs(dot(a.y,support.normal))>DIR)unavailable('DRAWING_PLANE_UNQUALIFIED');ends=edge.range.map(t=>add(a.center,mul(add(mul(a.x,Math.cos(t)),mul(a.y,Math.sin(t))),a.radius)));}
   if(!ends.every(onPlane)||!points.every(p=>ends.some(q=>near(p,q))))unavailable('DRAWING_PLANE_UNQUALIFIED');
  }
  if(!vertices.size)unavailable('DRAWING_PLANE_UNQUALIFIED');const matches=['x','y','z'].filter(k=>norm(cross(support.normal,frame[k]))<=DIR),sourceAxis=matches.length===1?matches[0]:null,normal=sourceAxis&&dot(support.normal,frame[sourceAxis])<0?mul(support.normal,-1):copy(support.normal);
  const facts=freeze({support:{origin:copy(support.origin),normal},anchor:copy(topology.vertices[Math.min(...vertices)-1].point),sourceAxis});cache.set(key,{origin:reference.originFeatureId,facts});return facts;
 }
 return Object.freeze({plane,discover(){
  const rows=index.plan.faces.filter(d=>d.geometry==='plane');if(rows.length>16)resource('Requirement plane discovery exceeds16 actual references.');
  return Object.freeze(rows.map(d=>{const reference=freeze({kind:'native-face',originFeatureId:d.originFeatureId,selectionId:d.id,geometry:'plane'});try{return freeze({reference,sourceRole:d.role,status:'available',reason:null,quality:'native-brep-analytic',facts:plane(reference)});}catch(error){const reason=drawingRequirementReferenceReason(error);if(!reason)throw error;return freeze({reference,sourceRole:d.role,status:'unresolved',reason,quality:null,facts:null});}}));
 },resolve(definition,dimensions){return resolveRows(definition,dimensions,plane,frame,readBore,topology,index);}});
}
function resolveRows(definition,dimensions,plane,frame,readBore,topology,index){
 const indexForPlane=ref=>index.resolveFace(ref.selectionId),topologyForPlane=at=>topology.faces[at-1],topologyEdge=at=>topology.edges[at-1];
 function currentBoreFace(at){if(!Number.isSafeInteger(at)||at<1||at>topology.faces.length||topology.faces[at-1].type!=='cylinder')fatal('Invalid private finite bore membership');return topology.faces[at-1];}
 const datumFeatures=definition.datumFeatures.map(d=>{try{const facts=plane(d.reference);if(facts.sourceAxis!==({A:'z',B:'x',C:'y'})[d.symbol])unavailable('DRAWING_DATUM_FRAME_UNQUALIFIED');return{annotationId:d.annotationId,symbol:d.symbol,status:'available',reason:null,quality:'native-brep-analytic',facts};}catch(error){const reason=drawingRequirementReferenceReason(error);if(!reason)throw error;return{annotationId:d.annotationId,symbol:d.symbol,status:'unresolved',reason,quality:null,facts:null};}});
 const base=r=>({annotationId:r.annotationId,kind:r.kind,requirementRole:'authored-manufacturing-requirement'}),missing=(r,reason)=>({...base(r),status:'unresolved',reason,quality:null,facts:null});
 function triad(){
  const rows=['A','B','C'].map(s=>datumFeatures.find(d=>d.symbol===s));if(rows.some(r=>!r))unavailable('DRAWING_DATUM_FRAME_UNQUALIFIED');const bad=rows.find(r=>r.status!=='available');if(bad)return{reason:bad.reason};
  const n=rows.map(r=>r.facts.support.normal),h=rows.map((r,i)=>dot(n[i],r.facts.support.origin));if(n.some((a,i)=>n.slice(0,i).some(b=>Math.abs(dot(a,b))>DIR)))unavailable('DRAWING_DATUM_FRAME_UNQUALIFIED');
  const bc=cross(n[1],n[2]),ca=cross(n[2],n[0]),ab=cross(n[0],n[1]),den=dot(n[0],bc);if(!Number.isFinite(den)||den===0)unavailable('DRAWING_DATUM_FRAME_UNQUALIFIED');const origin=mul(add(add(mul(bc,h[0]),mul(ca,h[1])),mul(ab,h[2])),1/den);if(!point(origin))unavailable('DRAWING_DATUM_FRAME_UNQUALIFIED');
  return{frame:{origin,x:copy(frame.x),y:copy(frame.y),z:copy(frame.z)},plane:rows[0].facts.support};
 }
 const requirements=definition.requirements.map(r=>{try{let facts;
  if(r.kind==='surface-finish'){
   const p=plane(r.target),maximumMillimeters=r.maximum.value/1000;if(!Number.isFinite(maximumMillimeters)||maximumMillimeters<=0)unavailable('DRAWING_SURFACE_UNQUALIFIED');facts={support:p.support,anchor:copy(p.anchor),maximumMillimeters};
  }else{
   const dimension=r.kind==='clearance-fit'?definition.dimensions.find(d=>d.dimensionId===r.nominalDimensionId):null;
   if(r.kind==='clearance-fit'&&(!dimension||dimension.kind!=='hole-diameter'))unavailable('DRAWING_FIT_NOMINAL_UNAVAILABLE');
   const h=readBore(r.kind==='position-tolerance'?r.target:dimension.hole);
   // An inherited, already-recorded naming failure is data, not a fresh
   // Native/resource exception. Preserve its first reason without catching one.
   if(h.status==='unresolved'){if(typeof h.reason!=='string'||!h.reason||h.reason.length>256)fatal('Invalid inherited requirement reason');return missing(r,h.reason);}
   if(h.status!=='available'||!h.finite)fatal('The private requirement bore reader returned malformed evidence.');const b=h.finite;
   if(r.kind==='position-tolerance'){
    const t=triad();if(t.reason)return missing(r,t.reason);if(norm(cross(b.axis,frame.z))>DIR)unavailable('DRAWING_POSITION_AXIS_UNQUALIFIED');
    const den=dot(t.plane.normal,b.axis);if(!Number.isFinite(den)||Math.abs(den)<=DIR)unavailable('DRAWING_POSITION_AXIS_UNQUALIFIED');const axisPoint=add(b.intersection,mul(b.axis,dot(sub(t.plane.origin,b.intersection),t.plane.normal)/den)),levels=b.ends.map(p=>dot(p,frame.z)),level=dot(axisPoint,frame.z);
    if(!point(axisPoint)||level<Math.min(...levels)-TOL||level>Math.max(...levels)+TOL)unavailable('DRAWING_POSITION_AXIS_UNQUALIFIED');
    const aRef=definition.datumFeatures.find(d=>d.symbol==='A').reference,aIndex=indexForPlane(aRef),aFace=topologyForPlane(aIndex),cylinder=currentBoreFace(h.resultFace),rims=cylinder.wires[0].filter(u=>!u.seam).map(u=>u.edge),shared=[...new Set(aFace.wires.flat().filter(u=>rims.includes(u.edge)&&!u.seam).map(u=>u.edge))];
    if(shared.length!==1||!near(axisPoint,topologyEdge(shared[0]).analytic.center)||!b.ends.some(p=>near(p,axisPoint)))unavailable('DRAWING_POSITION_AXIS_UNQUALIFIED');
    const delta=sub(axisPoint,t.frame.origin),axisDirection=dot(b.axis,frame.z)<0?mul(b.axis,-1):copy(b.axis);facts={datumFrame:t.frame,axisPoint,axisDirection,axisEnds:b.ends.map(copy),diameter:2*b.radius,coordinates:['x','y','z'].map(k=>dot(delta,t.frame[k])),anchor:copy(axisPoint)};
   }else{
    const d=dimensions.find(d=>d.dimensionId===r.nominalDimensionId);if(!d||d.status!=='available')return missing(r,d?.reason||'DRAWING_FIT_NOMINAL_UNAVAILABLE');const N=2*b.radius;if(Math.abs(d.value-N)>TOL)unavailable('DRAWING_FIT_NOMINAL_UNAVAILABLE');
    const holeLimits=[N+r.hole.lowerDeviation,N+r.hole.upperDeviation],declaredShaftLimits=[N+r.declaredShaft.lowerDeviation,N+r.declaredShaft.upperDeviation],minimum=r.hole.lowerDeviation-r.declaredShaft.upperDeviation,maximum=r.hole.upperDeviation-r.declaredShaft.lowerDeviation;
    if(![...holeLimits,...declaredShaftLimits,minimum,maximum].every(Number.isFinite)||holeLimits.some(n=>n<=0)||declaredShaftLimits.some(n=>n<=0)||holeLimits[0]>holeLimits[1]||declaredShaftLimits[0]>declaredShaftLimits[1]||minimum<=0||maximum<minimum)unavailable('DRAWING_FIT_LIMIT_DOMAIN');
    facts={nominalDimensionId:r.nominalDimensionId,nominalDiameter:N,holeLimits,declaredShaftLimits,clearance:{minimum,maximum,unit:'millimeter'},anchor:copy(b.diameterAnchors[1])};
   }
  }
  return{...base(r),status:'available',reason:null,quality:'native-bound-requirement-reference',facts};
 }catch(error){const reason=drawingRequirementReferenceReason(error);if(!reason)throw error;return missing(r,reason);}});
 return freeze({datumFeatures,requirements});
}
