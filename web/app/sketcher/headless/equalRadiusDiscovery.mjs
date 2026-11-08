import {equalRadiusLocator,noEqualRadiusConstants} from './equalRadiusEnvelope.mjs';

// Called on the independently validated native replay/source. Generated root
// identities come from the ORIGINAL stage generator output records; no ID
// grammar, coordinate inference, persisted eligibility flag or carry rewrite.
export function discoverEqualRadiusRows(sketch){
 const objects=new Map(sketch.objects.map(o=>[o.id,o])),generated=new Set(),rows=[];
 for(const stage of sketch.stages)for(const generator of stage.generators){
  if(!Array.isArray(generator.generatedObjects))throw Object.assign(Error('EqualRadius discovery requires the validated generator output inventory.'),{code:'INVALID_TARGET'});
  for(const id of generator.generatedObjects)generated.add(id);
 }
 for(let si=0;si<sketch.stages.length;si++)for(let index=0;index<sketch.stages[si].constraints.length;index++){
  const c=sketch.stages[si].constraints[index];if(c.typeId!=='EqualRadius')continue;
  const refs=Array.isArray(c.objects)?c.objects:[],generatedTarget=refs.some(id=>generated.has(id)),
   supported=refs.length===2&&refs[0]!==refs[1]&&!generatedTarget&&refs.every(id=>{
    const o=objects.get(id);return o&&['Circle','Arc'].includes(o.type)&&Number.isSafeInteger(o.stage)&&o.stage<=si;
   })&&noEqualRadiusConstants(c)&&['accepted','redundant'].includes(c.admission?.state);
  rows.push(Object.freeze({relationId:supported?equalRadiusLocator(si,index,c):null,typeId:'EqualRadius',stage:si,index,objects:Object.freeze([...refs]),status:c.admission?.state??null,canRemove:supported,
   reason:supported?null:generatedTarget?'Closed EqualRadius removal does not support generator-owned circular roots.':'A current ordinary admitted EqualRadius row is required.'}));
 }
 return Object.freeze(rows);
}
export function resolveEqualRadiusRow(sketch,id){const row=discoverEqualRadiusRows(sketch).find(r=>r.relationId===id&&r.canRemove);if(!row)throw Object.assign(Error('The inspected EqualRadius row is unavailable.'),{code:'INVALID_TARGET'});return row;}
