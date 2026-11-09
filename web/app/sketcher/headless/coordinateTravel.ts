import {offsetGeneratedIds} from '../generators/offsetSource.mjs';
import {projectRenderSketch} from './renderSketchProjection.mjs';
import {firstCapturedGeometryDifference as difference} from './capturedGeometryScope';
import {editPointsCoordinatesTransition} from './coordinateTransition';
import {failureCause} from '../constr/admissionCause.mjs';
const fail=(code:string,message:string):never=>{throw Object.assign(Error(message),{code});};
function bounded(text:any){if(typeof text!=='string'||text.length>1048576||new TextEncoder().encode(text).byteLength>1048576)fail('LIMIT','Coordinate travel source exceeds1MiB.');return text;}
export function coordinateTravelPoints(sketch:any){const derived=offsetGeneratedIds(sketch);return projectRenderSketch({...sketch,objects:sketch.objects.filter(o=>!derived.has(o.id)&&['Point','Segment','Circle','Arc'].includes(o.type))}).objects.flatMap(o=>o.handles.map(p=>({...p,parentId:o.id,stage:o.stage})));}
// Structural admission is not geometry authority: ALL non-geometry authored
// fields stay exact. Full permitted connected geometry (including radius) is
// proved only by reconstructing the genuine existing coordinate operation.
export function captureCoordinateTravelPair(beforeText:string,afterText:string){
 const before=JSON.parse(bounded(beforeText)),after=JSON.parse(bounded(afterText));
 if(!Array.isArray(before.objects)||before.objects.length>1024||!Array.isArray(after.objects)||after.objects.length!==before.objects.length)fail('INVALID_CANDIDATE','Coordinate travel requires the existing bounded object roster.');
 const expected=structuredClone(before);
 for(let i=0;i<before.objects.length;i++){const a=before.objects[i],b=after.objects[i];if(!a||!b||a.id!==b.id||a.type!==b.type||a.stage!==b.stage)fail('INTENT_CHANGED','Coordinate travel changed actual source parent identity or stage.');expected.objects[i].data=structuredClone(b.data);}
 if(difference(expected,after)!=='no difference')fail('INTENT_CHANGED','Coordinate travel changed non-geometry authored data: '+difference(expected,after));
 const from=coordinateTravelPoints(before),to=coordinateTravelPoints(after);
 if(from.length!==to.length||from.length>3072||new Set(from.map(p=>p.id)).size!==from.length)fail('INVALID_TARGET','Coordinate travel point inventory is ambiguous.');
 const points=[],stages=new Set<number>();
 for(let i=0;i<from.length;i++){const a=from[i],b=to[i];if(a.id!==b.id||a.parentId!==b.parentId||a.stage!==b.stage||!a.id||a.id.length>256)fail('INVALID_TARGET','Coordinate travel changed actual point or parent ownership.');if(a.x!==b.x||a.y!==b.y){points.push({id:b.id,x:b.x,y:b.y});stages.add(b.stage);}}
 if(points.length<1||points.length>32||stages.size!==1||points.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)||Math.abs(p.x)>1e8||Math.abs(p.y)>1e8))fail('UNSUPPORTED_TYPED_COORDINATE_TRAVEL','Typed coordinate edits require one to32 changed actual point handles in one authored stage within the existing coordinate domain.');
 return{before,after,points};
}
// Private authenticated J pair. Two bounded symmetric original operations,
// never retries/polishing: Undo need not make a nonlinear optimizer reversible.
export function verifyCoordinateTravel(request:any){const revision=typeof request?.revision==='string'?request.revision:'';try{
 const keys=['revision','sketchJSON','candidateJSON','externalParameters'];
 if(!request||typeof request!=='object'||Array.isArray(request)||Reflect.ownKeys(request).length!==keys.length||keys.some(k=>!Object.getOwnPropertyDescriptor(request,k)?.enumerable||!Object.hasOwn(Object.getOwnPropertyDescriptor(request,k),'value'))||!revision||revision.length>256)fail('INVALID_CANDIDATE','Invalid private coordinate travel request.');
 captureCoordinateTravelPair(request.sketchJSON,request.candidateJSON);let lastFailure:any=null;
 for(const [source,target]of [[request.sketchJSON,request.candidateJSON],[request.candidateJSON,request.sketchJSON]]){
  const pair=captureCoordinateTravelPair(source,target),result=editPointsCoordinatesTransition({revision,sketchJSON:source,externalParameters:request.externalParameters,intent:{points:pair.points}});
  if(result.ok&&'serializedSketch'in result&&difference(JSON.parse(result.serializedSketch),pair.after)==='no difference')return{revision,ok:true as const,verified:true};
  if(!result.ok)lastFailure=result.error;
 }
 fail('INVALID_CANDIDATE',('The journal pair does not reconstruct a supported exact coordinate edit.'+(lastFailure?' '+lastFailure.message:'')).slice(0,512));
 }catch(error){const cause=failureCause(error);return{revision,ok:false as const,error:{code:typeof error?.code==='string'?error.code.slice(0,64):'INVALID_CANDIDATE',message:typeof error?.message==='string'?error.message.slice(0,512):'Coordinate travel proof failed.',...(cause?{cause}:{})}};}}
