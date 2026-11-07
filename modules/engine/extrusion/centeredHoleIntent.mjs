// Authored intent only. This validates neither placement geometry nor a cut.
// It has no native handle, coordinates, runtime URL or implicit target.
const fail=message=>{throw Object.assign(new Error(message),{code:'INVALID_HOLE_INTENT'});};
function record(value,keys){
 if(!value||typeof value!=='object'||Array.isArray(value)||Reflect.ownKeys(value).length!==keys.length)fail('Invalid hole intent fields.');
 const out=Object.create(null);
 for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('Hole intent must contain data fields only.');out[key]=d.value;}
 if(Reflect.ownKeys(value).some(key=>typeof key!=='string'||!keys.includes(key)))fail('Unexpected hole intent field.');return out;
}
const text=(s,max)=>typeof s==='string'&&s.length>0&&s.length<=max&&s.trim()===s;
const stable=tuple=>'worker-prism:1:'+JSON.stringify(tuple);
const featureId=s=>typeof s==='string'&&/^[1-9][0-9]{0,15}$/.test(s)&&Number.isSafeInteger(Number(s));
export function validateCenteredHoleTarget(value){
 const target=record(value,['parentFeatureId','bodyId','lidFaceId','regionId']);
 if(!text(target.parentFeatureId,256)||!text(target.bodyId,1024)||!text(target.lidFaceId,1024)||!text(target.regionId,8192)||!target.regionId.startsWith('sketch-region:'))fail('Invalid parent or region identity.');
 let region;try{region=JSON.parse(target.regionId.slice('sketch-region:'.length));}catch{fail('Invalid authored region.');}
 region=record(region,['faceId','outer','holes']);
 if(!text(region.faceId,256)||!Array.isArray(region.outer)||region.outer.length!==4||Reflect.ownKeys(region.outer).length!==5||!Array.isArray(region.holes)||region.holes.length!==0||Reflect.ownKeys(region.holes).length!==1)fail('The target must be one four-edge region without holes.');
 const edges=[];for(let i=0;i<4;i++){const d=Object.getOwnPropertyDescriptor(region.outer,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value')||!text(d.value,513)||!d.value.startsWith(region.faceId+'/'))fail('Invalid source edge identity.');edges.push(d.value);}
 if(new Set(edges).size!==4||edges.some((id,i)=>i>0&&edges[i-1]>=id)||target.regionId!=='sketch-region:'+JSON.stringify({faceId:region.faceId,outer:edges,holes:[]}))fail('Ambiguous or noncanonical region identity.');
 if(target.bodyId!==stable([target.parentFeatureId,'body'])||target.lidFaceId!==stable([target.parentFeatureId,'face','LID',{regionId:target.regionId}]))fail('Target identities do not match authored parent intent.');
 if(!featureId(target.parentFeatureId))fail('Invalid parent feature identity.');
 return Object.freeze({...target});
}
export function validateCenteredHoleIntent(value){
 const input=record(value,['version','kind','unit','featureId','target','placement','diameter','extent']);
 if(input.version!==1||input.kind!=='centered-through-hole'||input.unit!=='millimeter'||input.extent!=='through-all')fail('Unsupported hole intent.');
 if(!featureId(input.featureId))fail('Invalid hole feature identity.');
 if(typeof input.diameter!=='number'||!Number.isFinite(input.diameter)||input.diameter<=0||input.diameter>1e6)fail('Hole diameter must be finite and positive.');
 const placement=record(input.placement,['kind']);if(placement.kind!=='rectangle-center')fail('An explicit rectangle-center relationship is required.');
 const target=validateCenteredHoleTarget(input.target);if(input.featureId===target.parentFeatureId)fail('The hole and parent feature identities must differ.');
 return Object.freeze({version:1,kind:'centered-through-hole',unit:'millimeter',featureId:input.featureId,target,placement:Object.freeze({kind:'rectangle-center'}),diameter:input.diameter,extent:'through-all'});
}

// Convert a selected durable LID reference into authored intent. This is only
// syntax/identity validation: the candidate ledger must still resolve the exact
// current body and source profile before any engine operation is permitted.
export function centeredHoleIntentFromLid(value){
 const input=record(value,['featureId','lidFaceId','diameter']);
 if(!text(input.lidFaceId,1024)||!input.lidFaceId.startsWith('worker-prism:1:'))fail('Select a durable worker rectangle LID.');
 let key;try{key=JSON.parse(input.lidFaceId.slice('worker-prism:1:'.length));}catch{fail('Invalid LID reference.');}
 if(!Array.isArray(key)||key.length!==4||key[1]!=='face'||key[2]!=='LID')fail('Select the rectangle LID, not a side or temporary entity.');
 const source=record(key[3],['regionId']);
 return validateCenteredHoleIntent({version:1,kind:'centered-through-hole',unit:'millimeter',featureId:input.featureId,
  target:{parentFeatureId:key[0],bodyId:stable([key[0],'body']),lidFaceId:input.lidFaceId,regionId:source.regionId},
  placement:{kind:'rectangle-center'},diameter:input.diameter,extent:'through-all'});
}
