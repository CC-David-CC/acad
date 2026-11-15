import test from 'node:test';
import assert from 'node:assert/strict';
import {registerSketchDiagnosticCommands} from "../../webos/diagnostic-commands.mjs";

function fixture() {
  const commands = new Map(), controller = new AbortController();
  const state = {session: {}, valid: true, calls: []};
  const diagnostics = {
    inspect() { state.calls.push('inspect'); return {revision: 'r', activeFaceId: 'face', saved: []}; },
    async analyze(args, options) { state.calls.push({args, options}); return {status: 'unavailable', scope: 'current-sketch-admission-snapshot'}; }
  };
  const host = {signal: controller.signal, session: () => state.session,
    commands: {register(spec, run) { commands.set(spec.id, {spec, run}); return () => commands.delete(spec.id); }}};
  const stop = registerSketchDiagnosticCommands(host, () => ({diagnostics, valid: () => state.valid}));
  return {state, diagnostics, host, commands, controller, stop, run: (id, args) => commands.get(id).run(args)};
}
const request = {revision: 'r', mode: 'active', faceId: 'face'};

test('diagnostics delegate read-only inspection and detached target arguments to the same core', async () => {
  const f = fixture();
  assert.equal(f.commands.size, 2);
  assert.equal(f.run('inspect-sketch-diagnostics', {}).revision, 'r');
  const input = {...request}, result = await f.run('analyze-sketch', input);
  assert.equal(result.status, 'unavailable');
  const call = f.state.calls[1];
  assert.deepEqual(call.args, input); assert.notEqual(call.args, input); assert.ok(Object.isFrozen(call.args));
  assert.equal(call.options.valid(), true); f.state.valid = false; assert.equal(call.options.valid(), false);
  f.stop(); assert.equal(f.commands.size, 0);
});

test('malformed data, accessors and unrequested history never reach the diagnostic core', () => {
  const f = fixture(); let reads = 0;
  const getter = {...request}; Object.defineProperty(getter, 'faceId', {enumerable: true, get() { reads++; return 'face'; }});
  for (const value of [getter, {...request, history: []}, {...request, mode: 'prefix'}, {...request, faceId: 'x'.repeat(1025)}, {...request, revision: ''}, null]) assert.throws(() => f.run('analyze-sketch', value));
  assert.throws(() => f.run('inspect-sketch-diagnostics', {history: []}));
  assert.equal(reads, 0); assert.equal(f.state.calls.length, 0); f.stop();
});

test('missing core capability and stale inspection cannot manufacture diagnostic success', () => {
  const f = fixture(); f.diagnostics.analyze = undefined;
  assert.throws(() => f.run('analyze-sketch', request), /unavailable/);
  f.diagnostics.inspect = () => { f.state.valid = false; return {revision: 'stale'}; };
  assert.throws(() => f.run('inspect-sketch-diagnostics', {}), /changed/); f.stop();
});

test('window and account loss settle a diagnostic call even if its removed frame never replies', async () => {
  for (const mode of ['window', 'account']) {
    const f = fixture(); f.diagnostics.analyze = () => new Promise(() => {});
    const job = f.run('analyze-sketch', request);
    if (mode === 'window') f.controller.abort(); else f.state.session = {};
    await assert.rejects(job, error => error.name === 'AbortError'); f.stop();
  }
});

test('partial command registration releases the earlier diagnostic command', () => {
  const f = fixture(); f.stop(); let removed = 0, registered = 0;
  f.host.commands.register = () => { if (++registered === 2) throw Error('registration failure'); return () => removed++; };
  assert.throws(() => registerSketchDiagnosticCommands(f.host, () => ({diagnostics: f.diagnostics, valid: () => true})), /registration failure/);
  assert.equal(removed, 1);
});
