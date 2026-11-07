import {editPointsCoordinatesTransition} from './coordinateTransition';
// Fixed internal verifier: a candidate is bound to its original source and
// batch intent by a separate genuine solve, never by a JSON-shaped receipt.
export function verifyPointsCoordinatesCandidate(request:any){
 let revision='';try{
  const keys=['revision','sketchJSON','externalParameters','intent','candidateJSON','points'];
  if(!request||typeof request!=='object'||Array.isArray(request)||![Object.prototype,null].includes(Object.getPrototypeOf(request))||Reflect.ownKeys(request).length!==keys.length)throw Error('Invalid coordinate verification.');
  const a:any={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(request,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))throw Error('Verification fields must be data.');a[key]=d.value;}
  if(typeof a.revision==='string'&&a.revision.length<=256)revision=a.revision;
  if(typeof a.candidateJSON!=='string'||a.candidateJSON.length>1048576||new TextEncoder().encode(a.candidateJSON).byteLength>1048576||!Array.isArray(a.points)||Object.getPrototypeOf(a.points)!==Array.prototype||a.points.length<1||a.points.length>32||Reflect.ownKeys(a.points).length!==a.points.length+1)throw Error('Invalid coordinate candidate.');
  const points=[];for(let i=0;i<a.points.length;i++){const d=Object.getOwnPropertyDescriptor(a.points,String(i));if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))throw Error('Coordinate receipts must be data.');const p=d.value;if(!p||typeof p!=='object'||Array.isArray(p)||![Object.prototype,null].includes(Object.getPrototypeOf(p))||Reflect.ownKeys(p).length!==3)throw Error('Invalid coordinate receipt.');const row:any={};for(const key of ['id','x','y']){const d=Object.getOwnPropertyDescriptor(p,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))throw Error('Coordinate receipts must be data.');row[key]=d.value;}if(typeof row.id!=='string'||!row.id||row.id.length>256||![row.x,row.y].every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=1e8))throw Error('Invalid coordinate receipt.');points.push(row);}
  const expected=editPointsCoordinatesTransition({revision:a.revision,sketchJSON:a.sketchJSON,externalParameters:a.externalParameters,intent:a.intent});if(!expected.ok)return expected;
  if(!('serializedSketch' in expected)||!('points' in expected)||expected.serializedSketch!==a.candidateJSON||JSON.stringify(expected.points)!==JSON.stringify(points))return {revision,ok:false as const,error:{code:'CANDIDATE_MISMATCH',message:'The coordinate candidate differs from its captured authored operation.'}};
  return {revision,ok:true as const,verified:true};
 }catch{return {revision,ok:false as const,error:{code:'INVALID_CANDIDATE',message:'The coordinate candidate could not be verified.'}};}
}
