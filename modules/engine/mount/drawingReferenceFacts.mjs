import {captureBoreReadResult,unresolvedBoreRead,BORE_DISCOVERY_LIMIT} from './ownedBoreReadProtocol.mjs';
import {inspectFiniteCylinder as finiteCylinder,createPrismaticBoreObserver} from './prismaticBoreFacts.mjs';
// Worker-only geometric facts. Every slot stays private to its current owned
// result; no caller flag, mesh, HLR fragment or nominal dimension is evidence.
import {captureLinkedPartDrawingDefinition} from '../../drawing/linkedPartDrawingDefinition.mjs';
import {qualifySourceCurveId} from '../extrusion/selectedRegionDescriptor.mjs';
import {validateOwnedTopology} from './ownedTopologyContract.mjs';
import {reconcileNativeSelectionClaims} from './booleanSelectionClaims.mjs';
import {captureDrawingReadResult,unresolvedDrawingRead} from './ownedDrawingReadProtocol.mjs';
const tol=1e-7,dirTol=1e-8,sub=(a,b)=>a.map((n,i)=>n-b[i]),add=(a,b)=>a.map((n,i)=>n+b[i]),mul=(a,n)=>a.map(x=>x*n),dot=(a,b)=>a.reduce((n,x,i)=>n+x*b[i],0),norm=a=>Math.hypot(...a),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],near=(a,b)=>norm(sub(a,b))<=tol;
const unavailable=reason=>{throw Object.assign(Error(reason),{code:reason});};
const freeze=v=>{if(v&&typeof v==='object'){for(const x of Object.values(v))freeze(x);Object.freeze(v);}return v;};
export const captureDrawingDefinition=captureLinkedPartDrawingDefinition;
export const unresolvedOwnedDrawingReferences=unresolvedDrawingRead;
export function drawingCylinderKey(record){
 const slot=record.slot||(record.intent.kind==='centered-through'?'center':null);
 if(!slot)throw Object.assign(Error('A private semantic bore slot is missing.'),{code:'ENGINE_FAILURE'});
 return 'bore:'+record.intent.featureId+':'+slot;
}
export function propagateDrawingCylinders(records,ancestry,topology,featureId){
 if(!records?.length)return Object.freeze([]);validateOwnedTopology(topology);
 const available=records.filter(r=>r.status==='available'),counts=new Map();for(const r of available)counts.set(r.witness.resultFace,(counts.get(r.witness.resultFace)||0)+1);
 const unique=available.filter(r=>counts.get(r.witness.resultFace)===1),id=drawingCylinderKey;
 let claims;try{claims=reconcileNativeSelectionClaims({sources:[{claims:unique.map(r=>({kind:'face',id:id(r),sourceIndex:r.witness.resultFace})),ancestry}],topology});}catch(e){if(!['SELECTION_RESOURCE_LIMIT','SELECTION_UNAVAILABLE'].includes(e?.code))throw e;return Object.freeze(records.map(r=>r.status==='available'?freeze({...r,status:'unresolved',reason:e.code,failedFeatureId:featureId}):r));}
 return Object.freeze(records.map(record=>{if(record.status!=='available')return record;const missing=reason=>freeze({...record,status:'unresolved',reason,failedFeatureId:featureId});if(counts.get(record.witness.resultFace)!==1)return missing('DRAWING_AMBIGUOUS_ANCESTRY');const resolved=claims.resolved.find(x=>x.id===id(record));if(!resolved)return missing('DRAWING_'+(claims.unresolved.find(x=>x.id===id(record))?.reason||'REFERENCE_MISSING'));const index=claims.resolveFace(id(record)),face=topology.faces[index-1],prior=record.witness.cylinder;if(face.type!=='cylinder'||Math.abs(face.analytic.radius-prior.radius)>tol||norm(cross(face.analytic.axis,prior.axis))>dirTol||norm(cross(sub(face.analytic.origin,prior.origin),prior.axis))>tol)return missing('DRAWING_TYPE_CHANGED');return freeze({...record,witness:{...record.witness,resultFace:index,cylinder:{origin:[...face.analytic.origin],axis:[...face.analytic.axis],radius:face.analytic.radius},diameter:2*face.analytic.radius}});}));
}
function constructorDatum(sourceProfile,sourceExtent){
 if(sourceExtent!==undefined){
  if(sourceProfile!==undefined)throw Object.assign(Error('Conflicting private drawing source constructors'),{code:'ENGINE_FAILURE'});
  const profile=sourceExtent.request,interval=sourceExtent.binding.interval;
  return {profile,kind:'sketch-profile-extent',frame:{...profile.frame,interval:{lower:interval.lower,upper:interval.upper}}};
 }
 return {profile:sourceProfile,kind:'sketch-profile',frame:{...sourceProfile.frame,depth:sourceProfile.depth}};
}
export function resolveOwnedDrawingReferences({definition,topology,index,sourceProfile,sourceExtent,sourceFeatureId,sourceRegionId,cylinders,classify}){
 const def=captureLinkedPartDrawingDefinition(definition);validateOwnedTopology(topology);const datum=constructorDatum(sourceProfile,sourceExtent),profile=datum.profile;
 if(!index||def.datum.featureId!==sourceFeatureId||def.datum.regionId!==sourceRegionId||profile.region.id!==sourceRegionId||!index.plan.sourceContexts?.some(c=>c.kind===datum.kind&&c.featureId===sourceFeatureId&&c.regionId===sourceRegionId))return unresolvedDrawingRead(def,'DRAWING_DATUM_UNAVAILABLE');
 const f=datum.frame,world=p=>add(f.origin,add(mul(f.x,p[0]),mul(f.y,p[1]))),curves=[...profile.region.outer,...profile.region.holes.flat()];
 function sourcePoint(r){const id=qualifySourceCurveId(r.faceId,r.curveId),curve=curves.find(c=>c.id===id);if(r.featureId!==sourceFeatureId||r.faceId!==def.datum.faceId||r.regionId!==sourceRegionId||!curve)unavailable('DRAWING_SOURCE_CHANGED');if(curve.kind!==r.curveType)unavailable('DRAWING_TYPE_CHANGED');const p=curve.kind==='circle'?curve.center:curve[r.point];if(!p)unavailable('DRAWING_REFERENCE_MISSING');return world(p);}
 function nativeRef(r,kind){const list=kind==='face'?index.plan.faces:index.plan.edges,descriptor=list.find(x=>x.id===r.selectionId);if(!descriptor||descriptor.originFeatureId!==r.originFeatureId)unavailable('DRAWING_REFERENCE_UNRESOLVED');let i;try{i=kind==='face'?index.resolveFace(r.selectionId):index.resolveEdge(r.selectionId);}catch{unavailable('DRAWING_REFERENCE_UNRESOLVED');}const entity=(kind==='face'?topology.faces:topology.edges)[i-1];if(entity.type!==r.geometry)unavailable('DRAWING_TYPE_CHANGED');return entity;}
 const boreReader=createBoreReader({topology,frame:f,cylinders,classify});
 function hole(r){return boreReader.finite(r.kind==='through-hole'?r:{...r,holeKind:'centered-through'});}
 const facePoints=face=>[...new Set(face.wires.flat().flatMap(u=>topology.edges[u.edge-1].vertices))].filter(i=>i>0).map(i=>topology.vertices[i-1].point);
 const dimensions=def.dimensions.map(d=>{try{let value,anchors,quality='native-brep-analytic';if(d.kind==='source-distance'){anchors=[sourcePoint(d.from),sourcePoint(d.to)];value=Math.abs(dot(sub(anchors[1],anchors[0]),d.axis==='datum-x'?f.x:f.y));quality='solved-source-datum';}else if(d.kind==='edge-length'){const edge=nativeRef(d.edge,'edge');anchors=edge.range.map(t=>add(edge.analytic.origin,mul(edge.analytic.direction,t)));if(!edge.vertices.every(i=>i>0&&anchors.some(p=>near(p,topology.vertices[i-1].point))))unavailable('DRAWING_FINITE_EXTENT_UNQUALIFIED');value=norm(sub(anchors[1],anchors[0]));}else if(d.kind==='plane-distance'){const a=nativeRef(d.first,'face'),b=nativeRef(d.second,'face');if(norm(cross(a.analytic.normal,b.analytic.normal))>dirTol||norm(cross(a.analytic.normal,f.z))>dirTol)unavailable('DRAWING_CAP_ALIGNMENT_UNSUPPORTED');const distance=dot(sub(b.analytic.origin,a.analytic.origin),a.analytic.normal);value=Math.abs(distance);for(const p of facePoints(a)){const q=add(p,mul(a.analytic.normal,distance));const actual=facePoints(b).find(x=>near(x,q));if(actual){anchors=[p,actual];break;}}if(!anchors)unavailable('DRAWING_FINITE_EXTENT_UNQUALIFIED');}else{const h=hole(d.hole);quality='native-prism-cut-lineage';if(d.kind==='hole-diameter'){value=2*h.radius;anchors=h.diameterAnchors;}else{const delta=sub(h.intersection,f.origin),x=dot(delta,f.x),y=dot(delta,f.y);value=Math.abs(d.axis==='datum-x'?x:y);anchors=[add(f.origin,mul(d.axis==='datum-x'?f.y:f.x,d.axis==='datum-x'?y:x)),h.intersection];}}return{dimensionId:d.dimensionId,kind:d.kind,status:'available',reason:null,quality,value,anchors};}catch(e){if(typeof e?.code!=='string'||!(/^(DRAWING_|SELECTION_|UNRESOLVED_)/.test(e.code)))throw e;return{dimensionId:d.dimensionId,kind:d.kind,status:'unresolved',reason:e.code,quality:null,value:null,anchors:[]};}});
 // Source-relative, nonperspective isometric; no saved axes/camera or
 // rectangle-minimum origin. All frames are derived in this owning Worker.
 function viewFrame(basis){
  if(basis==='top')return{u:[...f.x],v:[...f.y],n:[...f.z]};
  if(basis==='front')return{u:[...f.x],v:[...f.z],n:mul(f.y,-1)};
  if(basis==='right')return{u:[...f.y],v:[...f.z],n:[...f.x]};
  if(basis==='isometric'&&def.version>=2)return{u:mul(sub(f.x,f.y),1/Math.sqrt(2)),v:mul(add(mul(add(f.x,f.y),-1),mul(f.z,2)),1/Math.sqrt(6)),n:mul(add(add(f.x,f.y),f.z),-1/Math.sqrt(3))};
  unavailable('DRAWING_VIEW_UNSUPPORTED');
 }
 const viewFrames=def.views.map(v=>{
  if(!['detail','bore-center-section'].includes(v.basis))return{viewId:v.viewId,frame:{origin:[...f.origin],...viewFrame(v.basis)}};
  try{
   const h=hole(v.basis==='detail'?v.focus:v.hole);
   if(norm(cross(h.axis,f.z))>dirTol)unavailable('DRAWING_BORE_AXIS_UNSUPPORTED');
   const frame={origin:[...h.intersection],...viewFrame(v.basis==='detail'?'top':'front')};
   // The existing Native frame transport is bounded at1e6. A valid source
   // outside that new-role envelope keeps its old views, never a blanket read
   // failure from the controller after advertising this derived frame.
   if(frame.origin.some(n=>!Number.isFinite(n)||Math.abs(n)>1e6))unavailable('DRAWING_VIEW_FRAME_UNQUALIFIED');
   return{viewId:v.viewId,status:'available',reason:null,frame};
  }catch(e){if(typeof e?.code!=='string'||!(/^(DRAWING_|SELECTION_|UNRESOLVED_)/.test(e.code)))throw e;return{viewId:v.viewId,status:'unresolved',reason:e.code,frame:null};}
 });
 const annotations=def.version===3?def.annotations.map(a=>{try{
  let facts;
  const refs=a.kind==='bore-center'?[a.hole]:a.holes,rows=refs.map(ref=>boreReader.observe(ref));
  if(a.kind==='bore-center'){const h=rows[0];facts={center:h.center,ends:h.ends,diameter:h.diameter};}
  else if(a.kind==='hole-callout'){
   for(const h of rows)if(h.through.status!=='available')unavailable(h.through.reason);
   if(rows.some(h=>Math.abs(h.diameter-rows[0].diameter)>tol))unavailable('DRAWING_GROUP_DIAMETER_CHANGED');
   facts={count:4,diameter:rows[0].diameter,through:true,centers:rows.map(h=>h.center)};
  }else{
   const anchors=rows.map(h=>{const delta=sub(h.center,f.origin),x=dot(delta,f.x),y=dot(delta,f.y);return[add(f.origin,mul(a.axis==='datum-x'?f.y:f.x,a.axis==='datum-x'?y:x)),h.center];});
   const coordinates=rows.map(h=>dot(sub(h.center,f.origin),a.axis==='datum-x'?f.x:f.y));
   facts=a.kind==='ordinate'?{coordinates,anchors}:{values:coordinates.map(Math.abs),anchors};
  }
  return{annotationId:a.annotationId,kind:a.kind,status:'available',reason:null,quality:'native-prism-cut-lineage',facts};
 }catch(e){if(typeof e?.code!=='string'||!(/^(DRAWING_|SELECTION_|UNRESOLVED_)/.test(e.code)))throw e;return{annotationId:a.annotationId,kind:a.kind,status:'unresolved',reason:e.code,quality:null,facts:null};}}):[];
 const available=dimensions.every(d=>d.status==='available')&&annotations.every(a=>a.status==='available')&&viewFrames.every(v=>v.frame!==null);
 return captureDrawingReadResult({version:1,unit:'millimeter',scope:'response-local',quality:'native-bound-drawing-references',drawingId:def.drawingId,featureId:def.target.featureId,status:available?'available':'unresolved',reason:available?null:'DRAWING_REFERENCES_UNRESOLVED',datumFrame:profile.frame,viewFrames,dimensions,...(def.version===3?{annotations}:{})},def);
}

function createBoreReader({topology,frame,cylinders,classify}){
 let observer;const cache=new Map();
 function row(ref){const rows=(cylinders||[]).filter(r=>r.intent.featureId===ref.featureId&&(r.slot||(r.intent.kind==='centered-through'?'center':null))===ref.slot);
  if(rows.length!==1)unavailable(rows.length?'DRAWING_AMBIGUOUS_ANCESTRY':'DRAWING_HOLE_WITNESS_UNAVAILABLE');
  const r=rows[0],i=r.intent;if(i.kind!==ref.holeKind||i.sourceFeatureId!==ref.sourceFeatureId||i.sourceFaceId!==ref.faceId||i.sourceRegionId!==ref.regionId)unavailable('DRAWING_SOURCE_CHANGED');
  if(r.status!=='available')unavailable(r.reason||'DRAWING_REFERENCE_UNRESOLVED');return r;
 }
 return Object.freeze({finite(ref){return finiteCylinder(topology,row(ref).witness,frame);},observe(ref){
  const r=row(ref),key=drawingCylinderKey(r);if(cache.has(key))return cache.get(key);
  observer ||= createPrismaticBoreObserver(topology,frame,classify);const h=observer.read(r.witness),facts=freeze({reference:ref,status:'available',reason:null,quality:'native-prism-cut-lineage',diameter:2*h.radius,center:h.intersection,axis:h.axis,ends:h.ends,through:h.through});cache.set(key,facts);return facts;
 }});
}
export function resolveOwnedBoreReferences({query,topology,index,sourceProfile,sourceExtent,sourceFeatureId,sourceRegionId,cylinders,classify}){
 validateOwnedTopology(topology);const datum=constructorDatum(sourceProfile,sourceExtent),profile=datum.profile;
 if(!index||query.datum.featureId!==sourceFeatureId||query.datum.regionId!==sourceRegionId||profile.region.id!==sourceRegionId||!index.plan.sourceContexts?.some(c=>c.kind===datum.kind&&c.featureId===sourceFeatureId&&c.regionId===sourceRegionId))return unresolvedBoreRead(query,'DRAWING_DATUM_UNAVAILABLE');
 const rows=(cylinders||[]).filter(r=>r.intent.sourceFeatureId===sourceFeatureId&&r.intent.sourceFaceId===query.datum.faceId&&r.intent.sourceRegionId===sourceRegionId);
 if(rows.length>BORE_DISCOVERY_LIMIT)throw Object.assign(Error('Current semantic bore discovery exceeds16 members.'),{code:'RESOURCE_LIMIT'});
 const reader=createBoreReader({topology,frame:datum.frame,cylinders,classify}),seen=new Set();
 const bores=rows.map(r=>{const reference={kind:'through-hole',featureId:r.intent.featureId,sourceFeatureId:r.intent.sourceFeatureId,faceId:r.intent.sourceFaceId,regionId:r.intent.sourceRegionId,holeKind:r.intent.kind,slot:r.slot||(r.intent.kind==='centered-through'?'center':null),geometry:'cylinder'},key=drawingCylinderKey(r);
  if(seen.has(key))throw Object.assign(Error('Duplicate private semantic bore key.'),{code:'ENGINE_FAILURE'});seen.add(key);
  try{return reader.observe(reference);}catch(e){if(typeof e?.code!=='string'||!(/^(DRAWING_|SELECTION_|UNRESOLVED_)/.test(e.code)))throw e;return{reference,status:'unresolved',reason:e.code,quality:null,diameter:null,center:null,axis:null,ends:[],through:null};}
 });
 const available=bores.every(r=>r.status==='available');return captureBoreReadResult({version:1,unit:'millimeter',scope:'response-local',quality:'native-bound-bore-references',featureId:query.target.featureId,datum:query.datum,status:available?'available':'unresolved',reason:available?null:'DRAWING_REFERENCES_UNRESOLVED',bores},query);
}
