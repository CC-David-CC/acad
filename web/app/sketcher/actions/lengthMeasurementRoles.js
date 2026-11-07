import {AlgNumConstraint, ConstraintDefinitions} from '../constr/ANConstraints';
import {LinearDimension} from '../shapes/dim';
import {Segment} from '../shapes/segment';
import {isInstanceOf} from './matchUtils';
import {createSketchRevisionGuard} from './sketchRevisionGuard';
import {runSketchTransaction} from './sketchTransaction';

const revisionGuard=createSketchRevisionGuard();
const fail=()=>{throw Error('Choose one unambiguous segment length in the current sketch.')};
function guard(options){if(options?.signal?.aborted||(options?.valid&&options.valid()!==true))throw Error('The sketch window or account is no longer available.')}
function ownedSegments(viewer){const out=[];viewer.traverse(o=>{if(isInstanceOf(o,Segment)){if(out.length>=1024)throw Error('Too many segments.');out.push(o)}});if(out.some(o=>typeof o.id!=='string'||!o.id||o.id.length>256)||new Set(out.map(o=>o.id)).size!==out.length)fail();return out}
function length(segment){return Math.hypot(segment.b.x-segment.a.x,segment.b.y-segment.a.y)}
function matchSegment(viewer,dimension){if(!dimension||dimension.TYPE!=='LinearDimension'||dimension.isAnnotation||!Number.isFinite(dimension.offset)||!viewer.dimLayer.objects.includes(dimension))fail();const found=ownedSegments(viewer).filter(s=>(s.a===dimension.a&&s.b===dimension.b)||(s.a===dimension.b&&s.b===dimension.a));if(found.length!==1)fail();return found[0]}
function driving(pm,segment){const out=[];for(const stage of pm.stages)for(const c of stage.algNumSystem.allConstraints)if(c.schema.id==='SegmentLength'&&c.objects.length===1&&c.objects[0]===segment)out.push(c);return out}
function validateReferenceIds(viewer){const refs=viewer.dimLayer.objects.filter(d=>d.TYPE==='LinearDimension'&&!d.isAnnotation);if(refs.length>1024||refs.some(d=>typeof d.id!=='string'||!d.id||d.id.length>256)||new Set(refs.map(d=>d.id)).size!==refs.length)fail()}
function references(viewer,segment){return viewer.dimLayer.objects.filter(d=>d.TYPE==='LinearDimension'&&!d.isAnnotation&&((d.a===segment.a&&d.b===segment.b)||(d.a===segment.b&&d.b===segment.a)))}
function verifyStage(stages,added){for(const stage of stages){const sys=stage.algNumSystem,before=sys.transactionBefore;for(const c of sys.allConstraints){const was=before.conflicting.has(c)&&!before.redundant.has(c),now=sys.conflicting.has(c)&&!sys.redundant.has(c);if((c===added||!was)&&now)throw Error('The change conflicts with the existing sketch.')}if(added&&sys.allConstraints.includes(added)&&sys.redundant.has(added))throw Error('The length is already determined by other constraints.')}}
function assertGeometryUnchanged(stages){for(const stage of stages)for(const [p,value] of stage.algNumSystem.transactionBefore.values)if(!Object.is(p.get(),value))throw Error('Converting this measurement would change sketch geometry.')}
function perform(viewer,role,target,beforeCommit){
 const pm=viewer?.parametricManager,h=viewer?.historyManager;if(!pm||!h||pm.inTransaction||h.recoverySnapshot)fail();
 let segment,dimension,constraint;
 if(role==='driving'){
  dimension=target;segment=matchSegment(viewer,dimension);
  if(driving(pm,segment).length||!Number.isFinite(length(segment))||length(segment)<=0||segment.generator&&segment.stage===pm.stage)fail();
  constraint=new AlgNumConstraint(ConstraintDefinitions.SegmentLength,[segment],{length:String(length(segment))});constraint.annotations[0].offset=dimension.a===segment.a?dimension.offset:-dimension.offset;
  constraint.validateCandidateConstants(constraint.constants,v=>pm.constantResolver(v));
  const system=segment.stage.algNumSystem;
  if(system.impliedByLockedEndpoints(constraint,system.allConstraints.filter(c=>!system.conflicting.has(c)||system.redundant.has(c))))throw Error('The length is already determined by fixed endpoints.');
 }else if(role==='reference'){
  segment=target;if(!isInstanceOf(segment,Segment)||!segment.stage||!pm.stages.includes(segment.stage)||references(viewer,segment).length)fail();
  const found=driving(pm,segment);if(found.length!==1||found[0].stage.algNumSystem.isConflicting(found[0]))fail();constraint=found[0];
  if(constraint.annotations.length!==1||constraint.annotations[0].layer!==viewer.annotationLayer||!Number.isFinite(constraint.annotations[0].offset))fail();
  dimension=new LinearDimension(segment.a,segment.b);dimension.offset=constraint.annotations[0].offset;
 }else fail();
 if(beforeCommit)beforeCommit();
 const layer=viewer.dimLayer,originalIndex=role==='driving'?layer.objects.indexOf(dimension):-1;let addedReference=false;
 runSketchTransaction(viewer,{
  mutate:()=>{
   if(role==='driving'){pm._add(constraint);pm.transactionRemovedAnnotations.push({annotation:dimension,layer,stage:dimension.stage});}
   else pm._removeConstraint(constraint);
  },
  validate:stages=>{
   verifyStage(stages,role==='driving'?constraint:null);assertGeometryUnchanged(stages);
   if(role==='driving'&&!constraint.stage?.algNumSystem.allConstraints.includes(constraint))throw Error('The driving length was not added.');
   if(role==='reference'){addedReference=true;layer.add(dimension);}
  },
  rollbackExtra:()=>{
   if(addedReference&&layer.objects.includes(dimension))layer.remove(dimension);
   if(role==='driving'&&layer.objects.includes(dimension)){const at=layer.objects.indexOf(dimension);if(at!==originalIndex){layer.objects.splice(at,1);layer.objects.splice(originalIndex,0,dimension)}}
  }
 });
 try{pm.refresh()}catch(error){console.error('Measurement role changed, but sketch refresh failed:',error)}
 return {role,segmentId:segment.id,...(role==='reference'?{dimensionId:dimension.id}:{}),length:length(segment),unit:'millimeter'};
}
export function convertReferenceLengthToDriving(viewer,dimension,beforeCommit){return perform(viewer,'driving',dimension,beforeCommit)}
export function convertDrivingLengthToReference(viewer,segment,beforeCommit){return perform(viewer,'reference',segment,beforeCommit)}
export function inspectLengthMeasurementRoles(viewer,options={}){
 guard(options);const pm=viewer?.parametricManager;if(!pm)fail();validateReferenceIds(viewer);const items=[];
 for(const segment of ownedSegments(viewer)){
  const refs=references(viewer,segment),constraints=driving(pm,segment),value=length(segment);if(!Number.isFinite(value))fail();
  const sys=segment.stage.algNumSystem,accepted=sys.allConstraints.filter(c=>!sys.conflicting.has(c)||sys.redundant.has(c));
  const fixed=value>0&&sys.impliedByLockedEndpoints({schema:ConstraintDefinitions.SegmentLength,objects:[segment],constants:{length:String(value)}},accepted);
  for(const d of refs)items.push({role:'reference',segmentId:segment.id,dimensionId:d.id,length:value,unit:'millimeter',convertible:refs.length===1&&constraints.length===0&&value>0&&Number.isFinite(d.offset)&&!segment.generator&&!fixed});
  if(constraints.length===1)items.push({role:'driving',segmentId:segment.id,length:value,unit:'millimeter',convertible:refs.length===0&&!constraints[0].stage.algNumSystem.isConflicting(constraints[0])&&Number.isFinite(constraints[0].annotations[0]?.offset)});
 }
 const revision=revisionGuard.capture(viewer);guard(options);return {revision,items};
}
export function convertLengthMeasurementById(viewer,args,options={}){
 guard(options);validateReferenceIds(viewer);if(!args||!['driving','reference'].includes(args.role)||typeof args.segmentId!=='string'||!args.segmentId||typeof args.revision!=='string'||!args.revision)fail();
 const segment=ownedSegments(viewer).find(s=>s.id===args.segmentId);if(!segment)fail();
 const before=()=>{guard(options);revisionGuard.verify(viewer,args.revision);revisionGuard.release(viewer,args.revision)};
 if(args.role==='reference')return convertDrivingLengthToReference(viewer,segment,before);
 if(typeof args.dimensionId!=='string'||!args.dimensionId)fail();const dims=references(viewer,segment).filter(d=>d.id===args.dimensionId);if(dims.length!==1)fail();return convertReferenceLengthToDriving(viewer,dims[0],before);
}
