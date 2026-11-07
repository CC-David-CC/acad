import {MOpenFaceShell} from '../model/mopenFace';
import {MSketchRegion} from '../model/msketchRegion';
import {PreparedSketchCommand} from './rectangleCreation';
import {inspectPublishedWorkerGeometry} from './inspectPublishedWorkerGeometry.mjs';
import {enclosurePlan,enclosurePlanV2} from 'engine/mount/enclosurePlan.mjs';

export interface WorkerFeatureInspection {
  readonly ready: boolean; readonly reason: string | null; readonly revision: string;
  readonly unit: 'millimeter'; readonly engine: 'occ';
  readonly capabilities: Readonly<{extrusion: boolean; centeredHole: boolean; fourCornerHoles: boolean; enclosureV1:boolean; enclosureV2:boolean}>;
  readonly extrusionCandidates: ReadonlyArray<Readonly<{faceId: string; regionId: string}>>;
  readonly centeredHoleCandidates: ReadonlyArray<Readonly<{bodyId: string; lidFaceId: string}>>;
  readonly fourCornerCandidates: ReadonlyArray<Readonly<{bodyId: string; centerWallId: string; sideIds: Readonly<{minX:string;maxX:string;minY:string;maxY:string}>}>>;
  readonly enclosureVersions: ReadonlyArray<Readonly<{version:number;unit:'millimeter';roles:ReadonlyArray<string>;fields:ReadonlyArray<string>}>>;
  readonly note: string;
}
export interface WorkerExtrusionCommand { revision: string; faceId: string; regionId: string; depth: number; }
export interface WorkerCenteredHoleCommand { revision: string; bodyId: string; lidFaceId: string; diameter: number; }
export interface WorkerFourCornerCommand { revision:string; bodyId:string; centerWallId:string; sideIds:{minX:string;maxX:string;minY:string;maxY:string}; diameter:number; offsetX:number; offsetY:number; }
export interface WorkerFeatureOptions { signal?: AbortSignal; valid?: () => boolean; }
export interface WorkerFeatureReceipt { readonly featureId: number; readonly bodyId: string; readonly lidFaceId: string; readonly unit: 'millimeter'; readonly persistence: 'volatile-workspace'; readonly revision: string; }

// Private craft entry points for two registered operations. These are not a
// generic dispatcher and never expose native or worker handles.
const fail=(message:string):never=>{throw new Error(message)};
const aborted=(committed=false)=>{const e=new DOMException(committed?'Accepted feature was superseded.':'Feature command was cancelled or superseded.','AbortError');Object.defineProperty(e,'committed',{value:committed,enumerable:true});return e;};
function fields(value:any,keys:string[]){const proto=value&&typeof value==='object'?Object.getPrototypeOf(value):undefined;if(!value||typeof value!=='object'||Array.isArray(value)||(proto!==null&&Object.getPrototypeOf(proto)!==null)||Reflect.ownKeys(value).length!==keys.length||Reflect.ownKeys(value).some(k=>typeof k!=='string'||!keys.includes(k)))fail('Invalid feature command.');const out:any={};for(const k of keys){const d=Object.getOwnPropertyDescriptor(value,k);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))fail('Feature fields must be data.');out[k]=d.value;}return out;}
function id(value:any,max:number){if(typeof value!=='string'||!value||value.length>max)fail('Invalid model reference.');return value;}
function optionsOf(value:any){if(value===undefined)value={};if(!value||typeof value!=='object'||Array.isArray(value)||Reflect.ownKeys(value).some(k=>typeof k!=='string'||!['signal','valid'].includes(k)))fail('Invalid command options.');const out:any={};for(const k of Reflect.ownKeys(value) as string[]){const d=Object.getOwnPropertyDescriptor(value,k);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))fail('Invalid command options.');out[k]=d.value;}if(out.valid!==undefined&&typeof out.valid!=='function')fail('Invalid lifetime guard.');if(out.signal!==undefined){try{Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get.call(out.signal)}catch{fail('Invalid cancellation signal.')}}return out;}
export function createWorkerFeatureCommands(ctx:any,submit:any,cancelEpoch:(epoch:number)=>void,submitEdit:any){
 const streams=()=>[ctx.craftService.modifications$,ctx.craftService.models$,ctx.craftService.pipelineFailure$,ctx.craftService.engineCleanupFailure$,ctx.expressionService.script$,ctx.expressionService.list$,ctx.expressionService.errors$,ctx.streams.sketcher.sketchingFace,ctx.wizardService.workingRequest$,ctx.workbenchService.currentWorkbench$,ctx.assemblyService.constraints$];
 const services=()=>[ctx.projectService,ctx.storageService,ctx.craftService,ctx.cadRegistry,ctx.operationService,ctx.expressionService,ctx.projectManager,ctx.services.sketcher,ctx.wizardService,ctx.workbenchService,ctx.assemblyService];
 const available=(operation:string)=>{try{return !!ctx.operationService.get(operation)}catch{return false}};
 function inspectWorkerFeatureCommands():WorkerFeatureInspection{
  const base=ctx.craftService.inspectRectangleCreation(),host=ctx.projectService.hasHostLifetime===true,worker=typeof Worker==='function'&&!!globalThis.crypto?.subtle&&!!navigator.locks,extrude=available('WORKER_RECTANGLE_EXTRUDE_V1'),hole=available('WORKER_CENTERED_THROUGH_HOLE_V1'),corners=available('WORKER_FOUR_CORNER_THROUGH_HOLES_V1'),reason=!host?'A current host-bound workspace is required.':!worker?'OCC worker support is unavailable.':base.reason;
  const extrusions:any[]=[],holes:any[]=[],cornerCandidates:any[]=[];
  if(!reason){for(const body of ctx.cadRegistry.shells){if(body instanceof MOpenFaceShell){for(const face of body.faces){if(ctx.cadRegistry.findFace(face.id)!==face)continue;for(const region of face.sketchRegions||[]){const d=region?.descriptor;if(region instanceof MSketchRegion&&region.face===face&&ctx.cadRegistry.find(region.id)===region&&d?.faceId===face.id&&Array.isArray(d.outer)&&d.outer.length===4&&Array.isArray(d.holes)&&!d.holes.length&&face.id.length<=1024&&region.id.length<=8192)extrusions.push(Object.freeze({faceId:face.id,regionId:region.id}));}}}else if(body?.ext?.workerGeometry?.representation==='worker-owned-occ-prism'&&body.ext.workerGeometry.engine==='occ'&&ctx.cadRegistry.find(body.id)===body){for(const face of body.faces||[]){const k=face?.topology?.data?.portableIdentity?.key;if(face.root===body&&ctx.cadRegistry.findFace(face.id)===face&&k?.kind==='face'&&k.role==='LID'&&typeof k.featureId==='string'&&k.source?.regionId&&face.id.length<=1024&&body.id.length<=1024&&face.id==='worker-prism:1:'+JSON.stringify([k.featureId,'face','LID',{regionId:k.source.regionId}])&&body.id==='worker-prism:1:'+JSON.stringify([k.featureId,'body']))holes.push(Object.freeze({bodyId:body.id,lidFaceId:face.id}));}}if(body?.ext?.workerGeometry?.representation==='worker-owned-occ-drilled'&&body.ext.workerGeometry.engine==='occ'&&ctx.cadRegistry.find(body.id)===body){const sides=body.ext.fourCornerSideIds;if(sides&&['minX','maxX','minY','maxY'].every(k=>typeof sides[k]==='string'&&sides[k].length>0&&sides[k].length<=1024)){for(const face of body.faces||[]){const k=face?.topology?.data?.portableIdentity?.key;if(face.root===body&&ctx.cadRegistry.findFace(face.id)===face&&k?.kind==='face'&&k.role==='HOLE_WALL'&&typeof k.featureId==='string'&&typeof k.source?.parentFeatureId==='string'&&typeof k.source?.regionId==='string'&&face.id==='worker-prism:1:'+JSON.stringify([k.featureId,'face','HOLE_WALL',k.source])&&body.id==='worker-prism:1:'+JSON.stringify([k.source.parentFeatureId,'body']))cornerCandidates.push(Object.freeze({bodyId:body.id,centerWallId:face.id,sideIds:Object.freeze({minX:sides.minX,maxX:sides.maxX,minY:sides.minY,maxY:sides.maxY})}));}}}if(extrusions.length>256||holes.length>256||cornerCandidates.length>256)fail('Too many feature candidates.');}}
  return Object.freeze({ready:!reason,reason:reason||null,revision:base.revision,unit:'millimeter',engine:'occ',capabilities:Object.freeze({extrusion:!!(worker&&extrude),centeredHole:!!(worker&&hole),fourCornerHoles:!!(worker&&corners),enclosureV1:!!(worker&&available('WORKER_ENCLOSURE_V1')),enclosureV2:!!(worker&&available('WORKER_ENCLOSURE_V2'))}),extrusionCandidates:Object.freeze(extrude?extrusions:[]),centeredHoleCandidates:Object.freeze(hole?holes:[]),fourCornerCandidates:Object.freeze(corners?cornerCandidates:[]),enclosureVersions:Object.freeze([1,2].filter(v=>worker&&available('WORKER_ENCLOSURE_V'+v)).map(v=>Object.freeze({version:v,unit:'millimeter' as const,roles:Object.freeze(v===2?['BODY','LID','LABEL']:['BODY','LID']),fields:Object.freeze(['width','length','height','wall','clearance','lidThickness','lipDepth',...(v===2?['labelWidth','labelLength','labelDepth']:[])])}))),note:'Registered OCC worker operations; assets and candidate geometry are verified when run.'});
 }
 async function execute(kind:'extrusion'|'hole'|'corners',input:any,rawOptions:any){
  const isExtrusion=kind==='extrusion',isCorners=kind==='corners',keys=isExtrusion?['revision','faceId','regionId','depth']:isCorners?['revision','bodyId','centerWallId','sideIds','diameter','offsetX','offsetY']:['revision','bodyId','lidFaceId','diameter'],args=fields(input,keys),opts=optionsOf(rawOptions),info=inspectWorkerFeatureCommands();
  id(args.revision,256);if(isExtrusion){id(args.faceId,1024);id(args.regionId,8192);}else{id(args.bodyId,1024);id(isCorners?args.centerWallId:args.lidFaceId,1024);}const dimension=isExtrusion?args.depth:args.diameter;if(typeof dimension!=='number'||!Number.isFinite(dimension)||dimension<=0||dimension>1e6)fail('A finite positive bounded millimeter dimension is required.');
  if(isCorners){args.sideIds=fields(args.sideIds,['minX','maxX','minY','maxY']);for(const k of ['minX','maxX','minY','maxY'])id(args.sideIds[k],1024);}
  if(isCorners&&['offsetX','offsetY'].some(k=>typeof args[k]!=='number'||!Number.isFinite(args[k])||args[k]<=0||args[k]>1e6))fail('Finite positive bounded offsets are required.');
  if(!info.ready)fail(info.reason||'Feature commands are unavailable.');if(!info.capabilities[isExtrusion?'extrusion':isCorners?'fourCornerHoles':'centeredHole'])fail('The requested OCC operation is unavailable.');if(args.revision!==info.revision)throw aborted();
  const choices=isExtrusion?info.extrusionCandidates:isCorners?info.fourCornerCandidates:info.centeredHoleCandidates;if(!choices.some((v:any)=>isExtrusion?v.faceId===args.faceId&&v.regionId===args.regionId:v.bodyId===args.bodyId&&(isCorners?v.centerWallId===args.centerWallId&&['minX','maxX','minY','maxY'].every(k=>v.sideIds[k]===args.sideIds[k]):v.lidFaceId===args.lidFaceId)))fail('The selected face, region or body is not a current supported candidate.');
  const hostValid=()=>{try{return (!opts.valid||opts.valid()===true)&&!opts.signal?.aborted}catch{return false}};if(!hostValid())throw aborted();
  const project=ctx.projectService,storage=ctx.storageService,craft=ctx.craftService,manager=ctx.projectManager,registry=ctx.cadRegistry,documentGeneration=project.documentGeneration,storageRevision=storage.revision,capturedServices=services(),capturedStreams=streams(),versions=capturedStreams.map(s=>s.revision),selectedFace=registry.findFace(isExtrusion?args.faceId:isCorners?args.centerWallId:args.lidFaceId),selected=isExtrusion?registry.find(args.regionId):registry.find(args.bodyId),candidateScope:{epoch:number|null}={epoch:null};
  let settled=false,receipt:any=null;const alive=()=>hostValid()&&ctx.projectService===project&&project.isDocumentCurrent(documentGeneration)&&ctx.storageService===storage&&ctx.craftService===craft&&ctx.cadRegistry===registry&&ctx.projectManager===manager;
  const requireCurrent=()=>{if(!alive()||services().some((s,i)=>s!==capturedServices[i])||storage.revision!==storageRevision||streams().some((s,i)=>s!==capturedStreams[i]||s.revision!==versions[i])||registry.findFace(isExtrusion?args.faceId:isCorners?args.centerWallId:args.lidFaceId)!==selectedFace||registry.find(isExtrusion?args.regionId:args.bodyId)!==selected)throw aborted();};
  const stop=()=>{if(!settled&&candidateScope.epoch!==null)cancelEpoch(candidateScope.epoch);},poll=()=>{if(!alive())stop();};opts.signal?.addEventListener('abort',stop,{once:true});const timer=setInterval(poll,100);let featureId:string=null;
  try{requireCurrent();featureId=project.counterGenerator.generateFeatureId();const expectedBody=isExtrusion?'worker-prism:1:'+JSON.stringify([featureId,'body']):args.bodyId,preparation:PreparedSketchCommand={candidateScope,requireCurrent,requireCommittedCurrent(){if(!alive())throw aborted(true);},async prepare(models:any[]){requireCurrent();const matches=models.filter(m=>m.id===expectedBody),model=matches[0],representation=isExtrusion?'worker-owned-occ-prism':isCorners?'worker-owned-occ-four-corner':'worker-owned-occ-drilled';if(matches.length!==1||model?.ext?.workerGeometry?.representation!==representation)fail('The expected checked feature was not produced.');const lid=model.faces.filter((f:any)=>f.topology?.data?.portableIdentity?.key?.role==='LID');if(lid.length!==1)fail('The checked LID is unavailable.');receipt={featureId:Number(featureId),bodyId:model.id,lidFaceId:lid[0].id,unit:'millimeter',persistence:'volatile-workspace'};return null;}};
   await new Promise<void>((yes,no)=>submit({type:isExtrusion?'WORKER_RECTANGLE_EXTRUDE_V1':isCorners?'WORKER_FOUR_CORNER_THROUGH_HOLES_V1':'WORKER_CENTERED_THROUGH_HOLE_V1',params:isExtrusion?{featureId:Number(featureId),face:args.faceId,regions:[args.regionId],length:dimension}:isCorners?{featureId:Number(featureId),face:args.centerWallId,sideIds:args.sideIds,diameter:dimension,offsetX:args.offsetX,offsetY:args.offsetY}:{featureId:Number(featureId),face:args.lidFaceId,diameter:dimension}},yes,no,preparation));if(!receipt)fail('Feature publication did not produce a receipt.');return Object.freeze({...receipt,revision:inspectWorkerFeatureCommands().revision});
  }catch(error){if(!alive()&&!error?.committed)throw aborted();throw error;}finally{settled=true;clearInterval(timer);opts.signal?.removeEventListener('abort',stop);if(featureId!==null)project.counterGenerator.releaseFeatureId(featureId);}
 }
 async function createWorkerEnclosure(input:any,rawOptions:any){
  const version=Object.getOwnPropertyDescriptor(input||{},'version');if(!version?.enumerable||!Object.prototype.hasOwnProperty.call(version,'value')||![1,2].includes(version.value))fail('Unsupported enclosure version.');
  const dims=['width','length','height','wall','clearance','lidThickness','lipDepth'],label=['labelWidth','labelLength','labelDepth'],args=fields(input,['revision','version','unit',...dims,...(version.value===2?label:[])]),opts=optionsOf(rawOptions),info=inspectWorkerFeatureCommands();id(args.revision,256);
  if(args.unit!=='millimeter'||!info.ready||!info.capabilities[version.value===2?'enclosureV2':'enclosureV1'])fail(info.reason||'Enclosure creation is unavailable.');if(args.revision!==info.revision)throw aborted();
  const plan:any={unit:'millimeter'};for(const key of dims)plan[key]=args[key];if(version.value===2)plan.label={width:args.labelWidth,length:args.labelLength,depth:args.labelDepth};if(version.value===2)enclosurePlanV2(plan);else enclosurePlan(plan);
  const project=ctx.projectService,storage=ctx.storageService,craft=ctx.craftService,manager=ctx.projectManager,registry=ctx.cadRegistry,generation=project.documentGeneration,storageRevision=storage.revision,capturedServices=services(),capturedStreams=streams(),versions=capturedStreams.map(s=>s.revision),scope:{epoch:number|null}={epoch:null};
  const hostValid=()=>{try{return (!opts.valid||opts.valid()===true)&&!opts.signal?.aborted}catch{return false}},alive=()=>hostValid()&&ctx.projectService===project&&project.isDocumentCurrent(generation)&&ctx.storageService===storage&&ctx.craftService===craft&&ctx.cadRegistry===registry&&ctx.projectManager===manager;
  const requireCurrent=()=>{if(!alive()||services().some((s,i)=>s!==capturedServices[i])||storage.revision!==storageRevision||streams().some((s,i)=>s!==capturedStreams[i]||s.revision!==versions[i]))throw aborted();};let settled=false,featureId:string=null,receipt:any=null;
  const stop=()=>{if(!settled&&scope.epoch!==null)cancelEpoch(scope.epoch)},timer=setInterval(()=>{if(!alive())stop()},100);opts.signal?.addEventListener('abort',stop,{once:true});
  try{requireCurrent();featureId=project.counterGenerator.generateFeatureId();const expected=version.value===2?['BODY','LID','LABEL']:['BODY','LID'],preparation:PreparedSketchCommand={candidateScope:scope,requireCurrent,requireCommittedCurrent(){if(!alive())throw aborted(true)},async prepare(models:any[]){requireCurrent();const roles:any={};for(const role of expected){const id='worker-enclosure:'+version.value+':'+JSON.stringify([Number(featureId),role]),matches=models.filter(m=>m.id===id);if(matches.length!==1||matches[0]?.featureId!==Number(featureId)||matches[0]?.outputRole!==role||matches[0]?.ext?.workerGeometry?.representation!=='worker-owned-occ-enclosure')fail('The checked enclosure outputs are unavailable.');roles[role]=id;}receipt={featureId:Number(featureId),roles:Object.freeze(roles),version:version.value,unit:'millimeter',persistence:'volatile-workspace'};return null;}};
   const params:any={featureId:Number(featureId)};for(const key of dims)params[key]=args[key];if(version.value===2)for(const key of label)params[key]=args[key];await new Promise<void>((yes,no)=>submit({type:'WORKER_ENCLOSURE_V'+version.value,params},yes,no,preparation));if(!receipt)fail('The enclosure was not published.');return Object.freeze({...receipt,revision:inspectWorkerFeatureCommands().revision});
  }catch(error){if(!alive()&&!error?.committed)throw aborted();throw error}finally{settled=true;clearInterval(timer);opts.signal?.removeEventListener('abort',stop);if(featureId!==null)project.counterGenerator.releaseFeatureId(featureId)}
 }
 function inspectWorkerHistory(){
  if(!ctx.projectService.hasHostLifetime||!ctx.projectService.isDocumentCurrent(ctx.projectService.documentGeneration))fail('A current host-bound workspace is required.');
  const craft=ctx.craftService,history=craft.modifications$.value;
  if(!Array.isArray(history?.history)||history.history.length>256)fail('History is unavailable or too large.');
  const features=history.history.flatMap((entry:any,index:number)=>{
   if(!['WORKER_RECTANGLE_EXTRUDE_V1','WORKER_CENTERED_THROUGH_HOLE_V1','WORKER_FOUR_CORNER_THROUGH_HOLES_V1'].includes(entry.type))return [];
   const featureId=Number(entry.params?.featureId);
   const names=entry.type==='WORKER_RECTANGLE_EXTRUDE_V1'?['length']:entry.type==='WORKER_CENTERED_THROUGH_HOLE_V1'?['diameter']:['diameter','offsetX','offsetY'];
   if(!Number.isSafeInteger(featureId)||featureId<1||names.some(k=>{const v=entry.params?.[k];return !(typeof v==='number'&&Number.isFinite(v)||typeof v==='string'&&v.length<=128&&(/^[A-Za-z_$][A-Za-z0-9_$]{0,127}$/.test(v)||Number.isFinite(Number(v))&&v.trim()!==''));}))fail('Invalid authored feature.');
   const values:any={};for(const key of names)values[key==='length'?'depth':key]=entry.params[key];
   return [Object.freeze({index,featureId,type:entry.type,...values})];
  });
  return Object.freeze({revision:craft.inspectRectangleCreation().revision,pointer:history.pointer,features:Object.freeze(features)});
 }
 async function editWorkerExtrusion(input:any,rawOptions:any){
  const args=fields(input,['revision','index','featureId','depth']),opts=optionsOf(rawOptions),info=inspectWorkerHistory();
  id(args.revision,256);
  if(!Number.isSafeInteger(args.index)||args.index<0||!Number.isSafeInteger(args.featureId)||args.featureId<1||typeof args.depth!=='number'||!Number.isFinite(args.depth)||args.depth<=0||args.depth>1e6)fail('Invalid extrusion edit.');
  const craft=ctx.craftService,project=ctx.projectService,storage=ctx.storageService,manager=ctx.projectManager,registry=ctx.cadRegistry,history=craft.modifications$.value;
  if(args.revision!==info.revision)throw aborted();
  if(!project.hasHostLifetime||!project.isDocumentCurrent(project.documentGeneration)||storage.revision===null||manager.isRestoring||craft.isProcessing||craft.pipelineFailure$.value||craft.engineCleanupFailure$.value||ctx.services.sketcher.inPlaceEditor.inEditMode)fail('Finish the current operation before editing.');
  const inspectedFeature=info.features.find((v:any)=>v.index===args.index&&v.featureId===args.featureId);
  if(inspectedFeature&&typeof inspectedFeature.depth==='string'&&/^[A-Za-z_$][A-Za-z0-9_$]{0,127}$/.test(inspectedFeature.depth))fail('This dimension is parameter-bound; edit it in Parameters.');
  const workbench=ctx.workbenchService.currentWorkbench$.value;
  if(manager.unit!=='millimeter'||ctx.expressionService.errors$.value.length||ctx.assemblyService.getConstraints().length||(workbench&&!workbench.internal&&workbench.workbenchId!==ctx.workbenchService.defaultWorkbenchId))fail('This edit requires a valid millimeter part workspace.');
  // At the full tip the agent and UI can share the same authored edit path.
  if (history.pointer===history.history.length-1) {
   const feature=info.features.find((v:any)=>v.index===args.index&&v.featureId===args.featureId);if(!feature||ctx.wizardService.workingRequest$.value)fail('The selected extrusion is unavailable.');
   const capturedServices=services(),capturedStreams=streams(),versions=capturedStreams.map(s=>s.revision);
   const valid=()=> (!opts.valid||opts.valid()===true) && services().every((s,i)=>s===capturedServices[i]);
   const beforePublish=()=>streams().every((s,i)=>s===capturedStreams[i]&&s.revision===versions[i]);
   const journal=(craft as any).inspectAuthoredEdits();
   const result=await (craft as any).authoredDepthOperation({revision:journal.revision,index:args.index,featureId:args.featureId,depth:args.depth},{signal:opts.signal,valid,beforePublish});
   return Object.freeze({featureId:args.featureId,index:args.index,depth:args.depth,unit:'millimeter',persistence:'volatile-workspace',revision:inspectWorkerHistory().revision,changed:result.changed});
  }
  if(history.pointer!==args.index-1||!info.features.some((v:any)=>v.index===args.index&&v.featureId===args.featureId))fail('Rewind to the feature before editing it.');
  const original=history.history[args.index],working=ctx.wizardService.workingRequest$.value;
  if(working&&(!working.hints?.noWizardFocus||working.type!==original.type||JSON.stringify(working.params)!==JSON.stringify(original.params)))fail('Finish the current operation before editing.');
  const request=JSON.parse(JSON.stringify(original));request.params.length=args.depth;
  const documentGeneration=project.documentGeneration,storageRevision=storage.revision,capturedServices=services(),capturedStreams=streams(),versions=capturedStreams.map(s=>s.revision),candidateScope:{epoch:number|null}={epoch:null};
  const alive=()=>{try{return (!opts.valid||opts.valid()===true)&&!opts.signal?.aborted&&ctx.projectService===project&&project.isDocumentCurrent(documentGeneration)&&ctx.storageService===storage&&ctx.craftService===craft&&ctx.cadRegistry===registry&&ctx.projectManager===manager}catch{return false}};
  const requireCurrent=()=>{if(!alive()||services().some((s,i)=>s!==capturedServices[i])||storage.revision!==storageRevision||streams().some((s,i)=>s!==capturedStreams[i]||s.revision!==versions[i]))throw aborted();};
  let settled=false;const stop=()=>{if(!settled&&candidateScope.epoch!==null)cancelEpoch(candidateScope.epoch);};const timer=setInterval(()=>{if(!alive())stop();},100);opts.signal?.addEventListener('abort',stop,{once:true});
  try{
   requireCurrent();const expected='worker-prism:1:'+JSON.stringify([String(args.featureId),'body']);
   const preparation:PreparedSketchCommand={candidateScope,requireCurrent,requireCommittedCurrent(){if(!alive())throw aborted(true);},async prepare(models:any[]){requireCurrent();const found=models.filter(m=>m.id===expected);if(found.length!==1||found[0]?.ext?.workerGeometry?.representation!=='worker-owned-occ-prism')fail('The edited extrusion was not produced.');return null;}};
   await new Promise<void>((yes,no)=>submitEdit(request,yes,no,preparation));
   return Object.freeze({featureId:args.featureId,index:args.index,depth:args.depth,unit:'millimeter',persistence:'volatile-workspace',revision:inspectWorkerHistory().revision});
  }catch(error){if(!alive()&&!error?.committed)throw aborted();throw error;}finally{settled=true;clearInterval(timer);opts.signal?.removeEventListener('abort',stop);}
 }
 async function editHole(kind:'centered'|'corners',input:any,rawOptions:any) {
  const dimensions=kind==='centered'?['diameter']:['diameter','offsetX','offsetY'];
  const args=fields(input,['revision','index','featureId',...dimensions]),opts=optionsOf(rawOptions),info=inspectWorkerHistory();
  id(args.revision,256);
  if(args.revision!==info.revision)throw aborted();
  const type=kind==='centered'?'WORKER_CENTERED_THROUGH_HOLE_V1':'WORKER_FOUR_CORNER_THROUGH_HOLES_V1';
  if(!Number.isSafeInteger(args.index)||!Number.isSafeInteger(args.featureId)||!info.features.some((v:any)=>v.index===args.index&&v.featureId===args.featureId&&v.type===type)||dimensions.some(k=>typeof args[k]!=='number'||!Number.isFinite(args[k])||args[k]<=0||args[k]>1e6))fail('Invalid hole edit.');
  const selected=info.features.find((v:any)=>v.index===args.index&&v.featureId===args.featureId&&v.type===type);if(dimensions.some(k=>typeof selected[k]==='string'&&/^[A-Za-z_$][A-Za-z0-9_$]{0,127}$/.test(selected[k])))fail('This dimension is parameter-bound; edit it in Parameters.');
  const craft=ctx.craftService,ready=craft.inspectRectangleCreation();
  if(!ready.ready || ctx.wizardService.workingRequest$.value)fail(ready.reason||'Finish the current operation first.');
  const current=craft.inspectAuthoredEdits();
  const values:any={};for(const key of dimensions)values[key]=args[key];
  const result=await craft.authoredHoleOperation(kind,{revision:current.revision,index:args.index,featureId:args.featureId,...values},opts);
  return Object.freeze({index:args.index,featureId:args.featureId,dimensions:result.dimensions||Object.freeze(values),changed:result.changed,unit:'millimeter',persistence:'volatile-workspace',revision:inspectWorkerHistory().revision});
 }
 async function beginWorkerCenteredParentRepair(input:any,rawOptions:any) {
  const args=fields(input,['revision','index','featureId']),opts=optionsOf(rawOptions),info=inspectWorkerHistory();id(args.revision,256);
  if(args.revision!==info.revision)throw aborted();
  if(!Number.isSafeInteger(args.index)||!Number.isSafeInteger(args.featureId)||!info.features.some((v:any)=>v.index===args.index&&v.featureId===args.featureId&&v.type==='WORKER_CENTERED_THROUGH_HOLE_V1'))fail('The selected hole is unavailable.');
  return ctx.craftService.beginCenteredParentRepair(args,opts);
 }
 async function repairWorkerCenteredHoleParent(input:any,rawOptions:any) {
  const args=fields(input,['revision','index','featureId','faceId']),opts=optionsOf(rawOptions),info=inspectWorkerHistory();
  id(args.revision,256);id(args.faceId,1024);
  if(args.revision!==info.revision)throw aborted();
  if(!Number.isSafeInteger(args.index)||!Number.isSafeInteger(args.featureId)||!info.features.some((v:any)=>v.index===args.index&&v.featureId===args.featureId&&v.type==='WORKER_CENTERED_THROUGH_HOLE_V1'))fail('The selected hole is unavailable.');
  return ctx.craftService.repairCenteredParent(args,opts);
 }
 return {beginWorkerCenteredParentRepair,repairWorkerCenteredHoleParent,inspectWorkerFeatureCommands,inspectWorkerHistory,createWorkerEnclosure,inspectPublishedWorkerGeometry:()=>inspectPublishedWorkerGeometry(ctx),editWorkerExtrusion,
  editWorkerCenteredHole:(input:any,options?:WorkerFeatureOptions)=>editHole('centered',input,options),
  editWorkerFourCornerHoles:(input:any,options?:WorkerFeatureOptions)=>editHole('corners',input,options),
  createWorkerExtrusion:(input:WorkerExtrusionCommand,options?:WorkerFeatureOptions):Promise<WorkerFeatureReceipt>=>execute('extrusion',input,options),createWorkerCenteredHole:(input:WorkerCenteredHoleCommand,options?:WorkerFeatureOptions):Promise<WorkerFeatureReceipt>=>execute('hole',input,options),createWorkerFourCornerHoles:(input:WorkerFourCornerCommand,options?:WorkerFeatureOptions):Promise<WorkerFeatureReceipt>=>execute('corners',input,options)};
}
