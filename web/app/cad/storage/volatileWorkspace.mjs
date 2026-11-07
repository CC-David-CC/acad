// Data-only, per-window CAD workspace. My files owns durable persistence.
// Prepared maps copy metadata/references, never the immutable string contents.
export const WORKSPACE_PREPARATION_LIMITS = Object.freeze({
  writes: 256, records: 16384, keyCharacters: 1024, valueCharacters: 8 * 1024 * 1024
});

export function createVolatileWorkspace() {
  let records = new Map(), revision = 0, nextVersion = 0;
  let namespaceVersions = new Map();
  let releasePending = null;

  // A workspace normally tracks one authored-sketch prefix. Counters do not
  // inspect/copy file contents or impose a model/file count limit.
  function namespaceRevision(prefix) {
    if (typeof prefix !== 'string' || prefix.length > 1024) throw new Error('Invalid workspace namespace.');
    if (!namespaceVersions.has(prefix)) {
      if (namespaceVersions.size >= 64) throw new Error('Too many tracked workspace namespaces.');
      namespaceVersions.set(prefix, nextVersion);
    }
    return namespaceVersions.get(prefix);
  }
  function changedNamespaces(keys, version) {
    let next = namespaceVersions;
    for (const prefix of namespaceVersions.keys()) {
      if (keys.some(key => key.startsWith(prefix))) {
        if (next === namespaceVersions) next = new Map(namespaceVersions);
        next.set(prefix, version);
      }
    }
    return next;
  }

  const room = count => {
    if (!Number.isSafeInteger(count) || count < 1 ||
        revision >= Number.MAX_SAFE_INTEGER || nextVersion > Number.MAX_SAFE_INTEGER - count) {
      throw new Error('Workspace write versions are exhausted.');
    }
  };
  const keyOf = key => {
    if (typeof key !== 'string') throw new Error('Workspace key must be a string.');
    return key;
  };
  const valueOf = value => {
    if (typeof value !== 'string') throw new Error('Workspace content must be a string.');
    return value;
  };
  function set(key, value) {
    keyOf(key); valueOf(value); room(1);
    const version = nextVersion + 1;
    const namespaces = changedNamespaces([key], version);
    records.set(key, {value, version});
    namespaceVersions = namespaces;
    nextVersion = version; revision++;
    releasePending?.();
    return version;
  }
  function remove(key) {
    keyOf(key); room(1);
    const namespaces = changedNamespaces([key], nextVersion + 1);
    records.delete(key);
    namespaceVersions = namespaces;
    // Removing an absent record still invalidates a prepared snapshot.
    nextVersion++; revision++;
    releasePending?.();
  }
  const get = key => records.get(keyOf(key))?.value ?? null;
  const versionOf = key => records.get(keyOf(key))?.version ?? null;
  const keys = namespace => Array.from(records.keys()).filter(key => key.startsWith(namespace));

  function prepareWrites(changes) {
    if (releasePending) throw new Error('Another workspace preparation is pending.');
    const startRevision = revision, startVersion = nextVersion;
    let candidate = null, phase = 'validating';
    const close = () => {
      phase = 'discarded'; candidate = null;
      if (releasePending === close) releasePending = null;
    };
    // Reserve before reading caller data, including proxy reflection traps.
    // A normal write invalidates this owner; cleanup cannot clear a new owner.
    releasePending = close;
    try {
    if (!Array.isArray(changes)) throw new Error('No workspace writes to prepare.');
    const writeCount = changes.length;
    if (!writeCount) throw new Error('No workspace writes to prepare.');
    if (writeCount > WORKSPACE_PREPARATION_LIMITS.writes || records.size > WORKSPACE_PREPARATION_LIMITS.records) {
      throw new Error('Workspace preparation exceeds structural limits.');
    }
    room(writeCount);
    const seen = new Set(), writes = [];
    let characters = 0;
    for (let index = 0; index < writeCount; index++) {
      const slot = Object.getOwnPropertyDescriptor(changes, String(index));
      if (!slot || !Object.hasOwn(slot, 'value')) throw new Error('Workspace writes must be dense data.');
      const row = slot.value;
      if (!row || typeof row !== 'object' || Array.isArray(row) ||
          ![Object.prototype, null].includes(Object.getPrototypeOf(row))) throw new Error('Invalid workspace write.');
      const fields = Object.getOwnPropertyDescriptors(row);
      if (Reflect.ownKeys(row).sort().join(',') !== 'key,value' ||
          !fields.key?.enumerable || !fields.value?.enumerable ||
          !Object.hasOwn(fields.key, 'value') || !Object.hasOwn(fields.value, 'value')) throw new Error('Workspace writes must contain key and value data.');
      const key = keyOf(fields.key.value), value = fields.value.value;
      if (value !== null) valueOf(value);
      characters += value?.length ?? 0;
      if (key.length > WORKSPACE_PREPARATION_LIMITS.keyCharacters || characters > WORKSPACE_PREPARATION_LIMITS.valueCharacters) {
        throw new Error('Workspace preparation exceeds text limits.');
      }
      if (seen.has(key)) throw new Error('Duplicate prepared workspace key.');
      seen.add(key);
      writes.push({key, value});
    }
    if (releasePending !== close || phase !== 'validating' || revision !== startRevision) throw new Error('Workspace preparation was superseded.');
    candidate = new Map(records);
    writes.forEach(({key, value}, index) => {
      if (value === null) candidate.delete(key);
      else candidate.set(key, {value, version: startVersion + index + 1});
    });
    if (candidate.size > WORKSPACE_PREPARATION_LIMITS.records) throw new Error('Workspace preparation exceeds record limit.');
    const changedKeys = Object.freeze(writes.map(row => row.key));
    const current = () => phase === 'prepared' && releasePending === close && revision === startRevision;
    function requirePrepared() {
      if (phase !== 'prepared') throw new Error('Prepared workspace is closed.');
    }
    const prepared = Object.freeze({
      expectedRevision: startRevision,
      keys: changedKeys,
      isCurrent: current,
      get(key) { requirePrepared(); return candidate.get(keyOf(key))?.value ?? null; },
      getAllKeysFromNamespace(namespace) { requirePrepared(); return Array.from(candidate.keys()).filter(key => key.startsWith(namespace)); },
      commit() {
        if (!current()) throw new Error('Prepared workspace was superseded.');
        const namespaces = changedNamespaces(changedKeys, startVersion + writeCount);
        // All validation and allocation precede this synchronous pointer swap.
        // No observer, user callback or asynchronous gap occurs here.
        records = candidate; candidate = null;
        namespaceVersions = namespaces;
        nextVersion = startVersion + writeCount; revision++;
        phase = 'committed'; releasePending = null;
        return revision;
      },
      discard() {
        if (phase !== 'prepared') return false;
        close();
        return true;
      }
    });
    phase = 'prepared';
    return prepared;
    } catch (error) {
      close();
      throw error;
    }
  }

  return Object.freeze({
    get revision() { return revision; },
    get, set, remove, versionOf, namespaceRevision, getAllKeysFromNamespace: keys,
    exists: key => records.has(keyOf(key)), prepareWrites
  });
}
