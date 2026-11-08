import {addSignedDistanceTransition} from './signedDistanceTransition';
import {verifyDrivingDimension} from './drivingDimensionTransition';

// PRIVATE typed-travel dispatch after the exact one-row dimension classifier.
// The delta is routing data only: a fresh reconstruction from the original
// smaller source must reproduce EVERY candidate byte before it grants proof.
// No source geometry, membership, classifications or currentness is assumed
// merely from an insertion/removal hint or a saved admission field.
export function verifyTypedSignedCoordinateTravel(request:any,delta:any){
 const insertion=delta.action==='insert',source=insertion?request.sketchJSON:request.candidateJSON,target=insertion?request.candidateJSON:request.sketchJSON,
  larger=JSON.parse(target),row=larger.stages[delta.stage]?.constraints[delta.index];
 const literal=row&&(row.typeId==='SignedDistanceX'||row.typeId==='SignedDistanceY')&&row.typeId===delta.typeId&&row.stage===delta.stage&&Array.isArray(row.objects)&&row.objects.length===2&&row.objects.every((id,i)=>typeof id==='string'&&id===delta.objects[i])&&row.objects[0]!==row.objects[1]&&row.constants&&Reflect.ownKeys(row.constants).length===1&&Object.hasOwn(row.constants,'distance')&&typeof row.constants.distance==='number'&&Number.isFinite(row.constants.distance)&&Math.abs(row.constants.distance)<=1e6;
 if(literal){
  // Public creation authors actual numeric millimetres. Its original source
  // and captured authoritative typed bindings are passed unchanged into the
  // SAME registered admission, exact insertion/scope, cold and equation proof
  // as creation's original-request verifier, in this disposable Worker.
  const expected=addSignedDistanceTransition({revision:request.revision,sketchJSON:source,externalParameters:request.externalParameters,intent:{axis:row.typeId==='SignedDistanceX'?'x':'y',ids:[...row.objects],distance:row.constants.distance}});
  if(expected.ok&&expected.serializedSketch===target)return{revision:request.revision,ok:true as const,verified:true};
 }
 // Preserve every previously supported actual dimension-removal pair, such as
 // an existing literal-string row or custom annotation. This is a second
 // bounded genuine operation proof, not a retry or tolerance acceptance. An
 // unmatched insertion can never succeed merely because it is solvable.
 return verifyDrivingDimension(request,true);
}
