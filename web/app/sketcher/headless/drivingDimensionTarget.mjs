// Revision-bound discovery addresses. These are never persisted constraint IDs.
const fail=(code,message)=>{throw Object.assign(Error(message),{code});};
export const drivingLengthField=type=>type==='SegmentLength'?'length':type==='DiameterLength'?'diameter':null;
const identifier=/^[A-Za-z_$][A-Za-z0-9_$]{0,127}$/;
const positive=v=>typeof v==='number'&&Number.isFinite(v)&&v>0&&v<=1e6;
/** @returns {Readonly<{constraintId:string,value?:number|string}>} */
export function captureDrivingDimensionIntent(value,action){
 const keys=action==='edit'?['constraintId','value']:action==='remove'?['constraintId']:null;
 if(!keys||!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value))||Reflect.ownKeys(value).length!==keys.length)fail('INVALID','Invalid existing dimension intent.');
 const out={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('INVALID','Dimension fields must be data.');out[key]=d.value;}
 if(typeof out.constraintId!=='string'||!out.constraintId||out.constraintId.length>4096)fail('INVALID','Choose an inspected driving dimension.');
 if(action==='edit'&&!positive(out.value)&&!(typeof out.value==='string'&&identifier.test(out.value)))fail('INVALID','Use positive bounded millimeters or a typed length identifier.');
 return Object.freeze(out);
}
export function dimensionLocator(stage,index,constraint){return 'sketch-driving-constraint:1:'+JSON.stringify([stage,index,constraint.typeId,constraint.objects]);}
export function discoverDrivingDimensions(sketch){
 const objects=new Map(sketch.objects.map(o=>[o.id,o])),rows=[];
 sketch.stages.forEach((stage,si)=>stage.constraints.forEach((c,index)=>{
  const field=drivingLengthField(c.typeId),o=c.objects?.length===1?objects.get(c.objects[0]):null;
  const supported=!!field&&!!o&&(c.typeId==='SegmentLength'?o.type==='Segment':['Circle','Arc'].includes(o.type))&&
   c.constants&&Object.keys(c.constants).length===1&&Object.hasOwn(c.constants,field)&&['string','number'].includes(typeof c.constants[field]);
  let resolvedValue=null;if(supported){const d=o.data;resolvedValue=o.type==='Segment'?Math.hypot(d.b.x-d.a.x,d.b.y-d.a.y):2*(o.type==='Circle'?d.r:Math.hypot(d.a.x-d.c.x,d.a.y-d.c.y));}
  const admitted=supported&&positive(resolvedValue)&&['accepted','redundant'].includes(c.admission?.state);
  rows.push(Object.freeze({constraintId:admitted?dimensionLocator(si,index,c):null,stage:si,index,typeId:c.typeId,objects:Object.freeze([...c.objects]),unit:field?'millimeter':null,
   rawValue:field&&c.constants&&Object.hasOwn(c.constants,field)?c.constants[field]:null,resolvedValue:admitted?resolvedValue:null,canEdit:admitted,canRemove:admitted,
   reason:admitted?null:!field?'Unsupported driving-dimension schema.':'A bounded driving dimension on a current authored object is required.'}));
 }));return Object.freeze(rows);
}
export function resolveDrivingDimension(sketch,id){const row=discoverDrivingDimensions(sketch).find(r=>r.constraintId===id);if(!row)fail('INVALID_TARGET','The discovered driving dimension is unavailable.');return row;}
/** @returns {Readonly<Record<string, any>>} */
export function captureDrivingDimensionReply(value,revision){
 const record=(v,keys)=>{if(!v||typeof v!=='object'||Array.isArray(v)||![Object.prototype,null].includes(Object.getPrototypeOf(v))||Reflect.ownKeys(v).length!==keys.length)fail('INVALID_RESPONSE','Invalid dimension response.');const o={};for(const k of keys){const d=Object.getOwnPropertyDescriptor(v,k);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('INVALID_RESPONSE','Dimension response fields must be data.');o[k]=d.value;}return o;};
 const ok=value&&Object.getOwnPropertyDescriptor(value,'ok');if(!ok?.enumerable||!Object.hasOwn(ok,'value'))fail('INVALID_RESPONSE','Dimension outcome must be data.');
 if(ok.value===false){const r=record(value,['revision','ok','error']);if(r.revision!==revision)fail('INVALID_RESPONSE','Dimension failure revision changed.');return Object.freeze(r);}
 const r=record(value,['revision','ok','changed','serializedSketch','evidence','dimension']),d=record(r.dimension,['constraintId','action','typeId','objects','rawValue','resolvedValue','status']);
 if(r.revision!==revision||r.ok!==true||typeof r.changed!=='boolean'||typeof r.serializedSketch!=='string'||r.serializedSketch.length>1048576||!Array.isArray(r.evidence)||r.evidence.length>10000||typeof d.constraintId!=='string'||!d.constraintId||d.constraintId.length>4096||!['edit','remove'].includes(d.action)||!drivingLengthField(d.typeId)||!Array.isArray(d.objects)||Object.getPrototypeOf(d.objects)!==Array.prototype||d.objects.length!==1||Reflect.ownKeys(d.objects).length!==2)fail('INVALID_RESPONSE','Invalid dimension response identity.');
 const obj=Object.getOwnPropertyDescriptor(d.objects,'0');if(!obj?.enumerable||!Object.hasOwn(obj,'value')||typeof obj.value!=='string'||!obj.value||obj.value.length>256)fail('INVALID_RESPONSE','Invalid dimension object.');
 if(d.action==='remove'?(d.rawValue!==null||d.resolvedValue!==null||d.status!=='removed'||!r.changed):(!['string','number'].includes(typeof d.rawValue)||typeof d.rawValue==='number'&&!Number.isFinite(d.rawValue)||String(d.rawValue).length>4096||!positive(d.resolvedValue)||!['accepted','redundant'].includes(d.status)))fail('INVALID_RESPONSE','Invalid dimension value/status.');
 return Object.freeze({...r,dimension:Object.freeze({...d,objects:Object.freeze([obj.value])})});
}
const equal=(a,b)=>{if(a===b)return true;if(!a||!b||typeof a!=='object'||typeof b!=='object'||Array.isArray(a)!==Array.isArray(b))return false;const x=Object.keys(a),y=Object.keys(b);return x.length===y.length&&x.every(k=>Object.hasOwn(b,k)&&equal(a[k],b[k]));};
const semantic=c=>{const x={...c};delete x.admission;return x;};
function base(sketch){return {...sketch,objects:sketch.objects.map(o=>({...o,data:null})),stages:sketch.stages.map(s=>({...s,constraints:[]}))};}
// Structural proof only; real solver and geometry/residual validation required.
export function classifyDrivingDimensionDelta(before,after){
 if(!equal(base(before),base(after)))fail('INTENT_CHANGED','Unrelated sketch intent changed.');let change=null;
 for(let stage=0;stage<before.stages.length;stage++){
  const a=before.stages[stage].constraints,b=after.stages[stage].constraints;
  let i=0;while(i<Math.min(a.length,b.length)&&equal(semantic(a[i]),semantic(b[i])))i++;
  if(a.length===b.length&&i===a.length)continue;
  if(change||Math.abs(a.length-b.length)>1)fail('INTENT_CHANGED','Exactly one existing dimension may change.');
  const action=a.length===b.length?'edit':a.length>b.length?'remove':'insert',c=action==='insert'?b[i]:a[i],field=drivingLengthField(c?.typeId);
  if(!field||c.objects?.length!==1||!c.constants||Object.keys(c.constants).length!==1)fail('UNSUPPORTED','Only segment lengths and diameters may change.');
  if(action==='edit'){
   const restored={...b[i],constants:{...b[i].constants,[field]:c.constants[field]}};
   if(!equal(semantic(c),semantic(restored)))fail('INTENT_CHANGED','The dimension identity or annotation changed.');
  }
  const offset=action==='remove'?1:0,other=action==='insert'?1:0;
  for(let j=i+(action==='edit'?1:0);j+offset<a.length;j++)if(!equal(semantic(a[j+offset]),semantic(b[j+other])))fail('INTENT_CHANGED','Other constraints changed.');
  const source=action==='insert'?after:before,row=resolveDrivingDimension(source,dimensionLocator(stage,i,c));
  change={action,stage,index:i,typeId:c.typeId,objects:[...c.objects],field,beforeValue:action==='insert'?null:c.constants[field],afterValue:action==='remove'?null:b[i].constants[field],constraintId:row.constraintId};
 }
 return change?Object.freeze(change):null;
}
