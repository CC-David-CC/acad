import {planFourCornerHoles} from './fourCornerHolePlan.mjs';

// Geometry-only discovery on a prepared profile. The caller must separately
// bind the profile to the current authored sketch, revision, and candidate.
const fail=()=>{throw Object.assign(new Error('Rectangle side roles are unsupported or ambiguous.'),{code:'UNSUPPORTED_PROFILE'});};
function snapshot(value,depth=0,budget={nodes:0,chars:0}){
 if(++budget.nodes>4096||depth>12)fail();
 if(value===null||typeof value==='boolean')return value;
 if(typeof value==='number'){if(!Number.isFinite(value))fail();return value;}
 if(typeof value==='string'){if((budget.chars+=value.length)>32768)fail();return value;}
 if(!value||typeof value!=='object')fail();
 const keys=Reflect.ownKeys(value);if(keys.some(k=>typeof k!=='string'))fail();
 if(Array.isArray(value)){
  if(value.length>32||keys.length!==value.length+1)fail();
  return Array.from({length:value.length},(_,i)=>{const d=Object.getOwnPropertyDescriptor(value,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value'))fail();return snapshot(d.value,depth+1,budget);});
 }
 const prototype=Object.getPrototypeOf(value);if(prototype!==null&&Object.getPrototypeOf(prototype)!==null||keys.length>24)fail();
 const out=Object.create(null);for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(key==='__proto__'||!d?.enumerable||!Object.hasOwn(d,'value')||(budget.chars+=key.length)>32768)fail();out[key]=snapshot(d.value,depth+1,budget);}return out;
}
export function discoverFourCornerSideIds(preparedProfile){
 const p=snapshot(preparedProfile);
 if(!Array.isArray(p.edges)||p.edges.length!==4||!Array.isArray(p.worldVertices)||p.worldVertices.length!==4)fail();
 const roles=Object.create(null),lengths=[];
 for(let i=0;i<4;i++){
  const a=p.worldVertices[i],b=p.worldVertices[(i+1)%4],edge=p.edges[i];
  if(!Array.isArray(a)||a.length!==3||!Array.isArray(b)||b.length!==3||typeof edge?.id!=='string'||!edge.id)fail();
  const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);
  if(!Number.isFinite(length)||length<=1e-5)fail();
  const horizontal=Math.abs(dy)<=length*1e-8,vertical=Math.abs(dx)<=length*1e-8;
  if(horizontal===vertical)fail();
  const role=horizontal?(dx>0?'minY':'maxY'):(dy>0?'maxX':'minX');
  if(Object.hasOwn(roles,role))fail();roles[role]=edge.id;lengths.push(length);
 }
 const sideIds={minX:roles.minX,maxX:roles.maxX,minY:roles.minY,maxY:roles.maxY};
 if(Object.values(sideIds).some(v=>typeof v!=='string')||new Set(Object.values(sideIds)).size!==4)fail();
 // Reuse the authoritative planner's complete profile/frame/region admission,
 // with a small in-bounds synthetic pattern only to validate classification.
 // These dimensions are never returned or used as a user's hole intent.
 const span=Math.min(...lengths),diameter=span/100,offset=span/10;
 const center={version:1,unit:'millimeter',revision:p.revision,sketchDigest:p.sketchDigest,faceId:p.faceId,regionId:p.regionId,diameter:span/10};
 const request={version:1,unit:'millimeter',featureId:'3',parentFeatureId:'1',centerFeatureId:'2',revision:p.revision,sketchDigest:p.sketchDigest,faceId:p.faceId,regionId:p.regionId,sideIds,offsetX:offset,offsetY:offset,diameter};
 try{planFourCornerHoles(p,center,request);}catch{fail();}
 return Object.freeze(sideIds);
}
