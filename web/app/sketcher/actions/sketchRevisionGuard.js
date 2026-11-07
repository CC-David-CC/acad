// Transitional exact stale guard shared by sketch commands. Strict sketch
// serialization is bounded, but still runs on the UI thread; a complete
// mutation epoch or worker snapshot is needed before calling it worker-first.
import {sketchMutationEpoch} from '../sketchMutationEpoch.mjs';
const MAX_SKETCH_BYTES = 1024 * 1024;

function snapshot(viewer) {
  if (!viewer?.io || !viewer.parametricManager || viewer.parametricManager.inTransaction || viewer.historyManager?.recoverySnapshot) {
    throw Error('The sketch is not ready.');
  }
  if (viewer.toolManager && viewer.toolManager.tool !== viewer.toolManager.defaultTool) {
    throw Error('Finish the active sketch tool first.');
  }
  const value = viewer.io.serializeSketch(undefined, {strict:true});
  if (typeof value !== 'string' || value.length > MAX_SKETCH_BYTES || new TextEncoder().encode(value).byteLength > MAX_SKETCH_BYTES) {
    throw Error('Sketch exceeds limits.');
  }
  return value;
}

// One instance per action prevents another inspector from replacing a token.
// WeakMap ownership releases the retained copy when the viewer is destroyed.
export function createSketchRevisionGuard() {
  const entries = new WeakMap();
  return Object.freeze({
    capture(viewer) {
      entries.delete(viewer);
      const epoch = sketchMutationEpoch();
      const source = snapshot(viewer);
      if (sketchMutationEpoch() !== epoch) throw Error('The sketch changed; inspect it again.');
      const revision = crypto.randomUUID();
      entries.set(viewer, {revision, source, epoch});
      return revision;
    },
    verify(viewer, revision) {
      const entry = entries.get(viewer);
      if (!entry || entry.revision !== revision) throw Error('Inspect the sketch before running this command.');
      if (sketchMutationEpoch() !== entry.epoch) throw Error('The sketch changed; inspect it again.');
      if (snapshot(viewer) !== entry.source || entries.get(viewer) !== entry || sketchMutationEpoch() !== entry.epoch) throw Error('The sketch changed; inspect it again.');
    },
    release(viewer, revision) {
      if (entries.get(viewer)?.revision === revision) entries.delete(viewer);
    },
  });
}
