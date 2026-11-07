// Exact signed origin-tetrahedron integral of represented binary64 triangles.
// No closure, orientation, manifold, material or native-solid validity proof.
export const MAX_EXACT_VOLUME_TRIANGLES=100000;
const fail=(code,message)=>{throw Object.assign(Error(message),{code});};
const typed=Object.getPrototypeOf(Float64Array.prototype);
const tag=Object.getOwnPropertyDescriptor(typed,Symbol.toStringTag).get;
const bufferOf=Object.getOwnPropertyDescriptor(typed,'buffer').get;
const lengthOf=Object.getOwnPropertyDescriptor(typed,'length').get;
function coordinates(value){
 let buffer,length;
 try{if(tag.call(value)!=='Float64Array')fail('INVALID_MESH','Expected flat Float64Array triangle coordinates.');buffer=bufferOf.call(value);length=lengthOf.call(value);}catch{fail('INVALID_MESH','Expected flat Float64Array triangle coordinates.');}
 if(typeof SharedArrayBuffer!=='undefined'){let shared=false;try{Object.getOwnPropertyDescriptor(SharedArrayBuffer.prototype,'byteLength').get.call(buffer);shared=true;}catch{}if(shared)fail('INVALID_MESH','Shared mutable coordinate buffers are unsupported.');}
 try{ArrayBuffer.prototype.slice.call(buffer,0,0);}catch{fail('INVALID_MESH','Detached coordinate buffers are unsupported.');}
 return length;
}
function limitOf(options){
 if(!options||typeof options!=='object'||Array.isArray(options)||Reflect.ownKeys(options).some(k=>k!=='maxTriangles'))fail('INVALID_MESH','Expected exact mesh-volume options.');
 const d=Object.getOwnPropertyDescriptor(options,'maxTriangles');
 if(d&&(!d.enumerable||!Object.hasOwn(d,'value')))fail('INVALID_MESH','Mesh work limit must be own data.');
 const limit=d?d.value:MAX_EXACT_VOLUME_TRIANGLES;
 if(!Number.isSafeInteger(limit)||limit<1||limit>MAX_EXACT_VOLUME_TRIANGLES)fail('INVALID_MESH','Invalid mesh work limit.');return limit;
}
// Round N*2^scale/6 ONCE to the binary64 grid. No Number(largeBigInt),
// fractional powers below -1074, or prior significand rounding is performed.
function roundedIntegral(n,scale){
 if(n===0n)return 0;
 const negative=n<0n;if(negative)n=-n;
 const bits=n.toString(2).length,relative=bits-3;
 const atLeast=relative>=0?n>=(6n<<BigInt(relative)):(n<<BigInt(-relative))>=6n;
 const exponent=relative+scale-(atLeast?0:1);
 if(exponent>1023)fail('MESH_VOLUME_NUMERIC_RANGE','Exact mesh integral overflows binary64.');
 const quantum=Math.max(exponent-52,-1074),shift=scale-quantum;
 const numerator=shift>=0?n<<BigInt(shift):n,denominator=shift>=0?6n:6n<<BigInt(-shift);
 let q=numerator/denominator;const remainder=numerator%denominator,twice=remainder*2n;
 if(twice>denominator||twice===denominator&&(q&1n)===1n)q++;
 if(q===0n)fail('MESH_VOLUME_NUMERIC_RANGE','Nonzero exact mesh integral rounds below binary64 range.');
 // The quantized integer has at most54 bits (a carry at the normal boundary),
 // and is exactly representable. The power itself is in binary64 range.
 const volume=Number(q)*2**quantum;
 if(!Number.isFinite(volume))fail('MESH_VOLUME_NUMERIC_RANGE','Exact mesh integral rounds beyond binary64 range.');
 return negative?-volume:volume;
}
export function measureExactSignedMeshVolume(positions,options={}){
 const limit=limitOf(options),length=coordinates(positions),triangles=length/9;
 if(length%9!==0)fail('INVALID_MESH','Expected nine coordinates per oriented triangle.');
 if(triangles>limit)fail('RESOURCE_LIMIT','Exact mesh integral triangle limit exceeded.');
 const bytes=new ArrayBuffer(8),view=new DataView(bytes);let minimum=Infinity;
 // Pass1 validates the unshared typed input and finds one common dyadic scale.
 // No coordinate cache, per-shell grouping or floating point subtraction.
 for(let i=0;i<length;i++){
  const value=positions[i];if(!Number.isFinite(value))fail('INVALID_MESH','Mesh coordinates must be finite.');
  if(value!==0){view.setFloat64(0,value);const e=(view.getUint32(0)>>>20)&2047;minimum=Math.min(minimum,e?e-1075:-1074);}
 }
 let sum=0n;
 if(minimum!==Infinity){
  const integer=value=>{if(value===0)return 0n;view.setFloat64(0,value);const hi=view.getUint32(0),lo=view.getUint32(4),e=(hi>>>20)&2047,exponent=e?e-1075:-1074;let m=(BigInt((hi&0xfffff)+(e?0x100000:0))<<32n)+BigInt(lo);m<<=BigInt(exponent-minimum);return hi>>>31?-m:m;};
  for(let i=0;i<length;i+=9){
   const ax=integer(positions[i]),ay=integer(positions[i+1]),az=integer(positions[i+2]),bx=integer(positions[i+3]),by=integer(positions[i+4]),bz=integer(positions[i+5]),cx=integer(positions[i+6]),cy=integer(positions[i+7]),cz=integer(positions[i+8]);
   sum+=ax*(by*cz-bz*cy)-ay*(bx*cz-bz*cx)+az*(bx*cy-by*cx);
  }
 }
 const signedVolume=minimum===Infinity?0:roundedIntegral(sum,3*minimum);
 return Object.freeze({signedVolume,triangles,arithmetic:'exact-represented-binary64',rounding:'nearest-even'});
}
