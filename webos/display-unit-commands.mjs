// Presentation uses the document manager. Modeling values remain canonical.
export function registerDisplayUnitCommands(host, getTarget) {
  const stops = [];
  function capture(value, keys) {
    if (!value || typeof value !== 'object' || Array.isArray(value) ||
        Reflect.ownKeys(value).length !== keys.length) throw Error('Invalid display-unit arguments.');
    const result = {};
    for (const key of keys) {
      const field = Object.getOwnPropertyDescriptor(value, key);
      if (!field?.enumerable || !Object.hasOwn(field, 'value')) throw Error('Display-unit fields must be data.');
      result[key] = field.value;
    }
    return Object.freeze(result);
  }
  function target(method) {
    const captured = getTarget(), session = host.session();
    const valid = () => {
      try { return !!session && !host.signal.aborted && host.session() === session && captured.valid() === true; }
      catch { return false; }
    };
    if (!valid() || typeof captured.manager?.[method] !== 'function') throw Error('Display units are unavailable in this modeling window.');
    return {manager: captured.manager, valid};
  }
  try {
    stops.push(host.commands.register({
      id: 'inspect-display-units',
      description: 'Inspect this document’s display units and revision. Modeling values remain millimeters and radians.',
      parameters: {type: 'object', additionalProperties: false}
    }, args => {
      capture(args, []);
      const t = target('inspectDisplayUnits'), result = t.manager.inspectDisplayUnits();
      if (!t.valid()) throw Error('The window or account changed.');
      return result;
    }));
    stops.push(host.commands.register({
      id: 'set-display-units',
      description: 'Set millimeter or inch presentation using the inspected revision, without rescaling geometry or changing authored Undo. Save separately.',
      parameters: {type: 'object', additionalProperties: false, required: ['revision', 'lengthUnit'], properties: {
        revision: {type: 'string', minLength: 1, maxLength: 256},
        lengthUnit: {type: 'string', enum: ['millimeter', 'inch']}
      }}
    }, args => {
      const copy = capture(args, ['revision', 'lengthUnit']);
      if (typeof copy.revision !== 'string' || !copy.revision || copy.revision.length > 256 ||
          !['millimeter', 'inch'].includes(copy.lengthUnit)) throw Error('Provide an inspected revision and supported length display unit.');
      const t = target('setDisplayUnits');
      // The setter is synchronous. A revoked host must not hide a known
      // metadata commit behind an ordinary pre-commit cancellation error.
      const result = t.manager.setDisplayUnits(copy, {signal: host.signal, valid: t.valid});
      if (!t.valid()) {
        const error = Error(result?.changed ? 'Display units changed before the window or account changed.' : 'The window or account changed.');
        if (result?.changed === true) Object.defineProperty(error, 'committed', {value: true, enumerable: true});
        throw error;
      }
      return result;
    }));
  } catch (error) {
    for (const stop of stops.reverse()) stop();
    throw error;
  }
  return () => { for (const stop of stops.splice(0).reverse()) stop(); };
}
