// Pure exact rational witness arithmetic. No roots, source authority or Native calls.
export const FINITE_CURVE_CERTIFICATE_LIMITS=Object.freeze({integerBits:16384,work:500000,boxSteps:Object.freeze([1,2,4,8,16,32,64]),refinements:64,responseBytes:65536});
const stop=message=>{throw Object.assign(Error(message),{code:'RESOURCE_LIMIT'});};
export function createFiniteCurveCertificateArithmetic(){
 const limit=FINITE_CURVE_CERTIFICATE_LIMITS,owned=new WeakSet(),view=new DataView(new ArrayBuffer(8));let work=0;
 const tick=(n=1)=>{if(!Number.isSafeInteger(n)||n<0||work>limit.work-n)stop('Finite-curve certificate work exceeds its bounded domain.');work+=n;};
 const size=n=>{tick();return n===0n?0:(n<0n?-n:n).toString(2).length;};
 const checked=n=>{const bits=size(n);if(bits>limit.integerBits)stop('Finite-curve certificate integer exceeds its bit bound.');return bits;};
 const width=n=>Math.max(1,Math.ceil(size(n)/32));
 function product(a,b){
  const ab=size(a),bb=size(b);if(ab&&bb&&ab+bb>limit.integerBits)stop('Finite-curve certificate product exceeds its prospective bit bound.');
  tick(width(a)*width(b));const n=a*b;checked(n);return n;
 }
 function sum(a,b){
  if(a&&b&&Math.max(size(a),size(b))+1>limit.integerBits)stop('Finite-curve certificate sum exceeds its prospective bit bound.');
  tick(Math.max(width(a),width(b)));const n=a+b;checked(n);return n;
 }
 function quotient(a,b){if(!b)throw Error('Zero exact certificate divisor.');tick(width(a)*width(b));return a/b;}
 function gcd(a,b){
  a=a<0n?-a:a;b=b<0n?-b:b;
  while(b){tick(width(a)*width(b));const remainder=a%b;a=b;b=remainder;}
  return a;
 }
 function shift(n,k){
  if(!Number.isSafeInteger(k)||k<0||k>limit.integerBits||n&&size(n)+k>limit.integerBits)stop('Finite-curve certificate shift exceeds its prospective bit bound.');
  tick(Math.max(1,Math.ceil((size(n)+k)/32)));return n<<BigInt(k);
 }
 function make(n,d=1n){
  tick();checked(n);checked(d);if(!d)throw Error('Zero exact certificate denominator.');
  if(d<0n){n=-n;d=-d;}if(!n)d=1n;
  else{const g=gcd(n,d);n=quotient(n,g);d=quotient(d,g);}
  const q=Object.freeze({n,d});owned.add(q);return q;
 }
 const check=q=>{tick();if(!q||!owned.has(q))throw Error('Foreign exact certificate value.');return q;};
 const integer=n=>{if(!Number.isSafeInteger(n))throw Error('Expected a safe exact certificate integer.');return make(BigInt(n));};
 function number(n){
  if(typeof n!=='number'||!Number.isFinite(n))throw Error('Expected finite binary64 certificate input.');
  tick();if(n===0)return make(0n);view.setFloat64(0,n,false);
  // The fixed IEEE decode never creates more than53 mantissa bits.
  const high=view.getUint32(0,false),low=view.getUint32(4,false),raw=(high>>>20)&2047;
  let mantissa=(BigInt(high&1048575)<<32n)|BigInt(low);if(raw)mantissa|=1n<<52n;if(high>>>31)mantissa=-mantissa;
  const exponent=raw?raw-1075:-1074;
  return exponent>=0?make(shift(mantissa,exponent)):make(mantissa,shift(1n,-exponent));
 }
 function add(a,b){
  check(a);check(b);const g=gcd(a.d,b.d),ad=quotient(a.d,g),bd=quotient(b.d,g);
  return make(sum(product(a.n,bd),product(b.n,ad)),product(a.d,bd));
 }
 const neg=a=>{check(a);return make(-a.n,a.d);};
 const sub=(a,b)=>add(a,neg(b));
 function mul(a,b){
  check(a);check(b);const g=gcd(a.n,b.d),h=gcd(b.n,a.d);
  return make(product(quotient(a.n,g),quotient(b.n,h)),product(quotient(a.d,h),quotient(b.d,g)));
 }
 function div(a,b){check(a);check(b);if(!b.n)throw Error('Zero exact certificate divisor.');return mul(a,make(b.d,b.n));}
 function cmp(a,b){
  check(a);check(b);const g=gcd(a.d,b.d),x=product(a.n,quotient(b.d,g)),y=product(b.n,quotient(a.d,g));
  return x<y?-1:x>y?1:0;
 }
 const sign=a=>{check(a);return a.n<0n?-1:a.n>0n?1:0;};
 const abs=a=>sign(a)<0?neg(a):a;
 const min=(a,b)=>cmp(a,b)<=0?a:b,max=(a,b)=>cmp(a,b)>=0?a:b;
 function encode(a){check(a);tick(width(a.n)+width(a.d));return Object.freeze({numeratorHex:a.n.toString(16),denominatorHex:a.d.toString(16)});}
 // Exact adjacent represented values only grow a proof box around an ACTUAL
 // Native candidate; this operation never issues a replacement root.
 function neighbor(n,up){
  tick();if(typeof n!=='number'||!Number.isFinite(n)||typeof up!=='boolean')throw Error('Expected finite candidate coordinate/direction.');
  if(n===0)return up?Number.MIN_VALUE:-Number.MIN_VALUE;
  view.setFloat64(0,n,false);let bits=(BigInt(view.getUint32(0,false))<<32n)|BigInt(view.getUint32(4,false));
  bits+=(n>0)===up?1n:-1n;view.setUint32(0,Number(bits>>32n),false);view.setUint32(4,Number(bits&4294967295n),false);
  const result=view.getFloat64(0,false);return Number.isFinite(result)?result:null;
 }
 return Object.freeze({integer,number,add,neg,sub,mul,div,cmp,sign,abs,min,max,encode,neighbor,tick,get work(){return work;}});
}
