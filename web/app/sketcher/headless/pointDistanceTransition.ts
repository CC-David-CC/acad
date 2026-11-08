import {HeadlessSketchWorkspace} from './workspace';
import {replaySketchTransition} from './sketchTransition';
import {solveSketch} from './solve';
import {preparePointDistance} from '../actions/pointDistanceAdmission';
import {addConstraintGroup} from '../actions/addConstraintGroup';
import {capturePointDistanceIntent} from './pointDistanceEnvelope.mjs';
import {captureSignedDistanceRows,verifySignedDistanceInsertion} from './signedDistanceIntentProof';
import {assertVerifiedReplayGeometry,assertUnrelatedSignedGeometry} from './verifiedReplayGeometry';
import {failureCause,admissionCause,withAdmissionCause} from '../constr/admissionCause.mjs';
const fail=(code:string,message:string)=>withAdmissionCause(Object.assign(Error(message),{code}),code==='RESIDUAL'?admissionCause('original-residual-failure'):undefined);
function data(v:any,keys:string[]){if(!v||typeof v!=='object'||Array.isArray(v)||![Object.prototype,null].includes(Object.getPrototypeOf(v))||Reflect.ownKeys(v).length!==keys.length)throw fail('INVALID','Invalid point distance request.');const out:any={};for(const k of keys){const d=Object.getOwnPropertyDescriptor(v,k);if(!d?.enumerable||!Object.hasOwn(d,'value'))throw fail('INVALID','Point distance fields must be own data.');out[k]=d.value;}return out;}
function bindings(v:any){const r=data(v,Reflect.ownKeys(v||{}) as string[]),out=Object.create(null);if(Object.keys(r).length>1024)throw fail('LIMIT','Too many point distance parameters.');for(const k of Object.keys(r)){if(!k||k.length>256||typeof r[k]!=='number'||!Number.isFinite(r[k])||Math.abs(r[k])>1e9)throw fail('INVALID','Invalid point distance parameter.');out[k]=r[k];}return out;}
function text(v:any){if(typeof v!=='string'||v.length>1048576||new TextEncoder().encode(v).byteLength>1048576)throw fail('LIMIT','Point distance source exceeds1MiB.');return v;}
const failure=(error:any)=>({code:typeof error?.code==='string'?error.code.slice(0,64):'INVALID',message:typeof error?.message==='string'?error.message.slice(0,512):'Point distance transition failed.',...(failureCause(error)?{cause:failureCause(error)}:{})});

// Disposable real model/solver computation. Public requests never contain a
// source seed; the shared coordinator captures the current source privately.
export function addPointDistanceTransition(request:any){let revision='';try{
 const a=data(request,['revision','sketchJSON','externalParameters','intent']);revision=a.revision;if(typeof revision!=='string'||!revision||revision.length>256)throw fail('INVALID','Invalid point distance revision.');
 const intent=capturePointDistanceIntent(a.intent),external=bindings(a.externalParameters),captured=replaySketchTransition({revision,sketchJSON:text(a.sketchJSON),externalParameters:external});if(!captured.ok)return captured;if(!('serializedSketch' in captured))throw fail('INVALID','Replay did not return verified source.');
 const before=JSON.parse(captured.serializedSketch);if(before.objects.length>1024||before.stages.length!==1||before.stages[0].generators.length||before.objects.some(o=>!['Point','Segment','Circle','Arc'].includes(o.type)))throw fail('UNSUPPORTED_SKETCH','Point distance creation currently supports one nongenerated ordinary analytic stage.');
 const workspace=new HeadlessSketchWorkspace(external);workspace.io._loadSketch(structuredClone(before),{strict:true});const pm=workspace.parametricManager,index=workspace.createIndex(),objects=intent.ids.map(id=>index[id]);if(objects.some(o=>!o))throw fail('POINT_DISTANCE_TARGET','An inspected point is no longer available.');
 const retained=captureSignedDistanceRows(pm.stages),prepared=preparePointDistance(pm,objects,intent.distance),constraint=prepared.constraint;
 if(prepared.existing){
  prepared.validate(pm.stages);const at=pm.stages[0].algNumSystem.allConstraints.filter(c=>!c.internal).indexOf(constraint),row=before.stages[0].constraints[at];if(at<0||row?.typeId!=='DistancePP'||JSON.stringify(row.objects)!==JSON.stringify(intent.ids)||!['accepted','redundant'].includes(row.admission?.state)||captured.evidence[at]?.state!==row.admission.state)throw fail('ADMISSION_CHANGED','The existing actual point distance is unavailable.');
  return {revision,ok:true as const,changed:false,serializedSketch:a.sketchJSON,evidence:captured.evidence,dimension:{typeId:'DistancePP',objects:[...intent.ids],distance:intent.distance,status:row.admission.state,stage:0,index:at}};
 }
 // addConstraintGroup uses its genuine history hook when one exists. This
 // headless workspace has none; the outer sketch-bytes journal owns publication.
 addConstraintGroup(pm,[constraint],prepared.validate);
 const candidate=JSON.parse(workspace.io.serializeSketch(before.metadata,{strict:true}));candidate.boundary=before.boundary;const incrementalStatus=constraint.stage.algNumSystem.redundant.has(constraint)?'redundant':'accepted';
 // The existing proof is distance-field generic: actual constraint object,
 // retained rows, ordered IDs, exact constant and true incremental admission.
 const at=verifySignedDistanceInsertion({before,after:candidate,intent,constraint,stages:pm.stages,retained,status:incrementalStatus}),scope={stage:0,index:at};assertUnrelatedSignedGeometry(before,candidate,external,scope);
 const solved=solveSketch({revision,sketch:candidate,boundary:structuredClone(candidate.boundary),externalParameters:external});if(!solved.ok)return solved;assertVerifiedReplayGeometry(candidate,solved.sketch,solved.evidence,external,scope);
 const row=solved.sketch.stages[0]?.constraints[at],e=solved.evidence[at];if(!row||row.typeId!=='DistancePP'||row.stage!==0||JSON.stringify(row.objects)!==JSON.stringify(intent.ids)||!row.constants||Reflect.ownKeys(row.constants).length!==1||row.constants.distance!==intent.distance||row.admission?.version!==1||!['accepted','redundant'].includes(row.admission.state)||e?.typeId!=='DistancePP'||e.state!==row.admission.state)throw fail('ADMISSION_CHANGED','Final point distance identity, constant or admission changed.');
 const verified=new HeadlessSketchWorkspace(external);verified.io._loadSketch(structuredClone(solved.sketch),{strict:true});const checked=verified.createIndex(),p=checked[intent.ids[0]],q=checked[intent.ids[1]],distance=Math.hypot(q.x-p.x,q.y-p.y);if(!Number.isFinite(distance)||Math.abs(distance-intent.distance)>1e-6)throw fail('RESIDUAL','Euclidean point distance differs from actual solved geometry.');
 return {revision,ok:true as const,changed:true,serializedSketch:text(JSON.stringify(solved.sketch)),evidence:solved.evidence,dimension:{typeId:'DistancePP',objects:[...intent.ids],distance:intent.distance,status:row.admission.state,stage:0,index:at}};
 }catch(error){return {revision,ok:false as const,error:failure(error)};}}

// Independently reconstruct the original captured request in another Worker;
// valid/re-solvable candidate JSON alone cannot acquire publication authority.
export function verifyPointDistanceCandidate(request:any){let revision='';try{
 const a=data(request,['revision','sketchJSON','externalParameters','intent','candidateJSON','dimension']);revision=a.revision;const expected=addPointDistanceTransition({revision,sketchJSON:a.sketchJSON,externalParameters:a.externalParameters,intent:a.intent});if(!expected.ok)return expected;
 const d=data(a.dimension,['typeId','objects','distance','status','stage','index']),intent=capturePointDistanceIntent({ids:d.objects,distance:d.distance});d.objects=[...intent.ids];if(!('serializedSketch' in expected)||expected.serializedSketch!==text(a.candidateJSON)||JSON.stringify(d)!==JSON.stringify(expected.dimension))throw fail('CANDIDATE_MISMATCH','Candidate source or final receipt differs from independent point distance reconstruction.');return {revision,ok:true as const,verified:true};
 }catch(error){return {revision,ok:false as const,error:failure(error)};}}
