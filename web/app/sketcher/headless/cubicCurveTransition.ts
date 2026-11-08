import {sameRestoredSketch} from '../historyEquivalence.mjs';
import {HeadlessSketchWorkspace} from './workspace';
import {compute as nativeBezierPoint} from '../shapes/bezier-curve';
import {captureCurveControlIntent,captureCurveSampleIntent,curveRecord} from '../shapes/cubicCurveRecord.mjs';
import {cubicCurveOwnership,inspectNativeCubicRows} from './cubicCurveOwnership';
import {solveSketch} from './solve';
import {evaluateCapturedSketch} from './capturedSketchEvaluation';
import {assertVerifiedReplayGeometry} from './verifiedReplayGeometry';
import {captureSketchFailure,failureCause} from '../constr/admissionCause.mjs';
import type {CapturedAuxiliaryWitnessBatch} from './capturedParameterOwnership';
const MAX=1048576,fail=(code:string,message:string):never=>{throw Object.assign(Error(message),{code});};
function capture(request:any,mode:'edit'|'verify'|'read'):any{
 const a:any=curveRecord(request,mode==='verify'?['revision','sketchJSON','externalParameters','intent','candidateJSON','curve','changed']:['revision','sketchJSON','externalParameters','intent']);
 if(typeof a.revision!=='string'||!a.revision||a.revision.length>256||typeof a.sketchJSON!=='string'||a.sketchJSON.length>MAX||new TextEncoder().encode(a.sketchJSON).byteLength>MAX)fail('INVALID','Invalid curve source/revision.');
 const raw=a.externalParameters;if(!raw||typeof raw!=='object'||Array.isArray(raw)||Reflect.ownKeys(raw).length>1024)fail('INVALID','Invalid curve parameter bindings.');const external=Object.create(null);for(const key of Reflect.ownKeys(raw)){const d=Object.getOwnPropertyDescriptor(raw,key);if(typeof key!=='string'||!key||key.length>256||!d?.enumerable||!Object.hasOwn(d,'value')||typeof d.value!=='number'||!Number.isFinite(d.value)||Math.abs(d.value)>1e9)fail('INVALID','Invalid external parameter.');external[key]=d.value;}
 if(mode==='verify'&&(typeof a.candidateJSON!=='string'||a.candidateJSON.length>MAX||new TextEncoder().encode(a.candidateJSON).byteLength>MAX||typeof a.changed!=='boolean'))fail('INVALID_CANDIDATE','Invalid curve candidate.');
 return{...a,externalParameters:external,intent:mode==='read'?captureCurveSampleIntent(a.intent):captureCurveControlIntent(a.intent)};
}
function failed(revision:string,error:any){const own=(key:string)=>{const d=error&&typeof error==='object'?Object.getOwnPropertyDescriptor(error,key):null;return d&&Object.hasOwn(d,'value')?d.value:undefined;},code=own('code'),message=own('message'),cause=failureCause(error);return{revision,ok:false as const,error:captureSketchFailure({code:typeof code==='string'&&code?code.slice(0,64):'CURVE_INVALID',message:(typeof message==='string'?message:'Curve transition failed.').slice(0,512),...(cause?{cause}:{})})};}
function assertLoadedSource(workspace:any,source:any){const actual=JSON.parse(workspace.io.serializeSketch(source.metadata,{strict:true}));actual.boundary=structuredClone(source.boundary);if(!sameRestoredSketch(JSON.stringify(source),JSON.stringify(actual)))fail('CURRENT_GEOMETRY_MISMATCH','Native loading changed the captured curve source or unrelated intent.');}
function prove(revision:string,sketch:any,external:any){let auxiliary:CapturedAuxiliaryWitnessBatch|undefined;const cold=solveSketch({revision,sketch:structuredClone(sketch),boundary:structuredClone(sketch.boundary),externalParameters:external},undefined,b=>{auxiliary=b;});if(!cold.ok)return{cold};assertVerifiedReplayGeometry(sketch,cold.sketch,cold.evidence,external);return{cold,actual:evaluateCapturedSketch(sketch,external,cold.evidence,undefined,auxiliary)};}
export function inspectCubicSourceRows(original:any,replayed:any,external:any){if(!replayed.objects.some(o=>['BezierCurve','BSpline'].includes(o.type)))return[];const w=new HeadlessSketchWorkspace(external);w.io._loadSketch(structuredClone(replayed),{strict:true});assertLoadedSource(w,replayed);const before=new Map<string,any>(original.objects.map(o=>[o.id,o] as [string,any]));for(const row of replayed.objects)if(['BezierCurve','BSpline'].includes(row.type)&&before.get(row.id)?.type!==row.type)fail('INTENT_CHANGED','Curve source type/identity changed.');return inspectNativeCubicRows(w,replayed);}
export function editCubicControlPoints(request:any){let revision='';try{
 const a=capture(request,'edit');revision=a.revision;const before=JSON.parse(a.sketchJSON),original=prove(revision,before,a.externalParameters);if(!original.cold.ok)return original.cold;
 const w=new HeadlessSketchWorkspace(a.externalParameters);w.io._loadSketch(structuredClone(before),{strict:true});assertLoadedSource(w,before);const bound=cubicCurveOwnership(w,a.intent.id),{root,controls}=bound,points=a.intent.points;
 if(points.length!==controls.length||points.some((p,i)=>p.pointId!==controls[i].id))fail('INVALID_TARGET','Use the complete actual ordered control-point IDs.');
 const changed=points.some((p,i)=>p.x!==controls[i].x||p.y!==controls[i].y);if(!changed)return{revision,ok:true as const,changed:false,serializedSketch:a.sketchJSON,evidence:original.actual.evidence,curve:a.intent};
 const candidate=structuredClone(before),row=candidate.objects.find(o=>o.id===a.intent.id);if(!row||row.type!==root.TYPE||row.stage!==root.stage.index||row.role!==root.role)fail('INTENT_CHANGED','Curve source binding changed.');
 if(root.TYPE==='BezierCurve')row.data=Object.fromEntries(['cp1','cp2','cp3','cp4'].map((key,i)=>[key,{x:points[i].x,y:points[i].y}]));
 else{
  const controlIds=controls.map(p=>p.id),fitIds=root.fPoints.map(p=>p.id);
  for(let i=0;i<controls.length;i++){controls[i].params.x.set(points[i].x);controls[i].params.y.set(points[i].y);}root.cvUpdate('Clamped',0);
  if(root.cPoints.length!==controlIds.length||root.cPoints.some((p,i)=>p!==controls[i]||p.id!==controlIds[i])||root.fPoints.length!==fitIds.length||root.fPoints.some((p,i)=>p.id!==fitIds[i]))fail('IDENTITY_MISMATCH','Native spline rebuild changed authored/derived point identity.');
  row.data=root.write();
 }
 const first=prove(revision,candidate,a.externalParameters);if(!first.cold.ok)return first.cold;const second=prove(revision,first.cold.sketch,a.externalParameters);if(!second.cold.ok)return second.cold;assertVerifiedReplayGeometry(candidate,second.cold.sketch,second.cold.evidence,a.externalParameters);
 const serializedSketch=JSON.stringify(candidate);if(serializedSketch.length>MAX||new TextEncoder().encode(serializedSketch).byteLength>MAX)fail('LIMIT','Curve candidate exceeds the existing source envelope.');return{revision,ok:true as const,changed:true,serializedSketch,evidence:first.actual.evidence,curve:a.intent};
 }catch(error){return failed(revision,error);}}
export function verifyCubicControlPoints(request:any){let revision='';try{const a=capture(request,'verify');revision=a.revision;const receipt=captureCurveControlIntent(a.curve),expected=editCubicControlPoints({revision,sketchJSON:a.sketchJSON,externalParameters:a.externalParameters,intent:a.intent});if(!expected.ok)return expected;if(expected.serializedSketch!==a.candidateJSON||expected.changed!==a.changed||JSON.stringify(expected.curve)!==JSON.stringify(receipt))fail('CANDIDATE_MISMATCH','Curve candidate differs from the original independent request.');return{revision,ok:true as const,verified:true};}catch(error){return failed(revision,error);}}
export function readCubicCurvePoints(request:any){let revision='';try{
 const a=capture(request,'read');revision=a.revision;const source=JSON.parse(a.sketchJSON),verified=prove(revision,source,a.externalParameters);if(!verified.cold.ok)return verified.cold;
 const w=new HeadlessSketchWorkspace(a.externalParameters);w.io._loadSketch(structuredClone(verified.cold.sketch),{strict:true});assertLoadedSource(w,verified.cold.sketch);const bound=cubicCurveOwnership(w,a.intent.id),root=bound.root,before=JSON.stringify(root.write());
 const samples=a.intent.parameters.map(parameter=>{
  const point=root.TYPE==='BezierCurve'?nativeBezierPoint(parameter,root.a,root.b,root.cp1,root.cp2):root.getPoint(parameter);
  if(!point||![point.x,point.y].every(Number.isFinite)||root.TYPE==='BezierCurve'&&point.z!==0)fail('NONFINITE_RESULT','Actual native planar curve evaluation is nonfinite or not planar.');
  return{parameter,x:point.x,y:point.y};
 });
 bound.ownership.unchanged();if(JSON.stringify(root.write())!==before)fail('CURRENT_GEOMETRY_MISMATCH','Native observation changed curve source.');
 return{revision,ok:true as const,curve:{id:root.id,type:root.TYPE},samples};
 }catch(error){return failed(revision,error);}}
