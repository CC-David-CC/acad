import {Matrix3x4} from 'math/matrix';
import Vector from 'math/vector';
import {BasisForPlane} from 'math/basis';
import {captureSourceFrame,captureSourceFramePlacement,captureSourceFrameParameters,sourceFrameFail as fail} from 'engine/source/sourceFrameIntent.mjs';
import {captureSourcePlaneParameters} from './sourcePlaneDepthEnvelope.mjs';
const dot=(a:number[],b:number[])=>a.reduce((n,v,i)=>n+v*b[i],0),cross=(a:number[],b:number[])=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const identity={origin:[0,0,0],x:[1,0,0],y:[0,1,0],z:[0,0,1]};
export function checkedSourceFrame(value:any){const f=captureSourceFrame(value);if(['x','y','z'].some(k=>Math.abs(dot(f[k],f[k])-1)>1e-12)||[['x','y'],['x','z'],['y','z']].some(([a,b])=>Math.abs(dot(f[a],f[b]))>1e-12)||Math.hypot(...cross(f.x,f.y).map((v,i)=>v-f.z[i]))>1e-12)fail('INVALID_SOURCE_FRAME','An already right-handed orthonormal frame is required.');return f;}
export const closeSourceFrame=(a:any,b:any)=>['origin','x','y','z'].every(k=>a[k].every((v:number,i:number)=>Math.abs(v-b[k][i])<=1e-9));
export function deriveSourceFrame(parameters:any,parentFrame:any,placementOnly=false){
 const p=placementOnly?{placement:captureSourceFramePlacement(parameters),parent:parentFrame===null?null:{}}:captureSourceFrameParameters(parameters),f=checkedSourceFrame(p.placement.frame),parent=checkedSourceFrame(parentFrame||identity);if((p.parent===null)!==(parentFrame===null))fail('INVALID_FRAME_DEPENDENCY','Parent frame coverage differs.');
 let local:any=f;if(p.placement.kind==='rigid'){
  const r=p.placement,n=Math.hypot(...r.axis);if(!Number.isFinite(n)||n===0)fail('INVALID_SOURCE_FRAME','A nonzero finite rotation axis is required.');
  const vector=(a:number[])=>new Vector(a[0],a[1],a[2]),rotation=new Matrix3x4().rotate(r.angleDegrees*Math.PI/180,vector(r.axis.map((v:number)=>v/n)),vector(r.pivot));
  const rotateBasis=(a:number[])=>rotation.__applyNoTranslation(vector(a),new Vector()).data();
  local={origin:rotation.__apply3(f.origin,[0,0,0]).map((v:number,i:number)=>v+r.translation[i]),x:rotateBasis(f.x),y:rotateBasis(f.y),z:rotateBasis(f.z)};
 }
 const vector=(v:number[])=>v.map((_,i)=>parent.x[i]*v[0]+parent.y[i]*v[1]+parent.z[i]*v[2]);
 return checkedSourceFrame({origin:vector(local.origin).map((v:number,i:number)=>v+parent.origin[i]),x:vector(local.x),y:vector(local.y),z:vector(local.z)});
}

export function principalSourceFrame(value:any){const p=captureSourcePlaneParameters(value),axis=p.orientation==='XY'?[0,0,1]:p.orientation==='XZ'?[0,1,0]:[1,0,0],normal=new Vector(axis[0],axis[1],axis[2]),[x,y,z]=BasisForPlane(normal as any);return checkedSourceFrame({origin:axis.map(n=>n*p.depth),x:x.data(),y:y.data(),z:z.data()});}
