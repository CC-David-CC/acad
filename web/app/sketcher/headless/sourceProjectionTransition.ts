import {captureProjectionPreparation,captureProjectionPreparationReply,sameProjectionPreparation,captureProjectionInspection,captureProjectionInspectionReply} from './sourceProjectionEnvelope.mjs';
import {projectionFail as fail,projectionSourceText} from 'engine/source/sourceProjectionIntent.mjs';
import {HeadlessSketchWorkspace} from './workspace';
import {Segment} from '../shapes/segment';import {Circle} from '../shapes/circle';import {EndPoint} from '../shapes/point';
import {capturedParameterOwnership} from './capturedParameterOwnership';
import {solveSketch} from './solve';import {evaluateCapturedSketch} from './capturedSketchEvaluation';import {assertVerifiedReplayGeometry} from './verifiedReplayGeometry';
import {checkedSourceFrame,closeSourceFrame} from './sourceFrameMath';import {makeEmptySketch} from './emptySketch';
import {sameRestoredSketch} from '../historyEquivalence.mjs';import {failureCause,withAdmissionCause} from '../constr/admissionCause.mjs';
import {createSourceProjectionMath} from './sourceProjectionMath';
const xy=()=>({origin:[0,0,0],x:[1,0,0],y:[0,1,0],z:[0,0,1]});
async function sha(text:string){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return Array.from(new Uint8Array(bytes),n=>n.toString(16).padStart(2,'0')).join('');}
function word(value:number){const d=new DataView(new ArrayBuffer(8));d.setFloat64(0,value,false);return d.getUint32(0,false).toString(16).padStart(8,'0')+d.getUint32(4,false).toString(16).padStart(8,'0');}
function throwResult(result:any){throw withAdmissionCause(Object.assign(Error(result.error.message),{code:result.error.code}),result.error.cause);}
async function prepare(a:any){
 const sketch=JSON.parse(a.sourceJSON),frame=checkedSourceFrame(a.sourceFrame),saved=checkedSourceFrame(sketch?.metadata?.boundaryFrame);
 if(!closeSourceFrame(saved,frame))fail('PROJECTION_FRAME_MISMATCH','The original source cache differs from its actual source frame.');
 let auxiliary:any;const cold=solveSketch({revision:a.revision,sketch:structuredClone(sketch),boundary:structuredClone(sketch.boundary),externalParameters:a.externalParameters},undefined,b=>{auxiliary=b;});if(!cold.ok)throwResult(cold);
 assertVerifiedReplayGeometry(sketch,cold.sketch,cold.evidence,a.externalParameters);evaluateCapturedSketch(sketch,a.externalParameters,cold.evidence,undefined,auxiliary);
 const workspace=new HeadlessSketchWorkspace(a.externalParameters),math=createSourceProjectionMath(frame),boundary={lines:[],arcs:[],circles:[],nurbses:[]},roots:any[]=[];
 workspace.io.evaluateCapturedSketch(structuredClone(sketch),()=>{
  const index=workspace.createIndex(),ownership=capturedParameterOwnership(workspace),seen=new Set<any>();
  for(const binding of a.parameters.outputs){
   const matches=sketch.objects.filter((row:any)=>row.id===binding.sourceObjectId),root=index[binding.sourceObjectId];if(matches.length!==1||!root)fail('PROJECTION_REFERENCE_MISSING','The actual selected source root is missing or ambiguous.');const row=matches[0];
   if(root.parent||root.isGenerated)fail('PROJECTION_REFERENCE_GENERATED','Projection requires an actual nongenerated authored source root.');
   if(!(root instanceof Segment&&row.type==='Segment'||root instanceof Circle&&row.type==='Circle'))fail('PROJECTION_REFERENCE_TYPE','Only actual Segment and Circle source roots are admitted.');
   const stage=workspace.parametricManager.stages[row.stage];if(root.stage!==stage||!stage?.objects.has(root)||root.role!==row.role||index[root.id]!==root)fail('PROJECTION_SOURCE_UNAVAILABLE','The actual source root ownership changed.');
   const children=root instanceof Segment?[root.a,root.b]:[root.c];if(root.children.size!==children.length||children.some(p=>!(p instanceof EndPoint)||p.parent!==root||!root.children.has(p)||p.stage!==stage||index[p.id]!==p||p.isGenerated))fail('PROJECTION_SOURCE_UNAVAILABLE','The actual source descendant ownership changed.');
   for(const member of [root,...children]){if(seen.has(member))fail('PROJECTION_SOURCE_UNAVAILABLE','Projection source members alias.');seen.add(member);member.visitParams(p=>{if(!ownership.geometry.has(p)||!Number.isFinite(p.get()))fail('PROJECTION_SOURCE_UNAVAILABLE','Projection source Params have no current geometric ownership.');});}
   let projected:any;
   if(root instanceof Segment){if(!Object.is(root.a.x,row.data.a.x)||!Object.is(root.a.y,row.data.a.y)||!Object.is(root.b.x,row.data.b.x)||!Object.is(root.b.y,row.data.b.y))fail('PROJECTION_SOURCE_UNAVAILABLE','Original Segment endpoint bits changed.');projected=math.segment(row.data,binding.referenceId);boundary.lines.push(projected);}
   else{if(!Object.is(root.c.x,row.data.c.x)||!Object.is(root.c.y,row.data.c.y)||!Object.is(root.r.get(),row.data.r))fail('PROJECTION_SOURCE_UNAVAILABLE','Original Circle bits changed.');projected=math.circle(row.data,binding.referenceId);boundary.circles.push(projected);}
   roots.push({sourceObjectId:root.id,referenceId:binding.referenceId,kind:row.type,members:[root,...children].map(p=>p.id),geometry:root instanceof Segment?{a:projected.a,b:projected.b}:{c:projected.c,r:projected.r}});
  }
  ownership.unchanged();const restored=JSON.parse(workspace.io.serializeSketch(sketch.metadata,{strict:true}));restored.boundary=structuredClone(sketch.boundary);if(!sameRestoredSketch(JSON.stringify(sketch),JSON.stringify(restored)))fail('PROJECTION_SOURCE_UNAVAILABLE','Captured source reconstruction changed original intent.');
 });
 const parts=['source-projection-v1',a.sourceJSON,JSON.stringify(a.parameters)];for(const key of ['origin','x','y','z'])for(const v of frame[key])parts.push(word(v));for(const key of Object.keys(a.externalParameters).sort())parts.push(key,word(a.externalParameters[key]));
 const sourceSha256=await sha(a.sourceJSON),bindingSha256=await sha(parts.map(s=>new TextEncoder().encode(s).byteLength+':'+s).join(''));
 const target=makeEmptySketch('millimeter',xy());target.boundary=boundary;target.metadata={boundaryFrame:xy(),sourceProjection:{version:1,sourceSha256,bindingSha256}};const serializedSketch=projectionSourceText(JSON.stringify(target));
 // Validate the genuine boundary generator/strict IO in a fresh ordinary solve,
 // but never publish its optimizer serialization over this derived cache.
 const proof=solveSketch({revision:a.revision,sketch:structuredClone(target),boundary:structuredClone(target.boundary),externalParameters:{}});if(!proof.ok)throwResult(proof);assertVerifiedReplayGeometry(target,proof.sketch,proof.evidence,{});
 if(a.mode==='validate'&&a.existingTargetJSON!==serializedSketch)fail('PROJECTION_CACHE_MISMATCH','Read/Open cannot heal a stale or altered projected source cache.');
 return captureProjectionPreparationReply({revision:a.revision,ok:true,frame:xy(),serializedSketch,sourceSha256,bindingSha256,roots},a.revision);
}
function failure(revision:string,error:any){const cause=failureCause(error);return{revision,ok:false,error:{code:typeof error?.code==='string'?error.code.slice(0,64):'INVALID_PROJECTION',message:typeof error?.message==='string'?error.message.slice(0,512):'Projection preparation failed.',...(cause?{cause}:{})}};}
export async function prepareSourceProjection(value:any){let revision='';try{const a=captureProjectionPreparation(value);revision=a.revision;return await prepare(a);}catch(error){return failure(revision,error);}}
export async function verifySourceProjection(value:any){let revision='';try{const a=captureProjectionPreparation(value,true);revision=a.revision;const {expected,...original}=a,actual=await prepare(original);if(!sameProjectionPreparation(actual,expected))fail('PROJECTION_CACHE_MISMATCH','Independent original-request projection reconstruction differs.');return actual;}catch(error){return failure(revision,error);}}

// Read-only actual-root discovery. Unsupported kinds are explicit rows, never
// filtered or inferred from an ID spelling. No output identity is allocated.
export async function inspectSourceProjection(value:any){let revision='';try{
 const a=captureProjectionInspection(value);revision=a.revision;
 const sketch=JSON.parse(a.sourceJSON),frame=checkedSourceFrame(a.sourceFrame);if(!closeSourceFrame(checkedSourceFrame(sketch?.metadata?.boundaryFrame),frame))fail('PROJECTION_FRAME_MISMATCH','Actual source frame differs.');
 let auxiliary:any;const cold=solveSketch({revision,sketch:structuredClone(sketch),boundary:structuredClone(sketch.boundary),externalParameters:a.externalParameters},undefined,b=>{auxiliary=b;});if(!cold.ok)throwResult(cold);assertVerifiedReplayGeometry(sketch,cold.sketch,cold.evidence,a.externalParameters);evaluateCapturedSketch(sketch,a.externalParameters,cold.evidence,undefined,auxiliary);
 const workspace=new HeadlessSketchWorkspace(a.externalParameters),math=createSourceProjectionMath(frame),objects:any[]=[];if(sketch.objects.length>1024)fail('RESOURCE_LIMIT','Projection discovery supports the existing1024-root envelope.');
 workspace.io.evaluateCapturedSketch(structuredClone(sketch),()=>{const index=workspace.createIndex(),ownership=capturedParameterOwnership(workspace);for(const row of sketch.objects){const root=index[row.id];if(!root||root.id!==row.id||root.parent||root.stage!==workspace.parametricManager.stages[row.stage]||!root.stage.objects.has(root))fail('PROJECTION_SOURCE_UNAVAILABLE','Actual source root ownership differs.');let reason:any=null;
  if(root.isGenerated)reason={code:'PROJECTION_REFERENCE_GENERATED',message:'Edit the authored generator source instead.'};else if(!(root instanceof Segment&&row.type==='Segment'||root instanceof Circle&&row.type==='Circle'))reason={code:'PROJECTION_REFERENCE_TYPE',message:'Only actual nongenerated Segment and Circle roots are supported.'};
  else{root.visitParams(p=>{if(!ownership.geometry.has(p)||!Number.isFinite(p.get()))fail('PROJECTION_SOURCE_UNAVAILABLE','Source Params are not owned finite geometry.');});try{if(root instanceof Segment)math.segment(row.data,row.id);else math.circle(row.data,row.id);}catch(error){if(!['PROJECTION_COLLAPSED_SEGMENT','PROJECTION_CIRCLE_FRAME_UNQUALIFIED','PROJECTION_COORDINATE_UNQUALIFIED'].includes(error?.code))throw error;reason={code:error.code,message:error.message};}}
  objects.push({id:row.id,type:row.type,role:row.role,stage:row.stage,canProject:reason===null,reason});}ownership.unchanged();});
 return captureProjectionInspectionReply({revision,ok:true,sourceSha256:await sha(a.sourceJSON),objects},revision);
 }catch(error){return failure(revision,error);}}
