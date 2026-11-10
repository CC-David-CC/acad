// Exact represented-radius eligibility only; no source ownership or events.
// Kept in mjs because the existing TypeScript target is ES2015; no target change.
import {finiteCurveSourceWord} from './finiteCurveSourceEnvelope.mjs';
function dyadic(value){const bits=finiteCurveSourceWord(value),hi=parseInt(bits.slice(0,8),16),lo=parseInt(bits.slice(8),16),exponent=(hi>>>20)&2047;const fraction=(BigInt(hi&1048575)<<32n)|BigInt(lo),sign=hi>>>31?-1n:1n;return {n:sign*(exponent===0?fraction:(1n<<52n)|fraction),e:exponent===0?-1074:exponent-1075};}
function add(a,b){const e=Math.min(a.e,b.e);return {n:(a.n<<BigInt(a.e-e))+(b.n<<BigInt(b.e-e)),e};}
function subtract(a,b){return add(a,{n:-b.n,e:b.e});}
function square(a){return {n:a.n*a.n,e:2*a.e};}
// Fixed five finite F64 inputs: each significand <=53 bits, exponent gap <=2097;
// subtraction/squaring/sum/difference stay below4300 bits. No iterative refine,
// normalization, free exponent or attacker-sized BigInt allocation is admitted.
export function exactFiniteCurveSourceRadiusIncidence(p,c,radius){
 const pair=v=>Array.isArray(v)&&v.length===2&&v.every(n=>typeof n==='number'&&Number.isFinite(n));
 if(!pair(p)||!pair(c)||typeof radius!=='number'||!Number.isFinite(radius)||radius<=0)return false;
 const rr=square(dyadic(radius)),xx=square(subtract(dyadic(p[0]),dyadic(c[0]))),yy=square(subtract(dyadic(p[1]),dyadic(c[1])));
 return subtract(add(xx,yy),rr).n===0n;
}
