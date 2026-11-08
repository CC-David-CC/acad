import {createSketchRevisionGuard} from './sketchRevisionGuard';
import {runSketchTransaction} from './sketchTransaction';
import {inspectLengthMeasurementModel,prepareLengthMeasurement} from './lengthMeasurementPreparation';
const revisionGuard=createSketchRevisionGuard();
function guard(options){if(options?.signal?.aborted||(options?.valid&&options.valid()!==true))throw Error('The sketch window or account is no longer available.');}
function perform(viewer,intent,beforeCommit){
 const prepared=prepareLengthMeasurement(viewer,intent,'measurement-'+crypto.randomUUID());if(beforeCommit)beforeCommit();
 if(prepared.changed)runSketchTransaction(viewer,{mutate:prepared.mutate,validate:stages=>{prepared.validate(stages);prepared.addRuler();},rollbackExtra:prepared.rollbackExtra});
 try{viewer.parametricManager.refresh();}catch(error){console.error('Measurement role changed, but sketch refresh failed:',error);}
 return{role:prepared.role,segmentId:prepared.segment.id,dimensionId:prepared.ruler.id,length:Math.hypot(prepared.segment.b.x-prepared.segment.a.x,prepared.segment.b.y-prepared.segment.a.y),unit:'millimeter'};
}
// Legacy active-editor gestures reuse the SAME actual model preparation. Their
// viewer checkpoint remains a legacy editor journal, not the modern part journal.
export function convertReferenceLengthToDriving(viewer,dimension,beforeCommit){
 if(!dimension||!viewer.dimLayer.objects.includes(dimension))throw Error('Choose a current ruler.');
 return perform(viewer,{action:'convert',target:{measurementId:dimension.id},role:'driving',value:Math.hypot(dimension.b.x-dimension.a.x,dimension.b.y-dimension.a.y)},beforeCommit);
}
export function convertDrivingLengthToReference(viewer,segment,beforeCommit){
 const rows=inspectLengthMeasurementModel(viewer).filter(r=>r.segmentId===segment?.id&&r.role==='driving'&&r.constraintId);if(rows.length!==1)throw Error('Choose one actual driving Segment length.');
 return perform(viewer,{action:'convert',target:{constraintId:rows[0].constraintId},role:'reference'},beforeCommit);
}
export function inspectLengthMeasurementRoles(viewer,options={}){
 guard(options);const rows=inspectLengthMeasurementModel(viewer),items=rows.filter(r=>r.segmentId&&(r.measurementId||r.constraintId)).map(r=>({role:r.role,segmentId:r.segmentId,...(r.measurementId?{dimensionId:r.measurementId}:{}),length:r.canonicalValue,unit:'millimeter',convertible:r.canConvert}));
 const revision=revisionGuard.capture(viewer);guard(options);return{revision,items};
}
export function convertLengthMeasurementById(viewer,args,options={}){
 guard(options);if(!args||!['driving','reference'].includes(args.role)||typeof args.segmentId!=='string'||!args.segmentId||typeof args.revision!=='string'||!args.revision)throw Error('Choose a current measurement.');
 const rows=inspectLengthMeasurementModel(viewer).filter(r=>r.segmentId===args.segmentId&&r.canConvert);if(rows.length!==1)throw Error('Choose an unambiguous current measurement.');const row=rows[0];
 if(args.role==='driving'&&row.measurementId!==args.dimensionId)throw Error('Choose the current ruler identity.');
 const before=()=>{guard(options);revisionGuard.verify(viewer,args.revision);revisionGuard.release(viewer,args.revision);};
 return perform(viewer,args.role==='driving'?{action:'convert',target:{measurementId:row.measurementId},role:'driving',value:row.canonicalValue}:{action:'convert',target:row.constraintId?{constraintId:row.constraintId}:{measurementId:row.measurementId},role:'reference'},before);
}
