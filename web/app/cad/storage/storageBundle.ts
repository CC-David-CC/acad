import {stream} from 'lstream';
import {ApplicationContext} from "cad/context";
import {createVolatileWorkspace} from './volatileWorkspace.mjs';

const updateSources = new WeakMap();
const STORAGE_LISTEN=EventTarget.prototype.addEventListener,STORAGE_UNLISTEN=EventTarget.prototype.removeEventListener;
const preparedMergers = new WeakMap<object,(changes:WorkspaceWrite[])=>PreparedWorkspaceWrites>();
// Internal Craft use only: possession of the ACTUAL pending storage owner is
// required. Never published on StorageService or accepted as a host flag.
export function mergePreparedWorkspaceWrites(owner:PreparedWorkspaceWrites,changes:WorkspaceWrite[]){
  const merge=preparedMergers.get(owner);if(!merge)throw Error('Prepared storage owner is unavailable.');return merge(changes);
}

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
  let failedPreparationCleanup:any=null,failedPreparationOwner:object=null;
  const requirePreparationCustody=()=>{if(failedPreparationCleanup)throw failedPreparationCleanup;};
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
    requirePreparationCustody();
    if (volatile) {
      pendingPreparation?.discard();
      const version = workspace.set(key, value);
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
    requirePreparationCustody();
    pendingPreparation?.discard();
    try {
      if (volatile) workspace.remove(key); else localStorage.removeItem(key);
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
    active=false;let failure=failedPreparationCleanup;
    if(pendingPreparation!==failedPreparationOwner)try{pendingPreparation?.discard();}catch(error){failure=failure||error;}
    try{if(timer!==null)clearTimeout(timer);}catch(error){failure=failure||error;}
    timer=null;pendingUpdates.clear();
    try{if(!volatile)window.removeEventListener('storage',externalStorageUpdate,false);}catch(error){failure=failure||error;}
    if(failure)throw failure;
  }
  
  const addListener = listener => streams.storage.update.attach(listener);

  function prepareWrites(changes: WorkspaceWrite[]): PreparedWorkspaceWrites {
    requirePreparationCustody();
    if (!volatile) throw new Error('Private preparation requires a volatile workspace.');
    const lifetime = captureLifetime();
    if (!lifetime()) throw new Error('Workspace was replaced or closed.');
    if (pendingPreparation && !pendingPreparation.isCurrent()) pendingPreparation.discard();
    const prepared = workspace.prepareWrites(changes);
    let signal:AbortSignal;
    try { if (!lifetime()) throw new Error('Workspace was replaced or closed.'); signal=ctx.projectService?.documentSignal; }
    catch(operationError) { try { prepared.discard(); } catch(cause) { failedPreparationOwner=prepared;failedPreparationCleanup=Object.assign(Error('Prepared workspace retirement is unconfirmed; reload this CAD window.'),{code:'WORKSPACE_CLEANUP_FAILED',committed:false,cause,operationError});throw failedPreparationCleanup; } throw operationError; }
    let committed = false, notified = false,cleanupDone=false,cleanupFailure:any=null;
    const cleanup = () => {
      if(cleanupDone){if(cleanupFailure)throw cleanupFailure;return;}
      cleanupDone=true;const errors=[];
      try{if(signal)STORAGE_UNLISTEN.call(signal,'abort',abort);}catch(error){errors.push(error);}
      try{if(pendingPreparation===result)pendingPreparation=null;}catch(error){errors.push(error);}
      try{preparedMergers.delete(result);}catch(error){errors.push(error);}
      if(errors.length){cleanupFailure=Object.assign(Error('Prepared workspace cleanup is unconfirmed.'),{code:'WORKSPACE_CLEANUP_FAILED',committed,cause:errors[0],cleanupErrors:Object.freeze(errors)});throw cleanupFailure;}
    };
    const discard = () => {
      let discarded=false,underlyingError:any=null,cleanupError:any=null;
      try{discarded=prepared.discard();}catch(error){underlyingError=error;}
      try{cleanup();}catch(error){cleanupError=error;}
      if(underlyingError){
        if(!failedPreparationCleanup)failedPreparationCleanup=Object.assign(Error('Prepared workspace retirement is unconfirmed; reload this CAD window.'),{code:'WORKSPACE_CLEANUP_FAILED',committed,cause:underlyingError,cleanupError});
        failedPreparationOwner=result;throw failedPreparationCleanup;
      }
      if(cleanupError)throw cleanupError;return discarded;
    };
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
      commit() {
        try{requirePreparationCustody();requireCurrent();cleanup();requireCurrent();prepared.commit();committed=true;}
        catch(operationError){
          // The actual underlying implementation performs every throwable
          // validation/allocation BEFORE its pointer swap. Every failed path
          // must close its own proposal even after outer cleanup ran.
          try{discard();}catch(cause){throw Object.assign(Error('Workspace commit/cleanup failed before publication.'),{code:'WORKSPACE_CLEANUP_FAILED',committed,cause,operationError});}
          throw operationError;
        }
      },
      notify(valid = () => true) {
        if (!committed || notified) throw new Error('Workspace publication is not pending notification.');
        notified = true;
        for (const key of prepared.keys) {
          notify(key, () => lifetime() && valid());
        }
      }
    });
    preparedMergers.set(result,(extra)=>{
      requireCurrent();if(pendingPreparation!==result||workspace.revision!==prepared.expectedRevision)throw Error('Prepared storage owner changed.');
      if(!Array.isArray(extra)||!extra.length||extra.length>256||Reflect.ownKeys(extra).length!==extra.length+1)throw Error('Invalid derived source writes.');
      const rows=prepared.keys.map(key=>({key,value:prepared.get(key)})),seen=new Set(rows.map(row=>row.key));
      for(let i=0;i<extra.length;i++){
        const slot=Object.getOwnPropertyDescriptor(extra,String(i)),row=slot?.value;
        if(!slot?.enumerable||!Object.hasOwn(slot,'value')||!row||typeof row!=='object'||Array.isArray(row)||Reflect.ownKeys(row).sort().join(',')!=='key,value')throw Error('Derived source writes must be dense own data.');
        const k=Object.getOwnPropertyDescriptor(row,'key'),v=Object.getOwnPropertyDescriptor(row,'value');
        if(!k?.enumerable||!v?.enumerable||!Object.hasOwn(k,'value')||!Object.hasOwn(v,'value')||typeof k.value!=='string'||v.value!==null&&typeof v.value!=='string'||seen.has(k.value))throw Error('Derived source keys duplicate or conflict with the prepared owner.');
        seen.add(k.value);rows.push({key:k.value,value:v.value});
      }
      requireCurrent();const expected=prepared.expectedRevision;discard();
      // No accepted write occurred. A re-preparation refusal leaves the exact
      // original accepted records/revision intact; the old proposal is closed.
      if(!lifetime()||workspace.revision!==expected)throw Error('Workspace changed during derived source preparation.');
      return prepareWrites(rows);
    });
    pendingPreparation = result;
    try{if(signal)STORAGE_LISTEN.call(signal,'abort',abort,{once:true});}catch(error){try{discard();}catch(cleanupError){Object.defineProperty(cleanupError,'operationError',{value:error});throw cleanupError;}throw error;}
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
