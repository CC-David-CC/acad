// Semantic authored choices only; successful seed/target/source custody is
// authenticated by the owned evaluator, never inferred by this parser.
import {solidBodyId} from './solidIntent.mjs';
export const MAX_LINEAR_HOLE_PATTERN_COUNT=17;
const fail=(code,message)=>{throw Object.assign(Error(message),{code});};
export function linearHolePatternNativeCost(count){
 if(!Number.isSafeInteger(count)||count<1||count>MAX_LINEAR_HOLE_PATTERN_COUNT)fail('INVALID_REQUEST','Expected bounded integer pattern count including seed.');
 if(count===1)fail('UNSUPPORTED_IDENTITY_OPERATION','Seed-only patterns require a qualified owned identity result.');
 return 2*(count-1);
}
export function captureOwnedLinearHolePatternIntent(input){
 const keys=['version','unit','engine','engineRevision','featureId','target','producerFeatureId','seedFeatureId','axis','count','spacing'];
 if(!input||typeof input!=='object'||Array.isArray(input)||Reflect.ownKeys(input).length!==keys.length)fail('INVALID_REQUEST','Expected exact linear-hole pattern intent.');
 const p={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(input,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('INVALID_REQUEST','Pattern fields must be own data.');p[key]=d.value;}
 if(p.version!==1||p.unit!=='millimeter'||p.engine!=='occ'||typeof p.engineRevision!=='string'||!/^sha256:[a-f0-9]{64}:[a-f0-9]{64}$/.test(p.engineRevision)||![p.featureId,p.producerFeatureId,p.seedFeatureId].every(n=>Number.isSafeInteger(n)&&n>0)||p.featureId===p.producerFeatureId||p.featureId===p.seedFeatureId||p.target!==solidBodyId(p.producerFeatureId)||p.axis!=='source-local-x-positive'||!Number.isSafeInteger(p.count)||p.count<1||p.count>MAX_LINEAR_HOLE_PATTERN_COUNT||typeof p.spacing!=='number'||!Number.isFinite(p.spacing)||p.spacing<=0||p.spacing>1e6)fail('INVALID_REQUEST','Invalid bounded linear-hole pattern intent.');
 return Object.freeze(p);
}
