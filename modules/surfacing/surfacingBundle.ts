/**
 * SurfacingBundle: creates a single SurfacingEditor at activation time.
 * The editor owns the scene — primitives add surfaces directly to it.
 */
import * as SceneGraph from 'scene/sceneGraph';
import {Group as ThreeGroup} from 'three';
import {state, StateStream} from 'lstream';
import {Scene} from './models/Scene/Scene.entity';
import {SurfacingEditor} from './SurfacingEditor';
import {createPatchPlane} from './primitives/plane';
import {createPatchBox} from './primitives/box';
import {createPatchCylinder} from './primitives/cylinder';
import {ViewFlagFacesAction, ViewFlagIsolinesAction, ViewFlagTessellationAction, ViewFlagEdgesAction, ViewFlagBoundariesAction} from './actions/viewFlagActions';
import {surfacingViewFlags$} from './surfacingViewFlags';

export interface SurfacingSnapshot {
  scene: Scene | null;
  revision: number;
}

export const surfacingState$: StateStream<SurfacingSnapshot> = state({scene: null, revision: 0});

export interface SurfacingService {
  readonly scene: Scene;
  readonly view: SurfacingEditor;
  state$: StateStream<SurfacingSnapshot>;
  addPlane(width?: number, height?: number): void;
  addBox(sizeX?: number, sizeY?: number, sizeZ?: number): void;
  addCylinder(radius?: number, height?: number): void;
  notifyChange(): void;
  save(): any;
  load(data: any): void;
  resetDocument(generation: number): void;
  scheduleSave(): void;
  flushSave(): void;
}

export function activate(ctx: any) {

  const state$ = surfacingState$;
  const AUTOSAVE_DELAY = 2000;
  let autosaveTimer: any = null;
  let owner = ctx.projectService;

  function isCurrent(): boolean {
    return ctx.projectService === owner && owner.isDocumentCurrent(owner.documentGeneration);
  }

  const workingGroup = new ThreeGroup();
  SceneGraph.addToGroup(ctx.services.cadScene.workGroup, workingGroup);
  const editor = new SurfacingEditor(workingGroup, ctx.viewer.sceneSetup, surfacingViewFlags$, ctx);

  function notifyChange(): void {
    state$.next({scene: editor.scene, revision: state$.value.revision + 1});
  }

  function afterMutation(): void {
    editor.commit();
    notifyChange();
    scheduleSurfacingSave();
  }

  function addPlane(width = 100, height = 100) {
    createPatchPlane(editor, width, height);
    afterMutation();
  }

  function addBox(sizeX = 100, sizeY = 100, sizeZ = 100) {
    createPatchBox(editor, sizeX, sizeY, sizeZ);
    afterMutation();
  }

  function addCylinder(radius = 50, height = 100) {
    createPatchCylinder(editor, radius, height);
    afterMutation();
  }

  function save(): any {
    if (editor.scene.surfaces.length === 0) return null;
    return {
      scene: editor.scene.serialize(),
      tessResolution: editor.resolution,
    };
  }

  function load(data: any): void {
    if (!data) return;
    const sceneData = data.scene || data.cage;
    if (!sceneData) {
      notifyChange();
      return;
    }
    const scene = Scene.deserialize(editor, sceneData);
    editor.resolution = data.tessResolution || 8;
    editor.loadScene(scene);
    notifyChange();
  }

  function resetDocument(generation: number): void {
    const project = ctx.projectService;
    if (!project.isDocumentCurrent(generation)) throw new DOMException('Stale surfacing reset.', 'AbortError');
    if (autosaveTimer) clearTimeout(autosaveTimer);
    autosaveTimer = null;
    owner = project;
    editor.setIdCounters({});
    editor.resolution = 8;
    editor.loadScene(new Scene(editor));
    notifyChange();
  }

  ctx.surfacingService = {
    get scene() { return editor.scene; },
    get view() { return editor; },
    state$,
    addPlane,
    addBox,
    addCylinder,
    notifyChange,
    save,
    load,
    resetDocument,
    scheduleSave: () => scheduleSurfacingSave(),
    flushSave: () => flushSave(),
  } as SurfacingService;

  if (!ctx.streams) ctx.streams = {};
  ctx.streams.surfacing = {state: state$};

  // Register the React UI component for surfacing tool panels.
  if (ctx.domService?.contributeComponent) {
    // Preserve existing lazy module initialization order.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const {SurfacingUI} = require('./ui/SurfacingUI');
    ctx.domService.contributeComponent(SurfacingUI);
  }

  if (ctx.actionService) {
    ctx.actionService.registerActions([
      ViewFlagFacesAction,
      ViewFlagIsolinesAction,
      ViewFlagTessellationAction,
      ViewFlagEdgesAction,
      ViewFlagBoundariesAction,
    ]);
  }

  function surfacingStorageKey(): string {
    return ctx.projectService.projectStorageKey() + '.surfacing';
  }

  function flushSave(): void {
    if (!isCurrent()) return;
    const surfacingData = save();
    if (surfacingData) {
      ctx.storageService.set(surfacingStorageKey(), JSON.stringify(surfacingData));
    } else {
      ctx.storageService.remove(surfacingStorageKey());
    }
  }

  function scheduleSurfacingSave(): void {
    if (!isCurrent()) return;
    if (autosaveTimer) clearTimeout(autosaveTimer);
    const project = owner, generation = owner.documentGeneration;
    autosaveTimer = setTimeout(() => {
      autosaveTimer = null;
      if (owner === project && project.isDocumentCurrent(generation)) flushSave();
    }, AUTOSAVE_DELAY);
  }

  try {
    const dataStr = ctx.storageService.get(surfacingStorageKey());
    if (dataStr) {
      load(JSON.parse(dataStr));
    }
  } catch (e) {
    console.error('Failed to load surfacing state:', e);
  }

  function forceFlush(): void {
    if (autosaveTimer) {
      clearTimeout(autosaveTimer);
      autosaveTimer = null;
    }
    try { flushSave(); } catch (e) { console.error('Surfacing flush failed:', e); }
  }
  window.addEventListener('beforeunload', forceFlush);
  window.addEventListener('pagehide', forceFlush);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') forceFlush();
  });
}

export const BundleName = "@Surfacing";
