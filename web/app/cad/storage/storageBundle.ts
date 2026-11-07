import {stream} from 'lstream';
import {ApplicationContext} from "cad/context";
import {createVolatileWorkspace} from './volatileWorkspace.mjs';

const updateSources = new WeakMap();

function updateSource(ctx) {
  let source = updateSources.get(ctx);
  if (!source) {
    source = stream();
    updateSources.set(ctx, source);
    ctx.streams.storage = {update: source};
  }
  return source;
}

export function defineStreams(ctx) {
  updateSource(ctx);
}

export function activate(ctx: ApplicationContext) {

  const {services, streams} = ctx;
  const updates$ = updateSource(ctx);
  ctx.storageService?.dispose?.();
  let service: StorageService, active = true, timer = null;
  let pendingPreparation: PreparedWorkspaceWrites = null;
  const pendingUpdates = new Map<string, {timestamp: number; current: () => boolean}>();
  // An embedded desktop window must not share CAD projects with another
  // window or account at the same origin. This is a volatile workspace only;
  // the host still needs an explicit, authorized My files bridge.
  const volatile = new URLSearchParams(window.location.search).get('webos') === '1';
  const workspace = createVolatileWorkspace();
  const writeVersions = new Map<string, number>();
  let nextWriteVersion = 0;

  function set(key, value) {
    write(key, value);
  }

  function write(key: string, value: string): number {
    if (volatile) {
      const version = workspace.set(key, value);
      pendingPreparation?.discard();
      notify(key);
      return version;
    }
    if (nextWriteVersion >= Number.MAX_SAFE_INTEGER) throw new Error('Workspace write versions are exhausted.');
    const version = ++nextWriteVersion;
    console.log("Saving: " + key);
    localStorage.setItem(key, value);
    writeVersions.set(key, version);
    notify(key);
    return version;
  }

  // A temporary restore owns only the exact writes it staged. Equality of
  // bytes is insufficient: a later writer may intentionally write those same
  // bytes. Its new write version must survive rollback of the earlier job.
  function stageWrite(key: string, value: string): () => boolean {
    if (!volatile) throw new Error('Staged restores require a volatile workspace.');
    const lifetime = captureLifetime();
    if (!lifetime()) throw new Error('Workspace was replaced or closed.');
    const previous = get(key), version = write(key, value);
    let pending = true;
    return () => {
      if (!pending) return false;
      pending = false;
      if (!lifetime() || workspace.versionOf(key) !== version) return false;
      if (previous === null) remove(key); else write(key, previous);
      return true;
    };
  }

  function get(key) {
    return volatile ? workspace.get(key) : localStorage.getItem(key);
  }

  function remove(key) {
    try {
      if (volatile) workspace.remove(key); else localStorage.removeItem(key);
      pendingPreparation?.discard();
      writeVersions.delete(key);
    } finally {
      notify(key);
    }
  }

  function exists(key) {
    return volatile ? workspace.exists(key) : key in localStorage;
  }
  
  function captureLifetime() {
    const project = ctx.projectService, generation = project?.documentGeneration;
    return () => active && ctx.storageService === service && ctx.projectService === project &&
      (!project || project.isDocumentCurrent(generation));
  }

  // These are invalidations of current bytes, not an event log. Coalesce each
  // key independently; a last-value throttle loses all but one changed sketch.
  // Check lifetime again at delivery and between observers, including resets
  // triggered by an earlier observer. Bound each delivery turn to 64 keys.
  function flushUpdates() {
    timer = null;
    for (let count = 0; active && pendingUpdates.size && count < 64; count++) {
      const key = pendingUpdates.keys().next().value;
      const event = pendingUpdates.get(key);
      pendingUpdates.delete(key);
      updates$.nextGuarded({key, timestamp: event.timestamp}, event.current);
    }
    if (active && pendingUpdates.size && timer === null) timer = setTimeout(flushUpdates, 0);
  }

  function notify(key, valid = () => true) {
    const lifetime = captureLifetime(), current = () => {
      try { return lifetime() && valid() && lifetime(); }
      catch (error) { console.error('Workspace invalidation guard failed:', error); return false; }
    };
    if (!current()) return;
    pendingUpdates.set(key, {timestamp: Date.now(), current});
    if (timer === null) timer = setTimeout(flushUpdates, 100);
  }

  function getAllKeysFromNamespace(namespace) {
    if (volatile) return workspace.getAllKeysFromNamespace(namespace);
    const keys = [];
    for(let i = localStorage.length - 1; i >= 0 ; i--) {
      const key = localStorage.key(i);
      if (key.startsWith(namespace)) {
        keys.push(key);
      }
    }
    return keys;
  }

  const externalStorageUpdate = evt => { if (evt.key !== null) notify(evt.key); };
  if (!volatile) window.addEventListener('storage', externalStorageUpdate, false);

  function dispose() {
    active = false;
    pendingPreparation?.discard();
    if (timer !== null) clearTimeout(timer);
    timer = null; pendingUpdates.clear();
    if (!volatile) window.removeEventListener('storage', externalStorageUpdate, false);
  }
  
  const addListener = listener => streams.storage.update.attach(listener);

  function prepareWrites(changes: WorkspaceWrite[]): PreparedWorkspaceWrites {
    if (!volatile) throw new Error('Private preparation requires a volatile workspace.');
    const lifetime = captureLifetime();
    if (!lifetime()) throw new Error('Workspace was replaced or closed.');
    if (pendingPreparation && !pendingPreparation.isCurrent()) pendingPreparation.discard();
    const prepared = workspace.prepareWrites(changes);
    if (!lifetime()) { prepared.discard(); throw new Error('Workspace was replaced or closed.'); }
    const signal = ctx.projectService?.documentSignal;
    let committed = false, notified = false;
    const cleanup = () => {
      signal?.removeEventListener('abort', abort);
      if (pendingPreparation === result) pendingPreparation = null;
    };
    const discard = () => { const discarded = prepared.discard(); cleanup(); return discarded; };
    const abort = () => discard();
    function current() {
      if (!lifetime()) { discard(); return false; }
      return prepared.isCurrent();
    }
    function requireCurrent() {
      if (!current()) throw new Error('Workspace preparation was superseded.');
    }
    const result = Object.freeze({
      expectedRevision: prepared.expectedRevision,
      isCurrent: current,
      get(key) { requireCurrent(); return prepared.get(key); },
      getAllKeysFromNamespace(namespace) { requireCurrent(); return prepared.getAllKeysFromNamespace(namespace); },
      discard,
      commit() { requireCurrent(); prepared.commit(); committed = true; cleanup(); },
      notify(valid = () => true) {
        if (!committed || notified) throw new Error('Workspace publication is not pending notification.');
        notified = true;
        for (const key of prepared.keys) {
          notify(key, () => lifetime() && valid());
        }
      }
    });
    pendingPreparation = result;
    signal?.addEventListener('abort', abort, {once: true});
    return result;
  }

  service = {
    set, get, remove, addListener, getAllKeysFromNamespace, exists, stageWrite, prepareWrites, dispose,
    versionOf(key: string) { return volatile ? workspace.versionOf(key) : null; },
    namespaceRevision(prefix: string) { return volatile ? workspace.namespaceRevision(prefix) : null; },
    get revision() { return volatile ? workspace.revision : null; }
  };

  ctx.storageService = service;
  services.storage = ctx.storageService;

}


export interface StorageService {

  readonly revision: number;
  versionOf(key: string): number | null;
  namespaceRevision(prefix: string): number | null;
  dispose(): void;

  prepareWrites(changes: WorkspaceWrite[]): PreparedWorkspaceWrites;

  set(path: string, content: string): void;

  stageWrite(path: string, content: string): () => boolean;

  get(path: string): string;

  remove(path: string): void;

  getAllKeysFromNamespace(path: string): string[];

  exists(path: string): boolean;

  addListener(callback: (StorageUpdateEvent) => void);

}

export interface WorkspaceWrite { key: string; value: string | null; }

export interface PreparedWorkspaceWrites {
  readonly expectedRevision: number;
  isCurrent(): boolean;
  get(key: string): string;
  getAllKeysFromNamespace(namespace: string): string[];
  commit(): void;
  notify(valid?: () => boolean): void;
  discard(): boolean;
}

export interface StorageBundleContext {

  storageService: StorageService;
}

export const BundleName = "@Storage";
