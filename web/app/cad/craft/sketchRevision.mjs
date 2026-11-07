// Capture only sketch-key membership and version counters, never file bytes.
// Project snapshot/autosave keys are outside this namespace.
export function sketchRevision(storage, namespace) {
  if (!storage || storage.revision === null || typeof storage.versionOf !== 'function' || typeof namespace !== 'string') {
    throw Error('A versioned sketch workspace is required.');
  }
  const keys = storage.getAllKeysFromNamespace(namespace);
  if (!Array.isArray(keys) || keys.length > 256) throw Error('The sketch workspace exceeds the edit limit.');
  let characters = 0;
  const entries = keys.sort().map(key => {
    if (typeof key !== 'string' || !key.startsWith(namespace) || key.length > 1024) throw Error('Invalid sketch workspace key.');
    characters += key.length;
    if (characters > 128 * 1024) throw Error('The sketch workspace exceeds the edit limit.');
    const version = storage.versionOf(key);
    if (!Number.isSafeInteger(version) || version < 1) throw Error('Sketch workspace changed during inspection.');
    return [key, version];
  });
  for (let i=1; i<entries.length; i++) if (entries[i-1][0]===entries[i][0]) throw Error('Duplicate sketch workspace key.');
  return JSON.stringify(entries);
}
