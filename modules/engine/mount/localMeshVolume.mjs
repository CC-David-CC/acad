// A signed integral over already-oriented, closed triangle meshes. This does
// not validate closure, manifoldness, material classification or native CAD.
export const MAX_VOLUME_TRIANGLES=100000;
const fail=(code,message)=>{throw Object.assign(Error(message),{code})};
const finite=n=>{if(!Number.isFinite(n))fail('MESH_VOLUME_NUMERIC_RANGE','Mesh volume arithmetic exceeded binary64 range.');return n};
function product(a,b){const value=finite(a*b);if(value===0&&a!==0&&b!==0)fail('MESH_VOLUME_NUMERIC_RANGE','Mesh volume intermediate underflow.');return value}
function compensated(){let sum=0,correction=0;return {add(value){const next=finite(sum+value);correction=finite(correction+(Math.abs(sum)>=Math.abs(value)?(sum-next)+value:(value-next)+sum));sum=next},value(){return finite(sum+correction)}}}
function lengthOf(input){
 if(Array.isArray(input))return input.length;
 const proto=Object.getPrototypeOf(Float64Array.prototype),tag=Object.getOwnPropertyDescriptor(proto,Symbol.toStringTag).get.call(input);
 if(tag!=='Float64Array')fail('INVALID_MESH','Expected Float64Array or a dense coordinate array.');
 const buffer=Object.getOwnPropertyDescriptor(proto,'buffer').get.call(input);
 if(typeof SharedArrayBuffer!=='undefined'){let shared=false;try{Object.getOwnPropertyDescriptor(SharedArrayBuffer.prototype,'byteLength').get.call(buffer);shared=true}catch{}if(shared)fail('INVALID_MESH','Shared mutable coordinate buffers are unsupported.');}
 try{ArrayBuffer.prototype.slice.call(buffer,0,0)}catch{fail('INVALID_MESH','Detached coordinate buffers are unsupported.');}
 return Object.getOwnPropertyDescriptor(proto,'length').get.call(input);
}
export function measureSignedMeshVolume(positions,options={}){
 if(!options||typeof options!=='object'||Array.isArray(options)||Reflect.ownKeys(options).some(k=>k!=='maxTriangles'))fail('INVALID_MESH','Invalid mesh volume options.');
 const limit=Object.getOwnPropertyDescriptor(options,'maxTriangles');if(limit&&(!limit.enumerable||!Object.hasOwn(limit,'value')))fail('INVALID_MESH','Mesh volume limit must be data.');
 const maxTriangles=limit?limit.value:MAX_VOLUME_TRIANGLES;
 if(!Number.isSafeInteger(maxTriangles)||maxTriangles<1||maxTriangles>MAX_VOLUME_TRIANGLES)fail('INVALID_MESH','Invalid mesh volume work limit.');
 const length=lengthOf(positions),triangles=length/9;
 if(length%9!==0)fail('INVALID_MESH','Expected nine coordinates per oriented triangle.');
 if(triangles>maxTriangles)fail('RESOURCE_LIMIT','Mesh volume triangle work limit exceeded.');
 if(Array.isArray(positions)&&Reflect.ownKeys(positions).length!==length+1)fail('INVALID_MESH','Expected a dense own-data coordinate array.');
 if(length===0)return Object.freeze({signedVolume:0,triangles:0,anchor:null,absoluteTetrahedronSum:0,cancellationSensitive:false});
 const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity],array=Array.isArray(positions);
 for(let i=0;i<length;i++){
  let n;if(array){const d=Object.getOwnPropertyDescriptor(positions,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('INVALID_MESH','Expected dense own-data coordinates.');n=d.value}else n=positions[i];
  if(typeof n!=='number'||!Number.isFinite(n))fail('INVALID_MESH','Mesh coordinates must be finite numbers.');
  const axis=i%3;min[axis]=Math.min(min[axis],n);max[axis]=Math.max(max[axis],n);
 }
 // Division before addition keeps the reference finite for large same-sign
 // coordinates. This changes the integration reference, never mesh positions.
 const anchor=min.map((n,i)=>n/2+max[i]/2),total=compensated(),absolute=compensated();
 for(let i=0;i<length;i+=9){
  const a=[0,1,2].map(j=>finite(positions[i+j]-anchor[j]));
  const b=[0,1,2].map(j=>finite(positions[i+3+j]-positions[i+j]));
  const c=[0,1,2].map(j=>finite(positions[i+6+j]-positions[i+j]));
  const cross=[finite(product(b[1],c[2])-product(b[2],c[1])),finite(product(b[2],c[0])-product(b[0],c[2])),finite(product(b[0],c[1])-product(b[1],c[0]))],dot=compensated();
  for(let j=0;j<3;j++)dot.add(product(a[j],cross[j]));
  const determinant=dot.value(),volume=determinant/6;if(volume===0&&determinant!==0)fail('MESH_VOLUME_NUMERIC_RANGE','Mesh tetrahedron volume underflow.');
  total.add(volume);absolute.add(Math.abs(volume));
 }
 const signedVolume=total.value(),absoluteTetrahedronSum=absolute.value();
 // A conditioning diagnostic, NOT a rigorous roundoff/error certificate. A
 // common anchor can remain poor for widely separated or nearly cancelling
 // shells. Keep the estimate visible, but never present this as nativeVolume.
 const cancellationSensitive=absoluteTetrahedronSum>0&&Math.abs(signedVolume)*2**20<absoluteTetrahedronSum;
 return Object.freeze({signedVolume,triangles,anchor:Object.freeze(anchor),absoluteTetrahedronSum,cancellationSensitive});
}
