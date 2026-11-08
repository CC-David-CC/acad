// Worker-only scalar signs of represented binary64 source equations.
// This neither constructs geometry nor certifies a Native result.
const bits=new DataView(new ArrayBuffer(8));
const fail=()=>{throw Object.assign(Error('Unqualified circular source arithmetic.'),{code:'INVALID_PROFILE'});};
function binary(value){
 if(typeof value!=='number'||!Number.isFinite(value)||Math.abs(value)>4e6)fail();
 bits.setFloat64(0,value,false);const high=bits.getUint32(0,false),low=bits.getUint32(4,false),exponent=(high>>>20)&2047;
 const magnitude=(BigInt(high&0xfffff)<<32n)|BigInt(low),mantissa=exponent?magnitude|(1n<<52n):magnitude;
 return{mantissa:high>>>31?-mantissa:mantissa,exponent:exponent?exponent-1075:-1074};
}
function sign(terms){
 const products=[];let minimum=Infinity;
 for(const[a,b,coefficient]of terms){const x=binary(a),y=binary(b),mantissa=x.mantissa*y.mantissa*BigInt(coefficient);if(!mantissa)continue;const exponent=x.exponent+y.exponent;products.push({mantissa,exponent});minimum=Math.min(minimum,exponent);}
 let total=0n;for(const p of products){const shift=p.exponent-minimum;if(!Number.isInteger(shift)||shift<0||shift>2304)fail();total+=p.mantissa<<BigInt(shift);}
 return total<0n?-1:total>0n?1:0;
}
function distance(a,b,sum){return sign([[a.center[0],a.center[0],1],[b.center[0],b.center[0],1],[a.center[0],b.center[0],-2],[a.center[1],a.center[1],1],[b.center[1],b.center[1],1],[a.center[1],b.center[1],-2],[a.radius,a.radius,-1],[b.radius,b.radius,-1],[a.radius,b.radius,sum?-2:2]]);}
export function circularRelation(a,b){
 if(a.center[0]===b.center[0]&&a.center[1]===b.center[1]&&a.radius===b.radius)return'coincident';
 const sum=distance(a,b,true);if(sum>0)return'disjoint';if(sum===0)return'external-tangent';const difference=distance(a,b,false);if(difference>0)return'proper-overlap';if(difference===0)return'internal-tangent';return a.radius>b.radius?'nested-0':'nested-1';
}
export function circlePointSign(circle,point){return sign([[point[0],point[0],1],[circle.center[0],circle.center[0],1],[point[0],circle.center[0],-2],[point[1],point[1],1],[circle.center[1],circle.center[1],1],[point[1],circle.center[1],-2],[circle.radius,circle.radius,-1]]);}
export function circularEventSide(a,b,point){return sign([[b.center[0],point[1],1],[b.center[1],point[0],-1],[a.center[0],point[1],-1],[a.center[1],point[0],1],[b.center[0],a.center[1],-1],[b.center[1],a.center[0],1]]);}
