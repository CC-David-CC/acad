import {extractFiniteCurveSource} from './finiteCurveSourceExtraction';
import {
  captureFiniteCurveSourceRequest,captureFiniteCurveSourceReceipt,
  sameFiniteCurveSourceReceipt
} from './finiteCurveSourceEnvelope.mjs';
import type {FiniteCurveSourceSuccess,FiniteCurveSourceRequest} from './finiteCurveSourceEnvelope.mjs';
import {captureFiniteCurveReadResult} from '../../../../modules/engine/mount/finiteCurveReadProtocol.mjs';
import type {RawFiniteCurveReadResult} from '../../../../modules/engine/mount/finiteCurveReadProtocol.mjs';
import {verifyFiniteCurveCandidates} from '../../../../modules/engine/mount/finiteCurveFiniteCertificate.mjs';
import type {FiniteCurveCertificateDomain} from '../../../../modules/engine/mount/finiteCurveFiniteCertificate.mjs';
import {editPointsCoordinatesTransition} from './coordinateTransition';
import {verifyPointsCoordinatesCandidate,verifyTypedPointsCoordinatesCandidate} from './verifyCoordinateCandidate';
import {captureSketchFailure,failureCause,withAdmissionCause} from '../constr/admissionCause.mjs';

// Private Worker semantic operation ONLY. Native settlement/current source,
// job/cohort/selection ownership and shared publication remain Root callers'
// obligations. No public coordinates, permission flag or persistent constraint.
type Endpoint='a'|'b';
type Intent=Readonly<{action:'trim'|'extend';target:Readonly<{curveId:string;endpoint:Endpoint}>;nativeIndex:number}>;
type Point=Readonly<{id:string;x:number;y:number}>;
type Semantic=Readonly<{point:Point;opposite:Point;points:readonly [Point,Point];noop:boolean;
 before:any;boundaryId:string;endpoint:Endpoint;other:Endpoint;targetId:string}>;
type Input=Readonly<{
 revision:string;sketchJSON:string;externalParameters:Readonly<Record<string,number>>;
 expectedSource:FiniteCurveSourceSuccess;raw:RawFiniteCurveReadResult;
 domain:FiniteCurveCertificateDomain;intent:Intent;coordinatePolicy:'ordinary'|'typed-lengths';
}>;
const KEYS=['revision','sketchJSON','externalParameters','expectedSource','raw','domain','intent','coordinatePolicy'];
const own=(v:any,k:string)=>Object.prototype.hasOwnProperty.call(v,k);
const fail=(code:string,message:string):never=>{throw Object.assign(Error(message),{code});};
function fields(value:any,keys:string[]){
 if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value))||
    Reflect.ownKeys(value).length!==keys.length||Reflect.ownKeys(value).some(k=>typeof k!=='string'||!keys.includes(k)))
  fail('CURVE_ENDPOINT_INVALID_REQUEST','Invalid private endpoint operation fields.');
 const out:any=Object.create(null);
 for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!own(d,'value'))fail('CURVE_ENDPOINT_INVALID_REQUEST','Endpoint fields must be own data.');out[key]=d.value;}
 return out;
}
function identifier(value:any){
 if(typeof value!=='string'||!value||value.length>256||/[\u0000-\u001f\u007f]/u.test(value))
  fail('CURVE_ENDPOINT_INVALID_REQUEST','Expected a bounded actual curve identity.');
 return value;
}
function captureIntent(value:any):Intent{
 const i=fields(value,['action','target','nativeIndex']),t=fields(i.target,['curveId','endpoint']);
 if(!['trim','extend'].includes(i.action)||!['a','b'].includes(t.endpoint)||
    !Number.isSafeInteger(i.nativeIndex)||i.nativeIndex<0||i.nativeIndex>7)
  fail('CURVE_ENDPOINT_INVALID_REQUEST','Invalid endpoint action or actual Native index.');
 return Object.freeze({action:i.action,target:Object.freeze({curveId:identifier(t.curveId),endpoint:t.endpoint}),nativeIndex:i.nativeIndex});
}
function captureDomain(value:any):FiniteCurveCertificateDomain{
 const kind=value&&typeof value==='object'?Object.getOwnPropertyDescriptor(value,'kind'):null;
 if(!kind?.enumerable||!own(kind,'value'))fail('CURVE_ENDPOINT_INVALID_REQUEST','Expected an own-data query domain.');
 if(kind.value==='finite-pair'){fields(value,['kind']);return Object.freeze({kind:'finite-pair'});}
 if(kind.value==='endpoint-ray'){
  const d=fields(value,['kind','targetCurveId','endpoint']);
  if(!['a','b'].includes(d.endpoint))fail('CURVE_ENDPOINT_INVALID_REQUEST','Invalid actual endpoint ray.');
  return Object.freeze({kind:'endpoint-ray',targetCurveId:identifier(d.targetCurveId),endpoint:d.endpoint});
 }
 fail('CURVE_ENDPOINT_INVALID_REQUEST','Unknown private query domain.');
}
function boundedText(value:any):string{
 if(typeof value!=='string'||value.length>1048576||new TextEncoder().encode(value).byteLength>1048576)
  fail('CURVE_ENDPOINT_INVALID_REQUEST','Endpoint candidate exceeds the existing1MiB source envelope.');
 return value;
}
function resultPoint(value:any):Point{
 const p=fields(value,['id','x','y']);
 if(![p.x,p.y].every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=1e8))
  fail('CURVE_ENDPOINT_INVALID_REQUEST','Expected an exact bounded endpoint receipt.');
 return Object.freeze({id:identifier(p.id),x:p.x,y:p.y});
}
function capture(value:any,verify:boolean):Input&{candidateJSON?:string;resultPoint?:Point}{
 const r=fields(value,verify?[...KEYS,'candidateJSON','resultPoint']:KEYS);
 // Validate expectedSource before borrowing its selected order; it is only a
 // structural claim until independently re-extracted from original text below.
 const source=captureFiniteCurveSourceReceipt(r.expectedSource,r.revision);
 if(source.ok!==true)fail('CURVE_ENDPOINT_INVALID_REQUEST','A successful original-source receipt is required.');
 const original=captureFiniteCurveSourceRequest({
  revision:r.revision,sketchJSON:r.sketchJSON,externalParameters:r.externalParameters,
  intent:{curveIds:source.targets.map(t=>t.id)}
 });
 if(!['ordinary','typed-lengths'].includes(r.coordinatePolicy))
  fail('CURVE_ENDPOINT_INVALID_REQUEST','Unknown private coordinate verification policy.');
 const intent=captureIntent(r.intent),domain=captureDomain(r.domain);
 const raw=captureFiniteCurveReadResult(r.raw,source.input);
 return Object.freeze({
  revision:original.revision,sketchJSON:original.sketchJSON,externalParameters:original.externalParameters,
  expectedSource:source,raw,domain,intent,coordinatePolicy:r.coordinatePolicy,
  ...(verify?{candidateJSON:boundedText(r.candidateJSON),resultPoint:resultPoint(r.resultPoint)}:{})
 });
}
function originalRequest(a:Input):FiniteCurveSourceRequest{
 return captureFiniteCurveSourceRequest({
  revision:a.revision,sketchJSON:a.sketchJSON,externalParameters:a.externalParameters,
  intent:{curveIds:a.expectedSource.targets.map(t=>t.id)}
 });
}
function throwFailure(value:any):never{
 const error=captureSketchFailure(value);
 throw withAdmissionCause(Object.assign(Error(error.message),{code:error.code}),error.cause);
}
function unchanged(a:any,b:any):boolean{
 // Private validated parsed data only; bounded exact represented comparison,
 // including signed zero. No caller getter/object graph is traversed here.
 const pending:any[]=[[a,b,0]];let work=0;
 while(pending.length){
  const [x,y,depth]=pending.pop();if(++work>100000||depth>64)fail('RESOURCE_LIMIT','Endpoint preservation proof exceeds the existing structural envelope.');
  if(Object.is(x,y))continue;
  if(!x||!y||typeof x!=='object'||typeof y!=='object'||Array.isArray(x)!==Array.isArray(y))return false;
  const k=Object.keys(x),j=Object.keys(y);
  if(k.length!==j.length||k.some(key=>!own(y,key)))return false;
  for(const key of k)pending.push([x[key],y[key],depth+1]);
 }
 return true;
}
function row(sketch:any,id:string){
 const rows=sketch.objects.filter(o=>o.id===id);
 if(rows.length!==1)fail('CURVE_ENDPOINT_CANDIDATE_MISMATCH','The actual source curve identity changed.');
 return rows[0];
}
function samePoint(a:Point,b:Point):boolean{
 return a.id===b.id&&Object.is(a.x,b.x)&&Object.is(a.y,b.y);
}
async function semantic(a:Input):Promise<Semantic>{
 const source=await extractFiniteCurveSource(originalRequest(a));
 if(source.ok!==true)throwFailure(source.error);
 if(!sameFiniteCurveSourceReceipt(source,a.expectedSource))
  fail('FINITE_CURVE_SOURCE_MISMATCH','The retained query source differs from the independently extracted original request.');
 const raw=captureFiniteCurveReadResult(a.raw,source.input);
 const slot=source.targets.findIndex(t=>t.id===a.intent.target.curveId);
 if(slot<0)fail('CURVE_ENDPOINT_UNSUPPORTED','Endpoint editing requires an actual selected source Segment.');
 const target=source.targets[slot],curve=source.input.curves[slot].curve;
 if(target.type!=='Segment'||curve.kind!=='segment')
  fail('CURVE_ENDPOINT_UNSUPPORTED','Endpoint editing requires an actual selected source Segment.');
 // The domain is part of semantic intent, not a caller choice of a raw root.
 if(a.intent.action==='trim'?a.domain.kind!=='finite-pair':
    a.domain.kind!=='endpoint-ray'||a.domain.targetCurveId!==target.id||a.domain.endpoint!==a.intent.target.endpoint)
  fail('CURVE_ENDPOINT_UNSUPPORTED','The query domain does not match the requested trim or same endpoint-ray extension.');
 const certificate=verifyFiniteCurveCandidates(source.input.curves,raw,a.domain);
 if(certificate.status!=='certified')
  fail('CURVE_QUERY_UNCERTAIN',('The actual finite candidate is unqualified: '+certificate.reason).slice(0,512));
 if(certificate.kind!=='finite-points'||!certificate.finiteRootIndices.includes(a.intent.nativeIndex))
  fail('CURVE_ENDPOINT_UNSUPPORTED','Choose a certified isolated actual Native point in BOTH selected domains; overlap events are not endpoint edits.');
 const roots=certificate.roots.filter(r=>r.nativeIndex===a.intent.nativeIndex);
 if(roots.length!==1)fail('CURVE_ENDPOINT_UNSUPPORTED','The actual selected Native point has no unique bounded certificate.');
 const root=roots[0];
 if(!root.distanceEvidence.withinBudget||root.distanceEvidence.budgetMm!==5e-8)
  fail('CURVE_PUBLICATION_DISTANCE_UNQUALIFIED','The actual Native point lacks the required50pm prepublication distance evidence.');
 const member=root.memberships.find(m=>m.curveId===target.id);
 if(!member||!member.selectedDomain||root.memberships.length!==2||root.memberships.some(m=>!m.selectedDomain))
  fail('CURVE_ENDPOINT_UNSUPPORTED','The selected actual Native point is outside the requested pair domain.');
 const endpoint=a.intent.target.endpoint,other:Endpoint=endpoint==='a'?'b':'a';
 const ownLocation=endpoint==='a'?'endpoint-a':'endpoint-b';
 const oppositeLocation=endpoint==='a'?'endpoint-b':'endpoint-a';
 if(a.intent.action==='trim'&&member.location===oppositeLocation)
  fail('CURVE_ENDPOINT_DEGENERATE','Trimming to the exact certified opposite endpoint would collapse the Segment.');
 const noop=a.intent.action==='trim'&&member.location===ownLocation;
 if(a.intent.action==='trim'?!noop&&member.location!=='interior':member.location!=='outside')
  fail('CURVE_ENDPOINT_UNSUPPORTED','The actual certified location is not an internal trim, own-end no-op or genuine outward endpoint-ray extension.');
 // Members are issued by actual native child ownership in the fresh extraction,
 // in its documented root,A,B order. No source ID spelling is interpreted.
 const id=target.members[endpoint==='a'?1:2],oppositeId=target.members[endpoint==='a'?2:1];
 if(target.members.length!==3||id.length>256||oppositeId.length>256)
  fail('CURVE_ENDPOINT_UNSUPPORTED','The actual owned endpoints exceed the existing private coordinate-edit envelope.');
 const start=curve[endpoint],fixed=curve[other],candidate=root.candidate;
 const native=raw.rawPoints[a.intent.nativeIndex]?.point;
 if(!native||candidate.some((n,i)=>!Object.is(n,native[i])))
  fail('CURVE_ENDPOINT_CANDIDATE_MISMATCH','The certified point differs from its actual Native index.');
 const point:Point=Object.freeze({id,x:noop?start[0]:candidate[0],y:noop?start[1]:candidate[1]});
 const opposite:Point=Object.freeze({id:oppositeId,x:fixed[0],y:fixed[1]});
 if(!noop&&point.x===start[0]&&point.y===start[1])
  fail('CURVE_ENDPOINT_UNSUPPORTED','The distinct mathematical event has no distinct represented Native endpoint edit; no own-end no-op is claimed.');
 const before=JSON.parse(a.sketchJSON),boundaryId=source.targets[1-slot].id;
 return {point,opposite,points:Object.freeze([point,opposite]) as readonly [Point,Point],noop,before,boundaryId,endpoint,other,targetId:target.id};
}
function preserve(a:Input,s:Semantic,candidateJSON:string){
 if(s.noop&&candidateJSON!==a.sketchJSON)
  fail('CURVE_ENDPOINT_CANDIDATE_MISMATCH','An own-endpoint no-op must retain EXACT original source bytes.');
 const after=JSON.parse(candidateJSON);
 if(!Array.isArray(after?.objects)||!unchanged(row(s.before,s.boundaryId),row(after,s.boundaryId)))
  fail('CURVE_ENDPOINT_CANDIDATE_MISMATCH','The selected boundary curve changed during endpoint editing.');
 const target=row(after,s.targetId);
 if(target.type!=='Segment'||!unchanged(target.data?.[s.other],row(s.before,s.targetId).data[s.other]))
  fail('CURVE_ENDPOINT_CANDIDATE_MISMATCH','The opposite target endpoint did not remain EXACTLY unchanged.');
 const end=target.data?.[s.endpoint];
 // Existing coordinate publication uses exact numeric equality: JSON
 // canonicalizes signed zero. No spatial tolerance is used for target intent.
 if(!end||end.x!==s.point.x||end.y!==s.point.y)
  fail('CURVE_ENDPOINT_CANDIDATE_MISMATCH','The selected Native endpoint was not retained exactly.');
}
function coordinateRequest(a:Input,s:Semantic){
 return {revision:a.revision,sketchJSON:a.sketchJSON,externalParameters:a.externalParameters,intent:{points:s.points}};
}
function revision(value:any):string{
 const d=value&&typeof value==='object'?Object.getOwnPropertyDescriptor(value,'revision'):null;
 return d?.enumerable&&own(d,'value')&&typeof d.value==='string'&&d.value.length<=256?d.value:'';
}
function failure(r:string,error:any){
 const cause=failureCause(error),code=typeof error?.code==='string'&&error.code?error.code.slice(0,64):'CURVE_ENDPOINT_FAILED';
 return {revision:r,ok:false as const,error:{code,message:typeof error?.message==='string'?error.message.slice(0,512):'Private endpoint operation failed.',...(cause?{cause}:{})}};
}
export async function changeFiniteCurveEndpoint(value:unknown){
 const r=revision(value);try{
  const a=capture(value,false),s=await semantic(a);
  const result:any=editPointsCoordinatesTransition(coordinateRequest(a,s));
  if(!result.ok)throwFailure(result.error);
  if(result.revision!==a.revision||typeof result.serializedSketch!=='string'||
     !Array.isArray(result.points)||result.points.length!==2||
     !samePoint(result.points[0],s.point)||!samePoint(result.points[1],s.opposite))
   fail('CURVE_ENDPOINT_CANDIDATE_MISMATCH','The shared coordinate producer returned another exact intent.');
  const candidateJSON=boundedText(result.serializedSketch);preserve(a,s,candidateJSON);
  if(!s.noop&&candidateJSON===a.sketchJSON)
   fail('CURVE_ENDPOINT_UNSUPPORTED','The requested mathematical event produced no source edit.');
  return {revision:a.revision,ok:true as const,changed:!s.noop,serializedSketch:candidateJSON,evidence:result.evidence,
   point:s.point,endpoint:{action:a.intent.action,target:a.intent.target,nativeIndex:a.intent.nativeIndex}};
 }catch(error){return failure(r,error);}
}
export async function verifyFiniteCurveEndpointCandidate(value:unknown){
 const r=revision(value);try{
  const a=capture(value,true),s=await semantic(a);
  if(!samePoint(a.resultPoint,s.point))
   fail('CURVE_ENDPOINT_CANDIDATE_MISMATCH','The result point differs from the independently reconstructed semantic Native selection.');
  preserve(a,s,a.candidateJSON);
  const verify=a.coordinatePolicy==='typed-lengths'?verifyTypedPointsCoordinatesCandidate:verifyPointsCoordinatesCandidate;
  const result=verify({...coordinateRequest(a,s),candidateJSON:a.candidateJSON,points:s.points});
  if(!result.ok)throwFailure(result.error);
  return {revision:a.revision,ok:true as const,verified:true};
 }catch(error){return failure(r,error);}
}
