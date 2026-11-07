import {sameRestoredSketch} from './historyEquivalence.mjs';

// Cap ordinary retained history without rejecting otherwise valid large sketches.
// One oversized newest transition is retained for undo; its own size is the
// explicit exception to the 8 MiB aggregate budget. Byte charges conservatively
// count two bytes per UTF-16 code unit.
const HISTORY_BYTES = 8 * 1024 * 1024;
const HISTORY_ENTRIES = 100;
const DIFF_MAX_CODE_UNITS = 2048;

/** @constructor */
function HistoryManager(viewer) {
  this.viewer = viewer;
  this.dmp = new window.diff_match_patch();
  // Limit the library's own search on the separately size-bounded patch path.
  this.dmp.Diff_Timeout = 0.025;
  this.lastCheckpoint = '';
  this.diffs = [];
  this.historyPointer = -1;
  this._counter = 0;
  this.recoverySnapshot = null;
}

HistoryManager.prototype.init = function(sketchData) {
  this.lastCheckpoint = typeof sketchData === 'string' ? sketchData : '';
  this.diffs = [];
  this.historyPointer = -1;
  this.recoverySnapshot = null;
};

HistoryManager.prototype.undo = function () {
  if (this.recoverySnapshot) throw new Error('Sketch recovery is required before undo.');
  const currentState = this.viewer.io.serializeSketch(undefined, {strict: true});
  if (currentState != this.lastCheckpoint) {
    // Unsaved change — checkpoint it first so we can redo to it
    this._checkpoint();
  }
  if (this.historyPointer >= 0) {
    const diff = this.diffs[this.historyPointer];
    const prevState = diff.kind === 'snapshot' ? this.snapshotTarget(diff, 'undo') : this.applyDiff(this.lastCheckpoint, diff.reverse);
    if (prevState && prevState.length > 2) {
      this.restoreChecked(prevState);
      this.lastCheckpoint = prevState;
      this.historyPointer--;
      this.viewer.fullHeavyUIRefresh();
    }
  }
};

HistoryManager.prototype.lightCheckpoint = function (weight) {
  this._counter += weight;
  if (this._counter >= 100) {
    this.checkpoint();
  }
};

HistoryManager.prototype.checkpoint = function () {
  try {
    this._checkpoint();
  } catch(e) {
    console.log(e);
  }
};

HistoryManager.prototype._checkpoint = function () {
  if (this.recoverySnapshot) throw new Error('Sketch recovery is required before updating history.');
  const currentState = this.viewer.io.serializeSketch(undefined, {strict: true});
  if (currentState == this.lastCheckpoint) { this._counter = 0; return; }
  const before = this.lastCheckpoint;
  let entry;
  if (Math.max(before.length, currentState.length) > DIFF_MAX_CODE_UNITS) {
    entry = {kind:'snapshot', before, after:currentState, bytes:2 * (before.length + currentState.length)};
  } else {
    // Build both directions before touching published history.
    const forward = this.getDiff(before, currentState), reverse = this.getDiff(currentState, before);
    entry = {forward, reverse, bytes:2 * JSON.stringify({forward, reverse}).length};
  }
  const next = this.diffs.slice(0, this.historyPointer + 1);
  next.push(entry);
  let bytes = next.reduce((sum, item) => sum + (item.bytes || 0), 0);
  while (next.length > 1 && (next.length > HISTORY_ENTRIES || bytes > HISTORY_BYTES)) {
    const removed = next.shift(); bytes -= removed.bytes || 0;
  }
  this.diffs.splice(0, this.diffs.length, ...next);
  this.historyPointer = next.length - 1;
  this.lastCheckpoint = currentState;
  this._counter = 0;
};

HistoryManager.prototype.redo = function () {
  if (this.recoverySnapshot) throw new Error('Sketch recovery is required before redo.');
  // An edit made after undo must not be silently replaced by the old future.
  if (this.viewer.io.serializeSketch(undefined, {strict: true}) !== this.lastCheckpoint) return;
  if (this.historyPointer < this.diffs.length - 1) {
    const nextPointer = this.historyPointer + 1;
    const entry = this.diffs[nextPointer];
    const nextState = entry.kind === 'snapshot' ? this.snapshotTarget(entry, 'redo') : this.applyDiff(this.lastCheckpoint, entry.forward);
    this.restoreChecked(nextState);
    this.lastCheckpoint = nextState;
    this.historyPointer = nextPointer;
    this.viewer.fullHeavyUIRefresh();
  }
};

HistoryManager.prototype.restoreChecked = function (target) {
  const before = this.viewer.io.serializeSketch(undefined, {strict: true});
  const load = text => {
    this.viewer.io.loadSketch(text, {strict: true});
    if (!sameRestoredSketch(text, this.viewer.io.serializeSketch(undefined, {strict: true}))) {
      throw new Error('The reconstructed sketch does not match its saved state.');
    }
  };
  try { load(target); }
  catch (error) {
    try { load(before); }
    catch (rollbackError) {
      this.recoverySnapshot = before;
      throw new Error('Sketch reconstruction and rollback failed. The previous sketch is held in memory; do not save this partial sketch.');
    }
    throw new Error('Sketch reconstruction failed; the previous sketch was restored.');
  }
};

HistoryManager.prototype.recover = function () {
  if (!this.recoverySnapshot) return false;
  const saved = this.recoverySnapshot;
  this.viewer.io.loadSketch(saved, {strict: true});
  if (!sameRestoredSketch(saved, this.viewer.io.serializeSketch(undefined, {strict: true}))) {
    throw new Error('Recovery did not restore the complete sketch. The earlier snapshot remains in memory.');
  }
  this.recoverySnapshot = null;
  this.viewer.fullHeavyUIRefresh();
  return true;
};

HistoryManager.prototype.snapshotTarget = function (entry, direction) {
  const expected = direction === 'undo' ? entry.after : entry.before;
  if (this.lastCheckpoint !== expected) throw new Error('Sketch history snapshot no longer matches.');
  return direction === 'undo' ? entry.before : entry.after;
};

HistoryManager.prototype.applyDiff = function (text, diff) {
  const results = this.dmp.patch_apply(diff, text);
  if (!results[1].every(Boolean)) throw new Error('Sketch history patch could not be applied.');
  return results[0];
};

HistoryManager.prototype.getDiff = function (text1, text2) {
  const dmp = this.dmp;
  const diff = dmp.diff_main(text1, text2, true);
  if (diff.length > 2) {
    dmp.diff_cleanupSemantic(diff);
  }
  return dmp.patch_make(text1, text2, diff);
};

export {HistoryManager}
