import test from 'node:test';
import assert from 'node:assert/strict';
import {capturePipelineHistory, assertPipelineHistoryCurrent} from '../../web/app/cad/craft/capturePipelineHistory.mjs';

test('large histories are detached, preserve order, and yield', async () => {
  const history = Array.from({length:400}, (_,i) => ({type:'FEATURE',params:{index:i, label:'a'.repeat(1024)}}));
  let beats=0; const timer=setInterval(()=>beats++,0);
  try {
    const copy=await capturePipelineHistory(history);
    assert.ok(beats>0); assert.deepEqual(copy,history); assert.notEqual(copy,history);
    assert.ok(Object.isFrozen(copy)); assert.ok(Object.isFrozen(copy[0])); assert.ok(Object.isFrozen(copy[0].params));
    assert.equal(Object.isFrozen(history),false); assert.equal(Object.isFrozen(history[0].params),false);
    assert.throws(()=>{copy[0].params.index=42},TypeError); assert.throws(()=>{copy.push({})},TypeError);
    history[0].params.index=123; assert.equal(copy[0].params.index,0);
    await assert.rejects(assertPipelineHistoryCurrent(history,copy));
    history[0].params.index=0; await assertPipelineHistoryCurrent(history,copy);
    await assertPipelineHistoryCurrent([{a:1,b:2}],[{b:2,a:1}]);
  } finally { clearInterval(timer); }
});

test('rejects exotic values, sparse arrays, cycles and accessors without invoking them', async () => {
  let invoked=false; const getter={};Object.defineProperty(getter,'x',{enumerable:true,get(){invoked=true;return 1}});
  const sparse=[];sparse.length=2; const cycle={};cycle.self=cycle;
  for (const value of [getter,sparse,cycle,new Date(),new Map(),{x:NaN},Object.assign([1],{extra:1})]) {
    await assert.rejects(capturePipelineHistory([value]));
  }
  assert.equal(invoked,false);
});

test('honors currentness around cooperative yields and exact values', async () => {
  const data=Array.from({length:300},(_,i)=>({i})); let calls=0;
  await assert.rejects(capturePipelineHistory(data,()=>{if(++calls>1)throw Error('stale')}),/stale/);
  await assert.rejects(assertPipelineHistoryCurrent([{x:-0}],[{x:0}]));
  await assert.rejects(capturePipelineHistory(Array.from({length:10001},()=>null)));
});
