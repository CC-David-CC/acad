// New role-specific packet. This is a cut-face boundary, never Native HLR.
export const DRAWING_SECTION_LIMITS=Object.freeze({patches:16,uses:512,valueBytes:49152,tagBytes:2048,packedBytes:51200,transferBuffers:2});
const fail=message=>{throw Object.assign(Error(message),{code:'ENGINE_FAILURE'});};
const fields=(v,keys)=>{if(!v||typeof v!=='object'||Array.isArray(v)||Reflect.ownKeys(v).length!==keys.length)fail('Invalid section fields');for(const k of keys){const d=Object.getOwnPropertyDescriptor(v,k);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('Section fields must be own data');}return v;};
const bytes=Function.call.bind(Object.getOwnPropertyDescriptor(ArrayBuffer.prototype,'byteLength').get);
export function captureDrawingSectionTransfer(value,frame){
 const p=fields(value,['metadata','values','tags']),m=fields(p.metadata,['version','quality','frame','patchLengths','edgeCount','boundaryCount','area','valueBytes','tagBytes']);
 if(m.version!==1||m.quality!=='native-boolean-cap-set'||!Array.isArray(m.frame)||m.frame.length!==12||m.frame.some((n,i)=>!Number.isFinite(n)||!Object.is(n,frame[i]))||!Array.isArray(m.patchLengths)||m.patchLengths.length<1||m.patchLengths.length>16||m.patchLengths.some(n=>!Number.isSafeInteger(n)||n<3)||m.patchLengths.reduce((a,b)=>a+b,0)!==m.edgeCount||m.edgeCount>512||!Number.isSafeInteger(m.boundaryCount)||m.boundaryCount<3||m.boundaryCount>m.edgeCount||!Number.isFinite(m.area)||m.area<=0||m.valueBytes!==m.edgeCount*96||m.tagBytes!==m.edgeCount*4||bytes(p.values)!==m.valueBytes||bytes(p.tags)!==m.tagBytes||p.values===p.tags)fail('Invalid section packet');
 return Object.freeze({metadata:Object.freeze({...m,frame:Object.freeze([...m.frame]),patchLengths:Object.freeze([...m.patchLengths])}),values:p.values,tags:p.tags});
}
export function captureDrawingSectionPacket(value,frame){
 const p=captureDrawingSectionTransfer(value,frame),m=p.metadata;
 const values=new DataView(p.values),tags=new Uint8Array(p.tags);let at=0,boundaries=0,area=0;
 for(let patch=0;patch<m.patchLengths.length;patch++){
  const points=[];let sum=0;
  for(let edge=0;edge<m.patchLengths[patch];edge++,at++){
   const a=[values.getFloat64(at*96,true),values.getFloat64(at*96+8,true)],b=[values.getFloat64(at*96+16,true),values.getFloat64(at*96+24,true)];
   for(let j=0;j<12;j++){const n=values.getFloat64(at*96+j*8,true);if(!Number.isFinite(n)||Math.abs(n)>4e6||j>=4&&!Object.is(n,0))fail('Invalid section coordinate/padding');}
   if(tags[at*4]!==patch||tags[at*4+1]>1||tags[at*4+2]!==0||tags[at*4+3]!==0||a.every((n,i)=>Object.is(n,b[i])))fail('Invalid section edge tags');
   if(points.length&&points[points.length-1].some((n,i)=>!Object.is(n,a[i])))fail('Section patch is not an exact connected captured boundary');
   if(!edge)points.push(a);points.push(b);sum+=a[0]*b[1]-b[0]*a[1];boundaries+=tags[at*4+1];
  }
  if(points[0].some((n,i)=>!Object.is(n,points[points.length-1][i])))fail('Section patch is open');area+=Math.abs(sum)/2;
 }
 if(boundaries!==m.boundaryCount||!Object.is(area,m.area))fail('Section boundary/area receipt differs');
 return Object.freeze({metadata:Object.freeze({...m,frame:Object.freeze([...m.frame]),patchLengths:Object.freeze([...m.patchLengths])}),values:p.values,tags:p.tags});
}
export function unpackDrawingSection(value,frame){
 const p=captureDrawingSectionPacket(value,frame),data=new DataView(p.values),tags=new Uint8Array(p.tags),patches=[];let index=0;
 for(const count of p.metadata.patchLengths){const edges=[];for(let i=0;i<count;i++,index++)edges.push({start:[data.getFloat64(index*96,true),data.getFloat64(index*96+8,true)],end:[data.getFloat64(index*96+16,true),data.getFloat64(index*96+24,true)],boundary:tags[index*4+1]===1});patches.push(edges);}
 return{area:p.metadata.area,patches};
}
