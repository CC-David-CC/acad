import {settleScopedCommand} from './scoped-command.mjs';

function capture(args, keys) {
  if (!args || typeof args !== 'object' || Array.isArray(args)) throw Error('Invalid diagnostic arguments.');
  const own = Reflect.ownKeys(args);
  if (own.length !== keys.length || own.some(key => typeof key !== 'string' || !keys.includes(key))) throw Error('Invalid diagnostic arguments.');
  const copy = {};
  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(args, key);
    if (!descriptor?.enumerable || !Object.hasOwn(descriptor, 'value')) throw Error('Diagnostic arguments must be data.');
    copy[key] = descriptor.value;
  }
  return copy;
}

// Reports are read-only estimates from the same core used by the application.
// This adapter neither solves locally nor supplies model/history data to core.
export function registerSketchDiagnosticCommands(host, getTarget) {
  const stops = [];
  function target(method) {
    const session = host.session(), captured = getTarget();
    const valid = () => !!session && !host.signal.aborted && host.session() === session && captured.valid();
    if (!valid() || typeof captured.diagnostics?.[method] !== 'function') throw Error('Sketch diagnostics are unavailable in this window.');
    return {diagnostics: captured.diagnostics, valid};
  }
  try {
    stops.push(host.commands.register({
      id: 'inspect-sketch-diagnostics',
      description: 'Inspect current active/saved sketch diagnostic targets and a revision. Consumed or unsupported faces remain explicitly unavailable.',
      parameters: {type: 'object', additionalProperties: false}
    }, args => {
      capture(args, []);
      const t = target('inspect'), result = t.diagnostics.inspect();
      if (!t.valid()) throw Error('The window or account changed.');
      return result;
    }));
    stops.push(host.commands.register({
      id: 'analyze-sketch',
      description: 'Request a read-only Worker estimate for an inspected current sketch. Local Jacobian estimates do not certify global freedom, satisfiability or physical behavior. No geometry, history or file is changed.',
      parameters: {type: 'object', additionalProperties: false, required: ['revision', 'mode', 'faceId'], properties: {
        revision: {type: 'string', minLength: 1, maxLength: 256},
        mode: {type: 'string', enum: ['active', 'saved']},
        faceId: {type: 'string', minLength: 1, maxLength: 1024}
      }}
    }, args => {
      const copy = capture(args, ['revision', 'mode', 'faceId']);
      if (typeof copy.revision !== 'string' || !copy.revision || copy.revision.length > 256 ||
          !['active', 'saved'].includes(copy.mode) || typeof copy.faceId !== 'string' || !copy.faceId || copy.faceId.length > 1024) throw Error('Provide an inspected current sketch target.');
      const t = target('analyze');
      return settleScopedCommand(t.diagnostics.analyze(Object.freeze(copy), {signal: host.signal, valid: t.valid}), {signal: host.signal, valid: t.valid});
    }));
  } catch (error) { for (const stop of stops.reverse()) stop(); throw error; }
  return () => { for (const stop of stops.reverse()) stop(); };
}
