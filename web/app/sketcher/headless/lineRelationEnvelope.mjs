import {captureSketchFailure} from '../constr/admissionCause.mjs';
// Cheap descriptor-only envelope admission; deeper identity/evidence checks and
// the private exact-source recomputation precede any replay/publication.
export function captureLineRelationEnvelope(value,revision){
 const record=(v,keys)=>{if(!v||typeof v!=='object'||Array.isArray(v)||![Object.prototype,null].includes(Object.getPrototypeOf(v))||Reflect.ownKeys(v).length!==keys.length)throw Error('Invalid line relation response.');const out={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(v,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))throw Error('Response fields must be data.');out[key]=d.value;}return out;};
 const ok=Object.getOwnPropertyDescriptor(value||{},'ok');if(!ok?.enumerable||!Object.hasOwn(ok,'value')||typeof ok.value!=='boolean')throw Error('Invalid relation response.');
 const r=record(value,ok.value?['revision','ok','serializedSketch','evidence','relation']:['revision','ok','error']);if(r.revision!==revision)throw Error('Relation revision changed.');
 if(!r.ok)return Object.freeze({...r,error:captureSketchFailure(r.error)});
 if(typeof r.serializedSketch!=='string'||r.serializedSketch.length>1048576||!Array.isArray(r.evidence)||r.evidence.length>10000)throw Error('Invalid relation candidate.');
 r.relation=Object.freeze(record(r.relation,['kind','typeId','objects','stage','index','status','existing']));return Object.freeze(r);
}
