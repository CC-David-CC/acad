import test from 'node:test';
import assert from 'node:assert/strict';
import {capturePipelineHistory,assertPipelineHistoryCurrent} from '../../web/app/cad/craft/capturePipelineHistory.mjs';

test('bounds, JSON property identity and detached ownership',async()=>{
 const input=Array.from({length:10000},(_,i)=>i),copy=await capturePipelineHistory(input);assert.deepEqual(copy,input);assert.ok(Object.isFrozen(copy));await assert.rejects(capturePipelineHistory([...input,10000]));
 const withKey=JSON.parse('[{"__proto__":{"owned":1},"constructor":"value"}]'),snapshot=await capturePipelineHistory(withKey);assert.equal(Object.getPrototypeOf(snapshot[0]),Object.prototype);assert.equal(Object.hasOwn(snapshot[0],'__proto__'),true);assert.equal(snapshot[0].__proto__.owned,1);await assertPipelineHistoryCurrent(withKey,snapshot);
 let value=null;for(let n=0;n<127;n++)value={x:value};await capturePipelineHistory([value]);value={x:value};await assert.rejects(capturePipelineHistory([value]));
});
test('cooperative comparison requires a check that observes in-place mutation',async()=>{
 const history=Array.from({length:400},(_,i)=>({params:{x:i}})),snapshot=await capturePipelineHistory(history);let checks=0,timer;
 await assertPipelineHistoryCurrent(history,snapshot,()=>{if(++checks===2)timer=setTimeout(()=>{history[0].params.x=999},0)});clearTimeout(timer);assert.equal(history[0].params.x,999,'mutation happened after earlier field was visited');
 history[0].params.x=0;checks=0;await assert.rejects(assertPipelineHistoryCurrent(history,snapshot,()=>{if(history[0].params.x!==0)throw Error('stale');if(++checks===2)timer=setTimeout(()=>{history[0].params.x=999},0)}),/stale/);clearTimeout(timer);
});
test('Proxy traps are observable: plain-data provenance must be trusted',async()=>{
 let traps=0;const value=new Proxy({type:'FEATURE',params:{}},{ownKeys(t){traps++;return Reflect.ownKeys(t)},getPrototypeOf(t){traps++;return Reflect.getPrototypeOf(t)},getOwnPropertyDescriptor(t,k){traps++;return Reflect.getOwnPropertyDescriptor(t,k)}});const result=await capturePipelineHistory([value]);assert.ok(traps>0);assert.deepEqual(result,[{type:'FEATURE',params:{}}]);
});
