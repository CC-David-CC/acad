import {OperationDescriptor} from 'cad/craft/operationBundle';
import {EntityKind} from 'cad/model/entities';
import {MOpenFaceShell} from 'cad/model/mopenFace';
import {MSketchRegion} from 'cad/model/msketchRegion';
import {sketchBoundaryFrame, boundaryGeometryClose} from 'cad/sketch/boundaryValidity';
import {getSketchBoundaries} from 'cad/sketch/sketchBoundaries';
import {runSketchSolve} from 'sketcher/headless/client';
import {runWorkerRectangleExtrusion} from 'engine/extrusion/rectanglePrismAdapter';
import {sketchRevision} from 'cad/craft/sketchRevision.mjs';
import {prepareTypedRectangle} from 'cad/parameters/typedRectangleBindings.mjs';
import sketchWorker from 'codi-headless-sketch-worker';
import semanticWorker from 'codi-prism-semantic-worker';
import ociWorker from 'codi-oci-verified-worker';
import occJs from 'codi-occ-portable';
import occWasm from 'codi-occ-wasm';
import topologyModule from 'codi-prism-topology-module';
import profileModule from 'codi-prism-profile-module';
import regionsModule from 'codi-prism-regions-module';
import planModule from 'codi-prism-plan-module';
import holePlanModule from 'codi-hole-plan-module';
import holeTopologyModule from 'codi-hole-topology-module';
import prismBoundaryModule from 'codi-prism-boundary-module';
import cornerPlanModule from 'codi-four-corner-plan-module';
import cornerTopologyModule from 'codi-four-corner-topology-module';
import cornerProvenanceModule from 'codi-four-corner-provenance-module';

// These are trusted build assets, never values from the native project.
function sameOriginPath(asset:string):string {
  const url = new URL(asset, globalThis.location.href);
  if (url.origin !== globalThis.location.origin || url.search || url.hash) throw Error('Invalid worker asset.');
  return url.pathname;
}
function sameFrame(a:any,b:any):boolean { return ['origin','x','y','z'].every(k => a[k].every((v:number,i:number)=>Object.is(v,b[k][i]))); }
function abort() { return new DOMException('Rectangle extrusion was superseded.','AbortError'); }

export const WorkerRectangleExtrudeOperation: OperationDescriptor<any> = {
  id:'WORKER_RECTANGLE_EXTRUDE_V1', label:'Worker rectangle extrusion', icon:'img/cad/extrude',
  info:'Extrude one selected XY rectangle as a separate OCC worker body.',
  paramsInfo: ({length}) => `(${length} mm)`,
  form:[
    {type:'number',name:'length',label:'Depth (mm)',defaultValue:50,dimension:'length'},
    {type:'selection',name:'face',capture:[EntityKind.FACE],label:'Sketch plane',multi:false,defaultValue:{usePreselection:true,preselectionIndex:0}},
    {type:'selection',name:'regions',capture:[EntityKind.SKETCH_REGION],label:'Rectangle region',sketchRegionChoices:true,multi:true,max:1},
  ],
  defaultActiveField:'face',
  run:async (params:any, ctx:any, raw:any) => {
    const {face,regions,length}=params, evaluation=ctx.engineEvaluation;
    const project=ctx.projectService, storage=ctx.storageService, craft=ctx.craftService,
      expressions=ctx.expressionService, manager=ctx.projectManager, registry=ctx.cadRegistry;
    if (!evaluation || !project?.hasHostLifetime || !project.isDocumentCurrent(project.documentGeneration) ||
        manager?.unit !== 'millimeter' || storage?.revision == null) throw Error('A current host-bound millimeter workspace is required.');
    if (!(face?.root instanceof MOpenFaceShell) || registry.findFace(face.id)!==face ||
        !Array.isArray(regions) || regions.length!==1 || !(regions[0] instanceof MSketchRegion) ||
        regions[0].face!==face || registry.find(regions[0].id)!==regions[0]) throw Error('Select one current rectangle region on a sketch plane.');
    if (!Number.isSafeInteger(params.featureId) || params.featureId<=0 || !Number.isFinite(length) || length<=0 || length>1e6) throw Error('A valid feature and positive bounded depth are required.');
    const source=ctx.sketchStorageService.getSketchData(face.id);
    if (typeof source!=='string' || source.length>65536) throw Error('A bounded authored sketch is required.');
    const boundary=getSketchBoundaries(face),frame=sketchBoundaryFrame(face),generation=project.documentGeneration,
      sketchVersions=sketchRevision(storage,project.sketchStorageNamespace),history=craft.modifications$.value,epoch=craft.evaluationEpoch,
      sketchStorage=ctx.sketchStorageService, script=expressions.script$.value, scriptRevision=expressions.script$.revision,
      listRevision=expressions.list$.revision, errorsRevision=expressions.errors$.revision, table=expressions.table$.value, paramsCopy=Object.create(null);
    const entries=Object.entries(table);
    if (entries.length>256 || expressions.errors$.value.length) throw Error('Shared expressions are invalid or exceed limits.');
    for (const [key,value] of entries) {
      if (!/^[A-Za-z_$][A-Za-z0-9_$]{0,127}$/.test(key) || !Number.isFinite(value)) throw Error('Invalid shared sketch parameter.');
      paramsCopy[key]=value;
    }
    const parameterSnapshot=JSON.stringify(paramsCopy), regionId=regions[0].id,revision=crypto.randomUUID();
    if(expressions.isTyped){
      const prepared=prepareTypedRectangle(source,[],name=>expressions.resolveQuantity(name,'length'));
      for(const [name,value] of Object.entries(prepared.externalParameters)){if(Object.prototype.hasOwnProperty.call(paramsCopy,name))throw Error('Ambiguous typed sketch parameter.');paramsCopy[name]=value;}
    }
    // The face can legitimately leave the evaluation registry when the plane is
    // consumed, so its identity is checked before dispatch; publication checks
    // retain the exact immutable source and document lifetime instead.
    const sameSketchVersions=()=>{try{return sketchRevision(storage,project.sketchStorageNamespace)===sketchVersions}catch{return false}};
    const valid=()=>ctx.projectService===project && project.hasHostLifetime && project.isDocumentCurrent(generation) &&
      ctx.storageService===storage && sameSketchVersions() && ctx.cadRegistry===registry && ctx.craftService===craft &&
      craft.evaluationEpoch===epoch && craft.modifications$.value===history && ctx.expressionService===expressions &&
      expressions.script$.value===script && expressions.script$.revision===scriptRevision && expressions.list$.revision===listRevision &&
      expressions.errors$.revision===errorsRevision && JSON.stringify(expressions.table$.value)===parameterSnapshot &&
      ctx.projectManager===manager && manager.unit==='millimeter' && ctx.sketchStorageService===sketchStorage && sketchStorage.getSketchData(face.id)===source &&
      sameFrame(frame,sketchBoundaryFrame(face)) && boundaryGeometryClose(boundary,getSketchBoundaries(face));
    evaluation.requireCurrent(); if (!valid()) throw abort();
    const solved=await runSketchSolve(sketchWorker,{task:'rectangle-extrusion-solve',revision,sketchJSON:source,boundary,externalParameters:paramsCopy},
      {signal:evaluation.signal,valid});
    evaluation.requireCurrent(); if (!valid()) throw abort();
    if (!solved?.ok || solved.revision!==revision || typeof solved.serializedSketch!=='string' || solved.serializedSketch.length>65536 ||
        typeof solved.sketchDigest!=='string' || !/^[a-f0-9]{64}$/.test(solved.sketchDigest) || !Array.isArray(solved.evidence))
      throw Error(solved?.error?.message || 'The authored sketch could not be verified.');
    const workerPath=sameOriginPath(ociWorker), directory=workerPath.slice(0,workerPath.lastIndexOf('/')+1);
    for (const asset of [topologyModule,profileModule,regionsModule,planModule,holePlanModule,holeTopologyModule,prismBoundaryModule,cornerPlanModule,cornerTopologyModule,cornerProvenanceModule]) {
      const path=sameOriginPath(asset);
      if (path.slice(0,path.lastIndexOf('/')+1)!==directory) throw Error('Prism worker modules are not colocated.');
    }
    const occupiedIds=new Set<string>(registry.modelIndex.keys());
    const profile={version:2,unit:'millimeter',engine:'occ',revision,sketchDigest:solved.sketchDigest,
      faceId:face.id,regionId,frame,depth:length,sketchJSON:solved.serializedSketch};
    const result=await runWorkerRectangleExtrusion({evaluation,featureId:String(params.featureId),profile,bodyPolicy:'separate',booleanKind:'NONE',occupiedIds,
      assets:{workerUrl:workerPath,jsPath:sameOriginPath(occJs),wasmPath:sameOriginPath(occWasm),semanticWorkerUrl:sameOriginPath(semanticWorker)},valid,signal:evaluation.signal});
    result.requireCurrent(); if (!valid()) throw abort();
    return {created:[result.model],consumed:[face.root]};
  }
};
