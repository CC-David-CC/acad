// Observational failure metadata only. No source IDs, absolute coordinates,
// source text, selectors or model/solver authority. Shared strict wire capture.
const KEYS=Object.freeze(['version','kind','phase','unit','loopCount','segmentCount','loopIndex','vertexCount','distinctX','distinctY','distinctVertices','reason','edgeIndex','equalX','equalY','dx','dy']);
const REASONS=Object.freeze(['EDGE_COUNT','DISTINCT_X_COUNT','DISTINCT_Y_COUNT','NON_AXIS_EDGE','REPEATED_VERTEX']);
const invalid=()=>{throw Error('Invalid bounded rectangle arrangement diagnostic.');};
export function captureRectangleArrangementDiagnostic(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||![null,Object.prototype].includes(Object.getPrototypeOf(value)))invalid();
 const keys=Reflect.ownKeys(value);if(keys.length!==KEYS.length||keys.some(k=>typeof k!=='string'||!KEYS.includes(k)))invalid();
 const r={};for(const key of KEYS){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))invalid();r[key]=d.value;}
 if(r.version!==1||r.kind!=='rectangle-arrangement-eligibility'||r.phase!=='source-topology'||r.unit!=='millimeter'||r.loopCount!==2||r.segmentCount!==8||!Number.isInteger(r.loopIndex)||r.loopIndex<0||r.loopIndex>1||!REASONS.includes(r.reason))invalid();
 for(const key of ['vertexCount','distinctX','distinctY','distinctVertices'])if(!Number.isInteger(r[key])||r[key]<0||r[key]>8)invalid();
 if(['distinctX','distinctY','distinctVertices'].some(k=>r[k]>r.vertexCount))invalid();
 if(r.edgeIndex===null){if(['equalX','equalY','dx','dy'].some(k=>r[k]!==null))invalid();}
 else{
  if(!Number.isInteger(r.edgeIndex)||r.edgeIndex<0||r.edgeIndex>=r.vertexCount||typeof r.equalX!=='boolean'||typeof r.equalY!=='boolean')invalid();
  if(['dx','dy'].some(k=>typeof r[k]!=='number'||!Number.isFinite(r[k])||Math.abs(r[k])>2000000)||r.equalX!==(r.dx===0)||r.equalY!==(r.dy===0)||r.equalX!==r.equalY)invalid();
 }
 if(r.reason==='EDGE_COUNT'?r.vertexCount===4:r.vertexCount!==4)invalid();
 if(r.reason==='DISTINCT_X_COUNT'&&r.distinctX===2||r.reason==='DISTINCT_Y_COUNT'&&r.distinctY===2||r.reason==='NON_AXIS_EDGE'&&r.edgeIndex===null||r.reason==='REPEATED_VERTEX'&&r.distinctVertices===4)invalid();
 if(new TextEncoder().encode(JSON.stringify(r)).byteLength>1024)invalid();
 return Object.freeze(r);
}
