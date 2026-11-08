import {constructNativeCubic} from './cubicCurveConstruction';
import {privateCurvePrimitiveKeys} from '../shapes/cubicCurveRecord.mjs';
import {prepareIndependentPrimitiveAppend} from './independentPrimitiveAppend';
import {EndPoint} from '../shapes/point';
import {Segment} from '../shapes/segment';
import {Circle} from '../shapes/circle';
import {Arc} from '../shapes/arc';
import {Ellipse} from '../shapes/ellipse';
import {captureEllipseParameters} from '../shapes/ellipseRecord.mjs';

const MAX=1024*1024,encoder=new TextEncoder();
const fail=(code:string,message:string)=>Object.assign(new Error(message),{code});
function record(value:any,keys:string[]){if(!value||typeof value!=='object'||Array.isArray(value)||Reflect.ownKeys(value).length!==keys.length||Reflect.ownKeys(value).some(k=>typeof k!=='string'||!keys.includes(k)))throw fail('INVALID','Invalid primitive request.');const out:any={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))throw fail('INVALID','Primitive request fields must be data.');out[key]=d.value}return out;}
function point(value:any){const p=record(value,['x','y']);if(![p.x,p.y].every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=1e8))throw fail('DOMAIN','Invalid sketch coordinate.');return p;}
function external(value:any){if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value)))throw fail('INVALID','External parameters must be a plain numeric record.');const out=Object.create(null),keys=Reflect.ownKeys(value);if(keys.length>1024)throw fail('LIMIT','Too many external parameters.');for(const key of keys){if(typeof key!=='string')throw fail('INVALID','Invalid external parameter.');const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value')||typeof d.value!=='number'||!Number.isFinite(d.value)||Math.abs(d.value)>1e9)throw fail('INVALID','Invalid external parameter.');out[key]=d.value;}return out;}
function primitive(input:any){const a=record(input,privateCurvePrimitiveKeys(input));if(typeof a.id!=='string'||!/^agent-primitive-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(a.id)||!['Point','Segment','Circle','Arc','Ellipse','BezierCurve','BSpline'].includes(a.kind)||![null,'construction'].includes(a.role)||!Number.isSafeInteger(a.stage)||a.stage<0||a.stage>31)throw fail('INVALID','Invalid primitive identity or kind.');let shape:any;
 if(['BezierCurve','BSpline'].includes(a.kind)){shape=constructNativeCubic(a.kind,a.data,a.id,a.identities);}
 else if(a.kind==='Point'){const p=point(a.data);shape=new EndPoint(p.x,p.y,a.id);}
 else if(a.kind==='Segment'){const d=record(a.data,['a','b']),p=point(d.a),q=point(d.b);if(Math.hypot(q.x-p.x,q.y-p.y)<=1e-9)throw fail('DOMAIN','Segment endpoints must be distinct.');shape=new Segment(p.x,p.y,q.x,q.y,a.id);}
 else if(a.kind==='Circle'){const d=record(a.data,['c','r']),c=point(d.c);if(typeof d.r!=='number'||!Number.isFinite(d.r)||d.r<=1e-9||d.r>1e8)throw fail('DOMAIN','Circle radius must be positive and bounded.');shape=new Circle(c.x,c.y,d.r,a.id);}
 else if(a.kind==='Ellipse'){const d=captureEllipseParameters(a.data),c=point(d.c);shape=new Ellipse(c.x,c.y,d.rx,d.ry,d.rot,a.id);}
 else {const d=record(a.data,['a','b','c']),p=point(d.a),q=point(d.b),c=point(d.c),r=Math.hypot(p.x-c.x,p.y-c.y),r2=Math.hypot(q.x-c.x,q.y-c.y);if(r<=1e-9||r>1e8||(Math.abs(p.x-q.x)<1e-6&&Math.abs(p.y-q.y)<1e-6)||Math.abs(r-r2)>1e-9)throw fail('DOMAIN','Arc endpoints must be distinct and lie on one positive-radius circle.');shape=new Arc(p.x,p.y,q.x,q.y,c.x,c.y,a.id);}
 shape.role=a.role;return {shape,id:a.id,kind:a.kind,role:a.role,stage:a.stage};
}

// Append and independent verification keep the ORIGINAL captured source. A
// whole-candidate cold solve supplies fresh classification, never replacement
// source coordinates. All parsing/model work stays inside disposable Workers.
export function appendSketchPrimitive(request:any){let revision='';try{
 const d=request&&typeof request==='object'?Object.getOwnPropertyDescriptor(request,'revision'):null;if(d?.enumerable&&Object.prototype.hasOwnProperty.call(d,'value')&&typeof d.value==='string'&&d.value.length<=256)revision=d.value;
 const a=record(request,['revision','sketchJSON','externalParameters','primitive']);if(typeof a.revision!=='string'||!a.revision||a.revision.length>256||typeof a.sketchJSON!=='string'||a.sketchJSON.length>MAX||encoder.encode(a.sketchJSON).byteLength>MAX)throw fail('INVALID','Invalid primitive source.');revision=a.revision;
 const bindings=external(a.externalParameters),before=JSON.parse(a.sketchJSON),{shape,id,kind,role,stage}=primitive(a.primitive);
 const nativeIds:string[]=[];if(['BezierCurve','BSpline'].includes(kind)){shape.traverse(o=>nativeIds.push(o.id));if(kind==='BSpline')for(const p of shape.fPoints)nativeIds.push(p.id);}
 const result=prepareIndependentPrimitiveAppend(revision,before,bindings,{id,type:kind,role,stage,data:shape.write()},nativeIds.length?nativeIds:undefined);
 if(!result.ok)return result;
 if(result.serializedSketch.length>MAX||encoder.encode(result.serializedSketch).byteLength>MAX)throw fail('LIMIT','The resulting sketch exceeds its limit.');
 return {...result,primitive:{id,kind,role,stage}};
 }catch(error){return {revision,ok:false as const,error:{code:typeof error?.code==='string'?error.code:'INVALID',message:typeof error?.message==='string'?error.message:'Primitive transition failed.'}};}}

// A separate genuine Worker recomputes the complete transition from the
// ORIGINAL request. Unrelated finite geometry/intent changes cannot pass by
// satisfying constraints alone or by borrowing the producer's evidence.
export function verifyPrimitiveAppendCandidate(request:any){let revision='';try{
 const a=record(request,['revision','sketchJSON','externalParameters','primitive','candidateJSON']);if(typeof a.revision==='string')revision=a.revision;
 if(typeof a.candidateJSON!=='string'||a.candidateJSON.length>MAX||encoder.encode(a.candidateJSON).byteLength>MAX)throw fail('INVALID_CANDIDATE','Invalid primitive candidate source.');
 const expected=appendSketchPrimitive({revision:a.revision,sketchJSON:a.sketchJSON,externalParameters:a.externalParameters,primitive:a.primitive});
 if(!expected.ok)return expected;
 if(!('serializedSketch' in expected)||expected.serializedSketch!==a.candidateJSON)throw fail('CANDIDATE_MISMATCH','The append candidate differs from the original independent operation.');
 return {revision,ok:true as const,verified:true};
 }catch(error){return {revision,ok:false as const,error:{code:typeof error?.code==='string'?error.code:'INVALID',message:typeof error?.message==='string'?error.message:'Primitive verification failed.'}};}}
