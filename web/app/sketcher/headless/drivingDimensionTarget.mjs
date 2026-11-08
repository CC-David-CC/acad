import {pointLineConstantsValid,pointLineSourceValue,pointLineSide} from '../constr/pointLineDistanceDomain.mjs';
// Revision-bound discovery addresses. These are never persisted constraint IDs.
const fail=(code,message)=>{throw Object.assign(Error(message),{code});};
export const pointLineDrivingDimension=type=>type==='DistancePL';
export const drivingDimensionConstantsValid=(type,c)=>pointLineDrivingDimension(type)?pointLineConstantsValid(c):!!c&&Object.keys(c).length===1&&Object.hasOwn(c,drivingLengthField(type));
export const projectedDrivingDimension=type=>type==='ProjectedDistance';
export const signedDrivingDimension=type=>type==='SignedDistanceX'||type==='SignedDistanceY'||projectedDrivingDimension(type);
export const pointDrivingDimension=type=>signedDrivingDimension(type)||type==='DistancePP';
export const drivingLengthField=type=>(type==='SegmentLength'||type==='RadiusLength')?'length':type==='DiameterLength'?'diameter':(pointDrivingDimension(type)||pointLineDrivingDimension(type))?'distance':null;
export const drivingDimensionObjectCount=type=>pointLineDrivingDimension(type)?2:projectedDrivingDimension(type)?3:drivingLengthField(type)?pointDrivingDimension(type)?2:1:0;
export const drivingDimensionValueValid=(type,v)=>typeof v==='number'&&Number.isFinite(v)&&!!drivingLengthField(type)&&(signedDrivingDimension(type)?Math.abs(v)<=1e6:type==='DistancePL'?v>=0:type==='DistancePP'?v>=0&&v<=1e6:v>0&&v<=1e6);
export const drivingPointDimensionValue=(type,a,b,direction)=>{if(projectedDrivingDimension(type)){const p=direction?.a,q=direction?.b;if(!p||!q||![a?.x,a?.y,b?.x,b?.y,p.x,p.y,q.x,q.y].every(Number.isFinite))return NaN;const dx=q.x-p.x,dy=q.y-p.y,length=Math.hypot(dx,dy);return length>1e-9?((b.x-a.x)*dx+(b.y-a.y)*dy)/length:NaN;}return type==='SignedDistanceX'?b.x-a.x:type==='SignedDistanceY'?b.y-a.y:type==='DistancePP'?Math.hypot(b.x-a.x,b.y-a.y):NaN;};
const identifier=/^[A-Za-z_$][A-Za-z0-9_$]{0,127}$/;
/** @returns {Readonly<{constraintId:string,value?:number|string}>} */
export function captureDrivingDimensionIntent(value,action){
 const keys=action==='edit'?['constraintId','value']:action==='remove'?['constraintId']:null;
 if(!keys||!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value))||Reflect.ownKeys(value).length!==keys.length)fail('INVALID','Invalid existing dimension intent.');
 const out={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('INVALID','Dimension fields must be data.');out[key]=d.value;}
 if(typeof out.constraintId!=='string'||!out.constraintId||out.constraintId.length>4096)fail('INVALID','Choose an inspected driving dimension.');
 if(action==='edit'&&!(typeof out.value==='number'&&Number.isFinite(out.value)&&Math.abs(out.value)<=1e6)&&!(typeof out.value==='string'&&identifier.test(out.value)))fail('INVALID','Use bounded canonical millimeters or a typed length identifier.');
 return Object.freeze(out);
}
export function dimensionLocator(stage,index,constraint){return 'sketch-driving-constraint:1:'+JSON.stringify([stage,index,constraint.typeId,constraint.objects]);}
// pointRows are private Worker projections of this exact verified source, never
// caller geometry authority. Metadata-only callers have no point-pair targets.
export function discoverDrivingDimensions(sketch,pointRows=[],supportingLines=undefined){
 const objects=new Map(sketch.objects.map(o=>[o.id,o])),rows=[];let pointMap=null;
 const points=()=>{if(pointMap)return pointMap;pointMap=new Map();
  if(!Array.isArray(pointRows)||pointRows.length>30000)fail('INVALID_TARGET','Invalid authored point projection.');
  for(const p of pointRows){if(!p||typeof p.id!=='string'||!p.id||p.id.length>256||!Number.isFinite(p.x)||!Number.isFinite(p.y)||pointMap.has(p.id))fail('INVALID_TARGET','Ambiguous or invalid authored point identity.');pointMap.set(p.id,p);}return pointMap;};
 sketch.stages.forEach((stage,si)=>stage.constraints.forEach((c,index)=>{
  const pointLine=pointLineDrivingDimension(c.typeId),field=drivingLengthField(c.typeId),pair=pointDrivingDimension(c.typeId),projected=projectedDrivingDimension(c.typeId),o=c.objects?.length===1?objects.get(c.objects[0]):null;
  let supported=!!field&&drivingDimensionConstantsValid(c.typeId,c.constants)&&['string','number'].includes(typeof c.constants[field]),resolvedValue=null;
  if(pointLine){const refs=c.objects,p=points(),line=objects.get(refs?.[1]);supported=!!supported&&Array.isArray(refs)&&refs.length===2&&p.has(refs[0])&&line?.type==='Segment'&&Number.isSafeInteger(line.stage)&&line.stage<=si;
   if(supported)resolvedValue=pointLineSourceValue(p.get(refs[0]),line.data);
   if(supportingLines!==undefined&&!supportingLines.has(dimensionLocator(si,index,c)))supported=false;
  }else if(pair){const refs=c.objects,p=points();supported=!!supported&&Array.isArray(refs)&&refs.length===drivingDimensionObjectCount(c.typeId)&&refs[0]!==refs[1]&&refs.slice(0,2).every(id=>typeof id==='string'&&id.length>0&&id.length<=256&&p.has(id));
   const direction=projected?objects.get(refs?.[2]):null;if(projected)supported=!!supported&&typeof refs[2]==='string'&&refs[2].length>0&&refs[2].length<=256&&direction?.type==='Segment'&&Number.isSafeInteger(direction.stage)&&direction.stage<=si;
   if(supported)resolvedValue=drivingPointDimensionValue(c.typeId,p.get(refs[0]),p.get(refs[1]),direction?.data);}
  else{supported=!!supported&&!!o&&(c.typeId==='SegmentLength'?o.type==='Segment':['Circle','Arc'].includes(o.type));if(supported){const d=o.data;resolvedValue=o.type==='Segment'?Math.hypot(d.b.x-d.a.x,d.b.y-d.a.y):(c.typeId==='RadiusLength'?1:2)*(o.type==='Circle'?d.r:Math.hypot(d.a.x-d.c.x,d.a.y-d.c.y));}}
  const admitted=supported&&drivingDimensionValueValid(c.typeId,resolvedValue)&&['accepted','redundant'].includes(c.admission?.state);
  rows.push(Object.freeze({constraintId:admitted?dimensionLocator(si,index,c):null,stage:si,index,typeId:c.typeId,objects:Object.freeze([...c.objects]),unit:field?'millimeter':null,
   rawValue:field&&c.constants&&Object.hasOwn(c.constants,field)?c.constants[field]:null,resolvedValue:admitted?resolvedValue:null,canEdit:admitted,canRemove:admitted,
   reason:admitted?null:!field?'Unsupported driving-dimension schema.':'A bounded driving dimension on current authored objects is required.',...(pointLine?{supportingLine:admitted?(supportingLines?.get(dimensionLocator(si,index,c))??null):null}:{})}));
 }));return Object.freeze(rows);
}
export function resolveDrivingDimension(sketch,id,pointRows=[],supportingLines=undefined){const row=discoverDrivingDimensions(sketch,pointRows,supportingLines).find(r=>r.constraintId===id);if(!row)fail('INVALID_TARGET','The discovered driving dimension is unavailable.');return row;}
/** @returns {Readonly<Record<string, any>>} */
export function captureDrivingDimensionReply(value,revision){
 const record=(v,keys)=>{if(!v||typeof v!=='object'||Array.isArray(v)||![Object.prototype,null].includes(Object.getPrototypeOf(v))||Reflect.ownKeys(v).length!==keys.length)fail('INVALID_RESPONSE','Invalid dimension response.');const o={};for(const k of keys){const d=Object.getOwnPropertyDescriptor(v,k);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('INVALID_RESPONSE','Dimension response fields must be data.');o[k]=d.value;}return o;};
 const ok=value&&Object.getOwnPropertyDescriptor(value,'ok');if(!ok?.enumerable||!Object.hasOwn(ok,'value'))fail('INVALID_RESPONSE','Dimension outcome must be data.');
 if(ok.value===false){const r=record(value,['revision','ok','error']);if(r.revision!==revision)fail('INVALID_RESPONSE','Dimension failure revision changed.');return Object.freeze(r);}
 const r=record(value,['revision','ok','changed','serializedSketch','evidence','dimension']),d=record(r.dimension,['constraintId','action','typeId','objects','rawValue','resolvedValue','status',...(Object.getOwnPropertyDescriptor(r.dimension||{},'typeId')?.value==='DistancePL'?['inverted']:[])]),count=drivingDimensionObjectCount(d.typeId);
 if(r.revision!==revision||r.ok!==true||typeof r.changed!=='boolean'||typeof r.serializedSketch!=='string'||r.serializedSketch.length>1048576||!Array.isArray(r.evidence)||r.evidence.length>10000||typeof d.constraintId!=='string'||!d.constraintId||d.constraintId.length>4096||!['edit','remove'].includes(d.action)||!count||!Array.isArray(d.objects)||Object.getPrototypeOf(d.objects)!==Array.prototype||d.objects.length!==count||Reflect.ownKeys(d.objects).length!==count+1)fail('INVALID_RESPONSE','Invalid dimension response identity.');
 if(d.typeId==='DistancePL'&&typeof d.inverted!=='boolean')fail('INVALID_RESPONSE','Point-line side must be retained.');
 const refs=Array.from({length:count},(_,i)=>{const obj=Object.getOwnPropertyDescriptor(d.objects,String(i));if(!obj?.enumerable||!Object.hasOwn(obj,'value')||typeof obj.value!=='string'||!obj.value||obj.value.length>256)fail('INVALID_RESPONSE','Invalid dimension object.');return obj.value;});if(new Set(refs).size!==refs.length)fail('INVALID_RESPONSE','Dimension targets must remain distinct.');
 if(d.action==='remove'?(d.rawValue!==null||d.resolvedValue!==null||d.status!=='removed'||!r.changed):(!['string','number'].includes(typeof d.rawValue)||typeof d.rawValue==='number'&&!Number.isFinite(d.rawValue)||String(d.rawValue).length>4096||!drivingDimensionValueValid(d.typeId,d.resolvedValue)||!['accepted','redundant'].includes(d.status)))fail('INVALID_RESPONSE','Invalid dimension value/status.');
 return Object.freeze({...r,dimension:Object.freeze({...d,objects:Object.freeze(refs)})});
}
const equal=(a,b)=>{if(a===b)return true;if(!a||!b||typeof a!=='object'||typeof b!=='object'||Array.isArray(a)!==Array.isArray(b))return false;const x=Object.keys(a),y=Object.keys(b);return x.length===y.length&&x.every(k=>Object.hasOwn(b,k)&&equal(a[k],b[k]));};
const semantic=c=>{const x={...c};delete x.admission;return x;};
function base(sketch){return {...sketch,objects:sketch.objects.map(o=>({...o,data:null})),stages:sketch.stages.map(s=>({...s,constraints:[]}))};}
// Structural proof only; real solver and geometry/residual validation required.
export function classifyDrivingDimensionDelta(before,after,beforePoints=[],afterPoints=[]){
 if(!equal(base(before),base(after)))fail('INTENT_CHANGED','Unrelated sketch intent changed.');let change=null;
 for(let stage=0;stage<before.stages.length;stage++){
  const a=before.stages[stage].constraints,b=after.stages[stage].constraints;
  let i=0;while(i<Math.min(a.length,b.length)&&equal(semantic(a[i]),semantic(b[i])))i++;
  if(a.length===b.length&&i===a.length)continue;
  if(change||Math.abs(a.length-b.length)>1)fail('INTENT_CHANGED','Exactly one existing dimension may change.');
  const action=a.length===b.length?'edit':a.length>b.length?'remove':'insert',c=action==='insert'?b[i]:a[i],field=drivingLengthField(c?.typeId);
  if(!field||c.objects?.length!==drivingDimensionObjectCount(c.typeId)||!drivingDimensionConstantsValid(c.typeId,c.constants))fail('UNSUPPORTED','Only supported lengths, Euclidean point distance and ordered signed X/Y or live three-reference projected dimensions may change.');
  if(action==='edit'){
   const restored={...b[i],constants:{...b[i].constants,[field]:c.constants[field]}};
   if(!equal(semantic(c),semantic(restored)))fail('INTENT_CHANGED','The dimension identity or annotation changed.');
  }
  const offset=action==='remove'?1:0,other=action==='insert'?1:0;
  for(let j=i+(action==='edit'?1:0);j+offset<a.length;j++)if(!equal(semantic(a[j+offset]),semantic(b[j+other])))fail('INTENT_CHANGED','Other constraints changed.');
  const source=action==='insert'?after:before,row=resolveDrivingDimension(source,dimensionLocator(stage,i,c),action==='insert'?afterPoints:beforePoints);
  change={action,stage,index:i,typeId:c.typeId,objects:[...c.objects],field,...(pointLineDrivingDimension(c.typeId)?{inverted:pointLineSide(c.constants.inverted)}:{}),beforeValue:action==='insert'?null:c.constants[field],afterValue:action==='remove'?null:b[i].constants[field],constraintId:row.constraintId};
 }
 return change?Object.freeze(change):null;
}
