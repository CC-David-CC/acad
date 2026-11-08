import {admissionCause,withAdmissionCause} from './admissionCause.mjs';

// Exact represented-binary64 arithmetic only. The solver certificate owns all
// model/row/Param authority. Keep BigInt syntax/APIs in this JS leaf so the
// existing TypeScript ES2015/es2018 declaration contract remains unchanged.
/** @typedef {{n:bigint,e:number}} ExactPolarDyadic */
const BITS=8192;
/** @param {string} message @param {boolean} [resource] @returns {never} */
export function failExactPolarFrame(message,resource=false){
 throw withAdmissionCause(Object.assign(Error(message),{code:resource?'RESOURCE_LIMIT':'POLAR_FRAME_PROOF_CHANGED'}),admissionCause(resource?'resource-limit':'retained-validation-failure'));
}
const stop=failExactPolarFrame;
/** @param {()=>void} tick */
export function createExactPolarArithmetic(tick){
 const view=new DataView(new ArrayBuffer(8));
 /** @param {bigint} n @param {number} e @returns {ExactPolarDyadic} */
 const normalize=(n,e)=>{
  tick();if(n===0n)return{n:0n,e:0};
  const absolute=n<0n?-n:n;if(absolute.toString(2).length>BITS)stop('Exact Polar-frame arithmetic exceeds its bit bound.',true);
  while((n&65535n)===0n){tick();n>>=16n;e+=16;}while((n&1n)===0n){tick();n>>=1n;e++;}
  return{n,e};
 };
 /** @param {number} value @returns {ExactPolarDyadic} */
 const number=(value)=>{
  tick();if(!Number.isFinite(value))stop('Nonfinite fixed-value certificate input.');
  if(value===0)return{n:0n,e:0};view.setFloat64(0,value,false);
  const bits=view.getBigUint64(0,false),raw=Number((bits>>52n)&2047n);
  let n=bits&((1n<<52n)-1n);if(raw)n|=1n<<52n;if(bits>>63n)n=-n;
  return normalize(n,raw?raw-1075:-1074);
 };
 /** @param {ExactPolarDyadic} a @param {ExactPolarDyadic} b @returns {ExactPolarDyadic} */
 const add=(a,b)=>{tick();if(!a.n)return b;if(!b.n)return a;const e=Math.min(a.e,b.e);return normalize((a.n<<BigInt(a.e-e))+(b.n<<BigInt(b.e-e)),e);};
 /** @param {ExactPolarDyadic} a @param {ExactPolarDyadic} b @returns {ExactPolarDyadic} */
 const multiply=(a,b)=>{tick();return normalize(a.n*b.n,a.e+b.e);};
 /** @param {ExactPolarDyadic} a @param {ExactPolarDyadic} b @returns {boolean} */
 const equal=(a,b)=>a.n===b.n&&(a.n===0n||a.e===b.e);
 /** @param {ExactPolarDyadic} a @returns {ExactPolarDyadic} */
 const negate=(a)=>({n:-a.n,e:a.e});
 return{number,add,multiply,equal,negate};
}
