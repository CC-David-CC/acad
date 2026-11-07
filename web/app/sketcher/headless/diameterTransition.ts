import {HeadlessSketchWorkspace} from './workspace';
import {replaySketchTransition} from './sketchTransition';
import {solveSketch} from './solve';
import {prepareDiameter} from '../actions/diameterAdmission';
import {Circle} from '../shapes/circle';
import {Arc} from '../shapes/arc';
import {isInstanceOf} from '../actions/matchUtils';
import {assertAllowedSolverGeometry} from './transitionGeometryPolicy.mjs';
import {sameRestoredSketch} from '../historyEquivalence.mjs';
const fail=(code:string,message:string)=>Object.assign(new Error(message),{code});
function record(value:any,keys:string[]){if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value))||Reflect.ownKeys(value).length!==keys.length)throw fail('INVALID','Invalid diameter request.');const out:any={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))throw fail('INVALID','Diameter fields must be data.');out[key]=d.value;}return out;}
function external(value:any){if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value)))throw fail('INVALID','External parameters must be plain data.');const keys=Reflect.ownKeys(value),out=Object.create(null);if(keys.length>1024)throw fail('LIMIT','Too many external parameters.');for(const key of keys){if(typeof key!=='string'||!key||key.length>256)throw fail('INVALID','Invalid external parameter.');const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value')||typeof d.value!=='number'||!Number.isFinite(d.value)||Math.abs(d.value)>1e9)throw fail('INVALID','Invalid external parameter.');out[key]=d.value;}return out;}
function verifyIntent(before:any,after:any,id:string,diameter:number,stage:number,status:string){
 if(before.objects.length!==after.objects.length||before.stages.length!==after.stages.length)throw fail('INTENT_CHANGED','Sketch structure changed.');
 after.objects.forEach((object,i)=>{if(object.type!==before.objects[i]?.type)throw fail('INTENT_CHANGED','Sketch object type changed.');assertAllowedSolverGeometry(object.type,before.objects[i].data,object.data);});
 const restored={...after,objects:after.objects.map((o,i)=>({...o,data:before.objects[i].data})),stages:after.stages.map(s=>({...s,constraints:[...s.constraints]}))},prior=before.stages[stage]?.constraints,next=restored.stages[stage]?.constraints;
 if(!Array.isArray(prior)||!Array.isArray(next)||next.length!==prior.length+1)throw fail('INTENT_CHANGED','Exactly one diameter constraint is required.');
 let index=0;while(index<prior.length&&JSON.stringify(prior[index])===JSON.stringify(next[index]))index++;
 const added=next[index];if(added?.typeId!=='DiameterLength'||added.stage!==stage||added.objects?.length!==1||added.objects[0]!==id||added.constants?.diameter!==diameter||Reflect.ownKeys(added.constants).length!==1||added.admission?.version!==1||added.admission.state!==status)throw fail('INTENT_CHANGED','Diameter identity, value or admission changed.');
 next.splice(index,1);if(!sameRestoredSketch(JSON.stringify(before),JSON.stringify(restored)))throw fail('INTENT_CHANGED','Existing authored sketch intent changed.');
}
// Disposable Worker only. This computes a candidate; it never publishes it.
export function addDiameterTransition(request:any){let revision='';try{
 const d=request&&typeof request==='object'?Object.getOwnPropertyDescriptor(request,'revision'):null;if(d?.enumerable&&Object.prototype.hasOwnProperty.call(d,'value')&&typeof d.value==='string'&&d.value.length<=256)revision=d.value;
 const args=record(request,['revision','sketchJSON','externalParameters','intent']);if(typeof args.revision!=='string'||!args.revision||args.revision.length>256)throw fail('INVALID','Invalid diameter revision.');revision=args.revision;
 const input=record(args.intent,['id','diameter']),id=input.id,diameter=input.diameter;if(typeof id!=='string'||!id||id.length>256||typeof diameter!=='number'||!Number.isFinite(diameter)||diameter<=0||diameter>1e6)throw fail('INVALID','A current circle or arc and positive bounded diameter are required.');
 const bindings=external(args.externalParameters),captured=replaySketchTransition({revision,sketchJSON:args.sketchJSON,externalParameters:bindings});if(!captured.ok||!('serializedSketch' in captured))return captured;
 const before=JSON.parse(captured.serializedSketch),workspace=new HeadlessSketchWorkspace(bindings);workspace.io._loadSketch(before,{strict:true});
 const pm=workspace.parametricManager,index=workspace.createIndex(),circular=Object.values(index).filter(o=>isInstanceOf(o,Circle)||isInstanceOf(o,Arc));
 if(circular.length>1024)throw fail('LIMIT','Too many sketch objects for this command.');if(circular.some((o:any)=>typeof o.id!=='string'||!o.id||o.id.length>256)||new Set(circular.map((o:any)=>o.id)).size!==circular.length)throw fail('INVALID_TARGET','Circular object IDs are invalid or ambiguous.');
 const object:any=index[id];if(!circular.includes(object))throw fail('INVALID_TARGET','Choose one current circle or arc.');
 const {constraint,validate}=prepareDiameter(pm,object,diameter);pm.startTransaction();try{pm._add(constraint);pm.finishTransaction(validate,false);}catch(error){if(pm.inTransaction)try{pm.finishTransaction(()=>{throw error},false)}catch(_){}throw error;}
 const stage=constraint.stage.index,status=(constraint.stage as any).algNumSystem.redundant.has(constraint)?'redundant':'accepted',candidate=JSON.parse(workspace.io.serializeSketch(before.metadata,{strict:true}));candidate.boundary=before.boundary;
 verifyIntent(before,candidate,id,diameter,stage,status);const solved=solveSketch({revision,sketch:candidate,boundary:structuredClone(candidate.boundary),externalParameters:bindings});if(!solved.ok)return solved;
 const serializedSketch=JSON.stringify(solved.sketch);if(serializedSketch.length>1048576||new TextEncoder().encode(serializedSketch).byteLength>1048576)throw fail('LIMIT','The resulting sketch exceeds its limit.');
 if(!sameRestoredSketch(JSON.stringify(candidate),serializedSketch))throw fail('CURRENT_GEOMETRY_MISMATCH','Diameter verification changed the solved geometry.');
 const authored=solved.sketch.stages.flatMap(s=>s.constraints);if(authored.length!==solved.evidence.length||authored.some((c,i)=>c.typeId!==solved.evidence[i].typeId||c.admission?.version!==1||c.admission.state!==solved.evidence[i].state))throw fail('ADMISSION_CHANGED','Candidate admission changed during verification.');
 const target=solved.sketch.objects.find(o=>o.id===id);let radius;if(target?.type==='Circle')radius=target.data.r;else if(target?.type==='Arc')radius=Math.hypot(target.data.a.x-target.data.c.x,target.data.a.y-target.data.c.y);if(typeof radius!=='number'||!Number.isFinite(radius)||Math.abs(2*radius-diameter)>1e-6)throw fail('RESIDUAL','Diameter does not agree with the solved radius.');
 return {revision,ok:true as const,serializedSketch,evidence:solved.evidence,dimension:{id,typeId:'DiameterLength',diameter,status}};
 }catch(error){return {revision,ok:false as const,error:{code:typeof error?.code==='string'?error.code:'INVALID',message:typeof error?.message==='string'?error.message:'Diameter transition failed.'}};}}
