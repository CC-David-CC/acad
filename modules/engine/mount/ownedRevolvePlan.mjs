// Worker-only geometry preparation through the existing depth-free V3 face path.
import {captureOwnedRevolveIntent,bindOwnedRevolveIntent} from '../solid/ownedRevolveIntent.mjs';
import {preparePolygonProfileFace} from './polygonProfilePlan.mjs';
export async function prepareOwnedRevolve(input){
 const request=captureOwnedRevolveIntent(input),face=preparePolygonProfileFace({version:1,unit:request.unit,frame:request.frame,region:request.region}),f=face.frame;
 const origin=f.origin.map((n,i)=>n+f.x[i]*request.axis.a[0]+f.y[i]*request.axis.a[1]);
 const direction=f.x.map((n,i)=>n*(request.axis.b[0]-request.axis.a[0])+f.y[i]*(request.axis.b[1]-request.axis.a[1]));
 if([...origin,...direction].some(n=>!Number.isFinite(n)||Math.abs(n)>4e6))throw Object.assign(Error('Axis exceeds the native adapter domain.'),{code:'REVOLVE_INVALID_AXIS'});
 return{request,nativeValues:face.nativeValues,nativeAxis:[...origin,...direction],binding:await bindOwnedRevolveIntent(request)};
}
