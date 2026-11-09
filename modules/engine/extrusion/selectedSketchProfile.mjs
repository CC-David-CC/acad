// Worker-only geometry preparation. This does not solve or admit constraints.
// The caller must bind these bytes to a genuine current sketch-Worker result
// and retain document/host currentness through native publication.
import {describeSelectedRegion,qualifySourceCurveId} from './selectedRegionDescriptor.mjs';
import {deriveAuthoredRegions} from '../../workbenches/modeler/features/extrude/authoredRegions.mjs';
import {prepareSelectedProfileExtrusion} from '../mount/selectedProfilePlan.mjs';
import {partitionSelectedSegments,analyzeIsolatedOpenComponents} from './isolatedOpenProfileComponents.mjs';
import {preparePolygonProfileExtrusion,preparePolygonProfileFace,polygonProfileRelation} from '../mount/polygonProfilePlan.mjs';
import {deriveRectangleArrangement} from './rectangularArrangement.mjs';
import {deriveRectangleContactArrangement} from './rectangularContactArrangement.mjs';
import {deriveCircularArrangement,prepareCircularCellExtrusion} from '../mount/circularArrangementPlan.mjs';
import {circularRelation} from './circularTopology.mjs';

const fail=(code,message)=>{throw Object.assign(new Error(message),{code});};
const fields=(value,keys)=>{
 if(!value||typeof value!=='object'||Array.isArray(value)||Reflect.ownKeys(value).length!==keys.length)fail('INVALID_REQUEST','Expected exact selected-region preparation data.');
 const out={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('INVALID_REQUEST','Preparation fields must be data.');out[key]=d.value;}return out;
};
const point=value=>{
 const p=fields(value,['x','y']);if(![p.x,p.y].every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=1e6))fail('INVALID_PROFILE','Expected bounded sketch coordinates.');return[p.x,p.y];
};
const same=(a,b)=>a[0]===b[0]&&a[1]===b[1];
const key=p=>JSON.stringify(p);
const freeze=value=>{if(value&&typeof value==='object'){for(const v of Object.values(value))freeze(v);Object.freeze(value);}return value;};
const hash=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');

const invalidRegionId=value=>typeof value!=='string'||!value.startsWith('sketch-region:')||value.length>8192;
const invalidIdentity=()=>fail('INVALID_REQUEST','Expected bounded current source and region identities.');
function capture(input,selected,faceOnly=false){
 const version=Object.getOwnPropertyDescriptor(input||{},'profileVersion'),keys=selected?['unit','engine','revision','sketchDigest','faceId','regionId','frame',...(faceOnly?[]:['depth']),'sketchJSON']:['unit','engine','revision','sketchDigest','faceId','frame',...(faceOnly?[]:['depth']),'sketchJSON'];
 if(version){if(!version.enumerable||!Object.hasOwn(version,'value')||version.value!==3)fail('INVALID_REQUEST','Only explicit profileVersion3 selects polygon preparation.');keys.push('profileVersion');}
 const circular=Object.getOwnPropertyDescriptor(input||{},'circularArrangementVersion');if(circular){if(faceOnly||!version||!circular.enumerable||!Object.hasOwn(circular,'value')||circular.value!==1)fail('INVALID_REQUEST','Circular arrangement requires explicit extrusion-only capability1.');keys.push('circularArrangementVersion');}
 const r=fields(input,keys);
 if(faceOnly&&r.profileVersion!==3)fail('INVALID_REQUEST','Depth-free source faces require explicit polygon version3.');
 if(r.unit!=='millimeter'||r.engine!=='occ')fail('UNSUPPORTED_ENGINE','Selected profiles currently require the qualified OCC millimeter path.');
 if(typeof r.revision!=='string'||!r.revision||r.revision.length>256||typeof r.faceId!=='string'||!r.faceId||r.faceId.length>256||selected&&invalidRegionId(r.regionId)||typeof r.sketchDigest!=='string'||!/^[a-f0-9]{64}$/.test(r.sketchDigest)||typeof r.sketchJSON!=='string'||r.sketchJSON.length>1048576)invalidIdentity();
 // Capture the frame before digest suspension; the common native planner
 // validates its numeric domain and orthonormality using this detached data.
 const frame=fields(r.frame,['origin','x','y','z']);
 for(const name of Object.keys(frame)){
  const a=frame[name];if(!Array.isArray(a)||a.length!==3||Reflect.ownKeys(a).length!==4)fail('INVALID_FRAME','Expected dense frame data.');
  frame[name]=[0,1,2].map(i=>{const d=Object.getOwnPropertyDescriptor(a,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value')||typeof d.value!=='number'||!Number.isFinite(d.value))fail('INVALID_FRAME','Frame coordinates must be finite data.');return d.value;});
 }
 return{r,frame,faceOnly};
}

async function extractSource({r,frame,faceOnly=false},allowIsolatedOpen=false){
 const mixed=allowIsolatedOpen&&r.profileVersion===3&&!faceOnly;let open=[];
 const sourceBytes=new TextEncoder().encode(r.sketchJSON);
 if(sourceBytes.byteLength>1048576)fail('INVALID_REQUEST','Native sketch source exceeds1MiB of UTF-8 data.');
 if(await hash(sourceBytes)!==r.sketchDigest)fail('STALE_SKETCH','Selected region source digest changed.');
 let sketch;try{sketch=JSON.parse(r.sketchJSON);}catch{fail('INVALID_SKETCH','Expected native sketch JSON.');}
 if(sketch?.version!==3||!Array.isArray(sketch.objects)||sketch.objects.length>4096||!Array.isArray(sketch.stages)||sketch.stages.length!==1||!Array.isArray(sketch.stages[0]?.constraints)||!Array.isArray(sketch.stages[0]?.generators)||sketch.stages[0].generators.length)fail('UNSUPPORTED_SKETCH','One bounded generator-free source stage is required.');
 const sourceFrame=sketch.metadata?.boundaryFrame;
 if(!sourceFrame||Object.keys(sourceFrame).sort().join(',')!=='origin,x,y,z'||Object.keys(frame).some(k=>!Array.isArray(sourceFrame[k])||sourceFrame[k].length!==3||sourceFrame[k].some((v,i)=>v!==frame[k][i])))fail('STALE_FRAME','Source frame does not match the captured current plane.');
 const segments=[],loops=[],seen=new Set(),qualifiedToLocal=new Map();
 for(const object of sketch.objects){
  if(!object||typeof object.id!=='string'||!object.id||object.id.length>256||seen.has(object.id)||object.stage!==0||![null,'construction'].includes(object.role))fail('INVALID_SKETCH','Invalid or duplicate authored primitive identity.');
  seen.add(object.id);
  if(object.role==='construction'||object.type==='Point')continue;
  const id=qualifySourceCurveId(r.faceId,object.id);qualifiedToLocal.set(id,object.id);
  if(object.type==='Segment'){
   const data=fields(object.data,['a','b']),a=point(data.a),b=point(data.b);if(same(a,b))fail('INVALID_PROFILE','A zero-length edge cannot bound a region.');segments.push({kind:'segment',id,a,b});
  }else if(object.type==='Circle'){
   const data=fields(object.data,['c','r']);loops.push([{kind:'circle',id,center:point(data.c),radius:data.r}]);
  }else fail('UNSUPPORTED_PROFILE',r.profileVersion===3?'Only ordinary polygon segments and full circles are qualified.':'Only ordinary rectangle segments and full circles are qualified.');
 }
 // Whole-source contact proof precedes the old shared-edge refusal. The
 // helper returns only the exact two-rectangle contact domain; all other
 // sources retain the original partition/overlap/circle policy below.
 const contact=mixed&&!loops.length&&segments.length===8?await deriveRectangleContactArrangement({faceId:r.faceId,segments,qualifiedToLocal,clearanceMm:0.0001}):null;
 if(contact)return{r,frame,regions:contact.cells,byIds:new Map(),qualifiedToLocal,sketch,sourceAnalysis:contact.sourceAnalysis,arrangement:contact};
 // Use exact endpoint identities, never proximity welding. V3 separates
 // simple articulation blocks; other branches/gaps/duplicates still refuse.
 // Explicit V3 admits simple linear
 // polygons; unflagged requests retain the four-edge rectangle path.
 if(r.profileVersion===3){const parts=partitionSelectedSegments(segments,{allowArticulatedRegions:true});loops.push(...parts.closed);if(mixed)open=parts.open;else if(parts.open.length)fail('OPEN_OR_AMBIGUOUS_PROFILE','Depth-free source faces require complete closed boundary blocks.');}
 else{
 const endpoints=new Map();
 for(const curve of segments)for(const p of [curve.a,curve.b]){const k=key(p),list=endpoints.get(k)||[];list.push(curve);endpoints.set(k,list);}
 if([...endpoints.values()].some(list=>list.length!==2))fail('OPEN_OR_AMBIGUOUS_PROFILE','Segments must form exact nonbranching closed boundaries.');
 if(segments.length>512)fail('UNSUPPORTED_PROFILE',r.profileVersion===3?'At most512 source segments are qualified.':'At most128 four-edge contours are qualified.');
 const remaining=new Set(segments);
 while(remaining.size){
  const first=[...remaining].sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0)[0],start=first.a;let current=start;const ordered=[];
  do{
   const next=endpoints.get(key(current)).filter(c=>remaining.has(c)).sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0)[0];
   if(!next||ordered.length>=(r.profileVersion===3?512:4))fail('UNSUPPORTED_PROFILE',r.profileVersion===3?'Only exact closed polygons of3–512 edges are qualified.':'Only four-edge exact rectangles are qualified.');
   const end=same(next.a,current)?next.b:next.a;ordered.push({kind:'segment',id:next.id,a:current.slice(),b:end.slice()});remaining.delete(next);current=end;
  }while(!same(current,start));
  loops.push(ordered);
 }
 }
 if(!loops.length&&open.length)fail('OPEN_OR_AMBIGUOUS_PROFILE','Open components contain no qualified closed boundary.');
 if(!loops.length||loops.length>128)fail('UNSUPPORTED_PROFILE','Expected a bounded set of closed regions.');
 // Validate every ordinary loop before deriving containment. An unsupported
 // unselected curve must not be silently omitted from the region hierarchy.
 const profiles=loops.map((outer,i)=>{
  const planner=r.profileVersion===3?preparePolygonProfileExtrusion:prepareSelectedProfileExtrusion,prepared=faceOnly?preparePolygonProfileFace({version:1,unit:r.unit,frame,region:{id:'loop:'+i,outer,holes:[]}}):planner({op:'solid.profile.extrude',version:r.profileVersion===3?3:2,unit:r.unit,frame,depth:r.depth,region:{id:'loop:'+i,outer,holes:[]}}),loop=prepared.loops[0];
  if(r.profileVersion===3)return loop;
  return loop.kind==='circle'?{kind:'circle',x:loop.center[0],y:loop.center[1],r:loop.radius}:{kind:'rectangle',minX:loop.minX,maxX:loop.maxX,minY:loop.minY,maxY:loop.maxY};
 });
 // A derived arrangement is a different source contract, not a relaxed
 // containment classification. Only this exact eight-Segment extrusion slice
 // qualifies; source-face consumers retain their whole-curve contracts.
 const arrangement=mixed&&!open.length&&segments.length===8?await deriveRectangleArrangement({faceId:r.faceId,loops,qualifiedToLocal,clearanceMm:0.0001}):null;
 if(arrangement)return{r,frame,regions:arrangement.cells,byIds:new Map(),qualifiedToLocal,sketch,sourceAnalysis:arrangement.sourceAnalysis,arrangement};
 if(r.circularArrangementVersion===1&&mixed&&!open.length&&!segments.length&&loops.length===2&&loops.every(loop=>loop.length===1&&loop[0].kind==='circle')){
  const circles=loops.map(loop=>({id:qualifiedToLocal.get(loop[0].id),center:loop[0].center.slice(),radius:loop[0].radius})).sort((a,b)=>a.id<b.id?-1:1),relation=circularRelation(circles[0],circles[1]);
  // Preserve previously eligible whole-circle nested/disjoint descriptors.
  // The new branch never welds the source or drops an unselected curve.
  const ordinary=['disjoint','nested-0','nested-1'].includes(relation)&&['contains','inside','separate'].includes(polygonProfileRelation(profiles[0],profiles[1]));
  if(!ordinary){const circular=await deriveCircularArrangement(r.faceId,circles);return{r,frame,regions:circular.cells,byIds:new Map(),qualifiedToLocal,sketch,sourceAnalysis:circular.sourceAnalysis,circular:{...circular,circles}};}
 }
 const sourceAnalysis=mixed?analyzeIsolatedOpenComponents({loops,profiles,open,qualifiedToLocal}):null;
 let regions;try{regions=deriveAuthoredRegions(r.faceId,loops.map(loop=>loop.map(c=>c.id)),profiles,r.profileVersion===3?3:2);}catch(error){fail('UNSUPPORTED_REGION_TOPOLOGY',error.message);}
 const byIds=new Map(loops.map(loop=>[JSON.stringify(loop.map(c=>c.id).sort()),loop]));
 return{r,frame,regions,byIds,qualifiedToLocal,sketch,sourceAnalysis};
}

// Worker-only verified source seam for non-extrusion consumers. No caller
// supplies parsed objects, preselected native handles or a fictitious depth.
export async function captureSolvedPolygonSource(input,selected=false){
 return extractSource(capture(input,selected,true));
}
export function prepareSolvedPolygonSourceFace(context,regionId){
 const {r,frame,regions,byIds}=context;
 if(invalidRegionId(regionId))invalidIdentity();
 const region=regions.find(value=>'sketch-region:'+JSON.stringify(value)===regionId);
 if(!region)fail('STALE_REGION','Selected source boundary membership changed.');
 return preparePolygonProfileFace({version:1,unit:r.unit,frame,region:{id:regionId,outer:byIds.get(JSON.stringify(region.outer)),holes:region.holes.map(ids=>byIds.get(JSON.stringify(ids)))}});
}
export function describeSolvedPolygonSourceRegion(context,region){return describeSelectedRegion(region,context.qualifiedToLocal);}

function prepareRegion({r,frame,regions,byIds,arrangement,circular},regionId){
 if(invalidRegionId(regionId))invalidIdentity();
 if(circular){const cell=circular.cells.find(c=>c.regionId===regionId);if(!cell)fail('STALE_REGION','The selected circular cell changed; choose its actual current replacement.');return prepareCircularCellExtrusion({op:'solid.profile.extrude',version:4,unit:r.unit,frame,depth:r.depth,region:{id:regionId,faceId:r.faceId,circles:circular.circles,descriptor:cell.descriptor}});}
 if(arrangement){const cell=arrangement.cells.find(c=>c.regionId===regionId);if(!cell)fail('STALE_REGION','The selected arrangement cell is no longer available; select it again.');return preparePolygonProfileExtrusion({op:'solid.profile.extrude',version:3,unit:r.unit,frame,depth:r.depth,region:{id:regionId,outer:cell.outer,holes:[],boundaryProvenance:{version:1,kind:'axis-rectangle-arrangement',faceId:r.faceId,descriptor:cell.descriptor}}});}
 const region=regions.find(value=>'sketch-region:'+JSON.stringify(value)===regionId);
 if(!region)fail('STALE_REGION','The selected boundary membership changed; select the region again.');
 const request={op:'solid.profile.extrude',version:r.profileVersion===3?3:2,unit:r.unit,frame,depth:r.depth,region:{id:regionId,outer:byIds.get(JSON.stringify(region.outer)),holes:region.holes.map(ids=>byIds.get(JSON.stringify(ids)))}};
 return (r.profileVersion===3?preparePolygonProfileExtrusion:prepareSelectedProfileExtrusion)(request);
}

export async function prepareSolvedSelectedRegion(input){
 const context=await extractSource(capture(input,true),true),r=context.r,plan=prepareRegion(context,context.r.regionId);
 return freeze({binding:{revision:r.revision,sketchDigest:r.sketchDigest,faceId:r.faceId,regionId:r.regionId},request:plan.request,expected:plan.expected});
}

// This is geometry-support discovery, not evidence of a successful sketch
// solve. The caller must supply the same genuine solved-source binding used
// by execution. Unsupported global topology has no invented region identities
// and keeps its existing explicit refusal. Final region caps remain local.
export async function inspectSolvedSelectedRegions(input){
 const context=await extractSource(capture(input,false),true),r=context.r;
 const regions=context.regions.map(region=>{
  const derived=context.arrangement||context.circular,regionId=derived?region.regionId:'sketch-region:'+JSON.stringify(region),descriptor=derived?region.descriptor:describeSelectedRegion(region,context.qualifiedToLocal);
  try{prepareRegion(context,regionId);return{regionId,support:'supported',reason:null,descriptor};}
  catch(error){
   if(!['INVALID_REQUEST','INVALID_FRAME','INVALID_PROFILE','UNSUPPORTED_PROFILE','OPEN_OR_AMBIGUOUS_PROFILE'].includes(error?.code))throw error;
   return{regionId,support:'unsupported',reason:{code:error.code,message:error.message},descriptor};
  }
 });
 return freeze({binding:{revision:r.revision,sketchDigest:r.sketchDigest,faceId:r.faceId},regions,...(context.sourceAnalysis?{sourceAnalysis:context.sourceAnalysis}:{})});
}
