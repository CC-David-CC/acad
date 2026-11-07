import {HeadlessSketchWorkspace} from './workspace';
import {replaySketchTransition} from './sketchTransition';
import {solveSketch} from './solve';
import {sameRestoredSketch} from '../historyEquivalence.mjs';
import {EndPoint} from '../shapes/point';
import {Segment} from '../shapes/segment';
import {Circle} from '../shapes/circle';
import {Arc} from '../shapes/arc';

const MAX=1024*1024,encoder=new TextEncoder();
const fail=(code:string,message:string)=>Object.assign(new Error(message),{code});
function record(value:any,keys:string[]){if(!value||typeof value!=='object'||Array.isArray(value)||Reflect.ownKeys(value).length!==keys.length||Reflect.ownKeys(value).some(k=>typeof k!=='string'||!keys.includes(k)))throw fail('INVALID','Invalid primitive request.');const out:any={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))throw fail('INVALID','Primitive request fields must be data.');out[key]=d.value}return out;}
function point(value:any){const p=record(value,['x','y']);if(![p.x,p.y].every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=1e8))throw fail('DOMAIN','Invalid sketch coordinate.');return p;}
function external(value:any){if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value)))throw fail('INVALID','External parameters must be a plain numeric record.');const out=Object.create(null),keys=Reflect.ownKeys(value);if(keys.length>1024)throw fail('LIMIT','Too many external parameters.');for(const key of keys){if(typeof key!=='string')throw fail('INVALID','Invalid external parameter.');const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value')||typeof d.value!=='number'||!Number.isFinite(d.value)||Math.abs(d.value)>1e9)throw fail('INVALID','Invalid external parameter.');out[key]=d.value;}return out;}
function primitive(input:any){const a=record(input,['id','kind','role','stage','data']);if(typeof a.id!=='string'||!/^agent-primitive-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(a.id)||!['Point','Segment','Circle','Arc'].includes(a.kind)||![null,'construction'].includes(a.role)||!Number.isSafeInteger(a.stage)||a.stage<0||a.stage>31)throw fail('INVALID','Invalid primitive identity or kind.');let shape:any;
 if(a.kind==='Point'){const p=point(a.data);shape=new EndPoint(p.x,p.y,a.id);}
 else if(a.kind==='Segment'){const d=record(a.data,['a','b']),p=point(d.a),q=point(d.b);if(Math.hypot(q.x-p.x,q.y-p.y)<=1e-9)throw fail('DOMAIN','Segment endpoints must be distinct.');shape=new Segment(p.x,p.y,q.x,q.y,a.id);}
 else if(a.kind==='Circle'){const d=record(a.data,['c','r']),c=point(d.c);if(typeof d.r!=='number'||!Number.isFinite(d.r)||d.r<=1e-9||d.r>1e8)throw fail('DOMAIN','Circle radius must be positive and bounded.');shape=new Circle(c.x,c.y,d.r,a.id);}
 else {const d=record(a.data,['a','b','c']),p=point(d.a),q=point(d.b),c=point(d.c),r=Math.hypot(p.x-c.x,p.y-c.y),r2=Math.hypot(q.x-c.x,q.y-c.y);if(r<=1e-9||r>1e8||(Math.abs(p.x-q.x)<1e-6&&Math.abs(p.y-q.y)<1e-6)||Math.abs(r-r2)>1e-9)throw fail('DOMAIN','Arc endpoints must be distinct and lie on one positive-radius circle.');shape=new Arc(p.x,p.y,q.x,q.y,c.x,c.y,a.id);}
 shape.role=a.role;return {shape,id:a.id,kind:a.kind,role:a.role,stage:a.stage};
}

// An ID is minted by the private coordinator, never by a public caller. Run
// this data-only transition in a disposable Worker realm; it does not publish.
export function appendSketchPrimitive(request:any){let revision='';try{
 const d=request&&typeof request==='object'?Object.getOwnPropertyDescriptor(request,'revision'):null;if(d?.enumerable&&Object.prototype.hasOwnProperty.call(d,'value')&&typeof d.value==='string'&&d.value.length<=256)revision=d.value;
 const a=record(request,['revision','sketchJSON','externalParameters','primitive']);if(typeof a.revision!=='string'||!a.revision||a.revision.length>256||typeof a.sketchJSON!=='string'||a.sketchJSON.length>MAX||encoder.encode(a.sketchJSON).byteLength>MAX)throw fail('INVALID','Invalid primitive source.');revision=a.revision;const bindings=external(a.externalParameters),original=replaySketchTransition({revision,sketchJSON:a.sketchJSON,externalParameters:bindings});if(!original.ok||!('serializedSketch' in original))return original;
 const before=JSON.parse(original.serializedSketch),workspace=new HeadlessSketchWorkspace(bindings);workspace.io._loadSketch(before,{strict:true});const {shape,id,kind,role,stage}=primitive(a.primitive);if(stage!==workspace.parametricManager.stages.length-1)throw fail('UNSUPPORTED','Only the current last sketch stage is supported.');
 // Scan stored IDs and the native reference index; the solver also checks complete
 // object/child/boundary ownership after constructing the candidate.
 const suffixes=kind==='Segment'?[':A',':B']:kind==='Circle'?[':C']:kind==='Arc'?[':A',':B',':C']:[],names=new Set([id,...suffixes.map(s=>id+s)]),index=workspace.createIndex(),todo=[before];let visited=0;
 for(const name of names)if(Object.prototype.hasOwnProperty.call(index,name))throw fail('IDENTITY_COLLISION','Primitive identity is already in use.');
 while(todo.length){const v=todo.pop();if(++visited>100000)throw fail('LIMIT','Sketch identity inventory exceeds its limit.');if(v&&typeof v==='object')for(const [key,child] of Object.entries(v)){if(key==='id'&&typeof child==='string'&&names.has(child))throw fail('IDENTITY_COLLISION','Primitive identity is already in use.');todo.push(child);}}
 const requestedData=shape.write(),pm=workspace.parametricManager;pm.startTransaction();try{const target=pm.stages[stage];target.assignObject(shape);workspace.findLayerByName('sketch').add(shape);shape.stabilize(workspace as any);pm.finishTransaction(null,false);}catch(error){if(pm.inTransaction)try{pm.finishTransaction(()=>{throw error},false)}catch(_){}throw error;}
 const candidate=JSON.parse(workspace.io.serializeSketch(before.metadata,{strict:true}));candidate.boundary=before.boundary;
 const added=candidate.objects.filter(o=>o.id===id);if(added.length!==1||added[0].type!==kind||added[0].role!==role||added[0].stage!==stage||JSON.stringify(added[0].data)!==JSON.stringify(requestedData))throw fail('INTENT_CHANGED','The new primitive identity changed.');
 const restored={...candidate,objects:candidate.objects.filter(o=>o.id!==id)};if(!sameRestoredSketch(original.serializedSketch,JSON.stringify(restored)))throw fail('INTENT_CHANGED','Existing sketch state changed.');
 const solved=solveSketch({revision,sketch:candidate,boundary:structuredClone(candidate.boundary),externalParameters:bindings});if(!solved.ok)return solved;const serializedSketch=JSON.stringify(solved.sketch);if(serializedSketch.length>MAX||encoder.encode(serializedSketch).byteLength>MAX)throw fail('LIMIT','The resulting sketch exceeds its limit.');if(!sameRestoredSketch(JSON.stringify(candidate),serializedSketch))throw fail('CURRENT_GEOMETRY_MISMATCH','Primitive verification changed geometry.');return {revision,ok:true as const,serializedSketch,evidence:solved.evidence,primitive:{id,kind,role,stage}};
 }catch(error){return {revision,ok:false as const,error:{code:typeof error?.code==='string'?error.code:'INVALID',message:typeof error?.message==='string'?error.message:'Primitive transition failed.'}};}}
