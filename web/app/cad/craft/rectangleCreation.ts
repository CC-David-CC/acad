import {captureSketchFailure} from 'sketcher/constr/admissionCause.mjs';
import {runSketchSolve} from 'sketcher/headless/client';
import rectangleWorkerUrl from 'codi-headless-sketch-worker';
import {validateProjectSketch} from 'sketcher/io';
import {ReadSketch} from '../sketch/sketchReader';
import {sketchBoundaryFrame, boundaryGeometryClose} from '../sketch/boundaryValidity';
import {MOpenFaceShell} from '../model/mopenFace';
import {PreparedWorkspaceWrites} from '../storage/storageBundle';
import {CraftHistory} from './craftBundle';

// Private to the craft coordinator. Callers cannot supply publication hooks.
export interface PreparedSketchCommand {
  // Internal cancellation scope assigned by the craft interceptor.
  candidateScope?: {epoch: number | null};
  // Private evaluation-only source, never installed in the live workspace.
  readonly sketchOverrides?: ReadonlyArray<Readonly<{id: string; data: string}>>;
  // Bind saved frame metadata to the actual reconstructed source plane.
  readonly sketchSourceFrames?: ReadonlyArray<Readonly<{id:string;frame:any}>>;
  // Static removal only for a privately verified source-producer creation Undo.
  readonly sketchRemovedIds?: ReadonlyArray<string>;
  readonly expressionPublication?: any;
  // Private one-use source-replay capability; never a caller/wire boolean.
  readonly nativeSourceReplay?: object;
  requireCurrent(): void;
  prepare(models: any[], history: CraftHistory): Promise<PreparedWorkspaceWrites>;
  requireCommittedCurrent(): void;
}

function aborted(committed = false, reason = '') {
  const message = committed ? 'Accepted rectangle was superseded.' : 'Rectangle creation was cancelled or superseded.';
  const error = new DOMException(message + (reason ? ' ' + reason : ''), 'AbortError');
  Object.defineProperty(error, 'committed', {value: committed, enumerable: true});
  return error;
}

// Capture the small command without invoking getters or coercing values. The
// worker repeats geometric/numerical validation in its isolated realm.
function captureRequest(input) {
  const prototype = input && typeof input === 'object' ? Object.getPrototypeOf(input) : undefined;
  if (!input || typeof input !== 'object' || Array.isArray(input) ||
      (prototype !== null && Object.getPrototypeOf(prototype) !== null) ||
      Reflect.ownKeys(input).sort().join(',') !== 'depth,height,origin,revision,unit,width') throw new Error('Invalid rectangle command.');
  const out: any = {};
  for (const key of ['depth','height','origin','revision','unit','width']) {
    const d = Object.getOwnPropertyDescriptor(input, key);
    if (!d?.enumerable || !Object.prototype.hasOwnProperty.call(d, 'value')) throw new Error('Rectangle fields must be data.');
    out[key] = d.value;
  }
  if (out.unit !== 'millimeter' || typeof out.revision !== 'string' || !out.revision || out.revision.length > 256 ||
      ![out.width, out.height].every(n => typeof n === 'number' && Number.isFinite(n) && n >= 0.001 && n <= 1e6) ||
      typeof out.depth !== 'number' || !Number.isFinite(out.depth) || Math.abs(out.depth) > 1e8) throw new Error('Unsupported rectangle units or dimensions.');
  if (!Array.isArray(out.origin) || out.origin.length !== 2 || Reflect.ownKeys(out.origin).sort().join(',') !== '0,1,length') throw new Error('A two-coordinate local origin is required.');
  out.origin = [0,1].map(i => {
    const d = Object.getOwnPropertyDescriptor(out.origin, String(i)), n = d?.value;
    if (!d?.enumerable || !Object.prototype.hasOwnProperty.call(d,'value') || typeof n !== 'number' || !Number.isFinite(n) || Math.abs(n) > 1e8) throw new Error('Invalid rectangle origin.');
    return n;
  });
  return out;
}

function validateIntent(sketch, evidence, args) {
  const expected: any[] = Array.from({length:4}, (_,i) => ({typeId:'PCoincident', objects:['rect-'+i+':B','rect-'+((i+1)%4)+':A']}));
  for (let i=0;i<4;i++) expected.push({typeId:i%2 ? 'Vertical' : 'Horizontal', objects:['rect-'+i], constants:{angle:String(i*90)}});
  expected.push({typeId:'LockPoint', objects:['rect-0:A'], constants:{x:String(args.origin[0]),y:String(args.origin[1])}},
    {typeId:'SegmentLength', objects:['rect-0'], constants:{length:String(args.width)}},
    {typeId:'SegmentLength', objects:['rect-1'], constants:{length:String(args.height)}});
  if (sketch.dimensions.length || sketch.labels.length || sketch.constants !== '' || sketch.stages[0].generators.length ||
      ['lines','arcs','circles','nurbses'].some(k => !Array.isArray(sketch.boundary?.[k]) || sketch.boundary[k].length)) throw new Error('Unexpected rectangle content.');
  for (let i=0;i<11;i++) {
    const want=expected[i], actual=sketch.stages[0].constraints[i], e=evidence[i], angular=i>=4&&i<8;
    const residualCount=i<4||i===8 ? 2 : 1, tolerance=angular ? 1e-8 : 1e-6;
    if (actual.typeId !== want.typeId || actual.stage !== 0 || actual.admission?.version !== 1 || actual.admission?.state !== 'accepted' ||
        JSON.stringify(actual.objects) !== JSON.stringify(want.objects) || JSON.stringify(actual.constants) !== JSON.stringify(want.constants) ||
        e.typeId !== want.typeId || e.state !== 'accepted' || e.unit !== (angular?'radian':'millimeter') || e.tolerance !== tolerance ||
        e.residuals.length !== residualCount || e.residuals.some(n=>!Number.isFinite(n)||Math.abs(n)>tolerance)) throw new Error('Rectangle constraint intent or residual evidence changed.');
  }
}

export function createRectangleCreationCommands(ctx: any, submit) {
  const trackedStreams = () => [ctx.craftService.modifications$, ctx.craftService.models$, ctx.craftService.pipelineFailure$, ctx.craftService.engineCleanupFailure$,
    ctx.expressionService.script$, ctx.expressionService.list$, ctx.expressionService.errors$,
    ctx.streams.sketcher.sketchingFace, ctx.wizardService.workingRequest$,
    ctx.workbenchService.currentWorkbench$, ctx.assemblyService.constraints$];
  const services = () => [ctx.projectService, ctx.storageService, ctx.craftService, ctx.expressionService,
    ctx.projectManager, ctx.services.sketcher, ctx.wizardService, ctx.workbenchService, ctx.assemblyService];
  let fingerprint = [], token: string;
  const revision = () => {
    const now = [...services(), ctx.projectService.documentGeneration, ctx.projectService.documentSignal,
      ctx.storageService.namespaceRevision(ctx.projectService.sketchStorageNamespace), ctx.craftService.evaluationEpoch, ...trackedStreams().flatMap(s => [s, s.revision])];
    if (!token || now.some((value,i) => value !== fingerprint[i])) {
      fingerprint = now; token = crypto.randomUUID();
    }
    return token;
  };
  function unavailable() {
    if (!ctx.projectService.isDocumentCurrent(ctx.projectService.documentGeneration)) return 'Document is closed.';
    if (ctx.storageService.revision === null) return 'A WebOS volatile workspace is required.';
    if (ctx.craftService.engineCleanupFailure$.value) return 'Engine cleanup failed. Close and reopen this CAD window.';
    if (ctx.projectManager?.isRestoring || ctx.craftService.isProcessing) return 'Another operation is in progress.';
    if (ctx.craftService.isEditingHistory || ctx.craftService.pipelineFailure$.value) return 'Return to a valid latest history first.';
    if (ctx.services.sketcher.inPlaceEditor.inEditMode || ctx.wizardService.workingRequest$.value) return 'Finish the open editor or operation first.';
    if (ctx.projectManager.unit !== 'millimeter' || ctx.expressionService.errors$.value.length) return 'Fix the document units or expressions first.';
    const w = ctx.workbenchService.currentWorkbench$.value;
    if (ctx.assemblyService.getConstraints().length || (w && !w.internal && w.workbenchId !== ctx.workbenchService.defaultWorkbenchId)) return 'This command requires the standard part workbench.';
    return null;
  }
  function inspectRectangleCreation() {
    const reason = unavailable();
    return {ready: !reason, reason, revision: revision(), unit: 'millimeter', plane: 'XY',
      dimensions: {min: 0.001, max: 1e6}, localCoordinateLimit: 1e8, depthLimit: 1e8};
  }
  async function createRectangleSketch(input, options: {signal?: AbortSignal; valid?: () => boolean} = {}) {
    if (options.valid !== undefined && typeof options.valid !== 'function') throw new Error('Invalid lifetime guard.');
    const hostValid = () => { try { return !options.valid || options.valid() === true; } catch { return false; } };
    const args = captureRequest(input), reason = unavailable();
    if (reason) throw new Error(reason);
    if (options.signal) {
      // Native brand validation accepts a parent-frame AbortSignal too.
      try { Object.getOwnPropertyDescriptor(AbortSignal.prototype, 'aborted').get.call(options.signal); }
      catch { throw new Error('Invalid cancellation signal.'); }
    }
    if (options.signal?.aborted || !hostValid() || args.revision !== revision()) throw aborted();
    const project = ctx.projectService, storage = ctx.storageService, craft = ctx.craftService,
      expressions = ctx.expressionService, manager = ctx.projectManager, documentGeneration = project.documentGeneration,
      workbench = ctx.workbenchService.currentWorkbench$.value, table = expressions.table$.value,
      streams = trackedStreams(), versions = streams.map(s => s.revision), storageRevision = storage.revision, capturedServices = services();
    const controller = new AbortController(), stop = () => controller.abort();
    const signals = [project.documentSignal, options.signal].filter(Boolean);
    for (const signal of signals) signal.addEventListener('abort', stop, {once: true});
    if (signals.some(s => s.aborted)) stop();
    const alive = () => hostValid() && !controller.signal.aborted && ctx.projectService === project && project.isDocumentCurrent(documentGeneration) &&
      ctx.storageService === storage && ctx.craftService === craft && ctx.expressionService === expressions && ctx.projectManager === manager;
    function requireCurrent() {
      if (!alive() || services().some((service,i) => service !== capturedServices[i])) throw aborted(false, 'Document services changed.');
      if (storage.revision !== storageRevision) throw aborted(false, 'Workspace bytes changed.');
      const changed = trackedStreams().findIndex((s,i) => s !== streams[i] || s.revision !== versions[i]);
      if (changed !== -1) throw aborted(false, ['History','Models','Model validity','Expression source','Expression values','Expression errors','Sketch editor','Operation editor','Workbench','Assembly'][changed] + ' revision changed.');
      if (expressions.table$.value !== table || ctx.workbenchService.currentWorkbench$.value !== workbench ||
          ctx.services.sketcher.inPlaceEditor.inEditMode || ctx.wizardService.workingRequest$.value || manager.isRestoring ||
          ctx.assemblyService.getConstraints().length) throw aborted(false, 'Document is no longer ready.');
    }
    let prepared: PreparedWorkspaceWrites = null, receipt = null;
    try {
      requireCurrent();
      const featureId = project.counterGenerator.generateFeatureId();
      const preparation: PreparedSketchCommand = {
        requireCurrent,
        requireCommittedCurrent() { if (!alive()) throw aborted(true); },
        async prepare(models, history) {
          requireCurrent();
          const created = models.filter(m => m.originatingOperation === history.pointer);
          if (created.length !== 1 || !(created[0] instanceof MOpenFaceShell) || created[0].faces.length !== 1) throw new Error('Plane did not produce one editable face.');
          const face = created[0].faces[0], key = project.sketchStorageKey(face.defaultSketchId), frame = sketchBoundaryFrame(face);
          if (storage.exists(key)) throw new Error('The new face already has sketch data. Resolve that reference before creating a sketch.');
          const request = {task: 'rectangle', revision: args.revision, unit: args.unit, frame,
            origin: args.origin, width: args.width, height: args.height};
          const result = await runSketchSolve(rectangleWorkerUrl, request,
            {signal: controller.signal, valid: () => { try { requireCurrent(); return true; } catch { return false; } }});
          requireCurrent();
          if (!result.ok) {
            const failure=captureSketchFailure(result.error),error=new Error(failure.message);
            Object.defineProperty(error,'code',{value:failure.code,enumerable:true});
            if(failure.cause)Object.defineProperty(error,'cause',{value:failure.cause,enumerable:true});
            throw error;
          }
          // Only this fixed four-edge result is projected on the main thread.
          // Solving and serialization remain in the worker, with no canvas.
          if (typeof result.serializedSketch !== 'string' || result.serializedSketch.length > 32768) throw new Error('Invalid rectangle serialization.');
          const sketch = JSON.parse(result.serializedSketch);
          validateProjectSketch(sketch);
          if (!Array.isArray(sketch.objects) || sketch.objects.length !== 4 || sketch.stages.length !== 1 ||
              sketch.stages[0].constraints.length !== 11 || !boundaryGeometryClose(frame, sketch.metadata?.boundaryFrame) ||
              !boundaryGeometryClose(frame, sketchBoundaryFrame(face)) || !boundaryGeometryClose(sketch, result.sketch) ||
              result.evidence.length !== 11 || result.evidence.some(e => e.state !== 'accepted' || !Array.isArray(e.residuals) ||
                !Number.isFinite(e.tolerance) || e.tolerance < 0 || e.residuals.some(n => !Number.isFinite(n) || Math.abs(n) > e.tolerance))) throw new Error('Rectangle worker evidence is inconsistent.');
          validateIntent(sketch, result.evidence, args);
          const [x,y] = args.origin, points = [[x,y],[x+args.width,y],[x+args.width,y+args.height],[x,y+args.height]];
          // Coordinate offset must not relax the dimensional check: a 0.001 mm
          // side at x=1e8 still needs to remain 0.001 mm, not merely within 0.1.
          const closePoint = (actual, expected) => actual && ['x','y'].every((k,j) =>
            Number.isFinite(actual[k]) && Math.abs(actual[k]-expected[j]) <= 1e-8);
          sketch.objects.forEach((o,i) => {
            const p = points[i], q = points[(i+1)%4];
            if (o.id !== 'rect-'+i || o.type !== 'Segment' || o.role !== null || o.stage !== 0 ||
                !closePoint(o.data.a,p) || !closePoint(o.data.b,q) ||
                Math.abs(Math.hypot(o.data.b.x-o.data.a.x,o.data.b.y-o.data.a.y) - (i%2 ? args.height : args.width)) > 1e-8) throw new Error('Rectangle dimensions do not match the requested geometry.');
          });
          face.setSketch(ReadSketch(sketch, face.defaultSketchId, true));
          face.ext.sketchInitialized = true;
          if (face.sketchRegionError || face.sketchRegions.length !== 1 || face.sketchLoops.length !== 1 || face.sketchObjects.length !== 4) throw new Error('Rectangle does not define one bounded region.');
          requireCurrent();
          prepared = storage.prepareWrites([{key, value: result.serializedSketch}]);
          receipt = {featureId: Number(featureId), faceId: face.id, regionId: face.sketchRegions[0].id, unit: args.unit, persistence: 'volatile-workspace'};
          return prepared;
        }
      };
      await new Promise<void>((resolve, reject) => submit({type:'PLANE', params:{featureId, orientation:'XY', depth:args.depth, datum:null}}, resolve, reject, preparation));
      return {...receipt, revision: revision()};
    } finally {
      prepared?.discard();
      for (const signal of signals) signal.removeEventListener('abort', stop);
    }
  }
  return {inspectRectangleCreation, createRectangleSketch};
}
