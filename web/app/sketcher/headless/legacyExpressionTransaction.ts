import {evaluateLegacyNumericSource} from 'cad/parameters/legacyNumericExpressions.mjs';
import {sameRestoredSketch} from '../historyEquivalence.mjs';
import {replaySketchTransition} from './sketchTransition';
import {solveSketch} from './solve';
import {assertAllowedSolverGeometry} from './transitionGeometryPolicy.mjs';
import {sameSketchSaveFrame} from 'cad/craft/unconsumedSketchSave.mjs';
import {isBooleanSketchField,isBooleanSketchLiteral} from '../constr/booleanSketchFields.mjs';

const fail=(code:string,message:string)=>Object.assign(Error(message),{code});
const numeric=/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;
function frameOf(sketch:any){const frame=sketch?.metadata?.boundaryFrame;if(!sameSketchSaveFrame(frame,frame))throw fail('FRAME_MISMATCH','A saved sketch frame is required.');return frame;}
function inspectConstants(sketch:any){
 // The current nonvisual model resolves named local/global constants. Direct
 // field formulas have no corresponding headless resolver yet; refuse them
 // explicitly rather than substitute numbers into authored constraint strings.
 const id=/^[A-Za-z_$][A-Za-z0-9_$]{0,127}$/;
 for(const stage of sketch.stages||[])for(const constraint of stage.constraints||[])for(const [field,value] of Object.entries(constraint.constants||{})){
  if(isBooleanSketchField(constraint.typeId,field)){if(!isBooleanSketchLiteral(value))throw fail('UNSUPPORTED','Invalid legacy boolean field.');continue;}
  if(typeof value==='number'&&Number.isFinite(value))continue;
  if(typeof value==='string'&&(numeric.test(value.trim())||id.test(value.trim())))continue;
  throw fail('UNSUPPORTED','Direct legacy sketch-field formulas are not supported; use a named numeric definition.');
 }
}
// Real IO, constraints and solver only. Run in the existing disposable Worker;
// returned source remains private until the craft owner publishes one batch.
export function legacyExpressionTransaction(request:any){let revision='';try{
 if(request&&typeof request.revision==='string')revision=request.revision;
 if(!request||Reflect.ownKeys(request).sort().join(',')!=='frame,priorSource,priorValues,revision,sketchJSON,source,targetSketchJSON'||!revision||revision.length>256)throw fail('INVALID','Invalid legacy expression transaction.');
 const prior=evaluateLegacyNumericSource(request.priorSource),next=evaluateLegacyNumericSource(request.source),old=request.priorValues;
 if(!old||typeof old!=='object'||Array.isArray(old)||Reflect.ownKeys(old).length!==prior.varList.length||prior.varList.some(row=>!Object.prototype.hasOwnProperty.call(old,row.name)||!Object.is(old[row.name],row.value)))throw fail('CURRENT_EXPRESSIONS_MISMATCH','The accepted legacy source and table differ.');
 const result={version:1,kind:'legacy-numeric-v1',values:next.varList};
 if(request.sketchJSON===null){if(request.frame!==null||request.targetSketchJSON!==null)throw fail('INVALID','Invalid source-only expression transaction.');return {revision,ok:true,result,serializedSketch:null,boundaryFrame:null};}
 const bounded=(value:any)=>typeof value==='string'&&value.length<=1048576&&new TextEncoder().encode(value).byteLength<=1048576;
 if(!bounded(request.sketchJSON)||request.targetSketchJSON!==null&&!bounded(request.targetSketchJSON))throw fail('LIMIT','Legacy sketch source exceeds the supported 1 MiB limit.');
 const original=JSON.parse(request.sketchJSON),frame=frameOf(original);if(request.frame!==null&&!sameSketchSaveFrame(frame,request.frame))throw fail('FRAME_MISMATCH','The legacy sketch frame changed.');
 if(!original.boundary||['lines','arcs','circles','nurbses'].some(k=>!Array.isArray(original.boundary[k])||original.boundary[k].length))throw fail('UNSUPPORTED','Legacy expression edits currently require independent empty-boundary source planes.');
 inspectConstants(original);
 const verified=replaySketchTransition({revision,sketchJSON:request.sketchJSON,externalParameters:prior.variables});if(!verified.ok)return verified;
 const candidate=JSON.parse(request.targetSketchJSON===null?request.sketchJSON:request.targetSketchJSON);if(!sameSketchSaveFrame(frameOf(candidate),frame))throw fail('FRAME_MISMATCH','The authored travel frame changed.');inspectConstants(candidate);
 const solved=solveSketch({revision,sketch:candidate,boundary:structuredClone(candidate.boundary),externalParameters:next.variables});if(!solved.ok)return solved;
 const restored=structuredClone(solved.sketch);for(let i=0;i<original.objects.length;i++){const before=original.objects[i],after=restored.objects[i];if(!after||after.type!==before.type)throw fail('INTENT_CHANGED','Legacy sketch identity changed.');assertAllowedSolverGeometry(before.type,before.data,after.data);after.data=before.data;}
 if(!sameRestoredSketch(request.sketchJSON,JSON.stringify(restored)))throw fail('INTENT_CHANGED','Legacy expression edits changed authored sketch intent.');
 let serializedSketch=JSON.stringify(solved.sketch);
 if(request.targetSketchJSON!==null){if(!sameRestoredSketch(request.targetSketchJSON,serializedSketch))throw fail('CURRENT_GEOMETRY_MISMATCH','Authored legacy travel no longer solves exactly.');serializedSketch=request.targetSketchJSON;}
 if(!bounded(serializedSketch))throw fail('LIMIT','Solved legacy sketch exceeds the supported limit.');
 return {revision,ok:true,result,serializedSketch,boundaryFrame:frame};
 }catch(error){return {revision,ok:false,error:{code:typeof error?.code==='string'?error.code:'LEGACY_EXPRESSION_INVALID',message:error?.message||'Legacy expressions could not be regenerated.'}};}}
