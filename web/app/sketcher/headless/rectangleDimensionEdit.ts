import {HeadlessSketchWorkspace} from './workspace';
import {validExternalParameterName} from 'gems/safeExpression.mjs';
import {Segment} from '../shapes/segment';
import {AlgNumConstraint,ConstraintDefinitions} from '../constr/ANConstraints';
import {validateProjectSketch} from '../io';
import {capturedParameterOwnership} from './capturedParameterOwnership';
import {captureRectangleDimensionBindings,reconstructTypedRectangle} from './typedRectangleReconstruction';
import {solveSketch} from './solve';
import {evaluateCapturedSketch} from './capturedSketchEvaluation';
import {assertVerifiedReplayGeometry} from './verifiedReplayGeometry';
import {inspectTree} from './sketchValidation';
import {captureSketchFailure,failureCause,withAdmissionCause} from '../constr/admissionCause.mjs';

// Preserve the existing rectangle command's CHARACTER limit, not a new UTF-8
// byte limit. Hashing consumes actual serialized UTF-8 bytes only in Worker.
const MAX=65536;
const fail=(code:string,message:string):never=>{throw Object.assign(Error(message),{code});};
function record(value:any,keys:string[]){
 if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value))||Reflect.ownKeys(value).length!==keys.length)fail('RECTANGLE_EDIT_INVALID','Expected exact rectangle-edit fields.');
 const out:any={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('RECTANGLE_EDIT_INVALID','Rectangle-edit fields must be own data.');out[key]=d.value;}return out;
}
function text(value:any){if(typeof value!=='string'||value.length>MAX)fail('LIMIT','Rectangle source exceeds65536 characters.');return value;}
function dimensions(value:any){
 const e=record(value,['width','height','widthRow','heightRow']);
 if(![e.width,e.height].every(n=>typeof n==='number'&&Number.isFinite(n)&&n>=0.001&&n<=1e6))fail('RECTANGLE_EDIT_INVALID','Requested rectangle lengths are outside the existing domain.');
 for(const key of['widthRow','heightRow']){const row=record(e[key],['stage','index']);if(row.stage!==0||!Number.isSafeInteger(row.index)||row.index<0||row.index>=10000)fail('RECTANGLE_EDIT_BINDING','Invalid private authored dimension row.');e[key]=row;}
 if(e.widthRow.index===e.heightRow.index)fail('RECTANGLE_EDIT_BINDING','Width and height need distinct actual driving equations.');return e;
}
function numericLength(value:any){
 // Mirror existing authoredRectangle literal admission, including its lexical
 // semantics. Named parameters/formulas must never be replaced with numbers.
 if(typeof value!=='string'||!value.trim()||!Number.isFinite(Number(value))||Number(value)<0.001||Number(value)>1e6)fail('RECTANGLE_EDIT_BINDING','The existing rectangle dimension must be an admitted numeric literal.');
 return Number(value);
}
function externalValues(value:any){
 if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value)))fail('RECTANGLE_EDIT_INVALID','External values must be an own numeric record.');
 const keys=Reflect.ownKeys(value),out=Object.create(null);if(keys.length>1024)fail('LIMIT','Too many rectangle external values.');
 for(const key of keys){const d=typeof key==='string'?Object.getOwnPropertyDescriptor(value,key):null;if(typeof key!=='string'||!validExternalParameterName(key)||!d?.enumerable||!Object.hasOwn(d,'value')||typeof d.value!=='number'||!Number.isFinite(d.value)||Math.abs(d.value)>1e9)fail('RECTANGLE_EDIT_INVALID','Invalid external value.');out[key]=d.value;}return out;
}
function sameRow(a:any,b:any){return a.stage===b.stage&&a.index===b.index;}
function ownedRows(original:any,edit:any,external:any){
 const workspace=new HeadlessSketchWorkspace(external);
 return workspace.io.evaluateCapturedSketch(structuredClone(original),()=>{
  const pm=workspace.parametricManager,stage=pm.stages[0],index=workspace.createIndex(),ownership=capturedParameterOwnership(workspace);
  if(pm.stages.length!==1||original.stages[0].generators.length||original.objects.some(o=>o.stage!==0||o.role!==null||!['Point','Segment'].includes(o.type)))fail('RECTANGLE_EDIT_UNSUPPORTED','The existing rectangle edit source domain is unsupported.');
  const roots:any[]=original.objects.filter(o=>o.type==='Segment').map(o=>index[o.id]);
  if(roots.length!==4||roots.some(s=>!(s instanceof Segment)||s.parent||s.stage!==stage||!stage.objects.has(s)||s.isGenerated||s.generators.size||s.generator||index[s.id]!==s||index[s.a.id]!==s.a||index[s.b.id]!==s.b||s.a.parent!==s||s.b.parent!==s))fail('RECTANGLE_EDIT_BINDING','Rectangle segments are not independently owned actual source objects.');
  const members=new Set<any>();for(const s of roots){members.add(s);members.add(s.a);members.add(s.b);}
  for(const c of stage.solverSystem.allConstraints)if(!c.internal&&c.objects.some(o=>members.has(o))&&!c.objects.every(o=>members.has(o)))fail('RECTANGLE_EDIT_UNSUPPORTED','Rectangle dimensions cannot drive constraints coupled to unrelated objects.');
  const result:any={};
  for(const key of['widthRow','heightRow']){
   const ref=edit[key],saved=original.stages[ref.stage]?.constraints?.[ref.index];
   if(!saved||saved.typeId!=='SegmentLength'||!Array.isArray(saved.objects)||saved.objects.length!==1||!saved.constants||Object.keys(saved.constants).length!==1||!Object.hasOwn(saved.constants,'length'))fail('RECTANGLE_EDIT_BINDING','The source locator is not an actual single driving length row.');
   numericLength(saved.constants.length);
   const target=index[saved.objects[0]],matches=stage.solverSystem.allConstraints.filter(c=>!c.internal&&c.schema===ConstraintDefinitions.SegmentLength&&c.objects.length===1&&c.objects[0]===target&&Object.is(c.constants.length,saved.constants.length));
   if(!roots.includes(target)||matches.length!==1)fail('RECTANGLE_EDIT_BINDING','The source driving row has no unique actual registered constraint.');
   const c=matches[0];if(!(c instanceof AlgNumConstraint)||c.stage!==stage||index[c.objects[0].id]!==target)fail('RECTANGLE_EDIT_BINDING','The driving row belongs to a different source.');
   ownership.constraint(c,stage);c.resolveConstants(pm.constantResolver);
   if(c.resolvedConstants.length!==Number(saved.constants.length))fail('RECTANGLE_EDIT_BINDING','The actual driving constant differs from its literal source.');
   result[key]=Object.freeze({stage:ref.stage,index:ref.index});
  }
  ownership.unchanged();return Object.freeze({widthRow:result.widthRow,heightRow:result.heightRow,objectIds:Object.freeze(roots.map(s=>s.id))});
 });
}
function expectedDraft(original:any,edit:any){
 const expected=structuredClone(original);expected.stages[edit.widthRow.stage].constraints[edit.widthRow.index].constants.length=String(edit.width);expected.stages[edit.heightRow.stage].constraints[edit.heightRow.index].constants.length=String(edit.height);return expected;
}
function targetMeaning(value:any,edit:any,ids:ReadonlyArray<string>){
 const normalized=structuredClone(value);
 for(const id of ids){const matches=normalized.objects.filter(o=>o.id===id&&o.type==='Segment');if(matches.length!==1)fail('RECTANGLE_EDIT_BINDING','Journal rectangle membership changed.');const s=matches[0];for(const end of['a','b'])for(const axis of['x','y']){if(typeof s.data?.[end]?.[axis]!=='number'||!Number.isFinite(s.data[end][axis]))fail('RECTANGLE_EDIT_INVALID','Historical rectangle coordinates must be finite.');s.data[end][axis]=0;}}
 for(const key of['widthRow','heightRow']){const ref=edit[key],row=normalized.stages[ref.stage]?.constraints?.[ref.index];if(!row||row.typeId!=='SegmentLength'||!row.constants||Object.keys(row.constants).length!==1)fail('RECTANGLE_EDIT_BINDING','Historical driving row changed.');numericLength(row.constants.length);row.constants.length='0';}
 return JSON.stringify(normalized);
}
function requireResult(result:any){if(!result?.ok){const e=captureSketchFailure(result.error);throw withAdmissionCause(Object.assign(Error(e.message),{code:e.code}),e.cause);}return result;}
function currentProof(revision:string,sketch:any,boundary:any,external:any,canonical:any){
 const input={revision,sketch,boundary,externalParameters:external};
 if(canonical){const result=reconstructTypedRectangle(input);if(result===null)fail('RECTANGLE_EDIT_BINDING','A captured canonical rectangle lost its declaration.');return requireResult(result);}
 let auxiliary:any;const solved=requireResult(solveSketch({revision,sketch:structuredClone(sketch),boundary:structuredClone(boundary),externalParameters:structuredClone(external)},undefined,batch=>{auxiliary=batch;}));
 assertVerifiedReplayGeometry(sketch,solved.sketch,solved.evidence,external);
 const captured=evaluateCapturedSketch(sketch,external,solved.evidence,undefined,auxiliary);
 return{...solved,sketch,evidence:captured.evidence};
}
function failure(revision:string,phase:string,error:any){
 const data=(key:string)=>{const d=error&&typeof error==='object'?Object.getOwnPropertyDescriptor(error,key):null;return d&&Object.hasOwn(d,'value')?d.value:undefined;};
 const code=data('code'),message=error instanceof SyntaxError?'Rectangle source JSON is invalid.':data('message'),cause=failureCause(error);
 return{revision,ok:false as const,error:captureSketchFailure({code:typeof code==='string'&&code.length?code.slice(0,64):'RECTANGLE_EDIT_INVALID',message:(phase+': '+(typeof message==='string'?message:'Rectangle dimension edit could not be prepared.')).slice(0,512),...(cause?{cause}:{})})};
}

// Worker-only preparation. Private row locators bind actual source equations;
// they are never publication authority. Existing captured command owns writes.
export async function prepareRectangleDimensionEdit(request:any){
 let revision='',phase='capture';try{
  const input=record(request,['revision','originalSketchJSON','draftSketchJSON','travelTargetSketchJSON','boundary','externalParameters','edit']);
  if(typeof input.revision!=='string'||!input.revision||input.revision.length>256)fail('RECTANGLE_EDIT_INVALID','Invalid rectangle edit revision.');revision=input.revision;
  text(input.originalSketchJSON);text(input.draftSketchJSON);if(input.travelTargetSketchJSON!==null)text(input.travelTargetSketchJSON);
  inspectTree(input);const edit=dimensions(input.edit),original=JSON.parse(input.originalSketchJSON),draft=JSON.parse(input.draftSketchJSON),external=externalValues(input.externalParameters);
  validateProjectSketch(original);validateProjectSketch(draft);
  if(!Array.isArray(original.stages)||original.stages.length!==1||!original.boundary||!['lines','arcs','circles','nurbses'].every(k=>Array.isArray(original.boundary[k])&&original.boundary[k].length===0)||JSON.stringify(original.boundary)!==JSON.stringify(input.boundary))fail('RECTANGLE_EDIT_UNSUPPORTED','Rectangle edit requires the captured independent empty boundary.');
  phase='owned-source-bindings';const owned=ownedRows(original,edit,external);
  if(JSON.stringify(expectedDraft(original,edit))!==JSON.stringify(draft))fail('RECTANGLE_EDIT_INTENT_CHANGED','The edit draft changes more than its two requested literal dimensions.');
  const originalRequest={revision,sketch:original,boundary:input.boundary,externalParameters:external},canonical=captureRectangleDimensionBindings(originalRequest);
  if(canonical&&(!sameRow(canonical.widthRow,owned.widthRow)||!sameRow(canonical.heightRow,owned.heightRow)))fail('RECTANGLE_EDIT_BINDING','Requested driving rows differ from the real rectangle declaration.');
  phase='original-current-proof';currentProof(revision,original,input.boundary,external,canonical);
  phase='edited-candidate-proof';const candidateRequest={revision,sketch:draft,boundary:input.boundary,externalParameters:external};
  let solved:any;
  if(canonical){const result=reconstructTypedRectangle(candidateRequest,{update:true});if(result===null)fail('RECTANGLE_EDIT_BINDING','Edited source lost its captured canonical rectangle declaration.');solved=requireResult(result);}
  else solved=requireResult(solveSketch({revision,sketch:structuredClone(draft),boundary:structuredClone(input.boundary),externalParameters:structuredClone(external)}));
  let sketch=solved.sketch,evidence=solved.evidence,serializedSketch:string;
  if(input.travelTargetSketchJSON!==null){
   phase='historical-target-proof';const target=JSON.parse(input.travelTargetSketchJSON);validateProjectSketch(target);
   if(targetMeaning(original,edit,owned.objectIds)!==targetMeaning(target,edit,owned.objectIds))fail('RECTANGLE_EDIT_INTENT_CHANGED','Journal target changes other authored source or unrelated geometry.');
   if(numericLength(target.stages[edit.widthRow.stage].constraints[edit.widthRow.index].constants.length)!==edit.width||numericLength(target.stages[edit.heightRow.stage].constraints[edit.heightRow.index].constants.length)!==edit.height)fail('RECTANGLE_EDIT_BINDING','Historical dimensions differ from the actual requested travel.');
   const binding=captureRectangleDimensionBindings({revision,sketch:target,boundary:input.boundary,externalParameters:external});
   if(binding&&(!sameRow(binding.widthRow,owned.widthRow)||!sameRow(binding.heightRow,owned.heightRow)))fail('RECTANGLE_EDIT_BINDING','Historical driving identity differs from the captured source.');
   const proof=currentProof(revision,target,input.boundary,external,binding);sketch=target;evidence=proof.evidence;serializedSketch=input.travelTargetSketchJSON;
  }else serializedSketch=JSON.stringify(sketch);
  phase='serialize';text(serializedSketch);const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(serializedSketch)),sketchDigest=Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('');
  return{revision,ok:true as const,sketch,evidence,serializedSketch,sketchDigest};
 }catch(error){return failure(revision,phase,error);}
}
