// Incremental, detached, bounded JSON capture for the narrow edit command.
// It deliberately excludes non-JSON state and never walks models or meshes.
export async function captureAuthoredHistory(history, check = () => {}) {
  if (!Array.isArray(history) || history.length > 256) throw Error('Authored history exceeds the edit limit.');
  const seen = new Set();
  let nodes = 0, budget = 0;
  function charge(amount) {
    budget += amount;
    if (budget > 256 * 1024) throw Error('Authored history exceeds the edit limit.');
  }
  async function visit(value, level) {
    if (++nodes % 128 === 0) { await new Promise(resolve => setTimeout(resolve, 0)); check(); }
    if (level > 32) throw Error('Authored history is too deep.');
    // Include JSON syntax, numeric text and worst-case escaped characters in
    // the budget before producing the final detached serialization.
    charge(32);
    if (value === null || typeof value === 'boolean') return value;
    if (typeof value === 'string') { charge(value.length * 6); return value; }
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (!value || typeof value !== 'object' || seen.has(value)) throw Error('Authored history is not plain JSON data.');
    const array = Array.isArray(value), proto = Object.getPrototypeOf(value);
    if ((!array && proto !== Object.prototype && proto !== null) || Object.getOwnPropertySymbols(value).length) throw Error('Authored history is not plain JSON data.');
    seen.add(value);
    let result;
    if (array) {
      charge(value.length);
      result = [];
      for (let i = 0; i < value.length; i++) {
        const prop = Object.getOwnPropertyDescriptor(value, String(i));
        if (!prop || !('value' in prop)) throw Error('Sparse authored history is unsupported.');
        result.push(await visit(prop.value, level + 1));
      }
      if (Object.keys(value).length !== value.length || Reflect.ownKeys(value).length !== value.length + 1) throw Error('Authored arrays have unsupported properties.');
    } else {
      result = {};
      const keys = Object.keys(value).sort();
      if (Reflect.ownKeys(value).length !== keys.length) throw Error('Authored history has unsupported properties.');
      charge(keys.length);
      for (const key of keys) {
        charge(key.length * 6);
        const prop = Object.getOwnPropertyDescriptor(value, key);
        if (!prop || !('value' in prop) || key === '__proto__') throw Error('Authored history has unsupported properties.');
        result[key] = await visit(prop.value, level + 1);
      }
    }
    seen.delete(value);
    return result;
  }
  check();
  const detached = await visit(history, 0);
  check();
  // The input is now strictly capped at 256 KiB before this serialization.
  return {history: detached, signature: JSON.stringify(detached)};
}
