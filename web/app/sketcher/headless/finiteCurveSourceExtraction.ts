import {HeadlessSketchWorkspace} from './workspace';
import {solveSketch} from './solve';
import {evaluateCapturedSketch} from './capturedSketchEvaluation';
import {assertVerifiedReplayGeometry} from './verifiedReplayGeometry';
import {capturedParameterOwnership,installCapturedAuxiliaryWitnesses} from './capturedParameterOwnership';
import type {CapturedAuxiliaryWitnessBatch} from './capturedParameterOwnership';
import {sameRestoredSketch} from '../historyEquivalence.mjs';
import {Segment} from '../shapes/segment';
import {Circle} from '../shapes/circle';
import {Arc} from '../shapes/arc';
import {Param} from '../shapes/param';
import {EndPoint} from '../shapes/point';
import {areEqual,TOLERANCE} from 'math/equality';
import {exactFiniteCurveSourceRadiusIncidence as exactRadius} from './finiteCurveSourceArcPolicy.mjs';
import {failureCause,withAdmissionCause} from '../constr/admissionCause.mjs';
import {encodeFiniteCurveReadInput} from '../../../../modules/engine/mount/finiteCurveReadProtocol.mjs';
import {captureFiniteCurveSourceRequest,captureFiniteCurveSourceReceipt,captureFiniteCurveSourceFrame,finiteCurveSourceBindingText,sameFiniteCurveSourceReceipt,finiteCurveSourceFail as fail} from './finiteCurveSourceEnvelope.mjs';
import type {FiniteCurveSourceRequest,FiniteCurveSourceReceipt,FiniteCurveSourceSuccess,FiniteCurveSourceTarget} from './finiteCurveSourceEnvelope.mjs';

// NEW private source preparation only. No task dispatch, mount, event IDs or J.
const TAU=2*Math.PI,ZERO_SHA='0'.repeat(64);
const own=(value:object,key:string)=>Object.prototype.hasOwnProperty.call(value,key);
function failureRevision(value:unknown):string {const d=value&&typeof value==='object'?Object.getOwnPropertyDescriptor(value,'revision'):null;return d?.enumerable&&own(d,'value')&&typeof d.value==='string'&&d.value.length<=256?d.value:'';}
function failure(revision:string,error:any):FiniteCurveSourceReceipt {
 const cause=failureCause(error);
 const code=typeof error?.code==='string'&&error.code?error.code.slice(0,64):'FINITE_CURVE_SOURCE_FAILED';
 const message=typeof error?.message==='string'?error.message.slice(0,512):'Finite-curve source extraction failed.';
 return Object.freeze({revision,ok:false as const,error:Object.freeze({code,message,...(cause?{cause}:{})})});
}
function assertTreeUnchanged(before:any,after:any){
 // Both are bounded private parsed trees. Compare numbers with Object.is so a
 // source -0 cannot silently become +0 while JSON.stringify looks unchanged.
 if(!sameFiniteCurveSourceReceipt(before,after))fail('FINITE_CURVE_SOURCE_MISMATCH','Original source changed during private preparation.');
}
async function digest(text:string):Promise<string>{const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return Array.from(new Uint8Array(bytes),n=>n.toString(16).padStart(2,'0')).join('');}
function cold(request:FiniteCurveSourceRequest,sketch:any){
 let auxiliary:CapturedAuxiliaryWitnessBatch|undefined;
 const result=solveSketch({revision:request.revision,sketch:structuredClone(sketch),boundary:structuredClone(sketch.boundary),externalParameters:request.externalParameters},undefined,batch=>{auxiliary=batch;});
 if(!result.ok)throw withAdmissionCause(Object.assign(Error(result.error.message),{code:result.error.code}),result.error.cause);
 assertVerifiedReplayGeometry(sketch,result.sketch,result.evidence,request.externalParameters);
 const checked=evaluateCapturedSketch(sketch,request.externalParameters,result.evidence,undefined,auxiliary);
 return {auxiliary,checked};
}
function restored(workspace:HeadlessSketchWorkspace,sketch:any){
 const value=JSON.parse(workspace.io.serializeSketch(sketch.metadata,{strict:true}));value.boundary=structuredClone(sketch.boundary);
 if(!sameRestoredSketch(JSON.stringify(sketch),JSON.stringify(value)))fail('FINITE_CURVE_SOURCE_MISMATCH','Actual captured model differs from original source.');
}
function point(p:any,raw:any):readonly [number,number]{
 if(!(p instanceof EndPoint)||!raw||typeof raw!=='object'||!Object.is(p.x,raw.x)||!Object.is(p.y,raw.y)||!Number.isFinite(p.x)||!Number.isFinite(p.y))fail('FINITE_CURVE_SOURCE_MISMATCH','Actual endpoint bits differ from the original source.');
 return Object.freeze([p.x,p.y]) as readonly [number,number];
}
function inspectTargets(workspace:HeadlessSketchWorkspace,sketch:any,request:FiniteCurveSourceRequest,auxiliary:CapturedAuxiliaryWitnessBatch|undefined){
 const pm=workspace.parametricManager,index=workspace.createIndex(),stages=pm.stages,ownership=capturedParameterOwnership(workspace);
 installCapturedAuxiliaryWitnesses(workspace,ownership,auxiliary);restored(workspace,sketch);
 const source=new Map<string,any>();for(const row of sketch.objects){if(source.has(row.id))fail('FINITE_CURVE_SOURCE_MISMATCH','Original root identity is ambiguous.');source.set(row.id,row);}
 const selected=new Set<any>(),parameters=new Set<Param>(),targets:FiniteCurveSourceTarget[]=[],curves:any[]=[];
 for(const id of request.intent.curveIds){
  const row=source.get(id),root=index[id];
  if(!row||!root||root.id!==id||root.parent||root.isGenerated||!['Segment','Circle','Arc'].includes(row.type)||root.TYPE!==row.type||root.role!==row.role||!Number.isSafeInteger(row.stage)||row.stage<0||row.stage>31||root.stage!==stages[row.stage]||!root.stage.objects.has(root))fail('FINITE_CURVE_SOURCE_UNSUPPORTED_TARGET','Choose actual nongenerated source-root Segment, Circle or proper Arc identities.');
  if(!(row.type==='Segment'?root instanceof Segment:row.type==='Circle'?root instanceof Circle:root instanceof Arc))fail('FINITE_CURVE_SOURCE_MISMATCH','Actual curve constructor differs from its source type.');
  const children:any[]=row.type==='Segment'?[root.a,root.b]:row.type==='Circle'?[root.c]:[root.a,root.b,root.c],members=[root,...children];
  if(root.children.size!==children.length||children.some(child=>!(child instanceof EndPoint)||child.parent!==root||!root.children.has(child)||child.children.size!==0))fail('FINITE_CURVE_SOURCE_MISMATCH','Actual curve child graph differs.');
  const traversed:any[]=[];root.traverse(object=>{traversed.push(object);});
  if(traversed.length!==members.length||new Set(traversed).size!==members.length||traversed.some(object=>!members.includes(object)))fail('FINITE_CURVE_SOURCE_MISMATCH','Unexpected captured curve descendants.');
  for(const member of members){if(index[member.id]!==member||member.stage!==root.stage||member.isGenerated||selected.has(member))fail('FINITE_CURVE_SOURCE_MISMATCH','Selected curve ownership or identities alias.');selected.add(member);}
  // Inventory only actual geometric Params; shared coordinate VALUES are fine.
  const local=new Set<Param>();root.traverse(object=>object.visitParams((parameter:Param)=>{if(!(parameter instanceof Param)||!ownership.geometry.has(parameter)||!Number.isFinite(parameter.get()))fail('FINITE_CURVE_SOURCE_MISMATCH','Curve parameter has no actual geometric ownership.');local.add(parameter);}));
  for(const parameter of local){if(parameters.has(parameter))fail('FINITE_CURVE_SOURCE_MISMATCH','Selected curves alias a geometric parameter.');parameters.add(parameter);}
  const target={id,type:row.type,role:row.role,stage:row.stage,members:members.map(member=>member.id)};
  let curve:any;
  if(row.type==='Segment')curve={kind:'segment',a:point(root.a,row.data.a),b:point(root.b,row.data.b)};
  else if(row.type==='Circle'){
   if(!Object.is(root.r.get(),row.data.r)||!ownership.geometry.has(root.r))fail('FINITE_CURVE_SOURCE_MISMATCH','Actual radius differs from original Circle.');
   curve={kind:'circle',center:point(root.c,row.data.c),radius:root.r.get()};
  }else{
   const a=point(root.a,row.data.a),b=point(root.b,row.data.b),center=point(root.c,row.data.c),radius=root.r.get(),start=root.getStartAngle(),originalEnd=root.getEndAngle();
   if(![root.r,root.ang1,root.ang2].every(p=>ownership.geometry.has(p))||![radius,start,originalEnd].every(Number.isFinite))fail('FINITE_CURVE_SOURCE_MISMATCH','Arc parameters have no genuine finite source ownership.');
   // CAD-ARC-01: actual drawImpl uses this branch. Refuse its ambiguous full
   // turn interpretation; never use the tolerance to join/project endpoints.
   if(a[0]===b[0]&&a[1]===b[1]||areEqual(a[0],b[0],TOLERANCE)&&areEqual(a[1],b[1],TOLERANCE))fail('FINITE_CURVE_SOURCE_UNCERTAIN','Arc proper/full branch is ambiguous under the inherited source/render policy (CAD-ARC-01).');
   if(!exactRadius(a,center,radius)||!exactRadius(b,center,radius))fail('FINITE_CURVE_SOURCE_UNCERTAIN','Arc endpoints lack exact represented-radius incidence in the initial finite query domain.');
   const end=originalEnd<=start?originalEnd+TAU:originalEnd,sweep=end-start;
   if(!Number.isFinite(end)||!(sweep>0&&sweep<TAU))fail('FINITE_CURVE_SOURCE_UNCERTAIN','Arc has no representable proper finite CCW branch.');
   curve={kind:'arc',a,b,center,radius,startRadians:start,endRadians:end,sense:'ccw'};
  }
  targets.push(target);curves.push({id,stage:row.stage,curve});
 }
 ownership.unchanged();restored(workspace,sketch);
 let input;try{input=encodeFiniteCurveReadInput(curves);}catch(error){if((error as any)?.code==='CURVE_QUERY_INVALID_REQUEST')fail('FINITE_CURVE_SOURCE_UNSUPPORTED_TARGET','Actual selected curves exceed the frozen finite-query envelope.');throw error;}
 return {targets,input};
}
function admissionText(sketch:any,evidence:any[]):string{
 const parts=['codi-finite-curve-source-admission-v1'];let cursor=0;
 for(let stage=0;stage<sketch.stages.length;stage++)for(let index=0;index<sketch.stages[stage].constraints.length;index++){
  const row=sketch.stages[stage].constraints[index],actual=evidence[cursor++];
  if(cursor>10000)fail('FINITE_CURVE_SOURCE_RESOURCE_LIMIT','Too many authored admission rows for finite source extraction.');
  if(!actual||actual.typeId!==row.typeId||!['accepted','redundant'].includes(actual.state)||row.admission?.version!==1||row.admission.state!==actual.state)fail('ADMISSION_CHANGED','Actual captured admission membership differs from original source.');
  parts.push(String(stage),String(index),actual.typeId,actual.state);
 }
 if(cursor!==evidence.length)fail('ADMISSION_CHANGED','Unexpected finite source admission rows.');
 return parts.map(s=>new TextEncoder().encode(s).byteLength+':'+s).join('');
}
async function extract(request:FiniteCurveSourceRequest):Promise<FiniteCurveSourceSuccess>{
 const sketch=JSON.parse(request.sketchJSON),snapshot=structuredClone(sketch);
 if(!sketch||typeof sketch!=='object'||Array.isArray(sketch)||!sketch.boundary)fail('FINITE_CURVE_SOURCE_INVALID','Original complete sketch and boundary are required.');
 const observation=cold(request,sketch);assertTreeUnchanged(snapshot,sketch);
 const frame=captureFiniteCurveSourceFrame(sketch.metadata?.boundaryFrame),workspace=new HeadlessSketchWorkspace(request.externalParameters);
 const data=workspace.io.evaluateCapturedSketch(structuredClone(sketch),()=>inspectTargets(workspace,sketch,request,observation.auxiliary));
 assertTreeUnchanged(snapshot,sketch);
 const admission=admissionText(sketch,observation.checked.evidence);
 const sourceSha256=await digest(request.sketchJSON),admissionSha256=await digest(admission);assertTreeUnchanged(snapshot,sketch);
 // Capture/size/freeze everything before the next async digest. No model or
 // private auxiliary witnesses cross the receipt or survive IO cleanup.
 const provisional=captureFiniteCurveSourceReceipt({version:1,revision:request.revision,ok:true,sourceSha256,bindingSha256:ZERO_SHA,admissionSha256,frame,targets:data.targets,input:data.input},request.revision);
 if(provisional.ok!==true)fail('FINITE_CURVE_SOURCE_MISMATCH','Unexpected private extraction outcome.');
 const material=finiteCurveSourceBindingText(request,provisional),bindingSha256=await digest(material);assertTreeUnchanged(snapshot,sketch);
 if(material!==finiteCurveSourceBindingText(request,provisional))fail('FINITE_CURVE_SOURCE_MISMATCH','Immutable extraction inputs changed while hashing.');
 const result=captureFiniteCurveSourceReceipt({...provisional,bindingSha256},request.revision);
 if(result.ok!==true)fail('FINITE_CURVE_SOURCE_MISMATCH','Unexpected captured extraction outcome.');return result;
}
export async function extractFiniteCurveSource(value:unknown):Promise<FiniteCurveSourceReceipt>{const revision=failureRevision(value);try{return await extract(captureFiniteCurveSourceRequest(value));}catch(error){return failure(revision,error);}}
export async function verifyFiniteCurveSource(value:unknown):Promise<FiniteCurveSourceReceipt>{const revision=failureRevision(value);try{const request=captureFiniteCurveSourceRequest(value,true),{expected,...original}=request,actual=await extract(original);if(!sameFiniteCurveSourceReceipt(expected,actual))fail('FINITE_CURVE_SOURCE_MISMATCH','Second original-request extraction differs in actual target, frame, F64 encoding or admission binding.');return actual;}catch(error){return failure(revision,error);}}
