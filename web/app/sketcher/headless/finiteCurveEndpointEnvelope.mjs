// Structural transport only: neither selection ownership nor edit authority.
// Mathematical certification and source reconstruction remain in Workers.
import {captureFiniteCurveSourceReceipt,captureFiniteCurveSourceRequest} from './finiteCurveSourceEnvelope.mjs';
import {captureFiniteCurveCertificateRequest} from './finiteCurveCertificateEnvelope.mjs';

const own=(v,k)=>Object.prototype.hasOwnProperty.call(v,k);
const invalid=()=>{throw Error('Invalid private finite-curve endpoint request.');};
function record(v,keys){
 if(!v||typeof v!=='object'||Array.isArray(v)||![Object.prototype,null].includes(Object.getPrototypeOf(v)))return invalid();
 const names=Reflect.ownKeys(v);if(names.length!==keys.length||names.some(k=>typeof k!=='string'||!keys.includes(k)))return invalid();
 const result=Object.create(null);for(const key of keys){const d=Object.getOwnPropertyDescriptor(v,key);if(!d?.enumerable||!own(d,'value'))return invalid();result[key]=d.value;}return result;
}
function id(v){if(typeof v!=='string'||!v||v.length>256||/[\u0000-\u001f\u007f]/u.test(v))return invalid();return v;}
function point(v){const p=record(v,['id','x','y']);id(p.id);if(![p.x,p.y].every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=1e8))return invalid();return Object.freeze(p);}
function text(v){if(typeof v!=='string'||v.length>1048576||new TextEncoder().encode(v).byteLength>1048576)return invalid();return v;}

// Detach all caller data before any asynchronous Worker or lock wait.
export function captureFiniteCurveEndpointRequest(value,verify=false){
 const keys=['revision','sketchJSON','externalParameters','expectedSource','raw','domain','intent','coordinatePolicy'];
 const a=record(value,verify?[...keys,'candidateJSON','resultPoint']:keys);
 const source=captureFiniteCurveSourceReceipt(a.expectedSource,a.revision);if(source.ok!==true)return invalid();
 const original=captureFiniteCurveSourceRequest({revision:a.revision,sketchJSON:a.sketchJSON,externalParameters:a.externalParameters,intent:{curveIds:source.targets.map(t=>t.id)}});
 const certificate=captureFiniteCurveCertificateRequest({revision:original.revision,curves:source.input.curves,raw:a.raw,domain:a.domain});
 const intent=record(a.intent,['action','target','nativeIndex']),target=record(intent.target,['curveId','endpoint']);
 if(!['trim','extend'].includes(intent.action)||!['a','b'].includes(target.endpoint)||!Number.isSafeInteger(intent.nativeIndex)||intent.nativeIndex<0||intent.nativeIndex>7||!['ordinary','typed-lengths'].includes(a.coordinatePolicy))return invalid();
 id(target.curveId);
 return Object.freeze({revision:original.revision,sketchJSON:original.sketchJSON,externalParameters:original.externalParameters,expectedSource:source,raw:certificate.raw,domain:certificate.domain,intent:Object.freeze({action:intent.action,target:Object.freeze(target),nativeIndex:intent.nativeIndex}),coordinatePolicy:a.coordinatePolicy,...(verify?{candidateJSON:text(a.candidateJSON),resultPoint:point(a.resultPoint)}:{})});
}
