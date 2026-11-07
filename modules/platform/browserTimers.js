// Minimal callback-only Node timers surface used by browser-xml2js.
// Each callback gets a browser task, allowing rendering and cancellation.
exports.setImmediate = function setImmediate(callback, ...args) {
  if (typeof callback !== 'function') throw new TypeError('Callback must be a function.');
  return globalThis.setTimeout(() => callback(...args), 0);
};

exports.clearImmediate = function clearImmediate(handle) {
  globalThis.clearTimeout(handle);
};
