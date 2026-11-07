import {captureSketchFailure} from '../constr/admissionCause.mjs';
// Cheap descriptor-only transport admission. Deep bounded evidence and intent
// checks remain with transitionClient, before candidate replay/publication.
export function captureSignedDistanceEnvelope(value,revision){
 const record=(value,keys)=>{if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value))||Reflect.ownKeys(value).length!==keys.length)throw Error('Invalid signed distance response.');const out={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))throw Error('Signed distance response fields must be data.');out[key]=d.value;}return out;};
 const ok=Object.getOwnPropertyDescriptor(value||{},'ok');if(!ok?.enumerable||!Object.hasOwn(ok,'value')||typeof ok.value!=='boolean')throw Error('Invalid signed distance response.');
 const r=record(value,ok.value?['revision','ok','serializedSketch','evidence','dimension']:['revision','ok','error']);if(r.revision!==revision)throw Error('Signed distance revision changed.');
 if(!r.ok)return Object.freeze({...r,error:captureSketchFailure(r.error)});
 if(typeof r.serializedSketch!=='string'||r.serializedSketch.length>1048576||!Array.isArray(r.evidence)||r.evidence.length>10000)throw Error('Invalid signed distance candidate.');
 r.dimension=Object.freeze(record(r.dimension,['axis','typeId','objects','distance','status']));return Object.freeze(r);
}

export function captureSignedDistanceVerificationEnvelope(value,revision){
 const own=(v,k)=>Object.getOwnPropertyDescriptor(v,k),data=(v,k)=>{const d=own(v,k);if(!d?.enumerable||!Object.hasOwn(d,'value'))throw Error('Verification fields must be data.');return d.value;};
 if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value)))throw Error('Invalid signed verification response.');
 const ok=data(value,'ok');if(typeof ok!=='boolean'||data(value,'revision')!==revision||Reflect.ownKeys(value).length!==3)throw Error('Invalid signed verification response.');
 if(ok){if(data(value,'verified')!==true)throw Error('Unverified signed candidate.');return Object.freeze({revision,ok:true,verified:true});}
 return Object.freeze({revision,ok:false,error:captureSketchFailure(data(value,'error'))});
}
