// A private, cooperative capture for full replay. It is intentionally separate
// from the much smaller edit-command capture. Strings are retained by value;
// no serialized copy or canonical hash of the history is constructed.
import {claimAuthoredFeatureIdentity} from './authoredFeatureIdentity.mjs';
const MAX_HISTORY = 10000;
const MAX_NODES = 1000000;
const MAX_DEPTH = 128;
// A 128 MiB UTF-8 JSON file can decode to at most 256 MiB of UTF-16 text.
const MAX_TEXT_BYTES = 256 * 1024 * 1024;
const BATCH = 128;

function failure() { return new Error('Pipeline history is not bounded plain JSON data.'); }

async function traverse(history, snapshot, check, compare) {
  if (!Array.isArray(history) || history.length > MAX_HISTORY || (compare && !Array.isArray(snapshot))) throw failure();
  const ancestors = new Set();
  const featureIds = new Set();
  let count = 0, textBytes = 0, steps = 0;
  const tick = async () => {
    if (++steps % BATCH === 0) {
      check();
      await new Promise(resolve => setTimeout(resolve, 0));
      check();
    }
  };
  const charge = value => {
    textBytes += value.length * 2;
    if (textBytes > MAX_TEXT_BYTES) throw failure();
  };
  const visit = async (value, expected, depth) => {
    await tick();
    if (++count > MAX_NODES || depth > MAX_DEPTH) throw failure();
    if (typeof value === 'string') charge(value);
    if (value === null || typeof value === 'string' || typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value))) {
      if (compare && !Object.is(value, expected)) throw failure();
      return value;
    }
    if (!value || typeof value !== 'object' || ancestors.has(value)) throw failure();
    const array = Array.isArray(value), proto = Object.getPrototypeOf(value);
    if ((!array && proto !== Object.prototype && proto !== null) || (array && proto !== Array.prototype)) throw failure();
    if (compare && (!expected || typeof expected !== 'object' || Array.isArray(expected) !== array)) throw failure();
    ancestors.add(value);
    try {
      // Own-key enumeration is one synchronous engine operation; the ensuing
      // validation and traversal yield regularly. Never invoke accessors.
      const keys = Reflect.ownKeys(value);
      if (keys.length > MAX_NODES + (array ? 1 : 0)) throw failure();
      if (array && (keys.length !== value.length + 1 || keys[keys.length - 1] !== 'length')) throw failure();
      if (compare && Reflect.ownKeys(expected).length !== keys.length) throw failure();
      const result = array ? [] : {};
      for (let i = 0; i < keys.length; i++) {
        await tick();
        const key = keys[i];
        if (typeof key !== 'string') throw failure();
        if (array && key === 'length') continue;
        if (array && key !== String(i)) throw failure();
        if (!array) charge(key);
        const descriptor = Object.getOwnPropertyDescriptor(value, key);
        if (!descriptor || !('value' in descriptor) || !descriptor.enumerable) throw failure();
        let next;
        if (compare) {
          const other = Object.getOwnPropertyDescriptor(expected, key);
          if (!other || !('value' in other) || !other.enumerable) throw failure();
          next = other.value;
        }
        const child = await visit(descriptor.value, next, depth + 1);
        // Every root entry is one authored producer, including consumed/future
        // history. Use the detached record (or verified immutable snapshot),
        // never materialized expressions or operation-local model membership.
        if(depth===0)claimAuthoredFeatureIdentity(compare?next:child,featureIds);
        if (!compare) Object.defineProperty(result, key, {value:child, enumerable:true, writable:true, configurable:true});
      }
      if (compare && array && value.length !== expected.length) throw failure();
      return compare ? result : Object.freeze(result);
    } finally { ancestors.delete(value); }
  };
  check();
  const result = await visit(history, snapshot, 0);
  check();
  return result;
}

export function capturePipelineHistory(history, check = () => {}) {
  return traverse(history, null, check, false);
}

export async function assertPipelineHistoryCurrent(history, snapshot, check = () => {}) {
  await traverse(history, snapshot, check, true);
}
