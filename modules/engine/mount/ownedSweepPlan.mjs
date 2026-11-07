// Dedicated Worker preparation; native geometry validates attachment, path and
// transport. No hidden centering/repositioning, fictitious depth or prism data.
import {captureOwnedSweepIntent,bindOwnedSweepIntent} from '../solid/ownedSweepIntent.mjs';
import {preparePolygonProfileFace} from './polygonProfilePlan.mjs';
const fail=(code,message)=>{throw Object.assign(Error(message),{code});};
export async function prepareOwnedSweep(input){
 const request=captureOwnedSweepIntent(input),face=preparePolygonProfileFace({version:1,unit:request.unit,frame:request.frame,region:request.region}),f=request.path.frame;
 const dot=(a,b)=>a.reduce((sum,n,i)=>sum+n*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 if(['x','y','z'].some(key=>Math.abs(dot(f[key],f[key])-1)>1e-12)||[['x','y'],['x','z'],['y','z']].some(([a,b])=>Math.abs(dot(f[a],f[b]))>1e-12)||Math.hypot(...cross(f.x,f.y).map((n,i)=>n-f.z[i]))>1e-12)fail('INVALID_FRAME','Path frame must be right-handed orthonormal.');
 const nativePathValues=[1,0,...f.origin,...f.x,...f.y,...f.z,request.path.curves.length];
 for(const curve of request.path.curves){
  if(curve.kind==='arc'&&Math.abs(curve.a[0]-curve.b[0])<1e-6&&Math.abs(curve.a[1]-curve.b[1])<1e-6)fail('SWEEP_UNSUPPORTED_PATH','Source Arc denotes a full circle; closed paths require separate support.');
  for(const p of curve.kind==='arc'?[curve.a,curve.b,curve.c]:[curve.a,curve.b])if(f.origin.some((n,i)=>!Number.isFinite(n+f.x[i]*p[0]+f.y[i]*p[1])||Math.abs(n+f.x[i]*p[0]+f.y[i]*p[1])>4e6))fail('SWEEP_INVALID_PATH','World path exceeds this adapter domain.');
  nativePathValues.push(curve.kind==='arc'?1:0,...curve.a,...curve.b,...(curve.kind==='arc'?curve.c:[]),curve.reversed?1:0);
 }
 return{request,nativeValues:face.nativeValues,nativePathValues,binding:await bindOwnedSweepIntent(request)};
}
