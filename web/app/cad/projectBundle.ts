import {historyStateVersion} from '../../../modules/engine/solid/authoredHistoryState.mjs';
import {setSketchPrecision} from './sketch/sketchReader';
import {runSandbox} from './sandbox';
import {LOG_FLAGS} from './logFlags';
import {ApplicationContext} from "cad/context";
import {ProjectCounters, ProjectModel} from "./projectManager/projectManagerBundle";
import {DebugMode$} from "debugger/Debugger";
import {fillUpMissingFields} from "cad/craft/schema/initializeBySchema";
import {DocumentLifetime} from './projectManager/documentLifetime';
import {createHostLifetime} from './projectManager/hostLifetime.mjs';

export const STORAGE_GLOBAL_PREFIX = 'TCAD';
export const PROJECTS_PREFIX = `${STORAGE_GLOBAL_PREFIX}.projects.`;
export const SKETCH_SUFFIX = '.sketch.';


export function activate(ctx: ApplicationContext) {

  const [id, hints] = parseHintsFromLocation();

  initProjectService(ctx, id, hints);
}

export function initProjectService(ctx: ApplicationContext, id: string, hints: any) {

  const replacing = !!ctx.projectService;
  ctx.projectService?.dispose?.();
  const lifetime = new DocumentLifetime();
  const hostLifetime = createHostLifetime(() => dispose());
  let autosaveTimer: any = null;
  let detachAutosave: (() => void) | null = null;

  processParams(hints, ctx);

  const sketchNamespace = id + SKETCH_SUFFIX;
  const sketchStorageNamespace = PROJECTS_PREFIX + sketchNamespace;

  function sketchStorageKey(sketchIdId) {
    return sketchStorageNamespace + sketchIdId;
  }

  function projectStorageKey() {
    return PROJECTS_PREFIX + id;
  }

  function getSketchURL(sketchId) {
    return sketchNamespace + sketchId;
  }

  function save() {
    assertDocumentGeneration(lifetime.generation);
    // An explicit snapshot already persists the accepted state. Its previously
    // queued autosave must not rewrite the same workspace during an async
    // save/export and invalidate that captured revision. Future history edits
    // schedule their own timer and remain visible to the stale-state guards.
    if (autosaveTimer !== null) clearTimeout(autosaveTimer);
    autosaveTimer = null;
    ctx.storageService.set(projectStorageKey(), JSON.stringify(captureModel()));
  }

  // Same canonical model construction as save(), without a workspace write or
  // allocator/timer mutation. Snapshot callers detach and guard its live data.
  function captureModel(): ProjectModel {
    assertDocumentGeneration(lifetime.generation);
    const data: ProjectModel = {
      history: ctx.craftService.modifications$.value.history,
      expressions: ctx.expressionService.script$.value,

      // @ts-ignore we deliberately don't uplift the type to the ApplicationContext in order to be able to use ProjectService in the headless mode
      assembly: ctx.assemblyService && ctx.assemblyService.getConstraints()
    };

    const currentWorkbench = ctx.workbenchService.currentWorkbench$.value;

    if (!currentWorkbench?.internal && ctx.workbenchService.defaultWorkbenchId !== currentWorkbench.workbenchId) {
      data.workbench = currentWorkbench.workbenchId;
    }
    const historyState=historyStateVersion(data.history);
    if(historyState===1)data.historyStateVersion=historyState;
    data.counters = counterGenerator.projectCounters;
    return data;
  }

  function load() {
    const generation = beginDocumentChange();
    try {
      if (ctx.storageService.get(projectStorageKey())) loadStrict(generation);
    } catch (e) {
      console.error(e);
    }
  }

  // A host-driven restore needs to receive load errors rather than silently
  // treating a caught exception as a successfully reconstructed project.
  function loadStrict(expectedGeneration?: number) {
    const generation = adoptOrBegin(expectedGeneration);
    const dataStr = ctx.storageService.get(projectStorageKey());
    if (!dataStr) throw new Error('Project data is unavailable.');
    const data = JSON.parse(dataStr);
    // A legacy same-project workspace reload explicitly owns its sidecar.
    // Capture it before clearing the view; host envelopes use their own field.
    const surfaceText = ctx.surfacingService && ctx.storageService.get(projectStorageKey() + '.surfacing');
    const surfaceData = surfaceText ? JSON.parse(surfaceText) : null;
    loadData(data, generation, true);
    if (surfaceData) ctx.surfacingService.load(surfaceData);
    assertDocumentGeneration(generation);
    loadWorkbench(data);
  }

  function upgradeIfNeeded(data: ProjectModel) {
    const history = data.history || [];
    const existing = history.map(req => Number(req.params && req.params.featureId))
      .filter(id => Number.isSafeInteger(id) && id > 0);
    const persisted = Number(data.counters && data.counters.featureId);
    counterGenerator.projectCounters = {featureId: Math.max(0, ...existing, Number.isSafeInteger(persisted) ? persisted : 0)};
    for (const req of history) {
      const operation = ctx.operationService.get(req.type);
      if (operation) {
        fillUpMissingFields(req.params, operation.schema, ctx);
        // Reserve -1 for legacy replay: assigning a new prefix here would
        // invalidate later face/edge and sketch references in saved projects.
        if (req.params.featureId === undefined || req.params.featureId === null) req.params.featureId = -1;
      }
    }
    data.counters = counterGenerator.projectCounters;
  }

  function loadWorkbench(data: ProjectModel) {
    if (data.workbench) {
      ctx.workbenchService.switchWorkbench(data.workbench, true);
    }
  }

  function loadData(data: ProjectModel, expectedGeneration?: number, preserveSurfaceCache = false) {
    const generation = adoptOrBegin(expectedGeneration);
    upgradeIfNeeded(data);
    assertDocumentGeneration(generation);
    ctx.projectManager?.resetDocumentState?.(generation);
    ctx.surfacingService?.resetDocument(generation);
    assertDocumentGeneration(generation);
    if (!preserveSurfaceCache) ctx.storageService.remove(projectStorageKey() + '.surfacing');
    if (typeof data.expressions === 'string') {
      ctx.expressionService.load(data.expressions);
    }
    assertDocumentGeneration(generation);
    if (data.history) {
      ctx.craftService.reset(data.history, {documentGeneration: generation});
    }
    assertDocumentGeneration(generation);

    // @ts-ignore we deliberately don't uplift the type to the ApplicationContext in order to be able to use ProjectService in the headless mode
    if (ctx.assemblyService) {
      // @ts-ignore
      ctx.assemblyService.loadConstraints(data.assembly || []);
    }

  }

  function empty() {
    const generation = beginDocumentChange();
    for (const key of ctx.storageService.getAllKeysFromNamespace(sketchStorageNamespace)) {
      assertDocumentGeneration(generation);
      ctx.storageService.remove(key);
    }
    assertDocumentGeneration(generation);
    ctx.storageService.remove(projectStorageKey());
    loadData({
      history: [],
      expressions: ""
    }, generation);
  }

  const AUTOSAVE_DELAY = 2000;

  function isDocumentCurrent(generation: number): boolean {
    return ctx.projectService === service && lifetime.isCurrent(generation) && hostLifetime.current()
      && ctx.projectService === service && lifetime.isCurrent(generation);
  }

  function assertDocumentGeneration(generation: number): void {
    if (!isDocumentCurrent(generation)) throw new DOMException('Document was replaced or closed.', 'AbortError');
  }

  function beginDocumentChange(): number {
    assertDocumentGeneration(lifetime.generation);
    if (autosaveTimer) clearTimeout(autosaveTimer);
    autosaveTimer = null;
    const generation = lifetime.begin();
    assertDocumentGeneration(generation);
    return generation;
  }

  function adoptOrBegin(expectedGeneration?: number): number {
    const generation = expectedGeneration === undefined ? beginDocumentChange() : expectedGeneration;
    assertDocumentGeneration(generation);
    return generation;
  }

  function dispose(): void {
    hostLifetime.dispose();
    lifetime.dispose();
    if (autosaveTimer) clearTimeout(autosaveTimer);
    autosaveTimer = null;
    clearTimeout(attachAutosaveTimer);
    detachAutosave?.();
    detachAutosave = null;
    if (typeof window !== 'undefined') window.removeEventListener('pagehide', dispose);
  }

  function scheduleSave() {
    const generation = lifetime.generation;
    if (!isDocumentCurrent(generation)) return;
    if (autosaveTimer) clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => {
      autosaveTimer = null;
      if (!isDocumentCurrent(generation)) return;
      // A prior edit's timer must not write the workspace while a private
      // candidate is being evaluated. Save the accepted revision afterwards.
      if (ctx.craftService?.isProcessing) { scheduleSave(); return; }
      if (!ctx.projectManager?.isRestoring) save();
    }, AUTOSAVE_DELAY);
  }

  // Autosave on history changes (deferred — craftService loads after projectService)
  const attachAutosaveTimer = setTimeout(() => {
    if (ctx.craftService && isDocumentCurrent(lifetime.generation)) {
      detachAutosave = ctx.craftService.modifications$.attach(() => scheduleSave());
    }
  }, 0);

  const counterGenerator = new ProjectCounterGenerator(new ProjectCounters());

  const service: ProjectService = {
    get documentGeneration() { return lifetime.generation; },
    get documentSignal() { return lifetime.signal; },
    get hasHostLifetime() { return hostLifetime.bound; },
    bindHostLifetime(input) { assertDocumentGeneration(lifetime.generation); hostLifetime.bind(input); },
    beginDocumentChange, isDocumentCurrent, dispose,
    id, sketchStorageKey, projectStorageKey, sketchStorageNamespace, getSketchURL, save, captureModel, load, loadStrict, loadData, empty,
    hints, scheduleSave, counterGenerator

  };
  ctx.projectService = service;
  if (replacing) {
    // Switching service clears the view, while leaving the destination's saved
    // workspace available for an explicit load().
    loadData({history: [], expressions: ''}, lifetime.generation, true);
  } else {
    ctx.projectManager?.resetDocumentState?.(lifetime.generation);
  }
  if (typeof window !== 'undefined') window.addEventListener('pagehide', dispose, {once: true});

}

function parseHintsFromLocation() {
  let hints = window.location.hash.substring(1);
  if (!hints) {
    hints = window.location.search.substring(1);
  }
  if (!hints) {
    hints = "DEFAULT";
  }
  return parseHints(hints);
}

function parseHints(hints) {
  const [id, ...paramsArr] = hints.split('&');
  const params = paramsArr.reduce((params, part) => {
    let [key, value] = part.split('=');
    if (key) {
      if (!value) {
        value = true;
      }
      params[key] = value;
    }
    return params;
  }, {});
  return [id, params];
}

function processParams(params, context) {
  if (params.sketchPrecision) {
    setSketchPrecision(parseInt(params.sketchPrecision));
  }  
  if (params.sandbox) {
    setTimeout(() => runSandbox(context));
  }
  
  const LOG_FLAGS_PREFIX = "LOG.";
  Object.keys(params).forEach(key => {
    if (key.startsWith(LOG_FLAGS_PREFIX)) {
      LOG_FLAGS[key.substring(LOG_FLAGS_PREFIX.length)] = true
    }
  });

  if (params.debug) {
    DebugMode$.next(true);
  }
}

export class ProjectCounterGenerator {

  private counters: ProjectCounters;
  private readonly unconsumedFeatureIds = new Set<number>();

  get projectCounters(): ProjectCounters { return this.counters; }
  set projectCounters(value: ProjectCounters) {
    this.counters = value;
    this.unconsumedFeatureIds.clear();
  }

  constructor(projectCounters) {
    this.projectCounters = projectCounters;
  }

  generateFeatureId(): string {
    if (!Number.isSafeInteger(this.counters.featureId) || this.counters.featureId < 0 || this.counters.featureId === Number.MAX_SAFE_INTEGER) {
      throw new Error('Feature ID allocator is exhausted or invalid.');
    }
    const id = ++this.counters.featureId;
    // A forgotten or replaced wizard must not grow this set indefinitely.
    // Evicted IDs remain permanently skipped by the high-water mark.
    if (this.unconsumedFeatureIds.size >= 256) this.unconsumedFeatureIds.delete(this.unconsumedFeatureIds.values().next().value);
    this.unconsumedFeatureIds.add(id);
    return id + "";
  }

  releaseFeatureId(rawId: unknown): void {
    if (typeof rawId !== 'string' && typeof rawId !== 'number') return;
    const id = Number(rawId);
    if (Number.isSafeInteger(id) && id > 0) this.unconsumedFeatureIds.delete(id);
  }

  // A wizard can claim an ID it already reserved; a direct caller can claim
  // only a fresh ID above the high-water mark. Consumed/skipped IDs are never
  // made available again, including when an operation later fails.
  claimNewFeatureId(id: number): void {
    if (!Number.isSafeInteger(id) || id <= 0 || !Number.isSafeInteger(this.counters.featureId) || this.counters.featureId < 0) {
      throw new Error('Invalid feature ID allocator.');
    }
    if (id <= this.counters.featureId && !this.unconsumedFeatureIds.has(id)) throw new Error('Feature ID was already used.');
    this.unconsumedFeatureIds.delete(id);
    this.counters.featureId = Math.max(this.counters.featureId, id);
  }
}

export interface ProjectService {

  readonly documentGeneration: number;
  readonly documentSignal: AbortSignal;
  readonly hasHostLifetime: boolean;
  bindHostLifetime(input: {signal: AbortSignal, valid: () => boolean}): void;
  beginDocumentChange(): number;
  isDocumentCurrent(generation: number): boolean;
  dispose(): void;

  readonly id: string;

  readonly sketchStorageNamespace: string;

  hints: any;

  sketchStorageKey(sketchId: string): string;

  projectStorageKey(): string

  getSketchURL(sketchId: string): string

  save(): void;

  captureModel(): ProjectModel;

  scheduleSave(): void;

  load(): void

  loadStrict(expectedGeneration?: number): void;

  loadData(data: ProjectModel, expectedGeneration?: number);

  empty(): void;

  counterGenerator: ProjectCounterGenerator;
}

export interface ProjectBundleContext {

  projectService: ProjectService;

}

export const BundleName = "@Project";

