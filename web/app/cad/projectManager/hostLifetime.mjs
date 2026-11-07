/** Host ownership is separate from document generations and carries no file authority. */
export function createHostLifetime(onAbort) {
  if (typeof onAbort !== 'function') throw new TypeError('A disposal callback is required.');
  let binding = null, closed = false, checking = false;
  function dispose() {
    if (closed) return;
    closed = true;
    binding?.signal.removeEventListener('abort', aborted);
    binding = null;
  }
  function aborted() {
    if (closed) return;
    dispose();
    onAbort();
  }
  function current() {
    if (closed || checking) return false;
    if (!binding) return true; // Standalone legacy workspaces have no WebOS host.
    const captured = binding;
    if (captured.signal.aborted) return false;
    checking = true;
    try {
      return captured.valid() === true && !closed && binding === captured && !captured.signal.aborted;
    } catch {
      return false;
    } finally {
      checking = false;
    }
  }
  function bind(input) {
    if (closed || binding) throw new Error('Host lifetime is already bound or closed.');
    if (!input || typeof input !== 'object') throw new TypeError('Host lifetime is required.');
    const descriptors = Object.getOwnPropertyDescriptors(input), keys = Reflect.ownKeys(descriptors);
    if (keys.length !== 2 || !keys.includes('signal') || !keys.includes('valid') ||
        keys.some(key => !Object.hasOwn(descriptors[key], 'value') || !descriptors[key].enumerable)) {
      throw new TypeError('Host lifetime requires signal and valid data fields.');
    }
    const signal = descriptors.signal.value, valid = descriptors.valid.value;
    if (typeof valid !== 'function') throw new TypeError('Host validity callback is required.');
    Object.getOwnPropertyDescriptor(AbortSignal.prototype, 'aborted').get.call(signal);
    binding = {signal, valid};
    signal.addEventListener('abort', aborted, {once: true});
    if (!current()) {
      aborted();
      throw new DOMException('Host window or account is no longer current.', 'AbortError');
    }
  }
  return Object.freeze({bind, current, dispose, get bound() { return binding !== null; }});
}
