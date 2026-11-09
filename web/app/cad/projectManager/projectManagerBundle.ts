import {PROJECTS_PREFIX, SKETCH_SUFFIX, ProjectService} from '../projectBundle';
import {ProjectManager} from './ProjectManager';
import exportTextData from 'gems/exportTextData';
import {SketchFormat_V3, validateProjectSketch} from "sketcher/io";
import {ApplicationContext} from "cad/context";
import {OperationRequest} from "../craft/craftBundle";
import {AssemblyConstraintDefinition} from "cad/assembly/assemblyConstraint";
import {parseMathDefinitions} from 'gems/safeExpression.mjs';
import {decodePhysicalSource} from '../parameters/physicalSource.mjs';
import {createCandidateExpressionFacade} from '../parameters/candidateExpressionFacade.mjs';
import {armPreparedPhysicalState} from '../parameters/preparedPhysicalState.mjs';
import {manufacturingTo3mf} from '../export/manufacturingTo3mf.mjs';
import {workerEnclosure3mf} from '../export/workerEnclosure3mf';
import {workerGeneric3mf} from '../export/workerGeneric3mf';
import {workerLinkedDrawingSvg} from '../export/workerLinkedDrawingSvg';
import {AUTHORED_SOLID_KINDS} from '../../../../modules/engine/solid/authoredSolidKinds.mjs';
import {encodeProjectEnvelope, decodeProjectEnvelope, validateProjectTree} from './projectEnvelope.mjs';
import {captureDisplayUnitsMetadata,formatDisplayQuantity as formatQuantity} from './displayUnits.mjs';
import projectValidationWorkerUrl from 'codi-project-validation-worker';
import {projectValidationFailureCode} from './projectValidationCodes.mjs';
import {prepareManufacturingSnapshot, geometryRevision, proposeManufacturingRebind, PREPARE_LIMIT_BYTES, resolveManufacturingAssignments} from './manufacturingMetadata.mjs';
import {assertLegacyGeometry} from 'cad/model/workerGeometry';
import {restoreTimeout,projectRebuildWaitMs} from './restoreTimeout.mjs';
import {failOwnedRestore} from './failOwnedRestore.mjs';
import {captureDocumentJobOptions} from './captureDocumentJobOptions.mjs';
import {hashCanonicalInWorker,assertCanonicalHashWorkerAvailable,closeCanonicalHashWorker} from './incrementalCanonical.mjs';
import {assignEnclosureMaterials} from './enclosureMaterialAssignment.mjs';
import {prepareManufacturingForSave} from './workerSavePreparation.mjs';
import manufacturingHashWorkerUrl from 'codi-manufacturing-hash-worker';
import manufacturingPublicationWorkerUrl from 'codi-manufacturing-publication-worker';
import {prepareManufacturingInWorker,assertManufacturingPreparationAvailable} from './manufacturingPublicationClient.mjs';
import {readManufacturingWorkerPreparation} from './documentMetadataPreparation.mjs';
import {captureGenericManufacturingRequest,prepareGenericManufacturingMetadata,GENERIC_MANUFACTURING_LIMITS} from './genericManufacturingAssignment.mjs';
import {captureGenericManufacturingBodies} from './genericManufacturingBodies';
import {assertPipelineHistoryCurrent} from '../craft/capturePipelineHistory.mjs';
import type {GenericManufacturingTarget,GenericManufacturingSummary} from './genericManufacturingAssignment.mjs';
import {captureLinkedPartDrawingRequest} from '../../../../modules/drawing/linkedPartDrawingOperation.mjs';
import type {LinkedPartDrawingDefinition} from '../../../../modules/drawing/linkedPartDrawingDefinition.mjs';
import {captureLinkedPartDrawingDefinition} from '../../../../modules/drawing/linkedPartDrawingDefinition.mjs';
import nativeArchiveWorkerUrl from 'codi-native-archive-worker';
import {createNativeArchiveOwner} from './nativeArchiveClient';

const drawingAborted=Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get;
const drawingListen=EventTarget.prototype.addEventListener,drawingUnlisten=EventTarget.prototype.removeEventListener;

// Caller signals are native-branded; own properties/methods cannot change
// cancellation truth or strand registered document/hash listeners.
const documentSignalAborted=Function.call.bind(Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get);
const addDocumentAbortListener=Function.call.bind(EventTarget.prototype.addEventListener);
const removeDocumentAbortListener=Function.call.bind(EventTarget.prototype.removeEventListener);

// Failed release fences allocations for this imported module, across document
// replacement. A new app window may share it; only a fresh module resets it.
let failedProjectWorkerCleanup: any = null;
function requireProjectWorkerCleanup(): void {
  if(failedProjectWorkerCleanup)throw failedProjectWorkerCleanup;
  assertCanonicalHashWorkerAvailable();
}
function projectWorkerCleanupError(cause: any, operationError: any): Error {
  const failure=Object.assign(new Error('Project Worker cleanup failed; reload this client module before evaluating again.'),
    {code:'WORKER_CLEANUP_FAILED',cause,operationError});
  if(!failedProjectWorkerCleanup)failedProjectWorkerCleanup=failure;
  return failure;
}

export function activate(ctx: ApplicationContext) {
  interface DocumentJob {
    project: ProjectService;
    storage: ApplicationContext['storageService'];
    generation: number;
    signal: AbortSignal;
    cancellationSignal?: AbortSignal;
    guard(): void;
  }
  let restoringSnapshot: DocumentJob | null = null;
  let restorePending: DocumentJob | null = null;
  let snapshotWorkspaceUncertain: DocumentJob | null = null;
  // This activation may only act through its own installed manager. Capturing
  // a later ctx.projectManager would let an orphaned service bless stale data.
  let managerAuthority: IProjectManager | null = null;
  let archiveOwner: ReturnType<typeof createNativeArchiveOwner> | null = null;
  let archiveCleanupFailure:any=null;
  function closeNativeArchive(): void {if(archiveCleanupFailure)throw archiveCleanupFailure;const owner=archiveOwner;archiveOwner=null;try{owner?.close();}catch(error){archiveCleanupFailure=error;throw error;}}
  function nativeArchiveOwner(job:DocumentJob){
    job.guard();requireManagerAuthority();
    if(ownsDocument(restorePending))throw Object.assign(new Error('A native archive restore is in progress.'),{code:'CAD_ARCHIVE_BUSY'});
    if(!archiveOwner?.available)archiveOwner=createNativeArchiveOwner(nativeArchiveWorkerUrl,job.signal);
    return archiveOwner;
  }
  function managerIsCurrent(): boolean {
    return managerAuthority!==null&&ctx.projectManager===managerAuthority&&ctx.services.projectManager===managerAuthority;
  }
  function requireManagerAuthority(): void {
    if(!managerIsCurrent())throw new DOMException('Project manager was replaced.','AbortError');
  }
  function currentManagerProject(): ProjectService | null {return managerIsCurrent()?ctx.projectService:null;}

  function ownsDocument(job: DocumentJob | null): boolean {
    return managerIsCurrent()&&!!job && ctx.projectService === job.project && job.project.isDocumentCurrent(job.generation);
  }

  function documentJob(rawOptions: {signal?: AbortSignal, valid?: () => boolean} = {}, replace = false): DocumentJob {
    requireManagerAuthority();
    const options=captureDocumentJobOptions(rawOptions);
    const project = ctx.projectService;
    let generation = project.documentGeneration;
    const check=(invokeCaller:boolean)=>{
      requireManagerAuthority();
      const callerValid = (options.signal===undefined||!documentSignalAborted(options.signal)) && (!invokeCaller || !options.valid || options.valid());
      requireManagerAuthority();
      // The external guard may synchronously trigger an account/window change.
      // Check document and storage ownership after invoking it as well.
      if (!callerValid || !ownsDocument(job) || documentSignalAborted(job.signal) || ctx.storageService !== job.storage || ctx.services.storage !== job.storage || options.signal!==undefined&&documentSignalAborted(options.signal) || ctx.projectService !== project || project.documentGeneration !== generation || project.documentSignal !== job.signal) {
        throw new DOMException('Document was replaced, closed or cancelled.', 'AbortError');
      }
    };
    const job: DocumentJob = {project, generation, storage: ctx.storageService, signal: project.documentSignal, cancellationSignal:options.signal, guard(){check(true);}};
    if(replace){
      // External validity is checked before the irreversible lifetime change.
      // After it, perform passive checks without calling that callback again.
      job.guard();
      generation=project.beginDocumentChange();job.generation=generation;job.signal=project.documentSignal;
    }
    try { check(!replace); }
    catch(error) {
      if(replace)throw failOwnedRestore({job,currentProject:currentManagerProject,rollback:()=>{},error});
      throw error;
    }
    return job;
  }

  function restoreUnavailable(): boolean {
    return ownsDocument(restoringSnapshot) || ownsDocument(snapshotWorkspaceUncertain);
  }
  // Experimental host-only metadata. Never attach to reconstructed shell IDs.
  let manufacturingMetadata: any = null;
  let manufacturingRevision = 0;
  let pendingManufacturingRebind: any = null;
  let inspectedRevision: string = null;
  let inspectedFingerprint: any[] = [];
  let materialSurfaceRevision: string = null;
  let materialSurfaceFingerprint: any[] = [];
  let presentationMetadata: Readonly<{version:1,lengthUnit:'inch'}> | null = null;
  let presentationRevision = 0;
  let drawingDefinition: LinkedPartDrawingDefinition | null = null;
  let drawingRevision = 0;
  let drawingLifetime: {signal:AbortSignal,stop:()=>void} | null = null;
  const manufacturingPublications = new WeakMap<object,any>();

  // Definitions belong to this document lifetime, not reconstructed bodies.
  // Intrinsic event methods cannot be replaced by a signal's own properties.
  function resetDrawingLifetime(generation:number): void {
    const project=ctx.projectService,signal=project.documentSignal;
    if(drawingAborted.call(signal)||!project.isDocumentCurrent(generation))throw new DOMException('Stale drawing document.','AbortError');
    if(drawingLifetime)drawingUnlisten.call(drawingLifetime.signal,'abort',drawingLifetime.stop);
    const slot={signal,stop(){if(drawingLifetime!==slot)return;drawingLifetime=null;drawingDefinition=null;drawingRevision++;}};
    drawingLifetime=slot;
    drawingListen.call(signal,'abort',slot.stop,{once:true});
    if(ctx.projectService!==project||project.documentSignal!==signal||drawingAborted.call(signal)||!project.isDocumentCurrent(generation)){slot.stop();drawingUnlisten.call(signal,'abort',slot.stop);throw new DOMException('Stale drawing document.','AbortError');}
  }
  function getLinkedPartDrawingDefinition(): LinkedPartDrawingDefinition | null {return drawingDefinition;}
  function requireRestoreManager(manager:IProjectManager): void {
    requireManagerAuthority();
    if(ctx.projectManager!==manager||ctx.services.projectManager!==manager||manager?.getLinkedPartDrawingDefinition!==getLinkedPartDrawingDefinition)throw new DOMException('Project manager was replaced.','AbortError');
  }

  // Independent authored inputs must stay checkable across craft's own epoch
  // transition, without refreshing and accepting a changed document token.
  function inspectMaterialSurfaceRevision(): string {
    const job = documentJob(); job.guard();
    if (restoreUnavailable()) throw new Error('Project is not ready');
    const values = [ctx.projectService, job.generation, manufacturingRevision,
      ctx.surfacingService, ctx.surfacingService?.state$.value.revision];
    if (!materialSurfaceRevision || values.some((value, index) => value !== materialSurfaceFingerprint[index])) {
      materialSurfaceFingerprint = values;
      materialSurfaceRevision = crypto.randomUUID();
    }
    return materialSurfaceRevision;
  }

  // A document revision covers authored appearance/material and surface edits
  // as well as craft/sketch history. Do not hash or copy the whole document
  // merely to obtain a token for a small command.
  function inspectDocumentRevision(): string {
    const job = documentJob(); job.guard();
    if (restoreUnavailable()) throw new Error('Project is not ready');
    const values = [ctx.craftService.inspectRectangleCreation().revision, inspectMaterialSurfaceRevision(),presentationRevision,drawingRevision];
    if (!inspectedRevision || values.some((value, index) => value !== inspectedFingerprint[index])) {
      inspectedFingerprint = values;
      inspectedRevision = crypto.randomUUID();
    }
    return inspectedRevision;
  }

  function displayJob(options: {signal?:AbortSignal,valid?:()=>boolean} = {}): DocumentJob {
    const job=documentJob(options);job.guard();
    if(ctx.projectManager?.inspectDisplayUnits!==inspectDisplayUnits||!job.project.hasHostLifetime||restoreUnavailable()||ownsDocument(restorePending))throw Object.assign(Error('A current host-bound document is required.'),{code:'INVALID_WORKSPACE'});
    return job;
  }
  function inspectDisplayUnits(): DisplayUnitsInspection {
    displayJob();
    return Object.freeze({revision:inspectDocumentRevision(),canonicalLengthUnit:'millimeter',canonicalAngleUnit:'radian',lengthUnit:presentationMetadata?'inch':'millimeter',angleUnit:'degree'});
  }
  function setDisplayUnits(input: {revision:string,lengthUnit:'millimeter'|'inch'}, options: {signal?:AbortSignal,valid?:()=>boolean} = {}): DisplayUnitsReceipt {
    if(!input||typeof input!=='object'||Array.isArray(input)||Reflect.ownKeys(input).length!==2)throw Object.assign(Error('Expected exact display-unit fields.'),{code:'INVALID_REQUEST'});
    const captured:any={};for(const key of ['revision','lengthUnit']){const d=Object.getOwnPropertyDescriptor(input,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))throw Object.assign(Error('Display-unit fields must be own data.'),{code:'INVALID_REQUEST'});captured[key]=d.value;}
    if(typeof captured.revision!=='string'||!captured.revision||captured.revision.length>256||!['millimeter','inch'].includes(captured.lengthUnit))throw Object.assign(Error('Invalid display-unit selection.'),{code:'INVALID_REQUEST'});
    const manager=ctx.projectManager,craft=ctx.craftService;
    const job=displayJob(captureDocumentJobOptions(options,true));
    const requireReady=()=>{
      if(ctx.projectManager!==manager||ctx.craftService!==craft)throw new DOMException('Display-unit services changed.','AbortError');
      if(craft.isProcessing||craft.isEditingHistory||craft.pipelineFailure$.value||craft.engineCleanupFailure$?.value||ctx.services.sketcher.inPlaceEditor.inEditMode||ctx.wizardService.workingRequest$.value)throw Object.assign(Error('Finish the current sketch, operation or history edit before changing display units.'),{code:'WORKSPACE_BUSY'});
    };
    const requireRevision=()=>{if(captured.revision!==inspectDocumentRevision())throw Object.assign(Error('Display-unit revision is stale.'),{code:'STALE_REVISION'});};
    requireReady();requireRevision();
    const next=captured.lengthUnit==='inch'?captureDisplayUnitsMetadata({version:1,lengthUnit:'inch'}):null;
    job.guard();
    // The external lifetime callback may synchronously accept a newer edit or
    // change the active modeling services. Revalidate before the linearization
    // point, including the no-op path; no caller callback follows these checks.
    requireReady();requireRevision();requireReady();
    if((presentationMetadata?.lengthUnit||'millimeter')===captured.lengthUnit)return Object.freeze({...inspectDisplayUnits(),changed:false,authoredUndo:false});
    presentationMetadata=next;presentationRevision++;
    try {return Object.freeze({...inspectDisplayUnits(),changed:true,authoredUndo:false});}
    catch(error){const failure=Object.assign(Error('Display units changed, but the document is no longer current.'),{committed:true});throw failure;}
  }
  function getPresentationMetadata(): Readonly<{version:1,lengthUnit:'inch'}> | null {return presentationMetadata;}

  // Called by a real document reset, not by ordinary history replay. An old
  // restore's finally/catch must never clear or poison a later document.
  function resetDocumentState(generation: number): void {
    requireManagerAuthority();
    if (!ctx.projectService.isDocumentCurrent(generation)) throw new DOMException('Stale document reset.', 'AbortError');
    closeNativeArchive();
    resetDrawingLifetime(generation);
    drawingDefinition = null; drawingRevision++;
    manufacturingMetadata = null; manufacturingRevision++;
    presentationMetadata = null; presentationRevision++;
    pendingManufacturingRebind = null;
    snapshotWorkspaceUncertain = null;
  }
  function hasManufacturingMetadata(): boolean { return manufacturingMetadata !== null; }
  // Bounded authored references only. Works at an accepted prefix without
  // cloning metadata or treating prefix geometry as assignable current parts.
  function inspectAuthoredManufacturingReferences(){
    const job=documentJob();job.guard();
    const craft=ctx.craftService,data=manufacturingMetadata,revision=manufacturingRevision,materialRevision=inspectMaterialSurfaceRevision();
    if(restoreUnavailable()||ownsDocument(restorePending)||craft.isProcessing||craft.pipelineFailure$.value||craft.engineCleanupFailure$.value)throw Object.assign(Error('Finish the current operation before inspecting references.'),{code:'UNAVAILABLE'});
    const refs=new Map<string,Readonly<{featureId:number,operationType:string}>>(),bindings=new Map<string,any>();let headers=0,regions=0;
    if(data){
      if(data.bindings.length>128||data.objects.length>128)throw Object.assign(Error('Authored reference headers exceed the history-control bound.'),{code:'RESOURCE_LIMIT'});
      for(const binding of data.bindings){if(++headers>512)throw Object.assign(Error('Authored references exceed the history-control bound.'),{code:'RESOURCE_LIMIT'});bindings.set(binding.id,binding);}
      for(const part of data.objects){if(++headers>512)throw Object.assign(Error('Authored references exceed the history-control bound.'),{code:'RESOURCE_LIMIT'});for(const region of part.regions){
        if(++regions>128||++headers>512)throw Object.assign(Error('Authored reference regions exceed the history-control bound.'),{code:'RESOURCE_LIMIT'});
        const binding=bindings.get(region.bodyId);if(!binding)throw Object.assign(Error('An authored manufacturing reference is missing.'),{code:'INVALID_MANUFACTURING_REFERENCE'});
        const key=binding.featureId+':'+binding.operationType;if(!refs.has(key))refs.set(key,Object.freeze({featureId:binding.featureId,operationType:binding.operationType}));
      }}
    }
    const result=Object.freeze({materialRevision,references:Object.freeze([...refs.values()])});
    job.guard();if(ctx.craftService!==craft||manufacturingMetadata!==data||manufacturingRevision!==revision||inspectMaterialSurfaceRevision()!==materialRevision||craft.isProcessing)throw new DOMException('Manufacturing references changed.','AbortError');return result;
  }

  // Check retained assignments without cloning or hashing the whole document.
  // Only bounded, already-validated enclosure metadata is supported here.
  function verifyParentRepairAssignments(previous:any[], prefix:any[], candidate:any[], history:any[], affected:string[]): void {
    const data=manufacturingMetadata;
    if(!Array.isArray(previous)||!Array.isArray(prefix)||!Array.isArray(candidate)||!Array.isArray(history)||previous.length>1024||prefix.length>1024||candidate.length>1024||history.length>256||(data&&(data.bindings.length>256||data.objects.length>256)))throw new Error('Manufacturing assignments exceed the parent repair limit.');
    if(!Array.isArray(affected)||affected.length!==2||affected.some(id=>typeof id!=='string'||!id||id.length>1024))throw new Error('Invalid affected body identities.');
    const affectedSet=new Set(affected),fieldsAll=['mxx','mxy','mxz','tx','myx','myy','myz','ty','mzx','mzy','mzz','tz'];
    for(const source of [previous,prefix])for(const old of source){
      if(typeof old?.id!=='string'||!old.id||old.id.length>1024)throw new Error('An unrelated body identity is unavailable.');
      if(affectedSet.has(old.id))continue;
      const matches=candidate.filter(m=>m?.id===old.id);if(matches.length!==1)throw new Error('An unrelated body changed; review is required.');const next=matches[0];
      if(fieldsAll.some(key=>!Number.isFinite(old.location?.[key])||!Object.is(old.location[key],next.location?.[key])))throw new Error('An unrelated body placement changed; review is required.');
      for(const axis of ['origin','x','y','z'])for(const coordinate of ['x','y','z'])if(!Number.isFinite(old.csys?.[axis]?.[coordinate])||!Object.is(old.csys[axis][coordinate],next.csys?.[axis]?.[coordinate]))throw new Error('An unrelated body frame changed; review is required.');
      if(old.ext?.workerGeometry?.representation!==next.ext?.workerGeometry?.representation||old.ext?.workerGeometry?.engine!==next.ext?.workerGeometry?.engine)throw new Error('An unrelated body provenance changed; review is required.');
    }
    const isEnclosure=(m:any)=>typeof m?.id==='string'&&m.id.startsWith('worker-enclosure:');
    const priorIds=previous.filter(isEnclosure).map(m=>m.id).sort(),nextIds=candidate.filter(isEnclosure).map(m=>m.id).sort();
    if(JSON.stringify(priorIds)!==JSON.stringify(nextIds)||new Set(priorIds).size!==priorIds.length)throw new Error('An unrelated enclosure output changed; review is required.');
    const matrixFields=['mxx','mxy','mxz','tx','myx','myy','myz','ty','mzx','mzy','mzz','tz'];
    for(const source of [previous,prefix])for(const old of source.filter(isEnclosure)){
      const matches=candidate.filter(m=>m.id===old.id);if(matches.length!==1)throw new Error('An unrelated enclosure output changed; review is required.');const next=matches[0];
      const version=old.id.startsWith('worker-enclosure:1:')?1:old.id.startsWith('worker-enclosure:2:')?2:0,roles=version===1?['BODY','LID']:version===2?['BODY','LID','LABEL']:[],matchesHistory=history.map((op:any,index:number)=>Number(op?.params?.featureId)===old.featureId?index:-1).filter((index:number)=>index!==-1);
      if(!Number.isSafeInteger(old.featureId)||old.featureId<1||!roles.includes(old.outputRole)||old.id!=='worker-enclosure:'+version+':'+JSON.stringify([old.featureId,old.outputRole])||matchesHistory.length!==1||history[matchesHistory[0]].type!=='WORKER_ENCLOSURE_V'+version||next.originatingOperation!==matchesHistory[0])throw new Error('Unrelated enclosure provenance is unavailable.');
      for(const model of [old,next])if(model.featureId!==old.featureId||model.outputRole!==old.outputRole||model.ext?.workerGeometry?.representation!=='worker-owned-occ-enclosure'||model.ext.workerGeometry.engine!=='occ'||model.ext.workerGeometry.featureId!==old.featureId||model.ext.workerGeometry.role!==old.outputRole||model.ext.workerGeometry.version!==version||model.ext.workerGeometry.unit!=='millimeter')throw new Error('Unrelated enclosure provenance is unavailable.');
      if(matrixFields.some(key=>!Number.isFinite(old.location?.[key])||!Object.is(old.location[key],next.location?.[key])))throw new Error('An unrelated enclosure placement changed; review is required.');
      for(const axis of ['origin','x','y','z'])for(const coordinate of ['x','y','z'])if(!Number.isFinite(old.csys?.[axis]?.[coordinate])||!Object.is(old.csys[axis][coordinate],next.csys?.[axis]?.[coordinate]))throw new Error('An unrelated enclosure frame changed; review is required.');
    }
    if(!data)return;
    const bindings=new Map(data.bindings.map((binding:any)=>[binding.id,binding]));
    const references=new Set<string>();let count=0;
    for(const object of data.objects){if(!Array.isArray(object.regions))throw new Error('Invalid manufacturing assignments.');for(const region of object.regions){if(++count>256)throw new Error('Manufacturing assignments exceed the parent repair limit.');references.add(region.bodyId);}}
    const fields=['mxx','mxy','mxz','tx','myx','myy','myz','ty','mzx','mzy','mzz','tz'];
    for(const id of references){const b:any=bindings.get(id);if(!b||!['WORKER_ENCLOSURE_V1','WORKER_ENCLOSURE_V2'].includes(b.operationType))throw new Error('The affected manufacturing assignment needs review.');
      const indices=history.map((op:any,index:number)=>Number(op?.params?.featureId)===b.featureId?index:-1).filter((index:number)=>index!==-1);
      if(indices.length!==1||history[indices[0]].type!==b.operationType)throw new Error('A manufacturing assignment has no unique authored feature.');
      const version=b.operationType==='WORKER_ENCLOSURE_V2'?2:1,roles=version===2?['BODY','LID','LABEL']:['BODY','LID'];
      if(!roles.includes(b.outputRole))throw new Error('Invalid enclosure assignment role.');
      for(const role of roles){const modelId='worker-enclosure:'+version+':'+JSON.stringify([b.featureId,role]),old=previous.filter(m=>m.id===modelId),next=candidate.filter(m=>m.id===modelId);
        if(old.length!==1||next.length!==1||next[0].originatingOperation!==indices[0])throw new Error('An assigned enclosure output changed; review is required.');
        for(const model of [old[0],next[0]])if(model.featureId!==b.featureId||model.outputRole!==role||model.ext?.workerGeometry?.representation!=='worker-owned-occ-enclosure'||model.ext.workerGeometry.engine!=='occ'||model.ext.workerGeometry.featureId!==b.featureId||model.ext.workerGeometry.role!==role||model.ext.workerGeometry.version!==version||model.ext.workerGeometry.unit!=='millimeter')throw new Error('Enclosure assignment provenance is unavailable.');
        if(fields.some(key=>!Number.isFinite(old[0].location?.[key])||!Number.isFinite(next[0].location?.[key])||!Object.is(old[0].location[key],next[0].location[key])))throw new Error('An assigned enclosure placement changed; review is required.');
        for(const axis of ['origin','x','y','z'])for(const coordinate of ['x','y','z'])if(!Number.isFinite(old[0].csys?.[axis]?.[coordinate])||!Object.is(old[0].csys[axis][coordinate],next[0].csys?.[axis]?.[coordinate]))throw new Error('An assigned enclosure frame changed; review is required.');
      }
    }
  }
  // Read-only copy for the embedding host's inspection/dirty reporting.
  function getManufacturingMetadata(): any {
    return manufacturingMetadata ? JSON.parse(JSON.stringify(manufacturingMetadata)) : null;
  }
  
  function inspectEnclosureMaterialRoles(): any {
    const job = documentJob(); job.guard();
    if (restoreUnavailable() || ctx.craftService.isProcessing || ctx.craftService.pipelineFailure$.value || ctx.storageService.revision == null) throw new Error('Project is not ready');
    const history = ctx.craftService.modifications$.value.history;
    const featureIds = history.filter(op => ['WORKER_ENCLOSURE_V1','WORKER_ENCLOSURE_V2'].includes(op.type) && /^(?:[1-9][0-9]*)$/.test(String(op.params?.featureId)) && Number.isSafeInteger(Number(op.params.featureId))).map(op => Number(op.params.featureId));
    const models = ctx.cadRegistry.shells;
    const features = featureIds.map(featureId=>({featureId,roles:history.find(op=>Number(op.params?.featureId)===featureId)?.type==='WORKER_ENCLOSURE_V2'?['BODY','LID','LABEL']:['BODY','LID']})).filter(feature=>models.filter((m:any)=>m.featureId===feature.featureId&&feature.roles.includes(m.outputRole)).length===feature.roles.length);
    const candidates=features.map(feature=>feature.featureId);
    return {revision:JSON.stringify([job.generation,ctx.craftService.evaluationEpoch,ctx.storageService.revision,manufacturingRevision]),featureIds:[...new Set(candidates)],features};
  }

  // Shared UI/agent operation. Snapshot creation still uses the existing native
  // serializer and its experimental 8 MiB cap; SHA computation runs in a
  // dedicated cancellable worker, with no whole canonical string on the UI.
  function metadataOwn(value:any,keys:string[]):any {
    if(!value||typeof value!=='object'||Array.isArray(value)||![null,Object.prototype].includes(Object.getPrototypeOf(value)))throw Object.assign(Error('Expected plain manufacturing fields.'),{code:'INVALID_REQUEST'});
    const actual=Reflect.ownKeys(value);if(actual.length!==keys.length||actual.some(k=>typeof k!=='string'||!keys.includes(k)))throw Object.assign(Error('Invalid manufacturing fields.'),{code:'INVALID_REQUEST'});
    const r:any={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))throw Object.assign(Error('Manufacturing fields must be own data.'),{code:'INVALID_REQUEST'});r[key]=d.value;}return r;
  }
  function captureEnclosureRoles(value:any,kind:string):any {
    const names=kind==='WORKER_ENCLOSURE_V2'?['BODY','LID','LABEL']:['BODY','LID'],out=metadataOwn(value,names);
    for(const name of names){const r=metadataOwn(out[name],['material','appearance']);r.material=metadataOwn(r.material,['id','name']);if(r.appearance!==null)r.appearance=metadataOwn(r.appearance,['id','name','color']);for(const item of [r.material,r.appearance].filter(Boolean))for(const key of Object.keys(item))if(typeof item[key]!=='string'||item[key].length>256)throw Object.assign(Error('Invalid material values.'),{code:'INVALID_REQUEST'});out[name]=r;}
    if(new TextEncoder().encode(JSON.stringify(out)).byteLength>4096)throw Object.assign(Error('Enclosure material fields exceed4KiB.'),{code:'RESOURCE_LIMIT'});return out;
  }
  function metadataBodies(models:any[]):any[] {
    if(!Array.isArray(models)||models.length>16384)throw Object.assign(Error('Manufacturing body inventory exceeds its bound.'),{code:'RESOURCE_LIMIT'});
    return models.map(model=>({id:model.id,featureId:model.featureId,originatingOperation:model.originatingOperation,...(model.outputRole===undefined?{}:{outputRole:model.outputRole})}));
  }
  function manufacturingJob(options:any={},captureGeometry=true) {
    assertManufacturingPreparationAvailable();
    const lifetime=captureDocumentJobOptions(options),job=documentJob({signal:lifetime.signal,valid:lifetime.valid?()=>lifetime.valid()===true:undefined}),craft:any=ctx.craftService,manager=ctx.projectManager;
    if(typeof craft.captureManufacturingEditContext!=='function'||typeof craft.commitManufacturingMetadata!=='function')throw Object.assign(Error('Shared manufacturing publication is unavailable.'),{code:'UNAVAILABLE'});
    const context=craft.captureManufacturingEditContext(),captured=captureGeometry?capturedManufacturingJob(job,captureCurrentProject(false)):capturedManufacturingJob(job,undefined,false),before=manufacturingMetadata,revision=inspectDocumentRevision(),counter=job.project.counterGenerator,counters=counter.projectCounters,featureId=counters.featureId;
    const sameCounter=()=>job.project.counterGenerator===counter&&counter.projectCounters===counters&&counters.featureId===featureId;
    const check=()=>{job.guard();context.check();if(ctx.projectManager!==manager||ctx.craftService!==craft||!captured.unchanged()||!sameCounter()||manufacturingMetadata!==before||inspectDocumentRevision()!==revision)throw new DOMException('Manufacturing preparation changed.','AbortError');};
    const unchanged=()=>ctx.projectManager===manager&&ctx.craftService===craft&&sameCounter()&&captured.unchanged()&&manufacturingMetadata===before;
    check();return{job,craft,context,captured,before,revision,check,unchanged};
  }
  async function manufacturingGeometryHash(work:any,signal?:AbortSignal):Promise<string> {
    work.check();assertManufacturingPreparationAvailable();const revision=await withManufacturingHashWorker(work.job,signal,(worker,s)=>hashCanonicalInWorker({kind:'codi-jsketcher-geometry-v1',project:work.captured.envelope.project},worker,s,()=>{try{work.check();return 0;}catch{return 1;}},PREPARE_LIMIT_BYTES));work.check();return revision;
  }
  function stageManufacturingPublication(work:any,preparation:any,direction?:'undo'|'redo'):object {
    work.check();const p=readManufacturingWorkerPreparation(preparation);
    if(p.domain!=='manufacturing'||p.key!=='manufacturing'||p.before!==work.before)throw new Error('Manufacturing preparation owner changed.');
    if(!Number.isSafeInteger(manufacturingRevision)||p.changed&&manufacturingRevision>=Number.MAX_SAFE_INTEGER)throw Object.assign(Error('Manufacturing revisions are exhausted.'),{code:'RESOURCE_LIMIT'});
    const ticket=Object.freeze({}),nextRevision=manufacturingRevision+(p.changed?1:0),materialRevision=p.changed?crypto.randomUUID():inspectMaterialSurfaceRevision(),documentRevision=p.changed?crypto.randomUUID():work.revision,
      materialFingerprint=[ctx.projectService,work.job.generation,nextRevision,ctx.surfacingService,ctx.surfacingService?.state$.value.revision],documentFingerprint=[work.craft.inspectRectangleCreation().revision,materialRevision,presentationRevision,drawingRevision];
    let phase='prepared';
    const receipt=Object.freeze({changed:p.changed,revision:documentRevision,unit:'millimeter',authoredUndo:true,...p.summary});
    const participant=Object.freeze({context:work.context,preparation,before:work.before,changed:p.changed,direction,receipt,materialRevision,documentRevision,
      requireCurrent:work.check,unchanged:()=>phase==='prepared'&&work.unchanged(),
      install(){manufacturingMetadata=p.after;manufacturingRevision=nextRevision;materialSurfaceFingerprint=materialFingerprint;materialSurfaceRevision=materialRevision;inspectedFingerprint=documentFingerprint;inspectedRevision=documentRevision;phase='committed';},
      isInstalled:()=>phase==='committed'&&ctx.projectService===work.job.project&&work.job.project.isDocumentCurrent(work.job.generation)&&work.captured.unchanged(p.after,nextRevision),
      requireCommitted(){try{work.job.guard();if(!p.changed){work.check();return;}if(ctx.projectManager!==work.captured.manager||phase!=='committed'||!work.context.sameGeometry()||!work.captured.unchanged(p.after,nextRevision))throw new Error('Committed manufacturing document changed.');}catch(cause){throw Object.assign(Error('Manufacturing commit lost its caller lifetime.'),{committed:p.changed,cause});}}
    });
    manufacturingPublications.set(ticket,participant);return ticket;
  }
  function readManufacturingPublication(ticket:object):any {
    const p=manufacturingPublications.get(ticket);if(!p)throw Object.assign(Error('Unknown manufacturing publication.'),{code:'INVALID_PREPARATION'});return p;
  }
  async function publishManufacturing(work:any,cap:any,direction?:'undo'|'redo'):Promise<any> {
    const ticket=stageManufacturingPublication(work,cap,direction),p=readManufacturingPublication(ticket);
    const receipt=await work.craft.commitManufacturingMetadata(ticket);p.requireCommitted();return receipt;
  }
  async function assignEnclosureMaterialRoles(featureId:number,roles:any,options:{signal?:AbortSignal,valid?:()=>boolean,revision:string}):Promise<void> {
    const revisionField=options&&Object.getOwnPropertyDescriptor(options,'revision');
    if(!revisionField?.enumerable||!Object.prototype.hasOwnProperty.call(revisionField,'value'))throw Object.assign(Error('Expected an own enclosure revision.'),{code:'INVALID_REQUEST'});
    const inspected=inspectEnclosureMaterialRoles();if(revisionField.value!==inspected.revision||!inspected.featureIds.includes(featureId))throw new Error('Enclosure selection is stale or unavailable');
    const work=manufacturingJob(options),matches=work.captured.history.filter(op=>Number(op?.params?.featureId)===featureId);
    if(revisionField.value!==inspectEnclosureMaterialRoles().revision)throw new DOMException('Enclosure request changed during its lifetime guard.','AbortError');
    if(matches.length!==1||!['WORKER_ENCLOSURE_V1','WORKER_ENCLOSURE_V2'].includes(matches[0].type))throw new Error('Enclosure operation is unavailable.');
    const capturedRoles=captureEnclosureRoles(roles,matches[0].type),geometryRevision=await manufacturingGeometryHash(work,options.signal);
    const cap=await prepareManufacturingInWorker(manufacturingPublicationWorkerUrl,{action:'enclosure',before:work.before,args:{geometryRevision,featureId,history:work.captured.history,bodies:metadataBodies(work.captured.models),roles:capturedRoles}},{signal:work.job.signal,cancellationSignal:work.job.cancellationSignal,valid:()=>{work.check();return true;}});work.check();await publishManufacturing(work,cap);
  }

  // Read-only metadata discovery. It neither certifies a manufacturing mesh
  // nor certifies assignments as a manufacturing mesh. Publication readiness
  // below reports the actual shared metadata transaction hook.
  function inspectGenericManufacturingParts(): GenericManufacturingInspection {
    const job=documentJob();job.guard();const bodies=captureGenericManufacturingBodies(ctx),revision=inspectDocumentRevision(),metadata=manufacturingMetadata;
    const bindings=new Map((metadata?.bindings||[]).map((b:any)=>[b.id,b])),assignments:any[]=[];
    for(const part of metadata?.objects||[])for(const region of part.regions||[]){if(assignments.length>=128)throw Object.assign(Error('Assignment discovery exceeds its limit.'),{code:'RESOURCE_LIMIT'});const b:any=bindings.get(region.bodyId);if(b)assignments.push(Object.freeze({partId:part.id,regionId:region.id,bindingId:b.id,featureId:b.featureId,operationType:b.operationType,materialId:region.materialId,appearanceId:region.appearanceId}));}
    const publication=typeof (ctx.craftService as any).commitManufacturingMetadata==='function';
    const result=Object.freeze({version:1 as const,revision,unit:'millimeter' as const,ready:bodies.ready,reason:bodies.reason,targets:bodies.targets,assignments:Object.freeze(assignments),limits:GENERIC_MANUFACTURING_LIMITS,publication:publication?'shared-metadata-transaction-v1' as const:'unavailable' as const,authoredUndo:publication?'shared-session-journal-v1' as const:'pending-shared-journal' as const,manufacturingMesh:'unqualified' as const});
    if(new TextEncoder().encode(JSON.stringify(result)).byteLength>GENERIC_MANUFACTURING_LIMITS.inspectionBytes)throw Object.assign(Error('Manufacturing discovery exceeds its metadata bound.'),{code:'RESOURCE_LIMIT'});
    job.guard();bodies.requireCurrent();if(manufacturingMetadata!==metadata||inspectDocumentRevision()!==revision)throw new DOMException('Manufacturing discovery changed.','AbortError');return result;
  }

  // Read-only preview remains separate: it cannot publish its returned data.
  // The shared setter below repeats owner/Worker admission before committing.
  async function prepareGenericManufacturingAssignment(input:unknown,options:{signal?:AbortSignal,valid?:()=>boolean}={}):Promise<GenericManufacturingPreparation> {
    const request=captureGenericManufacturingRequest(input),job=documentJob(options);job.guard();const info=inspectGenericManufacturingParts();
    if(request.revision!==info.revision)throw new DOMException('Material assignment inspection is stale.','AbortError');
    if(!info.ready)throw Object.assign(Error(info.reason||'The current part is unavailable.'),{code:'UNAVAILABLE'});
    for(const part of request.parts)for(const region of part.regions)if(!info.targets.some(t=>t.bodyId===region.bodyId&&t.featureId===region.featureId&&t.canAssign))throw Object.assign(Error('Select a supported current output and producer.'),{code:'UNSUPPORTED_TARGET'});
    const captured=capturedManufacturingJob(job,captureCurrentProject()),bodies=captureGenericManufacturingBodies(ctx),counter=job.project.counterGenerator,counters=counter.projectCounters,featureId=counters.featureId;
    const check=()=>{if(!captured.current()||counter!==job.project.counterGenerator||counter.projectCounters!==counters||counters.featureId!==featureId||ctx.expressionService.script$.value!==captured.envelope.project.model.expressions||inspectDocumentRevision()!==request.revision)throw new DOMException('Manufacturing assignment source changed.','AbortError');bodies.requireCurrent();};
    check();const geometryRevision=await withManufacturingHashWorker(job,options.signal,(worker,signal)=>hashCanonicalInWorker({kind:'codi-jsketcher-geometry-v1',project:captured.envelope.project},worker,signal,()=>{try{check();return 0;}catch{return 1;}},PREPARE_LIMIT_BYTES));check();await assertPipelineHistoryCurrent(captured.history,captured.envelope.project.model.history,check);check();
    const proposal=prepareGenericManufacturingMetadata({request,metadata:captured.envelope.manufacturing||null,geometryRevision,targets:bodies.targets});check();
    return Object.freeze({revision:request.revision,geometryRevision,metadata:proposal.metadata,summary:proposal.summary,isCurrent:()=>{try{check();return true;}catch{return false;}}});
  }
  async function assignGenericManufacturingParts(input:unknown,options:{signal?:AbortSignal,valid?:()=>boolean}={}):Promise<any> {
    const request=captureGenericManufacturingRequest(input),info=inspectGenericManufacturingParts();
    if(request.revision!==info.revision)throw new DOMException('Manufacturing request is stale.','AbortError');
    if(!info.ready)throw Object.assign(Error(info.reason||'The part is unavailable.'),{code:'UNAVAILABLE'});
    const work=manufacturingJob(options),bodies=captureGenericManufacturingBodies(ctx),baseCheck=work.check;
    if(request.revision!==work.revision)throw new DOMException('Manufacturing request changed during its lifetime guard.','AbortError');
    work.check=()=>{baseCheck();bodies.requireCurrent();};work.check();
    const geometryRevision=await manufacturingGeometryHash(work,options.signal),cap=await prepareManufacturingInWorker(manufacturingPublicationWorkerUrl,{action:'generic',before:work.before,args:{geometryRevision,request,targets:bodies.targets}},{signal:work.job.signal,cancellationSignal:work.job.cancellationSignal,valid:()=>{work.check();return true;}});
    work.check();return publishManufacturing(work,cap);
  }
  async function travelManufacturingMetadata(input:any,options:{signal?:AbortSignal,valid?:()=>boolean}={}):Promise<any> {
    const args=metadataOwn(input,['revision','direction']);if(!['undo','redo'].includes(args.direction))throw Object.assign(Error('Invalid manufacturing travel.'),{code:'INVALID_REQUEST'});
    const work=manufacturingJob(options,false);if(args.revision!==work.craft.inspectAuthoredEdits().revision)throw new DOMException('Manufacturing history is stale.','AbortError');
    const entry=work.context.journal.entries[args.direction==='undo'?work.context.journal.cursor-1:work.context.journal.cursor];
    if(entry?.kind!=='document-metadata'||entry.domain!=='manufacturing'||entry.key!=='manufacturing')throw Object.assign(Error('No manufacturing history in that direction.'),{code:'INVALID_REQUEST'});
    const cap=await prepareManufacturingInWorker(manufacturingPublicationWorkerUrl,{action:'travel',before:work.before,args:{entry,direction:args.direction}},{signal:work.job.signal,cancellationSignal:work.job.cancellationSignal,valid:()=>{work.check();return true;}});work.check();return publishManufacturing(work,cap,args.direction);
  }

  // The same authenticated preparation and A/J/T commit owns both domains.
  // A stored definition is intent, never proof of resolved/measured references.
  function inspectLinkedPartDrawing():any {
    const job=documentJob();job.guard();const revision=inspectDocumentRevision(),geometryRevision=ctx.craftService.inspectWorkerSolids().revision,definition=drawingDefinition;
    let ready=true,reason='';try{(ctx.craftService as any).captureManufacturingEditContext();}catch{ready=false;reason='Wait for a complete current authored tip.';}
    const result=Object.freeze({version:1,unit:'millimeter',revision,geometryRevision,definition,ready,reason,quality:'authored-definition-only',authoredUndo:'shared-session-journal-v1',definitionVersions:Object.freeze([1,2,3]),viewBases:Object.freeze(['top','front','right','isometric']),limits:Object.freeze({definitionBytes:65536,requestBytes:65536,views:4,dimensions:16,annotations:16})});
    job.guard();if(drawingDefinition!==definition||inspectDocumentRevision()!==revision||ctx.craftService.inspectWorkerSolids().revision!==geometryRevision)throw new DOMException('Drawing inspection changed.','AbortError');return result;
  }
  async function exportLinkedPartDrawingSvg(options:{signal?:AbortSignal,valid?:()=>boolean}={}):Promise<Uint8Array> {
    const lifetime=captureDocumentJobOptions(options),job=documentJob({signal:lifetime.signal,valid:lifetime.valid?()=>lifetime.valid()===true:undefined}),craft:any=ctx.craftService,
      captured=capturedManufacturingJob(job,undefined,false),definition=drawingDefinition,revision=inspectDocumentRevision(),geometryRevision=craft.inspectWorkerSolids().revision;
    if(!definition)throw Object.assign(Error('No linked part drawing definition exists.'),{code:'DRAWING_NOT_FOUND'});
    if(typeof craft.readWorkerLinkedPartDrawing!=='function')throw Object.assign(Error('Native drawing observation is unavailable.'),{code:'UNAVAILABLE'});
    // The owned observation itself makes Craft busy. During that read use the
    // exact captured owner/tokens, not the idle-only snapshot predicate. The
    // shared evaluator additionally guards its complete frozen source replay.
    const requireCurrent=()=>{job.guard();if(ctx.projectManager!==captured.manager||ctx.craftService!==craft||drawingDefinition!==definition||inspectDocumentRevision()!==revision||craft.inspectWorkerSolids().revision!==geometryRevision)throw new DOMException('Drawing export changed.','AbortError');};
    const controller=new AbortController(),stop=()=>controller.abort();let documentListening=false,callerListening=false,operationError:any;
    try{
      if(!captured.unchanged())throw new DOMException('Drawing export changed.','AbortError');
      documentListening=true;addDocumentAbortListener(job.signal,'abort',stop,{once:true});
      if(job.cancellationSignal!==undefined){callerListening=true;addDocumentAbortListener(job.cancellationSignal,'abort',stop,{once:true});}
      if(documentSignalAborted(job.signal)||job.cancellationSignal!==undefined&&documentSignalAborted(job.cancellationSignal))controller.abort();
      requireCurrent();const bytes=await workerLinkedDrawingSvg({craft,definition,revision,geometryRevision,signal:controller.signal,requireCurrent});requireCurrent();
      if(!captured.unchanged())throw new DOMException('Drawing export changed.','AbortError');return bytes;
    }catch(error){operationError=error;throw error;
    }finally{
      let cleanup:any=null;const clean=action=>{try{action();}catch(cause){if(!cleanup)cleanup={cause};}};
      if(documentListening)clean(()=>removeDocumentAbortListener(job.signal,'abort',stop));
      if(callerListening)clean(()=>removeDocumentAbortListener(job.cancellationSignal,'abort',stop));
      if(cleanup)throw Object.assign(Error('Drawing export listener cleanup failed.'),{code:'WORKER_CLEANUP_FAILED',cause:cleanup.cause,operationError,fileCommitted:false});
    }
  }
  function drawingJob(options:any={}) {
    const base=manufacturingJob(options,false),before=drawingDefinition,definitionRevision=drawingRevision,metadata=manufacturingMetadata,metadataRevision=manufacturingRevision,materialRevision=inspectMaterialSurfaceRevision(),geometryRevision=base.craft.inspectWorkerSolids().revision;
    const check=()=>{base.check();if(drawingDefinition!==before||drawingRevision!==definitionRevision||inspectMaterialSurfaceRevision()!==materialRevision||base.craft.inspectWorkerSolids().revision!==geometryRevision)throw new DOMException('Drawing preparation changed.','AbortError');};
    check();return{...base,before,definitionRevision,metadata,metadataRevision,materialRevision,geometryRevision,check,unchanged:()=>base.unchanged()&&drawingDefinition===before&&drawingRevision===definitionRevision};
  }
  function stageDrawingPublication(work:any,preparation:any,direction?:'undo'|'redo'):object {
    work.check();const p=readManufacturingWorkerPreparation(preparation);
    if(p.domain!=='linked-part-drawing'||p.key!==(p.after||work.before)?.drawingId||p.before!==work.before)throw Object.assign(Error('Drawing preparation owner changed.'),{code:'INVALID_PREPARATION'});
    if(!Number.isSafeInteger(drawingRevision)||p.changed&&drawingRevision>=Number.MAX_SAFE_INTEGER)throw Object.assign(Error('Drawing revisions are exhausted.'),{code:'RESOURCE_LIMIT'});
    const ticket=Object.freeze({}),nextRevision=drawingRevision+(p.changed?1:0),documentRevision=p.changed?crypto.randomUUID():work.revision,materialRevision=work.materialRevision,
      documentFingerprint=[work.craft.inspectRectangleCreation().revision,materialRevision,presentationRevision,nextRevision];
    let phase='prepared';
    const receipt=Object.freeze({changed:p.changed,revision:documentRevision,geometryRevision:work.geometryRevision,unit:'millimeter',authoredUndo:true,...p.summary});
    const installed=()=>phase==='committed'&&ctx.projectService===work.job.project&&work.job.project.isDocumentCurrent(work.job.generation)&&work.captured.unchanged(work.metadata,work.metadataRevision,p.after,nextRevision)&&inspectMaterialSurfaceRevision()===materialRevision;
    const participant=Object.freeze({context:work.context,preparation,before:work.before,changed:p.changed,direction,receipt,materialRevision,documentRevision,
      requireCurrent:work.check,unchanged:()=>phase==='prepared'&&work.unchanged(),
      install(){drawingDefinition=p.after;drawingRevision=nextRevision;inspectedFingerprint=documentFingerprint;inspectedRevision=documentRevision;phase='committed';},
      isInstalled:installed,
      requireCommitted(){try{work.job.guard();if(!p.changed){work.check();return;}if(ctx.projectManager!==work.captured.manager||!work.context.sameGeometry()||!installed())throw new Error('Committed drawing document changed.');}catch(cause){throw Object.assign(Error('Drawing commit lost its caller lifetime.'),{committed:p.changed,cause});}}
    });
    manufacturingPublications.set(ticket,participant);return ticket;
  }
  async function publishDrawing(work:any,cap:any,direction?:'undo'|'redo'):Promise<any> {
    const ticket=stageDrawingPublication(work,cap,direction),p=readManufacturingPublication(ticket);
    const receipt=await work.craft.commitManufacturingMetadata(ticket);p.requireCommitted();return receipt;
  }
  async function applyLinkedPartDrawingOperation(input:unknown,options:{signal?:AbortSignal,valid?:()=>boolean}={}):Promise<any> {
    const request=captureLinkedPartDrawingRequest(input),work=drawingJob(options);
    if(request.revision!==work.revision||request.geometryRevision!==work.geometryRevision)throw Object.assign(Error('Drawing request is stale.'),{code:'STALE_DOCUMENT'});
    const cap=await prepareManufacturingInWorker(manufacturingPublicationWorkerUrl,{action:'drawing',before:work.before,args:{request,revision:work.revision,geometryRevision:work.geometryRevision}},{signal:work.job.signal,cancellationSignal:work.job.cancellationSignal,valid:()=>{work.check();return true;}});
    work.check();return publishDrawing(work,cap);
  }
  async function travelLinkedPartDrawingMetadata(input:any,options:{signal?:AbortSignal,valid?:()=>boolean}={}):Promise<any> {
    const args=metadataOwn(input,['revision','direction']);if(!['undo','redo'].includes(args.direction))throw Object.assign(Error('Invalid drawing travel.'),{code:'INVALID_REQUEST'});
    const work=drawingJob(options);if(args.revision!==work.craft.inspectAuthoredEdits().revision)throw new DOMException('Drawing history is stale.','AbortError');
    const entry=work.context.journal.entries[args.direction==='undo'?work.context.journal.cursor-1:work.context.journal.cursor];
    if(entry?.kind!=='document-metadata'||entry.domain!=='linked-part-drawing')throw Object.assign(Error('No drawing history in that direction.'),{code:'INVALID_REQUEST'});
    const cap=await prepareManufacturingInWorker(manufacturingPublicationWorkerUrl,{action:'drawing-travel',before:work.before,args:{entry,direction:args.direction}},{signal:work.job.signal,cancellationSignal:work.job.cancellationSignal,valid:()=>{work.check();return true;}});
    work.check();return publishDrawing(work,cap,args.direction);
  }

  function importProjectImpl(getId, onDone) {
    const uploader = document.createElement('input');
    uploader.setAttribute('type', 'file');
    uploader.style.display = 'none';
    
    document.body.appendChild(uploader);
    uploader.click();
    function read() {
      const reader = new FileReader();
      reader.onload = () => {
        try {

          const bundle = JSON.parse(reader.result as string);
          const projectId = getId(uploader.value, bundle);
          
          if (projectId) {
            importBundle(projectId, bundle);
            onDone(projectId);
          }
        } finally {
          document.body.removeChild(uploader);
        }
      };
      reader.readAsText(uploader.files[0]);
    }
    uploader.addEventListener('change', read, false);
  }

  function importBundle(projectId: string, bundle: ModelBundle) {
    const sketchesNamespace = PROJECTS_PREFIX + projectId + SKETCH_SUFFIX;
    ctx.services.storage.set(PROJECTS_PREFIX + projectId, JSON.stringify(bundle.model));
    bundle.sketches.forEach(sketch => ctx.services.storage.set(sketchesNamespace + sketch.id, JSON.stringify(sketch.data)));
  }

  function importProjectAs() {
    function promptId(fileName, bundle) {
      let promptedId = fileName;
      const iof = promptedId.search(/([^/\\]+)$/);
      if (iof !== -1) {
        promptedId = promptedId.substring(iof).replace(/\.json$/, '');
      }

      const projectId = prompt("New Project Name", promptedId);
      if (!projectId && !checkExistence(projectId)) {
        return null
      }
      return projectId;
    }
    importProjectImpl(promptId, openProject);
  }
  
  function importProject() {
    if (confirm('Current project will be wiped off and replaced with the being imported one. Continue?')) {
      ctx.projectService.empty();
      importProjectImpl(() => ctx.projectService.id, ctx.projectService.load);
    }
  }

  function loadExternalProject(projectId: string): ProjectModel {
    const dataStr = ctx.services.storage.get(PROJECTS_PREFIX + projectId);
    return JSON.parse(dataStr) as ProjectModel;
  }

  // A host can persist this snapshot through its own file service. Refuse
  // states the upstream project format cannot faithfully represent: an open
  // sketch, an unfinished operation, or a history pointer away from the tip.
  // Read capture never writes the workspace cache or changes autosave timers.
  // Explicit project.save()/autosave owns cache publication.
  function snapshotCurrentProject(): ProjectEnvelope { return captureCurrentProject(); }

  function captureCurrentProject(includeManufacturing=true): ProjectEnvelope {
    requireManagerAuthority();
    if (restoreUnavailable()) {
      throw new Error('The project restore is incomplete. Close this workspace and try again.');
    }
    if (ctx.services.sketcher.inPlaceEditor.inEditMode) {
      throw new Error('Finish the open sketch before saving the project.');
    }
    if (ctx.wizardService.workingRequest$.value || ctx.craftService.isEditingHistory || ctx.craftService.isProcessing || ctx.craftService.pipelineFailure$.value) {
      throw new Error('Finish the current operation and return to the latest history before saving.');
    }
    const workbench = ctx.workbenchService.currentWorkbench$.value;
    if (ctx.assemblyService.getConstraints().length ||
        (workbench && !workbench.internal && workbench.workbenchId !== ctx.workbenchService.defaultWorkbenchId)) {
      throw new Error('This project uses assembly constraints or a custom workbench that this snapshot does not support yet.');
    }
    if (new URLSearchParams(window.location.search).get('webos') === '1' && (ctx.expressionService.isTyped ? !ctx.expressionService.hasCurrentPhysicalResult() : parseMathDefinitions(ctx.expressionService.script$.value).errors.length)) {
      throw new Error('Fix unsupported or invalid project expressions before saving.');
    }
    const projectId = ctx.projectService.id;
    const data = JSON.stringify(ctx.projectService.captureModel());
    if (!data) throw new Error('Project data is unavailable.');
    const namespace = PROJECTS_PREFIX + projectId + SKETCH_SUFFIX;
    const sketches = ctx.services.storage.getAllKeysFromNamespace(namespace).sort().map(key => ({
      id: key.substring(namespace.length),
      data: JSON.parse(ctx.services.storage.get(key))
    }));
    sketches.forEach(sketch => validateProjectSketch(sketch.data));
    if (new URLSearchParams(window.location.search).get('webos') === '1' && sketches.some(sketch => sketch.data.constants !== undefined && parseMathDefinitions(sketch.data.constants).errors.length)) {
      throw new Error('Fix unsupported or invalid sketch constants before saving.');
    }
    const surfacing = ctx.surfacingService && ctx.surfacingService.save();
    const project = {model: JSON.parse(data), sketches, ...(surfacing ? {surfacing} : {})};
    requireManagerAuthority();
    return encodeProjectEnvelope(project,includeManufacturing?manufacturingMetadata:null,presentationMetadata,drawingDefinition) as ProjectEnvelope;
  }

  // Capture one detached native snapshot. All mutable workspace streams and
  // lifetime guards are checked after each asynchronous phase; stale work
  // cannot publish a save result or a rebind token.
  function capturedManufacturingJob(job: DocumentJob, initial?: ProjectEnvelope,captureGeometry=true) {
    requireManagerAuthority();
    const manager=managerAuthority;
    const envelope:any = captureGeometry?structuredClone(initial || snapshotCurrentProject()):null;
    job.guard();
    requireManagerAuthority();
    const craft=ctx.craftService, storage=ctx.storageService, registry=ctx.cadRegistry, expressions=ctx.expressionService;
    const epoch=craft.evaluationEpoch, namespace=job.project.sketchStorageNamespace, namespaceRevision=storage.namespaceRevision(namespace), history=craft.modifications$.value.history;
    if(!Number.isSafeInteger(namespaceRevision)||namespaceRevision<0)throw new Error('A versioned sketch namespace is required.');
    const models=registry.shells, metadata=manufacturingMetadata, materialRevision=manufacturingRevision,display=presentationMetadata,displayRevision=presentationRevision,drawing=drawingDefinition,definitionRevision=drawingRevision;
    const expressionRevision=[expressions.script$.revision,expressions.list$.revision,(expressions.errors$ as any).value];
    const surfacing=ctx.surfacingService, surfaceRevision=surfacing?.state$.value.revision, workbench=ctx.workbenchService.currentWorkbench$.value;
    const unchanged=(expectedMetadata=metadata,expectedRevision=materialRevision,expectedDrawing=drawing,expectedDrawingRevision=definitionRevision)=>{try { return managerIsCurrent()&&ctx.projectManager===manager&&!restoreUnavailable() && ctx.craftService===craft && ctx.storageService===storage &&
      ctx.cadRegistry===registry && ctx.expressionService===expressions && ctx.surfacingService===surfacing && surfacing?.state$.value.revision===surfaceRevision &&
      ctx.workbenchService.currentWorkbench$.value===workbench && ctx.assemblyService.getConstraints().length===0 && craft.evaluationEpoch===epoch && job.project.sketchStorageNamespace===namespace && storage.namespaceRevision(namespace)===namespaceRevision &&
      craft.modifications$.value.history===history && registry.shells===models && manufacturingMetadata===expectedMetadata && manufacturingRevision===expectedRevision && presentationMetadata===display && presentationRevision===displayRevision && drawingDefinition===expectedDrawing && drawingRevision===expectedDrawingRevision &&
      expressions.script$.revision===expressionRevision[0] && expressions.list$.revision===expressionRevision[1] &&
      (expressions.errors$ as any).value===expressionRevision[2] && !craft.isProcessing && !craft.isEditingHistory &&
      !craft.pipelineFailure$.value && !ctx.services.sketcher.inPlaceEditor.inEditMode && !ctx.wizardService.workingRequest$.value;
    } catch {return false;}};
    const current=()=>{try{job.guard();return unchanged();}catch{return false;}};
    if(!current())throw new DOMException('Project changed','AbortError');
    return {envelope,current,unchanged,history,models,manager};
  }

  async function withManufacturingHashWorker<T>(job: DocumentJob, signal: AbortSignal | undefined, task: (worker: Worker, signal: AbortSignal) => Promise<T>): Promise<T> {
    requireProjectWorkerCleanup();
    const controller=new AbortController(), stop=()=>controller.abort();
    addDocumentAbortListener(job.signal,'abort',stop,{once:true}); if(signal!==undefined)addDocumentAbortListener(signal,'abort',stop,{once:true});
    const timer=setTimeout(stop,30000); let worker:Worker=null,operationError:any=null;
    try {
      if(documentSignalAborted(job.signal) || signal!==undefined&&documentSignalAborted(signal))controller.abort();
      requireProjectWorkerCleanup();worker=new Worker(manufacturingHashWorkerUrl);
      return await task(worker,controller.signal);
    } catch(error) {operationError=error;throw error;
    } finally {
      clearTimeout(timer);let failure:any=null;
      try {closeCanonicalHashWorker(worker,operationError);}catch(error){failure=error;if(!failedProjectWorkerCleanup)failedProjectWorkerCleanup=error;}
      const clean=action=>{try{action();}catch(cause){if(!failure)failure=projectWorkerCleanupError(cause,operationError);}};
      clean(()=>removeDocumentAbortListener(job.signal,'abort',stop));clean(()=>signal!==undefined&&removeDocumentAbortListener(signal,'abort',stop));
      if(failure)throw failure;
    }
  }

  // The original 8 MiB experimental limit remains. The worker receives
  // bounded canonical fragments, never a full canonical document string.
  async function prepareHostSave(options: {signal?:AbortSignal,valid?:()=>boolean} = {}): Promise<{envelope:ProjectEnvelope,isCurrent:()=>boolean}> {
    const job=documentJob(options), captured=capturedManufacturingJob(job,captureCurrentProject());
    const envelope = !captured.envelope.manufacturing ? captured.envelope : await withManufacturingHashWorker(job,options.signal,async(worker,signal)=>{
      const prepared=await prepareManufacturingForSave({project:captured.envelope.project,manufacturing:captured.envelope.manufacturing},
        {worker,signal,getGeneration:()=>captured.current()?0:1});
      if(!captured.current())throw new DOMException('Project changed','AbortError');
      // Manufacturing preparation rebuilds the canonical envelope. Preserve
      // presentation AND drawing without adding either to geometry/material
      // digests. The same captured-currentness guard fences metadata changes.
      return encodeProjectEnvelope(prepared.envelope.project,prepared.envelope.manufacturing,
        captured.envelope.presentation||null,captured.envelope.drawings?.[0]||null) as ProjectEnvelope;
    });
    if(!captured.current())throw new DOMException('Project changed','AbortError');
    // This is operation-scoped: host may use it while its caller validity and
    // signal remain current, but must not use it as a persistent dirty baseline.
    return Object.freeze({envelope,isCurrent:captured.current});
  }

  // Native archive bytes are prepared by one document-bound codec Worker.
  // This intentionally does not call snapshotCurrentProject/JSON.stringify or
  // structuredClone on the complete source. ARC23's host dirty comparator and
  // cooperative source projection/hydration remain separately disclosed costs.
  async function prepareHostNativeArchive(options:{signal?:AbortSignal,valid?:()=>boolean}={}){
    options=captureDocumentJobOptions(options,true);
    if(ownsDocument(restorePending))throw Object.assign(new Error('A native archive restore is in progress.'),{code:'CAD_ARCHIVE_BUSY'});
    const job=documentJob(options),captured=capturedManufacturingJob(job,undefined,false),project=job.project;
    const counter=project.counterGenerator,counters=counter.projectCounters,highWater=counters.featureId;
    const current=()=>captured.current()&&project.counterGenerator===counter&&counter.projectCounters===counters&&counters.featureId===highWater;
    if(!current())throw new DOMException('Project changed.','AbortError');
    const model=project.captureModel(),namespace=project.sketchStorageNamespace,storage=job.storage;
    // ProjectCounters is a real class on fresh documents; capture its exact
    // supported schema rather than admitting arbitrary class prototypes.
    if(Reflect.ownKeys(counters).length!==1||!Object.hasOwn(counters,'featureId'))throw new Error('Unsupported project counter fields.');
    model.counters={featureId:highWater};
    if(model.assembly===undefined)delete model.assembly;
    const sketchIds=storage.getAllKeysFromNamespace(namespace).sort().map(key=>key.substring(namespace.length));
    const surfacing=ctx.surfacingService?await ctx.surfacingService.saveCooperatively(()=>{if(!current())throw new DOMException('Project changed.','AbortError');}):null;
    if(!current())throw new DOMException('Project changed.','AbortError');
    const owner=nativeArchiveOwner(job);
    const prepared=await owner.encode({model,...(surfacing?{surfacing}:{}),manufacturing:manufacturingMetadata,presentation:presentationMetadata,drawing:drawingDefinition,sketchIds,readSketch:id=>{if(!current())throw new DOMException('Project changed.','AbortError');return storage.get(namespace+id);}},
      {signal:options.signal,valid:current});
    if(!current()){await prepared.release();throw new DOMException('Project changed.','AbortError');}
    return Object.freeze({blob:prepared.blob,receipt:prepared.receipt,isCurrent:current,
      // The host obtains this Blob from the normal verified snapshot API only
      // AFTER a committed write. Worker compares the actual complete bytes to
      // its issued output before replacing its one prior span table.
      rebase:(blob:Blob,rebaseOptions:{signal?:AbortSignal,valid?:()=>boolean}={})=>prepared.rebase(blob,rebaseOptions),
      release:()=>prepared.release()});
  }

  async function snapshotForHostSave(options: {signal?:AbortSignal,valid?:()=>boolean} = {}): Promise<ProjectEnvelope> {
    return (await prepareHostSave(options)).envelope;
  }

  // A rebind proposal is tied to the same generation and live authored bodies;
  // confirmation checks that generation again without reserializing a model.
  async function proposeHostManufacturingRebind(options: {signal?:AbortSignal,valid?:()=>boolean} = {}): Promise<any> {
    const work=manufacturingJob(options);if(!work.before)throw new Error('No manufacturing assignments to review.');
    const geometryRevision=await manufacturingGeometryHash(work,options.signal),cap=await prepareManufacturingInWorker(manufacturingPublicationWorkerUrl,{action:'rebind',before:work.before,args:{geometryRevision,history:work.captured.history,bodies:metadataBodies(work.captured.models)}},{signal:work.job.signal,cancellationSignal:work.job.cancellationSignal,valid:()=>{work.check();return true;}});
    work.check();const ticket=stageManufacturingPublication(work,cap),prepared=readManufacturingWorkerPreparation(cap),token=crypto.randomUUID();
    pendingManufacturingRebind={token,ticket,work};return {token,objectCount:prepared.summary.partCount,regionCount:prepared.summary.regionCount,details:[...prepared.summary.details],warning:prepared.summary.warning};
  }

  function confirmHostManufacturingRebind(token:string):void {
    const pending=pendingManufacturingRebind; pendingManufacturingRebind=null;
    if(!pending||token!==pending.token)throw new Error('The model changed; review assignments again.');
    pending.work.check();pending.work.craft.commitManufacturingMetadata(pending.ticket);readManufacturingPublication(pending.ticket).requireCommitted();
  }

  function cancelHostManufacturingRebind(): void { pendingManufacturingRebind = null; }

  // Local research only. The caller is responsible for file authorization and
  // rechecking the window/account/snapshot before writing the returned bytes.
  async function exportCore3mfResearch(options: {signal?:AbortSignal,valid?:()=>boolean} = {}): Promise<Uint8Array> {
    const job = documentJob(options);
    if (new URLSearchParams(window.location.search).get('webos') !== '1') throw new Error('Desktop export is required.');
    if(manufacturingMetadata?.bindings.some(binding=>AUTHORED_SOLID_KINDS.includes(binding.operationType))){
      const craft=ctx.craftService,manager=managerAuthority,revision=inspectDocumentRevision();
      const requireCurrent=()=>{job.guard();if(ctx.craftService!==craft||ctx.projectManager!==manager||inspectDocumentRevision()!==revision)throw new DOMException('The manufacturing document changed.','AbortError');};
      return workerGeneric3mf({craft,revision,signal:job.signal,cancellationSignal:job.cancellationSignal,requireCurrent});
    }
    const capture=await prepareHostSave(options),envelope=capture.envelope;
    job.guard();
    if (!capture.isCurrent()) throw new Error('The model changed while preparing export.');
    if (!envelope.manufacturing) throw new Error('Assign materials before exporting 3MF.');
    if (envelope.project.surfacing) throw new Error('Surfacing geometry is not supported by this export.');
    const history=envelope.project.model.history, bodies=ctx.cadRegistry.shells;
    if(ctx.cadRegistry.models.some(model=>model.TYPE!=='shell' && model.TYPE!=='datum')) throw new Error('This project contains geometry that 3MF export does not support.');
    const assigned=resolveManufacturingAssignments(envelope.manufacturing,history,bodies,envelope.manufacturing.revision);
    const used=new Set(assigned.flatMap(object=>object.regions.map(region=>region.body)));
    if (bodies.some(body=>!used.has(body))) throw new Error('Some model bodies are not assigned to a printable object.');
    const worker=bodies.some(body=>!!body.ext?.workerGeometry);
    if(!worker)bodies.forEach(model=>assertLegacyGeometry(model,'3MF export'));
    const bytes=worker ? await workerEnclosure3mf({envelope,bodies,isCurrent:capture.isCurrent,signal:options.signal}) : await manufacturingTo3mf({metadata:envelope.manufacturing, project:envelope.project, history, bodies, revision:envelope.manufacturing.revision},{signal:options.signal});
    job.guard();
    if (!capture.isCurrent()) throw new Error('The model changed during export.');
    return bytes;
  }

  // Only intended for a new, hidden host-owned volatile workspace. Validation
  // happens before staging anything; the host must keep that window isolated
  // until this promise succeeds, and discard it on failure or cancellation.
  function requireEmptyWorkspace(): void {
    if (new URLSearchParams(window.location.search).get('webos') !== '1') throw new Error('A temporary workspace is required.');
    const namespace = ctx.projectService.sketchStorageNamespace;
    if (manufacturingMetadata || drawingDefinition || ownsDocument(restoringSnapshot) || ctx.craftService.modifications$.value.history.length || ctx.craftService.isProcessing || ctx.craftService.pipelineFailure$.value || ctx.expressionService.script$.value || ctx.assemblyService.getConstraints().length ||
        ctx.services.storage.getAllKeysFromNamespace(namespace).length ||
        ctx.services.sketcher.inPlaceEditor.inEditMode || ctx.wizardService.workingRequest$.value ||
        (ctx.surfacingService && ctx.surfacingService.scene.surfaces.length)) {
      throw new Error('Open the project in a new, empty workspace.');
    }
  }

  async function validateSnapshotWorker(blob: Blob, job: DocumentJob, options: {signal?: AbortSignal} = {}): Promise<any> {
    requireProjectWorkerCleanup();
    const guard=job.guard;
    return await new Promise((resolve, reject) => {
        const worker = new Worker(projectValidationWorkerUrl);
        let settled = false;
        const finish = (error, value?) => {
          if (settled) return;
          settled = true;
          clearInterval(timer);
          clearTimeout(deadline);
          let failure:any=null;
          const clean=action=>{try{action();}catch(cause){if(!failure)failure=projectWorkerCleanupError(cause,error);}};
          clean(()=>options.signal?.removeEventListener('abort',cancelled));
          clean(()=>job.signal.removeEventListener('abort',cancelled));
          clean(()=>window.removeEventListener('pagehide',cancelled));
          clean(()=>{worker.onmessage=null;worker.onerror=null;worker.onmessageerror=null;});
          clean(()=>worker.terminate());
          if(failure)reject(failure);else if(error)reject(error);else resolve(value);
        };
        const cancelled = () => finish(new DOMException('Project restore cancelled', 'AbortError'));
        const timer = setInterval(() => { try { guard(); } catch (error) { finish(error); } }, 100);
        const deadline = setTimeout(() => finish(new Error('Project validation timed out.')), 120000);
        options.signal?.addEventListener('abort', cancelled, {once: true});
        job.signal.addEventListener('abort', cancelled, {once: true});
        window.addEventListener('pagehide', cancelled, {once: true});
        worker.onerror = () => finish(new Error('Project validation worker failed.'));
        worker.onmessageerror = () => finish(new Error('Project validation worker returned invalid data.'));
        worker.onmessage = event => {
          try { guard(); } catch (error) { finish(error); return; }
          if (event.data?.progress === 'started') return;
          if (event.data?.ok === true) finish(null, {value: event.data.value, storage: event.data.storage, parameterState:event.data.parameterState});
          else {
            const error=new Error(event.data?.error || 'Project validation failed.'),code=projectValidationFailureCode(event.data?.code);
            if(code)Object.assign(error,{code});
            finish(error);
          }
        };
        try { guard(); worker.postMessage({blob}); } catch (error) { finish(error); }
      });
  }

  async function restoreSnapshotInEmptyWorkspace(json: string): Promise<void> {
    const manager=ctx.projectManager;requireRestoreManager(manager);
    if (ownsDocument(restorePending)) throw new Error('A project restore is already in progress.');
    if (restoreUnavailable()) throw new Error('This workspace cannot accept a project.');
    // A rejected open must not invalidate the current document or its replay.
    const previous = documentJob();
    requireEmptyWorkspace();
    previous.guard();
    const job = documentJob({}, true);
    restorePending = job;
    try {
      if (typeof json !== 'string' || new Blob([json]).size > 128 * 1024 * 1024) throw new Error('Project is not valid JSON or exceeds 128 MiB.');
      // Both native entry points use the same off-main parse/validation path;
      // consume its full envelope rather than a model/sketch-only projection.
      const validated=await validateSnapshotWorker(new Blob([json],{type:'application/json'}),job);
      job.guard();requireRestoreManager(manager);
      await restoreParsedSnapshotInEmptyWorkspace(validated.value,validated.storage,job,validated.parameterState);
    } catch(error) {
      throw failOwnedRestore({job,currentProject:currentManagerProject,rollback:()=>{},error});
    } finally { if (restorePending === job) restorePending = null; }
  }

  async function restoreSnapshotBytesInEmptyWorkspace(blob: Blob, options: {signal?: AbortSignal, valid?: () => boolean} = {}): Promise<void> {
    const manager=ctx.projectManager;requireRestoreManager(manager);
    options=captureDocumentJobOptions(options,true);
    if (ownsDocument(restorePending)) throw new Error('A project restore is already in progress.');
    if (restoreUnavailable()) throw new Error('This workspace cannot accept a project.');
    // WebIDL brand check accepts a genuine Blob from the host window's realm
    // while rejecting objects that merely spoof a `size` property.
    let blobSize;
    try { blobSize = Object.getOwnPropertyDescriptor(Blob.prototype, 'size').get.call(blob); }
    catch (_) { throw new Error('Project is not a file.'); }
    if (!Number.isSafeInteger(blobSize) || blobSize > 128 * 1024 * 1024) throw new Error('Project exceeds 128 MiB or is not a file.');
    if (options.valid !== undefined && typeof options.valid !== 'function') throw new Error('Invalid project session guard.');
    if (options.signal !== undefined) {
      try { Object.getOwnPropertyDescriptor(AbortSignal.prototype, 'aborted').get.call(options.signal); }
      catch (_) { throw new Error('Invalid project cancellation signal.'); }
    }
    // Check caller cancellation before beginning a replacement lifetime.
    const previous = documentJob(options);
    requireEmptyWorkspace();
    previous.guard();
    const job = documentJob(options, true), guard = ()=>{job.guard();requireRestoreManager(manager);};
    restorePending = job;
    try {
      const parsed: any = await validateSnapshotWorker(blob,job,options);
      guard();
      await restoreParsedSnapshotInEmptyWorkspace(parsed.value, parsed.storage, job, parsed.parameterState);
      guard();
    } catch(error) {
      throw failOwnedRestore({job,currentProject:currentManagerProject,rollback:()=>{},error});
    } finally { if (restorePending === job) restorePending = null; }
  }

  async function restoreNativeArchiveBytesInEmptyWorkspace(blob:Blob,options:{signal?:AbortSignal,valid?:()=>boolean}={}):Promise<any>{
    const manager=ctx.projectManager;requireRestoreManager(manager);
    options=captureDocumentJobOptions(options,true);
    if(ownsDocument(restorePending)||restoreUnavailable())throw new Error('This workspace cannot accept a project.');
    const previous=documentJob(options);requireEmptyWorkspace();previous.guard();
    const job=documentJob(options,true),guard=()=>{job.guard();requireRestoreManager(manager);};
    restorePending=job;
    let localOwner:ReturnType<typeof createNativeArchiveOwner>|null=null;
    try{
      guard();closeNativeArchive();guard();
      // Decode belongs to this pending restore, not the managed document yet.
      // loadData resets metadata within this SAME new generation. Keeping the
      // verified codec local lets that unconditional reset retire only the old
      // managed owner, without destroying this decode's private span table.
      localOwner=createNativeArchiveOwner(nativeArchiveWorkerUrl,job.signal);
      const parsed=await localOwner.decode(blob,{signal:options.signal,valid:()=>{guard();return true;}});
      guard();
      // Only this private Worker result bypasses the old duplicate on-main
      // manufacturing hash preparation; the same canonical domains/caps were
      // verified in the codec BEFORE staging. Native replay is never bypassed.
      await restoreParsedSnapshotInEmptyWorkspace(parsed.value,parsed.storage,job,parsed.parameterState,true);
      guard();
      if(!localOwner.available)throw Object.assign(new Error('The verified native archive owner became unavailable.'),{code:'CAD_ARCHIVE_CLOSED'});
      if(archiveOwner!==null)throw Object.assign(new Error('The managed native archive owner changed during restore.'),{code:'CAD_ARCHIVE_BUSY'});
      // No callback/await between the final checks and this ownership handoff.
      // The same Worker keeps its verified input; no rebind, decode or copy.
      archiveOwner=localOwner;localOwner=null;
      return parsed.receipt;
    }catch(error){
      let failure=error;
      // A stale restore may never close a replacement job's managed owner.
      // Termination uncertainty stays latched and exact-job native revocation
      // below still runs, even when releasing this local codec fails.
      try{localOwner?.close();}catch(cause){failure=Object.assign(new Error('Native archive cleanup failed.'),{code:'WORKER_CLEANUP_FAILED',cause,operationError:error});archiveCleanupFailure ||= failure;}
      // Codec cleanup failure cannot skip exact-owner native replay revocation.
      throw failOwnedRestore({job,currentProject:currentManagerProject,rollback:()=>{},error:failure});
    }finally{if(restorePending===job)restorePending=null;}
  }

  async function restoreParsedSnapshotInEmptyWorkspace(parsed: any, workerStorage: any, job: DocumentJob, parameterState?: any,archiveManufacturingVerified=false): Promise<void> {
    const manager=ctx.projectManager,guard=()=>{job.guard();requireRestoreManager(manager);};
    guard();
    if (new URLSearchParams(window.location.search).get('webos') !== '1') throw new Error('A temporary workspace is required.');
    if (restoreUnavailable()) throw new Error('This workspace cannot accept a project.');
    // Validate the entire envelope before any workspace mutation.
    if (!workerStorage) validateProjectTree(parsed);
    // The archive result is privately issued by the actual codec/preflight
    // Worker. Avoid repeating its potentially 8MiB metadata clone/validation
    // on the UI; other entry points retain the existing envelope admission.
    const decoded = archiveManufacturingVerified ? {project:parsed.project,manufacturing:parsed.manufacturing||null,
      ...(parsed.presentation?{presentation:captureDisplayUnitsMetadata(parsed.presentation)}:{}),
      ...(parsed.drawings?{drawing:captureLinkedPartDrawingDefinition(parsed.drawings[0])}:{})} : decodeProjectEnvelope(parsed);
    const bundle: ModelBundle = decoded.project;
    if (decoded.manufacturing&&!archiveManufacturingVerified) {
      // Experimental: the bounded helper recomputes the geometry revision
      // before staging any files in the hidden workspace.
      await prepareManufacturingSnapshot(() => { guard(); return {project: bundle, manufacturing: decoded.manufacturing}; }, () => ownsDocument(job) && !restoreUnavailable());
      guard();
    }
    const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
    if (!object(bundle) || !object(bundle.model) || !Array.isArray(bundle.model.history) ||
        bundle.model.history.length > 10000 || typeof bundle.model.expressions !== 'string' ||
        !Array.isArray(bundle.sketches) || bundle.sketches.length > 10000) throw new Error('Project has an invalid structure.');
    const rebuildWaitMs=projectRebuildWaitMs(bundle.model.history.length);
    if ((bundle.model.assembly !== undefined && (!Array.isArray(bundle.model.assembly) || bundle.model.assembly.length)) || bundle.model.workbench !== undefined) {
      throw new Error('Projects with assembly constraints or a custom workbench are not supported yet.');
    }
    if (bundle.surfacing !== undefined && (!object(bundle.surfacing) || !object(bundle.surfacing.scene) || !ctx.surfacingService)) throw new Error('Project contains invalid or unsupported surfacing data.');
    if (bundle.surfacing !== undefined) validateSurfacingIds(bundle.surfacing.scene);
    const physical=decodePhysicalSource(bundle.model.expressions);
    if (physical) {
      if (!parameterState || parameterState.source!==bundle.model.expressions) throw new Error('Typed parameter validation is missing.');
      createCandidateExpressionFacade(ctx.expressionService,bundle.model.expressions,{revision:'restore',ok:true,result:parameterState.result},'restore');
    } else if (parseMathDefinitions(bundle.model.expressions).errors.length) throw new Error('The project contains unsupported or invalid expressions.');
    for (const op of bundle.model.history) {
      if (!object(op) || typeof op.type !== 'string' || !op.type || op.type.length > 256 ||
          !object(op.params) || !Object.prototype.hasOwnProperty.call(ctx.streams.operation.registry.value, op.type) ||
          typeof ctx.operationService.get(op.type).run !== 'function') throw new Error('Project contains an unsupported operation.');
    }
    const ids = new Set<string>();
    for (const sketch of bundle.sketches) {
      if (!object(sketch) || typeof sketch.id !== 'string' || !sketch.id || sketch.id.length > 1024 ||
          // Reject control characters in storage keys intentionally.
          // eslint-disable-next-line no-control-regex
          /[\u0000-\u001f\u007f]/.test(sketch.id) || ids.has(sketch.id) || !object(sketch.data)) throw new Error('Project contains an invalid sketch.');
      if (!workerStorage) validateProjectSketch(sketch.data);
      if (sketch.data.constants !== undefined && parseMathDefinitions(sketch.data.constants).errors.length) throw new Error('A sketch contains unsupported or invalid constants.');
      ids.add(sketch.id);
    }
    // Recheck after asynchronous validation: the workspace may have changed.
    requireEmptyWorkspace();
    guard();
    restoringSnapshot = job;
    let stagedWrites: (() => boolean)[] = [];
    const rollbackStaging = () => {
      const writes = stagedWrites;
      stagedWrites = [];
      let failure: any = null;
      for (let i = writes.length - 1; i >= 0; i--) {
        try { writes[i](); } catch (error) { failure ||= error; }
      }
      if (failure) throw failure;
    };
    const stage = (key: string, value: string) => {
      guard();
      stagedWrites.push(job.storage.stageWrite(key, value));
      guard();
    };
    let rollbackFailure: any = null;
    const rollbackOnAbort = () => { try { rollbackStaging(); } catch(error) { rollbackFailure ||= error; } };
    job.signal.addEventListener('abort', rollbackOnAbort, {once: true});
    let callerFailure: any = null;
    const failRestore = error => {
      job.signal.removeEventListener('abort', rollbackOnAbort);
      return failOwnedRestore({job,currentProject:currentManagerProject,
        rollback:()=>{rollbackStaging();if(rollbackFailure)throw rollbackFailure;},error});
    };
    const cancelRestore = () => { callerFailure ||= failRestore(new DOMException('Project restore cancelled', 'AbortError')); };
    job.cancellationSignal?.addEventListener('abort', cancelRestore, {once:true});
    if(job.cancellationSignal?.aborted)cancelRestore();
    try {
      guard();
      const disarm=physical ? armPreparedPhysicalState(ctx.expressionService,bundle.model.expressions,parameterState.result) : () => {};
      try {
      if (workerStorage) {
        if (typeof workerStorage.model !== 'string' || !Array.isArray(workerStorage.sketches) ||
            workerStorage.sketches.length !== bundle.sketches.length ||
            workerStorage.sketches.some((sketch, i) => sketch.id !== bundle.sketches[i].id || typeof sketch.data !== 'string')) {
          throw new Error('Project validation returned invalid storage data.');
        }
        const key = ctx.projectService.id, sketchNamespace = PROJECTS_PREFIX + key + SKETCH_SUFFIX;
        stage(PROJECTS_PREFIX + key, workerStorage.model);
        workerStorage.sketches.forEach(sketch => stage(sketchNamespace + sketch.id, sketch.data));
        // Workbench is rejected above, so loadData has the same supported
        // semantics as loadStrict without reparsing the large storage string.
        ctx.projectService.loadData(bundle.model, job.generation);
      } else {
        stage(ctx.projectService.projectStorageKey(), JSON.stringify(bundle.model));
        bundle.sketches.forEach(sketch => stage(ctx.projectService.sketchStorageKey(sketch.id), JSON.stringify(sketch.data)));
        ctx.projectService.loadStrict(job.generation);
      }
      } finally { disarm(); }
      const started = performance.now(), deadline = started + rebuildWaitMs;
      // A completed pipeline, failure, or the deadline ends this wait.
      // eslint-disable-next-line no-constant-condition
      while (true) {
        guard();
        const failure=ctx.craftService.pipelineFailure$.value;
        if(failure){
          const code=Object.getOwnPropertyDescriptor(failure,'code')?.value,
            message=Object.getOwnPropertyDescriptor(failure,'userMessage')?.value||Object.getOwnPropertyDescriptor(failure,'message')?.value;
          // Preserve the typed reason through Open; the existing transaction
          // still owns rollback, with no successful acceptance implied.
          throw Object.assign(new Error(typeof message==='string'&&message.length<=2048?message:'The project could not be rebuilt.'),{
            code:typeof code==='string'&&/^[A-Z][A-Z0-9_]{0,127}$/.test(code)?code:'PROJECT_REBUILD_FAILED',cause:failure});
        }
        const mods = ctx.craftService.modifications$.value;
        if (mods.history.length === bundle.model.history.length && mods.pointer === mods.history.length - 1 && !ctx.craftService.isProcessing) break;
        if (performance.now() >= deadline) throw restoreTimeout({job, ownsDocument,
          craft:ctx.craftService, expectedHistory:bundle.model.history.length,
          elapsedMs:performance.now()-started, allowedMs:rebuildWaitMs,
          report:diagnostic=>console.warn('CAD project rebuild timeout', diagnostic), rollback:rollbackStaging});
        await new Promise(resolve => setTimeout(resolve, 25));
      }
      if (bundle.surfacing !== undefined) {
        ctx.surfacingService.load(bundle.surfacing);
        const canonical = value => {
          if (Array.isArray(value)) return value.map(canonical);
          if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
          return value;
        };
        const restored = ctx.surfacingService.save();
        // Recreating derived bounding curves consumes IDs. Their counters may
        // advance, but must never go backwards and risk later collisions.
        const expected = JSON.parse(JSON.stringify(bundle.surfacing));
        const actual = JSON.parse(JSON.stringify(restored));
        const counters = expected.scene.idCounters || {};
        const newCounters = actual.scene.idCounters || {};
        for (const key of Object.keys(counters)) {
          if (!Number.isSafeInteger(counters[key]) || counters[key] < 0 ||
              !Number.isSafeInteger(newCounters[key]) || newCounters[key] < counters[key]) {
            throw new Error('Surfacing identifiers did not reconstruct safely.');
          }
        }
        delete expected.scene.idCounters;
        delete actual.scene.idCounters;
        if (JSON.stringify(canonical(actual)) !== JSON.stringify(canonical(expected))) {
          throw new Error('Surfacing data did not reconstruct completely.');
        }
      }
      guard();
      manufacturingMetadata = decoded.manufacturing; manufacturingRevision++;
      presentationMetadata = decoded.presentation||null; presentationRevision++;
      drawingDefinition = decoded.drawing||null; drawingRevision++;
      stagedWrites = [];
    } catch (error) {
      // Rollback and exact-owner revocation share one synchronous turn. A
      // cancelled waiter must not leave its craft replay able to publish.
      throw callerFailure || failRestore(error);
    } finally {
      job.cancellationSignal?.removeEventListener('abort', cancelRestore);
      job.signal.removeEventListener('abort', rollbackOnAbort);
      if (restoringSnapshot === job) restoringSnapshot = null;
      if (ownsDocument(job) && !restoreUnavailable()) job.project.scheduleSave();
    }
  }

  function exportProject(id) {
    const modelData = ctx.services.storage.get(PROJECTS_PREFIX + id);
    if (modelData) {
      let data = '{\n"model":\n' + modelData + ',\n "sketches": [\n';
      const sketchesNamespace = PROJECTS_PREFIX + id + SKETCH_SUFFIX;
      const sketchKeys = ctx.services.storage.getAllKeysFromNamespace(sketchesNamespace);
      data += sketchKeys.map(key => `{"id":"${key.substring(sketchesNamespace.length)}", "data": ` 
        + ctx.services.storage.get(key) + "}").join('\n,');
      data += '\n]\n}';
      exportTextData(data, id + '.json');
    }
  }

  function checkExistence(projectId) {
    if (exists(projectId)) {
      alert('Project with name ' + projectId + ' already exists');
      return true;
    }
    return false;
  }
  
  function cloneProjectImpl(oldId, newId) {
    if (checkExistence(newId)) {
      return 
    }
    const data = ctx.services.storage.get(PROJECTS_PREFIX + oldId);
    if (data) {
      ctx.services.storage.set(PROJECTS_PREFIX + newId, data);
      const sketchesNamespace = PROJECTS_PREFIX + oldId + SKETCH_SUFFIX;
      const sketchKeys = ctx.services.storage.getAllKeysFromNamespace(sketchesNamespace);
      sketchKeys.forEach(key => {
        ctx.services.storage.set(PROJECTS_PREFIX + newId + SKETCH_SUFFIX + key.substring(sketchesNamespace.length), ctx.services.storage.get(key));
      });
    }
  }

  function cloneProject(oldProjectId, silent) {
    const newProjectId = prompt("New Project Name", oldProjectId);
    if (newProjectId) {
      cloneProjectImpl(oldProjectId, newProjectId);
      if (!silent) {
        openProject(newProjectId);
      }
      return true;
    }
    return false;
  }

  function exists(projectId) {
    return ctx.services.storage.exists(PROJECTS_PREFIX + projectId);
  }
  
  function listProjects() {

    const allProjectKeys = ctx.services.storage.getAllKeysFromNamespace(PROJECTS_PREFIX);
    
    const projects = {};  
    
    function getProject(id) {
      let project = projects[id];
      if (!project) {
        project = {
          id,
          sketches: []
        };
        projects[id] = project;
      }
      return project;
    }
    
    for(const key of allProjectKeys) {
      const sketchSuffixIdx = key.indexOf(SKETCH_SUFFIX);
      if (sketchSuffixIdx !== -1) {
        const projectId = key.substring(PROJECTS_PREFIX.length, sketchSuffixIdx);
        const sketchId = key.substring(sketchSuffixIdx + SKETCH_SUFFIX.length);
        getProject(projectId).sketches.push(sketchId);
      } else {
        const projectId = key.substring(PROJECTS_PREFIX.length);
        getProject(projectId)
      }
    }
    return Object.keys(projects).sort().map(key => projects[key]);
  }

  function deleteProjectImpl(projectId) {
    ctx.services.storage.remove(PROJECTS_PREFIX + projectId);
    const sketchesNamespace = PROJECTS_PREFIX + projectId + SKETCH_SUFFIX;
    ctx.services.storage.getAllKeysFromNamespace(sketchesNamespace).forEach(key => ctx.services.storage.remove(key));
  }
  
  function deleteProject(projectId) {
    if (confirm(`Project ${projectId} will be deleted. Continue?`)) {
      deleteProjectImpl(projectId)
    } 
  }
  
  function renameProject(oldProjectId, silent) {
    if (cloneProject(oldProjectId, silent)) {
      deleteProjectImpl(oldProjectId);
    }
  }

  function newProject() {
    const newProjectId = prompt("New Project Name");
    if (newProjectId) {
      if (checkExistence(newProjectId)) {
        return
      }
      openProject(newProjectId);
    }
  }

  function openProject(projectId) {
    window.open('?' + projectId);
  }

  ctx.services.ui.registerFloatView('ProjectManager', ProjectManager, 'Project Manager', 'database');

  managerAuthority = {
    get unit(): 'millimeter' { return 'millimeter'; },
    inspectDisplayUnits,setDisplayUnits,getPresentationMetadata,getLinkedPartDrawingDefinition,inspectLinkedPartDrawing,applyLinkedPartDrawingOperation,travelLinkedPartDrawingMetadata,exportLinkedPartDrawingSvg,
    formatDisplayQuantity:(value:number,dimension:'length'|'area'|'volume'|'angle',digits=2)=>formatQuantity(value,dimension,presentationMetadata,digits),
    get isRestoring(): boolean { return ownsDocument(restoringSnapshot); },
    listProjects, openProject, newProject, renameProject, deleteProject, importBundle,
    exists, cloneProject, exportProject, importProjectAs, importProject, loadExternalProject,
    snapshotCurrentProject, snapshotForHostSave, prepareHostSave,prepareHostNativeArchive,restoreNativeArchiveBytesInEmptyWorkspace,closeNativeArchive, inspectDocumentRevision, inspectMaterialSurfaceRevision, inspectEnclosureMaterialRoles, assignEnclosureMaterialRoles, inspectGenericManufacturingParts, prepareGenericManufacturingAssignment,assignGenericManufacturingParts,travelManufacturingMetadata,readManufacturingPublication, restoreSnapshotInEmptyWorkspace, restoreSnapshotBytesInEmptyWorkspace, getManufacturingMetadata, hasManufacturingMetadata,inspectAuthoredManufacturingReferences, verifyParentRepairAssignments, exportCore3mfResearch,
    proposeHostManufacturingRebind, confirmHostManufacturingRebind, cancelHostManufacturingRebind, resetDocumentState
  };

  ctx.projectManager = managerAuthority;
  ctx.services.projectManager = managerAuthority;
}

// Reject snapshots that could reuse serialized entity IDs after rebuilding.
// Actual geometry and references are also checked by the round-trip below.
function validateSurfacingIds(scene: any) {
  if (!Array.isArray(scene.vertexIds) || !Array.isArray(scene.vertices) ||
      scene.vertexIds.length !== scene.vertices.length || !Array.isArray(scene.patches) ||
      !Array.isArray(scene.groups) || !scene.idCounters || typeof scene.idCounters !== 'object' || Array.isArray(scene.idCounters)) {
    throw new Error('Surfacing identifiers are missing or invalid.');
  }
  const ids = [scene.id, ...scene.vertexIds, ...scene.patches.map(p => p && p.id), ...scene.groups.map(g => g && g.id)];
  const seen = new Set<string>();
  for (const id of ids) {
    if (typeof id !== 'string' || seen.has(id)) throw new Error('Surfacing entity IDs must be unique.');
    const match = /^([A-Za-z]+):(0|[1-9][0-9]*)$/.exec(id);
    const n = match && Number(match[2]);
    if (!match || !Number.isSafeInteger(n) || !Number.isSafeInteger(scene.idCounters[match[1]]) || scene.idCounters[match[1]] <= n) {
      throw new Error('Surfacing identifier counter is invalid.');
    }
    seen.add(id);
  }
}

export class ProjectCounters {
  featureId: number = 0;
}

export interface ProjectModel {

  historyStateVersion?: 1;

  history: OperationRequest[],

  expressions: string

  assembly?: AssemblyConstraintDefinition[];

  workbench?: string,

  counters?: ProjectCounters;
}

export interface ModelBundle {

  model: ProjectModel,

  surfacing?: any;

  sketches: {
    id: string,
    data: SketchFormat_V3
  }[];

}

export interface ProjectEnvelope {
  format: 'codi-jsketcher-project';
  version: 2 | 3;
  unit: 'millimeter';
  project: ModelBundle;
  manufacturing?: any;
  presentation?: Readonly<{version:1,lengthUnit:'inch'}>;
  drawings?: readonly [LinkedPartDrawingDefinition];
}
export interface DisplayUnitsInspection {readonly revision:string;readonly canonicalLengthUnit:'millimeter';readonly canonicalAngleUnit:'radian';readonly lengthUnit:'millimeter'|'inch';readonly angleUnit:'degree';}
export interface DisplayUnitsReceipt extends DisplayUnitsInspection {readonly changed:boolean;readonly authoredUndo:false;}

export interface GenericManufacturingInspection {readonly version:1;readonly revision:string;readonly unit:'millimeter';readonly ready:boolean;readonly reason:string|null;readonly targets:readonly GenericManufacturingTarget[];readonly assignments:readonly any[];readonly limits:typeof GENERIC_MANUFACTURING_LIMITS;readonly publication:'unavailable'|'shared-metadata-transaction-v1';readonly authoredUndo:'pending-shared-journal'|'shared-session-journal-v1';readonly manufacturingMesh:'unqualified';}
export interface GenericManufacturingPreparation {readonly revision:string;readonly geometryRevision:string;readonly metadata:Readonly<any>;readonly summary:GenericManufacturingSummary;readonly isCurrent:()=>boolean;}

interface IProjectManager {

  resetDocumentState(generation: number): void;
  readonly isRestoring: boolean;

  readonly unit: 'millimeter';
  inspectDisplayUnits(): DisplayUnitsInspection;
  setDisplayUnits(input:{revision:string,lengthUnit:'millimeter'|'inch'},options?:{signal?:AbortSignal,valid?:()=>boolean}): DisplayUnitsReceipt;
  getPresentationMetadata(): Readonly<{version:1,lengthUnit:'inch'}> | null;
  getLinkedPartDrawingDefinition(): LinkedPartDrawingDefinition | null;
  inspectLinkedPartDrawing():any;
  exportLinkedPartDrawingSvg(options?:{signal?:AbortSignal,valid?:()=>boolean}):Promise<Uint8Array>;
  applyLinkedPartDrawingOperation(input:unknown,options?:{signal?:AbortSignal,valid?:()=>boolean}):Promise<any>;
  travelLinkedPartDrawingMetadata(input:any,options?:{signal?:AbortSignal,valid?:()=>boolean}):Promise<any>;
  formatDisplayQuantity(value:number,dimension:'length'|'area'|'volume'|'angle',digits?:number):Readonly<{canonicalValue:number,canonicalUnit:string,value:number,unit:string,text:string}>;

  exportCore3mfResearch(options?: {signal?:AbortSignal,valid?:()=>boolean}): Promise<Uint8Array>;

  inspectGenericManufacturingParts(): GenericManufacturingInspection;
  prepareGenericManufacturingAssignment(input:unknown,options?:{signal?:AbortSignal,valid?:()=>boolean}): Promise<GenericManufacturingPreparation>;
  assignGenericManufacturingParts(input:unknown,options?:{signal?:AbortSignal,valid?:()=>boolean}):Promise<any>;
  travelManufacturingMetadata(input:any,options?:{signal?:AbortSignal,valid?:()=>boolean}):Promise<any>;
  readManufacturingPublication(ticket:object):any;
  getManufacturingMetadata(): any;
  hasManufacturingMetadata(): boolean;
  inspectAuthoredManufacturingReferences():Readonly<{materialRevision:string,references:readonly Readonly<{featureId:number,operationType:string}>[]}>;
  verifyParentRepairAssignments(previous:any[],prefix:any[],candidate:any[],history:any[],affected:string[]): void;
  inspectDocumentRevision(): string;
  inspectMaterialSurfaceRevision(): string;
  inspectEnclosureMaterialRoles(): {revision:string, featureIds:number[]};
  assignEnclosureMaterialRoles(featureId: number, roles: any, options: {revision:string, signal?: AbortSignal, valid?: () => boolean}): Promise<void>;

  snapshotForHostSave(options?: {signal?:AbortSignal,valid?:()=>boolean}): Promise<ProjectEnvelope>;
  prepareHostSave(options?: {signal?:AbortSignal,valid?:()=>boolean}): Promise<{envelope:ProjectEnvelope,isCurrent:()=>boolean}>;
  prepareHostNativeArchive(options?:{signal?:AbortSignal,valid?:()=>boolean}):Promise<{blob:Blob,receipt:any,isCurrent:()=>boolean,rebase:(blob:Blob,options?:{signal?:AbortSignal,valid?:()=>boolean})=>Promise<{verifiedBytes:number}>,release:()=>Promise<void>}>;
  restoreNativeArchiveBytesInEmptyWorkspace(blob:Blob,options?:{signal?:AbortSignal,valid?:()=>boolean}):Promise<any>;
  closeNativeArchive():void;
  proposeHostManufacturingRebind(options?: {signal?:AbortSignal,valid?:()=>boolean}): Promise<any>;
  confirmHostManufacturingRebind(token: string): void;
  cancelHostManufacturingRebind(): void;

  snapshotCurrentProject(): ProjectEnvelope;

  restoreSnapshotInEmptyWorkspace(json: string): Promise<void>;
  restoreSnapshotBytesInEmptyWorkspace(blob: Blob, options?: {signal?: AbortSignal, valid?: () => boolean}): Promise<void>;

  importBundle(projectId: string, dataJson: ModelBundle): void;

  importProjectAs(): void;

  importProject(): void;

  exportProject(id: string): void;

  cloneProject(oldProjectId: string, silent?: boolean): void;

  exists(projectId: string): boolean;

  listProjects(): string[];

  deleteProject(projectId: string): void;

  renameProject(oldProjectId: string, silent: boolean): void

  newProject(): void;

  openProject(projectId: string): void;

  loadExternalProject(projectId: string): ProjectModel;

}

export interface ProjectManagerBundleContext {

  projectManager: IProjectManager;
}

export const BundleName = "@ProjectManager";
