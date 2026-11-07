// Saved authored shell intent only. Native faces, handles and solved copies
// remain in the candidate Worker/ledger; removedFaceIds are opaque source keys.
import {solidBodyId} from './solidIntent.mjs';

const keys=['version','unit','engine','engineRevision','featureId','target','producerFeatureId','removedFaceIds','thickness','direction'];
const fail=message=>{throw Object.assign(Error(message),{code:'INVALID_REQUEST'});};
export function captureOwnedShellFeature(input){
 const proto=input&&typeof input==='object'?Object.getPrototypeOf(input):undefined;
 if(!input||typeof input!=='object'||Array.isArray(input)||(proto!==null&&Object.getPrototypeOf(proto)!==null)||Reflect.ownKeys(input).length!==keys.length)fail('Expected exact authored shell data.');
 const out={};for(const key of keys){const field=Object.getOwnPropertyDescriptor(input,key);if(!field?.enumerable||!Object.hasOwn(field,'value'))fail('Shell parameters must be own data.');out[key]=field.value;}
 if(out.version!==1||out.unit!=='millimeter'||out.engine!=='occ'||typeof out.engineRevision!=='string'||!/^sha256:[a-f0-9]{64}:[a-f0-9]{64}$/.test(out.engineRevision)||!Number.isSafeInteger(out.featureId)||out.featureId<1||!Number.isSafeInteger(out.producerFeatureId)||out.producerFeatureId<1||out.featureId===out.producerFeatureId||out.target!==solidBodyId(out.producerFeatureId)||out.direction!=='inward'||typeof out.thickness!=='number'||!Number.isFinite(out.thickness)||out.thickness<=0||out.thickness>1e6)fail('Use an explicit OCC build, current producer, inward direction and positive bounded thickness.');
 const faces=out.removedFaceIds;
 if(!Array.isArray(faces)||faces.length<1||faces.length>16||Reflect.ownKeys(faces).length!==faces.length+1)fail('Select one to sixteen distinct opaque authored faces.');
 const copied=[];for(let i=0;i<faces.length;i++){const field=Object.getOwnPropertyDescriptor(faces,String(i));if(!field?.enumerable||!Object.hasOwn(field,'value')||typeof field.value!=='string'||!field.value||field.value.length>16384)fail('Shell face identities must be bounded own data strings.');copied.push(field.value);}
 if(new Set(copied).size!==copied.length)fail('Select distinct authored shell faces.');
 out.removedFaceIds=Object.freeze(copied);return Object.freeze(out);
}
