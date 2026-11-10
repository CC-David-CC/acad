import {arcLengthFromObject} from '../constr/arcLengthDomain.mjs';
import {createSketchRevisionGuard} from './sketchRevisionGuard';
import {runSketchTransaction} from './sketchTransaction';
import {inspectArcLengthMeasurementModel,prepareArcLengthMeasurement} from './arcLengthMeasurementPreparation';
const revisionGuard=createSketchRevisionGuard();
function guard(options){if(options?.signal?.aborted||(options?.valid&&options.valid()!==true))throw Error('The sketch window or account is no longer available.');}
function perform(viewer,intent,beforeCommit){
 const prepared=prepareArcLengthMeasurement(viewer,intent,'measurement-'+crypto.randomUUID());if(beforeCommit)beforeCommit();
 if(prepared.changed)runSketchTransaction(viewer,{mutate:prepared.mutate,validate:stages=>{prepared.validate(stages);prepared.addRuler();},rollbackExtra:prepared.rollbackExtra});
 try{viewer.parametricManager.refresh();}catch(error){console.error('Measurement role changed, but sketch refresh failed:',error);}
 return{role:prepared.role,arcId:prepared.arc.id,dimensionId:prepared.ruler.id,length:arcLengthFromObject(prepared.arc).length,unit:'millimeter'};
}
// Legacy active-editor gestures reuse the SAME actual model preparation. Their
// viewer checkpoint remains a legacy editor journal, not the modern part journal.
export function convertReferenceArcLengthToDriving(viewer,dimension,beforeCommit){
 if(!dimension||!viewer.dimLayer.objects.includes(dimension))throw Error('Choose a current ruler.');
 return perform(viewer,{action:'convert',target:{measurementId:dimension.id},role:'driving',value:arcLengthFromObject(dimension.arc).length},beforeCommit);
}
export function convertDrivingArcLengthToReference(viewer,arc,beforeCommit){
 const rows=inspectArcLengthMeasurementModel(viewer).filter(r=>r.arcId===arc?.id&&r.role==='driving'&&r.constraintId);if(rows.length!==1)throw Error('Choose one actual driving Arc length.');
 return perform(viewer,{action:'convert',target:{constraintId:rows[0].constraintId},role:'reference'},beforeCommit);
}
export function inspectArcLengthMeasurementRoles(viewer,options={}){
 guard(options);const rows=inspectArcLengthMeasurementModel(viewer),items=rows.filter(r=>r.arcId&&(r.measurementId||r.constraintId)).map(r=>({role:r.role,arcId:r.arcId,...(r.measurementId?{dimensionId:r.measurementId}:{}),length:r.canonicalValue,unit:'millimeter',convertible:r.canConvert}));
 const revision=revisionGuard.capture(viewer);guard(options);return{revision,items};
}
export function convertArcLengthMeasurementById(viewer,args,options={}){
 guard(options);if(!args||!['driving','reference'].includes(args.role)||typeof args.arcId!=='string'||!args.arcId||typeof args.revision!=='string'||!args.revision)throw Error('Choose a current measurement.');
 const rows=inspectArcLengthMeasurementModel(viewer).filter(r=>r.arcId===args.arcId&&r.canConvert);if(rows.length!==1)throw Error('Choose an unambiguous current measurement.');const row=rows[0];
 if(args.role==='driving'&&row.measurementId!==args.dimensionId)throw Error('Choose the current ruler identity.');
 const before=()=>{guard(options);revisionGuard.verify(viewer,args.revision);revisionGuard.release(viewer,args.revision);};
 return perform(viewer,args.role==='driving'?{action:'convert',target:{measurementId:row.measurementId},role:'driving',value:row.canonicalValue}:{action:'convert',target:row.constraintId?{constraintId:row.constraintId}:{measurementId:row.measurementId},role:'reference'},before);
}

// Same native preparation/checkpoint as existing human length-role gestures.
export function createReferenceArcLengthMeasurement(viewer,arc,beforeCommit){if(!arc||arc.TYPE!=='Arc')throw Error('Choose a current Arc.');const rows=inspectArcLengthMeasurementModel(viewer).filter(r=>r.arcId===arc.id&&!r.reason);if(rows.length!==1)throw Error('Choose an ordinary current Arc; existing driving lengths retain their role.');if(!rows[0].measurementId&&viewer.dimLayer.objects.length>=1024)throw Object.assign(Error('Reference ruler count exceeds1024.'),{code:'RESOURCE_LIMIT'});return perform(viewer,{action:'create',arcId:arc.id},beforeCommit);}
export function removeReferenceArcLengthMeasurement(viewer,dimension,beforeCommit){if(!dimension||dimension.TYPE!=='ArcLengthDimension'||!viewer.dimLayer.objects.includes(dimension))throw Error('Choose a current native reference ruler.');return perform(viewer,{action:'remove',measurementId:dimension.id},beforeCommit);}
