import {runEmptySketchPreparation} from 'sketcher/headless/emptySketchClient';
import workerUrl from 'codi-headless-sketch-worker';
import {validateProjectSketch} from 'sketcher/io';
import {ReadSketch} from '../sketch/sketchReader';
import {sketchBoundaryFrame} from '../sketch/boundaryValidity';
import {MOpenFaceShell} from '../model/mopenFace';
import {sameSketchSaveFrame,hasOnlyUnconsumedSketchHistory} from './unconsumedSketchSave.mjs';
import {PreparedSketchCommand} from './rectangleCreation';

function cancelled(committed=false) {
  const error=new DOMException(committed?'Accepted sketch creation was superseded.':'Sketch creation was cancelled or superseded.','AbortError');
  Object.defineProperty(error,'committed',{value:committed,enumerable:true});return error;
}
function capture(input:any) {
  const proto=input&&typeof input==='object'?Object.getPrototypeOf(input):undefined;
  if(!input||typeof input!=='object'||Array.isArray(input)||(proto!==null&&Object.getPrototypeOf(proto)!==null)||Reflect.ownKeys(input).sort().join(',')!=='depth,plane,revision,unit')throw Error('Invalid empty sketch request.');
  const result:any={};for(const key of ['revision','unit','plane','depth']){const d=Object.getOwnPropertyDescriptor(input,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))throw Error('Sketch request fields must be data.');result[key]=d.value;}
  if(typeof result.revision!=='string'||!result.revision||result.revision.length>256||result.unit!=='millimeter'||!['XY','XZ','ZY'].includes(result.plane)||typeof result.depth!=='number'||!Number.isFinite(result.depth)||Math.abs(result.depth)>1e8)throw Error('Invalid empty sketch plane.');
  return result;
}
function captureOptions(input:any) {
  if(input===undefined)input={};const proto=input&&typeof input==='object'?Object.getPrototypeOf(input):undefined;
  if(!input||typeof input!=='object'||Array.isArray(input)||(proto!==null&&Object.getPrototypeOf(proto)!==null)||Reflect.ownKeys(input).some(k=>typeof k!=='string'||!['signal','valid'].includes(k)))throw Error('Invalid sketch creation options.');
  const opts:any={};for(const key of Reflect.ownKeys(input) as string[]){const d=Object.getOwnPropertyDescriptor(input,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))throw Error('Invalid sketch creation options.');opts[key]=d.value;}
  if(opts.valid!==undefined&&typeof opts.valid!=='function')throw Error('Invalid lifetime guard.');
  if(opts.signal!==undefined)try{Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get.call(opts.signal)}catch{throw Error('Invalid cancellation signal.')}
  return opts;
}

// The craft coordinator owns submit; public callers cannot supply preparation hooks.
export function createEmptySketchCreationCommands(ctx:any, submit:any) {
  function ancestryReason(){
    const history=ctx.craftService.modifications$.value.history,items=ctx.sketchStorageService.getAllSketches();
    if(!Array.isArray(history)||history.length>=256||!hasOnlyUnconsumedSketchHistory(history,'\u0000'))return 'This sketch creation path requires supported part history with room for another plane.';
    if(!Array.isArray(items)||items.length>=64)return 'The sketch creation limit has been reached.';
    const seen=new Set();for(const item of items){const id=item?.id;if(typeof id!=='string'||!id||id.length>1024||seen.has(id))return 'The sketch inventory is invalid.';seen.add(id)}
    return null;
  }
  function inspectPrimitiveCreation(){
    const base=ctx.craftService.inspectRectangleCreation();
    const reason=!base.ready?base.reason:!ctx.projectService.hasHostLifetime?'A current host-bound workspace is required.':ctx.expressionService.isTyped?'Typed sketch parameters are not supported by this transition yet.':ancestryReason();
    return Object.freeze({ready:!reason,reason,revision:base.revision,unit:'millimeter',planes:Object.freeze(['XY','XZ','ZY']),depthLimit:1e8});
  }
  async function createEmptySketchPlane(input:any, rawOptions?:any){
    const args=capture(input),opts=captureOptions(rawOptions),info=inspectPrimitiveCreation();
    if(!info.ready)throw Error(info.reason||'Sketch creation is unavailable.');
    const hostValid=()=>{try{return !opts.valid||opts.valid()===true}catch{return false}};
    if(opts.signal?.aborted||!hostValid()||opts.signal?.aborted||args.revision!==info.revision)throw cancelled();
    const project=ctx.projectService,storage=ctx.storageService,craft=ctx.craftService,expressions=ctx.expressionService,manager=ctx.projectManager,generation=project.documentGeneration;
    const streamList=()=>[craft.modifications$,craft.models$,craft.pipelineFailure$,craft.engineCleanupFailure$,expressions.script$,expressions.list$,expressions.errors$,expressions.table$,ctx.streams.sketcher.sketchingFace,ctx.wizardService.workingRequest$,ctx.workbenchService.currentWorkbench$,ctx.assemblyService.constraints$];
    const services=()=>[ctx.projectService,ctx.storageService,ctx.craftService,ctx.expressionService,ctx.projectManager,ctx.services.sketcher,ctx.wizardService,ctx.workbenchService,ctx.assemblyService];
    const tracked=streamList(),versions=tracked.map(s=>s.revision),capturedServices=services(),storageRevision=storage.revision,table=expressions.table$.value,workbench=ctx.workbenchService.currentWorkbench$.value;
    const controller=new AbortController(),stop=()=>controller.abort(),signals=[project.documentSignal,opts.signal].filter(Boolean);
    for(const signal of signals){signal.addEventListener('abort',stop,{once:true});if(signal.aborted)stop();}
    const alive=()=>{let valid=false;try{valid=hostValid()&&!controller.signal.aborted&&!opts.signal?.aborted&&ctx.projectService===project&&project.hasHostLifetime&&project.isDocumentCurrent(generation)&&ctx.storageService===storage&&ctx.craftService===craft&&ctx.expressionService===expressions&&ctx.projectManager===manager}catch{}return valid;};
    function requireCurrent(){
      if(!alive()||services().some((v,i)=>v!==capturedServices[i])||storage.revision!==storageRevision||streamList().some((s,i)=>s!==tracked[i]||s.revision!==versions[i])||expressions.table$.value!==table||expressions.isTyped||ctx.workbenchService.currentWorkbench$.value!==workbench||ctx.services.sketcher.inPlaceEditor.inEditMode||ctx.wizardService.workingRequest$.value||manager.isRestoring||ctx.assemblyService.getConstraints().length||ancestryReason())throw cancelled();
    }
    let prepared:any=null,receipt:any=null,committed=false;
    try {
      requireCurrent();const featureId=project.counterGenerator.generateFeatureId();
      const preparation:PreparedSketchCommand={requireCurrent,requireCommittedCurrent(){if(!alive())throw cancelled(true);},async prepare(models,history){
        requireCurrent();const created=models.filter(m=>m.originatingOperation===history.pointer);
        if(created.length!==1||!(created[0] instanceof MOpenFaceShell)||created[0].faces.length!==1)throw Error('Plane did not produce one editable face.');
        const face=created[0].faces[0],id=face.defaultSketchId,key=project.sketchStorageKey(id),frame=sketchBoundaryFrame(face);
        if(typeof id!=='string'||!id||face.id!==id||storage.exists(key))throw Error('The new sketch identity is unavailable.');
        const result=await runEmptySketchPreparation(workerUrl,{revision:args.revision,unit:args.unit,frame},{signal:controller.signal,valid:()=>{try{requireCurrent();return true}catch{return false}}});
        requireCurrent();if(result.ok===false)throw Object.assign(Error(result.error.message),{code:result.error.code});
        if(typeof result.serializedSketch!=='string'||result.serializedSketch.length>32768)throw Error('Invalid empty sketch serialization.');
        const sketch=JSON.parse(result.serializedSketch);validateProjectSketch(sketch);
        if(!sameSketchSaveFrame(frame,sketch.metadata?.boundaryFrame)||!sameSketchSaveFrame(frame,sketchBoundaryFrame(face))||!Array.isArray(sketch.objects)||sketch.objects.length||!Array.isArray(sketch.dimensions)||sketch.dimensions.length||!Array.isArray(sketch.labels)||sketch.labels.length||sketch.constants!==''||!Array.isArray(sketch.stages)||sketch.stages.length!==1||sketch.stages[0].constraints.length||sketch.stages[0].generators.length||['lines','arcs','circles','nurbses'].some(k=>!Array.isArray(sketch.boundary?.[k])||sketch.boundary[k].length))throw Error('Empty sketch worker returned unexpected content.');
        face.setSketch(ReadSketch(sketch,id,true));face.ext.sketchInitialized=true;
        // No closed profile is expected here. Region availability is separate
        // from valid authored empty geometry. Preserve the diagnostic for UI.
        if((face.sketchRegionError&&face.sketchRegionError!=='A closed profile is required.')||face.sketchRegions.length||face.sketchLoops.length||face.sketchObjects.length)throw Error('An empty sketch must not define a profile.');
        requireCurrent();prepared=storage.prepareWrites([{key,value:result.serializedSketch}]);receipt={featureId:Number(featureId),faceId:face.id,unit:args.unit,persistence:'volatile-workspace'};return prepared;
      }};
      await new Promise<void>((resolve,reject)=>submit({type:'PLANE',params:{featureId,orientation:args.plane,depth:args.depth,datum:null}},resolve,reject,preparation));committed=true;
      if(!alive()||!receipt)throw cancelled(true);return Object.freeze({...receipt,revision:inspectPrimitiveCreation().revision});
    }catch(error){if(committed&&!error?.committed)throw cancelled(true);if(!alive()&&!error?.committed)throw cancelled();throw error;}
    finally{prepared?.discard();for(const signal of signals)signal.removeEventListener('abort',stop);}
  }
  return {inspectPrimitiveCreation,createEmptySketchPlane};
}
