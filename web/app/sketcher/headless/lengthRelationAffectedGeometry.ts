import {AlgNumConstraint,ConstraintDefinitions} from '../constr/ANConstraints';
import {Segment} from '../shapes/segment';
import {isInstanceOf} from '../actions/matchUtils';
import {validateConstraintGeometry} from './sketchValidation';
import {captureConnectedGeometryScope} from './capturedGeometryScope';
export {firstCapturedGeometryDifference as firstLengthDifference,applyCapturedGeometry as applyLengthRelationGeometry,assertCapturedGeometryScope as assertLengthRelationGeometryScope} from './capturedGeometryScope';
const fail=(code:string,message:string):never=>{throw Object.assign(Error(message),{code});};
// Existing length semantics/guards remain here; dependency and delta policy is
// shared with coordinate edits, never accepted as a public permission bitmap.
export function captureLengthRelationScope(before:any,external:any,intent:any,freshEvidence:any[],auxiliaryWitnessBatch?:any){
 const captured=captureConnectedGeometryScope(before,external,freshEvidence,auxiliaryWitnessBatch,(_workspace,pm,index)=>{
  const objects=intent.ids.map(id=>index[id]);
  if(objects.some(o=>!isInstanceOf(o,Segment)||!o.stage||!pm.stages.includes(o.stage))||objects[0]===objects[1])fail('INVALID_TARGET','Choose two distinct actual owned Segments.');
  const targetStage=objects[0].stage.index>=objects[1].stage.index?objects[0].stage:objects[1].stage;
  if(objects.some(o=>o.generator&&o.stage===targetStage))fail('INVALID_TARGET','A generated Segment cannot be constrained in its own stage.');
  const proposed=new AlgNumConstraint(ConstraintDefinitions.LengthRelation,objects,{factor:String(intent.factor),offset:String(intent.offset)});proposed.resolveConstants(pm.constantResolver);
  let originalSatisfied=true;try{validateConstraintGeometry(proposed);}catch(error){if(error?.code!=='RESIDUAL')throw error;originalSatisfied=false;}
  const equations=[];proposed.collectPolynomials(equations);
  return{equations,value:{originalSatisfied,stage:targetStage.index}};
 });
 return{fields:captured.fields,...captured.selection};
}
