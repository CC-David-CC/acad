import {editPointsCoordinatesTransition,editPointCoordinatesTransition} from './coordinateTransition';
import {firstCapturedGeometryDifference} from './capturedGeometryScope';
import {failureCause} from '../constr/admissionCause.mjs';
const fail=(code:string,message:string):never=>{throw Object.assign(Error(message),{code});};
function record(value:any,keys:string[]){if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value))||Reflect.ownKeys(value).length!==keys.length)fail('INVALID_CANDIDATE','Invalid coordinate verification record.');const row:any={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('INVALID_CANDIDATE','Coordinate verification fields must be data.');row[key]=d.value;}return row;}
function point(value:any){const p=record(value,['id','x','y']);if(typeof p.id!=='string'||!p.id||p.id.length>256||![p.x,p.y].every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=1e8))fail('INVALID_CANDIDATE','Invalid exact coordinate receipt.');return p;}
function points(value:any){if(!Array.isArray(value)||value.length<1||value.length>32||Reflect.ownKeys(value).length!==value.length+1)fail('INVALID_CANDIDATE','Invalid coordinate receipt array.');const rows=Array.from({length:value.length},(_,i)=>{const d=Object.getOwnPropertyDescriptor(value,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('INVALID_CANDIDATE','Coordinate receipts must be dense data.');return point(d.value);});if(new Set(rows.map(p=>p.id)).size!==rows.length)fail('INVALID_CANDIDATE','Coordinate receipts repeat a target.');return rows;}
// Both public wires reconstruct the COMPLETE original operation in a second
// genuine Worker. Neither a valid shifted model nor a JSON receipt is authority.
function verifyCoordinateCandidate(request:any,batch:boolean){let revision='';try{
 const revisionField=request&&Object.getOwnPropertyDescriptor(request,'revision');if(revisionField&&Object.hasOwn(revisionField,'value')&&typeof revisionField.value==='string'&&revisionField.value.length<=256)revision=revisionField.value;
 const key=batch?'points':'point',a=record(request,['revision','sketchJSON','externalParameters','intent','candidateJSON',key]);
 if(typeof a.candidateJSON!=='string'||a.candidateJSON.length>1048576||new TextEncoder().encode(a.candidateJSON).byteLength>1048576)fail('INVALID_CANDIDATE','Invalid coordinate candidate bytes.');
 const receipt=batch?points(a.points):point(a.point),expected:any=batch?editPointsCoordinatesTransition({revision:a.revision,sketchJSON:a.sketchJSON,externalParameters:a.externalParameters,intent:a.intent}):editPointCoordinatesTransition({revision:a.revision,sketchJSON:a.sketchJSON,externalParameters:a.externalParameters,intent:a.intent});if(!expected.ok)return expected;
 if(!('serializedSketch'in expected)||expected.serializedSketch!==a.candidateJSON)fail('CANDIDATE_MISMATCH',('The coordinate candidate differs from its original operation. First difference: '+firstCapturedGeometryDifference(JSON.parse(expected.serializedSketch),JSON.parse(a.candidateJSON))).slice(0,512));
 if(JSON.stringify(expected[key])!==JSON.stringify(receipt))fail('CANDIDATE_MISMATCH','The exact coordinate receipt differs from the independently reconstructed original intent.');
 return{revision,ok:true as const,verified:true};
 }catch(error){const cause=failureCause(error);return{revision,ok:false as const,error:{code:typeof error?.code==='string'?error.code.slice(0,64):'INVALID_CANDIDATE',message:error instanceof SyntaxError?'Invalid coordinate candidate JSON.':typeof error?.message==='string'?error.message.slice(0,512):'The coordinate candidate could not be verified.',...(cause?{cause}:{})}};}}
export function verifyPointsCoordinatesCandidate(request:any){return verifyCoordinateCandidate(request,true);}
export function verifyPointCoordinatesCandidate(request:any){return verifyCoordinateCandidate(request,false);}
