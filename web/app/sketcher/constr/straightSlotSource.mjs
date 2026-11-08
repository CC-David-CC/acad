import {slotFail,slotLiteral,assertSlotNative} from './straightSlotRecord.mjs';
// Pure source ownership/layout checks. Called by the normal strict IO graph;
// the Worker separately authenticates actual classes, roots, Params and stages.
export function slotDeclarationRows(sketch){
 let generated;
 const rows=[],owned=new Set(),objects=new Map(sketch.objects.map(o=>[o.id,o]));
 for(let stage=0;stage<sketch.stages.length;stage++)for(let index=0;index<sketch.stages[stage].constraints.length;index++){
  const row=sketch.stages[stage].constraints[index];if(!row||row.typeId!=='StraightSlot')continue;
  if(!generated)generated=new Set(sketch.stages.flatMap(s=>s.generators.flatMap(g=>g?.generatedObjects||[])));
  if(!Array.isArray(row.objects)||row.objects.length!==5||new Set(row.objects).size!==5||!row.constants||Object.keys(row.constants).join(',')!=='radius'||row.stage!==stage)slotFail('INVALID_SLOT_SOURCE','Invalid registered Slot declaration.');
  if(Object.keys(row).some(k=>!['typeId','objects','constants','stage','annotations','admission'].includes(k)))slotFail('INVALID_SLOT_SOURCE','Unknown Slot source fields.');
  const radius=slotLiteral(row.constants.radius);
  row.objects.forEach((id,i)=>{const object=objects.get(id);if(generated.has(id)||owned.has(id)||!object||object.type!==['Segment','Segment','Arc','Segment','Arc'][i]||(object.stage??0)!==stage||(i===0?object.role!=='construction':object.role!==null&&object.role!==undefined))slotFail('INVALID_SLOT_SOURCE','Slot declarations require unique same-stage ordinary members.');owned.add(id);});
  rows.push({stage,index,row,radius});
 }
 return rows;
}
export function validateSlotNativeRow(row,index){if(row.typeId!=='StraightSlot')return;const radius=slotLiteral(row.constants?.radius);assertSlotNative(row.objects.map(id=>index[id]),radius);}
export function validateSlotJunctions(sketch,index){
 const items=slotDeclarationRows(sketch);if(!items.length)return;const junctions=new Map();let work=0;
 const charge=()=>{if(++work>100000)slotFail('SLOT_RESOURCE_LIMIT','Slot junction validation exceeds its bounded source work.');};
 for(let si=0;si<sketch.stages.length;si++){const map=new Map();junctions.set(si,map);for(const c of sketch.stages[si].constraints){charge();if(c.typeId!=='PCoincident'||!Array.isArray(c.objects)||c.objects.length!==2)continue;const [a,b]=c.objects;for(const [x,y] of [[a,b],[b,a]]){const peers=map.get(x)||new Set();peers.add(y);map.set(x,peers);}}}
 for(const item of items){
  charge();const [axis,upper,start,lower,end]=item.row.objects.map(id=>index[id]);if(!axis||!upper||!start||!lower||!end)slotFail('INVALID_SLOT_SOURCE','Slot member resolution failed.');
  const pairs=[[upper.b,start.a],[start.b,lower.a],[lower.b,end.a],[end.b,upper.a]],map=junctions.get(item.stage);
  for(const [a,b] of pairs){charge();if(!map.get(a.id)?.has(b.id))slotFail('INVALID_SLOT_SOURCE','The declared Slot is missing an actual endpoint junction.');}
  validateSlotNativeRow(item.row,index);
 }
}
