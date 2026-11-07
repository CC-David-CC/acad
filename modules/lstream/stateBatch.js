import {StateStream, notifyStateRevision} from './state';

// Prepare all allocations/validation before installing any state. Commit is
// synchronous and invokes no observers. This batches already-evaluated state;
// it does not run or bypass validation of an authored modeling operation.
export function prepareStateBatch(changes) {
  if (!Array.isArray(changes) || !changes.length) throw new Error('Empty state publication');
  const seen = new Set();
  const entries = Array.from(changes, (change, index) => {
    if (!Object.prototype.hasOwnProperty.call(changes,index)) throw new Error('Sparse state publication');
    if (!change || !(change.stream instanceof StateStream) || seen.has(change.stream)) throw new Error('Invalid state publication');
    seen.add(change.stream);
    return {stream:change.stream, value:change.value, notify:change.notify !== false, revision:change.stream.revision};
  });
  let phase = 'prepared';
  const current = () => entries.every(({stream, revision}) => Number.isSafeInteger(revision) && revision >= 0 && stream.revision === revision && (stream.state === 0 || stream.state === 1) && revision < Number.MAX_SAFE_INTEGER);
  return {
    isCurrent: () => phase === 'prepared' && current(),
    commit() {
      if (phase !== 'prepared' || !current()) throw new Error('State publication was superseded');
      // Every assign was checked above; no user callback or asynchronous gap
      // lies between these installations.
      for (const {stream,value} of entries) StateStream.prototype.assignValue.call(stream,value);
      phase = 'committed';
    },
    notify(valid = () => true) {
      if (phase !== 'committed') throw new Error('State publication is not committed');
      phase = 'notified';
      for (const entry of entries) {
        if (!valid()) break;
        if (!entry.notify) continue;
        notifyStateRevision(entry.stream, entry.value, entry.revision + 1, valid);
      }
    }
  };
}
