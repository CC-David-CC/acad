import {createExactPolarArithmetic} from './exactPolarFrameArithmetic.mjs';
// Exact predicates over represented finite binary64 endpoints, never atan2,
// sin/cos, proximity or rounded projected contacts. Positive S clears division.
export function classifyFiniteTangency(line,curve){
 let work=0;const tick=()=>{if(++work>10000)throw Object.assign(Error('Finite tangency predicates exceed their bounded work.'),{code:'RESOURCE_LIMIT'});},a=createExactPolarArithmetic(tick),n=a.number,add=a.add,mul=a.multiply,sub=(x,y)=>add(x,a.negate(y)),sgn=x=>x.n<0n?-1:x.n>0n?1:0,
  point=p=>[n(p.x),n(p.y)],minus=(x,y)=>x.map((v,i)=>sub(v,y[i])),dot=(x,y)=>add(mul(x[0],y[0]),mul(x[1],y[1])),cross=(x,y)=>sub(mul(x[0],y[1]),mul(x[1],y[0])),scale=(x,k)=>x.map(v=>mul(v,k)),plus=(x,y)=>x.map((v,i)=>add(v,y[i])),zero=x=>!x[0].n&&!x[1].n;
 const A=point(line.a),B=point(line.b),C=point(curve.c),D=minus(B,A),CA=minus(C,A),S=dot(D,D),N=dot(CA,D);
 if(sgn(S)<=0)throw Object.assign(Error('Finite tangency has no actual endpoint direction.'),{code:'TANGENCY_DOMAIN'});
 const low=sgn(N),high=sgn(sub(N,S));
 if(low<0||high>0)return{inside:false,segmentAt:null,arcAt:null};
 const segmentAt=!low?0:!high?1:null;
 // W/S is the exact radial vector from C to the endpoint-line foot.
 const W=plus(scale(minus(A,C),S),scale(D,N));
 if(zero(W))throw Object.assign(Error('Finite contact has an unresolved zero radial direction.'),{code:'FINITE_CONTACT_UNCERTAIN'});
 if(curve.TYPE!=='Arc')return{inside:true,segmentAt,arcAt:null};
 const U=minus(point(curve.a),C),V=minus(point(curve.b),C);
 if(zero(U)||zero(V))throw Object.assign(Error('Finite Arc contact has an unresolved zero radial direction.'),{code:'FINITE_CONTACT_UNCERTAIN'});
 const half=v=>sgn(v[1])>0||!sgn(v[1])&&sgn(v[0])>=0?0:1;
 const cmp=(u,v)=>{const h=half(u)-half(v);if(h)return h;return-sgn(cross(u,v));};
 const uv=cmp(U,V),uw=cmp(U,W),wv=cmp(W,V);
 if(!uv)throw Object.assign(Error('Same-ray Arc endpoints do not certify a unique finite/full-turn branch.'),{code:'UNSUPPORTED_FINITE_ARC'});
 // Native's represented angular branch must itself remain distinguishable.
 // This is ONLY an uncertainty refusal, never sector membership authority.
 const turn=2*Math.PI,sweep=((curve.getEndAngle()-curve.getStartAngle())%turn+turn)%turn;
 if(!Number.isFinite(sweep)||!(sweep>0&&sweep<turn))throw Object.assign(Error('The actual native Arc sweep collapsed; finite contact is unqualified.'),{code:'FINITE_CONTACT_UNCERTAIN'});
 return{inside:uv<0?uw<=0&&wv<=0:uw<=0||wv<=0,segmentAt,arcAt:!uw?0:!wv?1:null};
}
