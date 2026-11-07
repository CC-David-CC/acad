import {MShell} from '../model/mshell';
import {MObject} from "../model/mobject";
import {ApplicationContext} from "cad/context";
import {Stream} from "lstream";
import {MFace} from "../model/mface";
import {MEdge} from "../model/medge";
import {MVertex} from "../model/mvertex";
import {MSketchRegion} from '../model/msketchRegion';
import {MSketchObject} from "../model/msketchObject";
import {MDatum, MDatumAxis} from "../model/mdatum";
import {MLoop, MSketchLoop} from "../model/mloop";


export function activate(ctx: ApplicationContext) {
  const {streams, services} = ctx;

  const workerOwned = (object: MObject) => !!object?.root?.ext?.workerGeometry;
  const transient = (object: MObject) => (object instanceof MEdge && object.ext?.workerIdentity?.stability === 'transient') || (object instanceof MVertex && object.ext?.vertexIdentity?.stability === 'transient');
  function checkWorkerFace(object: MObject, sketchStorage = ctx.sketchStorageService) {
    if (!(object instanceof MFace) || !workerOwned(object)) return;
    if (object.sketch || object.sketchObjects.length || object.sketchLoops.length || object.sketchRegions.length || typeof sketchStorage?.getSketchData !== 'function' || sketchStorage.getSketchData(object.defaultSketchId) !== null) {
      throw new Error('Sketches on worker-owned faces are unsupported; resolve the existing sketch data first.');
    }
  }
  function addChecked(index: Map<string,MObject>, object: MObject) {
    const worker=workerOwned(object), previous=index.get(object.id);
    if (worker && (typeof object.id !== 'string' || !object.id || (!transient(object) && object.id.length > 1024))) {
      throw new Error('Worker model has an invalid or oversized durable reference.');
    }
    if (previous && previous !== object && (worker || workerOwned(previous))) throw new Error('Worker model identity collides with another model entity.');
    index.set(object.id, object);
  }
  function checkedIndex(models: MObject[], sketchStorage = ctx.sketchStorageService) {
    const index = new Map<string,MObject>();
    models.forEach(model => model.traverse(m => { checkWorkerFace(m,sketchStorage); addChecked(index,m); }));
    return index;
  }
  let projection: {models: MObject[], shells: MShell[], index: Map<string,MObject>, hadWorker: boolean} = null;
  function projectModels(models: MObject[]) {
    // A worker model or its IDs may have changed in place; never reuse its old
    // projection without rechecking identities and unsupported sketch storage.
    if (projection?.models === models && !projection.hadWorker && !models.some(workerOwned)) return projection;
    const index = checkedIndex(models);
    projection = {models, index, shells: models.filter(m => m instanceof MShell) as MShell[], hadWorker:models.some(workerOwned)};
    return projection;
  }
  const shells$: Stream<MShell> = streams.craft.models.map(models => projectModels(models).shells).remember();
  const modelIndex$ = streams.craft.models.map(models => projectModels(models).index).remember();

  // Install derived lookup values before notifying any accepted-model observer.
  // Their normal notifications still come from the models stream, in order.
  function preparePublication(models: MObject[]) {
    const prepared = projectModels(models);
    return [{stream:shells$, value:prepared.shells, notify:false},
      {stream:modelIndex$, value:prepared.index, notify:false}];
  }

  // The candidate registry belongs only to the evaluation context. Public
  // registry getters and streams continue to expose the accepted revision.
  function createEvaluationRegistry(sketchStorage = ctx.sketchStorageService) {
    let models: MObject[] = [];
    let candidateIndex = new Map<string, MObject>();
    // Evaluation-private evidence of actual source adoption. A source may be
    // attached to a real face which a later feature consumes, so final-model
    // membership alone cannot establish complete native project restoration.
    const resolvedSketchSources = new Set<string>();
    let pendingModels: (() => MObject[]) = null, flushing = false;
    // Evaluation-private batching only. Every lookup and final publication
    // flushes through the unchanged strict preflight/initialization below.
    function stageModels(next: () => MObject[]) {
      if (typeof next !== 'function' || flushing) throw new Error('Invalid staged candidate registry.');
      pendingModels = next;
    }
    function flushModels() {
      if (!pendingModels) return;
      if (flushing) throw new Error('Reentrant candidate registry preparation.');
      flushing = true;
      try { setModels(pendingModels()); } finally { flushing = false; }
    }
    function setModels(next: MObject[]) {
      // Preflight before sketch initialization or any candidate index change.
      checkedIndex(next,sketchStorage);
      const newlyResolved = new Set<string>();
      for (const model of next) {
        model.traverse(object => {
          if (object instanceof MFace && !workerOwned(object) && !object.ext.sketchInitialized) {
            const id = object.defaultSketchId, sketch = sketchStorage.readSketch(id);
            object.setSketch(sketch);
            // setSketch intentionally ignores nonplanar faces. A mere read or
            // existing storage key is not proof that a face adopted the data.
            if (sketch !== null && sketch !== undefined && object.sketch === sketch && object.defaultSketchId === id) newlyResolved.add(id);
            object.ext.sketchInitialized = true;
          }
        });
      }
      const index = checkedIndex(next,sketchStorage);
      models = next; candidateIndex = index; pendingModels = null;
      newlyResolved.forEach(id => resolvedSketchSources.add(id));
    }
    function assertSketchSourcesResolved(ids: readonly string[]): void {
      const invalid = () => Object.assign(new Error('Invalid saved sketch source inventory.'), {code:'INVALID_SKETCH_SOURCE_INVENTORY'});
      // Match the existing native-project sketch/key limits. Capture only
      // primitive IDs, without walking source geometry or unrelated metadata.
      if (!Array.isArray(ids) || ids.length > 10000 || Reflect.ownKeys(ids).length !== ids.length + 1) throw invalid();
      const required = new Set<string>();
      for (let i = 0; i < ids.length; i++) {
        const descriptor = Object.getOwnPropertyDescriptor(ids, String(i));
        const id = descriptor && Object.prototype.hasOwnProperty.call(descriptor, 'value') ? descriptor.value : undefined;
        if (!descriptor?.enumerable || typeof id !== 'string' || !id || id.length > 1024 ||
            /[\u0000-\u001f\u007f]/.test(id) || required.has(id)) throw invalid();
        required.add(id);
      }
      flushModels();
      for (const id of required) if (!resolvedSketchSources.has(id)) {
        throw Object.assign(new Error('A saved sketch source did not resolve onto a recreated owning face.'), {code:'UNRESOLVED_SKETCH_SOURCE'});
      }
    }
    const find = (id: string) => { flushModels(); return candidateIndex.get(id); };
    const result = {
      setModels, stageModels, flushModels, assertSketchSourcesResolved, find, findShell: find, findFace: find, findEdge: find,
      findSketchObject: find, findDatum: find, findDatumAxis: find, findLoop: find,
      findEntity: (_entity, id) => find(id),
      getAllShells: () => { flushModels(); return models.filter(m => m instanceof MShell); },
      get models() { flushModels(); return models; },
      get shells() { flushModels(); return models.filter(m => m instanceof MShell); },
      get modelIndex() { flushModels(); return candidateIndex; },
      get isEvaluating() { return true; },
      reindexFace(face: MFace) {
        flushModels();
        checkWorkerFace(face,sketchStorage);
        const next = new Map(candidateIndex);
        for (const [id, object] of next) {
          if ((object instanceof MSketchRegion || object instanceof MSketchObject || object instanceof MSketchLoop) && object.face === face) next.delete(id);
        }
        face.traverseSketchRelatedEntities(obj => addChecked(next, obj));
        candidateIndex.clear();next.forEach((object,id)=>candidateIndex.set(id,object));
      }
    };
    return result;
  }

  function reindexFace(face: MFace) {
    // Remove all previous sketch identities owned by this face, including
    // objects and loops that disappeared, before indexing its new arrangement.
    checkWorkerFace(face);
    const current=index() as Map<string,MObject>, next=new Map<string,MObject>(current);
    for (const [id, object] of next) {
      if ((object instanceof MSketchRegion || object instanceof MSketchObject || object instanceof MSketchLoop) && object.face === face) next.delete(id);
    }
    face.traverseSketchRelatedEntities(obj => addChecked(next, obj));
    // Preserve the existing public map identity after the complete preflight.
    current.clear();next.forEach((object,id)=>current.set(id,object));
  }

  streams.cadRegistry = {
    shells: shells$, modelIndex: modelIndex$
  };

  streams.cadRegistry.update = streams.cadRegistry.modelIndex;

  const index = () => modelIndex$.value;

  function getAllShells(): MShell[] {
    return streams.cadRegistry.shells.value;
  }

  function findShell(shellId) {
    return index().get(shellId);
  }

  function findFace(faceId) {
    return index().get(faceId);
  }

  function findEdge(edgeId) {
    return index().get(edgeId);
  }

  function findSketchObject(sketchObjectGlobalId) {
    return index().get(sketchObjectGlobalId);
  }

  function findDatum(datumId) {
    return index().get(datumId);
  }

  function findDatumAxis(datumAxisId) {
    return index().get(datumAxisId);
  }
  
  function findLoop(loopId) {
    return index().get(loopId);
  }

  function findEntity(entity, id) {
    return index().get(id);
  }

  function find(id) {
    return index().get(id);
  }

  services.cadRegistry = {
    getAllShells, findShell, findFace, findEdge, findSketchObject, findEntity, findDatum, findDatumAxis, findLoop, find,
    reindexFace, createEvaluationRegistry, preparePublication,
    get isEvaluating() { return false; },
    get modelIndex() {
      return index();
    },
    get models() {
      return streams.craft.models.value;
    },
    get shells() {
      return getAllShells();
    }
  };
  ctx.cadRegistry = services.cadRegistry;
}


export interface CadRegistry {

  readonly isEvaluating: boolean;
  createEvaluationRegistry(sketchStorage?: Pick<ApplicationContext["sketchStorageService"], "getSketchData" | "readSketch">): CadRegistry & {setModels(models: MObject[]): void; stageModels(models: () => MObject[]): void; flushModels(): void; assertSketchSourcesResolved(ids: readonly string[]): void};
  preparePublication(models: MObject[]): any[];
  getAllShells(): MShell[];
  findShell(id: string): MShell;
  findFace(id: string): MFace;
  findEdge(id: string): MEdge;
  findSketchObject(id: string): MSketchObject;
  findEntity(id: string): MObject;
  findDatum(id: string): MDatum;
  findDatumAxis(id: string): MDatumAxis;
  findLoop(id: string): MLoop;
  find(id: string): MObject;
  modelIndex: Map<string, MObject>;
  models: MObject[];
  shells: MObject[];
  reindexFace(face: MFace);
}

export interface CadRegistryBundleContext {

  cadRegistry: CadRegistry;
}

export const BundleName = "@CadRegistry";
