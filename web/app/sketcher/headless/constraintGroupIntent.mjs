// Fixed schema catalogue: these entries authorize no arbitrary constraint execution.
const orientationKinds=Object.freeze({
 horizontal:Object.freeze({typeId:'Horizontal',min:1,max:16,arity:1,angles:Object.freeze([0,180])}),
 vertical:Object.freeze({typeId:'Vertical',min:1,max:16,arity:1,angles:Object.freeze([90,270])}),
 parallel:Object.freeze({typeId:'Parallel',min:2,max:16,arity:2,angles:Object.freeze([0,180])}),
 perpendicular:Object.freeze({typeId:'Perpendicular',min:2,max:16,arity:2,angles:Object.freeze([90,270])})
});
export const orientationGroupContract=kind=>typeof kind==='string'&&Object.hasOwn(orientationKinds,kind)?orientationKinds[kind]:null;
const fail=()=>{throw Object.assign(Error('Invalid constraint-group data.'),{code:'INVALID_REQUEST'});};
export function groupData(value,keys){const proto=value&&typeof value==='object'?Object.getPrototypeOf(value):undefined;if(!value||typeof value!=='object'||Array.isArray(value)||(proto!==null&&Object.getPrototypeOf(proto)!==null)||Reflect.ownKeys(value).length!==keys.length)fail();const out=Object.create(null);for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail();out[key]=d.value;}return out;}
export function groupIds(value,min=2,max=16){if(!Array.isArray(value)||value.length<min||value.length>max||Reflect.ownKeys(value).length!==value.length+1)fail();const ids=[];for(let i=0;i<value.length;i++){const d=Object.getOwnPropertyDescriptor(value,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value')||typeof d.value!=='string'||!d.value||d.value.length>256)fail();ids.push(d.value);}if(new Set(ids).size!==ids.length)fail();return Object.freeze(ids);}
export function captureConstraintGroupIntent(value){
 const kind=Object.getOwnPropertyDescriptor(value||{},'kind')?.value,orientation=orientationGroupContract(kind),
  r=groupData(value,kind==='midpoint'||orientation?['kind','action','ids']:['kind','action','ids','angleDegrees']);
 if(!['midpoint','angle-chain'].includes(r.kind)&&!orientation||!['create','edit'].includes(r.action)||(r.kind==='midpoint'||orientation)&&r.action!=='create')fail();
 r.ids=groupIds(r.ids,orientation?orientation.min:2,orientation?orientation.max:r.kind==='midpoint'?2:16);
 if(r.kind==='angle-chain'&&(typeof r.angleDegrees!=='number'||!Number.isFinite(r.angleDegrees)||r.angleDegrees<=0||r.angleDegrees>=180))fail();return Object.freeze(r);
}
export function captureConstraintGroupReply(value,intent){
 const orientation=orientationGroupContract(intent.kind),g=groupData(value,orientation?['kind','action','ids','existing','rows']:['kind','action','ids','angleDegrees','existing','rows']),
  ids=groupIds(g.ids,orientation?orientation.min:2,orientation?orientation.max:intent.kind==='midpoint'?2:16),
  count=orientation?(orientation.arity===1?ids.length:ids.length-1):intent.kind==='midpoint'?1:ids.length-1;
 if(g.kind!==intent.kind||g.action!==intent.action||ids.length!==intent.ids.length||ids.some((id,i)=>id!==intent.ids[i])||!orientation&&g.angleDegrees!==(intent.kind==='midpoint'?null:intent.angleDegrees)||typeof g.existing!=='boolean'||!Array.isArray(g.rows)||g.rows.length!==count||Reflect.ownKeys(g.rows).length!==g.rows.length+1)fail();
 const rows=[];for(let i=0;i<g.rows.length;i++){
  const d=Object.getOwnPropertyDescriptor(g.rows,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value'))fail();
  const r=groupData(d.value,orientation?['stage','index','typeId','objects','angleDegrees','status']:['stage','index','typeId','objects','status']),
   arity=orientation?orientation.arity:2,refs=groupIds(r.objects,arity,arity),expected=orientation&&arity===1?ids.slice(i,i+1):intent.kind==='midpoint'?ids:ids.slice(i,i+2);
  if(!Number.isSafeInteger(r.stage)||r.stage<0||r.stage>31||!Number.isSafeInteger(r.index)||r.index<0||r.index>=10000||
   !(orientation?r.typeId===orientation.typeId:intent.kind==='midpoint'?['PointInMiddle','Symmetry'].includes(r.typeId):r.typeId==='AngleBetween')||refs.some((id,j)=>id!==expected[j])||
   orientation&&!orientation.angles.includes(r.angleDegrees)||!['accepted','redundant'].includes(r.status))fail();
  rows.push(Object.freeze({...r,objects:refs}));
 }
 return Object.freeze({...g,ids,rows:Object.freeze(rows)});
}
