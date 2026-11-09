import {HeadlessSketchWorkspace} from './workspace';import {ConstraintDefinitions} from '../constr/ANConstraints';import {inspectClosedTangency} from '../actions/tangencyAdmission';
import {validateConstraintGeometry} from './sketchValidation';import {tangentCreation,tangentSpec,tangentLocator} from './tangencyEnvelope.mjs';
import {TANGENCY_SCHEMAS,lineCircularContact,circleCircleContact} from '../constr/tangencyDomain.mjs';
export function inspectTangencyRows(sketch:any,bindings:any){
 const generated=new Set<string>();for(const stage of sketch.stages)for(const g of stage.generators)for(const id of g.generatedObjects)generated.add(id);
 const targets=sketch.objects.filter(o=>['Segment','Circle','Arc'].includes(o.type)).map(o=>({id:o.id,type:o.type,stage:o.stage??0,canCreate:!generated.has(o.id),reason:generated.has(o.id)?'GENERATED_TARGET':null}));
 const rows=[];if(!sketch.stages.some(s=>s.constraints.some(c=>TANGENCY_SCHEMAS.includes(c.typeId))))return{targets,rows};
 const w=new HeadlessSketchWorkspace(bindings);w.io._loadSketch(structuredClone(sketch),{strict:true});const pm=w.parametricManager,index=w.createIndex();let count=0;
 for(let stage=0;stage<sketch.stages.length;stage++)for(let at=0;at<sketch.stages[stage].constraints.length;at++){
  const raw=sketch.stages[stage].constraints[at];if(!TANGENCY_SCHEMAS.includes(raw.typeId))continue;if(++count>10000)throw Object.assign(Error('Tangent inspection exceeds its bound.'),{code:'LIMIT'});
  const c=pm.stages[stage].solverSystem.allConstraints.filter(c=>!c.internal)[at];if(!c||c.schema!==ConstraintDefinitions[raw.typeId]||c.objects.some((o,i)=>o!==index[raw.objects[i]]))throw Object.assign(Error('Tangent native row ownership changed.'),{code:'INVALID_TARGET'});
  c.resolveConstants(pm.constantResolver);validateConstraintGeometry(c);const intent=tangentCreation(raw),spec=tangentSpec(intent);let canRemove=true,reason=null;try{inspectClosedTangency(pm,c.objects,spec,false);}catch(e){canRemove=false;reason=e.code||'UNSUPPORTED_TARGET';}
  const geometry=raw.typeId==='TangentCC'?{kind:'circle-circle',...circleCircleContact(c.objects[0],c.objects[1],raw.constants.branch)}:{kind:'line-circular',...lineCircularContact(c.objects[0],c.objects[1],raw.constants.inverted,raw.typeId==='FiniteTangentLC')};
  rows.push({relationId:canRemove?tangentLocator(stage,at,raw):null,typeId:raw.typeId,objects:[...raw.objects],constants:{...raw.constants},stage,index:at,status:raw.admission.state,canRemove,reason,geometry});
 }
 return{targets,rows};
}
export function resolveTangencyRow(sketch:any,id:string,bindings:any){const row=inspectTangencyRows(sketch,bindings).rows.find(r=>r.canRemove&&r.relationId===id);if(!row)throw Object.assign(Error('The inspected tangent row is unavailable.'),{code:'INVALID_TARGET'});return row;}
