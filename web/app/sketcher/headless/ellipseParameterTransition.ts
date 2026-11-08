import {HeadlessSketchWorkspace} from './workspace';
import {Ellipse} from '../shapes/ellipse';
import {EndPoint} from '../shapes/point';
import {capturedParameterOwnership} from './capturedParameterOwnership';
import type {CapturedAuxiliaryWitnessBatch} from './capturedParameterOwnership';
import {captureEllipseRecordData,captureEllipseEditIntent} from '../shapes/ellipseRecord.mjs';
import {solveSketch} from './solve';
import {evaluateCapturedSketch} from './capturedSketchEvaluation';
import {assertVerifiedReplayGeometry} from './verifiedReplayGeometry';
import {failureCause,captureSketchFailure} from '../constr/admissionCause.mjs';
const MAX=1048576;
const fail=(code:string,message:string)=>Object.assign(new Error(message),{code});
function record(v:any,keys:string[]){if(!v||typeof v!=='object'||Array.isArray(v)||Reflect.ownKeys(v).length!==keys.length)throw fail('INVALID','Invalid ellipse transition request.');const d:any={};for(const key of keys){const p=Object.getOwnPropertyDescriptor(v,key);if(!p?.enumerable||!Object.hasOwn(p,'value'))throw fail('INVALID','Ellipse request fields must be own data.');d[key]=p.value;}return d;}
function capture(request:any,verify=false){
 const a=record(request,verify?['revision','sketchJSON','externalParameters','intent','candidateJSON','ellipse','changed']:['revision','sketchJSON','externalParameters','intent']);
 if(typeof a.revision!=='string'||!a.revision||a.revision.length>256||typeof a.sketchJSON!=='string'||a.sketchJSON.length>MAX||new TextEncoder().encode(a.sketchJSON).byteLength>MAX)throw fail('INVALID','Invalid ellipse source/revision.');
 const external=a.externalParameters;if(!external||typeof external!=='object'||Array.isArray(external)||Reflect.ownKeys(external).length>1024)throw fail('INVALID','Invalid ellipse external parameters.');const bindings=Object.create(null);
 for(const key of Reflect.ownKeys(external)){if(typeof key!=='string'||!key||key.length>256)throw fail('INVALID','Invalid external name.');const d=Object.getOwnPropertyDescriptor(external,key);if(!d?.enumerable||!Object.hasOwn(d,'value')||typeof d.value!=='number'||!Number.isFinite(d.value)||Math.abs(d.value)>1e9)throw fail('INVALID','Invalid external value.');bindings[key]=d.value;}
 if(verify&&(typeof a.candidateJSON!=='string'||a.candidateJSON.length>MAX||new TextEncoder().encode(a.candidateJSON).byteLength>MAX||typeof a.changed!=='boolean'))throw fail('INVALID_CANDIDATE','Invalid ellipse candidate.');
 return {...a,externalParameters:bindings,intent:captureEllipseEditIntent(a.intent)};
}
// Real shape/Param ownership is reconstructed privately. A source row or a
// response-local center string never grants mutation authority.
function target(workspace:any,row:any,captured?:any){
 const index=captured?.index||workspace.createIndex(),shape=index[row.id],pm=workspace.parametricManager;
 if(![null,'construction'].includes(row.role)||!(shape instanceof Ellipse)||shape.TYPE!=='Ellipse'||shape.parent||shape.isGenerated||shape.readOnly||shape.generators.size||!pm.stages.includes(shape.stage)||shape.stage.index!==row.stage||shape.role!==row.role||!shape.stage.objects.has(shape)||!(shape.c instanceof EndPoint)||shape.children.size!==1||!shape.children.has(shape.c)||shape.c.parent!==shape||index[shape.c.id]!==shape.c)throw fail('UNSUPPORTED_TARGET','Choose a current independent authored Ellipse.');
 const ownership=captured?.ownership||capturedParameterOwnership(workspace),parameters=[shape.c.params.x,shape.c.params.y,shape.rx,shape.ry,shape.rot];
 if(new Set(parameters).size!==5||parameters.some(p=>!ownership.geometry.has(p)))throw fail('INVALID_TARGET','Ellipse parameters lack actual native ownership.');
 if(!captured)ownership.unchanged();return shape;
}
export function inspectEllipseRows(original:any,replayed:any,external:any){
 const rows=replayed.objects.filter(row=>row.type==='Ellipse');if(!rows.length)return [];
 const workspace=new HeadlessSketchWorkspace(external);workspace.io._loadSketch(structuredClone(replayed),{strict:true});
 const originalRows=new Map<string,any>(original.objects.map(o=>[o.id,o] as [string,any])),captured={index:workspace.createIndex(),ownership:capturedParameterOwnership(workspace)};
 const result=rows.map(row=>{
  const prior:any=originalRows.get(row.id);if(!prior||prior.type!=='Ellipse')throw fail('INTENT_CHANGED','Ellipse source identity changed.');
  const decoded=captureEllipseRecordData(prior.data),p=captureEllipseRecordData(row.data).parameters,index=captured.index,shape=index[row.id];
  if(!(shape instanceof Ellipse)||shape.TYPE!=='Ellipse'||!(shape.c instanceof EndPoint)||shape.c.parent!==shape||index[shape.c.id]!==shape.c)throw fail('INVALID_TARGET','Ellipse center ownership is unavailable.');
  let reason:string|null=null;try{target(workspace,row,captured);}catch(error){if(error?.code==='LIMIT')throw error;reason=typeof error?.code==='string'?error.code:'UNSUPPORTED_TARGET';}
  if(!reason&&decoded.encoding!=='canonical-center-axes')reason='UNSUPPORTED_ENCODING';
  return {id:row.id,centerId:shape.c.id,stage:row.stage,role:row.role,c:p.c,rx:p.rx,ry:p.ry,rotationRadians:p.rot,encoding:decoded.encoding,canEdit:reason===null,reason};
 });
 captured.ownership.unchanged();return result;
}
function prove(revision:string,sketch:any,bindings:any){
 let auxiliary:CapturedAuxiliaryWitnessBatch|undefined;
 const cold=solveSketch({revision,sketch:structuredClone(sketch),boundary:structuredClone(sketch.boundary),externalParameters:bindings},undefined,b=>{auxiliary=b;});
 if(!cold.ok)return {cold};
 assertVerifiedReplayGeometry(sketch,cold.sketch,cold.evidence,bindings);
 const actual=evaluateCapturedSketch(sketch,bindings,cold.evidence,undefined,auxiliary);
 return {cold,actual};
}
function failure(revision:string,error:any){
 const data=(key:string)=>{const d=error&&typeof error==='object'?Object.getOwnPropertyDescriptor(error,key):null;return d&&Object.hasOwn(d,'value')?d.value:undefined;};
 const code=data('code'),message=error instanceof SyntaxError?'Ellipse source JSON is invalid.':data('message'),cause=failureCause(error);
 return {revision,ok:false as const,error:captureSketchFailure({code:typeof code==='string'&&code?code.slice(0,64):'INVALID',message:(typeof message==='string'?message:'Ellipse transition failed.').slice(0,512),...(cause?{cause}:{})})};
}
// Literal geometry edit only: original constraints and every unrelated source
// value remain. We do not use an optimizer to rewrite a dependent ellipse or
// unrelated object, nor convert a formula/dimension into a literal setter.
export function editEllipseParameters(request:any){let revision='';try{
 const a=capture(request);revision=a.revision;const before=JSON.parse(a.sketchJSON),bindings=a.externalParameters;
 const original=prove(revision,before,bindings);if(!original.cold.ok)return original.cold;
 const rows=before.objects.filter(o=>o.id===a.intent.id);if(rows.length!==1||rows[0].type!=='Ellipse')throw fail('UNSUPPORTED_TARGET','Choose an inspected Ellipse root.');
 const saved=rows[0],decoded=captureEllipseRecordData(saved.data);if(decoded.encoding!=='canonical-center-axes')throw fail('UNSUPPORTED_ENCODING','Legacy ellipse source is readable but has no literal parameter edit in this slice.');
 const workspace=new HeadlessSketchWorkspace(bindings);workspace.io._loadSketch(structuredClone(before),{strict:true});target(workspace,saved);
 if(![null,'construction'].includes(saved.role))throw fail('UNSUPPORTED_TARGET','Ellipse role is not editable.');
 const p=decoded.parameters,intent=a.intent,changed=!(p.c.x===intent.c.x&&p.c.y===intent.c.y&&p.rx===intent.rx&&p.ry===intent.ry&&p.rot===intent.rot);
 if(!changed)return {revision,ok:true as const,changed:false,serializedSketch:a.sketchJSON,evidence:original.actual.evidence,ellipse:intent};
 const candidate=structuredClone(before),row=candidate.objects.find(o=>o.id===intent.id);row.data={c:{x:intent.c.x,y:intent.c.y},rx:intent.rx,ry:intent.ry,rot:intent.rot};
 const first=prove(revision,candidate,bindings);if(!first.cold.ok)return first.cold;
 const second=prove(revision,first.cold.sketch,bindings);if(!second.cold.ok)return second.cold;
 assertVerifiedReplayGeometry(candidate,second.cold.sketch,second.cold.evidence,bindings);
 const serializedSketch=JSON.stringify(candidate);if(serializedSketch.length>MAX||new TextEncoder().encode(serializedSketch).byteLength>MAX)throw fail('LIMIT','Ellipse candidate exceeds the existing source limit.');
 return {revision,ok:true as const,changed:true,serializedSketch,evidence:first.actual.evidence,ellipse:intent};
 }catch(error){return failure(revision,error);}}
export function verifyEllipseParameters(request:any){let revision='';try{
 const a=capture(request,true);revision=a.revision;const actual=captureEllipseEditIntent(a.ellipse),expected=editEllipseParameters({revision,sketchJSON:a.sketchJSON,externalParameters:a.externalParameters,intent:a.intent});
 if(!expected.ok)return expected;
 if(expected.serializedSketch!==a.candidateJSON||expected.changed!==a.changed||JSON.stringify(actual)!==JSON.stringify(expected.ellipse))throw fail('CANDIDATE_MISMATCH','Ellipse result differs from the original independent request.');
 return {revision,ok:true as const,verified:true};
 }catch(error){return failure(revision,error);}}
