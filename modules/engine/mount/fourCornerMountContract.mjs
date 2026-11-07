// Safe copies at the mount boundary; geometry is validated in the worker.
const fail = () => { throw Error('Invalid four-corner mount data'); };
function fields(value, keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail();
  const own = Reflect.ownKeys(value);
  if (own.length !== keys.length || own.some(k => typeof k !== 'string' || !keys.includes(k))) fail();
  const result = {};
  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor?.enumerable || !Object.hasOwn(descriptor, 'value')) fail();
    result[key] = descriptor.value;
  }
  return result;
}
const nonempty = (value, limit) => typeof value === 'string' && value.length > 0 && value.length <= limit;
const feature = value => nonempty(value, 16) && /^[1-9][0-9]*$/.test(value) && Number.isSafeInteger(Number(value));
export function captureFourCornerRequest(value) {
  const keys=['version','unit','featureId','parentFeatureId','centerFeatureId','revision','sketchDigest','faceId','regionId','sideIds','offsetX','offsetY','diameter'];
  const request=fields(value,keys);
  const sides=fields(request.sideIds,['minX','maxX','minY','maxY']);
  if(request.version!==1 || request.unit!=='millimeter' ||
     !['featureId','parentFeatureId','centerFeatureId'].every(k=>feature(request[k])) ||
     new Set([request.featureId,request.parentFeatureId,request.centerFeatureId]).size!==3 ||
     !nonempty(request.revision,256) || !/^[a-f0-9]{64}$/.test(request.sketchDigest) ||
     !nonempty(request.faceId,1024) || !nonempty(request.regionId,8192) ||
     !Object.values(sides).every(v=>nonempty(v,1024)) || new Set(Object.values(sides)).size!==4 ||
     !['offsetX','offsetY','diameter'].every(k=>Number.isFinite(request[k]) && request[k]>0 && request[k]<=1e6)) fail();
  request.sideIds=sides;
  return request;
}
export function captureFourCornerBinding(value) {
  const keys=['unit','revision','sketchDigest','faceId','regionId','featureId','parentFeatureId','centerFeatureId','sideIds','offsetX','offsetY','diameter','centerDiameter'];
  const binding=fields(value,keys);
  const request=captureFourCornerRequest({version:1,unit:binding.unit,featureId:binding.featureId,parentFeatureId:binding.parentFeatureId,centerFeatureId:binding.centerFeatureId,revision:binding.revision,sketchDigest:binding.sketchDigest,faceId:binding.faceId,regionId:binding.regionId,sideIds:binding.sideIds,offsetX:binding.offsetX,offsetY:binding.offsetY,diameter:binding.diameter});
  if(!Number.isFinite(binding.centerDiameter)||binding.centerDiameter<=0||binding.centerDiameter>1e6)fail();
  return {unit:request.unit,revision:request.revision,sketchDigest:request.sketchDigest,faceId:request.faceId,regionId:request.regionId,featureId:request.featureId,parentFeatureId:request.parentFeatureId,centerFeatureId:request.centerFeatureId,sideIds:request.sideIds,offsetX:request.offsetX,offsetY:request.offsetY,diameter:request.diameter,centerDiameter:binding.centerDiameter};
}
export function copyFourCornerTopology(value) {
  let nodes=0;
  function copy(v,depth) {
    if(++nodes>100000 || depth>16) fail();
    if(v===null || typeof v==='boolean') return v;
    if(typeof v==='string') {if(v.length>8192)fail();return v;}
    if(typeof v==='number') {if(!Number.isFinite(v))fail();return v;}
    if(!v || typeof v!=='object') fail();
    const keys=Reflect.ownKeys(v);
    if(keys.some(k=>typeof k!=='string' || ['ptr','ref','edgeRef','__proto__','constructor','prototype'].includes(k))) fail();
    if(Array.isArray(v)) {
      if(v.length>4096 || keys.length!==v.length+1)fail();
      return Array.from({length:v.length},(_,i)=>{const d=Object.getOwnPropertyDescriptor(v,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value'))fail();return copy(d.value,depth+1);});
    }
    if(![Object.prototype,null].includes(Object.getPrototypeOf(v)) || keys.length>32) fail();
    const out={};
    for(const key of keys){const d=Object.getOwnPropertyDescriptor(v,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail();out[key]=copy(d.value,depth+1);}
    return out;
  }
  const result=copy(value,0);
  const keys=['version','scope','solidCount','valid','signedVolume','vertices','faces','parentFaces','toolFaces','operation','fourCornerTools'];
  if(!result || Object.keys(result).sort().join(',')!==keys.sort().join(',') || result.version!==1 || result.scope!=='response-local' || result.operation!=='codi-four-corner-cut/1' || result.solidCount!==1 || result.valid!==true || !Array.isArray(result.faces) || result.faces.length!==11 || !Array.isArray(result.vertices) || result.vertices.length!==18 || !Array.isArray(result.parentFaces) || result.parentFaces.length!==7 || !Array.isArray(result.fourCornerTools) || result.fourCornerTools.length!==4 || new TextEncoder().encode(JSON.stringify(result)).byteLength>524288) fail();
  return result;
}
