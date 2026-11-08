import {HeadlessSketchWorkspace} from './workspace';
import {SketchGenerator} from '../generators/sketchGenerator';
import {MirrorGeneratorSchema} from '../generators/mirrorGenerator';
import {capturedParameterOwnership} from './capturedParameterOwnership';
import {mirrorFail as fail,mirrorData,captureMirrorIntent,captureMirrorReceipt} from './mirrorIntent.mjs';
import {assertMirrorRoot,assertMirrorAxis,mirrorSemanticMembers,mirrorSourceReason,mirrorReceipt,validateMirrorSourceGeometry} from './mirrorSourceValidation';
import {solveSketch} from './solve';
import {evaluateCapturedSketch} from './capturedSketchEvaluation';
import {assertVerifiedReplayGeometry} from './verifiedReplayGeometry';
import {sameRestoredSketch} from '../historyEquivalence.mjs';
import {failureCause,captureSketchFailure} from '../constr/admissionCause.mjs';
import type {CapturedAuxiliaryWitnessBatch} from './capturedParameterOwnership';
const MAX=1048576;
function bounded(v:any){if(typeof v!=='string'||v.length>MAX||new TextEncoder().encode(v).byteLength>MAX)fail('LIMIT','Mirror source exceeds the existing 1 MiB envelope.');return v;}
function capture(v:any,verify=false){const a:any=mirrorData(v,verify?['revision','sketchJSON','externalParameters','intent','candidateJSON','mirror']:['revision','sketchJSON','externalParameters','intent']);if(typeof a.revision!=='string'||!a.revision||a.revision.length>256)fail('INVALID_REQUEST','Invalid Mirror revision.');bounded(a.sketchJSON);const raw=a.externalParameters;if(!raw||typeof raw!=='object'||Array.isArray(raw)||Reflect.ownKeys(raw).length>1024)fail('INVALID_REQUEST','Invalid Mirror parameter bindings.');const external=Object.create(null);for(const key of Reflect.ownKeys(raw)){const d=Object.getOwnPropertyDescriptor(raw,key);if(typeof key!=='string'||!key||key.length>256||!d?.enumerable||!Object.hasOwn(d,'value')||typeof d.value!=='number'||!Number.isFinite(d.value)||Math.abs(d.value)>1e9)fail('INVALID_REQUEST','Invalid Mirror parameter binding.');external[key]=d.value;}if(verify){bounded(a.candidateJSON);captureMirrorReceipt(a.mirror);}return{...a,intent:captureMirrorIntent(a.intent),externalParameters:external};}
function failed(revision:string,e:any){const own=k=>{const d=e&&typeof e==='object'?Object.getOwnPropertyDescriptor(e,k):null;return d&&Object.hasOwn(d,'value')?d.value:undefined;},code=own('code'),message=own('message'),cause=failureCause(e);return{revision,ok:false as const,error:captureSketchFailure({code:typeof code==='string'?code.slice(0,64):'MIRROR_INVALID',message:(typeof message==='string'?message:'Mirror source transition failed.').slice(0,512),...(cause?{cause}:{})})};}
function proof(revision:string,source:any,external:any){let auxiliary:CapturedAuxiliaryWitnessBatch|undefined;const result=solveSketch({revision,sketch:structuredClone(source),boundary:structuredClone(source.boundary),externalParameters:external},undefined,b=>{auxiliary=b;});if(!result.ok)throw Object.assign(Error(result.error.message),result.error);assertVerifiedReplayGeometry(source,result.sketch,result.evidence,external);const captured=evaluateCapturedSketch(source,external,result.evidence,undefined,auxiliary);return{result,captured};}
export function createSketchMirror(input:any){let revision='';try{
 const a=capture(input);revision=a.revision;const source=JSON.parse(a.sketchJSON),external=a.externalParameters,intent=a.intent;const inventory=validateMirrorSourceGeometry(source,external);if(inventory?.generators.some(g=>!g.supported))fail('UNSUPPORTED_MIRROR_DOMAIN','An existing unsupported Mirror remains carry-only.');if(source.stages.reduce((n,s)=>n+s.generators.length,0)>=256)fail('MIRROR_RESOURCE_LIMIT','Mirror generator count exceeds its existing envelope.');proof(revision,source,external);
 const workspace=new HeadlessSketchWorkspace(external);
 const construction=workspace.io.evaluateCapturedSketch(structuredClone(source),()=>{
  const pm=workspace.parametricManager,index=workspace.createIndex(),ownership=capturedParameterOwnership(workspace),semantic=mirrorSemanticMembers(source),roots=new Set(source.objects.map(o=>index[o.id]));
  const select=id=>{const o=index[id];if(!roots.has(o)||!o)fail('INVALID_TARGET','Choose a current inspected native root.');const reason=mirrorSourceReason(o,semantic);if(reason)fail(reason,'This native root is outside the shared Mirror source domain.');assertMirrorRoot(o,index,o.stage,ownership);return o;};
  const axis=select(intent.reflectionLineId),objects=intent.sourceIds.map(select);assertMirrorAxis(axis);const stage=[axis,...objects].reduce((s,o)=>s.index<o.stage.index?o.stage:s,pm.stages[0]);
  const loaded=JSON.parse(workspace.io.serializeSketch(source.metadata,{strict:true}));loaded.boundary=structuredClone(source.boundary);if(!sameRestoredSketch(a.sketchJSON,JSON.stringify(loaded)))fail('CURRENT_GEOMETRY_MISMATCH','Native Mirror construction changed retained input before creation.');ownership.unchanged();
  const generator=new SketchGenerator({reflectionLine:[axis],objects},MirrorGeneratorSchema),at=stage.generators.size;
  // Same native stage/generator calls as addGenerator; no duplicate geometry.
  stage.addGenerator(generator);generator.generate(workspace,intent.generatedIds);
  const names=new Set<string>();for(const output of generator.generatedObjects)output.traverse(child=>{if(names.has(child.id)||index[child.id])fail('IDENTITY_COLLISION','New Mirror identity collides with the actual original graph.');names.add(child.id);});
  const candidate=JSON.parse(workspace.io.serializeSketch(source.metadata,{strict:true}));candidate.boundary=structuredClone(source.boundary);
  const restored=structuredClone(candidate);restored.objects=restored.objects.filter(o=>!intent.generatedIds.includes(o.id));const row=restored.stages[stage.index].generators.pop();if(!row||row.typeId!=='Mirror'||JSON.stringify(row.params)!==JSON.stringify({reflectionLine:[intent.reflectionLineId],objects:intent.sourceIds})||JSON.stringify(row.generatedObjects)!==JSON.stringify(intent.generatedIds)||!sameRestoredSketch(a.sketchJSON,JSON.stringify(restored)))fail('INTENT_CHANGED','Creating a Mirror changed unrelated source or dependency intent.');
  return{candidate,mirror:mirrorReceipt(stage.index,at,generator)};
 });
 validateMirrorSourceGeometry(construction.candidate,external);
 const first=proof(revision,construction.candidate,external),second=proof(revision,first.result.sketch,external);assertVerifiedReplayGeometry(construction.candidate,second.result.sketch,second.result.evidence,external);
 return{revision,ok:true as const,serializedSketch:bounded(JSON.stringify(construction.candidate)),evidence:first.captured.evidence,mirror:captureMirrorReceipt(construction.mirror)};
 }catch(e){return failed(revision,e);}}
export function verifySketchMirror(input:any){let revision='';try{const a=capture(input,true);revision=a.revision;const expected=createSketchMirror({revision,sketchJSON:a.sketchJSON,externalParameters:a.externalParameters,intent:a.intent});if(!expected.ok)return expected;if(expected.serializedSketch!==a.candidateJSON||JSON.stringify(expected.mirror)!==JSON.stringify(captureMirrorReceipt(a.mirror)))fail('CANDIDATE_MISMATCH','Mirror candidate differs from the complete independently reconstructed original request.');return{revision,ok:true as const,verified:true};}catch(e){return failed(revision,e);}}
