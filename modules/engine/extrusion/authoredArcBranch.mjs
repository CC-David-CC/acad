// ONE authored ordinary circular-Arc branch. No current-source authority or
// cached/persisted full/near flag. Exact sector decisions use represented F64.
export const ARC_BRANCHES=Object.freeze(['proper-ccw','full-ccw']);
const TAU=2*Math.PI,own=(v,k)=>Object.prototype.hasOwnProperty.call(v,k);
const fail=message=>{throw Object.assign(Error(message),{code:'INVALID_ARC_BRANCH'});};
const uncertain=message=>{throw Object.assign(Error(message),{code:'ARC_INTERVAL_UNREPRESENTABLE'});};
export function captureArcBranch(value){if(!ARC_BRANCHES.includes(value))fail('Arc requires an explicit proper-ccw or full-ccw branch.');return value;}
function point(value){if(!value||typeof value!=='object'||Array.isArray(value)||!Number.isFinite(value.x)||!Number.isFinite(value.y))fail('Arc requires finite source points.');return{x:value.x,y:value.y};}
function record(value,keys){if(!value||typeof value!=='object'||Array.isArray(value)||Reflect.ownKeys(value).length!==keys.length||Reflect.ownKeys(value).some(k=>typeof k!=='string'||!keys.includes(k)))fail('Unexpected Arc source fields.');const out={};for(const k of keys){const d=Object.getOwnPropertyDescriptor(value,k);if(!d?.enumerable||!own(d,'value'))fail('Arc fields must be own data.');out[k]=d.value;}return out;}
export function captureArcData(value){const d=record(value,['a','b','c','branch']);for(const k of ['a','b','c']){d[k]=record(d[k],['x','y']);d[k]=Object.freeze(point(d[k]));}d.branch=captureArcBranch(d.branch);arcBranchFacts(d);return Object.freeze(d);}
// Only actual NEW authoring admission may apply this default; never IO/Open.
export function captureNewArcData(value){if(!value||typeof value!=='object')fail('Invalid new Arc intent.');const has=Object.getOwnPropertyDescriptor(value,'branch')!==undefined,d=record(value,has?['a','b','c','branch']:['a','b','c']);return captureArcData({...d,branch:has?d.branch:'proper-ccw'});}
export function arcDataFromObject(arc){return{a:point(arc.a),b:point(arc.b),c:point(arc.c),branch:captureArcBranch(arc.branch)};}
// Fixed finite inputs only: exact binary64 dyadics, <4300-bit intermediate
// products. No free exponent, iteration, optimizer or global epsilon.
function dyadic(n){const v=new DataView(new ArrayBuffer(8));v.setFloat64(0,n,false);const h=v.getUint32(0,false),l=v.getUint32(4,false),e=(h>>>20)&2047,f=(BigInt(h&1048575)<<32n)|BigInt(l);return{n:(h>>>31?-1n:1n)*(e?(1n<<52n)|f:f),e:e?e-1075:-1074};}
function add(a,b){const e=Math.min(a.e,b.e);return{n:(a.n<<BigInt(a.e-e))+(b.n<<BigInt(b.e-e)),e};}
const neg=a=>({n:-a.n,e:a.e}),sub=(a,b)=>add(a,neg(b)),mul=(a,b)=>({n:a.n*b.n,e:a.e+b.e}),sgn=a=>a.n<0n?-1:a.n>0n?1:0;
const radial=(p,c)=>[sub(dyadic(p.x),dyadic(c.x)),sub(dyadic(p.y),dyadic(c.y))];
const cross=(a,b)=>sub(mul(a[0],b[1]),mul(a[1],b[0])),dot=(a,b)=>add(mul(a[0],b[0]),mul(a[1],b[1]));
const zero=v=>!v[0].n&&!v[1].n;
const half=v=>sgn(v[1])>0||!sgn(v[1])&&sgn(v[0])>=0?0:1;
const compare=(a,b)=>half(a)!==half(b)?half(a)-half(b):-sgn(cross(a,b));
export function arcBranchFacts(value){
 const branch=captureArcBranch(value?.branch),a=point(value.a),b=point(value.b),c=point(value.c),u=radial(a,c),v=radial(b,c);
 if(zero(u)||zero(v))fail('An Arc endpoint cannot be its center.');
 let sector;
 if(branch==='full-ccw'){if(a.x!==b.x||a.y!==b.y)fail('A full Arc requires exact authored seam equality.');sector='full';}
 else{const cr=sgn(cross(u,v));if(!cr&&sgn(dot(u,v))>=0)fail('A proper Arc requires distinct positive endpoint rays.');sector=cr>0?'minor':cr<0?'major':'semicircle';}
 const start=Math.atan2(a.y-c.y,a.x-c.x),last=Math.atan2(b.y-c.y,b.x-c.x),end=branch==='full-ccw'?start+TAU:sector==='semicircle'?start+Math.PI:last<=start?last+TAU:last,sweep=branch==='full-ccw'?TAU:sector==='semicircle'?Math.PI:end-start;
 const representable=Number.isFinite(start)&&Number.isFinite(end)&&(branch==='full-ccw'||sweep>0&&sweep<TAU&&(sector==='semicircle'||sector==='minor'&&sweep<Math.PI||sector==='major'&&sweep>Math.PI));
 return Object.freeze({branch,sector,start,end,sweep,representable});
}
export function requireArcInterval(value){const facts=arcBranchFacts(value);if(!facts.representable)uncertain('The proper Arc interval cannot be represented without collapsing its authored branch.');return facts;}
export function arcSectorContains(value,x,y){const facts=arcBranchFacts(value);if(!Number.isFinite(x)||!Number.isFinite(y))return false;if(facts.branch==='full-ccw')return true;const c=point(value.c),u=radial(point(value.a),c),v=radial(point(value.b),c),w=radial({x,y},c);if(zero(w))return false;const uv=compare(u,v),uw=compare(u,w),wv=compare(w,v);return uv<0?uw<=0&&wv<=0:uw<=0||wv<=0;}
