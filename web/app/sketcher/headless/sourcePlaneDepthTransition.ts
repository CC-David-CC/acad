import {replaySketchTransition} from './sketchTransition';
import {captureSourcePlaneRequest,captureSourcePlaneFrame,planeFailure,SOURCE_PLANE_REPLY_BYTES} from './sourcePlaneDepthEnvelope.mjs';
const fail=(code:string,message:string):never=>{throw planeFailure(code,message)};
function sameData(a:any,b:any){
 const pending=[[a,b]];let nodes=0;
 while(pending.length){if(++nodes>100000)fail('RESOURCE_LIMIT','Source-plane intent exceeds its bound.');const[x,y]=pending.pop();if(x===null||y===null||typeof x!=='object'||typeof y!=='object'){if(!Object.is(x,y))return false;continue;}if(Array.isArray(x)!==Array.isArray(y))return false;const ak=Object.keys(x).sort(),bk=Object.keys(y).sort();if(ak.length!==bk.length||ak.some((k,i)=>k!==bk[i]))return false;for(const k of ak)pending.push([x[k],y[k]]);}
 return true;
}
function frameEqual(a:any,b:any){return ['origin','x','y','z'].every(k=>a[k].every((n:number,i:number)=>Math.abs(n-b[k][i])<=1e-9));}
function derivedFrame(frame:any,orientation:string,before:number,after:number){
 const axis=orientation==='XY'?[0,0,1]:orientation==='XZ'?[0,1,0]:[1,0,0],dot=(a:number[],b:number[])=>a.reduce((n,x,i)=>n+x*b[i],0),cross=(a:number[],b:number[])=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 if(frame.z.some((n:number,i:number)=>Math.abs(n-axis[i])>1e-9)||frame.origin.some((n:number,i:number)=>Math.abs(n-axis[i]*before)>1e-9)||['x','y','z'].some(k=>Math.abs(dot(frame[k],frame[k])-1)>1e-9)||Math.abs(dot(frame.x,frame.y))>1e-9||Math.abs(dot(frame.x,frame.z))>1e-9||Math.abs(dot(frame.y,frame.z))>1e-9||cross(frame.x,frame.y).some((n,i)=>Math.abs(n-frame.z[i])>1e-9))fail('STALE_FRAME','The source frame does not match its independent authored plane.');
 return {origin:axis.map(n=>n*after),x:[...frame.x],y:[...frame.y],z:[...frame.z]};
}
function withoutFrame(value:any){return {...value,metadata:{...value.metadata,boundaryFrame:null}};}
// Run only in a disposable production sketch Worker. Recompute on verification;
// no candidate supplied by the caller can authorize local intent changes.
export function reframeSourcePlaneDepth(input:any){
 let revision='';
 try{
  const r=captureSourcePlaneRequest(input);revision=r.revision;const source=JSON.parse(r.sketchJSON),old=captureSourcePlaneFrame(source?.metadata?.boundaryFrame),target=derivedFrame(r.frame,r.orientation,r.beforeDepth,r.afterDepth);
  if(!frameEqual(old,r.frame))fail('STALE_FRAME','The stored sketch frame differs from the current source plane.');
  if(!source.boundary||Object.keys(source.boundary).sort().join(',')!=='arcs,circles,lines,nurbses'||!['lines','arcs','circles','nurbses'].every(k=>Array.isArray(source.boundary[k])&&source.boundary[k].length===0))fail('UNSUPPORTED_SOURCE','Referenced sketch boundaries cannot be reframed.');
  const before:any=replaySketchTransition({revision,sketchJSON:r.sketchJSON,externalParameters:{}});if(!before.ok)return before;
  const candidate=r.candidateJSON===null?JSON.stringify({...source,metadata:{...source.metadata,boundaryFrame:target}}):r.candidateJSON,next=JSON.parse(candidate),frame=captureSourcePlaneFrame(next?.metadata?.boundaryFrame);
  if(!frameEqual(frame,target)||!sameData(withoutFrame(source),withoutFrame(next)))fail('INTENT_CHANGED','Plane movement may change only the derived boundary frame.');
  const checked:any=replaySketchTransition({revision,sketchJSON:candidate,externalParameters:{}});if(!checked.ok)return checked;
  const result={revision,ok:true,serializedSketch:candidate,frame:target};if(new TextEncoder().encode(JSON.stringify(result)).byteLength>SOURCE_PLANE_REPLY_BYTES)fail('RESOURCE_LIMIT','Source-plane response exceeds64KiB.');return result;
 }catch(error){return{revision,ok:false,error:{code:typeof error?.code==='string'?error.code:'INVALID_REQUEST',message:typeof error?.message==='string'?error.message.slice(0,512):'Source-plane movement could not be prepared.'}};}
}
