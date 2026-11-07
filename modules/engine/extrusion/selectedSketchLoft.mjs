// Both solved sources must belong to ONE caller-owned document state. These
// bindings prove semantic membership, not solver/native/publication success.
import {captureSolvedPolygonSource,prepareSolvedPolygonSourceFace,describeSolvedPolygonSourceRegion} from './selectedSketchProfile.mjs';
import {captureLoftSeam} from '../solid/ownedLoftFeature.mjs';
import {prepareOwnedLoft} from '../mount/ownedLoftPlan.mjs';
// Same canonical handle projection as closed-sketch inspection; no new IDs.
import {projectRenderSketch} from '../../../web/app/sketcher/headless/renderSketchProjection.mjs';
const fail=(code,message)=>{throw Object.assign(Error(message),{code});};
const sourceKeys=['unit','engine','profileVersion','revision','sketchDigest','faceId','frame','sketchJSON'];
function fields(value,keys){
 if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value))||Reflect.ownKeys(value).length!==keys.length||Reflect.ownKeys(value).some(k=>typeof k!=='string'||!keys.includes(k)))fail('INVALID_REQUEST','Expected exact loft source fields.');
 const r={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('INVALID_REQUEST','Loft source fields must be own data.');r[key]=d.value;}return r;
}
function pair(value){if(!Array.isArray(value)||value.length!==2||Reflect.ownKeys(value).length!==3)fail('INVALID_REQUEST','Choose exactly two dense ordered captures.');return[0,1].map(i=>{const d=Object.getOwnPropertyDescriptor(value,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('INVALID_REQUEST','Sections must be dense own data.');return d.value;});}
function limit(text){if(typeof text!=='string')fail('INVALID_REQUEST','Expected native source text.');if(text.length>65536||new TextEncoder().encode(text).byteLength>65536)fail('RESOURCE_LIMIT','Loft source exceeds64KiB UTF-8.');}
function freeze(value){if(value&&typeof value==='object'){for(const x of Object.values(value))freeze(x);Object.freeze(value);}return value;}
function bounded(value){if(new TextEncoder().encode(JSON.stringify(value)).byteLength>65536)fail('RESOURCE_LIMIT','Loft semantic response exceeds64KiB UTF-8; no rows were truncated.');return freeze(value);}
function captureSources(value,selected){
 const sections=pair(value).map(v=>{const s=fields(v,[...sourceKeys,...(selected?['regionId','seam']:[])]);if(typeof s.revision!=='string'||!s.revision||s.revision.length>256||typeof s.unit!=='string'||typeof s.engine!=='string'||s.profileVersion!==3||typeof s.faceId!=='string'||!s.faceId||s.faceId.length>256||typeof s.sketchDigest!=='string'||!/^[a-f0-9]{64}$/.test(s.sketchDigest))fail('INVALID_REQUEST','Expected bounded typed current source identities and explicit profileVersion3.');limit(s.sketchJSON);if(selected)s.seam=captureLoftSeam(s.seam);return s;});
 if(['revision','unit','engine','profileVersion'].some(k=>sections[0][k]!==sections[1][k]))fail('STALE_SOURCE','Capture both loft sources from one state, unit, engine and profile version.');
 if(sections[0].faceId===sections[1].faceId)fail('LOFT_UNSUPPORTED_SOURCE','Two distinct source planes are required.');return sections;
}
function project(context){
 const objects=context.sketch.objects.filter(o=>o.role===null&&['Segment','Circle'].includes(o.type));let p;
 try{p=projectRenderSketch({...context.sketch,objects});}catch{fail('LOFT_UNSUPPORTED_SOURCE','Native inspection identities could not be projected.');}
 if(p.unsupported.length)fail('LOFT_UNSUPPORTED_SOURCE','Source inspection has unavailable primitive handles.');
 const byId=new Map(),pointIds=new Set();for(const row of p.objects){if(byId.has(row.id))fail('LOFT_UNSUPPORTED_SOURCE','Ambiguous native parent identity.');byId.set(row.id,row);for(const h of row.handles){if(pointIds.has(h.id))fail('LOFT_UNSUPPORTED_SOURCE','Ambiguous native endpoint identity.');pointIds.add(h.id);}}return byId;
}
const same=(h,p)=>h.x===p[0]&&h.y===p[1];
function seams(context,face,projection){
 const outer=face.request.region.outer;if(face.request.region.holes.length)fail('LOFT_UNSUPPORTED_HOLES','Initial loft sections cannot contain holes.');
 if(outer.length===1&&outer[0].kind==='circle'){
  const curveId=context.qualifiedToLocal.get(outer[0].id),row=projection.get(curveId);if(!row||row.type!=='Circle'||row.geometry?.kind!=='circle')fail('LOFT_UNSUPPORTED_SOURCE','The selected source Circle is unavailable.');
  return{kind:'circle',edgeCount:1,choices:[{kind:'circle-angle',curveId}],vertices:[]};
 }
 if(outer.length<3||outer.some(c=>c.kind!=='segment'))fail('LOFT_UNSUPPORTED_CORRESPONDENCE','Choose simple polygon sections or a circle pair.');
 const choices=[],vertices=[];outer.forEach((curve,index)=>{
  const curveId=context.qualifiedToLocal.get(curve.id),row=projection.get(curveId);
  if(!row||row.type!=='Segment'||row.geometry?.kind!=='segment'||row.handles.length!==2)fail('LOFT_UNSUPPORTED_SOURCE','An outer Segment lacks native endpoint projection.');
  for(const h of row.handles){const atA=same(h,curve.a),atB=same(h,curve.b);if(atA===atB)fail('LOFT_UNSUPPORTED_SOURCE','Native endpoint incidence differs from the selected boundary.');choices.push({kind:'vertex',pointId:h.id,curveId});vertices.push({pointId:h.id,start:atA?index:(index+1)%outer.length});}
 });return{kind:'polygon',edgeCount:outer.length,choices,vertices};
}
function resolve(context,face,projection,seam){
 const s=seams(context,face,projection);
 if(s.kind==='circle'){if(seam.kind!=='circle-angle'||seam.curveId!==s.choices[0].curveId)fail('STALE_SEAM','The seam is not the actual sole outer Circle.');return{kind:s.kind,start:seam.angleRadians,reversed:seam.reversed};}
 if(seam.kind!=='vertex')fail('STALE_SEAM','Choose an actual outer Segment endpoint.');
 const points=s.vertices.filter(v=>v.pointId===seam.pointId);if(points.length!==1)fail('STALE_SEAM','The native endpoint is not on this selected outer boundary.');return{kind:s.kind,start:points[0].start,reversed:seam.reversed};
}
const binding=context=>({revision:context.r.revision,faceId:context.r.faceId,sketchDigest:context.r.sketchDigest});
export const LOFT_SOURCE_QUALIFICATION='source-membership/domain-only; section placement, correspondence and solid validity require native evaluation';
export async function inspectSolvedLoftSources(input){
 const r=fields(input,['sections']),sections=captureSources(r.sections,false),contexts=await Promise.all(sections.map(s=>captureSolvedPolygonSource(s,false)));
 const result=contexts.map(context=>{const projection=project(context);return{binding:binding(context),regions:context.regions.map(region=>{
  const regionId='sketch-region:'+JSON.stringify(region),descriptor=describeSolvedPolygonSourceRegion(context,region);
  try{const face=prepareSolvedPolygonSourceFace(context,regionId),s=seams(context,face,projection);return{regionId,support:'supported',reason:null,descriptor,sectionKind:s.kind,edgeCount:s.edgeCount,seams:s.choices};}
  catch(e){if(!['INVALID_REQUEST','INVALID_FRAME','INVALID_PROFILE','UNSUPPORTED_PROFILE','OPEN_OR_AMBIGUOUS_PROFILE','PROFILE_BELOW_RESOLUTION','ZERO_LENGTH_EDGE','OVERLAPPING_EDGES','SELF_INTERSECTION','SELF_TOUCHING_BOUNDARY','ZERO_AREA_PROFILE','UNREPRESENTABLE_AREA','LOFT_UNSUPPORTED_HOLES','LOFT_UNSUPPORTED_CORRESPONDENCE','LOFT_UNSUPPORTED_SOURCE'].includes(e?.code))throw e;return{regionId,support:'unsupported',reason:{code:e.code,message:String(e.message).slice(0,512)},descriptor,sectionKind:null,edgeCount:0,seams:[]};}
 })};});return bounded({sections:result,qualification:LOFT_SOURCE_QUALIFICATION});
}
export async function prepareSolvedLoft(input){
 const r=fields(input,['sections','construction']);if(r.construction!=='ruled-solid')fail('INVALID_REQUEST','Select explicit ruled-solid construction.');
 const sections=captureSources(r.sections,true),contexts=await Promise.all(sections.map(s=>captureSolvedPolygonSource(Object.fromEntries([...sourceKeys,'regionId'].map(k=>[k,s[k]])),true))),faces=contexts.map((c,i)=>prepareSolvedPolygonSourceFace(c,sections[i].regionId)),resolved=contexts.map((c,i)=>resolve(c,faces[i],project(c),sections[i].seam));
 if(resolved[0].kind!==resolved[1].kind)fail('LOFT_UNSUPPORTED_CORRESPONDENCE','Choose a polygon pair or a circle pair.');
 const prepared=await prepareOwnedLoft({op:'solid.profile.loft',version:1,unit:'millimeter',sections:contexts.map((c,i)=>({source:{faceId:c.r.faceId,sourceSha256:c.r.sketchDigest},frame:faces[i].frame,region:faces[i].request.region})),correspondence:{kind:resolved[0].kind,startA:resolved[0].start,reverseA:resolved[0].reversed,startB:resolved[1].start,reverseB:resolved[1].reversed},construction:r.construction});
 return bounded({binding:{sections:contexts.map((c,i)=>({...binding(c),regionId:sections[i].regionId,seam:sections[i].seam})),construction:r.construction},request:prepared.request,loftBinding:prepared.binding});
}
