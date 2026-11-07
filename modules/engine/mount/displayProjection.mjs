// Worker-only traversal. Preview precision does not determine native validity.
export function createDisplayProjection(buffer,triangleCount){
 if(!(buffer instanceof ArrayBuffer)||!Number.isSafeInteger(triangleCount)||triangleCount<0||triangleCount>100000||buffer.byteLength!==triangleCount*72)throw Error('Invalid triangle transport.');
 const source=new Float64Array(buffer),positions=new Float32Array(source.length);
 for(let i=0;i<source.length;i++){
  if(!Number.isFinite(source[i]))throw Error('Nonfinite native display coordinate.');
  positions[i]=source[i];
  if(!Number.isFinite(positions[i]))return {status:'unavailable',reason:'float32-overflow',buffer:new ArrayBuffer(0)};
 }
 for(let i=0;i<positions.length;i+=9){
  const ax=positions[i+3]-positions[i],ay=positions[i+4]-positions[i+1],az=positions[i+5]-positions[i+2],bx=positions[i+6]-positions[i],by=positions[i+7]-positions[i+1],bz=positions[i+8]-positions[i+2];
  if(Math.hypot(ay*bz-az*by,az*bx-ax*bz,ax*by-ay*bx)===0)return {status:'unavailable',reason:'float32-collapsed-triangle',buffer:new ArrayBuffer(0)};
 }
 return {status:'available',reason:null,buffer:positions.buffer};
}
