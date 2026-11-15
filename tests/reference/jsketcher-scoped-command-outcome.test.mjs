import test from 'node:test';
import assert from 'node:assert/strict';
import {settleScopedCommand} from "../../webos/scoped-command.mjs";

test('lifetime loss while a submitted command is pending reports an unknown outcome', async () => {
  const controller = new AbortController();
  let finish;
  const operation = new Promise(resolve => { finish = resolve; });
  const result = settleScopedCommand(operation, {signal:controller.signal, valid:() => true});
  controller.abort();
  await assert.rejects(result, error => error.name === 'AbortError' && error.possiblyCommitted === true && error.committed !== true);
  // A later result cannot resettle the caller or be treated as proof that the
  // previously reported unknown outcome was a definite refusal.
  finish({committed:true});
});

test('a received committed receipt remains committed when its lifetime has ended', async () => {
  const controller = new AbortController();
  let current = true, finish;
  const operation = new Promise(resolve => { finish = resolve; });
  const result = settleScopedCommand(operation, {signal:controller.signal, valid:() => current});
  current = false;
  finish({committed:true});
  await assert.rejects(result, error => error.name === 'AbortError' && error.committed === true && error.possiblyCommitted !== true);
});
