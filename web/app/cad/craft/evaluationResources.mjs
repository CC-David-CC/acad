// Internal, non-persistent craft resource ownership. The displayed revision,
// last complete history tip and one private candidate may coexist. This is a
// per-document limit, not an origin-wide RAM budget.
// One synchronous publication guard per bounded authored history entry. Native
// shape/triangle budgets belong to each mount; they are not this metadata cap.
const MAX_PUBLICATION_CHECKS = 256;
const clearMap = Function.call.bind(Map.prototype.clear);
// Inputs are branded native AbortSignals. Use their native operations directly;
// own method overrides cannot strand a half-registered or closed owner.
const aborted = Function.call.bind(Object.getOwnPropertyDescriptor(AbortSignal.prototype, 'aborted').get);
const addAbortListener = Function.call.bind(EventTarget.prototype.addEventListener);
const removeAbortListener = Function.call.bind(EventTarget.prototype.removeEventListener);
export function createEvaluationResourcePool({maxOwners = 3, maxMounts = 1, maxTotalMounts = 3} = {}) {
  if (!Number.isSafeInteger(maxOwners) || maxOwners < 1 || maxOwners > 3 ||
      !Number.isSafeInteger(maxMounts) || maxMounts < 1 || maxMounts > 2 ||
      !Number.isSafeInteger(maxTotalMounts) || maxTotalMounts < 1 || maxTotalMounts > 3) {
    throw new Error('Invalid evaluation resource limits.');
  }
  const owners = new Set(), reservations = new Set();
  let cleanupFailure = null;
  const requireCleanup = () => {
    if (cleanupFailure) throw new Error('Engine cleanup failed; close and reopen this CAD window.');
  };
  const cancelled = () => new DOMException('Engine evaluation was cancelled or superseded.', 'AbortError');
  function begin({signal, valid, purpose = 'model'}) {
    if (purpose !== 'model' && purpose !== 'observation') throw new Error('Invalid evaluation purpose.');
    if (typeof valid !== 'function') throw new Error('Evaluation owner requires a lifetime guard.');
    try { aborted(signal); }
    catch { throw new Error('Evaluation owner requires a document AbortSignal.'); }
    requireCleanup();
    if (owners.size >= maxOwners) throw new Error('Too many retained engine evaluations.');
    const controller = new AbortController(), mounts = new Map(), publicationChecks = new Map(), sourceProofs = new Map();
    let phase = 'candidate', sealed = false, checking = false, detaching = false;
    const current = () => {
      try {
        if (phase !== 'candidate' || aborted(controller.signal) || aborted(signal)) return false;
        return valid() === true && phase === 'candidate' && !aborted(controller.signal) && !aborted(signal);
      }
      catch { return false; }
    };
    const requireCurrent = () => {
      requireCleanup();
      if (!current()) throw cancelled();
      if (checking) throw new Error('Recursive engine publication check.');
      checking = true;
      try {
        for (const check of publicationChecks.values()) {
          const result = check();
          if (result && typeof result.then === 'function') throw new Error('Engine publication checks must be synchronous.');
          requireCleanup();
          if (!current()) throw cancelled();
        }
      } finally { checking = false; }
      requireCleanup();
    };
    requireCurrent();
    // The lifetime guard can synchronously admit a different owner. Recheck the
    // reservation boundary after it, with no further callback before adding.
    if (owners.size >= maxOwners) throw new Error('Too many retained engine evaluations.');
    function releaseMounts() {
      for (const slot of mounts.values()) {
        // Mark before calling cleanup: a reentrant close must not close this
        // mount twice or release its reservation before cleanup returns.
        if (slot.value === null) continue;
        const mount = slot.value; slot.value = null;
        try { mount.close(); } catch (error) { cleanupFailure = cleanupFailure || {cause:error}; }
        finally { reservations.delete(slot); }
      }
      mounts.clear(); publicationChecks.clear();
    }
    function close() {
      if (phase === 'closed') return;
      phase = 'closed'; clearMap(sourceProofs); removeAbortListener(signal, 'abort', close);
      controller.abort(); releaseMounts(); owners.delete(owner);
    }
    function detach() {
      if (detaching) throw new Error('Engine detachment is already in progress.');
      if (phase === 'detached') { requireCleanup(); return; }
      if (phase !== 'accepted') throw new Error('Only an accepted engine owner can detach.');
      // The document stays open. The engine signal revokes native handles
      // and clears candidate ledgers; it is not the document signal.
      detaching = true;
      try {
        phase = 'detached'; clearMap(sourceProofs); releaseMounts(); controller.abort();
        requireCleanup(); if (phase !== 'detached') throw cancelled();
      } finally { detaching = false; }
    }
    const owner = Object.freeze({
      signal: controller.signal,
      requireCurrent,
      // This authority is immutable for the owner's entire lifetime, not a
      // lease that could permit promotion between an awaited read and cleanup.
      requireObservationOnly() {
        if (purpose !== 'observation') throw Object.assign(new Error('A discard-only observation owner is required.'), {code:'OBSERVATION_AUTHORITY_REQUIRED'});
        requireCurrent();
      },
      addPublicationCheck(key, check) {
        requireCurrent();
        if (sealed || typeof key !== 'string' || !key || key.length > 1024 ||
            typeof check !== 'function' || publicationChecks.has(key) || publicationChecks.size >= MAX_PUBLICATION_CHECKS) {
          throw new Error('Invalid, duplicate or excessive engine publication check.');
        }
        publicationChecks.set(key, check);
        try { requireCurrent(); } catch (error) { publicationChecks.delete(key); throw error; }
      },
      // Trusted source-proof metadata only. No caller key/factory or native
      // geometry enters this API; private sweep code namespaces its records.
      getCandidateSourceProofCache() {
        requireCurrent();
        if (sealed || phase !== 'candidate') throw cancelled();
        return sourceProofs;
      },
      getOrCreateMount(key, factory) {
        requireCurrent();
        if (sealed || typeof key !== 'string' || !key || key.length > 256 || typeof factory !== 'function') {
          throw new Error('Invalid or sealed engine evaluation.');
        }
        if (mounts.has(key)) {
          const value = mounts.get(key).value;
          if (value === null) throw new Error('Reentrant engine mount creation.');
          return value;
        }
        if (mounts.size >= maxMounts || reservations.size >= maxTotalMounts) throw new Error('Evaluation engine mount budget exhausted.');
        // The trusted factory returns its mount before awaiting readiness.
        const slot = {value:null};
        mounts.set(key, slot); reservations.add(slot);
        let value;
        try {
          value = factory();
          if (!value || typeof value.close !== 'function' || typeof value.then === 'function') {
            throw new Error('Engine factory must return a closable synchronous mount.');
          }
          requireCurrent(); slot.value = value; return value;
        } catch (error) {
          mounts.delete(key);
          try {
            if (value && typeof value.close === 'function') value.close();
          } catch (failure) { cleanupFailure = cleanupFailure || {cause:failure}; }
          finally { reservations.delete(slot); }
          throw error;
        }
      },
      seal() { requireCurrent(); sealed = true; clearMap(sourceProofs); },
      // Preflight calls requireCurrent. This no-await publication step invokes
      // no external guard, cleanup or observer.
      accept() {
        requireCleanup();
        if (purpose === 'observation') throw Object.assign(new Error('Observation evaluations cannot publish.'), {code:'OBSERVATION_PUBLICATION_FORBIDDEN'});
        if (phase !== 'candidate' || !sealed || aborted(controller.signal) || aborted(signal)) throw cancelled();
        clearMap(sourceProofs); phase = 'accepted';
      },
      close,
      detach,
      get state() { return phase; }
    });
    owners.add(owner); addAbortListener(signal, 'abort', close, {once: true});
    if (aborted(signal)) { close(); throw cancelled(); }
    return owner;
  }
  return Object.freeze({
    begin,
    cancelCandidates() { for (const owner of [...owners]) if (owner.state === 'candidate') owner.close(); },
    get usage() {
      return Object.freeze({owners: owners.size,
        mounts: reservations.size,
        candidates: [...owners].filter(owner => owner.state === 'candidate').length,
        accepted: [...owners].filter(owner => owner.state === 'accepted').length,
        detached: [...owners].filter(owner => owner.state === 'detached').length,
        cleanupFailed: cleanupFailure !== null});
    }
  });
}
