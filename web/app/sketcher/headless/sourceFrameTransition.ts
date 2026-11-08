import {Matrix3x4} from 'math/matrix';
import Vector from 'math/vector';
import {captureSourceFrame,captureSourceFramePlacement,captureSourceFrameParameters,sourceFrameRecord,sourceFrameText,sourceFrameFail as fail} from 'engine/source/sourceFrameIntent.mjs';
import {replaySketchTransition} from './sketchTransition';
import {makeEmptySketch} from './emptySketch';
const dot=(a:number[],b:number[])=>a.reduce((n,v,i)=>n+v*b[i],0),cross=(a:number[],b:number[])=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const identity={origin:[0,0,0],x:[1,0,0],y:[0,1,0],z:[0,0,1]};
function checked(value:any){const f=captureSourceFrame(value);if(['x','y','z'].some(k=>Math.abs(dot(f[k],f[k])-1)>1e-12)||[['x','y'],['x','z'],['y','z']].some(([a,b])=>Math.abs(dot(f[a],f[b]))>1e-12)||Math.hypot(...cross(f.x,f.y).map((v,i)=>v-f.z[i]))>1e-12)fail('INVALID_SOURCE_FRAME','An already right-handed orthonormal frame is required.');return f;}
const close=(a:any,b:any)=>['origin','x','y','z'].every(k=>a[k].every((v:number,i:number)=>Math.abs(v-b[k][i])<=1e-9));
function same(a:any,b:any){const q=[[a,b]];let n=0;while(q.length){if(++n>100000)fail('RESOURCE_LIMIT','Source intent exceeds its work bound.');const[x,y]=q.pop();if(x===null||y===null||typeof x!=='object'||typeof y!=='object'){if(!Object.is(x,y))return false;continue;}const ak=Object.keys(x).sort(),bk=Object.keys(y).sort();if(Array.isArray(x)!==Array.isArray(y)||ak.length!==bk.length||ak.some((k,i)=>k!==bk[i]))return false;for(const k of ak)q.push([x[k],y[k]]);}return true;}
const withoutFrame=(s:any)=>({...s,metadata:{...s.metadata,boundaryFrame:null}});
function derive(parameters:any,parentFrame:any,placementOnly=false){
 const p=placementOnly?{placement:captureSourceFramePlacement(parameters),parent:parentFrame===null?null:{}}:captureSourceFrameParameters(parameters),f=checked(p.placement.frame),parent=checked(parentFrame||identity);if((p.parent===null)!==(parentFrame===null))fail('INVALID_FRAME_DEPENDENCY','Parent frame coverage differs.');
 let local:any=f;if(p.placement.kind==='rigid'){
  const r=p.placement,n=Math.hypot(...r.axis);if(!Number.isFinite(n)||n===0)fail('INVALID_SOURCE_FRAME','A nonzero finite rotation axis is required.');
  const vector=(a:number[])=>new Vector(a[0],a[1],a[2]),rotation=new Matrix3x4().rotate(r.angleDegrees*Math.PI/180,vector(r.axis),vector(r.pivot));
  const rotateBasis=(a:number[])=>rotation.__applyNoTranslation(vector(a),new Vector()).data();
  local={origin:rotation.__apply3(f.origin,[0,0,0]).map((v:number,i:number)=>v+r.translation[i]),x:rotateBasis(f.x),y:rotateBasis(f.y),z:rotateBasis(f.z)};
 }
 const vector=(v:number[])=>v.map((_,i)=>parent.x[i]*v[0]+parent.y[i]*v[1]+parent.z[i]*v[2]);
 return checked({origin:vector(local.origin).map((v:number,i:number)=>v+parent.origin[i]),x:vector(local.x),y:vector(local.y),z:vector(local.z)});
}
// Only the shared headless Worker routes invoke this code.
export function sourceFrameTransition(input:any){let revision='';try{
 const mode=input?.mode,keys=mode==='derive'?['revision','mode','parameters','parentFrame']:mode==='placement'?['revision','mode','placement','parentFrame']:mode==='points'?['revision','mode','frame','direction','points']:['revision','mode','sketchJSON','beforeFrame','afterFrame','candidateJSON'];const r=sourceFrameRecord(input,keys);revision=r.revision;if(typeof revision!=='string'||!revision||revision.length>256)fail('INVALID_REQUEST','Expected a bounded source revision.');
 if(mode==='placement')return{revision,ok:true,frame:derive(r.placement,r.parentFrame,true)};
 if(mode==='derive')return{revision,ok:true,frame:derive(r.parameters,r.parentFrame)};
 if(mode==='points'){const f=checked(r.frame);if(!['local-to-world','world-to-local'].includes(r.direction)||!Array.isArray(r.points)||r.points.length<1||r.points.length>16||Reflect.ownKeys(r.points).length!==r.points.length+1)fail('INVALID_REQUEST','Expected bounded directed frame points.');const points=r.points.map((p:any)=>{const v=captureSourceFrame({origin:p,x:identity.x,y:identity.y,z:identity.z}).origin;if(r.direction==='local-to-world')return f.origin.map((a:number,i:number)=>a+f.x[i]*v[0]+f.y[i]*v[1]+f.z[i]*v[2]);const d=v.map((n:number,i:number)=>n-f.origin[i]);return[f.x,f.y,f.z].map(a=>dot(d,a));});if(points.some(p=>p.some(n=>!Number.isFinite(n)||Math.abs(n)>1e8)))fail('INVALID_SOURCE_FRAME','Transformed point exceeds its domain.');return{revision,ok:true,frame:f,points};}
 if(mode!=='reframe'&&mode!=='empty')fail('INVALID_REQUEST','Unsupported source-frame task.');const after=checked(r.afterFrame);
 if(mode==='empty'){if(r.sketchJSON!==null||r.beforeFrame!==null||r.candidateJSON!==null)fail('INVALID_REQUEST','Empty source creation has no previous bytes.');return{revision,ok:true,frame:after,serializedSketch:sourceFrameText(JSON.stringify(makeEmptySketch('millimeter',after)))};}
 const original=sourceFrameText(r.sketchJSON),src=JSON.parse(original),before=checked(r.beforeFrame),saved=checked(src?.metadata?.boundaryFrame);
 if(!close(saved,before))fail('STALE_FRAME','The original source cache differs from its actual accepted frame.');
 if(!src.boundary||Object.keys(src.boundary).sort().join(',')!=='arcs,circles,lines,nurbses'||!['lines','arcs','circles','nurbses'].every(k=>Array.isArray(src.boundary[k])&&!src.boundary[k].length))fail('UNSUPPORTED_SOURCE','Referenced boundaries cannot be reframed.');
 const verified:any=replaySketchTransition({revision,sketchJSON:original,externalParameters:{}});if(!verified.ok)return verified;
 const candidate=r.candidateJSON===null?(close(before,after)?original:JSON.stringify({...src,metadata:{...src.metadata,boundaryFrame:after}})):sourceFrameText(r.candidateJSON),next=JSON.parse(candidate);
 if(!close(checked(next?.metadata?.boundaryFrame),after)||!same(withoutFrame(src),withoutFrame(next)))fail('INTENT_CHANGED','Only the derived source frame may change.');
 const final:any=replaySketchTransition({revision,sketchJSON:candidate,externalParameters:{}});if(!final.ok)return final;return{revision,ok:true,frame:after,serializedSketch:sourceFrameText(candidate)};
 }catch(error){return{revision,ok:false,error:{code:error?.code||'INVALID_SOURCE_FRAME',message:String(error?.message||'Source frame preparation failed.').slice(0,512)}};}}
