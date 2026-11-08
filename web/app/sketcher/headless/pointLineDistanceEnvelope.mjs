import {captureAdmissionCause} from '../constr/admissionCause.mjs';
const fail=()=>{throw Object.assign(Error('Invalid point-line distance data.'),{code:'INVALID'});};
/** @returns {Record<string,any>} */
export function pointLineRecord(v,keys){const p=v&&typeof v==='object'?Object.getPrototypeOf(v):undefined;if(!v||typeof v!=='object'||Array.isArray(v)||(p!==null&&Object.getPrototypeOf(p)!==null)||Reflect.ownKeys(v).length!==keys.length)fail();const o={};for(const k of keys){const d=Object.getOwnPropertyDescriptor(v,k);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail();o[k]=d.value;}return o;}
const id=v=>{if(typeof v!=='string'||!v||v.length>256)fail();return v;};
export function capturePointLineDistanceIntent(v){const a=pointLineRecord(v,['pointId','lineId','distance','inverted']);id(a.pointId);id(a.lineId);if(a.pointId===a.lineId||typeof a.distance!=='number'||!Number.isFinite(a.distance)||a.distance<0||a.distance>1e6||typeof a.inverted!=='boolean')fail();return Object.freeze(a);}
function refs(value){if(!Array.isArray(value)||value.length!==2||Reflect.ownKeys(value).length!==3)fail();return Object.freeze([0,1].map(i=>{const d=Object.getOwnPropertyDescriptor(value,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value'))fail();return id(d.value);}));}
export function capturePointLineSupport(value,lineId,inverted){
 const r=pointLineRecord(value,['lineId','normalBasis','anchor','angleRadians','polarLength','normal','signedDistance','inverted','quality']);
 const vector=v=>{if(!Array.isArray(v)||v.length!==2||Reflect.ownKeys(v).length!==3)fail();return Object.freeze([0,1].map(i=>{const d=Object.getOwnPropertyDescriptor(v,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value')||typeof d.value!=='number'||!Number.isFinite(d.value))fail();return d.value;}));};
 if(r.lineId!==lineId||r.inverted!==inverted||typeof inverted!=='boolean'||r.normalBasis!=='native-polar-angle'||r.quality!=='source-local-supporting-line-mm'||!['angleRadians','polarLength','signedDistance'].every(k=>typeof r[k]==='number'&&Number.isFinite(r[k])))fail();
 r.anchor=vector(r.anchor);r.normal=vector(r.normal);if(r.anchor.some(v=>Math.abs(v)>1e9)||r.normal.some(v=>Math.abs(v)>1)||Math.abs(r.angleRadians)>1e9||Math.abs(r.polarLength)>4e9||Math.abs(r.polarLength)<=1e-9||Math.abs(r.signedDistance)>4e9)fail();return Object.freeze(r);
}
/** @returns {Readonly<Record<string,any>>} */
export function capturePointLineDistanceEnvelope(value,revision){
 const ok=Object.getOwnPropertyDescriptor(value||{},'ok');if(!ok||!Object.hasOwn(ok,'value'))fail();
 if(ok.value===false){const r=pointLineRecord(value,['revision','ok','error']),e=pointLineRecord(r.error,Object.hasOwn(r.error||{},'cause')?['code','message','cause']:['code','message']);if(r.revision!==revision||typeof e.code!=='string'||e.code.length>64||typeof e.message!=='string'||e.message.length>512)fail();return Object.freeze({...r,error:Object.freeze({...e,...(Object.hasOwn(e,'cause')?{cause:captureAdmissionCause(e.cause)}:{})})});}
 const r=pointLineRecord(value,['revision','ok','changed','serializedSketch','evidence','dimension']),d=pointLineRecord(r.dimension,['typeId','objects','distance','inverted','status','stage','index']);
 d.objects=refs(d.objects);capturePointLineDistanceIntent({pointId:d.objects[0],lineId:d.objects[1],distance:d.distance,inverted:d.inverted});
 if(r.revision!==revision||r.ok!==true||typeof r.changed!=='boolean'||typeof r.serializedSketch!=='string'||r.serializedSketch.length>1048576||!Array.isArray(r.evidence)||r.evidence.length>10000||d.typeId!=='DistancePL'||!['accepted','redundant'].includes(d.status)||!Number.isSafeInteger(d.stage)||d.stage<0||!Number.isSafeInteger(d.index)||d.index<0)fail();return Object.freeze({...r,dimension:Object.freeze(d)});
}
