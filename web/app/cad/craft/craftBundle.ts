import {createPrincipalPlanePlacementCommands} from './principalPlanePlacementCommands';
import {isUnjournaledLegacyHistory} from './legacyHistoryNavigation.mjs';
import {canonicalAuthoredFeatureId} from './authoredFeatureIdentity.mjs';
import {readHistoryReviewCancel,discardHistoryReviewDraft} from './wizard/wizardBundle';
import type {HistoryReviewCancelCapture} from './wizard/wizardBundle';
import {AUTHORED_SOLID_KINDS} from 'engine/solid/authoredSolidKinds.mjs';
import {nativeAttachmentDependents} from './workerFeatureDeleteCommands';
import {createWorkerPlanarAttachmentReadCommands} from './workerPlanarAttachmentReadCommands';
import {readCandidateWorkerPlanarFaces} from 'engine/solid/solidLedger.mjs';
import {hasNativeSourceAttachments,issueNativeSourceReplay,isNativeSourceReplay,nativeSourceReplayRepair,nativeSourceReplayDirection,createNativeSourceReplay,preparedNativeSourceChanges,capturePrincipalSourceBasis,capturePrincipalSourceProof,readPrincipalSourceProof} from './sourceFrameReplay';
import {planNativeSourceTravel,supplementNativeSourceJournal} from './authoredEditJournal.mjs';
import {createSourceFrameCommands} from './sourceFrameCommands';
import {captureSourceFrameJournalOperation,recordSourceFrameEdit,planSourceFrameTravel} from './authoredEditJournal.mjs';
import {captureSourceFrameParameters} from 'engine/source/sourceFrameIntent.mjs';
import {isSourcePlaneType,isRegisteredSourcePlane} from './sourcePlanePolicy';
import {featureSuppressed,historyStateVersion,assertHistoryControlAppendAllowed,requireActiveFeature} from 'engine/solid/authoredHistoryState.mjs';
import {createWorkerHistoryControlCommands} from './workerHistoryControlCommands';
import {validateControlledHistory,assertActiveHistoryDependencies,assertProtectedHistoryOutputs,applyHistoryControlTravel} from './authoredHistoryControls.mjs';
import {HISTORY_CONTROL_KINDS,recordHistoryControl,planHistoryControlTravel} from './authoredEditJournal.mjs';
import {requireModernPhysicalHistory} from '../parameters/modernPhysicalBindings.mjs';
import {createSourcePlaneDepthCommands} from './sourcePlaneDepthCommands';
import {createSelectedProfileSourceDimensionCommands} from './selectedProfileSourceDimensionCommands';
import {captureSelectedProfileSourceDimensionEdit,recordSelectedProfileSourceDimensionEdit,planSelectedProfileSourceDimensionTravel} from './authoredEditJournal.mjs';
import {captureSourcePlaneParameters,sourcePlaneDepth} from 'sketcher/headless/sourcePlaneDepthEnvelope.mjs';
import {recordSourcePlaneDepthEdit,planSourcePlaneDepthTravel} from './authoredEditJournal.mjs';
import {addModification, stepOverriding} from './craftHistoryUtils';
import {Emitter, state, StateStream, stream} from 'lstream';
import materializeParams from './schema/materializeParams';
import CadError from '../../utils/errors';
import {MObject, MObjectIdGenerator} from '../model/mobject';
import {intercept} from "lstream/intercept";
import {ApplicationContext} from "cad/context";
import {OperationParams} from "cad/craft/schema/schema";
import {createOCCUtils} from "cad/craft/e0/OCCUtils";
import {clearImplicitModels} from "cad/craft/e0/occCommandInterface";
import {normalizeNewOperationRequest} from './normalizeNewOperationRequest';
import {CraftStaleStatus} from "./ui/CraftStaleStatus";
import {contributeComponent} from "cad/dom/components/ContributedComponents";
import {prepareStateBatch} from 'lstream/stateBatch';
import {recordPreparedDocumentMetadataEdit,planPreparedDocumentMetadataTravel,documentMetadataTarget} from './authoredEditJournal.mjs';
import {createRectangleCreationCommands, PreparedSketchCommand} from './rectangleCreation';
import {createRectangleEditingCommands} from './rectangleEditing';
import {createClosedSketchTransitionCommands} from './closedSketchTransitions';
import {createLegacyExpressionCommands} from './legacyExpressionCommands';
import {createEmptySketchCreationCommands} from './emptySketchCreation';
import {createWorkerFeatureCommands} from './workerFeatureCommands';
import {createWorkerRevolveCommands} from './workerRevolveCommands';
import {createWorkerLoftCommands} from './workerLoftCommands';
import {createWorkerSweepCommands} from './workerSweepCommands';
import {genericHistoryBuild} from 'engine/mount/selectedProfileBuildSelection.mjs';
import {selectedProfileHistoryBudget} from 'engine/mount/selectedProfileBudget.mjs';
import {createWorkerSolidCommands} from './workerSolidCommands';
import {createWorkerSolidPointCommands} from './workerSolidPointCommands';
import {createWorkerManufacturingMeshReplay} from './workerManufacturingMeshReplay';
import {createWorkerDrawingReadCommands} from './workerDrawingReadCommands';
import {readManufacturingReplayBatch} from './manufacturingMeshReplayResult.mjs';
import {classifyCandidateWorkerSolidPoints,exportCandidateWorkerSTEP,readCandidateWorkerManufacturingMesh,readCandidateWorkerDrawing,readCandidateWorkerBores} from 'engine/solid/solidLedger.mjs';
import {createWorkerStepExportCommands} from './workerStepExportCommands';
import {createWorkerLinearHolePatternCommands} from './workerLinearHolePatternCommands';
import {createWorkerThroughHoleCommands} from './workerThroughHoleCommands';
import {createWorkerFeatureDeleteCommands} from './workerFeatureDeleteCommands';
import {createWorkerThroughHoleParentCommands} from './workerThroughHoleParentCommands';
import {captureThroughHoleParentBinding,recordThroughHoleParentRepair,planThroughHoleParentRepairTravel,recordOperationRemove,planOperationRemoveTravel} from './authoredEditJournal.mjs';
import {createWorkerEdgeTreatmentCommands} from './workerEdgeTreatmentCommands';
import {createWorkerShellCommands} from './workerShellCommands';
import {captureSolidShellParameters,recordSolidShellEdit,planSolidShellTravel} from './authoredEditJournal.mjs';
import {createSelectedProfileCommands} from './selectedProfileCommands';
import {createSelectedProfileDepthCommands} from './selectedProfileDepthCommands';
import {createSelectedProfileRegionCommands} from './selectedProfileRegionCommands';
import {inspectCatalogSolidCapabilities,listAvailableSelectedProfileBuilds,requireAvailableSelectedProfileBuild,listAvailableLoftBuilds,requireAvailableLoftBuild,listAvailableSweepBuilds,requireAvailableSweepBuild,listAvailableRevolveBuilds,requireAvailableRevolveBuild,requireAvailablePointBuild,listAvailableStepExportBuilds,requireAvailableStepExportBuild,requireAvailableManufacturingMeshBuild} from 'engine/mount/catalogMount';
import {createEvaluationResourcePool} from './evaluationResources.mjs';
import {assertLegacyOperationInputs} from './legacyOperationInputs';
import {recordRevolveAngleEdit,planRevolveAngleTravel} from './authoredEditJournal.mjs';
import {captureOwnedRevolveFeature} from 'engine/solid/ownedRevolveFeature.mjs';
import {emptyAuthoredEditJournal, supportsOperationAppend, captureOperationAppend, recordOperationAppend, planOperationAppendTravel, captureLinearHolePatternParameters, recordLinearHolePatternEdit, planLinearHolePatternTravel, captureThroughHoleParameters, recordThroughHoleEdit, planThroughHoleTravel, recordExtrusionEdit, planExtrusionTravel, recordSolidBoxEdit, planSolidBoxTravel, captureSelectedProfileDepthParameters, recordSelectedProfileDepthEdit, planSelectedProfileDepthTravel, recordSelectedProfileRegionEdit, planSelectedProfileRegionTravel, captureSolidEdgeTreatmentParameters, recordSolidEdgeTreatmentEdit, planSolidEdgeTreatmentTravel, recordHoleEdit, planHoleTravel, recordSketchEdit, planSketchTravel, recordPhysicalTransaction, planPhysicalTravel, recordCenteredParentRepair, planCenteredParentRepairTravel} from './authoredEditJournal.mjs';
import {captureHoleEdit} from './holeEditIntent.mjs';
import {captureAuthoredHistory} from './captureAuthoredHistory.mjs';
import {capturePipelineHistory,assertPipelineHistoryCurrent} from './capturePipelineHistory.mjs';
import {sketchRevision} from './sketchRevision.mjs';
import {assertPhysicalMaterialBaseline} from './physicalMaterialBaseline.mjs';
import {registerUnconsumedSketchSave,hasOnlyUnconsumedSketchHistory,commitUnconsumedSketchSave,knownOwnSketchSaveTip} from './unconsumedSketchSave.mjs';
import {sketchBoundaryFrame} from '../sketch/boundaryValidity';
import {encodeUpdatedPhysicalDefinitions,encodePhysicalConfigurations,decodePhysicalSource} from '../parameters/physicalSource.mjs';
import {evaluatePhysicalInWorker} from '../parameters/physicalWorkerClient.mjs';
import {prepareExpressionPublication} from '../parameters/expressionPublication.mjs';
import physicalWorkerUrl from 'codi-physical-parameters-worker';
import sketchWorkerUrl from 'codi-headless-sketch-worker';
import {runSketchSolve} from 'sketcher/headless/client';
import {prepareTypedRectangle} from '../parameters/typedRectangleBindings.mjs';
import {deriveAuthoredPhysicalManifest} from '../parameters/authoredPhysicalManifest.mjs';
import {physicalBindingFields} from '../parameters/physicalBindingFields.mjs';
import {ReadSketch} from '../sketch/sketchReader';
import {MOpenFaceShell} from '../model/mopenFace';
import {getSketchBoundaries} from '../sketch/sketchBoundaries';
import {sameSketchSaveFrame} from './unconsumedSketchSave.mjs';
import {createCandidateSketchStorage} from './candidateSketchStorage.mjs';
import {centeredHoleIntentFromLid} from 'engine/extrusion/centeredHoleIntent.mjs';
import standardPlaneOperation from 'workbenches/modeler/features/plane/simplePlaneOperation';

const HISTORY_SIGNAL_ABORTED=Function.call.bind(Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get);
const HISTORY_LISTEN=Function.call.bind(EventTarget.prototype.addEventListener),HISTORY_UNLISTEN=Function.call.bind(EventTarget.prototype.removeEventListener);

export function activate(ctx: ApplicationContext) {


  const modifications$ = state({
    history: [],
    pointer: -1
  });

  const models$ = state<MObject[]>([]);
  const update$ = stream<void>();
  const pipelineFailure$ = state<any>(null);
  const engineCleanupFailure$ = state<any>(null);
  const authoredJournal$ = state(emptyAuthoredEditJournal((ctx.projectService as any).documentGeneration, 0));
  let journalHeadSignature: string = null;
  // One reference to the immutable accepted definition; entries retain no prefix.
  let journalHeadDefinition: OperationRequest[] = null;
  let fullTipSignature: string = null;
  let fullTipSketchRevision: string = null;
  let fullTipMaterialSurfaceRevision: string = null;
  let rewindBaseline: {document:number,signature:string} = null;
  let prepareSketchJournalTravel: Function = null;
  let sourcePlaneDepthCommands:any=null;
  let principalPlaneCommands:ReturnType<typeof createPrincipalPlanePlacementCommands>=null;
  let sourceFrameCommands:ReturnType<typeof createSourceFrameCommands>=null;
  let selectedProfileSourceDimensionCommands:any=null;
  let historyControlCommands:ReturnType<typeof createWorkerHistoryControlCommands>=null;
  let legacyExpressionCommands:any = null;
  const failedEvaluationHistory=new WeakMap<object,any[]>();
  const ownedPipelineHistories=new WeakSet<any[]>();

  let pendingModifications = 0;
  let pendingPipelines = 0;
  let evaluationEpoch = 0;
  let pipelineTail = Promise.resolve();
  let lastComplete: MObject[] = null;
  // This freshly activated craft service already contains the empty state of
  // its document. Its first command must not emit a spurious document reset.
  let lastCompleteGeneration: number = (ctx.projectService as any).documentGeneration;
  let lastCompleteService = ctx.projectService;
  const engineResources = createEvaluationResourcePool({maxMounts:2,maxTotalMounts:3});
  let acceptedResources = null, lastCompleteResources = null;
  function reportEngineCleanupFailure(force = false) {
    if ((!force && !engineResources.usage.cleanupFailed) || engineCleanupFailure$.value) return;
    try { engineCleanupFailure$.next(Object.freeze({code:'ENGINE_CLEANUP_FAILED',message:'Engine cleanup failed. Close and reopen this CAD window before further model evaluation.'})); }
    catch (error) { console.error('Engine cleanup status observer failed:',error); }
  }
  function requireEngineCleanup() {
    reportEngineCleanupFailure();
    if (engineCleanupFailure$.value) throw new Error('Engine cleanup failed. Close and reopen this CAD window.');
  }
  function detachAccepted(owner) {
    if (!owner || owner.state !== 'accepted') return;
    try { owner.detach(); } catch (error) {
      if (owner.state !== 'closed' || engineResources.usage.cleanupFailed) { console.error('Accepted engine resource cleanup failed:',error); reportEngineCleanupFailure(true); }
    }
  }
  function retireUnused(...owners) {
    let failed = false;
    for (const owner of new Set(owners)) {
      if (owner && owner !== acceptedResources && owner !== lastCompleteResources) {
        try { owner.close(); } catch (error) { failed = true; console.error('Engine retirement failed:',error); }
      }
    }
    reportEngineCleanupFailure(failed);
  }
  contributeComponent(CraftStaleStatus);

  const modificationCallbacks = new WeakMap();
  function settleModification(curr, error?: any) {
    const callbacks=modificationCallbacks.get(curr);
    if (!callbacks) return;
    modificationCallbacks.delete(curr);
    pendingModifications--;
    try {
      if (error === undefined) callbacks.onAccepted();
      else callbacks.onError(error);
    } catch (callbackError) {
      // Consumer/UI exceptions do not turn an accepted model into a failed one.
      console.error('Error in model-operation callback:', callbackError);
    }
  }
  async function submitModification(request, transform, onAccepted, onError, editingHistory = false, preparation?: PreparedSketchCommand) {
    try {
      requireEngineCleanup();
      preparation?.requireCurrent();
      if (pendingPipelines || pendingModifications) throw new Error('Another operation is still in progress.');
      const operation = ctx.operationService.get(request && request.type);
      if (!operation) throw new Error('Unknown operation.');
      const normalized = normalizeNewOperationRequest(request, operation, ctx);
      const rawId = normalized.params.featureId;
      if (!((typeof rawId === 'number' && Number.isSafeInteger(rawId)) ||
            (typeof rawId === 'string' && /^[0-9]+$/.test(rawId))) ||
          !Number.isSafeInteger(Number(rawId)) || Number(rawId) <= 0) throw new Error('Invalid feature ID.');
      const id = Number(rawId), previous = modifications$.value;
      const target = editingHistory ? previous.pointer + 1 : -1;
      if(editingHistory&&previous.history[target])requireActiveFeature(previous.history[target]);
      if (editingHistory && (target < 0 || target >= previous.history.length || Number(previous.history[target].params?.featureId) !== id)) {
        throw new Error('A history edit must retain its existing feature ID.');
      }
      if (previous.history.some((entry, index) => index !== target && Number(entry.params?.featureId) === id)) {
        throw new Error('Duplicate feature ID.');
      }
      assertHistoryControlAppendAllowed(previous.history,normalized.type);
      if (!editingHistory) ctx.projectService.counterGenerator.claimNewFeatureId(id);
      const project:any=ctx.projectService,document=project.documentGeneration,sourceEpoch=evaluationEpoch,
        sourceRevision=modifications$.revision,sourceTip=fullTipSignature,sourceModels=models$.value,sourceModelsRevision=models$.revision;
      if(!ownedPipelineHistories.has(previous.history)&&(previous.history.length||previous.pointer!==-1||sourceModels.length))throw Error('Rebuild the full model before editing its history.');
      const checkCapture=()=>{
        preparation?.requireCurrent();
        if(ctx.projectService!==project||!project.isDocumentCurrent(document)||pendingPipelines||pendingModifications||
           modifications$.value!==previous||modifications$.revision!==sourceRevision||models$.value!==sourceModels||models$.revision!==sourceModelsRevision||evaluationEpoch!==sourceEpoch||fullTipSignature!==sourceTip)throw superseded();
      };
      // Accepted records are privately owned and deeply immutable. Sharing them
      // in a fresh array is safe; do not impose narrow edit-capture limits on
      // larger valid native histories. The new request is normalized separately.
      checkCapture();
      const nextState = transform({...previous, history:[...previous.history]}, normalized);
      let appendJournal:any=null, initialOperationAppendJournal:any=null;
      if(!editingHistory && transform===addModification && supportsOperationAppend(normalized.type) && previous.pointer===previous.history.length-1){
        inspectAuthoredEdits();checkCapture();
        const journal=authoredJournal$.value,storage=ctx.storageService,manager:any=ctx.projectManager,
          namespace=project.sketchStorageNamespace,sketch=sketchRevision(storage,namespace),material=manager.inspectMaterialSurfaceRevision();
        // Before the first evaluation, startup may have advanced the document
        // generation while Craft still has its genuinely empty, unbound state.
        // Propose that first journal entry for the current document; publish it
        // only with the evaluated model. Never reinterpret stale/nonempty state.
        const initialEmpty=previous.history.length===0 && previous.pointer===-1 && sourceModels.length===0 &&
          ctx.cadRegistry.modelIndex.size===0 && sketch==='[]' && journal.entries.length===0 && journal.cursor===0 && journal.revision===0 &&
          journalHeadDefinition===null && journalHeadSignature===null && fullTipSignature===null &&
          fullTipSketchRevision===null && fullTipMaterialSurfaceRevision===null &&
          acceptedResources===null && lastCompleteResources===null && !pipelineFailure$.value && !engineCleanupFailure$.value;
        if((!initialEmpty && (journal.document!==document || journalHeadDefinition!==previous.history ||
           fullTipSketchRevision!==sketch || fullTipMaterialSurfaceRevision!==material)) ||
           preparation?.sketchOverrides?.length || preparation?.expressionPublication ||
           nextState.history.length!==previous.history.length+1 || nextState.history.slice(0,-1).some((entry,i)=>entry!==previous.history[i]))throw Error('The accepted tip is unavailable for feature creation history.');
        const appended=captureOperationAppend(normalized),index=previous.history.length;
        const sourceJournalHead=journalHeadDefinition,recordingJournal=initialEmpty?emptyAuthoredEditJournal(document,0):journal;
        if(initialEmpty)initialOperationAppendJournal=journal;
        appendJournal=recordOperationAppend(recordingJournal,{document,revision:recordingJournal.revision,index,operation:appended,previousFeatureId:index?Number(previous.history[index-1].params.featureId):null});
        // Accepted records and the one canonical append are deeply immutable.
        const owned=Object.freeze([...previous.history,appended]) as any;
        ownedPipelineHistories.add(owned);nextState.history=owned;
        const supplied=preparation;
        const appendCurrent=()=>{
          supplied?.requireCurrent();
          if(ctx.projectService!==project || !project.isDocumentCurrent(document) || ctx.storageService!==storage ||
             ctx.projectManager!==manager || project.sketchStorageNamespace!==namespace || sketchRevision(storage,namespace)!==sketch ||
             manager.inspectMaterialSurfaceRevision()!==material || modifications$.value!==previous ||
             authoredJournal$.value!==journal || journalHeadDefinition!==sourceJournalHead)throw superseded();
        };
        preparation={...supplied,requireCurrent:appendCurrent,
          requireCommittedCurrent(){supplied?.requireCommittedCurrent();if(ctx.projectService!==project||!project.isDocumentCurrent(document))throw superseded(true);},
          async prepare(models,history){appendCurrent();return supplied?supplied.prepare(models,history):null;}};
        appendCurrent();
      }
      pendingModifications++;
      modificationCallbacks.set(nextState,{onAccepted,onError,preparation,...(appendJournal?{journalProposal:appendJournal,operationAppend:true,...(initialOperationAppendJournal?{initialOperationAppendJournal}:{})}:{})});
      modifications$.next(nextState);
    } catch (error) { Promise.resolve().then(() => onError(error)); }

  }
  function modify(request, onAccepted, onError) {
    submitModification(request,addModification,onAccepted,onError);
  }
  function modifyInHistoryAndStep(request, onAccepted, onError) {
    if (['WORKER_RECTANGLE_EXTRUDE_V1','WORKER_CENTERED_THROUGH_HOLE_V1','WORKER_FOUR_CORNER_THROUGH_HOLES_V1'].includes(request?.type)) {
      restoreTipAndEditFeature(request).then(onAccepted,onError);
      return;
    }
    submitModification(request,stepOverriding,onAccepted,onError,true);
  }
  // The legacy wizard opens at a rewound feature. Restore the accepted full
  // tip first, then use the same guarded depth edit as the agent. The actual
  // authored change never publishes a prefix or discards descendants.
  async function restoreTipAndEditFeature(request: any) {
    const currentHistory=modifications$.value, target=currentHistory.history[currentHistory.pointer+1];
    if (request?.type==='WORKER_CENTERED_THROUGH_HOLE_V1' && target?.type===request.type && request.params?.face!==target.params?.face) {
      return repairCenteredParent({revision:(ctx.craftService as any).inspectWorkerHistory().revision,index:currentHistory.pointer+1,
        featureId:Number(target.params.featureId),faceId:request.params.face}, {}, request);
    }
    const service:any=ctx.projectService, document=service.documentGeneration;
    const before=modifications$.value, revision=modifications$.revision;
    const storage=ctx.storageService, manager:any=ctx.projectManager;
    const sketchNamespace=service.sketchStorageNamespace;
    const sourceSketch=sketchRevision(storage,sketchNamespace), materialSurface=manager.inspectMaterialSurfaceRevision();
    const index=before.pointer+1, original=before.history[index];
    if (!service.isDocumentCurrent(document) || pendingPipelines || pendingModifications ||
        !original || original.type!==request.type || before.pointer===before.history.length-1) {
      throw new Error('The feature edit is no longer available.');
    }
    const check=()=>{
      if(ctx.projectService!==service || !service.isDocumentCurrent(document) ||
         ctx.storageService!==storage || ctx.projectManager!==manager || service.sketchStorageNamespace!==sketchNamespace ||
         sketchRevision(storage,sketchNamespace)!==sourceSketch || manager.inspectMaterialSurfaceRevision()!==materialSurface ||
         modifications$.value!==before || modifications$.revision!==revision)throw superseded();
    };
    const captured=await captureAuthoredHistory(before.history,check);
    if (!rewindBaseline || rewindBaseline.document!==document || rewindBaseline.signature!==captured.signature) {
      throw new Error('The accepted full-tip history is unavailable or changed.');
    }
    if (fullTipSketchRevision!==sketchRevision(ctx.storageService,service.sketchStorageNamespace) ||
        fullTipMaterialSurfaceRevision!==(ctx.projectManager as any).inspectMaterialSurfaceRevision()) {
      throw new Error('The accepted model is stale; rebuild before editing.');
    }
    const requested=(await captureAuthoredHistory([request],check)).history[0];
    const prior=captured.history[index];
    const kind=request.type==='WORKER_RECTANGLE_EXTRUDE_V1'?'extrusion':request.type==='WORKER_CENTERED_THROUGH_HOLE_V1'?'centered':'corners';
    const dimensions=kind==='extrusion'?['length']:kind==='centered'?['diameter']:['diameter','offsetX','offsetY'];
    const previous:any={}, values:any={};
    for(const key of dimensions) {
      previous[key]=prior.params[key];const raw=requested.params?.[key];
      const value=typeof raw==='number'?raw:typeof raw==='string'&&raw.trim()!==''?Number(raw):NaN;
      if(!Number.isFinite(value)||value<=0||value>1e6)throw new Error('Enter positive numeric feature dimensions.');
      requested.params[key]=value;prior.params[key]=value;values[key]=value;
    }
    if((await captureAuthoredHistory([prior],check)).signature !== (await captureAuthoredHistory([requested],check)).signature) {
      throw new Error('This operation only supports changing the feature dimensions.');
    }
    for(const key of dimensions)prior.params[key]=previous[key];
    if((await captureAuthoredHistory(before.history,check)).signature!==captured.signature)throw superseded();
    const nextState={history:captured.history,pointer:captured.history.length-1};
    const preparation:PreparedSketchCommand={requireCurrent:check,
      requireCommittedCurrent(){if(!service.isDocumentCurrent(document))throw superseded(true);},
      async prepare(){if((await captureAuthoredHistory(before.history,check)).signature!==captured.signature)throw superseded();return null;}};
    await new Promise<void>((yes,no)=>{
      pendingModifications++;
      modificationCallbacks.set(nextState,{onAccepted:yes,onError:no,preparation});
      modifications$.next(nextState);
    });
    const args={revision:inspectAuthoredEdits().revision,index,featureId:Number(request.params.featureId)};
    if(kind==='extrusion')await authoredDepthOperation({...args,depth:values.length});
    else await authoredHoleOperation(kind,{...args,...values});
  }
  // Explicit, cancellable view transition. The live failed tip is not changed
  // until the complete prefix has been evaluated and publication succeeds.
  async function beginCenteredParentRepair(input:any,rawOptions:any={}) {
    const copy=(v:any,keys:string[])=>{if(!v||typeof v!=='object'||Array.isArray(v)||Reflect.ownKeys(v).length!==keys.length)throw new Error('Invalid repair request.');const out:any={};for(const k of keys){const d=Object.getOwnPropertyDescriptor(v,k);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))throw new Error('Invalid repair request.');out[k]=d.value;}return out;};
    const args=copy(input,['revision','index','featureId']);
    if(!rawOptions||typeof rawOptions!=='object'||Array.isArray(rawOptions)||Reflect.ownKeys(rawOptions).some(k=>typeof k!=='string'||!['signal','valid'].includes(k)))throw new Error('Invalid repair options.');
    const options=copy(rawOptions,Reflect.ownKeys(rawOptions) as string[]);
    if(options.valid!==undefined&&typeof options.valid!=='function')throw new Error('Invalid lifetime guard.');
    if(options.signal!==undefined)try{Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get.call(options.signal);}catch{throw new Error('Invalid cancellation signal.');}
    if(typeof args.revision!=='string'||!args.revision||args.revision.length>256||!Number.isSafeInteger(args.index)||args.index<0||args.index>255||!Number.isSafeInteger(args.featureId)||args.featureId<1)throw new Error('Invalid repair target.');
    const service:any=ctx.projectService,document=service.documentGeneration,storage=ctx.storageService,manager:any=ctx.projectManager,registry=ctx.cadRegistry;
    const before=modifications$.value,revision=modifications$.revision,journal=authoredJournal$.value,namespace=service.sketchStorageNamespace,sketch=sketchRevision(storage,namespace),material=manager.inspectMaterialSurfaceRevision(),failure=pipelineFailure$.value;
    const services=()=>[ctx.projectService,ctx.storageService,ctx.craftService,ctx.cadRegistry,ctx.operationService,ctx.expressionService,ctx.projectManager,ctx.sketchStorageService,ctx.services.sketcher,ctx.wizardService,ctx.workbenchService,ctx.assemblyService];
    const streams=()=>[modifications$,models$,pipelineFailure$,engineCleanupFailure$,ctx.expressionService.script$,ctx.expressionService.list$,ctx.expressionService.errors$,ctx.streams.sketcher.sketchingFace,ctx.wizardService.workingRequest$,ctx.workbenchService.currentWorkbench$,ctx.assemblyService.constraints$];
    const savedServices=services(),savedStreams=streams(),versions=savedStreams.map(s=>s.revision),target=before.history[args.index],workbench=ctx.workbenchService.currentWorkbench$.value;
    if(args.revision!==(ctx.craftService as any).inspectWorkerHistory().revision||before.pointer!==before.history.length-1||pendingPipelines||pendingModifications||engineCleanupFailure$.value||!service.hasHostLifetime||!service.isDocumentCurrent(document)||manager.isRestoring||manager.unit!=='millimeter'||ctx.services.sketcher.inPlaceEditor.inEditMode||ctx.wizardService.workingRequest$.value||(ctx.expressionService.errors$ as any).value.length||ctx.assemblyService.getConstraints().length||(workbench&&!workbench.internal&&workbench.workbenchId!==ctx.workbenchService.defaultWorkbenchId)||!target||target.type!=='WORKER_CENTERED_THROUGH_HOLE_V1'||Number(target.params?.featureId)!==args.featureId)throw new Error('The selected repair target is unavailable.');
    const valid=()=>{try{return (!options.valid||options.valid()===true)&&!options.signal?.aborted}catch{return false}};
    const check=()=>{if(!valid()||!service.isDocumentCurrent(document)||ctx.projectService!==service||ctx.storageService!==storage||ctx.projectManager!==manager||service.sketchStorageNamespace!==namespace||sketchRevision(storage,namespace)!==sketch||manager.inspectMaterialSurfaceRevision()!==material||services().some((x,i)=>x!==savedServices[i])||streams().some((x,i)=>x!==savedStreams[i]||x.revision!==versions[i])||modifications$.value!==before||modifications$.revision!==revision||authoredJournal$.value!==journal)throw superseded();};
    check();const captured=await captureAuthoredHistory(before.history,check),scope:{epoch:number|null}={epoch:null};let choices:any[]=null;
    const preparation:PreparedSketchCommand={candidateScope:scope,requireCurrent:check,requireCommittedCurrent(){if(!valid()||!service.isDocumentCurrent(document))throw superseded(true);},async prepare(models){
      if((await captureAuthoredHistory(before.history,check)).signature!==captured.signature)throw superseded();check();const found:any[]=[];
      for(const body of models){if(body?.ext?.workerGeometry?.representation!=='worker-owned-occ-prism'||body.ext.workerGeometry.engine!=='occ'||!Array.isArray(body.faces))continue;for(const face of body.faces){if(face?.root!==body||face.topology?.data?.portableIdentity?.key?.role!=='LID')continue;const target=centeredHoleIntentFromLid({featureId:String(args.featureId),lidFaceId:face.id,diameter:1}).target;if(target.bodyId!==body.id)throw new Error('Candidate parent identity changed.');found.push(Object.freeze({bodyId:body.id,lidFaceId:face.id,parentFeatureId:target.parentFeatureId,regionId:target.regionId}));if(found.length>256)throw new Error('Too many candidate parents.');}}
      choices=found;check();return null;
    }};
    const nextState={history:before.history,pointer:args.index-1,hints:{noWizardFocus:true}},reason=failure?.userMessage||failure?.message||null;
    let settled=false;const stop=()=>{if(!settled&&scope.epoch!==null&&scope.epoch===evaluationEpoch)engineResources.cancelCandidates();};options.signal?.addEventListener('abort',stop,{once:true});const timer=setInterval(()=>{try{check()}catch{stop()}},100);
    try{check();if(pendingPipelines||pendingModifications)throw new Error('Another operation is still in progress.');await new Promise<void>((yes,no)=>{pendingModifications++;modificationCallbacks.set(nextState,{onAccepted:yes,onError:no,preparation});modifications$.next(nextState);});if(!choices)throw new Error('Repair candidates are unavailable.');return Object.freeze({revision:(ctx.craftService as any).inspectWorkerHistory().revision,index:args.index,featureId:args.featureId,reason:typeof reason==='string'?reason.slice(0,512):null,candidates:Object.freeze(choices)});}
    finally{settled=true;clearInterval(timer);options.signal?.removeEventListener('abort',stop);}
  }
  // Only the evaluated prefix is authoritative for selecting a new parent.
  async function repairCenteredParent(input:any, rawOptions:any = {}, wizardRequest?:any) {
    const copy=(value:any,keys:string[])=>{if(!value||typeof value!=='object'||Array.isArray(value)||Reflect.ownKeys(value).length!==keys.length)throw new Error('Invalid parent repair.');const out:any={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))throw new Error('Invalid parent repair.');out[key]=d.value;}return out;};
    const args=copy(input,['revision','index','featureId','faceId']);
    if(!rawOptions||typeof rawOptions!=='object'||Array.isArray(rawOptions)||Reflect.ownKeys(rawOptions).some(k=>typeof k!=='string'||!['signal','valid'].includes(k)))throw new Error('Invalid repair options.');
    const options=copy(rawOptions,Reflect.ownKeys(rawOptions) as string[]);
    if(options.valid!==undefined&&typeof options.valid!=='function')throw new Error('Invalid lifetime guard.');
    if(options.signal!==undefined)try{Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get.call(options.signal);}catch{throw new Error('Invalid cancellation signal.');}
    if(typeof args.revision!=='string'||!args.revision||args.revision.length>256||!Number.isSafeInteger(args.index)||args.index<0||args.index>255||!Number.isSafeInteger(args.featureId)||args.featureId<1||typeof args.faceId!=='string'||!args.faceId||args.faceId.length>1024)throw new Error('Invalid parent repair.');
    const service:any=ctx.projectService,document=service.documentGeneration,storage=ctx.storageService,manager:any=ctx.projectManager,registry=ctx.cadRegistry;
    const before=modifications$.value,initialRevision=modifications$.revision,journal=authoredJournal$.value,namespace=service.sketchStorageNamespace,sketch=sketchRevision(storage,namespace),material=manager.inspectMaterialSurfaceRevision();
    const services=()=>[ctx.projectService,ctx.storageService,ctx.craftService,ctx.cadRegistry,ctx.operationService,ctx.expressionService,ctx.projectManager,ctx.sketchStorageService,ctx.services.sketcher,ctx.wizardService,ctx.workbenchService,ctx.assemblyService];
    const streams=()=>[modifications$,models$,pipelineFailure$,engineCleanupFailure$,ctx.expressionService.script$,ctx.expressionService.list$,ctx.expressionService.errors$,ctx.streams.sketcher.sketchingFace,ctx.wizardService.workingRequest$,ctx.workbenchService.currentWorkbench$,ctx.assemblyService.constraints$];
    const capturedServices=services(),capturedStreams=streams(),versions=capturedStreams.map(s=>s.revision);
    const entry=before.history[args.index],face=registry.findFace(args.faceId);
    const workbench=ctx.workbenchService.currentWorkbench$.value;
    if(args.revision!==(ctx.craftService as any).inspectWorkerHistory().revision||before.pointer!==args.index-1||pendingPipelines||pendingModifications||pipelineFailure$.value||engineCleanupFailure$.value||!service.hasHostLifetime||!service.isDocumentCurrent(document)||manager.unit!=='millimeter'||manager.isRestoring||ctx.services.sketcher.inPlaceEditor.inEditMode||(ctx.expressionService.errors$ as any).value.length||ctx.assemblyService.getConstraints().length||(workbench&&!workbench.internal&&workbench.workbenchId!==ctx.workbenchService.defaultWorkbenchId)||!entry||entry.type!=='WORKER_CENTERED_THROUGH_HOLE_V1'||Number(entry.params?.featureId)!==args.featureId||!face||face.id!==args.faceId||face.root?.ext?.workerGeometry?.representation!=='worker-owned-occ-prism'||face.topology?.data?.portableIdentity?.key?.role!=='LID')throw new Error('The selected repair or evaluated prefix is unavailable.');
    const working=ctx.wizardService.workingRequest$.value;
    if(!wizardRequest && working && (!working.hints?.noWizardFocus || working.type!==entry.type || Number(working.params?.featureId)!==args.featureId))throw new Error('Finish the current operation before repairing this reference.');
    if(entry.params.face===args.faceId)throw new Error('The selected parent is unchanged.');
    const valid=()=>{try{return (!options.valid||options.valid()===true)&&!options.signal?.aborted}catch{return false}};
    const check=()=>{if(!valid()||!service.isDocumentCurrent(document)||ctx.projectService!==service||ctx.storageService!==storage||ctx.projectManager!==manager||service.sketchStorageNamespace!==namespace||sketchRevision(storage,namespace)!==sketch||manager.inspectMaterialSurfaceRevision()!==material||services().some((x,i)=>x!==capturedServices[i])||streams().some((x,i)=>x!==capturedStreams[i]||x.revision!==versions[i])||modifications$.value!==before||modifications$.revision!==initialRevision||authoredJournal$.value!==journal||registry.findFace(args.faceId)!==face)throw superseded();};
    check();const captured=await captureAuthoredHistory(before.history,check),prior=captured.history[args.index];
    if(wizardRequest){const requested=(await captureAuthoredHistory([wizardRequest],check)).history[0];const normalized={...requested,params:{...requested.params,face:prior.params.face}};if((await captureAuthoredHistory([normalized],check)).signature!==(await captureAuthoredHistory([prior],check)).signature)throw new Error('Repair only changes the parent reference.');}
    const oldFace=prior.params.face;if(typeof oldFace!=='string')throw new Error('The authored parent is unavailable.');
    const excludedBodies=[centeredHoleIntentFromLid({featureId:String(args.featureId),lidFaceId:oldFace,diameter:1}).target.bodyId,face.root.id];prior.params.face=args.faceId;
    const nextCapture=await captureAuthoredHistory(captured.history,check);if((await captureAuthoredHistory(before.history,check)).signature!==captured.signature)throw superseded();
    const proposal=recordCenteredParentRepair(journal,{document,revision:journal.revision,index:args.index,featureId:args.featureId,before:oldFace,after:args.faceId});
    const nextState={history:nextCapture.history,pointer:nextCapture.history.length-1},scope:{epoch:number|null}={epoch:null};
    const preparation:PreparedSketchCommand={candidateScope:scope,requireCurrent:check,requireCommittedCurrent(){if(!valid()||!service.isDocumentCurrent(document))throw superseded(true);},async prepare(models){if((await captureAuthoredHistory(before.history,check)).signature!==captured.signature)throw superseded();check();manager.verifyParentRepairAssignments(lastComplete,models$.value,models,nextCapture.history,excludedBodies);check();return null;}};
    let settled=false;const stop=()=>{if(!settled&&scope.epoch!==null&&scope.epoch===evaluationEpoch)engineResources.cancelCandidates();};options.signal?.addEventListener('abort',stop,{once:true});
    const timer=setInterval(()=>{try{check()}catch{stop()}},100);
    try{check();if(pendingPipelines||pendingModifications)throw new Error('Another operation is still in progress.');await new Promise<void>((yes,no)=>{pendingModifications++;modificationCallbacks.set(nextState,{onAccepted:yes,onError:no,preparation,journalProposal:proposal,journalSignature:nextCapture.signature,parentRepairIndex:args.index});modifications$.next(nextState);});return Object.freeze({changed:true,index:args.index,featureId:args.featureId,faceId:args.faceId});}
    catch(error) {if(valid() && error?.name!=='AbortError' && Number.isSafeInteger(error?.evaluationIndex) && error.evaluationIndex>args.index)throw new Error(`Dependent feature at history index ${error.evaluationIndex} failed; review its references before repair.`);throw error;}
    finally{settled=true;clearInterval(timer);options.signal?.removeEventListener('abort',stop);}
  }
  async function travelCenteredParentRepair(input:any,target:any,rawOptions:any={}) {
    const options:any={};if(!rawOptions||typeof rawOptions!=='object'||Array.isArray(rawOptions)||Reflect.ownKeys(rawOptions).some(k=>typeof k!=='string'||!['signal','valid'].includes(k)))throw new Error('Invalid repair options.');
    for(const key of Reflect.ownKeys(rawOptions) as string[]){const d=Object.getOwnPropertyDescriptor(rawOptions,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))throw new Error('Invalid repair options.');options[key]=d.value;}
    if(options.valid!==undefined&&typeof options.valid!=='function')throw new Error('Invalid lifetime guard.');
    if(options.signal!==undefined)try{Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get.call(options.signal);}catch{throw new Error('Invalid cancellation signal.');}
    const service:any=ctx.projectService,document=service.documentGeneration,storage=ctx.storageService,manager:any=ctx.projectManager,namespace=service.sketchStorageNamespace;
    const before=modifications$.value,initialRevision=modifications$.revision,journal=authoredJournal$.value,sketch=sketchRevision(storage,namespace),material=manager.inspectMaterialSurfaceRevision();
    const services=()=>[ctx.projectService,ctx.storageService,ctx.craftService,ctx.cadRegistry,ctx.operationService,ctx.expressionService,ctx.projectManager,ctx.sketchStorageService,ctx.services.sketcher,ctx.wizardService,ctx.workbenchService,ctx.assemblyService];
    const streams=()=>[modifications$,models$,pipelineFailure$,engineCleanupFailure$,ctx.expressionService.script$,ctx.expressionService.list$,ctx.expressionService.errors$,ctx.streams.sketcher.sketchingFace,ctx.wizardService.workingRequest$,ctx.workbenchService.currentWorkbench$,ctx.assemblyService.constraints$];
    const ss=services(),tracked=streams(),versions=tracked.map(s=>s.revision),failure=pipelineFailure$.value;
    if(!service.hasHostLifetime||!service.isDocumentCurrent(document)||pendingPipelines||pendingModifications||engineCleanupFailure$.value||manager.isRestoring||manager.unit!=='millimeter'||ctx.services.sketcher.inPlaceEditor.inEditMode||ctx.wizardService.workingRequest$.value||before.pointer!==before.history.length-1||input.revision!==inspectAuthoredEdits().revision||journal.document!==document||sketch!==fullTipSketchRevision||material!==fullTipMaterialSurfaceRevision||(input.direction==='undo'&&failure)||(input.direction==='redo'&&failure&&failure.retainedFrom!=='repaired-revision'))throw new Error('The repair history is unavailable.');
    const valid=()=>{try{return (!options.valid||options.valid()===true)&&!options.signal?.aborted}catch{return false}};
    const check=()=>{if(!valid()||!service.isDocumentCurrent(document)||ctx.projectService!==service||ctx.storageService!==storage||ctx.projectManager!==manager||service.sketchStorageNamespace!==namespace||sketchRevision(storage,namespace)!==sketch||manager.inspectMaterialSurfaceRevision()!==material||services().some((x,i)=>x!==ss[i])||streams().some((x,i)=>x!==tracked[i]||x.revision!==versions[i])||modifications$.value!==before||modifications$.revision!==initialRevision||authoredJournal$.value!==journal)throw superseded();};
    check();const captured=await captureAuthoredHistory(before.history,check);if(captured.signature!==fullTipSignature)throw new Error('The authored history changed.');
    const request=captured.history[target.index];if(!request||request.type!=='WORKER_CENTERED_THROUGH_HOLE_V1'||Number(request.params?.featureId)!==target.featureId)throw new Error('The repaired hole is unavailable.');
    const plan=planCenteredParentRepairTravel(journal,{document,revision:journal.revision,direction:input.direction,index:target.index,featureId:target.featureId,currentFace:request.params.face});
    const excludedBodies=[request.params.face,plan.face].map(lidFaceId=>centeredHoleIntentFromLid({featureId:String(target.featureId),lidFaceId,diameter:1}).target.bodyId);request.params.face=plan.face;
    const next=await captureAuthoredHistory(captured.history,check);if((await captureAuthoredHistory(before.history,check)).signature!==captured.signature)throw superseded();
    const state={history:next.history,pointer:next.history.length-1},scope:{epoch:number|null}={epoch:null};
    const preparation:PreparedSketchCommand={candidateScope:scope,requireCurrent:check,requireCommittedCurrent(){if(!valid()||!service.isDocumentCurrent(document))throw superseded(true);},async prepare(models){if((await captureAuthoredHistory(before.history,check)).signature!==captured.signature)throw superseded();check();manager.verifyParentRepairAssignments(lastComplete,models$.value,models,next.history,excludedBodies);check();return null;}};
    let settled=false;const stop=()=>{if(!settled&&scope.epoch!==null&&scope.epoch===evaluationEpoch)engineResources.cancelCandidates();};options.signal?.addEventListener('abort',stop,{once:true});const timer=setInterval(()=>{try{check()}catch{stop()}},100);
    try{check();if(pendingPipelines||pendingModifications)throw new Error('Another operation is still in progress.');await new Promise<void>((yes,no)=>{pendingModifications++;modificationCallbacks.set(state,{onAccepted:yes,onError:no,preparation,journalProposal:plan.next,journalSignature:next.signature,...(input.direction==='undo'?{unresolvedRepairUndo:{index:target.index}}:{})});modifications$.next(state);});return Object.freeze({changed:true,index:target.index,featureId:target.featureId,faceId:plan.face,unresolved:!!pipelineFailure$.value});}
    finally{settled=true;clearInterval(timer);options.signal?.removeEventListener('abort',stop);}
  }
  // Private prepared workspace edit: evaluate the entire existing authored
  // tip using its candidate sketch view, then publish workspace and models in
  // the same existing batch. Never stage the bytes in live storage first.
  async function submitPreparedReplay(onAccepted, onError, preparation: PreparedSketchCommand, journalIntent?: any) {
    try {
      requireEngineCleanup();
      preparation.requireCurrent();
      if (pendingPipelines || pendingModifications) throw new Error('Another operation is still in progress.');
      const previous = modifications$.value;
      if (previous.pointer !== previous.history.length - 1) throw new Error('Return to the full model before editing.');
      const sourceEpoch=evaluationEpoch,sourceTip=fullTipSignature;
      const checkCapture=()=>{
        preparation.requireCurrent();
        if(pendingPipelines||pendingModifications||modifications$.value!==previous||evaluationEpoch!==sourceEpoch||fullTipSignature!==sourceTip)throw superseded();
      };
      // A shallow array copy still shares accepted operation records across
      // Worker awaits. Bind private replay input to the accepted authored tip.
      const captured=await captureAuthoredHistory(previous.history,checkCapture);
      checkCapture();
      const initialFrameAppend=journalIntent?.kind==='source-frame'&&journalIntent.beforeOperation===null&&!journalIntent.direction&&previous.history.length===0&&previous.pointer===-1&&models$.value.length===0&&sketchRevision(ctx.storageService,(ctx.projectService as any).sketchStorageNamespace)==='[]'&&authoredJournal$.value.entries.length===0;
      if((!sourceTip||captured.signature!==sourceTip)&&!initialFrameAppend)throw superseded();
      const nextState = {...previous, history:captured.history};
      let journalProposal, journalSignature, guardedPreparation=preparation,initialFrameJournal:any=null;
      if(journalIntent?.kind==='source-frame'){
        const {index,featureId,faceId,beforeOperation,afterOperation,sketches,direction}=journalIntent,service:any=ctx.projectService,storage=ctx.storageService,oldJournal=authoredJournal$.value,document=service.documentGeneration;
        const journal=initialFrameAppend&&oldJournal.document!==document?emptyAuthoredEditJournal(document,0):oldJournal;
        if(initialFrameAppend)initialFrameJournal=oldJournal;
        const before=captureSourceFrameJournalOperation(beforeOperation),after=captureSourceFrameJournalOperation(afterOperation);
        if(!Number.isSafeInteger(index)||index<0||index>255||!Number.isSafeInteger(featureId)||featureId<1||typeof faceId!=='string'||!faceId||faceId.length>256||journal.document!==document)throw Error('Invalid source-frame journal identity.');
        if(before===null){if(index!==captured.history.length||!after||after.type!=='SOURCE_FRAME_V1'||captured.history.some(entry=>Number(entry.params.featureId)===featureId))throw Error('Source creation is not a fresh append.');}
        else if(JSON.stringify(captureSourceFrameJournalOperation(captured.history[index]))!==JSON.stringify(before))throw superseded();
        if(after===null){const face=ctx.cadRegistry.findFace(faceId);if(!direction||before?.type!=='SOURCE_FRAME_V1'||index!==captured.history.length-1||!(face?.root instanceof MOpenFaceShell)||face.root.originatingOperation!==index||preparation.sketchRemovedIds?.length!==1||preparation.sketchRemovedIds[0]!==faceId)throw Error('Only the exact latest source creation can be undone.');}
        else{if(Number(after.params.featureId)!==featureId||before&&before.type!==after.type)throw Error('Source producer identity changed.');if(before?.type==='SOURCE_FRAME_V1'&&JSON.stringify(captureSourceFrameParameters(before.params).parent)!==JSON.stringify(captureSourceFrameParameters(after.params).parent)&&(!nativeSourceReplayRepair(preparation.nativeSourceReplay)||JSON.stringify(captureSourceFrameParameters(before.params).placement)!==JSON.stringify(captureSourceFrameParameters(after.params).placement)))throw Error('Source frame editing cannot reparent outside actual explicit repair.');if(before?.type==='PLANE'){const a=captureSourcePlaneParameters(before.params),b=captureSourcePlaneParameters(after.params);if(a.featureId!==b.featureId||a.orientation!==b.orientation||a.datum!==b.datum)throw Error('Principal source identity changed.');}}
        if(!Array.isArray(sketches)||sketches.length>64)throw Error('Invalid source delta.');for(const row of sketches){if(ctx.sketchStorageService.getSketchData(row.faceId)!==row.before)throw superseded();if(row.after===null){if(after!==null||row.faceId!==faceId)throw Error('Foreign source removal.');}else if(!isNativeSourceReplay(preparation.nativeSourceReplay)&&!preparation.sketchOverrides?.some(item=>item.id===row.faceId&&item.data===row.after))throw Error('Source override differs from journal.');}
        if(before===null&&!isNativeSourceReplay(preparation.nativeSourceReplay)&&!sketches.some(row=>row.faceId===faceId&&row.before===null&&typeof row.after==='string'))throw Error('Source creation needs its actual prepared empty source.');
        if(direction){const plan=planSourceFrameTravel(journal,{document,revision:journal.revision,direction,history:captured.history,readSketch:id=>ctx.sketchStorageService.getSketchData(id)});if(plan.index!==index||plan.featureId!==featureId||JSON.stringify(plan.afterOperation)!==JSON.stringify(after)||JSON.stringify(plan.sketches)!==JSON.stringify(sketches))throw Error('Source frame travel differs from its journal.');journalProposal=plan.next;}
        else journalProposal=recordSourceFrameEdit(journal,{document,revision:journal.revision,index,featureId,faceId,beforeOperation:before,afterOperation:after,sketches});
        if(after===null)captured.history.pop();else if(before===null)captured.history.push(after);else captured.history[index]=after;
        const nextCapture=await captureAuthoredHistory(captured.history,checkCapture);checkCapture();nextState.history=nextCapture.history;nextState.pointer=nextCapture.history.length-1;journalSignature=nextCapture.signature;
        guardedPreparation={...preparation,requireCurrent(){preparation.requireCurrent();if(authoredJournal$.value!==oldJournal||ctx.projectService!==service||ctx.storageService!==storage)throw superseded();},async prepare(models,history){const workspace=await preparation.prepare(models,history);try{if((await captureAuthoredHistory(history.history,()=>guardedPreparation.requireCurrent())).signature!==journalSignature)throw superseded();return workspace;}catch(error){workspace?.discard();throw error;}}};
      } else if (journalIntent?.kind==='legacy-expression-source') {
        const service:any=ctx.projectService,storage=ctx.storageService,journal=authoredJournal$.value,document=service.documentGeneration;
        const {beforeSource,afterSource,sketches,direction}=journalIntent;
        if(journalIntent.parameterKind!=='legacy-numeric-v1'||ctx.expressionService.isTyped||ctx.expressionService.script$.value!==beforeSource||preparation.expressionPublication?.facade?.isTyped!==false||preparation.expressionPublication.facade.script$.value!==afterSource||fullTipSketchRevision!==sketchRevision(storage,service.sketchStorageNamespace)||fullTipMaterialSurfaceRevision!==(ctx.projectManager as any).inspectMaterialSurfaceRevision()||journal.document!==document||!Array.isArray(sketches))throw Error('The legacy expression edit is stale.');
        for(const row of sketches)if(ctx.sketchStorageService.getSketchData(row.faceId)!==row.before||!preparation.sketchOverrides?.some(item=>item.id===row.faceId&&item.data===row.after))throw Error('The authored expression sketch changed.');
        if(direction){const plan=planPhysicalTravel(journal,{document,revision:journal.revision,direction,currentSource:beforeSource,history:captured.history,readSketch:(id:string)=>ctx.sketchStorageService.getSketchData(id)});if(plan.source!==afterSource||plan.changes.length||plan.sketches.length!==sketches.length||plan.sketches.some(row=>!sketches.some(item=>item.faceId===row.faceId&&item.after===row.data)))throw Error('The authored legacy expression travel changed.');journalProposal=plan.next;}
        else journalProposal=recordPhysicalTransaction(journal,{document,revision:journal.revision,beforeSource,afterSource,changes:[],sketches,parameterKind:'legacy-numeric-v1'});
        journalSignature=captured.signature;
      } else if (journalIntent?.kind==='source-plane-depth') {
        const {index,featureId,faceId,orientation,beforeDepth,afterDepth,before,after,direction}=journalIntent,service:any=ctx.projectService,storage=ctx.storageService,journal=authoredJournal$.value,document=service.documentGeneration,key=service.sketchStorageKey(faceId),version=storage.versionOf(key),stamp=sketchRevision(storage,service.sketchStorageNamespace),entry=captured.history[index];
        if(!Number.isSafeInteger(index)||index<0||index>=captured.history.length||entry?.type!=='PLANE'||!Number.isSafeInteger(featureId)||featureId<1||typeof faceId!=='string'||!faceId||faceId.length>256||!sourcePlaneDepth(beforeDepth)||!sourcePlaneDepth(afterDepth)||beforeDepth===afterDepth)throw Error('Invalid source-plane journal request.');
        const p=captureSourcePlaneParameters(entry.params),identity={index,featureId,faceId,orientation};
        if(Number(p.featureId)!==featureId||p.orientation!==orientation||p.depth!==beforeDepth||storage.get(key)!==before||version===null||preparation.sketchOverrides?.length!==1||preparation.sketchOverrides[0].id!==faceId||preparation.sketchOverrides[0].data!==after||preparation.sketchSourceFrames?.length!==1||preparation.sketchSourceFrames[0].id!==faceId||fullTipSketchRevision!==stamp||fullTipMaterialSurfaceRevision!==(ctx.projectManager as any).inspectMaterialSurfaceRevision()||journal.document!==document)throw Error('The source-plane journal binding is stale.');
        if(direction){const plan=planSourcePlaneDepthTravel(journal,{document,revision:journal.revision,direction,identity,currentDepth:beforeDepth,currentSketch:before});if(plan.depth!==afterDepth||plan.sketch!==after)throw Error('The source-plane travel changed.');journalProposal=plan.next;}
        else journalProposal=recordSourcePlaneDepthEdit(journal,{document,revision:journal.revision,identity,beforeDepth,afterDepth,before,after});
        entry.params.depth=afterDepth;const nextCapture=await captureAuthoredHistory(captured.history,checkCapture);checkCapture();nextState.history=nextCapture.history;journalSignature=nextCapture.signature;
        guardedPreparation={...preparation,requireCurrent(){preparation.requireCurrent();if(ctx.projectService!==service||ctx.storageService!==storage||!service.isDocumentCurrent(document)||authoredJournal$.value!==journal||storage.versionOf(key)!==version||storage.get(key)!==before||sketchRevision(storage,service.sketchStorageNamespace)!==stamp)throw superseded();},async prepare(models,history){const workspace=await preparation.prepare(models,history);try{if((await captureAuthoredHistory(history.history,()=>guardedPreparation.requireCurrent())).signature!==journalSignature)throw superseded();return workspace;}catch(error){workspace?.discard();throw error;}}};
      } else if (journalIntent?.kind==='selected-profile-source-dimension') {
        const {kind,direction,...raw}=journalIntent,edit:any=captureSelectedProfileSourceDimensionEdit(raw);
        const {index,featureId,parameters,before,after,regionId,dimension}=edit,faceId=parameters.faceId,
          service:any=ctx.projectService,storage=ctx.storageService,journal=authoredJournal$.value,
          document=service.documentGeneration,key=service.sketchStorageKey(faceId),version=storage.versionOf(key),
          stamp=sketchRevision(storage,service.sketchStorageNamespace),entry=captured.history[index];
        if(entry?.type!=='WORKER_SELECTED_PROFILE_EXTRUDE_V2')throw Error('The combined source feature is unavailable.');
        const actual:any=captureSelectedProfileDepthParameters(entry.params);
        if(Object.keys(parameters).some(k=>actual[k]!==parameters[k])||actual.featureId!==featureId||storage.get(key)!==before||version===null||
          preparation.sketchOverrides?.length!==1||preparation.sketchOverrides[0].id!==faceId||preparation.sketchOverrides[0].data!==after||
          preparation.sketchSourceFrames?.length!==1||preparation.sketchSourceFrames[0].id!==faceId||
          fullTipSketchRevision!==stamp||fullTipMaterialSurfaceRevision!==(ctx.projectManager as any).inspectMaterialSurfaceRevision()||journal.document!==document)
          throw Error('The combined source/region binding is stale.');
        if(direction){
          const plan=planSelectedProfileSourceDimensionTravel(journal,{document,revision:journal.revision,direction,index,featureId,parameters:actual,currentSketch:before});
          if(plan.before!==before||plan.after!==after||plan.regionId!==regionId||plan.dimension.constraintId!==dimension.constraintId||plan.dimension.value!==dimension.value)
            throw Error('The combined source/region travel changed.');
          journalProposal=plan.next;
        }else journalProposal=recordSelectedProfileSourceDimensionEdit(journal,{document,revision:journal.revision,...edit});
        // Only the detached feature's region changes. Source bytes stay private
        // until the same existing workspace/model/journal publication batch.
        entry.params.regionId=regionId;
        const nextCapture=await captureAuthoredHistory(captured.history,checkCapture);checkCapture();
        nextState.history=nextCapture.history;journalSignature=nextCapture.signature;
        guardedPreparation={...preparation,requireCurrent(){
          preparation.requireCurrent();
          if(ctx.projectService!==service||ctx.storageService!==storage||!service.isDocumentCurrent(document)||authoredJournal$.value!==journal||
            storage.versionOf(key)!==version||storage.get(key)!==before||sketchRevision(storage,service.sketchStorageNamespace)!==stamp)throw superseded();
        },async prepare(models,history){
          const workspace=await preparation.prepare(models,history);
          try{if((await captureAuthoredHistory(history.history,()=>guardedPreparation.requireCurrent())).signature!==journalSignature)throw superseded();return workspace;}
          catch(error){workspace?.discard();throw error;}
        }};
      } else if (journalIntent) {
        const {faceId,before,after}=journalIntent, service:any=ctx.projectService, storage=ctx.storageService;
        const document=service.documentGeneration, journal=authoredJournal$.value, key=service.sketchStorageKey(faceId);
        const version=storage.versionOf(key), sketchVersions=sketchRevision(storage,service.sketchStorageNamespace);
        if (!['sketch-bytes','sketch-travel'].includes(journalIntent.kind) || storage.get(key)!==before || version===null || preparation.sketchOverrides?.length!==1 || preparation.sketchOverrides[0].id!==faceId || preparation.sketchOverrides[0].data!==after ||
            fullTipSketchRevision!==sketchVersions || fullTipMaterialSurfaceRevision!==(ctx.projectManager as any).inspectMaterialSurfaceRevision() ||
            !fullTipSignature || journal.document!==document) throw new Error('The authored sketch is stale.');
        if(journalIntent.kind==='sketch-travel') {
          const plan=planSketchTravel(journal,{document,revision:journal.revision,direction:journalIntent.direction,faceId,currentBytes:before});
          if(plan.bytes!==after)throw new Error('The authored sketch travel is stale.');
          journalProposal=plan.next;
        } else journalProposal=recordSketchEdit(journal,{document,revision:journal.revision,faceId,before,after});
        journalSignature=fullTipSignature;
        guardedPreparation={...preparation,requireCurrent() {
          preparation.requireCurrent();
          if(ctx.projectService!==service || ctx.storageService!==storage || !service.isDocumentCurrent(document) ||
             authoredJournal$.value!==journal || storage.versionOf(key)!==version || storage.get(key)!==before ||
             sketchRevision(storage,service.sketchStorageNamespace)!==sketchVersions) throw superseded();
        },async prepare(models,history) {
          const workspace=await preparation.prepare(models,history);
          try {
            if((await captureAuthoredHistory(history.history,()=>guardedPreparation.requireCurrent())).signature!==journalSignature)throw superseded();
            return workspace;
          } catch (error) {workspace?.discard();throw error;}
        }};
      }
      pendingModifications++;
      modificationCallbacks.set(nextState,{onAccepted,onError,preparation:guardedPreparation,journalProposal,journalSignature,...(initialFrameJournal?{initialOperationAppendJournal:initialFrameJournal}:{})});
      modifications$.next(nextState);
    } catch (error) { Promise.resolve().then(() => onError(error)); }
  }

  // Reference-bound inner UI seam. Modern navigation delegates the SAME
  // registered history operation; it cannot become a raw pointer fallback.
  async function navigateHistoryPosition(history:OperationRequest[],after:OperationRequest|null,options:any={}):Promise<any>{
    const fail=(code:string,message:string):never=>{throw Object.assign(Error(message),{code});};
    if(!options||typeof options!=='object'||Array.isArray(options)||Reflect.ownKeys(options).some(key=>typeof key!=='string'||!['signal','valid'].includes(key)||!Object.getOwnPropertyDescriptor(options,key)?.enumerable||!Object.hasOwn(Object.getOwnPropertyDescriptor(options,key),'value'))||options.valid!==undefined&&typeof options.valid!=='function')fail('INVALID_REQUEST','Invalid history navigation lifetime.');
    if(options.signal!==undefined)try{HISTORY_SIGNAL_ABORTED(options.signal);}catch{fail('INVALID_REQUEST','Use a genuine cancellation signal.');}
    if(!Array.isArray(history))fail('INVALID_REQUEST','Use the actual rendered history.');
    const craft=ctx.craftService,project:any=ctx.projectService,manager:any=ctx.projectManager,document=project.documentGeneration,signal=project.documentSignal,
      previous=modifications$.value,journal=authoredJournal$.value,index=after===null?-1:history.indexOf(after);
    const alive=()=>{try{if(options.valid&&options.valid()!==true)return false;return ctx.craftService===craft&&ctx.projectService===project&&ctx.projectManager===manager&&project.hasHostLifetime&&
      project.documentGeneration===document&&project.documentSignal===signal&&!HISTORY_SIGNAL_ABORTED(signal)&&project.isDocumentCurrent(document)&&
      (options.signal===undefined||!HISTORY_SIGNAL_ABORTED(options.signal));}catch{return false;}};
    if(!alive())throw superseded();
    if(history!==previous.history||after!==null&&index<0)fail('STALE_HISTORY','Choose an entry from the current rendered history.');
    if(!ownedPipelineHistories.has(history))fail('UNAVAILABLE','The accepted owned history is unavailable.');
    if(!isUnjournaledLegacyHistory(history,journal,ctx.operationService)){
      const inspection=(craft as any).inspectWorkerHistoryControls();
      if(!alive()||modifications$.value!==previous||authoredJournal$.value!==journal)throw superseded();
      return (craft as any).setWorkerHistoryPrefix({revision:inspection.revision,afterFeatureId:after===null?null:canonicalAuthoredFeatureId(after.params.featureId)},options);
    }
    // Explicit legacy empty-J exception uses normal atomic candidate replay,
    // not the raw historyTravel mutator. It makes no authored Undo claim.
    const storage=ctx.storageService,namespace=project.sketchStorageNamespace,stamp=sketchRevision(storage,namespace),models=models$.value,
      epoch=evaluationEpoch,material=manager.inspectMaterialSurfaceRevision(),presentation=manager.getPresentationMetadata(),drawing=manager.getLinkedPartDrawingDefinition(),
      operations=ctx.operationService,expressions:any=ctx.expressionService,wizard=ctx.wizardService,admission=wizard.hasActiveOperation,
      registry=ctx.cadRegistry,sketches=ctx.sketchStorageService,counter=project.counterGenerator,counters=counter.projectCounters,highWater=counters.featureId,
      currentStreams=()=>[craft.modifications$,craft.models$,craft.pipelineFailure$,craft.engineCleanupFailure$,expressions.script$,expressions.list$,expressions.errors$,expressions.table$,ctx.streams.sketcher.sketchingFace,wizard.workingRequest$,ctx.workbenchService.currentWorkbench$,ctx.assemblyService.constraints$],
      streams=currentStreams(),versions=streams.map(stream=>stream.revision),scope:{epoch:number|null}={epoch:null};
    const current=()=>{
      if(!alive()||ctx.storageService!==storage||ctx.operationService!==operations||ctx.expressionService!==expressions||ctx.wizardService!==wizard||
          ctx.cadRegistry!==registry||ctx.sketchStorageService!==sketches||craft.modifications$!==modifications$||craft.models$!==models$||
          project.counterGenerator!==counter||counter.projectCounters!==counters||counters.featureId!==highWater||
          manager.isRestoring||pendingPipelines&&scope.epoch===null||pendingModifications&&scope.epoch===null||pipelineFailure$.value||engineCleanupFailure$.value||
          manager.unit!=='millimeter'||typeof admission!=='function'||wizard.hasActiveOperation!==admission||admission.call(wizard)!==false||ctx.services.sketcher.inPlaceEditor.inEditMode||
          modifications$.value!==previous||models$.value!==models||authoredJournal$.value!==journal||journal.document!==document||
          project.sketchStorageNamespace!==namespace||sketchRevision(storage,namespace)!==stamp||manager.inspectMaterialSurfaceRevision()!==material||
          manager.getPresentationMetadata()!==presentation||manager.getLinkedPartDrawingDefinition()!==drawing||
          evaluationEpoch!==(scope.epoch===null?epoch:scope.epoch)||currentStreams().some((stream,i)=>stream!==streams[i]||stream.revision!==versions[i])||
          !isUnjournaledLegacyHistory(history,journal,operations))throw superseded();
    };
    if(craft.isProcessing||manager.isRestoring||pipelineFailure$.value||engineCleanupFailure$.value||typeof admission!=='function'||admission.call(wizard)!==false||ctx.services.sketcher.inPlaceEditor.inEditMode||ctx.assemblyService.constraints$.value.length||ctx.surfacingService?.scene?.surfaces.length)fail('UNAVAILABLE','Finish the active document operation before navigating history.');
    current();if(index===previous.pointer)return Object.freeze({changed:false,pointer:index,authoredUndo:false,kind:'legacy-position'});
    const state={history,pointer:index,hints:{noWizardFocus:true}},preparation:PreparedSketchCommand={candidateScope:scope,requireCurrent:current,
      requireCommittedCurrent(){if(!alive())throw superseded(true);},async prepare(_models,next){current();if(next.pointer!==index||next.history!==history)throw superseded();return null;}};
    let settled=false,committed=false,poll:any;const signals=[signal,options.signal].filter(Boolean),added:any[]=[],stop=()=>{if(!settled&&scope.epoch!==null&&scope.epoch===evaluationEpoch)engineResources.cancelCandidates();};
    try{
      for(const item of signals){HISTORY_LISTEN(item,'abort',stop,{once:true});added.push(item);if(HISTORY_SIGNAL_ABORTED(item))throw superseded();}
      poll=setInterval(()=>{try{current();}catch{stop();}},100);current();
      await new Promise<void>((resolve,reject)=>{pendingModifications++;modificationCallbacks.set(state,{onAccepted:resolve,onError:reject,preparation});modifications$.next(state);});committed=true;
      if(!alive())throw superseded(true);
      return Object.freeze({changed:true,pointer:index,authoredUndo:false,kind:'legacy-position',persistence:'volatile-workspace'});
    }catch(error){if(committed&&!error?.committed)throw Object.assign(Error('History navigation committed; its receipt is unavailable.'),{committed:true,cause:error});throw error;}
    finally{settled=true;clearInterval(poll);for(const item of added)HISTORY_UNLISTEN(item,'abort',stop);}
  }

  // UI-only discard of an actual privately issued review draft. This does not
  // travel history, evaluate geometry, publish a model or append a journal row.
  function cancelHistoryReviewDraft(capture: HistoryReviewCancelCapture): void {
    const origin=readHistoryReviewCancel(capture,ctx),craft=ctx.craftService,project:any=ctx.projectService,
      manager:any=ctx.projectManager,storage=ctx.storageService,expressions:any=ctx.expressionService,registry=ctx.cadRegistry,
      registryModels=registry.models,registryShells=registry.shells,
      history=modifications$.value,journal=authoredJournal$.value,models=models$.value,document=project.documentGeneration,
      signal=project.documentSignal,namespace=project.sketchStorageNamespace,epoch=evaluationEpoch,
      signature=fullTipSignature,head=journalHeadDefinition,headSignature=journalHeadSignature,
      journalVersion=authoredJournal$.revision,sketch=sketchRevision(storage,namespace),material=manager.inspectMaterialSurfaceRevision(),
      documentRevision=manager.inspectDocumentRevision(),presentation=manager.getPresentationMetadata(),drawing=manager.getLinkedPartDrawingDefinition(),
      wizard=ctx.wizardService,request=wizard.workingRequest$.value,
      wizardVersion=wizard.workingRequest$.revision,wizardState=wizard.state$.value,wizardStateVersion=wizard.state$.revision,
      counter=project.counterGenerator,counters=counter.projectCounters,highWater=counters.featureId,
      travel=craft.historyTravel,end=travel.end;
    const refusal=(code='STALE_HISTORY',message='The accepted history review changed. Reopen its preview before cancelling.')=>Object.assign(new Error(message),{code,userMessage:message});
    const services=()=>[ctx.craftService,ctx.projectService,ctx.projectManager,ctx.storageService,ctx.cadRegistry,ctx.expressionService,
      ctx.sketchStorageService,ctx.operationService,ctx.services.storage,ctx.services.sketcher,ctx.wizardService,ctx.workbenchService,ctx.assemblyService,ctx.surfacingService],
      savedServices=services(),streams=()=>[modifications$,models$,pipelineFailure$,engineCleanupFailure$,expressions.script$,expressions.list$,expressions.errors$,expressions.table$,
      ctx.streams.sketcher.sketchingFace,ctx.workbenchService.currentWorkbench$,ctx.assemblyService.constraints$,...(ctx.surfacingService?[ctx.surfacingService.state$]:[])],
      savedStreams=streams(),versions=savedStreams.map(stream=>stream.revision),values=savedStreams.map(stream=>stream.value);
    const requireAccepted=()=>{
      if(services().some((service,index)=>service!==savedServices[index])||ctx.craftService!==origin.craft||craft.modifications$!==modifications$||
          craft.models$!==models$||craft.pipelineFailure$!==pipelineFailure$||craft.engineCleanupFailure$!==engineCleanupFailure$||
          registry.isEvaluating!==false||registryModels!==models||registry.models!==registryModels||registry.shells!==registryShells||
          ctx.projectService!==origin.project||document!==origin.generation||signal!==origin.signal||project.documentSignal!==signal||HISTORY_SIGNAL_ABORTED(signal)||
          !project.hasHostLifetime||!project.isDocumentCurrent(document)||manager.unit!=='millimeter'||manager.isRestoring||
          modifications$.value!==history||history!==origin.state||history.history!==origin.history||history.pointer!==origin.pointer||
          authoredJournal$.value!==journal||authoredJournal$.revision!==journalVersion||journal.document!==document||
          models$.value!==models||evaluationEpoch!==epoch||pendingPipelines||pendingModifications||pipelineFailure$.value||engineCleanupFailure$.value||
          fullTipSignature!==signature||journalHeadDefinition!==head||journalHeadSignature!==headSignature||
          project.sketchStorageNamespace!==namespace||sketchRevision(storage,namespace)!==sketch||manager.inspectMaterialSurfaceRevision()!==material||
          manager.getPresentationMetadata()!==presentation||manager.getLinkedPartDrawingDefinition()!==drawing||
          project.counterGenerator!==counter||counter.projectCounters!==counters||counters.featureId!==highWater||
          craft.historyTravel!==travel||travel.end!==end||streams().some((stream,index)=>stream!==savedStreams[index]||stream.revision!==versions[index]||stream.value!==values[index]))throw refusal();
    };
    const requireDraft=()=>{
      requireAccepted();
      if(manager.inspectDocumentRevision()!==documentRevision||readHistoryReviewCancel(capture,ctx)!==origin||wizard.workingRequest$.value!==request||wizard.workingRequest$.revision!==wizardVersion||
          wizard.state$.value!==wizardState||wizard.state$.revision!==wizardStateVersion||ctx.services.sketcher.inPlaceEditor.inEditMode)throw refusal();
    };
    requireDraft();
    const applied=journal.cursor>0?journal.entries[journal.cursor-1]:null,nextSource=journal.entries[journal.cursor],
      retainedSourceBefore=journal.cursor===0&&nextSource?.kind==='source-frame'&&!!nextSource.reviewPosition&&nextSource.beforeOperation?.type==='PLANE'&&nextSource.afterOperation?.type==='PLANE'&&nextSource.index===history.pointer+1,
      modern=history.history.some(entry=>AUTHORED_SOLID_KINDS.includes(entry.type))||HISTORY_CONTROL_KINDS.includes(applied?.kind)||retainedSourceBefore;
    if(!modern){
      // Positive fixed historical vocabulary, not "any registered non-Worker".
      // A shared-journal entry (including a Redo tail) is never a legacy lease:
      // its domain needs its own authored travel, even for PLANE-only history.
      if(!isUnjournaledLegacyHistory(history.history,journal,ctx.operationService))throw refusal('UNAVAILABLE','Only an explicitly supported legacy history without shared journal entries may return directly to its tip.');
      requireDraft();end.call(travel);return;
    }
    // All these anchors already belong to the accepted pipeline/journal. No
    // full-tip-only capture, caller flag, new synchronized state or new hash.
    const noFocus=history.hints&&Object.getOwnPropertyDescriptor(history.hints,'noWizardFocus');
    if(!noFocus?.enumerable||!Object.hasOwn(noFocus,'value')||noFocus.value!==true||Reflect.ownKeys(history.hints).length!==1||
        !ownedPipelineHistories.has(history.history)||head!==history.history||!signature||headSignature!==signature||
        fullTipSketchRevision!==sketch||fullTipMaterialSurfaceRevision!==material||history.pointer< -1||history.pointer>=history.history.length-1||
        !retainedSourceBefore&&(applied?.kind!=='history-position'||applied.afterPointer!==history.pointer||applied.beforeSignature!==signature||applied.afterSignature!==signature))
      throw refusal();
    try{
      if(history.history.some(entry=>entry.type==='SOURCE_FRAME_V1')||retainedSourceBefore){
        // Only this explicitly supported new source family uses its own
        // accepted-custody validator. Invalid form params are never parsed.
        principalPlaneCommands.validateSourceFrameReview(capture);
      }else{
      const rows=validateControlledHistory(history.history);assertActiveHistoryDependencies(rows);
      const build=genericHistoryBuild(history.history);
      if(!build||build.id!=='occ'||build.selectedProfileVersion!==3||requireAvailableSelectedProfileBuild(build.id,build.revision)!==build)
        throw refusal();
      for(const row of rows){const operation=ctx.operationService.get(row.type);
        if(typeof operation?.run!=='function'||row.type==='PLANE'&&(operation.run!==standardPlaneOperation.run||!!operation.admitGeometry))throw refusal();}
      }
      if(expressions.isTyped||expressions.script$.value.trim()||Reflect.ownKeys(expressions.table$.value||{}).length||expressions.errors$.value.length||
          ctx.assemblyService.getConstraints().length||ctx.surfacingService?.scene?.surfaces.length)throw refusal();
      const workbench=ctx.workbenchService.currentWorkbench$.value;
      if(workbench&&!workbench.internal&&workbench.workbenchId!==ctx.workbenchService.defaultWorkbenchId)throw refusal();
    }catch{throw refusal('UNAVAILABLE','The current draft is not an authenticated supported modern history review.');}
    requireDraft();
    discardHistoryReviewDraft(capture,ctx);
    // Stream listeners may replace the document, start a new operation or make
    // a newer edit. Observe loss only: never roll it back or report into it.
    // PM's document revision includes the wizard stream, so its pre-reset token
    // is checked by requireDraft, not mistaken for accepted-state loss here.
    requireAccepted();
  }

  // Private manager/Craft seam. A metadata proposal authenticates against the
  // actual accepted tip; no geometry evaluation or copied history is needed.
  function captureManufacturingEditContext() {
    inspectAuthoredEdits();
    const project:any=ctx.projectService,manager:any=ctx.projectManager,document=project.documentGeneration,
      history=modifications$.value,journal=authoredJournal$.value,models=models$.value,
      storage=ctx.storageService,namespace=project.sketchStorageNamespace,
      sketch=sketchRevision(storage,namespace),material=manager.inspectMaterialSurfaceRevision(),
      signature=fullTipSignature,definition=journalHeadDefinition,headSignature=journalHeadSignature,
      epoch=evaluationEpoch,registry=ctx.cadRegistry,journalVersion=authoredJournal$.revision,expressions:any=ctx.expressionService,
      expressionStreams=[expressions.script$,expressions.list$,expressions.errors$,expressions.table$].filter(Boolean),expressionVersions=expressionStreams.map(s=>s.revision),expressionValues=expressionStreams.map(s=>s.value);
    const sameExpressions=()=>{const now=[expressions.script$,expressions.list$,expressions.errors$,expressions.table$].filter(Boolean);return ctx.expressionService===expressions&&now.length===expressionStreams.length&&now.every((s,i)=>s===expressionStreams[i]&&s.revision===expressionVersions[i]&&s.value===expressionValues[i]);};
    const sameGeometry=()=>ctx.projectService===project&&project.hasHostLifetime&&project.isDocumentCurrent(document)&&ctx.projectManager===manager&&manager.unit==='millimeter'&&ctx.storageService===storage&&project.sketchStorageNamespace===namespace&&ctx.cadRegistry===registry&&sameExpressions()&&modifications$.value===history&&models$.value===models&&evaluationEpoch===epoch&&!pendingPipelines&&!pendingModifications&&!pipelineFailure$.value&&!engineCleanupFailure$.value&&history.pointer===history.history.length-1&&fullTipSignature===signature&&journalHeadDefinition===definition&&journalHeadSignature===headSignature&&fullTipSketchRevision===sketch&&sketchRevision(storage,namespace)===sketch;
    const check=()=>{
      if(!signature||definition!==history.history||journal.document!==document||!sameGeometry()||authoredJournal$.value!==journal||authoredJournal$.revision!==journalVersion||fullTipMaterialSurfaceRevision!==material||manager.inspectMaterialSurfaceRevision()!==material)throw superseded();
    };
    check();return Object.freeze({document,journal,material,sameGeometry,check});
  }
  function commitManufacturingMetadata(ticket:any) {
    const manager:any=ctx.projectManager,p=manager.readManufacturingPublication(ticket),context=p.context;
    context.check();p.requireCurrent();context.check();
    if(!p.unchanged())throw superseded();
    if(!p.changed)return p.receipt;
    let next:any;
    if(p.direction)next=planPreparedDocumentMetadataTravel(context.journal,{document:context.document,revision:context.journal.revision,direction:p.direction,current:p.before,preparation:p.preparation}).next;
    else next=recordPreparedDocumentMetadataEdit(context.journal,{document:context.document,revision:context.journal.revision,preparation:p.preparation});
    const publication=prepareStateBatch([{stream:authoredJournal$,value:next}]);
    // All potentially allocating/fallible preparation precedes first write.
    const receipt=Object.freeze({...p.receipt,authoredRevision:`${next.document}:${next.revision}:${p.documentRevision}`});
    p.requireCurrent();context.check();
    if(ctx.projectManager!==manager||!p.unchanged()||!publication.isCurrent())throw superseded();
    const current=()=>ctx.projectManager===manager&&context.sameGeometry()&&authoredJournal$.value===next&&fullTipMaterialSurfaceRevision===p.materialRevision&&p.isInstalled();
    let committed=false;
    try{
      publication.commit();p.install();fullTipMaterialSurfaceRevision=p.materialRevision;committed=true;
      // A/J/T are installed; no observer or caller callback occurred between.
      publication.notify(current);
      if(!current())throw superseded(true);
      (update$ as any).nextGuarded(undefined,current);
      if(!current())throw superseded(true);
      (ctx.projectService as any).scheduleSave();
      if(!current())throw superseded(true);
      return receipt;
    }catch(cause){if(!committed)throw cause;throw Object.assign(Error('Document metadata committed, but notification or lifetime failed.'),{code:'METADATA_PUBLICATION_FAILED',committed:true,cause});}
  }

  async function submitHistoryControl(input:any){
    const {job,captured,plan,options}=input;
    job.current();
    if(captured.signature!==job.context.signature)throw Object.assign(Error('The authenticated authored definition changed.'),{code:'STALE_HISTORY'});
    const next=await captureAuthoredHistory(plan.history,job.current);job.current();
    const rows=validateControlledHistory(next.history,job.sourceParents);assertActiveHistoryDependencies(rows);
    if(plan.kind!=='history-position')assertProtectedHistoryOutputs(job.rows,next.history,job.protectedRefs);
    const budget=selectedProfileHistoryBudget(next.history,job.build.revision);
    if(!budget.withinLimit)throw Object.assign(Error('The candidate history exceeds its recorded native budget.'),{code:budget.reason||'RESOURCE_LIMIT'});
    const currentJournal=authoredJournal$.value;
    let proposal:any;
    if(input.travel){
      if(input.travel.signature!==next.signature||input.travel.pointer!==plan.pointer)throw Error('History travel changed the requested definition or position.');
      proposal=input.travel.next;
    }else proposal=recordHistoryControl(currentJournal,{document:job.project.documentGeneration,revision:currentJournal.revision,kind:plan.kind,
      beforeSignature:captured.signature,afterSignature:next.signature,beforePointer:job.state.pointer,afterPointer:plan.pointer,...plan.delta});
    const state={history:next.history,pointer:plan.pointer,hints:{noWizardFocus:true}};
    const preparation:PreparedSketchCommand={candidateScope:job.scope,requireCurrent:job.current,
      requireCommittedCurrent(){if(!job.alive())throw superseded(true);},
      async prepare(models,history){
        job.current();if((await captureAuthoredHistory(history.history,job.current)).signature!==next.signature||history.pointer!==plan.pointer)throw superseded();
        if(history.pointer===history.history.length-1&&plan.kind!=='history-position')job.requireProtected(models,history.history);
        job.current();return null;
      }};
    job.current();
    if(pendingPipelines||pendingModifications)throw Object.assign(Error('Another model operation is pending.'),{code:'BUSY'});
    const stop=()=>{if(job.scope.epoch!==null&&job.scope.epoch===evaluationEpoch)engineResources.cancelCandidates();};
    const added:AbortSignal[]=[];let poll:any;
    try{
      for(const signal of job.signals){if(HISTORY_SIGNAL_ABORTED(signal))throw superseded();HISTORY_LISTEN(signal,'abort',stop,{once:true});added.push(signal);}
      poll=setInterval(()=>{try{job.current();}catch{stop();}},100);
      await new Promise<void>((resolve,reject)=>{pendingModifications++;modificationCallbacks.set(state,{onAccepted:resolve,onError:reject,preparation,journalProposal:proposal,journalSignature:next.signature,historyControl:true,historyControlAnchors:{sketch:job.sourceStamp,material:job.materialRevision}});modifications$.next(state);});
    }catch(error){
      if(error&&typeof error==='object'&&Object.isExtensible(error)&&plan.delta?.featureId!==undefined)Object.defineProperty(error,'requestedFeatureId',{value:plan.delta.featureId,enumerable:true,configurable:true});
      throw error;
    }finally{clearInterval(poll);for(const signal of added)HISTORY_UNLISTEN(signal,'abort',stop);}
    try{
      preparation.requireCommittedCurrent();
      return Object.freeze({changed:true,revision:inspectAuthoredEdits().revision,pointer:plan.pointer,afterFeatureId:plan.pointer<0?null:Number(next.history[plan.pointer].params.featureId),
        ...(plan.kind==='feature-suppression'?{featureId:plan.delta.featureId,index:plan.delta.index,suppressed:plan.delta.afterSuppressed}:{}),kind:plan.kind,persistence:'volatile-workspace'});
    }catch(cause){throw Object.assign(Error('History control committed, but its receipt or lifetime is unavailable.'),{code:'HISTORY_PUBLICATION_FAILED',committed:true,cause});}
  }

  // A principal placement is one authored event, including its before-prefix
  // and after-tip positions. Its private proof never publishes a temporary tip.
  async function submitPrincipalPlacement(input:any){
    const {job,nextCapture,pointer,request,graph,permit,proof,travel,reviewPosition}=input;
    job.current();if(job.journal!==authoredJournal$.value||job.state!==modifications$.value||job.context.signature!==fullTipSignature||
      journalHeadDefinition!==job.history||!Number.isSafeInteger(pointer)||pointer< -1||pointer>=nextCapture.history.length)throw superseded();
    const before=await captureAuthoredHistory(job.history,job.current);job.current();
    if(before.signature!==job.context.signature)throw superseded();
    let proposal:any,complete:any=null,changes:any[]=[],frames:any[]=[];
    if(input.positionOnly){
      if(before.signature!==nextCapture.signature)throw Error('A position-only Apply cannot change the authored definition.');
      if(input.positionTravel){
        const plan=planHistoryControlTravel(job.journal,{document:job.generation,revision:job.journal.revision,direction:input.positionTravel.next.cursor<job.journal.cursor?'undo':'redo',currentSignature:before.signature,currentPointer:job.state.pointer});
        if(plan.entry.kind!=='history-position'||plan.pointer!==pointer||plan.signature!==nextCapture.signature||plan.next.cursor!==input.positionTravel.next.cursor)throw superseded();
        proposal=plan.next;
      }else proposal=recordHistoryControl(job.journal,{document:job.generation,revision:job.journal.revision,kind:'history-position',beforeSignature:before.signature,afterSignature:nextCapture.signature,beforePointer:job.state.pointer,afterPointer:pointer});
    }else{
      if(!request||job.history[request.index]!==input.beforeOperation||request.featureId!==canonicalAuthoredFeatureId(input.beforeOperation.params.featureId))throw superseded();
      const expected=[...before.history];expected[request.index]=input.afterOperation;
      await assertPipelineHistoryCurrent(nextCapture.history,expected,job.current);job.current();
      if(reviewPosition&&!travel&&(reviewPosition.beforeSignature!==before.signature||reviewPosition.afterSignature!==nextCapture.signature))throw Error('The principal review signatures changed.');
      if(travel){
        const direction=travel.direction,plan=planSourceFrameTravel(job.journal,{document:job.generation,revision:job.journal.revision,direction,history:before.history,readSketch:id=>job.sketches.getSketchData(id),currentSignature:before.signature,currentPointer:job.state.pointer});
        if(plan.index!==request.index||plan.featureId!==request.featureId||plan.pointer!==pointer||JSON.stringify(plan.afterOperation)!==JSON.stringify(input.afterOperation)||plan.signature&&plan.signature!==nextCapture.signature)throw superseded();
        proposal=plan.next;
      }else proposal=recordSourceFrameEdit(job.journal,{document:job.generation,revision:job.journal.revision,index:request.index,featureId:request.featureId,faceId:request.faceId,beforeOperation:input.beforeOperation,afterOperation:input.afterOperation,sketches:graph.changes,reviewPosition});
      if(proof){
        if(permit||pointer===nextCapture.history.length-1)throw Error('A prefix proof cannot supply a published full-tip owner.');
        complete=readPrincipalSourceProof(proof,ctx);await assertPipelineHistoryCurrent(complete.history,nextCapture.history,job.current);job.current();
        changes=complete.changes;frames=complete.rows;
        for(const row of graph.frames){const actual=frames.find(r=>r.id===row.id);if(!actual||!sameSketchSaveFrame(actual.frame,row.frame))throw Error('The full source proof differs from its independently prepared frame.');}
        if(!travel||changes.length!==travel.sketches.length||changes.some(row=>!travel.sketches.some(v=>v.faceId===row.faceId&&v.before===row.before&&v.after===row.after)))throw Error('The complete restored source proof differs from its journal.');
      }else{if(!permit||pointer!==nextCapture.history.length-1)throw Error('A changed final tip requires its own fresh native source owner.');changes=graph.changes;frames=graph.frames;}
    }
    for(const row of changes)if(!job.sources.has(row.faceId)||job.sources.get(row.faceId)!==row.before||typeof row.after!=='string')throw Error('Principal source publication lost its captured original bytes.');
    const state={history:nextCapture.history,pointer,hints:{noWizardFocus:true}},scope=job.scope;
    const preparation:PreparedSketchCommand={candidateScope:scope,nativeSourceReplay:permit,
      sketchOverrides:changes.map(row=>({id:row.faceId,data:row.after})),requireCurrent:job.current,
      requireCommittedCurrent(){if(!job.alive())throw superseded(true);},
      async prepare(models,actual){
        job.current();await assertPipelineHistoryCurrent(actual.history,nextCapture.history,job.current);job.current();if(actual.pointer!==pointer)throw superseded();
        for(const row of frames){if(row.index>pointer)continue;const matches=models.flatMap((model:any)=>Array.isArray(model.faces)?model.faces.filter(face=>face.id===row.id):[]);
          if(matches.length!==1||!(matches[0].root instanceof MOpenFaceShell)||matches[0].root.originatingOperation!==row.index||!sameSketchSaveFrame(sketchBoundaryFrame(matches[0]),row.frame))throw Error('The regenerated principal source differs from its prepared frame.');}
        job.current();return proof&&changes.length?ctx.storageService.prepareWrites(changes.map(row=>({key:job.project.sketchStorageKey(row.faceId),value:row.after}))):null;
      }};
    job.current();if(pendingPipelines||pendingModifications)throw Object.assign(Error('Another operation is pending.'),{code:'BUSY'});
    await new Promise<void>((resolve,reject)=>{pendingModifications++;modificationCallbacks.set(state,{onAccepted:resolve,onError:reject,preparation,journalProposal:proposal,journalSignature:nextCapture.signature,
      principalPlacement:{completeModels:complete?.models||null}});modifications$.next(state);});
    try{preparation.requireCommittedCurrent();return Object.freeze({changed:true,committed:true,revision:inspectAuthoredEdits().revision,unit:'millimeter',
      ...(request?{index:request.index,featureId:request.featureId,faceId:request.faceId,orientation:request.orientation,depth:request.depth}:{}),pointer,
      ...(input.positionOnly&&!request?{afterFeatureId:pointer<0?null:canonicalAuthoredFeatureId(nextCapture.history[pointer].params.featureId),kind:'history-position'}:{}),authoredUndo:true,persistence:'volatile-workspace'});
    }catch(cause){throw Object.assign(Error('Principal placement committed, but its receipt or lifetime is unavailable.'),{code:'PRINCIPAL_PUBLICATION_FAILED',committed:true,cause});}
  }

  async function travelHistoryControl(args:any,rawOptions:any){
    if(!historyControlCommands)throw Error('History controls are unavailable.');
    const job=historyControlCommands.captureHistoryControlJob(rawOptions);
    const captured=await captureAuthoredHistory(job.history,job.current);job.current();
    const travel=planHistoryControlTravel(authoredJournal$.value,{document:job.project.documentGeneration,revision:authoredJournal$.value.revision,direction:args.direction,currentSignature:captured.signature,currentPointer:job.state.pointer});
    const state=applyHistoryControlTravel(captured.history,travel,args.direction);
    const e=travel.entry,delta=e.kind==='feature-suppression'?{index:e.index,featureId:e.featureId,afterSuppressed:args.direction==='undo'?e.beforeSuppressed:e.afterSuppressed}:{};
    return submitHistoryControl({job,captured,plan:{kind:e.kind,...state,delta},options:rawOptions,travel});
  }

  function inspectAuthoredEdits() {
    const journal = authoredJournal$.value;
    // A native restore publishes its model while the manager still owns the
    // restore transaction. Bind metadata after that transaction becomes ready.
    if (!fullTipMaterialSurfaceRevision && fullTipSignature && !(ctx.projectManager as any).isRestoring) {
      try {fullTipMaterialSurfaceRevision=(ctx.projectManager as any).inspectMaterialSurfaceRevision();} catch (_) { /* remain unavailable */ }
    }
    const fullTip = modifications$.value.pointer === modifications$.value.history.length - 1 &&
      fullTipSketchRevision === sketchRevision(ctx.storageService,(ctx.projectService as any).sketchStorageNamespace) &&
      fullTipMaterialSurfaceRevision === (ctx.projectManager as any).inspectMaterialSurfaceRevision();
    const historyState=modifications$.value;
    const controlsCurrent=journalHeadDefinition===historyState.history&&fullTipSketchRevision===sketchRevision(ctx.storageService,(ctx.projectService as any).sketchStorageNamespace)&&fullTipMaterialSurfaceRevision===(ctx.projectManager as any).inspectMaterialSurfaceRevision();
    const canTravel=(entry:any,direction:'undo'|'redo')=>{
      if(entry?.kind==='source-frame'&&entry.reviewPosition){const p=entry.reviewPosition;return controlsCurrent&&fullTipSignature===p[direction==='undo'?'afterSignature':'beforeSignature']&&historyState.pointer===p[direction==='undo'?'afterPointer':'beforePointer'];}
      return fullTip||(controlsCurrent&&HISTORY_CONTROL_KINDS.includes(entry?.kind));
    };
    const documentRevision=(ctx.projectManager as any).inspectDocumentRevision();
    const target=(entry:any):any=>entry ? entry.kind==='document-metadata'?documentMetadataTarget(entry):Object.freeze(entry.kind==='operation-append'?{kind:entry.kind,index:entry.index,featureId:entry.featureId,operationType:entry.operation.type}:entry.kind==='source-plane-depth'?{kind:entry.kind,index:entry.index,featureId:entry.featureId,faceId:entry.faceId,orientation:entry.orientation}:entry.kind==='sketch-bytes'?{kind:entry.kind,faceId:entry.faceId}:entry.kind==='parameter-bracket'?{kind:entry.kind,faceId:entry.faceId,index:entry.index,featureId:entry.featureId}:{kind:entry.kind,index:entry.index,featureId:entry.featureId}) : null;
    return Object.freeze({scope:'session-local-supported-authored-transactions-v1',revision:`${journal.document}:${journal.revision}:${documentRevision}`, canUndo:journal.cursor>0&&canTravel(journal.entries[journal.cursor-1],'undo'),
      canRedo:journal.cursor<journal.entries.length&&canTravel(journal.entries[journal.cursor],'redo'),
      undoTarget:canTravel(journal.entries[journal.cursor-1],'undo')?target(journal.entries[journal.cursor-1]):null,
      redoTarget:canTravel(journal.entries[journal.cursor],'redo')?target(journal.entries[journal.cursor]):null});
  }
  function authoredEditTravel(args:any, options:any = {}) {
    if(!args || typeof args!=='object' || Array.isArray(args) ||
       Reflect.ownKeys(args).some(k=>typeof k!=='string' || !Object.getOwnPropertyDescriptor(args,k)?.enumerable || !Object.prototype.hasOwnProperty.call(Object.getOwnPropertyDescriptor(args,k),'value')) ||
       Reflect.ownKeys(args).sort().join(',')!=='direction,revision' || !['undo','redo'].includes(args.direction)) {
      throw new Error('Invalid authored history command.');
    }
    args={revision:args.revision,direction:args.direction};
    const info=inspectAuthoredEdits();
    if(args.revision!==info.revision)throw Object.assign(new Error('Authored edit history is stale.'),{code:'STALE_HISTORY'});
    const target=args.direction==='undo'?info.undoTarget:info.redoTarget;
    if(!target)throw new Error('No supported authored edit in that direction.');
    if(HISTORY_CONTROL_KINDS.includes(target.kind)){
      if(target.kind==='history-position'&&modifications$.value.history.some(e=>e.type==='SOURCE_FRAME_V1')){
        const j=authoredJournal$.value,plan=planHistoryControlTravel(j,{document:(ctx.projectService as any).documentGeneration,revision:j.revision,direction:args.direction,currentSignature:fullTipSignature,currentPointer:modifications$.value.pointer});
        return principalPlaneCommands.travelSourceFrameHistoryPosition(args,options,plan);
      }
      return travelHistoryControl(args,options);
    }
    if(target.kind==='document-metadata'){
      if(target.domain==='manufacturing')return (ctx.projectManager as any).travelManufacturingMetadata(args,options);
      if(target.domain==='linked-part-drawing')return (ctx.projectManager as any).travelLinkedPartDrawingMetadata(args,options);
      throw new Error('Unsupported document metadata history domain.');
    }
    const request={revision:args.revision,index:target.index,featureId:target.featureId,direction:args.direction};
    if(target.kind==='selected-profile-source-dimension'){
      if(!selectedProfileSourceDimensionCommands)throw Error('Combined source/region travel is unavailable.');
      const entry=modifications$.value.history[target.index];
      if(entry?.type!=='WORKER_SELECTED_PROFILE_EXTRUDE_V2')throw Error('The combined source feature is unavailable.');
      const parameters:any=captureSelectedProfileDepthParameters(entry.params),journal=authoredJournal$.value;
      const plan=planSelectedProfileSourceDimensionTravel(journal,{document:(ctx.projectService as any).documentGeneration,revision:journal.revision,
        direction:args.direction,index:target.index,featureId:target.featureId,parameters,currentSketch:ctx.sketchStorageService.getSketchData(parameters.faceId)});
      return selectedProfileSourceDimensionCommands.travelSelectedProfileSourceDimension(args,options,plan);
    }
    if(target.kind==='source-frame'){if(!sourceFrameCommands)throw Error('Source-frame journal is unavailable.');const journal=authoredJournal$.value,plan=planSourceFrameTravel(journal,{document:(ctx.projectService as any).documentGeneration,revision:journal.revision,direction:args.direction,history:modifications$.value.history,readSketch:id=>ctx.sketchStorageService.getSketchData(id),currentSignature:fullTipSignature,currentPointer:modifications$.value.pointer});
      if(plan.beforeOperation?.type==='PLANE'&&plan.afterOperation?.type==='PLANE')return principalPlaneCommands.travelPrincipalPlanePlacement(args,options,plan);
      return sourceFrameCommands.travelSourceFrame(args,options,plan);}
    if(target.kind==='source-plane-depth'){
      if(!sourcePlaneDepthCommands)throw Error('Source-plane journal travel is unavailable.');const journal=authoredJournal$.value,entry=modifications$.value.history[target.index];if(entry?.type!=='PLANE')throw Error('Source-plane history is unavailable.');const p=captureSourcePlaneParameters(entry.params),identity={index:target.index,featureId:target.featureId,faceId:target.faceId,orientation:p.orientation};if(Number(p.featureId)!==target.featureId)throw Error('Source-plane identity changed.');const plan=planSourcePlaneDepthTravel(journal,{document:(ctx.projectService as any).documentGeneration,revision:journal.revision,direction:args.direction,identity,currentDepth:p.depth,currentSketch:ctx.sketchStorageService.getSketchData(target.faceId)});return sourcePlaneDepthCommands.travelSourcePlaneDepth(args,options,plan);
    }
    if(target.kind==='operation-append')return authoredFeatureOperation('operation-append',request,options);
    if(target.kind==='operation-remove')return authoredFeatureOperation('operation-remove',request,options);
    if(target.kind==='through-hole-parent')return authoredFeatureOperation('through-hole-parent',request,options);
    if(target.kind==='extrusion-depth')return authoredDepthOperation(request,options);
    if(target.kind==='solid-box')return authoredSolidBoxOperation(request,options);
    if(target.kind==='revolve-angle')return authoredRevolveAngleOperation(request,options);
    if(target.kind==='selected-profile-depth')return authoredSelectedProfileDepthOperation(request,options);
    if(target.kind==='selected-profile-region')return authoredSelectedProfileRegionOperation(request,options);
    if(target.kind==='linear-hole-pattern')return authoredLinearHolePatternOperation(request,options);
    if(target.kind==='through-hole')return authoredThroughHoleOperation(request,options);
    if(target.kind==='solid-edge-treatment')return authoredSolidEdgeTreatmentOperation(request,options);
    if(target.kind==='solid-shell')return authoredSolidShellOperation(request,options);
    if(target.kind==='hole-centered'||target.kind==='hole-corners')return authoredHoleOperation(target.kind.slice(5),request,options);
    if(target.kind==='sketch-bytes')return travelAuthoredSketch(args,target,options);
    if(target.kind==='parameter-depth'||target.kind==='parameter-bracket')throw new Error('This earlier in-memory parameter edit is unavailable.');
    if(target.kind==='physical-transaction'){
      const journal=authoredJournal$.value,entry=journal.entries[args.direction==='undo'?journal.cursor-1:journal.cursor];
      const legacy=entry?.parameterKind==='legacy-numeric-v1';
      if(!legacy&&entry&&[entry.beforeSource,entry.afterSource].some(source=>source!==''&&!decodePhysicalSource(source)))throw Error('Earlier unclassified numeric expression history is unavailable.');
      if(legacy){if(!legacyExpressionCommands)throw Error('Legacy expression history is unavailable.');const plan=planPhysicalTravel(journal,{document:(ctx.projectService as any).documentGeneration,revision:journal.revision,direction:args.direction,currentSource:ctx.expressionService.script$.value,history:modifications$.value.history,readSketch:(id:string)=>ctx.sketchStorageService.getSketchData(id)});return legacyExpressionCommands.travelLegacyExpressions(args,options,plan);}
      return physicalSharedOperation({revision:args.revision,direction:args.direction},options);
    }
    if(target.kind==='centered-parent-repair')return travelCenteredParentRepair(args,target,options);
    throw new Error('No supported authored edit in that direction.');
  }
  function inspectPhysicalParameters() {
    const info=inspectAuthoredEdits(), readiness=(ctx.craftService as any).inspectRectangleCreation(),service:any=ctx.projectService,expressions:any=ctx.expressionService,history=modifications$.value,source=expressions.script$.value;
    const manager:any=ctx.projectManager,craft=ctx.craftService,storage=ctx.storageService,wizard=ctx.wizardService,workbench=ctx.workbenchService,assembly=ctx.assemblyService,streamRoot=ctx.streams,sketcherStreams=ctx.streams.sketcher,document=service.documentGeneration,signal=service.documentSignal,hostBound=service.hasHostLifetime,documentCurrent=service.isDocumentCurrent(document),aborted=HISTORY_SIGNAL_ABORTED(signal),namespace=service.sketchStorageNamespace;
    const format=manager.formatDisplayQuantity,inspectPresentation=manager.inspectDisplayUnits,resolveQuantity=expressions.resolveQuantity,physicalCurrent=expressions.hasCurrentPhysicalResult,namespaceRevision=storage.namespaceRevision,storageRevision=namespaceRevision.call(storage,namespace);
    const tracked=[modifications$,models$,authoredJournal$,pipelineFailure$,engineCleanupFailure$,expressions.script$,expressions.list$,expressions.errors$,expressions.table$,sketcherStreams.sketchingFace,wizard.workingRequest$,workbench.currentWorkbench$,assembly.constraints$],versions=tracked.map(s=>s.revision),pending=[pendingPipelines,pendingModifications,evaluationEpoch];
    // Constant-sized identity/version checks around external quantity/formatter
    // calls. Do not scan/hash every sketch/history for each of up to256 rows.
    const current=()=>{
      if(ctx.wizardService!==wizard||ctx.workbenchService!==workbench||ctx.assemblyService!==assembly||ctx.streams!==streamRoot||ctx.streams.sketcher!==sketcherStreams)throw superseded();
      const streams=[modifications$,models$,authoredJournal$,pipelineFailure$,engineCleanupFailure$,expressions.script$,expressions.list$,expressions.errors$,expressions.table$,sketcherStreams.sketchingFace,wizard.workingRequest$,workbench.currentWorkbench$,assembly.constraints$];
      if(ctx.projectService!==service||ctx.projectManager!==manager||ctx.services.projectManager!==manager||ctx.craftService!==craft||ctx.storageService!==storage||ctx.expressionService!==expressions||manager.formatDisplayQuantity!==format||manager.inspectDisplayUnits!==inspectPresentation||expressions.resolveQuantity!==resolveQuantity||expressions.hasCurrentPhysicalResult!==physicalCurrent||modifications$.value!==history||expressions.script$.value!==source||service.documentGeneration!==document||service.documentSignal!==signal||HISTORY_SIGNAL_ABORTED(signal)!==aborted||service.hasHostLifetime!==hostBound||service.isDocumentCurrent(document)!==documentCurrent||service.sketchStorageNamespace!==namespace||storage.namespaceRevision!==namespaceRevision||namespaceRevision.call(storage,namespace)!==storageRevision||streams.some((s,i)=>s!==tracked[i]||s.revision!==versions[i])||pendingPipelines!==pending[0]||pendingModifications!==pending[1]||evaluationEpoch!==pending[2])throw superseded();
    };
    let reason=readiness.ready?null:(readiness.reason||'Finish the current operation first.');
    if(!service.hasHostLifetime||!service.isDocumentCurrent(service.documentGeneration))reason='A current host-bound workspace is required.';
    if(typeof source!=='string'||source.length>65536)reason='Parameter source exceeds the supported bound.';
    let decoded:any=null;
    if(!reason&&source!==''){try{decoded=decodePhysicalSource(source);if(!decoded)reason='Nonempty legacy expressions cannot yet be converted.';else if(!expressions.hasCurrentPhysicalResult())reason='The typed parameter source is stale.';}catch(error){reason=error.message;}}
    const definitions=decoded?decoded.definitions.map(row=>Object.freeze({name:row.name,dimension:row.dimension,expression:row.expression})):[];
    const targets:any[]=[];if(!reason){if(history.history.length>256)reason='History exceeds the parameter editing limit.';else history.history.forEach((entry,index)=>{if(entry.type==='WORKER_RECTANGLE_EXTRUDE_V1'&&Number.isSafeInteger(Number(entry.params?.featureId))&&Number(entry.params.featureId)>0&&(typeof entry.params.length==='number'||typeof entry.params.length==='string'))targets.push(Object.freeze({index,featureId:Number(entry.params.featureId),binding:entry.params.length}));});}
    const brackets:any[]=[];
    if(!reason&&targets.length===1){const extrusion=history.history[targets[0].index],corners=history.history.map((entry,index)=>({entry,index})).filter(item=>item.entry.type==='WORKER_FOUR_CORNER_THROUGH_HOLES_V1');
      if(corners.length===1&&typeof extrusion.params.face==='string'&&Number.isSafeInteger(Number(corners[0].entry.params?.featureId))){
        const faceId=extrusion.params.face,sketch=ctx.sketchStorageService.getSketchData(faceId);
        if(typeof sketch==='string')try{const rectangle=prepareTypedRectangle(sketch,[],name=>expressions.resolveQuantity(name,'length')),width=rectangle.bindings.find(b=>b.segmentId==='rect-0')?.value,height=rectangle.bindings.find(b=>b.segmentId==='rect-1')?.value;
          brackets.push(Object.freeze({faceId,index:corners[0].index,featureId:Number(corners[0].entry.params.featureId),width,height,offsetX:corners[0].entry.params.offsetX,offsetY:corners[0].entry.params.offsetY}));
        }catch(_){/* Unsupported authored sketches are not offered. */}
      }
    }
    if(ctx.projectService!==service||ctx.expressionService!==expressions||modifications$.value!==history||expressions.script$.value!==source||inspectAuthoredEdits().revision!==info.revision)throw superseded();
    const enclosures:any[]=[];if(!reason)history.history.forEach((entry,index)=>{if(['WORKER_ENCLOSURE_V1','WORKER_ENCLOSURE_V2'].includes(entry.type)&&Number.isSafeInteger(Number(entry.params?.featureId))&&Number(entry.params.featureId)>0){const fields=physicalBindingFields[entry.type];enclosures.push(Object.freeze({index,featureId:Number(entry.params.featureId),type:entry.type,bindings:Object.freeze(Object.fromEntries(fields.map(field=>[field,entry.params[field]])))}));}});
    const selectedProfiles:any[]=[];if(!reason)history.history.forEach((entry,index)=>{if(entry.type==='WORKER_SELECTED_PROFILE_EXTRUDE_V2'){const p:any=captureSelectedProfileDepthParameters(entry.params);selectedProfiles.push(Object.freeze({index,featureId:p.featureId,faceId:p.faceId,regionId:p.regionId,engine:p.engine,engineRevision:p.engineRevision,depth:p.depth,sourceProfile:'selected-source',sourceQualification:'requires-worker-validation'}));}});
    const features:any[]=[];if(!reason)history.history.forEach((entry,index)=>{if(Object.prototype.hasOwnProperty.call(physicalBindingFields,entry.type)&&Number.isSafeInteger(Number(entry.params?.featureId))&&Number(entry.params.featureId)>0){const fields=physicalBindingFields[entry.type].filter(field=>entry.type!=='WORKER_THROUGH_HOLES_V1'||entry.params.kind!=='centered-through'||field==='diameter');features.push(Object.freeze({index,featureId:Number(entry.params.featureId),type:entry.type,bindings:Object.freeze(Object.fromEntries(fields.map(field=>[field,entry.params[field]])))}));}});
    // Project only the already accepted Worker result. Inspection never parses
    // or evaluates formula arithmetic and introduces no second quantity table.
    const units={scalar:'dimensionless',length:'millimeter',area:'square-millimeter',volume:'cubic-millimeter',angle:'radian',count:'count',boolean:null};
    let presentation:any=null;
    const presentationCurrent=()=>{
      current();if(!presentation)return;
      const observed=inspectPresentation.call(manager);current();
      if(observed.revision!==presentation.revision||observed.lengthUnit!==presentation.lengthUnit||observed.angleUnit!==presentation.angleUnit||observed.canonicalLengthUnit!==presentation.canonicalLengthUnit||observed.canonicalAngleUnit!==presentation.canonicalAngleUnit)throw superseded();
    };
    if(!reason&&decoded&&typeof inspectPresentation==='function'){
      current();const observed=inspectPresentation.call(manager);current();
      if(!observed||typeof observed.revision!=='string'||!observed.revision||observed.revision.length>256||!['millimeter','inch'].includes(observed.lengthUnit)||observed.angleUnit!=='degree'||observed.canonicalLengthUnit!=='millimeter'||observed.canonicalAngleUnit!=='radian')throw superseded();
      presentation=Object.freeze({revision:observed.revision,lengthUnit:observed.lengthUnit,angleUnit:observed.angleUnit,canonicalLengthUnit:observed.canonicalLengthUnit,canonicalAngleUnit:observed.canonicalAngleUnit});current();
    }
    const displayFor=(value:number,dimension:string):any=>{
      if(!['length','area','volume','angle'].includes(dimension))return {display:null,displayStatus:'not-applicable',displayReason:'NON_DIMENSIONED_QUANTITY'};
      if(!presentation||typeof format!=='function')return {display:null,displayStatus:'unavailable',displayReason:'FORMATTER_UNAVAILABLE'};
      presentationCurrent();let raw:any;
      try{raw=format.call(manager,value,dimension);}catch(_){presentationCurrent();return {display:null,displayStatus:'unavailable',displayReason:'FORMATTER_REJECTED'};}
      presentationCurrent();
      // Preserve the formatter's full numeric value; only its human text rounds.
      // Capture five bounded own data fields. Invalid formatting cannot erase a
      // valid canonical quantity or substitute another unit/value for it.
      const result:any={},keys=['canonicalValue','canonicalUnit','value','unit','text'];let valid=!!raw&&typeof raw==='object'&&!Array.isArray(raw);
      try{if(valid){const ownKeys=Reflect.ownKeys(raw);valid=ownKeys.length===keys.length&&ownKeys.every(k=>typeof k==='string'&&keys.includes(k));for(const key of keys){const d=Object.getOwnPropertyDescriptor(raw,key);if(!d?.enumerable||!Object.hasOwn(d,'value')){valid=false;break;}result[key]=d.value;}}}catch(_){valid=false;}
      current();
      const imperial={length:'inch',area:'square-inch',volume:'cubic-inch'},expectedUnit=dimension==='angle'?'degree':presentation.lengthUnit==='inch'?imperial[dimension]:units[dimension];
      if(!valid||!Object.is(result.canonicalValue,value)||result.canonicalUnit!==units[dimension]||typeof result.value!=='number'||!Number.isFinite(result.value)||value!==0&&result.value===0||result.unit!==expectedUnit||typeof result.text!=='string'||result.text.length>64)return {display:null,displayStatus:'unavailable',displayReason:'INVALID_FORMATTER_RESULT'};
      return {display:Object.freeze(result),displayStatus:'available',displayReason:null};
    };
    const quantities=!reason&&decoded?definitions.map(row=>{current();const value=resolveQuantity.call(expressions,row.name,row.dimension);current();return Object.freeze({name:row.name,dimension:row.dimension,value,unit:units[row.dimension],...displayFor(value,row.dimension)});}):[];
    presentationCurrent();
    if(ctx.projectService!==service||ctx.expressionService!==expressions||modifications$.value!==history||expressions.script$.value!==source||inspectAuthoredEdits().revision!==info.revision)throw superseded();
    presentationCurrent();return Object.freeze({ready:!reason,reason,revision:info.revision,presentationRevision:presentation?.revision||null,unit:'millimeter',definitions:Object.freeze(definitions),quantities:Object.freeze(quantities),configurations:decoded?.version===2?decoded.configurations:Object.freeze([]),activeConfigurationId:decoded?.version===2?decoded.activeId:null,targets:Object.freeze(targets),brackets:Object.freeze(brackets),enclosures:Object.freeze(enclosures),selectedProfiles:Object.freeze(selectedProfiles),features:Object.freeze(features)});
  }

  // One candidate-only transaction for supported authored physical bindings.
  async function physicalSharedOperation(input:any,opts:any={}) {
    const service:any=ctx.projectService,document=service.documentGeneration,storage=ctx.storageService,manager:any=ctx.projectManager,expressions:any=ctx.expressionService,namespace=service.sketchStorageNamespace;
    const sketchVersions=sketchRevision(storage,namespace),material=manager.inspectMaterialSurfaceRevision(),before=modifications$.value,journal=authoredJournal$.value,source=expressions.script$.value;
    const streams=()=>[modifications$,models$,pipelineFailure$,engineCleanupFailure$,expressions.script$,expressions.list$,expressions.errors$,expressions.table$,ctx.streams.sketcher.sketchingFace,ctx.wizardService.workingRequest$,ctx.workbenchService.currentWorkbench$,ctx.assemblyService.constraints$],tracked=streams(),versions=tracked.map(s=>s.revision),services=()=>[ctx.projectService,ctx.storageService,ctx.craftService,ctx.cadRegistry,ctx.operationService,ctx.expressionService,ctx.projectManager,ctx.sketchStorageService,ctx.services.sketcher,ctx.wizardService,ctx.workbenchService,ctx.assemblyService],capturedServices=services();
    const callerValid=()=>{try{return !opts.signal?.aborted&&(!opts.valid||opts.valid()===true)}catch{return false}},alive=()=>callerValid()&&ctx.projectService===service&&ctx.storageService===storage&&ctx.projectManager===manager&&service.isDocumentCurrent(document);
    const check=()=>{if(!alive()||services().some((s,i)=>s!==capturedServices[i])||streams().some((s,i)=>s!==tracked[i]||s.revision!==versions[i])||service.sketchStorageNamespace!==namespace||sketchRevision(storage,namespace)!==sketchVersions||manager.inspectMaterialSurfaceRevision()!==material||modifications$.value!==before||authoredJournal$.value!==journal)throw superseded();};
    if(!service.hasHostLifetime||!ctx.craftService.inspectRectangleCreation().ready||pendingPipelines||pendingModifications||before.pointer!==before.history.length-1||input.revision!==inspectAuthoredEdits().revision||journal.document!==document)throw new Error('The document is not ready for parameter editing.');
    if(sketchVersions!==fullTipSketchRevision)throw new Error('The authored sketch changed; reload before editing parameters.');
    // A journal-free material change may be incorporated by a successful
    // publication, but a refused candidate must not move the accepted tip.
    assertPhysicalMaterialBaseline(material,fullTipMaterialSurfaceRevision,journal.entries);
    if(source!==''&&(!decodePhysicalSource(source)||!expressions.hasCurrentPhysicalResult()))throw new Error('Nonempty legacy or stale parameter sources are unsupported.');
    check();const captured=await captureAuthoredHistory(before.history,check);if(!fullTipSignature||captured.signature!==fullTipSignature)throw new Error('The accepted history is stale.');
    let targetSource=input.source,changes=input.changes||[],wantedSketches:any[]=[],wantedSketch=null,proposal:any=null;
    if(input.direction){const travel=planPhysicalTravel(journal,{document,revision:journal.revision,direction:input.direction,currentSource:source,history:captured.history,readSketch:(id:string)=>ctx.sketchStorageService.getSketchData(id)});targetSource=travel.source;changes=travel.changes.map(c=>({index:c.index,featureId:c.featureId,type:c.type,field:c.field,value:c.value}));wantedSketches=travel.sketches;wantedSketch=wantedSketches.find(x=>captured.history.some(h=>h.type==='WORKER_RECTANGLE_EXTRUDE_V1'&&h.params?.face===x.faceId||h.type==='WORKER_SELECTED_PROFILE_EXTRUDE_V2'&&h.params?.faceId===x.faceId))||null;proposal=travel.next;}
    const edits:any[]=[],seen=new Set<string>();for(const change of changes){const request=captured.history[change.index],allowed=Object.prototype.hasOwnProperty.call(physicalBindingFields,change.type)?physicalBindingFields[change.type]:null,key=change.index+':'+change.field;if(!request||request.type!==change.type||Number(request.params?.featureId)!==change.featureId||!allowed?.includes(change.field)||seen.has(key))throw new Error('A physical binding target is unavailable.');seen.add(key);const previous=request.params[change.field];if(previous!==change.value){edits.push({index:change.index,featureId:change.featureId,type:change.type,field:change.field,before:previous,after:change.value});request.params[change.field]=change.value;}}
    if(input.rectangle&&(captured.history.filter(h=>h.type==='WORKER_RECTANGLE_EXTRUDE_V1').length!==1||captured.history.filter(h=>h.type==='WORKER_FOUR_CORNER_THROUGH_HOLES_V1').length!==1))throw Error('Only one unambiguous bracket is supported.');
    const modern=requireModernPhysicalHistory(captured.history),selected=modern?captured.history.find(row=>row.type==='WORKER_SELECTED_PROFILE_EXTRUDE_V2'):null;
    if(input.selectedRectangle&&(!selected||selected.params.featureId!==input.featureId||captured.history[input.index]!==selected))throw Error('The selected rectangle identity changed.');
    let faceId=input.rectangle?.faceId||wantedSketch?.faceId||selected?.params.faceId||null,sourceSketch:string=null,baseSketch:string=null;
    if(faceId){sourceSketch=ctx.sketchStorageService.getSketchData(faceId);if(typeof sourceSketch!=='string')throw new Error('The rectangle source is unavailable.');baseSketch=wantedSketch?wantedSketch.data:modern?sourceSketch:prepareTypedRectangle(sourceSketch,[{segmentId:'rect-0',parameter:input.rectangle.width},{segmentId:'rect-1',parameter:input.rectangle.height}],()=>1).sketchJSON;}
    const definition=targetSource===''?{definitions:[]}:decodePhysicalSource(targetSource);if(!definition)throw new Error('Only typed or empty parameter source is supported.');
    const readSketch=(id:string)=>id===faceId?baseSketch:ctx.sketchStorageService.getSketchData(id);
    const priorDefinitions=source?decodePhysicalSource(source)?.definitions||[]:[],parameterNames=Array.from(new Set([...priorDefinitions,...definition.definitions].map(d=>d.name)));
    const manifest=deriveAuthoredPhysicalManifest(captured.history,parameterNames,readSketch);
    let selectedTarget:any=null;
    if(modern){
      // Generic selected-source manifests carry authored identity only. Rectangle
      // width/height controls require their separate actual Worker proof.
      const targets=manifest.targets.filter(t=>t.kind==='selected-profile'),index=captured.history.indexOf(selected),p=selected.params;
      if(targets.length!==1||faceId!==p.faceId||targets[0].index!==index||targets[0].featureId!==p.featureId||targets[0].faceId!==p.faceId||targets[0].regionId!==p.regionId)throw Error('The selected profile is unavailable.');
      selectedTarget=targets[0];
    }else{
      if(faceId&&!manifest.targets.some(t=>t.kind==='rectangle'&&t.faceId===faceId))throw Error('The selected rectangle is unavailable.');
      const symbolic:any[]=manifest.targets.filter(t=>t.kind==='rectangle'&&[t.width,t.height].some(v=>typeof v==='string'&&/^[A-Za-z_$][A-Za-z0-9_$]{0,127}$/.test(v)));
      if(symbolic.length>1||faceId&&symbolic.some(t=>t.faceId!==faceId))throw new Error('Only one parameter-bound rectangle is supported in a transaction.');
      if(!faceId&&symbolic.length){faceId=symbolic[0].faceId;sourceSketch=ctx.sketchStorageService.getSketchData(faceId);baseSketch=sourceSketch;}
    }
    const sketchItems=ctx.sketchStorageService.getAllSketches();if(!Array.isArray(sketchItems)||sketchItems.length>64)throw new Error('Sketch inventory exceeds parameter editing limits.');const inventory:any[]=[],ids=new Set<string>();let totalChars=0;for(const item of sketchItems){const id=item?.id,bytes=id===faceId?baseSketch:ctx.sketchStorageService.getSketchData(id);if(typeof id!=='string'||!id||id.length>1024||ids.has(id)||typeof bytes!=='string'||bytes.length>1048576||(totalChars+=bytes.length)>4194304)throw new Error('Sketch inventory exceeds parameter editing limits.');ids.add(id);inventory.push(Object.freeze({id,source:bytes}));}Object.freeze(inventory);
    const genericFrames:any[]=[];const checkGeneric=()=>{check();for(const row of genericFrames){if(ctx.cadRegistry.findFace(row.id)!==row.face||storage.versionOf(service.sketchStorageKey(row.id))!==row.version||ctx.sketchStorageService.getSketchData(row.id)!==row.source||JSON.stringify(sketchBoundaryFrame(row.face))!==row.frameStamp)throw superseded();}};
    if(!input.direction&&!input.selectedRectangle&&targetSource===source&&!edits.length)return Object.freeze({changed:false,revision:inspectAuthoredEdits().revision});
    const controller=new AbortController(),scope:{epoch:number|null}={epoch:null};let settled=false,workspace:any=null;
    const stop=()=>{controller.abort();if(!settled&&scope.epoch!==null&&scope.epoch===evaluationEpoch)engineResources.cancelCandidates();};const signals=[service.documentSignal,opts.signal].filter(Boolean);for(const signal of signals)signal.addEventListener('abort',stop,{once:true});const poll=setInterval(()=>{try{check()}catch{stop()}},100);
    try{
      check();const response=await evaluatePhysicalInWorker(physicalWorkerUrl,targetSource,{signal:controller.signal,valid:()=>{try{checkGeneric();return true}catch{return false}},manifest,sketches:inventory});checkGeneric();if(!response?.ok)throw Object.assign(new Error(response?.error?.message||'Parameter evaluation failed.'),{code:response?.error?.code,...(response?.error?.parameter?{parameter:response.error.parameter}:{})});
      const participant=prepareExpressionPublication(expressions,targetSource,targetSource===''?null:response,response?.revision||'empty');
      let solvedSketch=baseSketch;
      if(faceId){
        const revision=crypto.randomUUID(),face=ctx.cadRegistry.findFace(faceId),frame=modern?sketchBoundaryFrame(face):null,boundary=modern?getSketchBoundaries(face):JSON.parse(baseSketch).boundary;
        const selectedDepth=modern?response.bindings.targets.find(row=>row.kind==='feature'&&row.index===selectedTarget.index&&row.featureId===selectedTarget.featureId&&row.type==='WORKER_SELECTED_PROFILE_EXTRUDE_V2')?.fields.depth:null;
        const task=modern&&input.selectedRectangle?{task:'typed-selected-rectangle-bind',revision,sketchJSON:baseSketch,source:targetSource,bindings:[{dimension:'width',parameter:input.selectedRectangle.width},{dimension:'height',parameter:input.selectedRectangle.height}],featureId:selectedTarget.featureId,faceId:selectedTarget.faceId,regionId:selectedTarget.regionId,frame,engineRevision:selected.params.engineRevision,depth:selectedDepth}:modern?{task:'typed-sketch-transaction',revision,sketchJSON:baseSketch,parameterSource:targetSource,frame,verifyCurrent:!!wantedSketch}:targetSource===''?{task:'legacy-physical-sketch-transaction-solve',revision,sketchJSON:baseSketch,boundary,externalParameters:{}}:{task:'typed-rectangle-bind',revision,sketchJSON:baseSketch,source:targetSource,bindings:[]};
        const solved=await runSketchSolve(sketchWorkerUrl,task,{signal:controller.signal,valid:()=>{try{check();return true}catch{return false}}});check();
        if(!solved?.ok||solved.revision!==revision||typeof solved.serializedSketch!=='string'||solved.serializedSketch.length>65536)throw new Error(solved?.error?.message||'The selected source could not be solved.');
        if(input.selectedRectangle){const rows=solved.bindings,dimensions=['width','height'];if(!Array.isArray(rows)||rows.length!==2||rows.some((row,i)=>!row||Object.keys(row).sort().join(',')!=='before,dimension,segmentId,value'||row.dimension!==dimensions[i]||row.value!==input.selectedRectangle[dimensions[i]]||typeof row.segmentId!=='string'||!row.segmentId||row.segmentId.length>256||!(typeof row.before==='string'&&row.before.length<=128||typeof row.before==='number'&&Number.isFinite(row.before)))||rows[0].segmentId===rows[1].segmentId)throw Error('Rectangle binding proof changed its actual row identity.');if(!input.direction&&targetSource===source&&!edits.length&&rows.every(row=>Object.is(row.before,row.value)))return Object.freeze({changed:false,revision:inspectAuthoredEdits().revision});}
        if(wantedSketch){if(!modern){const wanted=JSON.parse(wantedSketch.data);if(JSON.stringify(wanted.stages)!==JSON.stringify(solved.sketch.stages))throw new Error('Saved rectangle intent changed.');for(let i=0;i<4;i++)for(const end of ['a','b'])for(const axis of ['x','y'])if(!Number.isFinite(wanted.objects[i]?.data?.[end]?.[axis])||Math.abs(wanted.objects[i].data[end][axis]-solved.sketch.objects[i].data[end][axis])>1e-6)throw Error('Saved rectangle geometry no longer solves.');}solvedSketch=wantedSketch.data;}
        else solvedSketch=solved.serializedSketch;
      }
      const sketchChanges:any[]=[];let sketchJournalEstimate=512+3*(source.length+targetSource.length)+edits.length*2048;const addSketchChange=(change:any)=>{sketchJournalEstimate+=64+3*(change.faceId.length+change.before.length+change.after.length);if(sketchJournalEstimate>8*1024*1024)throw new Error('The authored edit exceeds the undo limit.');sketchChanges.push(Object.freeze(change));};if(faceId&&solvedSketch!==sourceSketch)addSketchChange({faceId,before:sourceSketch,after:solvedSketch});
      for(const item of response.sketchConsumers){if(item.faceId===faceId)continue;if(!hasOnlyUnconsumedSketchHistory(captured.history,item.faceId))throw new Error('Typed sketch dependencies in this feature history are unsupported.');const original=inventory.find(x=>x.id===item.faceId),face=ctx.cadRegistry.findFace(item.faceId);if(!original||!face||face.id!==item.faceId||face.defaultSketchId!==item.faceId||face?.root?.ext?.workerGeometry||face.brepFace)throw new Error('The typed sketch face is unavailable or unsupported.');const frame=sketchBoundaryFrame(face),row={id:item.faceId,source:original.source,face,frameStamp:JSON.stringify(frame),version:storage.versionOf(service.sketchStorageKey(item.faceId))};genericFrames.push(row);checkGeneric();const wanted=wantedSketches.find(x=>x.faceId===item.faceId),revision=crypto.randomUUID(),solved=await runSketchSolve(sketchWorkerUrl,{task:'typed-sketch-transaction',revision,sketchJSON:wanted?wanted.data:original.source,parameterSource:targetSource,frame,verifyCurrent:!!wanted},{signal:controller.signal,valid:()=>{try{checkGeneric();return true}catch{return false}}});checkGeneric();if(!solved?.ok||solved.revision!==revision||typeof solved.serializedSketch!=='string'||solved.serializedSketch.length>1048576)throw new Error(solved?.error?.message||'The typed sketch could not be regenerated.');const after=wanted?wanted.data:solved.serializedSketch;if(after!==original.source)addSketchChange({faceId:item.faceId,before:original.source,after});}
      if(wantedSketches.some(w=>w.faceId!==faceId&&!response.sketchConsumers.some(x=>x.faceId===w.faceId)))throw new Error('The authored sketch binding is unavailable.');
      if(!input.direction){if(targetSource===source&&!edits.length&&!sketchChanges.length)return Object.freeze({changed:false,revision:inspectAuthoredEdits().revision});proposal=recordPhysicalTransaction(journal,{document,revision:journal.revision,beforeSource:source,afterSource:targetSource,changes:edits,sketches:sketchChanges});}
      const next=await captureAuthoredHistory(captured.history,check);if((await captureAuthoredHistory(before.history,check)).signature!==captured.signature)throw superseded();
      const rederived=deriveAuthoredPhysicalManifest(next.history,parameterNames,id=>sketchChanges.find(x=>x.faceId===id)?.after||ctx.sketchStorageService.getSketchData(id));if(JSON.stringify(manifest)!==JSON.stringify(rederived))throw superseded();
      const nextState={history:next.history,pointer:next.history.length-1},overrides=Object.freeze(sketchChanges.map(x=>Object.freeze({id:x.faceId,data:x.after})));
      const roleSignature=(models:any[])=>{if(!Array.isArray(models)||models.length>1024)throw new Error('The model exceeds the parameter edit limit.');const roles=[],seen=new Set<string>();for(const m of models){if(typeof m.id!=='string'||!m.id.startsWith('worker-enclosure:'))continue;const version=m.id.startsWith('worker-enclosure:1:')?1:m.id.startsWith('worker-enclosure:2:')?2:0,allowed=version===1?['BODY','LID']:['BODY','LID','LABEL'];if(!version||!Number.isSafeInteger(m.featureId)||m.featureId<1||!allowed.includes(m.outputRole)||m.id!=='worker-enclosure:'+version+':'+JSON.stringify([m.featureId,m.outputRole])||seen.has(m.id))throw new Error('Enclosure output identity is unavailable.');seen.add(m.id);const tag=m.ext?.workerGeometry;if(!Number.isSafeInteger(m.originatingOperation)||m.originatingOperation<0||tag?.engine!=='occ'||tag?.representation!=='worker-owned-occ-enclosure'||tag?.featureId!==m.featureId||tag?.role!==m.outputRole||tag?.version!==version||tag?.unit!=='millimeter')throw new Error('Enclosure provenance is unavailable.');const matrix=m.location,frame=m.csys,keys=['mxx','mxy','mxz','tx','myx','myy','myz','ty','mzx','mzy','mzz','tz'],placement=keys.map(k=>matrix?.[k]),vectors=['origin','x','y','z'].flatMap(k=>[frame?.[k]?.x,frame?.[k]?.y,frame?.[k]?.z]);if([...placement,...vectors].some(v=>typeof v!=='number'||!Number.isFinite(v)))throw new Error('Enclosure placement is unavailable.');roles.push(JSON.stringify([m.id,m.originatingOperation,placement,vectors]));}return roles.sort().join('|');},oldRoles=roleSignature(models$.value);
      const preparation:PreparedSketchCommand={candidateScope:scope,sketchOverrides:overrides,...(modern&&overrides.length?{sketchSourceFrames:Object.freeze(overrides.map(row=>Object.freeze({id:row.id,frame:sketchBoundaryFrame(ctx.cadRegistry.findFace(row.id))})))}:{}),expressionPublication:participant,requireCurrent(){checkGeneric();if(!participant.isCurrent()||roleSignature(models$.value)!==oldRoles)throw superseded();},requireCommittedCurrent(){if(!alive())throw superseded(true);},async prepare(models){if((await captureAuthoredHistory(before.history,check)).signature!==captured.signature)throw superseded();check();if(roleSignature(models$.value)!==oldRoles||roleSignature(models)!==oldRoles)throw new Error('Enclosure output roles changed; review is required.');if(sketchChanges.length)workspace=storage.prepareWrites(sketchChanges.map(x=>({key:service.sketchStorageKey(x.faceId),value:x.after}))); return workspace;}};
      check();if(pendingPipelines||pendingModifications)throw new Error('Another operation is still in progress.');await new Promise<void>((yes,no)=>{pendingModifications++;modificationCallbacks.set(nextState,{onAccepted:yes,onError:no,preparation,journalProposal:proposal,journalSignature:next.signature});modifications$.next(nextState);});
      const primary=response.bindings.targets.find(t=>t.kind==='feature'&&t.index===input.index&&t.featureId===input.featureId);
      return Object.freeze({changed:true,revision:inspectAuthoredEdits().revision,faceId,index:input.index,featureId:input.featureId,...(primary?.type==='WORKER_RECTANGLE_EXTRUDE_V1'?{depth:primary.fields.length}:{}),manufacturingAssignments:'review-if-present'});
    }catch(error){if(!alive()&&!error?.committed)throw superseded();throw error;}finally{settled=true;clearInterval(poll);workspace?.discard();for(const signal of signals)signal.removeEventListener('abort',stop);}
  }

  // The client supplies structured authored configuration intent, never a
  // prevalidated source or candidate. The common transaction evaluates all
  // formula sets and privately replays only the selected effective values.
  function applyPhysicalConfigurations(input:any,options:any={}) {
    const data=(o:any,keys:string[])=>{const prototype=o&&typeof o==='object'?Object.getPrototypeOf(o):undefined;if(!o||typeof o!=='object'||Array.isArray(o)||(prototype!==null&&Object.getPrototypeOf(prototype)!==null)||Reflect.ownKeys(o).some(k=>typeof k!=='string'||!keys.includes(k)||!Object.getOwnPropertyDescriptor(o,k)?.enumerable||!Object.prototype.hasOwnProperty.call(Object.getOwnPropertyDescriptor(o,k),'value')))throw Error('Invalid configuration edit.');return Object.fromEntries(Reflect.ownKeys(o).map((k:string)=>[k,Object.getOwnPropertyDescriptor(o,k).value]));};
    const args:any=data(input,['revision','definitions','configurations','activeId']),opts:any=data(options,['signal','valid']);
    if(Reflect.ownKeys(args).sort().join(',')!=='activeId,configurations,definitions,revision'||typeof args.revision!=='string'||!args.revision||args.revision.length>256)throw Error('Invalid configuration edit.');
    if(opts.valid!==undefined&&typeof opts.valid!=='function')throw Error('Invalid lifetime guard.');
    if(opts.signal!==undefined)try{Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get.call(opts.signal)}catch{throw Error('Invalid cancellation signal.');}
    const source=encodePhysicalConfigurations({version:2,definitions:args.definitions,configurations:args.configurations,activeId:args.activeId});
    return physicalSharedOperation({revision:args.revision,source,changes:[]},opts);
  }

  // One bounded authored operation: bind a worker extrusion depth to a named
  // typed length while atomically publishing definitions and regenerated model.
  function applyPhysicalDepth(args:any,options:any={}) {return physicalDepthOperation(args,options);}
  async function physicalDepthOperation(input:any,options:any={}) {
    const ownData=(object:any,allowed:string[])=>{
      const prototype=object&&typeof object==='object'?Object.getPrototypeOf(object):undefined;
      if(!object||typeof object!=='object'||Array.isArray(object)||(prototype!==null&&Object.getPrototypeOf(prototype)!==null)||Reflect.ownKeys(object).some(k=>typeof k!=='string'||!allowed.includes(k)||!Object.getOwnPropertyDescriptor(object,k)?.enumerable||!Object.prototype.hasOwnProperty.call(Object.getOwnPropertyDescriptor(object,k),'value')))throw new Error('Invalid parameter edit.');
      return Object.fromEntries(Reflect.ownKeys(object).map((key:string)=>[key,Object.getOwnPropertyDescriptor(object,key).value]));
    };
    const args:any=ownData(input,['revision','index','featureId','parameter','definitions','direction']),opts:any=ownData(options,['signal','valid']);
    const travel=args.direction!==undefined;
    if(Reflect.ownKeys(args).sort().join(',')!==(travel?'direction,featureId,index,revision':'definitions,featureId,index,parameter,revision')||typeof args.revision!=='string'||!args.revision||args.revision.length>256||!Number.isSafeInteger(args.index)||args.index<0||args.index>255||!Number.isSafeInteger(args.featureId)||args.featureId<=0||(travel?!['undo','redo'].includes(args.direction):typeof args.parameter!=='string'||!/^[A-Za-z_$][A-Za-z0-9_$]{0,127}$/.test(args.parameter)))throw new Error('Invalid parameter edit.');
    if(opts.valid!==undefined&&typeof opts.valid!=='function')throw new Error('Invalid lifetime guard.');
    if(opts.signal!==undefined)try{Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get.call(opts.signal)}catch{throw new Error('Invalid cancellation signal.');}
    const proposedSource=travel?null:encodeUpdatedPhysicalDefinitions(ctx.expressionService.script$.value,args.definitions);
    if(!travel)return physicalSharedOperation({revision:args.revision,source:proposedSource,index:args.index,featureId:args.featureId,changes:[{index:args.index,featureId:args.featureId,type:'WORKER_RECTANGLE_EXTRUDE_V1',field:'length',value:args.parameter}]},opts);
    throw new Error('This earlier in-memory parameter edit is unavailable.');
  }

  // One private full-tip transaction for the supported authored rectangle
  // and its four corner offsets. Bindings remain in sketch/history source.
  function applyPhysicalBindings(input:any,options:any={}) {
    const data=(o:any,keys:string[])=>{const prototype=o&&typeof o==='object'?Object.getPrototypeOf(o):undefined;if(!o||typeof o!=='object'||Array.isArray(o)||(prototype!==null&&Object.getPrototypeOf(prototype)!==null)||Reflect.ownKeys(o).some(k=>typeof k!=='string'||!keys.includes(k)||!Object.getOwnPropertyDescriptor(o,k)?.enumerable||!Object.prototype.hasOwnProperty.call(Object.getOwnPropertyDescriptor(o,k),'value')))throw Error('Invalid physical parameter edit.');return Object.fromEntries(Reflect.ownKeys(o).map((k:string)=>[k,Object.getOwnPropertyDescriptor(o,k).value]));};
    const args:any=data(input,['revision','changes','definitions']),opts:any=data(options,['signal','valid']);if(Reflect.ownKeys(args).sort().join(',')!=='changes,definitions,revision'||typeof args.revision!=='string'||!args.revision||args.revision.length>256||!Array.isArray(args.changes)||args.changes.length>256||Reflect.ownKeys(args.changes).length!==args.changes.length+1)throw Error('Invalid physical parameter edit.');
    if(opts.valid!==undefined&&typeof opts.valid!=='function')throw Error('Invalid lifetime guard.');if(opts.signal!==undefined)try{Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get.call(opts.signal)}catch{throw Error('Invalid cancellation signal.');}
    const changes=[];for(let i=0;i<args.changes.length;i++){const d=Object.getOwnPropertyDescriptor(args.changes,String(i));if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))throw Error('Invalid physical parameter edit.');const item:any=data(d.value,['index','featureId','type','field','parameter']);if(Reflect.ownKeys(item).sort().join(',')!=='featureId,field,index,parameter,type'||!Number.isSafeInteger(item.index)||item.index<0||item.index>255||!Number.isSafeInteger(item.featureId)||item.featureId<1||typeof item.type!=='string'||!Object.prototype.hasOwnProperty.call(physicalBindingFields,item.type)||!physicalBindingFields[item.type].includes(item.field)||typeof item.parameter!=='string'||!/^[A-Za-z_$][A-Za-z0-9_$]{0,127}$/.test(item.parameter))throw Error('Invalid physical parameter edit.');changes.push({index:item.index,featureId:item.featureId,type:item.type,field:item.field,value:item.parameter});}
    return physicalSharedOperation({revision:args.revision,source:encodeUpdatedPhysicalDefinitions(ctx.expressionService.script$.value,args.definitions),changes},opts);
  }

  function applyPhysicalSelectedProfile(input:any,options:any={}) {
    const data=(value:any,keys:string[])=>{const proto=value&&typeof value==='object'?Object.getPrototypeOf(value):undefined;if(!value||typeof value!=='object'||Array.isArray(value)||(proto!==null&&Object.getPrototypeOf(proto)!==null)||Reflect.ownKeys(value).length!==keys.length)throw Error('Expected exact selected-profile binding fields.');const out:any={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))throw Error('Binding fields must be own data.');out[key]=d.value;}return out;};
    const args=data(input,['revision','index','featureId','width','height','depth','definitions']),keys=Reflect.ownKeys(options||{});if(keys.some(key=>typeof key!=='string'||!['signal','valid'].includes(key)))throw Error('Invalid binding lifetime options.');const opts=data(options,keys as string[]);
    if(typeof args.revision!=='string'||!args.revision||args.revision.length>256||!Number.isSafeInteger(args.index)||args.index<0||args.index>255||!Number.isSafeInteger(args.featureId)||args.featureId<1||!['width','height','depth'].every(key=>typeof args[key]==='string'&&/^[A-Za-z_$][A-Za-z0-9_$]{0,127}$/.test(args[key])))throw Error('Use an inspected selected extrusion and named length bindings.');
    if(opts.valid!==undefined&&typeof opts.valid!=='function')throw Error('Invalid binding lifetime guard.');if(opts.signal!==undefined)try{Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get.call(opts.signal);}catch{throw Error('Invalid cancellation signal.');}
    return physicalSharedOperation({revision:args.revision,index:args.index,featureId:args.featureId,source:encodeUpdatedPhysicalDefinitions(ctx.expressionService.script$.value,args.definitions),selectedRectangle:{width:args.width,height:args.height},changes:[{index:args.index,featureId:args.featureId,type:'WORKER_SELECTED_PROFILE_EXTRUDE_V2',field:'depth',value:args.depth}]},opts);
  }

  function applyPhysicalEnclosure(input:any,options:any={}) {
    const data=(o:any,keys:string[])=>{const prototype=o&&typeof o==='object'?Object.getPrototypeOf(o):undefined;if(!o||typeof o!=='object'||Array.isArray(o)||(prototype!==null&&Object.getPrototypeOf(prototype)!==null)||Reflect.ownKeys(o).some(k=>typeof k!=='string'||!keys.includes(k)||!Object.getOwnPropertyDescriptor(o,k)?.enumerable||!Object.prototype.hasOwnProperty.call(Object.getOwnPropertyDescriptor(o,k),'value')))throw Error('Invalid enclosure parameter edit.');return Object.fromEntries(Reflect.ownKeys(o).map((k:string)=>[k,Object.getOwnPropertyDescriptor(o,k).value]));};
    const args:any=data(input,['revision','index','featureId','bindings','definitions']),opts:any=data(options,['signal','valid']);if(Reflect.ownKeys(args).sort().join(',')!=='bindings,definitions,featureId,index,revision'||typeof args.revision!=='string'||!args.revision||args.revision.length>256||!Number.isSafeInteger(args.index)||args.index<0||args.index>255||!Number.isSafeInteger(args.featureId)||args.featureId<1)throw Error('Invalid enclosure parameter edit.');
    if(opts.valid!==undefined&&typeof opts.valid!=='function')throw Error('Invalid lifetime guard.');if(opts.signal!==undefined)try{Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get.call(opts.signal)}catch{throw Error('Invalid cancellation signal.');}
    const request=modifications$.value.history[args.index],type=request?.type,allowed=physicalBindingFields[type];if(!['WORKER_ENCLOSURE_V1','WORKER_ENCLOSURE_V2'].includes(type)||!allowed||Number(request.params?.featureId)!==args.featureId)throw Error('The selected enclosure is unavailable.');
    const bindings:any=data(args.bindings,allowed),keys=Object.keys(bindings);if(!keys.length||keys.some(k=>typeof bindings[k]!=='string'||!/^[A-Za-z_$][A-Za-z0-9_$]{0,127}$/.test(bindings[k])))throw Error('Invalid enclosure parameter bindings.');
    const source=encodeUpdatedPhysicalDefinitions(ctx.expressionService.script$.value,args.definitions),changes=keys.map(field=>({index:args.index,featureId:args.featureId,type,field,value:bindings[field]}));return physicalSharedOperation({revision:args.revision,source,index:args.index,featureId:args.featureId,changes},opts);
  }

  function applyPhysicalBracket(args:any,options:any={}) {return physicalBracketOperation(args,options);}
  async function physicalBracketOperation(input:any,options:any={}) {
    const data=(object:any,allowed:string[])=>{const prototype=object&&typeof object==='object'?Object.getPrototypeOf(object):undefined;if(!object||typeof object!=='object'||Array.isArray(object)||(prototype!==null&&Object.getPrototypeOf(prototype)!==null)||Reflect.ownKeys(object).some(k=>typeof k!=='string'||!allowed.includes(k)||!Object.getOwnPropertyDescriptor(object,k)?.enumerable||!Object.prototype.hasOwnProperty.call(Object.getOwnPropertyDescriptor(object,k),'value')))throw new Error('Invalid bracket parameter edit.');return Object.fromEntries(Reflect.ownKeys(object).map((key:string)=>[key,Object.getOwnPropertyDescriptor(object,key).value]));};
    const args:any=data(input,['revision','faceId','index','featureId','width','height','offsetX','offsetY','definitions','direction']),opts:any=data(options,['signal','valid']),travel=args.direction!==undefined;
    const keys=travel?'direction,faceId,featureId,index,revision':'definitions,faceId,featureId,height,index,offsetX,offsetY,revision,width';
    if(Reflect.ownKeys(args).sort().join(',')!==keys||typeof args.revision!=='string'||!args.revision||args.revision.length>256||typeof args.faceId!=='string'||!args.faceId||args.faceId.length>1024||!Number.isSafeInteger(args.index)||args.index<0||!Number.isSafeInteger(args.featureId)||args.featureId<=0||(travel?!['undo','redo'].includes(args.direction):!['width','height','offsetX','offsetY'].every(k=>typeof args[k]==='string'&&/^[A-Za-z_$][A-Za-z0-9_$]{0,127}$/.test(args[k]))))throw new Error('Invalid bracket parameter edit.');
    if(opts.valid!==undefined&&typeof opts.valid!=='function')throw new Error('Invalid lifetime guard.');if(opts.signal!==undefined)try{Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get.call(opts.signal)}catch{throw new Error('Invalid cancellation signal.');}
    const proposedSource=travel?null:encodeUpdatedPhysicalDefinitions(ctx.expressionService.script$.value,args.definitions);
    if(!travel)return physicalSharedOperation({revision:args.revision,source:proposedSource,index:args.index,featureId:args.featureId,rectangle:{faceId:args.faceId,width:args.width,height:args.height},changes:['offsetX','offsetY'].map(field=>({index:args.index,featureId:args.featureId,type:'WORKER_FOUR_CORNER_THROUGH_HOLES_V1',field,value:args[field]}))},opts);
    throw new Error('This earlier in-memory parameter edit is unavailable.');
  }

  function authoredDepthOperation(args:any, options:any = {}) { return authoredFeatureOperation('extrusion',args,options); }
  function authoredRevolveAngleOperation(args:any,options:any={}) {return authoredFeatureOperation('revolve-angle',args,options);}
  function authoredSelectedProfileDepthOperation(args:any, options:any = {}) { return authoredFeatureOperation('selected-profile-depth',args,options); }
  function authoredSelectedProfileRegionOperation(args:any, options:any = {}) { return authoredFeatureOperation('selected-profile-region',args,options); }
  function authoredLinearHolePatternOperation(args:any, options:any = {}) { return authoredFeatureOperation('linear-hole-pattern',args,options); }
  function authoredThroughHoleOperation(args:any, options:any = {}) { return authoredFeatureOperation('through-hole',args,options); }
  function authoredSolidEdgeTreatmentOperation(args:any, options:any = {}) { return authoredFeatureOperation('solid-edge-treatment',args,options); }
  function authoredSolidShellOperation(args:any,options:any={}){return authoredFeatureOperation('solid-shell',args,options);}
  function authoredSolidBoxOperation(args:any, options:any = {}) { return authoredFeatureOperation('solid-box',args,options); }
  function authoredHoleOperation(kind:string,args:any,options:any = {}) { return authoredFeatureOperation(kind,args,options); }
  async function travelAuthoredSketch(args:any,target:any,options:any) {
    if(!prepareSketchJournalTravel)throw new Error('Authored sketch travel is unavailable.');
    if(!options||typeof options!=='object'||Array.isArray(options)||Reflect.ownKeys(options).some(k=>typeof k!=='string'||!['signal','valid'].includes(k)))throw new Error('Invalid command options.');
    const captured:any={};
    for(const key of Reflect.ownKeys(options)) {
      const d=Object.getOwnPropertyDescriptor(options,key);
      if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))throw new Error('Invalid command options.');
      captured[key as string]=d.value;
    }
    if(captured.valid!==undefined&&typeof captured.valid!=='function')throw new Error('Invalid lifetime guard.');
    if(captured.signal!==undefined)try{Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get.call(captured.signal)}catch{throw new Error('Invalid cancellation signal.')}
    const service:any=ctx.projectService,document=service.documentGeneration,storage=ctx.storageService,journal=authoredJournal$.value;
    const beforeState=modifications$.value, beforeRevision=modifications$.revision, key=service.sketchStorageKey(target.faceId);
    const before=storage.get(key), version=storage.versionOf(key), sketchVersions=sketchRevision(storage,service.sketchStorageNamespace);
    const manager:any=ctx.projectManager,materialSurface=manager.inspectMaterialSurfaceRevision();
    const check=()=>{
      const callerValid=!captured.valid||captured.valid()===true;
      if(!callerValid||captured.signal?.aborted||ctx.projectService!==service||ctx.storageService!==storage||ctx.projectManager!==manager||!service.isDocumentCurrent(document)||
         authoredJournal$.value!==journal||modifications$.value!==beforeState||modifications$.revision!==beforeRevision||
         storage.versionOf(key)!==version||storage.get(key)!==before||sketchRevision(storage,service.sketchStorageNamespace)!==sketchVersions||
         manager.inspectMaterialSurfaceRevision()!==materialSurface)throw superseded();
    };
    check();
    if(pendingPipelines||pendingModifications||!((ctx.craftService as any).inspectRectangleCreation().ready))throw new Error('The document is not ready for editing.');
    const plan=planSketchTravel(journal,{document,revision:journal.revision,direction:args.direction,faceId:target.faceId,currentBytes:before});
    let prepared:any;
    try {
      prepared=await prepareSketchJournalTravel(target.faceId,before,plan.bytes,{signal:captured.signal,
        valid:()=>{try{check();return true}catch{return false}},
        committedValid:()=>{try{return (!captured.valid||captured.valid()===true)&&!captured.signal?.aborted&&ctx.projectService===service&&service.isDocumentCurrent(document)&&ctx.storageService===storage&&ctx.projectManager===manager}catch{return false}}});
      check();
      if(!prepared?.preparation||typeof prepared.dispose!=='function')throw new Error('Sketch travel preparation failed.');
      await new Promise<void>((yes,no)=>submitPreparedReplay(yes,no,prepared.preparation,
        {kind:'sketch-travel',faceId:target.faceId,before,after:plan.bytes,direction:args.direction}));
      return Object.freeze({changed:true,revision:inspectAuthoredEdits().revision,faceId:target.faceId});
    } catch(error) {
      let alive=false;
      try {alive=(!captured.valid||captured.valid()===true)&&!captured.signal?.aborted&&ctx.projectService===service&&
        service.isDocumentCurrent(document)&&ctx.storageService===storage&&ctx.projectManager===manager;} catch (_) { /* closed */ }
      if(!alive&&!error?.committed)throw superseded();
      throw error;
    } finally {try{prepared?.dispose?.()}catch(error){console.error('Sketch travel cleanup failed:',error)}}
  }
  async function authoredFeatureOperation(kind:string,args: any, options: any = {}) {
    if(!['revolve-angle','extrusion','centered','corners','solid-box','selected-profile-depth','selected-profile-region','solid-edge-treatment','solid-shell','through-hole','linear-hole-pattern','operation-append','operation-remove','through-hole-parent'].includes(kind))throw new Error('Unsupported authored edit.');
    const ownKeys = args && typeof args === 'object' && !Array.isArray(args) ? Reflect.ownKeys(args) : [];
    if (ownKeys.some(k=>typeof k!=='string' || !Object.getOwnPropertyDescriptor(args,k)?.enumerable || !Object.prototype.hasOwnProperty.call(Object.getOwnPropertyDescriptor(args,k),'value'))) throw new Error('Invalid authored depth command.');
    const keys = ownKeys.sort().join(',');
    const editKeys=kind==='solid-shell'?'featureId,index,revision,thickness':kind==='operation-remove'?'featureId,index,revision':kind==='through-hole-parent'?['revision','index','featureId','target','producerFeatureId','sourceFeatureId','sourceFaceId','sourceRegionId'].sort().join(','):kind==='revolve-angle'?'angleRadians,featureId,index,revision':kind==='selected-profile-region'?'featureId,index,regionId,revision':kind==='linear-hole-pattern'?'count,featureId,index,revision,spacing':kind==='operation-append'?'direction,featureId,index,revision':kind==='through-hole'?(ownKeys.includes('offsetX')||ownKeys.includes('offsetY')?'diameter,featureId,index,offsetX,offsetY,revision':'diameter,featureId,index,revision'):kind==='solid-edge-treatment'?'featureId,index,revision,size':kind==='solid-box'?'depth,engine,featureId,height,index,revision,width,x,y,z':['extrusion','selected-profile-depth'].includes(kind)?'depth,featureId,index,revision':kind==='centered'?'diameter,featureId,index,revision':'diameter,featureId,index,offsetX,offsetY,revision';
    if (![editKeys,'direction,featureId,index,revision'].includes(keys) ||
        (Object.prototype.hasOwnProperty.call(args,'direction') && !['undo','redo'].includes(args.direction))) {
      throw new Error('Invalid authored depth command.');
    }
    args=Object.fromEntries(ownKeys.map(key=>[key,Object.getOwnPropertyDescriptor(args,key).value]));
    if (!options || typeof options!=='object' || Array.isArray(options) ||
        Reflect.ownKeys(options).some(k=>typeof k!=='string'||!['signal','valid','beforePublish'].includes(k))) throw new Error('Invalid command options.');
    for(const key of Reflect.ownKeys(options)) {
      const descriptor=Object.getOwnPropertyDescriptor(options,key);
      if(!descriptor?.enumerable || !Object.prototype.hasOwnProperty.call(descriptor,'value'))throw new Error('Invalid command options.');
    }
    options=Object.fromEntries(Reflect.ownKeys(options).map(key=>[key,Object.getOwnPropertyDescriptor(options,key).value]));
    if(options.valid!==undefined&&typeof options.valid!=='function')throw new Error('Invalid lifetime guard.');
    if(options.beforePublish!==undefined&&typeof options.beforePublish!=='function')throw new Error('Invalid publication guard.');
    if(options.signal!==undefined)try {Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get.call(options.signal);}catch{throw new Error('Invalid cancellation signal.');}
    const service:any = ctx.projectService, document = service.documentGeneration;
    const manager:any=ctx.projectManager, storage=ctx.storageService;
    const sketchNamespace=service.sketchStorageNamespace;
    const sourceSketchRevision=sketchRevision(storage,sketchNamespace);
    const trackedStreams=()=>[modifications$,models$,pipelineFailure$,engineCleanupFailure$,
      ctx.expressionService.script$,ctx.expressionService.list$,ctx.expressionService.errors$,
      ...(['revolve-angle','selected-profile-depth','selected-profile-region','solid-edge-treatment','solid-shell','through-hole','linear-hole-pattern','operation-append','operation-remove','through-hole-parent'].includes(kind)?[ctx.expressionService.table$]:[]),
      ctx.streams.sketcher.sketchingFace,ctx.wizardService.workingRequest$,
      ctx.workbenchService.currentWorkbench$,ctx.assemblyService.constraints$];
    const capturedStreams=trackedStreams(), streamRevisions=capturedStreams.map(s=>s.revision);
    const trackedServices=()=>[ctx.projectService,ctx.storageService,ctx.craftService,ctx.cadRegistry,
      ctx.operationService,ctx.expressionService,ctx.projectManager,ctx.services.sketcher,
      ctx.wizardService,ctx.workbenchService,ctx.assemblyService];
    const capturedServices=trackedServices();
    const readiness=(ctx.craftService as any).inspectRectangleCreation();
    if(['revolve-angle','selected-profile-depth','selected-profile-region','solid-edge-treatment','solid-shell','through-hole','linear-hole-pattern'].includes(kind)&&(ctx.expressionService.isTyped||ctx.expressionService.script$.value.trim()||Reflect.ownKeys((ctx.expressionService.table$ as any).value||{}).length))throw Object.assign(Error(kind==='linear-hole-pattern'?'Linear-hole-pattern edits currently require untyped local constants without project parameter bindings.':kind==='through-hole'?'Through-hole dimension edits currently require untyped local constants without project parameter bindings.':kind==='solid-edge-treatment'?'Edge-treatment size edits currently require untyped local constants without project parameter bindings.':'Selected-profile edits currently require untyped local constants without project parameter bindings.'),{code:'UNSUPPORTED_PARAMETERS'});
    if(!readiness.ready)throw new Error(readiness.reason || 'The document is not ready for editing.');
    const before = modifications$.value, journal = authoredJournal$.value;
    const initialRevision = modifications$.revision;
    if (!service.hasHostLifetime || !service.isDocumentCurrent(document) || pendingPipelines || pendingModifications ||
        before.pointer !== before.history.length - 1 || pipelineFailure$.value || engineCleanupFailure$.value) {
      throw new Error('Return to a valid full model before editing.');
    }
    if (!args || args.revision !== inspectAuthoredEdits().revision || journal.document !== document) throw Object.assign(new Error('Authored edit history is stale.'),{code:'STALE_HISTORY'});
    const materialSurfaceRevision=manager.inspectMaterialSurfaceRevision();
    if (sourceSketchRevision!==fullTipSketchRevision || materialSurfaceRevision!==fullTipMaterialSurfaceRevision) {
      throw new Error('The accepted model is stale; rebuild before editing.');
    }
    const check = () => {
      const callbacksValid=(!options.valid || options.valid()===true) &&
        (!options.beforePublish || options.beforePublish()===true);
      if (!callbacksValid || options.signal?.aborted || ctx.projectService !== service ||
          ctx.projectManager!==manager || ctx.storageService!==storage || service.sketchStorageNamespace!==sketchNamespace ||
          sketchRevision(storage,sketchNamespace)!==sourceSketchRevision ||
          manager.inspectMaterialSurfaceRevision()!==materialSurfaceRevision ||
          trackedServices().some((s,i)=>s!==capturedServices[i]) ||
          trackedStreams().some((s,i)=>s!==capturedStreams[i] || s.revision!==streamRevisions[i]) ||
          !service.isDocumentCurrent(document) || modifications$.value !== before ||
          modifications$.revision !== initialRevision || authoredJournal$.value !== journal) throw superseded();
    };
    check();
    const appendTravel=kind==='operation-append',removeOperation=kind==='operation-remove',removeUndo=removeOperation&&args.direction==='undo';
    if(appendTravel&&(!ownedPipelineHistories.has(before.history)||journalHeadDefinition!==before.history))throw Error('The accepted owned history is unavailable.');
    const captured = appendTravel?{history:before.history,signature:null}:await captureAuthoredHistory(before.history, check);
    if(removeOperation&&!removeUndo&&nativeAttachmentDependents(captured.history,args.featureId).length)throw Object.assign(Error('Repair the attached source before removing its native parent.'),{code:'ACTIVE_DEPENDENTS'});
    if (!appendTravel&&(!fullTipSignature || captured.signature !== fullTipSignature)) throw new Error('The accepted full-tip history is unavailable or changed.');
    const index = args.index, request = captured.history[index];
    if(request)requireActiveFeature(request);
    const expectedType=kind==='solid-shell'?'WORKER_SOLID_SHELL_V1':removeOperation?'WORKER_SELECTED_PROFILE_EXTRUDE_V2':kind==='through-hole-parent'?'WORKER_THROUGH_HOLES_V1':kind==='revolve-angle'?'WORKER_SELECTED_PROFILE_REVOLVE_V1':kind==='linear-hole-pattern'?'WORKER_LINEAR_HOLE_PATTERN_V1':kind==='through-hole'?'WORKER_THROUGH_HOLES_V1':kind==='solid-edge-treatment'?'WORKER_SOLID_EDGE_TREATMENT_V1':['selected-profile-depth','selected-profile-region'].includes(kind)?'WORKER_SELECTED_PROFILE_EXTRUDE_V2':kind==='solid-box'?'WORKER_SOLID_BOX_V1':kind==='extrusion'?'WORKER_RECTANGLE_EXTRUDE_V1':kind==='centered'?'WORKER_CENTERED_THROUGH_HOLE_V1':'WORKER_FOUR_CORNER_THROUGH_HOLES_V1';
    if (!appendTravel&&!removeUndo&&(!Number.isSafeInteger(index) || index < 0 || !request || request.type !== expectedType ||
        Number(request.params?.featureId) !== args.featureId)) throw new Error('The selected feature is unavailable.');
    if(kind==='extrusion' && typeof request.params.length==='string')throw new Error('This extrusion depth is parameter-bound. Edit its typed parameter instead.');
    let proposal, nextAngle, nextDepth, nextRegion, nextDimensions, nextSize, nextThickness, appendPlan, appendDefinition, removedDefinition;
    if(appendTravel){
      appendPlan=planOperationAppendTravel(journal,{document,revision:journal.revision,direction:args.direction,index,featureId:args.featureId,currentLength:before.history.length,currentOperation:args.direction==='undo'?request:null,previousFeatureId:index?Number(before.history[index-1]?.params.featureId):null});
      appendDefinition=Object.freeze(args.direction==='undo'?before.history.slice(0,-1):[...before.history,appendPlan.operation]);
      ownedPipelineHistories.add(appendDefinition);proposal=appendPlan.next;
    } else if(removeOperation) {
      if(!Number.isSafeInteger(index)||index<0||index>captured.history.length)throw Error('The deleted feature position is unavailable.');
      if(removeUndo&&captured.history.some(op=>Number(op.params?.featureId)===args.featureId))throw Error('The removed feature identity is already present.');
      const previousFeatureId=index?Number(captured.history[index-1]?.params.featureId):null,
        nextFeatureId=index+(removeUndo?0:1)<captured.history.length?Number(captured.history[index+(removeUndo?0:1)]?.params.featureId):null;
      if(args.direction){
        const plan=planOperationRemoveTravel(journal,{document,revision:journal.revision,direction:args.direction,index,featureId:args.featureId,currentLength:captured.history.length,currentOperation:removeUndo?null:request,previousFeatureId,nextFeatureId});
        proposal=plan.next;
        removedDefinition=removeUndo?[...captured.history.slice(0,index),plan.operation,...captured.history.slice(index)]:captured.history.filter((_,i)=>i!==index);
      }else{
        proposal=recordOperationRemove(journal,{document,revision:journal.revision,index,operation:request,previousFeatureId,nextFeatureId,currentLength:captured.history.length});
        removedDefinition=captured.history.filter((_,i)=>i!==index);
      }
    } else if(kind==='through-hole-parent') {
      const parameters:any=captureThroughHoleParameters(request.params);
      let parent;
      if(args.direction){const plan=planThroughHoleParentRepairTravel(journal,{document,revision:journal.revision,direction:args.direction,index,featureId:args.featureId,parameters});proposal=plan.next;parent=captureThroughHoleParentBinding(Object.fromEntries(['target','producerFeatureId','sourceFeatureId','sourceFaceId','sourceRegionId'].map(key=>[key,plan.parameters[key]])));}
      else{parent=captureThroughHoleParentBinding(Object.fromEntries(['target','producerFeatureId','sourceFeatureId','sourceFaceId','sourceRegionId'].map(key=>[key,args[key]])));proposal=recordThroughHoleParentRepair(journal,{document,revision:journal.revision,index,featureId:args.featureId,parameters,after:parent});}
      captureThroughHoleParameters({...parameters,...parent});
      for(const key of Object.keys(parent))request.params[key]=parent[key];
    } else if(kind==='revolve-angle') {
      const parameters:any=captureOwnedRevolveFeature(request.params);
      if(args.direction){const plan=planRevolveAngleTravel(journal,{document,revision:journal.revision,direction:args.direction,index,featureId:args.featureId,parameters});proposal=plan.next;nextAngle=plan.angleRadians;}
      else {nextAngle=args.angleRadians;captureOwnedRevolveFeature({...parameters,angleRadians:nextAngle});if(Object.is(nextAngle,parameters.angleRadians))return Object.freeze({changed:false,revision:inspectAuthoredEdits().revision});proposal=recordRevolveAngleEdit(journal,{document,revision:journal.revision,index,featureId:args.featureId,parameters,after:nextAngle});}
      request.params.angleRadians=nextAngle;
    } else if(kind==='linear-hole-pattern') {
      const parameters:any=captureLinearHolePatternParameters(request.params);
      if(args.direction){const plan=planLinearHolePatternTravel(journal,{document,revision:journal.revision,direction:args.direction,index,featureId:args.featureId,parameters});proposal=plan.next;nextDimensions=plan.dimensions;}
      else {nextDimensions={count:args.count,spacing:args.spacing};captureLinearHolePatternParameters({...parameters,...nextDimensions});if(nextDimensions.count===parameters.count&&nextDimensions.spacing===parameters.spacing)return Object.freeze({changed:false,revision:inspectAuthoredEdits().revision});proposal=recordLinearHolePatternEdit(journal,{document,revision:journal.revision,index,featureId:args.featureId,parameters,after:nextDimensions});}
      request.params.count=nextDimensions.count;request.params.spacing=nextDimensions.spacing;
    } else if(kind==='through-hole') {
      const parameters:any=captureThroughHoleParameters(request.params),fields=parameters.kind==='centered-through'?['diameter']:['diameter','offsetX','offsetY'];
      if(!args.direction&&fields.some(key=>typeof parameters[key]!=='number'))throw Object.assign(Error('Edit the authoritative typed parameter rather than replacing its binding.'),{code:'UNSUPPORTED_PARAMETERS'});
      if(args.direction){const plan=planThroughHoleTravel(journal,{document,revision:journal.revision,direction:args.direction,index,featureId:args.featureId,parameters});proposal=plan.next;nextDimensions=plan.dimensions;}
      else {
        if(Object.keys(args).sort().join(',')!==['revision','index','featureId',...fields].sort().join(','))throw Error('Use the exact dimensions of this authored through-hole kind.');
        nextDimensions=Object.fromEntries(fields.map(key=>[key,args[key]]));
        // Validate even no-op edits, preserving the exact captured identity.
        captureThroughHoleParameters({...parameters,...nextDimensions});
        if(fields.every(key=>nextDimensions[key]===parameters[key]))return Object.freeze({changed:false,revision:inspectAuthoredEdits().revision});
        proposal=recordThroughHoleEdit(journal,{document,revision:journal.revision,index,featureId:args.featureId,parameters,after:nextDimensions});
      }
      for(const key of fields)request.params[key]=nextDimensions[key];
    } else if(kind==='solid-shell') {
      const parameters:any=captureSolidShellParameters(request.params);
      if(args.direction){const plan=planSolidShellTravel(journal,{document,revision:journal.revision,direction:args.direction,index,featureId:args.featureId,parameters});proposal=plan.next;nextThickness=plan.thickness;}
      else{nextThickness=args.thickness;captureSolidShellParameters({...parameters,thickness:nextThickness});if(Object.is(nextThickness,parameters.thickness))return Object.freeze({changed:false,revision:inspectAuthoredEdits().revision});proposal=recordSolidShellEdit(journal,{document,revision:journal.revision,index,featureId:args.featureId,parameters,after:nextThickness});}
      request.params.thickness=nextThickness;
    } else if(kind==='solid-edge-treatment') {
      const parameters:any=captureSolidEdgeTreatmentParameters(request.params);
      if(args.direction){const plan=planSolidEdgeTreatmentTravel(journal,{document,revision:journal.revision,direction:args.direction,index,featureId:args.featureId,parameters});proposal=plan.next;nextSize=plan.size;}
      else {nextSize=args.size;if(nextSize===parameters.size)return Object.freeze({changed:false,revision:inspectAuthoredEdits().revision});proposal=recordSolidEdgeTreatmentEdit(journal,{document,revision:journal.revision,index,featureId:args.featureId,parameters,after:nextSize});}
      request.params.size=nextSize;
    } else if(kind==='selected-profile-region') {
      const parameters:any=captureSelectedProfileDepthParameters(request.params);
      if(args.direction){const plan=planSelectedProfileRegionTravel(journal,{document,revision:journal.revision,direction:args.direction,index,featureId:args.featureId,parameters});proposal=plan.next;nextRegion=plan.regionId;}
      else {nextRegion=args.regionId;captureSelectedProfileDepthParameters({...parameters,regionId:nextRegion});if(nextRegion===parameters.regionId)return Object.freeze({changed:false,revision:inspectAuthoredEdits().revision});proposal=recordSelectedProfileRegionEdit(journal,{document,revision:journal.revision,index,featureId:args.featureId,parameters,after:nextRegion});}
      request.params.regionId=nextRegion;
    } else if(kind==='selected-profile-depth') {
      const parameters:any=captureSelectedProfileDepthParameters(request.params);
      if(!args.direction&&typeof parameters.depth!=='number')throw Object.assign(Error('Edit the authoritative typed parameter rather than replacing its depth binding.'),{code:'UNSUPPORTED_PARAMETERS'});
      if(args.direction){const plan=planSelectedProfileDepthTravel(journal,{document,revision:journal.revision,direction:args.direction,index,featureId:args.featureId,parameters});proposal=plan.next;nextDepth=plan.depth;}
      else {nextDepth=args.depth;if(nextDepth===parameters.depth)return Object.freeze({changed:false,revision:inspectAuthoredEdits().revision});proposal=recordSelectedProfileDepthEdit(journal,{document,revision:journal.revision,index,featureId:args.featureId,parameters,after:nextDepth});}
      request.params.depth=nextDepth;
    } else if (kind==='solid-box') {
      const fields=['x','y','z','width','depth','height'], current=Object.fromEntries(fields.map(key=>[key,request.params[key]])),engine=request.params.engine,engineRevision=request.params.engineRevision;
      if(args.direction){const plan=planSolidBoxTravel(journal,{document,revision:journal.revision,direction:args.direction,index,featureId:args.featureId,engine,engineRevision,current});proposal=plan.next;nextDimensions=plan.values;}
      else {if(args.engine!==engine)throw new Error('The solid engine cannot be changed by a dimension edit.');nextDimensions=Object.fromEntries(fields.map(key=>[key,args[key]]));if(fields.every(key=>Object.is(nextDimensions[key],current[key])))return Object.freeze({changed:false,revision:inspectAuthoredEdits().revision});proposal=recordSolidBoxEdit(journal,{document,revision:journal.revision,index,featureId:args.featureId,engine,engineRevision,before:current,after:nextDimensions});}
      for(const key of fields)request.params[key]=nextDimensions[key];
    } else if (kind!=='extrusion') {
      const fields=kind==='centered'?['diameter']:['diameter','offsetX','offsetY'];
      const currentDimensions=Object.fromEntries(fields.map(key=>[key,request.params[key]]));
      if(args.direction) {
        const plan=planHoleTravel(journal,{document,revision:journal.revision,direction:args.direction,index,featureId:args.featureId,currentDimensions});
        if(plan.kind!==kind)throw new Error('The authored feature no longer matches this edit.');
        proposal=plan.next;nextDimensions=plan.dimensions;
      } else {
        if (fields.every(key=>typeof args[key]==='number' && Number.isFinite(args[key]) && args[key]>0 && args[key]<=1e6 && args[key]===currentDimensions[key])) {
          return Object.freeze({changed:false,revision:inspectAuthoredEdits().revision});
        }
        const intent=captureHoleEdit(kind,args,{revision:args.revision,pointer:captured.history.length-1,history:captured.history});
        proposal=recordHoleEdit(journal,{document,revision:journal.revision,index,featureId:args.featureId,kind,before:intent.before,after:intent.after});
        nextDimensions=intent.after;
      }
      for(const key of fields)request.params[key]=nextDimensions[key];
    } else if (args.direction) {
      const plan = planExtrusionTravel(journal,{document,revision:journal.revision,direction:args.direction,
        index,featureId:args.featureId,currentDepth:request.params.length});
      proposal=plan.next; nextDepth=plan.depth;
    } else {
      nextDepth=args.depth;
      if (nextDepth === request.params.length) return Object.freeze({changed:false,revision:inspectAuthoredEdits().revision});
      proposal=recordExtrusionEdit(journal,{document,revision:journal.revision,index,featureId:args.featureId,
        before:request.params.length,after:nextDepth});
    }
    if(kind==='extrusion')request.params.length=nextDepth;
    const expected = captured.signature;
    const nextCapture = appendTravel?{history:appendDefinition,signature:null}:await captureAuthoredHistory(removeOperation?removedDefinition:captured.history, check);
    if(appendTravel){check();if(journalHeadDefinition!==before.history)throw superseded();}
    else if ((await captureAuthoredHistory(before.history, check)).signature !== expected) throw superseded();
    const nextState = {history:nextCapture.history, pointer:nextCapture.history.length-1};
    const scope:{epoch:number|null}={epoch:null};
    const nativeSourceReplay=['selected-profile-depth','selected-profile-region'].includes(kind)&&hasNativeSourceAttachments(before.history)?issueNativeSourceReplay(ctx,{history:nextCapture.history,kind,direction:args.direction,expectedSketches:args.direction?planNativeSourceTravel(journal,args.direction,id=>ctx.sketchStorageService.getSketchData(id)):undefined,requireCurrent:check}):undefined;
    const preparation:PreparedSketchCommand = {
      ...(nativeSourceReplay?{nativeSourceReplay}:{}),
      candidateScope:scope, requireCurrent:check,
      requireCommittedCurrent() {
        // Notification observers may queue caller loss after the synchronous
        // publication guard but before the awaited command continuation.
        // Publication already happened: reject honestly without rolling back.
        let current=false;
        try {current=!options.signal?.aborted && (!options.valid || options.valid()===true) && ctx.projectService===service && service.hasHostLifetime && ctx.projectManager===manager && ctx.storageService===storage && service.isDocumentCurrent(document);} catch (_) { /* caller loss is a committed refusal */ }
        if(!current)throw superseded(true);
      },
      async prepare() {
        if(appendTravel){check();if(journalHeadDefinition!==before.history)throw superseded();}
        else if ((await captureAuthoredHistory(before.history,check)).signature !== expected) throw superseded();
        return null;
      }
    };
    let settled=false;
    const stop=()=>{if(!settled && scope.epoch!==null && scope.epoch===evaluationEpoch)engineResources.cancelCandidates();};
    const timer=setInterval(()=>{
      try {
        if (options.signal?.aborted || (options.valid && options.valid()!==true) || !service.isDocumentCurrent(document) ||
            ctx.storageService!==storage || sketchRevision(storage,sketchNamespace)!==sourceSketchRevision ||
            manager.inspectMaterialSurfaceRevision()!==materialSurfaceRevision ||
            trackedStreams().some((s,i)=>s!==capturedStreams[i] || s.revision!==streamRevisions[i])) stop();
      }
      catch (_) { stop(); }
    },100);
    options.signal?.addEventListener('abort',stop,{once:true});
    try {
      check();
      if (pendingPipelines || pendingModifications) throw new Error('Another operation is still in progress.');
      await new Promise<void>((yes,no)=>{
        pendingModifications++;
        modificationCallbacks.set(nextState,{onAccepted:yes,onError:no,preparation,journalProposal:proposal,journalSignature:nextCapture.signature});
        modifications$.next(nextState);
        try {
          if (ctx.projectService!==service || ctx.projectManager!==manager || ctx.storageService!==storage ||
              sketchRevision(storage,sketchNamespace)!==sourceSketchRevision || manager.inspectMaterialSurfaceRevision()!==materialSurfaceRevision ||
              !service.isDocumentCurrent(document)) stop();
        } catch (_) {stop();}
      });
      preparation.requireCommittedCurrent();
      return Object.freeze({changed:true,revision:inspectAuthoredEdits().revision,featureId:args.featureId,index,
        ...(['operation-remove','through-hole-parent'].includes(kind)?{}:appendTravel?{operationType:appendPlan.operation.type,direction:args.direction}:kind==='revolve-angle'?{angleRadians:nextAngle}:kind==='selected-profile-region'?{regionId:nextRegion}:kind==='solid-shell'?{thickness:nextThickness}:kind==='solid-edge-treatment'?{size:nextSize}:['extrusion','selected-profile-depth'].includes(kind)?{depth:nextDepth}:{dimensions:nextDimensions})});
    } finally {settled=true;clearInterval(timer);options.signal?.removeEventListener('abort',stop);}
  }

  function reset(modifications: OperationRequest[], options?: {documentGeneration: number}) {
    const service = ctx.projectService as any;
    if (options) {
      if (!service.isDocumentCurrent(options.documentGeneration)) throw new Error('The document reset belongs to a stale document.');
    } else {
      service.beginDocumentChange();
    }
    (ctx.projectManager as any)?.resetDocumentState?.(service.documentGeneration);
    modifications$.next({
      history: modifications,
      pointer: modifications.length - 1
    });
  }

  function rebuild() {
    const mods = modifications$.value;
    modifications$.next({history: [], pointer: -1});
    modifications$.next(mods);
  }

  function runRequest(request, operationContext = ctx, expected?: {descriptor:any;run:any;admit:any}): Promise<OperationResult> {
    clearImplicitModels();
    try {
      const op = ctx.operationService.get(request.type);
      if (!op) {
        return Promise.reject(new Error(`unknown operation ${request.type}`));
      }

      const run = op.run, admit = op.admitGeometry;
      const requireOperation = () => {
        if (expected && (ctx.operationService.get(request.type) !== expected.descriptor || op !== expected.descriptor ||
            run !== expected.run || admit !== expected.admit || op.run !== run || op.admitGeometry !== admit)) throw superseded();
      };
      requireOperation();
      const params: any = {};
      const errors = [];
      materializeParams(operationContext, request.params, op.schema, params, errors);
      if (errors.length) {
        return Promise.reject(new CadError({
          kind: CadError.KIND.INVALID_PARAMS,
          userMessage: errors.map(err => `${err.path.join('.')}: ${err.message}`).join('\n')
        }));
      }

      requireOperation();
      if (admit) admit.call(op, params, operationContext);
      // The whole shell inventory is needed only for implicit Boolean targets.
      else assertLegacyOperationInputs(params, params?.boolean?.kind && params.boolean.kind !== 'NONE' && !params.boolean.targets?.length ? operationContext.cadRegistry.shells : []);
      const result = run.call(op, params, operationContext, request.params);
      // @ts-ignore
      return result.then ? result : Promise.resolve(result);
    } catch (e) {
      return Promise.reject(e);
    } finally {
      clearImplicitModels();
    }
  }


   ctx.craftService  = {

     get evaluationEpoch() { return evaluationEpoch; },
     get engineResourceUsage() { return engineResources.usage; },

     get isProcessing() {
       return pendingModifications > 0 || pendingPipelines > 0;
     },

     get isEditingHistory() {
       const mods = this.modifications$.value;
       return mods && mods.pointer !== mods.history.length - 1;
     },

     modify, modifyInHistoryAndStep, beginCenteredParentRepair:(input,options)=>beginCenteredParentRepair(input,options), repairCenteredParent:(input,options)=>repairCenteredParent(input,options), reset, rebuild, runRequest, runPipeline,
    historyTravel: historyTravel(modifications$),
    cancelHistoryReviewDraft,navigateHistoryPosition,
    modifications$, models$, update$, pipelineFailure$, engineCleanupFailure$
  };
  Object.assign(ctx.craftService, {captureManufacturingEditContext,commitManufacturingMetadata,authoredRevolveAngleOperation,inspectAuthoredEdits, authoredDepthOperation, authoredHoleOperation, authoredSolidBoxOperation, authoredSelectedProfileDepthOperation, authoredSolidEdgeTreatmentOperation, authoredSolidShellOperation, authoredLinearHolePatternOperation, authoredThroughHoleOperation, authoredEditTravel, applyPhysicalDepth, inspectPhysicalParameters, applyPhysicalConfigurations, applyPhysicalBracket, applyPhysicalEnclosure, applyPhysicalSelectedProfile, applyPhysicalBindings});
  registerUnconsumedSketchSave(ctx,face=>{
    const service:any=ctx.projectService,storage=ctx.storageService,manager:any=ctx.projectManager,document=service.documentGeneration,history=modifications$.value,journal=authoredJournal$.value,namespace=service.sketchStorageNamespace;
    if(!face||typeof face.id!=='string'||face.defaultSketchId!==face.id||!fullTipSignature||!hasOnlyUnconsumedSketchHistory(history.history,face.id)||history.pointer!==history.history.length-1||pendingPipelines||pendingModifications||pipelineFailure$.value||engineCleanupFailure$.value||!service.hasHostLifetime||!service.isDocumentCurrent(document)||ctx.cadRegistry.findFace(face.id)!==face)return null;
    const key=service.sketchStorageKey(face.id),source=storage.get(key),keyVersion=storage.versionOf(key),tip=fullTipSketchRevision,tipSignature=fullTipSignature,material=fullTipMaterialSurfaceRevision,historyRevision=modifications$.revision,modelsRevision=models$.revision,journalRevision=authoredJournal$.revision,epoch=evaluationEpoch,registry=ctx.cadRegistry,craft=ctx.craftService,expressions:any=ctx.expressionService,expressionStreams:any[]=[expressions.script$,expressions.list$,expressions.errors$,expressions.table$],expressionVersions=expressionStreams.map(x=>x.revision);
    if(tip===null||tip!==sketchRevision(storage,namespace)||material!==manager.inspectMaterialSurfaceRevision())return null;
    let baseline=Object.freeze({source,keyVersion,tip,journal,journalRevision});
    const stable=()=>ctx.projectService===service&&ctx.storageService===storage&&ctx.services.storage===storage&&ctx.projectManager===manager&&ctx.cadRegistry===registry&&ctx.craftService===craft&&ctx.expressionService===expressions&&expressionStreams.every((x,i)=>x.revision===expressionVersions[i])&&service.isDocumentCurrent(document)&&service.sketchStorageNamespace===namespace&&registry.findFace(face.id)===face&&modifications$.value===history&&modifications$.revision===historyRevision&&models$.revision===modelsRevision&&evaluationEpoch===epoch&&!pendingPipelines&&!pendingModifications&&!pipelineFailure$.value&&!engineCleanupFailure$.value&&fullTipSignature===tipSignature&&fullTipMaterialSurfaceRevision===material&&manager.inspectMaterialSurfaceRevision()===material;
    const current=()=>stable()&&authoredJournal$.value===baseline.journal&&authoredJournal$.revision===baseline.journalRevision&&fullTipSketchRevision===baseline.tip&&sketchRevision(storage,namespace)===baseline.tip&&storage.versionOf(key)===baseline.keyVersion&&storage.get(key)===baseline.source;
    return Object.freeze({commit(data:string){
      if(typeof data!=='string'||!current())throw Error('The authored sketch changed; reopen before saving.');
      // The empty-prefix counter tracks all version allocations, including
      // unrelated project-cache writes; prepareWrites then binds the map revision.
      const allocated=storage.namespaceRevision('');
      if(typeof allocated!=='number'||!Number.isSafeInteger(allocated)||allocated<0||allocated>=Number.MAX_SAFE_INTEGER||!Number.isSafeInteger(baseline.journalRevision)||baseline.journalRevision>=Number.MAX_SAFE_INTEGER)throw Error('Sketch save versions are exhausted.');
      const nextJournal=emptyAuthoredEditJournal(document,baseline.journal.revision+1);
      const next=Object.freeze({source:data,keyVersion:allocated+1,tip:knownOwnSketchSaveTip(baseline.tip,key,allocated+1),journal:nextJournal,journalRevision:baseline.journalRevision+1});
      commitUnconsumedSketchSave({data,current,preparePublication:()=>prepareStateBatch([{stream:authoredJournal$,value:nextJournal}]),prepareWrites:value=>storage.prepareWrites([{key,value}]),afterCommit:()=>{
        // Rearm only our exact installed map and journal, before any observer.
        // Foreign/ABA writes during notification can never become this baseline.
        let installed=false;try{installed=stable()&&fullTipSketchRevision===baseline.tip&&authoredJournal$.value===next.journal&&authoredJournal$.revision===next.journalRevision&&storage.versionOf(key)===next.keyVersion&&storage.get(key)===next.source&&sketchRevision(storage,namespace)===next.tip}catch{}
        if(!installed)throw superseded(true);
        journalHeadSignature=null;fullTipSketchRevision=next.tip;baseline=next;
      },valid:()=>service.isDocumentCurrent(document)&&ctx.projectService===service&&ctx.storageService===storage,superseded});
    }});
  });

  // @ts-ignore
  ctx.services.craft = ctx.craftService;
  const rectangleCommands = createRectangleCreationCommands(ctx, (request, accepted, rejected, preparation) =>
    submitModification(request, addModification, accepted, rejected, false, preparation));
  Object.assign(ctx.craftService, rectangleCommands);
  Object.assign(ctx.craftService, createEmptySketchCreationCommands(ctx, (request, accepted, rejected, preparation) =>
    submitModification(request, addModification, accepted, rejected, false, preparation)));
  const rectangleEditing = createRectangleEditingCommands(ctx, submitPreparedReplay,
    epoch => { if (epoch === evaluationEpoch) engineResources.cancelCandidates(); });
  Object.assign(ctx.craftService, rectangleEditing);
  const closedSketchCommands=createClosedSketchTransitionCommands(ctx,submitPreparedReplay,
    epoch => { if (epoch === evaluationEpoch) engineResources.cancelCandidates(); },
    callback => {
      if (prepareSketchJournalTravel || typeof callback !== 'function') throw new Error('Sketch journal travel is already registered.');
      prepareSketchJournalTravel = callback;
    });
  Object.assign(ctx.craftService, closedSketchCommands);
  sourceFrameCommands=createSourceFrameCommands(ctx,submitPreparedReplay,epoch=>{if(epoch===evaluationEpoch)engineResources.cancelCandidates();});
  Object.assign(ctx.craftService,{inspectSourceFrames:sourceFrameCommands.inspectSourceFrames,createSourceFrame:sourceFrameCommands.createSourceFrame,editSourceFrame:sourceFrameCommands.editSourceFrame,repairSourceFrameParent:sourceFrameCommands.repairSourceFrameParent,inspectSourceFramePoints:sourceFrameCommands.inspectSourceFramePoints});
  sourcePlaneDepthCommands=createSourcePlaneDepthCommands(ctx,submitPreparedReplay,epoch=>{if(epoch===evaluationEpoch)engineResources.cancelCandidates();},sourceFrameCommands.editPrincipalSourceDepth);
  Object.assign(ctx.craftService,{inspectSourcePlanes:sourcePlaneDepthCommands.inspectSourcePlanes,editSourcePlaneDepth:sourcePlaneDepthCommands.editSourcePlaneDepth});
  selectedProfileSourceDimensionCommands=createSelectedProfileSourceDimensionCommands(ctx,submitPreparedReplay,epoch=>{if(epoch===evaluationEpoch)engineResources.cancelCandidates();});
  Object.assign(ctx.craftService,{inspectSelectedProfileSourceDimensionRegions:selectedProfileSourceDimensionCommands.inspectSelectedProfileSourceDimensionRegions,
    editSelectedProfileSourceDimensionRegion:selectedProfileSourceDimensionCommands.editSelectedProfileSourceDimensionRegion});

  legacyExpressionCommands=createLegacyExpressionCommands(ctx,submitPreparedReplay,epoch=>{if(epoch===evaluationEpoch)engineResources.cancelCandidates();});
  Object.assign(ctx.craftService,{inspectLegacyExpressions:legacyExpressionCommands.inspectLegacyExpressions,applyLegacyExpressions:legacyExpressionCommands.applyLegacyExpressions});
  const workerFeatureCommands = createWorkerFeatureCommands(ctx, (request, accepted, rejected, preparation) =>
    submitModification(request, addModification, accepted, rejected, false, preparation),
    epoch => { if (epoch === evaluationEpoch) engineResources.cancelCandidates(); },
    (request, accepted, rejected, preparation) =>
      submitModification(request, stepOverriding, accepted, rejected, true, preparation));
  Object.assign(ctx.craftService, workerFeatureCommands);
  Object.assign(ctx.craftService, createWorkerSolidCommands(ctx,(request,accepted,rejected,preparation)=>
    submitModification(request,addModification,accepted,rejected,false,preparation),
    epoch=>{if(epoch===evaluationEpoch)engineResources.cancelCandidates();},inspectCatalogSolidCapabilities));
  Object.assign(ctx.craftService, createWorkerEdgeTreatmentCommands(ctx,(request,accepted,rejected,preparation)=>
    submitModification(request,addModification,accepted,rejected,false,preparation),
    epoch=>{if(epoch===evaluationEpoch)engineResources.cancelCandidates();}));
  Object.assign(ctx.craftService,createWorkerLinearHolePatternCommands(ctx,(request,accepted,rejected,preparation)=>
    submitModification(request,addModification,accepted,rejected,false,preparation),
    epoch=>{if(epoch===evaluationEpoch)engineResources.cancelCandidates();}));
  Object.assign(ctx.craftService,createWorkerShellCommands(ctx,(request,accepted,rejected,preparation)=>
    submitModification(request,addModification,accepted,rejected,false,preparation),
    epoch=>{if(epoch===evaluationEpoch)engineResources.cancelCandidates();}));
  historyControlCommands=createWorkerHistoryControlCommands(ctx,submitHistoryControl,()=>({
    ready:ownedPipelineHistories.has(modifications$.value.history)&&journalHeadDefinition===modifications$.value.history&&!!fullTipSignature&&fullTipSketchRevision===sketchRevision(ctx.storageService,(ctx.projectService as any).sketchStorageNamespace)&&fullTipMaterialSurfaceRevision===(ctx.projectManager as any).inspectMaterialSurfaceRevision(),
    history:modifications$.value.history,journal:authoredJournal$.value,signature:fullTipSignature,
    sourceModels:lastCompleteService===ctx.projectService&&lastCompleteGeneration===(ctx.projectService as any).documentGeneration?(lastComplete||models$.value):models$.value
  }),epoch=>{if(epoch===evaluationEpoch)engineResources.cancelCandidates();},requireAvailableSelectedProfileBuild);
  const {inspectWorkerHistoryControls,setWorkerFeatureSuppressed,setWorkerHistoryPrefix,commitWorkerHistoryBranch}=historyControlCommands;
  principalPlaneCommands=createPrincipalPlanePlacementCommands(ctx,()=>({
    ready:ownedPipelineHistories.has(modifications$.value.history)&&journalHeadDefinition===modifications$.value.history&&!!fullTipSignature&&
      fullTipSketchRevision===sketchRevision(ctx.storageService,(ctx.projectService as any).sketchStorageNamespace)&&fullTipMaterialSurfaceRevision===(ctx.projectManager as any).inspectMaterialSurfaceRevision(),
    state:modifications$.value,journal:authoredJournal$.value,signature:fullTipSignature
  }),input=>evaluateWorkerSolidRead(input,'principal-source-basis'),(input,permit)=>evaluateWorkerSolidRead(input,'principal-source-proof',permit),submitPrincipalPlacement,
    epoch=>{if(epoch===evaluationEpoch)engineResources.cancelCandidates();},requireAvailableSelectedProfileBuild);
  const sourceFrameHistory=()=>modifications$.value.history.some(e=>e.type==='SOURCE_FRAME_V1');
  Object.assign(ctx.craftService,{inspectWorkerHistoryControls:()=>sourceFrameHistory()?principalPlaneCommands.inspectSourceFramePositionHistory():inspectWorkerHistoryControls(),
    setWorkerFeatureSuppressed,setWorkerHistoryPrefix:(a,o)=>sourceFrameHistory()?principalPlaneCommands.setSourceFrameHistoryPrefix(a,o):setWorkerHistoryPrefix(a,o),commitWorkerHistoryBranch,
    inspectSourcePlanePlacements:principalPlaneCommands.inspectSourcePlanePlacements,editSourcePlanePlacement:principalPlaneCommands.editSourcePlanePlacement,applyPrincipalPlaneDraft:principalPlaneCommands.applyPrincipalPlaneDraft});
  Object.assign(ctx.craftService,createWorkerFeatureDeleteCommands(ctx,(args,options)=>authoredFeatureOperation('operation-remove',args,options)));
  Object.assign(ctx.craftService,createWorkerThroughHoleParentCommands(ctx,(args,options)=>authoredFeatureOperation('through-hole-parent',args,options)));
  Object.assign(ctx.craftService,createWorkerThroughHoleCommands(ctx,(request,accepted,rejected,preparation)=>
    submitModification(request,addModification,accepted,rejected,false,preparation),
    epoch=>{if(epoch===evaluationEpoch)engineResources.cancelCandidates();}));
  Object.assign(ctx.craftService,createWorkerRevolveCommands(ctx,(request,accepted,rejected,preparation)=>
    submitModification(request,addModification,accepted,rejected,false,preparation),
    epoch=>{if(epoch===evaluationEpoch)engineResources.cancelCandidates();},
    {listBuilds:listAvailableRevolveBuilds,requireBuild:requireAvailableRevolveBuild,historyBuild:genericHistoryBuild,budget:selectedProfileHistoryBudget}));
  Object.assign(ctx.craftService,createWorkerSweepCommands(ctx,(request,accepted,rejected,preparation)=>
    submitModification(request,addModification,accepted,rejected,false,preparation),
    epoch=>{if(epoch===evaluationEpoch)engineResources.cancelCandidates();},
    {listBuilds:listAvailableSweepBuilds,requireBuild:requireAvailableSweepBuild,historyBuild:genericHistoryBuild,budget:selectedProfileHistoryBudget}));
  Object.assign(ctx.craftService,createWorkerLoftCommands(ctx,(request,accepted,rejected,preparation)=>
    submitModification(request,addModification,accepted,rejected,false,preparation),
    epoch=>{if(epoch===evaluationEpoch)engineResources.cancelCandidates();},
    {listBuilds:listAvailableLoftBuilds,requireBuild:requireAvailableLoftBuild,historyBuild:genericHistoryBuild,budget:selectedProfileHistoryBudget}));
  Object.assign(ctx.craftService,createWorkerPlanarAttachmentReadCommands(ctx,input=>evaluateWorkerSolidRead(input,'source-attachment')));
  Object.assign(ctx.craftService,createWorkerSolidPointCommands(ctx,input=>evaluateWorkerSolidRead(input,'points'),{requireBuild:requireAvailablePointBuild}));
  Object.assign(ctx.craftService,createWorkerManufacturingMeshReplay(ctx,input=>evaluateWorkerSolidRead(input,'manufacturing-meshes'),{requireBuild:requireAvailableManufacturingMeshBuild}));
  Object.assign(ctx.craftService,createWorkerDrawingReadCommands(ctx,input=>evaluateWorkerSolidRead(input,'drawing'),{requireBuild:requireAvailableManufacturingMeshBuild}));
  Object.assign(ctx.craftService,createWorkerStepExportCommands(ctx,input=>evaluateWorkerSolidRead(input,'step'),{listBuilds:listAvailableStepExportBuilds,requireBuild:requireAvailableStepExportBuild}));
  Object.assign(ctx.craftService,createSelectedProfileDepthCommands(ctx));
  Object.assign(ctx.craftService,createSelectedProfileCommands(ctx,(request,accepted,rejected,preparation)=>
    submitModification(request,addModification,accepted,rejected,false,preparation),
    epoch=>{if(epoch===evaluationEpoch)engineResources.cancelCandidates();},
    {listBuilds:()=>listAvailableSelectedProfileBuilds().map(build=>({engine:build.id,engineRevision:build.revision})),requireBuild:requireAvailableSelectedProfileBuild}));
  Object.assign(ctx.craftService,createSelectedProfileRegionCommands(ctx,authoredSelectedProfileRegionOperation));
  // @ts-ignore
  ctx.streams.craft = {
    modifications: modifications$,
    models: models$,
    update: update$,
    engineCleanupFailure: engineCleanupFailure$
  };

  const generation = () => (ctx.projectService as any).documentGeneration;
  function isCurrent(epoch: number, documentGeneration: number, service = ctx.projectService) {
    return ctx.projectService === service && (service as any).isDocumentCurrent(documentGeneration) && epoch === evaluationEpoch && generation() === documentGeneration;
  }
  function superseded(committed = false) {
    const error = new DOMException(committed ? 'Committed model revision was superseded.' : 'Model evaluation was superseded.', 'AbortError');
    // A reset during notification is different from a rejected preparation.
    Object.defineProperty(error, 'committed', {value: committed, enumerable: true});
    return error;
  }
  function requireCurrent(epoch: number, documentGeneration: number, service = ctx.projectService) {
    if (!isCurrent(epoch, documentGeneration, service)) throw superseded();
  }
  function preparePublication(models: MObject[], history: CraftHistory, failure: any, journal?: any, expressions?: any) {
    let definition=history.history;
    if(!ownedPipelineHistories.has(definition)){
      if(definition.length)throw Error('An owned evaluated history is required for publication.');
      definition=Object.freeze([]) as any;ownedPipelineHistories.add(definition);
    }
    const ownedState=Object.freeze({...history,history:definition});
    return prepareStateBatch([
      {stream:pipelineFailure$, value:failure},
      {stream:models$, value:models},
      {stream:modifications$, value:ownedState},
      ...(journal ? [{stream:authoredJournal$,value:journal}] : []),
      ...(expressions ? expressions.changes : []),
      ...ctx.cadRegistry.preparePublication(models)
    ]);
  }
  async function evaluatePipeline(history: OperationRequest[], endIndex: number, epoch: number, documentGeneration: number, service: any, preparation?: PreparedSketchCommand, markRepairFailure = false, observation?: any, sourceProofPermit?:object) {
    requireCurrent(epoch, documentGeneration, service);
    requireEngineCleanup();
    // Every entry point, including timeline and native restore, evaluates an
    // owned immutable definition. Do not narrow native restore to the smaller
    // edit-command capture limits or serialize a second giant history string.
    if(!ownedPipelineHistories.has(history))history=await capturePipelineHistory(history,()=>{requireCurrent(epoch,documentGeneration,service);preparation?.requireCurrent();});
    ownedPipelineHistories.add(history);
    if(!Number.isSafeInteger(endIndex)||endIndex < -1||endIndex >= history.length)throw Error('Invalid feature history position.');
    if(historyStateVersion(history)===1){const rows=validateControlledHistory(history);assertActiveHistoryDependencies(rows);}
    const resources = engineResources.begin({purpose:observation?'observation':'model',signal:observation?.signal||service.documentSignal,
      valid:() => isCurrent(epoch, documentGeneration, service)&&(!observation||observation.valid())});
    try {
      MObjectIdGenerator.reset();
      const models = new Set<MObject>();
      const staticSketchStorage = createCandidateSketchStorage(observation?.sketchStorage||ctx.sketchStorageService, preparation?.sketchOverrides, ReadSketch,preparation?.sketchRemovedIds);
      const needsSourceReplay=hasNativeSourceAttachments(history)||!!preparation?.nativeSourceReplay;
      const sourceOperation=needsSourceReplay?ctx.operationService.get('SOURCE_FRAME_V1'):undefined;
      if(needsSourceReplay&&!isRegisteredSourcePlane('SOURCE_FRAME_V1',sourceOperation))throw Error('The genuine source-frame producer changed.');
      const sourceReplay=needsSourceReplay?await createNativeSourceReplay({ctx,history,owner:resources,source:staticSketchStorage,readSketch:ReadSketch,permit:observation?sourceProofPermit:preparation?.nativeSourceReplay,requireCurrent:()=>{requireCurrent(epoch,documentGeneration,service);preparation?.requireCurrent();},expectedRun:sourceOperation?.run,overrideIds:preparation?.sketchOverrides?.map(row=>row.id)||[]}):null;
      const sketchStorage=sourceReplay?.view||staticSketchStorage;
      const registry = ctx.cadRegistry.createEvaluationRegistry(sketchStorage);
      sourceReplay?.bindRegistry(registry);
      const sourceFrames=new Map<string,any>(),observedFrames=new Map<string,number>();
      if(preparation?.sketchSourceFrames) {
        if(!preparation.sketchOverrides||preparation.sketchSourceFrames.length!==preparation.sketchOverrides.length||preparation.sketchSourceFrames.length>64)throw Error('Invalid candidate sketch frame coverage.');
        for(const row of preparation.sketchSourceFrames) {
          if(typeof row?.id!=='string'||!row.id||sourceFrames.has(row.id)||!preparation.sketchOverrides.some(item=>item.id===row.id)||!sameSketchSaveFrame(row.frame,row.frame))throw Error('Invalid candidate sketch source frame.');
          const frame=Object.freeze(Object.fromEntries(['origin','x','y','z'].map(key=>[key,Object.freeze([...row.frame[key]])])));
          sourceFrames.set(row.id,frame);
        }
      }
      const verifySketchFrames=()=>{
        for(const [id,frame] of sourceFrames) {
          const matches=Array.from(models).flatMap((model:any)=>Array.isArray(model.faces)?model.faces.filter(face=>face.id===id):[]);
          if(matches.length>1)throw Error('The candidate sketch plane is ambiguous.');
          if(!matches.length)continue;
          const face=matches[0],index=face.root.originatingOperation;
          if(!(face.root instanceof MOpenFaceShell)||face.defaultSketchId!==id||registry.findFace(id)!==face||!isRegisteredSourcePlane(history[index]?.type,ctx.operationService.get(history[index]?.type))||
             observedFrames.has(id)&&observedFrames.get(id)!==index||!sameSketchSaveFrame(frame,sketchBoundaryFrame(face)))throw Error('The candidate sketch source plane changed.');
          const boundary=getSketchBoundaries(face);
          if(!['lines','arcs','circles','nurbses'].every(key=>Array.isArray(boundary[key])&&boundary[key].length===0))throw Error('Referenced sketch boundaries are not supported by this edit.');
          observedFrames.set(id,index);
        }
      };
      const operationContext = Object.create(ctx);
      operationContext.sketchStorageService = sketchStorage;
      if (preparation?.expressionPublication) {
        operationContext.expressionService=preparation.expressionPublication.facade;
        operationContext.requireParameterCandidateCurrent=()=>{requireCurrent(epoch,documentGeneration,service);preparation.requireCurrent();requireCurrent(epoch,documentGeneration,service);};
      }
      operationContext.engineEvaluation = resources;
      operationContext.authoredEvaluationHistory = history;
      if(sourceReplay)operationContext.prepareNativeAttachedSource=sourceReplay.prepare;
      const patternReplay = {requestedSeed: null, seed: null};
      operationContext.patternReplay = patternReplay;
      operationContext.cadRegistry = registry;
      operationContext.services = Object.assign(Object.create(ctx.services), {cadRegistry: registry, expressionService:operationContext.expressionService});
      operationContext.occService = Object.assign(Object.create(ctx.occService), {utils: createOCCUtils(operationContext)});
      // Replay from the start so candidate operations never receive the
      // retained accepted model objects as mutable inputs.
      let yieldAt = performance.now() + 8;
      const yieldIfNeeded = async () => {
        if (performance.now() < yieldAt) return;
        // Awaiting an already resolved operation does not let timers, input or
        // cancellation run. Drain a real task between long candidate slices.
        await new Promise<void>(resolve => setTimeout(resolve, 0));
        requireCurrent(epoch, documentGeneration, service);
        preparation?.requireCurrent();
        yieldAt = performance.now() + 8;
      };
      for (let i=0; i<=endIndex; i++) {
        await yieldIfNeeded();
        requireCurrent(epoch, documentGeneration, service);
        if(featureSuppressed(history[i])){captureOperationAppend(history[i]);continue;}
        const next = i < endIndex ? history[i + 1] : null;
        patternReplay.requestedSeed = next?.type === 'PATTERN_CUT_LINEAR' ? Number(next.params?.seedFeatureId) : null;
        if (history[i].type !== 'PATTERN_CUT_LINEAR') patternReplay.seed = null;
        // The standard PLANE operation only appends an independent open face.
        // Keep contiguous plane creation linear; consumers and every other
        // operation still observe a fully checked, initialized registry.
        const operation = ctx.operationService.get(history[i].type);
        const independentPlane = history[i].type === 'PLANE' && operation.run === standardPlaneOperation.run && !operation.admitGeometry;
        const expectedOperation = observation ? observation.operations.get(history[i].type) : independentPlane ? {descriptor:operation,run:operation.run,admit:operation.admitGeometry} : undefined;
        if(observation&&!expectedOperation)throw Error('Uncaptured observation operation.');
        if (!independentPlane) registry.flushModels();
        let operationResult;
        sourceReplay?.enter(i,operation);
        try { operationResult=await runRequest(history[i], operationContext, expectedOperation); }
        catch(error) {
          if(error&&typeof error==='object'&&Object.isExtensible(error)){
            for(const [key,value]of [['originatingFeatureId',Number(history[i].params.featureId)],['originatingIndex',i]] as const){const prior=Object.getOwnPropertyDescriptor(error,key);if(!prior||prior.configurable)Object.defineProperty(error,key,{value,enumerable:true,configurable:true});}
            if(markRepairFailure)Object.defineProperty(error,'evaluationIndex',{value:i,configurable:true});
          }
          throw error;
        }
        finally { sourceReplay?.leave(); }
        const {consumed, created}=operationResult;
        if (history[i].type === 'PATTERN_CUT_LINEAR') patternReplay.seed = null;
        requireCurrent(epoch, documentGeneration, service);
        for (const model of consumed) models.delete(model);
        for (const model of created) { model.originatingOperation=i; models.add(model); }
        const sortedModels = () => Array.from(models).sort((a,b)=>(a.id||'').localeCompare(b.id));
        if (independentPlane && consumed.length === 0 && created.every(model => model instanceof MOpenFaceShell)) registry.stageModels(sortedModels);
        else registry.setModels(sortedModels());
        verifySketchFrames();
      }
      registry.flushModels();
      await yieldIfNeeded();
      requireCurrent(epoch, documentGeneration, service);
      if(observedFrames.size!==sourceFrames.size)throw Error('The candidate sketch source plane could not be reconstructed.');
      if(historyStateVersion(history)===1){
        if(genericHistoryBuild(history)?.selectedProfileVersion!==3)throw Object.assign(Error('Suppressed history requires its recorded modern native build.'),{code:'ENGINE_CAPABILITY_UNAVAILABLE'});
        const parents=new Map<string,number>();
        for(const model of models)if(model instanceof MOpenFaceShell){const row=history[model.originatingOperation];if(row?.type==='PLANE')parents.set(model.face.id,Number(row.params.featureId));}
        const rows=validateControlledHistory(history,endIndex===history.length-1?parents:null);assertActiveHistoryDependencies(rows);
      }
      // Full documents must adopt saved sources onto their real owning faces;
      // prefix rollback legitimately leaves future sources for Redo.
      if(endIndex===history.length-1)registry.assertSketchSourcesResolved(sketchStorage.getAllSketches().map(row=>row.id));
      requireCurrent(epoch,documentGeneration,service);
      preparation?.requireCurrent();
      sourceReplay?.finish(endIndex);
      resources.seal();
      return {models:Array.from(models).sort((a,b)=>(a.id||'').localeCompare(b.id)), resources,history,registry};
    } catch (error) {
      if(error&&typeof error==='object')failedEvaluationHistory.set(error,history);
      resources.close();
      throw error;
    }
  }

  // An exclusive read uses the SAME evaluator and private ledger, without
  // accepting/publishing its resources or touching the accepted history epoch.
  function evaluateWorkerSolidRead(input:any,observer:'points'|'step'|'manufacturing-meshes'|'drawing'|'source-attachment'|'principal-source-basis'|'principal-source-proof'='points',sourceProofPermit?:object):Promise<any>{
    if(observer!=='points'&&observer!=='step'&&observer!=='manufacturing-meshes'&&observer!=='drawing'&&observer!=='source-attachment'&&observer!=='principal-source-basis'&&observer!=='principal-source-proof')throw Object.assign(Error('Unsupported native read operation.'),{code:'INVALID_REQUEST'});
    if((observer==='principal-source-proof')!==!!sourceProofPermit||sourceProofPermit&&!isNativeSourceReplay(sourceProofPermit))throw Error('Invalid private source proof.');
    input.requireCurrent();requireEngineCleanup();
    if(pendingPipelines||pendingModifications)throw Object.assign(Error('Another evaluation is in progress.'),{code:'BUSY'});
    pendingPipelines++;
    const work=pipelineTail.catch(()=>{}).then(async()=>{
      let result:any=null,output:any,error:any=null,context:any=null;
      let priorContexts:any=null,priorStack:any=null,priorMaps:any=null;
      const sameMap=(a:any,b:any)=>a.size===b.length&&b.every(([key,value]:any)=>a.has(key)&&Object.is(a.get(key),value));
      try{
        input.requireCurrent();requireEngineCleanup();
        if(pendingPipelines!==1||pendingModifications)throw Object.assign(Error('Observation was superseded by a writer.'),{code:'BUSY'});
        priorContexts=MObjectIdGenerator.contexts;
        if(!Array.isArray(priorContexts)||priorContexts.length<1||priorContexts.length>16||priorContexts.some((c:any)=>!(c?.ID_REGISTRY instanceof Map)||c.ID_REGISTRY.size>1024))throw Object.assign(Error('Model ID context exceeds the observation bound.'),{code:'RESOURCE_LIMIT'});
        priorStack=priorContexts.slice();priorMaps=priorStack.map((c:any)=>({context:c,map:c.ID_REGISTRY,entries:Array.from(c.ID_REGISTRY)}));
        MObjectIdGenerator.pushContext('');context=MObjectIdGenerator.context;
        const preparation:PreparedSketchCommand={sketchOverrides:input.sketchOverrides,sketchSourceFrames:input.sketchSourceFrames,nativeSourceReplay:sourceProofPermit,requireCurrent:input.requireCurrent,requireCommittedCurrent:input.requireCurrent,async prepare(){throw Error('An observation cannot publish.');}};
        result=await evaluatePipeline(input.history,input.endIndex,input.epoch,input.generation,input.project,preparation,false,input,sourceProofPermit);
        input.requireCurrent();
        output=observer==='principal-source-basis'?capturePrincipalSourceBasis(ctx,{history:result.history,registry:result.registry,owner:result.resources,requireCurrent:input.requireCurrent})
          :observer==='principal-source-proof'?capturePrincipalSourceProof(ctx,{history:result.history,registry:result.registry,owner:result.resources,permit:sourceProofPermit,requireCurrent:input.requireCurrent})
          :observer==='points'
          ?await classifyCandidateWorkerSolidPoints({owner:result.resources,registry:result.registry,...input.query,valid:input.valid})
          :observer==='step'?await exportCandidateWorkerSTEP({owner:result.resources,registry:result.registry,...input.query,valid:input.valid})
          :observer==='manufacturing-meshes'?await readManufacturingReplayBatch({owner:result.resources,registry:result.registry,...input.query,valid:input.valid},readCandidateWorkerManufacturingMesh)
          :observer==='source-attachment'?await readCandidateWorkerPlanarFaces({owner:result.resources,registry:result.registry,...input.query,valid:input.valid})
          :input.query.boreQuery?await readCandidateWorkerBores({owner:result.resources,registry:result.registry,...input.query,valid:input.valid}):await readCandidateWorkerDrawing({owner:result.resources,registry:result.registry,...input.query,valid:input.valid});
        input.requireCurrent();
      }catch(failure){error={cause:failure};}
      finally{
        try{result?.resources.close();}catch(failure){error={cause:Object.assign(Error('Observation cleanup failed.'),{code:'ENGINE_CLEANUP_FAILED',cause:failure,operationError:error?.cause})};}
        if(priorStack){
          const unchanged=MObjectIdGenerator.contexts===priorContexts&&priorContexts.length===priorStack.length+1&&MObjectIdGenerator.context===context&&priorStack.every((c:any,i:number)=>priorContexts[i]===c)&&priorMaps.every((r:any)=>r.context.ID_REGISTRY===r.map&&sameMap(r.map,r.entries));
          // Restore the original references and values even if an injected
          // reentrant operation broke the exclusive ID-context contract.
          try{
            if(unchanged)MObjectIdGenerator.popContext();
            else {MObjectIdGenerator.contexts=priorContexts;priorContexts.splice(0,priorContexts.length,...priorStack);for(const r of priorMaps){r.context.ID_REGISTRY=r.map;if(!sameMap(r.map,r.entries)){r.map.clear();for(const [key,value]of r.entries)r.map.set(key,value);}}}
          }catch(failure){error={cause:Object.assign(Error('Model ID context restoration failed.'),{code:'EVALUATION_CONTEXT_CHANGED',cause:failure,operationError:error?.cause})};}
          if(!unchanged&&!error)error={cause:Object.assign(Error('Model ID context changed during observation.'),{code:'EVALUATION_CONTEXT_CHANGED'})};
        }
        pendingPipelines--;
        if(engineResources.usage.cleanupFailed){reportEngineCleanupFailure(true);error={cause:Object.assign(Error('Native observation cleanup was not established.'),{code:'ENGINE_CLEANUP_FAILED',operationError:error?.cause})};}
      }
      if(error)throw error.cause;input.requireCurrent();return output;
    });
    pipelineTail=work.then(()=>{},()=>{});return work;
  }

  // Kept for the isolated remote-part context: publish only after the whole
  // requested pipeline succeeds. Callers cannot concurrently share the engine.
  async function runPipeline(history: OperationRequest[], beginIndex: number, endIndex: number): Promise<void> {
    if (pendingPipelines) throw new Error('A model evaluation is already in progress.');
    const epoch=++evaluationEpoch, service=ctx.projectService, documentGeneration=generation();
    engineResources.cancelCandidates();
    pendingPipelines++;
    update$.next();
    let result = null, committed = false, previousResources = null;
    try {
      result=await evaluatePipeline(history,endIndex,epoch,documentGeneration,service);
      requireCurrent(epoch,documentGeneration,service);
      try{if(history!==result.history)await assertPipelineHistoryCurrent(history,result.history,()=>requireCurrent(epoch,documentGeneration,service));}
      catch(_){throw superseded();}
      const clearedJournal=emptyAuthoredEditJournal(documentGeneration,authoredJournal$.value.revision+1);
      const publication=preparePublication(result.models,{history:result.history,pointer:endIndex},null,clearedJournal);
      result.resources.requireCurrent();
      publication.commit();
      journalHeadSignature=null;journalHeadDefinition=null;fullTipSignature=null;rewindBaseline=null;
      fullTipSketchRevision=null;fullTipMaterialSurfaceRevision=null;
      result.resources.accept();
      previousResources=acceptedResources; acceptedResources=result.resources; committed=true;
      publication.notify(() => isCurrent(epoch,documentGeneration,service));
      if (!isCurrent(epoch,documentGeneration,service)) throw superseded(true);
    } catch(error) {
      if(error&&typeof error==='object')failedEvaluationHistory.delete(error);
      throw error;
    } finally {
      try { if (!committed) result?.resources.close(); else detachAccepted(result?.resources); }
      catch (error) { console.error('Engine resource cleanup failed:',error); reportEngineCleanupFailure(true); }
      try { retireUnused(previousResources); } catch (error) { console.error('Engine retirement failed:',error); reportEngineCleanupFailure(true); }
      pendingPipelines--; reportEngineCleanupFailure(); update$.next();
    }
  }

  intercept(modifications$, (curr) => {
    const previousHistory=modifications$.value;
    const requestedHistory=curr.history,requestedPointer=curr.pointer,requestedState={...curr,history:requestedHistory,pointer:requestedPointer};
    const isRewind=previousHistory.pointer===previousHistory.history.length-1 &&
      requestedPointer<previousHistory.pointer && requestedHistory===previousHistory.history;
    const epoch=++evaluationEpoch, service=ctx.projectService, documentGeneration=generation();
    const previousOwnedState=lastCompleteService===service&&lastCompleteGeneration===documentGeneration?
      previousHistory:{history:Object.freeze([]),pointer:-1};
    engineResources.cancelCandidates();
    const commandScope = modificationCallbacks.get(curr)?.preparation?.candidateScope;
    if (commandScope) commandScope.epoch = epoch;
    pendingPipelines++;
    update$.next();
    if (!isCurrent(epoch,documentGeneration,service)) {
      settleModification(curr,superseded());
      pendingPipelines--;
      update$.next();
      return;
    }
    if (lastCompleteService !== service || lastCompleteGeneration !== documentGeneration) {
      // A previous document is never a fallback for the new document.
      const oldAccepted=acceptedResources, oldComplete=lastCompleteResources;
      acceptedResources=null; lastCompleteResources=null;
      lastComplete=null; lastCompleteGeneration=documentGeneration; lastCompleteService=service;
      journalHeadSignature=null;journalHeadDefinition=null;
      fullTipSignature=null;fullTipSketchRevision=null;fullTipMaterialSurfaceRevision=null;rewindBaseline=null;
      // The first guarded append carries an empty journal for this generation
      // as a proposal. Keep its captured source journal until atomic publication
      // instead of invalidating that candidate with a startup-only reset.
      if(modificationCallbacks.get(curr)?.initialOperationAppendJournal!==authoredJournal$.value)
        authoredJournal$.next(emptyAuthoredEditJournal(documentGeneration,0));
      // Startup may advance the project lifetime before any craft state exists.
      // Do not manufacture a revision change for an already empty workspace.
      if (models$.value.length || modifications$.value.history.length || modifications$.value.pointer !== -1 ||
          pipelineFailure$.value || ctx.cadRegistry.modelIndex.size) {
        const cleared=preparePublication([],{history:[],pointer:-1},null);
        cleared.commit();
        cleared.notify(() => isCurrent(epoch,documentGeneration,service));
      }
      retireUnused(oldAccepted,oldComplete);
    }
    pipelineTail=pipelineTail.catch(() => {}).then(async () => {
      let committed=false;
      const preparation: PreparedSketchCommand = modificationCallbacks.get(curr)?.preparation;
      let workspace = null;
      let result = null, previousResources = null, previousCompleteResources = null;
      try {
        requireCurrent(epoch,documentGeneration,service);
        preparation?.requireCurrent();
        result=await evaluatePipeline(requestedHistory,requestedPointer,epoch,documentGeneration,service,preparation,!!(modificationCallbacks.get(curr)?.unresolvedRepairUndo || modificationCallbacks.get(curr)?.parentRepairIndex!==undefined));
        requireCurrent(epoch,documentGeneration,service);
        const evaluatedState={...requestedState,history:result.history};
        if (preparation) workspace = await preparation.prepare(result.models, evaluatedState);
        requireCurrent(epoch,documentGeneration,service);
        let nextTipSignature:string=null, nextRewindBaseline=rewindBaseline;
        if (isRewind) {
          try {
            const capture=await captureAuthoredHistory(requestedHistory,()=>requireCurrent(epoch,documentGeneration,service));
            nextRewindBaseline=fullTipSignature && capture.signature===fullTipSignature ? {document:documentGeneration,signature:capture.signature} : null;
          } catch (_) {requireCurrent(epoch,documentGeneration,service);nextRewindBaseline=null;}
        } else if (requestedPointer===result.history.length-1) {
          nextRewindBaseline=null;
          try {nextTipSignature=(await captureAuthoredHistory(requestedHistory,()=>requireCurrent(epoch,documentGeneration,service))).signature;}
          catch (_) {requireCurrent(epoch,documentGeneration,service);}
        }
        const callbacks=modificationCallbacks.get(curr);
        let nextJournal=callbacks?.journalProposal;
        if(preparation?.nativeSourceReplay){
          const changes=preparedNativeSourceChanges(preparation.nativeSourceReplay);
          if(workspace)throw Error('Native source propagation must share one prepared workspace.');
          if(changes.length)workspace=ctx.storageService.prepareWrites(changes.map(row=>({key:(service as any).sketchStorageKey(row.faceId),value:row.after})));
          nextJournal=supplementNativeSourceJournal(authoredJournal$.value,nextJournal,changes,nativeSourceReplayDirection(preparation.nativeSourceReplay));
        }
        let nextJournalSignature=callbacks?.operationAppend?nextTipSignature:callbacks?.journalSignature;
        if (!nextJournal && authoredJournal$.value.entries.length) {
          let keep=false;
          try {
            keep = !!(!preparation?.sketchOverrides?.length && (requestedHistory===journalHeadDefinition||journalHeadSignature) &&
              fullTipSketchRevision===sketchRevision(ctx.storageService,(service as any).sketchStorageNamespace) &&
              fullTipMaterialSurfaceRevision===(ctx.projectManager as any).inspectMaterialSurfaceRevision() &&
              (requestedHistory===journalHeadDefinition||(await captureAuthoredHistory(requestedHistory,()=>requireCurrent(epoch,documentGeneration,service))).signature === journalHeadSignature));
          } catch (_) {requireCurrent(epoch,documentGeneration,service);}
          if (!keep) { nextJournal=emptyAuthoredEditJournal(documentGeneration,authoredJournal$.value.revision+1); nextJournalSignature=null; }
        }
        const expressionPublication=preparation?.expressionPublication;
        try{if(requestedHistory!==result.history)await assertPipelineHistoryCurrent(requestedHistory,result.history,()=>{requireCurrent(epoch,documentGeneration,service);preparation?.requireCurrent();});}
        catch(_){throw superseded();}
        const publication = preparePublication(result.models,evaluatedState,null,nextJournal,expressionPublication);
        preparation?.requireCurrent();
        requireCurrent(epoch,documentGeneration,service);
        result.resources.requireCurrent();
        if (!publication.isCurrent() || (workspace && !workspace.isCurrent()) || (expressionPublication && !expressionPublication.isCurrent())) throw superseded();
        // Both participants are preflighted. No observer or asynchronous gap
        // occurs between installing the prepared bytes and evaluated state.
        workspace?.commit();
        publication.commit();
        expressionPublication?.installBinding();
        if (nextJournal) journalHeadSignature=nextJournalSignature;
        if(callbacks?.historyControl){
          journalHeadDefinition=result.history;fullTipSignature=nextJournalSignature;
          fullTipSketchRevision=callbacks.historyControlAnchors.sketch;
          fullTipMaterialSurfaceRevision=callbacks.historyControlAnchors.material;
        }
        if(callbacks?.principalPlacement){
          journalHeadDefinition=result.history;fullTipSignature=callbacks.journalSignature;
          fullTipSketchRevision=sketchRevision(ctx.storageService,(service as any).sketchStorageNamespace);
          fullTipMaterialSurfaceRevision=(ctx.projectManager as any).inspectMaterialSurfaceRevision();
        }
        if (requestedPointer===result.history.length-1) {
          fullTipSignature=nextTipSignature;journalHeadDefinition=result.history;
          if(callbacks?.historyControl){
            fullTipSketchRevision=callbacks.historyControlAnchors.sketch;
            fullTipMaterialSurfaceRevision=callbacks.historyControlAnchors.material;
          }else{
            try {fullTipSketchRevision=sketchRevision(ctx.storageService,(service as any).sketchStorageNamespace);}
            catch (_) {fullTipSketchRevision=null;}
            try {fullTipMaterialSurfaceRevision=(ctx.projectManager as any).inspectMaterialSurfaceRevision();}
            catch (_) {fullTipMaterialSurfaceRevision=null;}
          }
        }
        rewindBaseline=nextRewindBaseline;
        result.resources.accept();
        previousResources=acceptedResources; previousCompleteResources=lastCompleteResources;
        acceptedResources=result.resources;
        committed=true;
        if(callbacks?.principalPlacement?.completeModels&&requestedPointer<result.history.length-1){
          lastComplete=callbacks.principalPlacement.completeModels;lastCompleteResources=null;
        }
        if (requestedPointer===result.history.length-1) {
          lastComplete=result.models; lastCompleteResources=result.resources;
        }
        publication.notify(() => isCurrent(epoch,documentGeneration,service));
        workspace?.notify(() => isCurrent(epoch,documentGeneration,service));
        if (!isCurrent(epoch,documentGeneration,service)) throw superseded(true);
        preparation?.requireCommittedCurrent();
        settleModification(curr);
      } catch (error) {
        const failureHistory=result?.history||(error&&typeof error==='object'?failedEvaluationHistory.get(error):null);
        if(error&&typeof error==='object')failedEvaluationHistory.delete(error);
        if (!isCurrent(epoch,documentGeneration,service)) {
          settleModification(curr,superseded(committed));
          return;
        }
        const callbacks=modificationCallbacks.get(curr);
        // Failed requests retain their owned definition too. If capture itself
        // was invalid, retain the previously accepted definition instead.
        const failedState=failureHistory?{...requestedState,history:failureHistory}:previousOwnedState;
        // A rejected new/edit command preserves the exact currently accepted
        // history, geometry and validity, including a history rollback. Its
        // command error must not make the unchanged accepted document unsavable.
        if (callbacks?.unresolvedRepairUndo) {
          const undo=callbacks.unresolvedRepairUndo;
          if (error?.evaluationIndex===undo.index && error?.kind===CadError.KIND.INVALID_PARAMS &&
              typeof error?.userMessage==='string' && /^face: refers to a nonexistent object$/.test(error.userMessage)) {
            try {
              preparation.requireCurrent();requireCurrent(epoch,documentGeneration,service);
              const failure={kind:error.kind,message:error.message,
                userMessage:'The prior hole parent is unresolved. Display shows the repaired revision; repair this reference before saving.',
                retainedLastComplete:true,retainedFrom:'repaired-revision'};
              const publication=preparePublication(models$.value,failedState,failure,callbacks.journalProposal);
              if(!publication.isCurrent())throw superseded();
              publication.commit();journalHeadSignature=callbacks.journalSignature;fullTipSignature=callbacks.journalSignature;journalHeadDefinition=failedState.history;
              fullTipSketchRevision=sketchRevision(ctx.storageService,(service as any).sketchStorageNamespace);
              fullTipMaterialSurfaceRevision=(ctx.projectManager as any).inspectMaterialSurfaceRevision();rewindBaseline=null;committed=true;
              publication.notify(()=>isCurrent(epoch,documentGeneration,service));
              if(!isCurrent(epoch,documentGeneration,service))throw superseded(true);
              preparation.requireCommittedCurrent();settleModification(curr);return;
            } catch(undoError) {settleModification(curr,undoError);return;}
          }
        }
        if (callbacks) { settleModification(curr,error); return; }
        // A failed authored replay retains its requested history, visibly stale.
        const retained=lastComplete || models$.value;
        const publication=preparePublication(retained,failedState,
          {kind:error?.kind, code:error?.code, message:error?.message, userMessage:error?.userMessage, retainedLastComplete:!!lastComplete});
        publication.commit();
        previousResources=acceptedResources;
        if (lastComplete) acceptedResources=lastCompleteResources;
        publication.notify(() => isCurrent(epoch,documentGeneration,service));
        // Keep authored intent and a visibly failed status; callers must not
        // save or use retained geometry as the current evaluated revision.
      } finally {
        try { if (!committed) result?.resources.close(); else detachAccepted(result?.resources); }
        catch (error) { console.error('Engine resource cleanup failed:',error); reportEngineCleanupFailure(true); }
        try { retireUnused(previousResources,previousCompleteResources); }
        catch (error) { console.error('Engine retirement failed:',error); reportEngineCleanupFailure(true); }
        try { workspace?.discard(); } catch (error) { console.error('Workspace cleanup failed:',error); }
        pendingPipelines--; reportEngineCleanupFailure(); update$.next();
      }
    });
  });
}

function isAdditiveChange({history:oldHistory, pointer:oldPointer}, {history, pointer}) {
  if (pointer < oldPointer) {
    return false;
  }

  for (let i = 0; i <= oldPointer; i++) {
    const modCurr = history[i];
    const modPrev = oldHistory[i];
    if (modCurr !== modPrev) {
      return false;
    }
  }
  return true;
}

function historyTravel(modifications$) {

  function setPointer(pointer, hints) {
    const mod = modifications$.value;
    if (pointer >= mod.history.length || pointer < -1) {
      return;
    }
    modifications$.update(({history}) => ({history, pointer, hints}));
  }

  return {
    setPointer,
    begin: function(hints) {
      setPointer(-1, hints);
    },
    end: function(hints) {
      setPointer(modifications$.value.history.length - 1, hints);
    },
    forward: function(hints) {
      setPointer(modifications$.value.pointer + 1, hints);
    },
    backward: function (hints) {
      setPointer(modifications$.value.pointer - 1, hints);
    },
  }

}

export interface OperationRequest {
  suppressed?: true;
  type: string;
  params: OperationParams;
}

export interface OperationResult {

  consumed: MObject[];
  created: MObject[];

}

export interface CraftHistory {
  history: OperationRequest[];
  pointer: number;
  hints?: CraftHints;
}

export interface CraftHints {

  noWizardFocus?: boolean;

}

interface CraftService {
  inspectSourceFrameAttachments?:ReturnType<typeof createWorkerPlanarAttachmentReadCommands>['inspectSourceFrameAttachments'];
  inspectSourceFrames?:ReturnType<typeof createSourceFrameCommands>['inspectSourceFrames'];
  createSourceFrame?:ReturnType<typeof createSourceFrameCommands>['createSourceFrame'];
  editSourceFrame?:ReturnType<typeof createSourceFrameCommands>['editSourceFrame'];
  repairSourceFrameParent?:ReturnType<typeof createSourceFrameCommands>['repairSourceFrameParent'];
  inspectSourceFramePoints?:ReturnType<typeof createSourceFrameCommands>['inspectSourceFramePoints'];
  inspectWorkerHistoryControls?:ReturnType<typeof createWorkerHistoryControlCommands>['inspectWorkerHistoryControls'];
  setWorkerFeatureSuppressed?:ReturnType<typeof createWorkerHistoryControlCommands>['setWorkerFeatureSuppressed'];
  inspectSourcePlanePlacements?:ReturnType<typeof createPrincipalPlanePlacementCommands>['inspectSourcePlanePlacements'];
  editSourcePlanePlacement?:ReturnType<typeof createPrincipalPlanePlacementCommands>['editSourcePlanePlacement'];
  applyPrincipalPlaneDraft?:ReturnType<typeof createPrincipalPlanePlacementCommands>['applyPrincipalPlaneDraft'];
  setWorkerHistoryPrefix?:ReturnType<typeof createWorkerHistoryControlCommands>['setWorkerHistoryPrefix'];
  commitWorkerHistoryBranch?:ReturnType<typeof createWorkerHistoryControlCommands>['commitWorkerHistoryBranch'];

  captureManufacturingEditContext?: ()=>any;
  commitManufacturingMetadata?: (ticket:any)=>any;
  inspectSourcePlanes?: ReturnType<typeof createSourcePlaneDepthCommands>['inspectSourcePlanes'];
  editSourcePlaneDepth?: ReturnType<typeof createSourcePlaneDepthCommands>['editSourcePlaneDepth'];
  inspectSelectedProfileSourceDimensionRegions?: ReturnType<typeof createSelectedProfileSourceDimensionCommands>['inspectSelectedProfileSourceDimensionRegions'];
  editSelectedProfileSourceDimensionRegion?: ReturnType<typeof createSelectedProfileSourceDimensionCommands>['editSelectedProfileSourceDimensionRegion'];
  fitWorkerSolids?: ReturnType<typeof createWorkerSolidCommands>['fitWorkerSolids'];
  classifyWorkerSolidPoints?: ReturnType<typeof createWorkerSolidPointCommands>['classifyWorkerSolidPoints'];
  inspectWorkerStepExports?: ReturnType<typeof createWorkerStepExportCommands>['inspectWorkerStepExports'];
  exportWorkerSTEPBlob?: ReturnType<typeof createWorkerStepExportCommands>['exportWorkerSTEPBlob'];
  inspectWorkerLinkedPartBores?: ReturnType<typeof createWorkerDrawingReadCommands>['inspectWorkerLinkedPartBores'];
  readWorkerLinkedPartDrawing?: ReturnType<typeof createWorkerDrawingReadCommands>['readWorkerLinkedPartDrawing'];
  prepareWorkerManufacturingMeshes?: ReturnType<typeof createWorkerManufacturingMeshReplay>['prepareWorkerManufacturingMeshes'];
  authoredLinearHolePatternOperation?: (args:{revision:string;index:number;featureId:number;count?:number;spacing?:number;direction?:'undo'|'redo'},options?:{signal?:AbortSignal;valid?:()=>boolean;beforePublish?:()=>boolean})=>Promise<Readonly<{changed:boolean;revision:string;dimensions?:Readonly<Record<string,number>>;featureId?:number;index?:number}>>;
  inspectWorkerLinearHolePatterns?: ReturnType<typeof createWorkerLinearHolePatternCommands>['inspectWorkerLinearHolePatterns'];
  createWorkerLinearHolePattern?: ReturnType<typeof createWorkerLinearHolePatternCommands>['createWorkerLinearHolePattern'];
  inspectWorkerLinearHolePatternHistory?: ReturnType<typeof createWorkerLinearHolePatternCommands>['inspectWorkerLinearHolePatternHistory'];
  editWorkerLinearHolePattern?: ReturnType<typeof createWorkerLinearHolePatternCommands>['editWorkerLinearHolePattern'];
  authoredThroughHoleOperation?: (args:{revision:string;index:number;featureId:number;diameter?:number;offsetX?:number;offsetY?:number;direction?:'undo'|'redo'},options?:{signal?:AbortSignal;valid?:()=>boolean;beforePublish?:()=>boolean})=>Promise<Readonly<{changed:boolean;revision:string;dimensions?:Readonly<Record<string,number>>;featureId?:number;index?:number}>>;
  authoredSolidEdgeTreatmentOperation?: (args:{revision:string;index:number;featureId:number;size?:number;direction?:'undo'|'redo'},options?:{signal?:AbortSignal;valid?:()=>boolean;beforePublish?:()=>boolean})=>Promise<Readonly<{changed:boolean;revision:string;size?:number;featureId?:number;index?:number}>>;
  inspectWorkerRevolves?: ReturnType<typeof createWorkerRevolveCommands>['inspectWorkerRevolves'];
  inspectWorkerRevolveRegions?: ReturnType<typeof createWorkerRevolveCommands>['inspectWorkerRevolveRegions'];
  createWorkerRevolve?: ReturnType<typeof createWorkerRevolveCommands>['createWorkerRevolve'];
  inspectWorkerRevolveHistory?: ReturnType<typeof createWorkerRevolveCommands>['inspectWorkerRevolveHistory'];
  editWorkerRevolve?: ReturnType<typeof createWorkerRevolveCommands>['editWorkerRevolve'];
  inspectWorkerLofts?: ReturnType<typeof createWorkerLoftCommands>['inspectWorkerLofts'];
  inspectWorkerLoftRegions?: ReturnType<typeof createWorkerLoftCommands>['inspectWorkerLoftRegions'];
  createWorkerLoft?: ReturnType<typeof createWorkerLoftCommands>['createWorkerLoft'];
  inspectWorkerLoftHistory?: ReturnType<typeof createWorkerLoftCommands>['inspectWorkerLoftHistory'];
  inspectWorkerSweeps?: ReturnType<typeof createWorkerSweepCommands>['inspectWorkerSweeps'];
  inspectWorkerSweepRegions?: ReturnType<typeof createWorkerSweepCommands>['inspectWorkerSweepRegions'];
  createWorkerSweep?: ReturnType<typeof createWorkerSweepCommands>['createWorkerSweep'];
  inspectWorkerSweepHistory?: ReturnType<typeof createWorkerSweepCommands>['inspectWorkerSweepHistory'];
  authoredRevolveAngleOperation?: (args:any,options?:any)=>Promise<any>;
  inspectSelectedProfileHistory?: ReturnType<typeof createSelectedProfileDepthCommands>['inspectSelectedProfileHistory'];
  editSelectedProfileDepth?: ReturnType<typeof createSelectedProfileDepthCommands>['editSelectedProfileDepth'];
  inspectSelectedProfileRegionChoices?: ReturnType<typeof createSelectedProfileRegionCommands>['inspectSelectedProfileRegionChoices'];
  editSelectedProfileRegion?: ReturnType<typeof createSelectedProfileRegionCommands>['editSelectedProfileRegion'];
  inspectSelectedProfileCommands?: ReturnType<typeof createSelectedProfileCommands>['inspectSelectedProfileCommands'];
  inspectSelectedProfileRegions?: ReturnType<typeof createSelectedProfileCommands>['inspectSelectedProfileRegions'];
  createSelectedProfileExtrusion?: ReturnType<typeof createSelectedProfileCommands>['createSelectedProfileExtrusion'];
  inspectSketchDXFExports?: () => any;
  exportSketchDXFBlob?: (input:any,options?:any) => Promise<any>;
  inspectPrimitiveCreation?: ReturnType<typeof createEmptySketchCreationCommands>['inspectPrimitiveCreation'];
  createEmptySketchPlane?: ReturnType<typeof createEmptySketchCreationCommands>['createEmptySketchPlane'];
  inspectSketchTransitions?: ReturnType<typeof createClosedSketchTransitionCommands>['inspectSketchTransitions'];
  inspectClosedSketch?: ReturnType<typeof createClosedSketchTransitionCommands>['inspectClosedSketch'];
  inspectSketchOffsets?: ReturnType<typeof createClosedSketchTransitionCommands>['inspectSketchOffsets'];
  createSketchOffset?: ReturnType<typeof createClosedSketchTransitionCommands>['createSketchOffset'];
  editSketchOffset?: ReturnType<typeof createClosedSketchTransitionCommands>['editSketchOffset'];
  removeSketchOffset?: ReturnType<typeof createClosedSketchTransitionCommands>['removeSketchOffset'];
  inspectClosedSketchMeasurements?: ReturnType<typeof createClosedSketchTransitionCommands>['inspectClosedSketchMeasurements'];
  createClosedSketchLengthMeasurement?: ReturnType<typeof createClosedSketchTransitionCommands>['createClosedSketchLengthMeasurement'];
  convertClosedSketchLengthRole?: ReturnType<typeof createClosedSketchTransitionCommands>['convertClosedSketchLengthRole'];
  applyClosedSketchOrientation?: ReturnType<typeof createClosedSketchTransitionCommands>['applyClosedSketchOrientation'];
  applyClosedSketchMidpoint?: ReturnType<typeof createClosedSketchTransitionCommands>['applyClosedSketchMidpoint'];
  applyClosedSketchAngleGroup?: ReturnType<typeof createClosedSketchTransitionCommands>['applyClosedSketchAngleGroup'];
  applyClosedSketchPointLineDistance?: ReturnType<typeof createClosedSketchTransitionCommands>['applyClosedSketchPointLineDistance'];
  applyClosedSketchPointDistance?: ReturnType<typeof createClosedSketchTransitionCommands>['applyClosedSketchPointDistance'];
  applySketchLengthRelation?: ReturnType<typeof createClosedSketchTransitionCommands>['applySketchLengthRelation'];
  applySketchConcentric?: ReturnType<typeof createClosedSketchTransitionCommands>['applySketchConcentric'];
  inspectClosedSketchCurvePoints?: ReturnType<typeof createClosedSketchTransitionCommands>['inspectClosedSketchCurvePoints'];
  editClosedSketchControlPoints?: ReturnType<typeof createClosedSketchTransitionCommands>['editClosedSketchControlPoints'];
  createClosedSketchMirror?: ReturnType<typeof createClosedSketchTransitionCommands>['createClosedSketchMirror'];
  createClosedSketchSlot?: ReturnType<typeof createClosedSketchTransitionCommands>['createClosedSketchSlot'];
  editClosedSketchSlot?: ReturnType<typeof createClosedSketchTransitionCommands>['editClosedSketchSlot'];
  editClosedSketchEllipse?: ReturnType<typeof createClosedSketchTransitionCommands>['editClosedSketchEllipse'];
  editClosedSketchPoint?: ReturnType<typeof createClosedSketchTransitionCommands>['editClosedSketchPoint'];
  editClosedSketchPoints?: ReturnType<typeof createClosedSketchTransitionCommands>['editClosedSketchPoints'];
  editClosedSketchDimension?: ReturnType<typeof createClosedSketchTransitionCommands>['editClosedSketchDimension'];
  removeClosedSketchDimension?: ReturnType<typeof createClosedSketchTransitionCommands>['removeClosedSketchDimension'];
  applyClosedSketchTangency?: ReturnType<typeof createClosedSketchTransitionCommands>['applyClosedSketchTangency'];
  removeClosedSketchTangency?: ReturnType<typeof createClosedSketchTransitionCommands>['removeClosedSketchTangency'];
  applyClosedSketchEqualLength?: ReturnType<typeof createClosedSketchTransitionCommands>['applyClosedSketchEqualLength'];
  removeClosedSketchLengthRelation?: ReturnType<typeof createClosedSketchTransitionCommands>['removeClosedSketchLengthRelation'];
  editClosedSketchLengthRelation?: ReturnType<typeof createClosedSketchTransitionCommands>['editClosedSketchLengthRelation'];
  applyClosedSketchEqualRadius?: ReturnType<typeof createClosedSketchTransitionCommands>['applyClosedSketchEqualRadius'];
  removeClosedSketchEqualRadius?: ReturnType<typeof createClosedSketchTransitionCommands>['removeClosedSketchEqualRadius'];
  applyClosedSketchCoincidence?: ReturnType<typeof createClosedSketchTransitionCommands>['applyClosedSketchCoincidence'];
  applyClosedSketchRadius?: ReturnType<typeof createClosedSketchTransitionCommands>['applyClosedSketchRadius'];
  applyClosedSketchFixEntity?: ReturnType<typeof createClosedSketchTransitionCommands>['applyClosedSketchFixEntity'];
  removeClosedSketchFixEntity?: ReturnType<typeof createClosedSketchTransitionCommands>['removeClosedSketchFixEntity'];
  applySketchDiameter?: ReturnType<typeof createClosedSketchTransitionCommands>['applySketchDiameter'];
  applySketchSignedDistance?: ReturnType<typeof createClosedSketchTransitionCommands>['applySketchSignedDistance'];
  applySketchLineRelation?: ReturnType<typeof createClosedSketchTransitionCommands>['applySketchLineRelation'];
  appendClosedSketchPrimitive?: ReturnType<typeof createClosedSketchTransitionCommands>['appendClosedSketchPrimitive'];
  removeClosedSketchPrimitive?: ReturnType<typeof createClosedSketchTransitionCommands>['removeClosedSketchPrimitive'];
  beginCenteredParentRepair?: (input:any,options?:any)=>Promise<any>;
  repairCenteredParent?: (input:any,options?:any)=>Promise<any>;
  inspectPhysicalParameters?: () => any;
  applyPhysicalDepth?: (args:any,options?:any) => Promise<any>;
  applyPhysicalConfigurations?: (args:any,options?:any) => Promise<any>;
  applyPhysicalBracket?: (args:any,options?:any) => Promise<any>;
  applyPhysicalEnclosure?: (args:any,options?:any) => Promise<any>;
  applyPhysicalSelectedProfile?: (args:any,options?:any) => Promise<any>;
  applyPhysicalBindings?: (args:any,options?:any) => Promise<any>;

  inspectRectangleCreation?: ReturnType<typeof createRectangleCreationCommands>['inspectRectangleCreation'];
  createRectangleSketch?: ReturnType<typeof createRectangleCreationCommands>['createRectangleSketch'];
  inspectLegacyExpressions?: ReturnType<typeof createLegacyExpressionCommands>['inspectLegacyExpressions'];
  applyLegacyExpressions?: ReturnType<typeof createLegacyExpressionCommands>['applyLegacyExpressions'];
  inspectRectangleDimensions?: ReturnType<typeof createRectangleEditingCommands>['inspectRectangleDimensions'];
  editRectangleDimensions?: ReturnType<typeof createRectangleEditingCommands>['editRectangleDimensions'];
  inspectWorkerFeatureCommands?: ReturnType<typeof createWorkerFeatureCommands>['inspectWorkerFeatureCommands'];
  inspectPublishedWorkerGeometry?: ReturnType<typeof createWorkerFeatureCommands>['inspectPublishedWorkerGeometry'];
  inspectWorkerHistory?: ReturnType<typeof createWorkerFeatureCommands>['inspectWorkerHistory'];
  editWorkerExtrusion?: ReturnType<typeof createWorkerFeatureCommands>['editWorkerExtrusion'];
  editWorkerCenteredHole?: ReturnType<typeof createWorkerFeatureCommands>['editWorkerCenteredHole'];
  editWorkerFourCornerHoles?: ReturnType<typeof createWorkerFeatureCommands>['editWorkerFourCornerHoles'];
  createWorkerEnclosure?: ReturnType<typeof createWorkerFeatureCommands>['createWorkerEnclosure'];
  createWorkerExtrusion?: ReturnType<typeof createWorkerFeatureCommands>['createWorkerExtrusion'];
  createWorkerCenteredHole?: ReturnType<typeof createWorkerFeatureCommands>['createWorkerCenteredHole'];
  createWorkerFourCornerHoles?: ReturnType<typeof createWorkerFeatureCommands>['createWorkerFourCornerHoles'];
  inspectWorkerFeatureDeletions?: ReturnType<typeof createWorkerFeatureDeleteCommands>['inspectWorkerFeatureDeletions'];
  deleteWorkerFeature?: ReturnType<typeof createWorkerFeatureDeleteCommands>['deleteWorkerFeature'];
  inspectWorkerThroughHoleParents?: ReturnType<typeof createWorkerThroughHoleParentCommands>['inspectWorkerThroughHoleParents'];
  repairWorkerThroughHoleParent?: ReturnType<typeof createWorkerThroughHoleParentCommands>['repairWorkerThroughHoleParent'];
  inspectWorkerShells?: ReturnType<typeof createWorkerShellCommands>['inspectWorkerShells'];
  createWorkerShell?: ReturnType<typeof createWorkerShellCommands>['createWorkerShell'];
  inspectWorkerShellHistory?: ReturnType<typeof createWorkerShellCommands>['inspectWorkerShellHistory'];
  editWorkerShell?: ReturnType<typeof createWorkerShellCommands>['editWorkerShell'];
  authoredSolidShellOperation?: (args:{revision:string;index:number;featureId:number;thickness?:number;direction?:'undo'|'redo'},options?:{signal?:AbortSignal;valid?:()=>boolean;beforePublish?:()=>boolean})=>Promise<Readonly<{changed:boolean;revision:string;thickness?:number;featureId?:number;index?:number}>>;
  inspectWorkerThroughHoles?: ReturnType<typeof createWorkerThroughHoleCommands>['inspectWorkerThroughHoles'];
  createWorkerThroughHole?: ReturnType<typeof createWorkerThroughHoleCommands>['createWorkerThroughHole'];
  inspectWorkerThroughHoleHistory?: ReturnType<typeof createWorkerThroughHoleCommands>['inspectWorkerThroughHoleHistory'];
  editWorkerThroughHole?: ReturnType<typeof createWorkerThroughHoleCommands>['editWorkerThroughHole'];
  inspectWorkerEdgeTreatments?: ReturnType<typeof createWorkerEdgeTreatmentCommands>['inspectWorkerEdgeTreatments'];
  createWorkerEdgeTreatment?: ReturnType<typeof createWorkerEdgeTreatmentCommands>['createWorkerEdgeTreatment'];
  inspectWorkerEdgeTreatmentHistory?: ReturnType<typeof createWorkerEdgeTreatmentCommands>['inspectWorkerEdgeTreatmentHistory'];
  editWorkerEdgeTreatment?: ReturnType<typeof createWorkerEdgeTreatmentCommands>['editWorkerEdgeTreatment'];

  modifications$: StateStream<CraftHistory>;
  models$: StateStream<MObject[]>;
  update$: Emitter<void>;
  pipelineFailure$: StateStream<any>
  engineCleanupFailure$: StateStream<any>
  readonly evaluationEpoch: number;
  readonly engineResourceUsage: {owners: number; candidates: number; accepted: number; detached: number; mounts: number; cleanupFailed: boolean};

  modify(request: OperationRequest, onAccepted: () => void, onError: (error) => void);

  modifyInHistoryAndStep(request: OperationRequest, onAccepted: () => void, onError: (error) => void);

  reset(modifications: OperationRequest[], options?: {documentGeneration: number});

  rebuild(): void;

  historyTravel: HistoryTravel;

  // Internal private-token UI seam, not a registered host authoring command.
  cancelHistoryReviewDraft(capture: HistoryReviewCancelCapture): void;
  navigateHistoryPosition(history:OperationRequest[],after:OperationRequest|null,options?:{signal?:AbortSignal;valid?:()=>boolean}):Promise<any>;

  runRequest(request: OperationRequest): Promise<OperationResult>;

  runPipeline(history: OperationRequest[], beginIndex: number, endIndex: number): Promise<void>;

  isEditingHistory: boolean;
  readonly isProcessing: boolean;
}

interface HistoryTravel {
  setPointer(pointer, hints:any);
  begin(hints?: any);
  end(hints?: any);
  forward(hints: any);
  backward(hints: any);
}

export interface CraftBundleContext {

  craftService: CraftService;
}

export const BundleName = "@Craft";
