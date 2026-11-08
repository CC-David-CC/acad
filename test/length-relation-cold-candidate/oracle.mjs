// Independent arithmetic/source oracle. No production solver/planner imports.
import assert from 'node:assert/strict';
const near=(a,b,t,message)=>assert(Number.isFinite(a)&&Math.abs(a-b)<=t,message+': '+a+' vs '+b);
export function checkLengthPart(sketch,binding,{width,height,factor=null,offset=null},metrics){
 const objects=binding.rectangleIds.map(id=>{const rows=sketch.objects.filter(o=>o.id===id&&o.type==='Segment');assert.equal(rows.length,1);return rows[0];}),points=objects.flatMap(o=>[o.data.a,o.data.b]);
 near(Math.min(...points.map(p=>p.x)),0,1e-9,'source minX');near(Math.min(...points.map(p=>p.y)),0,1e-9,'source minY');near(Math.max(...points.map(p=>p.x)),width,1e-9,'source width');near(Math.max(...points.map(p=>p.y)),height,1e-9,'source height');
 const scalar=id=>{const o=objects.find(o=>o.id===id);assert(o);return Math.hypot(o.data.b.x-o.data.a.x,o.data.b.y-o.data.a.y);};
 const lengths={a:scalar(binding.aId),b:scalar(binding.bId)},rows=sketch.stages.flatMap(s=>s.constraints),relations=rows.filter(c=>c.typeId==='LengthRelation'&&JSON.stringify(c.objects)===JSON.stringify([binding.aId,binding.bId]));
 if(factor===null)assert.equal(relations.length,0);else{assert.equal(relations.length,1);assert.deepEqual(relations[0].constants,{factor:String(factor),offset:String(offset)});assert(['accepted','redundant'].includes(relations[0].admission.state));near(lengths.a-factor*lengths.b-offset,0,1e-6,'ORIGINAL physical length equation');}
 const free=sketch.objects.filter(o=>o.id===binding.pointId);assert.equal(free.length,1);assert.equal(free[0].type,'Point');assert.deepEqual(free[0].data,{x:7,y:9});
 for(const c of rows)assert(['accepted','redundant'].includes(c.admission.state));
 const volume=width*height*20,bounds={min:[0,0,0],max:[width,height,20]};assert.equal(metrics.resultKind,'single-solid');assert.equal(metrics.solidCount,1);assert.equal(metrics.nativeValidity.valid,true);near(metrics.nativeVolume,volume,1e-6,'Native volume');for(const side of['min','max'])for(let i=0;i<3;i++)near(metrics.nativeBounds[side][i],bounds[side][i],1e-6,'Native '+side+i);
 return{lengths,volume,bounds,relation:relations[0]??null,sourceIds:[...binding.rectangleIds,binding.pointId]};
}
