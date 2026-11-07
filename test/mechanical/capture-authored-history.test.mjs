import {test} from 'node:test';
import assert from 'node:assert/strict';
import {captureAuthoredHistory} from '../../web/app/cad/craft/captureAuthoredHistory.mjs';

test('capture is detached, canonical and detects changed parameters', async()=>{
  const source=[{type:'X',params:{featureId:7,length:20}}];
  const saved=await captureAuthoredHistory(source);
  assert.equal((await captureAuthoredHistory([{params:{length:20,featureId:7},type:'X'}])).signature,saved.signature);
  source[0].params.length=35;
  assert.equal(saved.history[0].params.length,20);
  assert.notEqual((await captureAuthoredHistory(source)).signature,saved.signature);
});
test('refuses unsupported, excessive and cancelled input',async()=>{
  for(const input of [[{x:undefined}],[{x:Infinity}],[{x:'a'.repeat(100000)}],[{x:'\u0000'.repeat(50000)}],Array(257).fill({})]) await assert.rejects(captureAuthoredHistory(input));
  const many=Array.from({length:200},(_,i)=>({x:i}));let calls=0;
  await assert.rejects(captureAuthoredHistory(many,()=>{if(++calls>1)throw Error('cancelled')}),/cancelled/);
});
