// Saving uses the desktop's account/version-aware file operation. Neither
// account credentials nor the file service are exposed to the CAD frame.
export function registerDocumentSaveCommand(host, {inspect, save}) {
  return host.commands.register({
    id: 'save',
    description: 'Save the inspected CAD revision to My files. Supply a new path only for an untitled project. Server synchronization is reported separately.',
    parameters: {type: 'object', additionalProperties: false, required: ['revision'], properties: {
      revision: {type: 'string', minLength: 1, maxLength: 256},
      path: {type: 'string', minLength: 1, maxLength: 1024}
    }}
  }, async args => {
    if (!args || typeof args !== 'object' || Array.isArray(args)) throw Error('Invalid save arguments.');
    const keys = Reflect.ownKeys(args), captured = {};
    if (!keys.includes('revision') || keys.some(key => !['revision', 'path'].includes(key))) throw Error('Invalid save arguments.');
    for (const key of keys) {
      const descriptor = Object.getOwnPropertyDescriptor(args, key);
      if (!descriptor?.enumerable || !Object.hasOwn(descriptor, 'value')) throw Error('Save arguments must be data properties.');
      captured[key] = descriptor.value;
    }
    if (typeof captured.revision !== 'string' || !captured.revision || captured.revision.length > 256 ||
        (Object.hasOwn(captured, 'path') && (typeof captured.path !== 'string' || !captured.path.trim() || captured.path.length > 1024))) throw Error('Provide a valid inspected revision and optional new filename.');
    const session = host.session(), current = () => !!session && !host.signal.aborted && host.session() === session;
    if (!current()) throw Error('The window or account changed.');
    const target = inspect();
    if (!current() || target.revision !== captured.revision) throw Error('The model changed; inspect it before saving.');
    if (target.path && Object.hasOwn(captured, 'path')) throw Error('Save uses the open project path. Use the UI to save a separate copy.');
    if (!target.path && !Object.hasOwn(captured, 'path')) throw Error('An untitled project needs a My files path.');
    const result = await save(Object.freeze(captured));
    // A missing receipt is not success. A write may already have committed
    // before a lifetime change, so the caller must reconcile rather than retry.
    if (!current() || !result) throw Error('The save outcome is unavailable; inspect My files before retrying.');
    return result;
  });
}
