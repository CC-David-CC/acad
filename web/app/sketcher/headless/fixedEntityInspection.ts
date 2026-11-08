import {HeadlessSketchWorkspace} from './workspace';
import {inspectFixedEntity} from '../actions/fixedEntityAdmission';
import {fixedTypes,fixedEntityLocator} from './fixedEntityIntent.mjs';
export function inspectFixedEntityRows(source:any,external:any){
 const targets=[],rows=[],workspace=new HeadlessSketchWorkspace(external);
 const eligible=source.objects.filter(o=>['Segment','Circle','Arc'].includes(o.type));
 if(source.objects.length>1024){for(const o of eligible)targets.push({id:o.id,type:o.type,stage:o.stage,canFix:false,reason:'FIX_INVENTORY_LIMIT'});}
 else workspace.io.evaluateCapturedSketch(structuredClone(source),()=>{const pm=workspace.parametricManager,index=workspace.createIndex();for(const o of eligible){try{inspectFixedEntity(pm,index[o.id],index);targets.push({id:o.id,type:o.type,stage:o.stage,canFix:true,reason:null});}catch(e){targets.push({id:o.id,type:o.type,stage:o.stage,canFix:false,reason:typeof e?.code==='string'?e.code:'FIX_ENTITY_UNSUPPORTED'});}}});
 const byId=new Map(targets.map(t=>[t.id,t]));
 source.stages.forEach((stage,si)=>stage.constraints.forEach((c,i)=>{if(Object.hasOwn(fixedTypes,c.typeId)){const target=byId.get(c.objects[0]),canRemove=target?.canFix===true;rows.push({constraintId:fixedEntityLocator(si,i,c),stage:si,index:i,typeId:c.typeId,id:c.objects[0],constants:{...c.constants},status:c.admission.state,canRemove,reason:canRemove?null:target?.reason||'FIX_ENTITY_UNSUPPORTED'});}}));
 return{targets,rows};
}
