import {test} from 'node:test';
import assert from 'node:assert/strict';
import {encodePhysicalSource} from '../../web/app/cad/parameters/physicalSource.mjs';
import {resolvePhysicalBindings} from '../../web/app/cad/parameters/physicalBindings.mjs';
const definitions=n=>Array.from({length:n},(_,i)=>({name:'p'+i,dimension:'scalar',expression:'1'}));
test('expanded discovery hints do not expand source or Worker budgets',()=>{
 assert.doesNotThrow(()=>encodePhysicalSource(definitions(256)));
 assert.throws(()=>encodePhysicalSource(definitions(257)));
 const quantities={version:1,values:definitions(257).map(d=>({name:d.name,dimension:'scalar',value:1}))};
 assert.throws(()=>resolvePhysicalBindings({version:1,targets:[]},quantities));
 assert.throws(()=>resolvePhysicalBindings({version:1,targets:Array.from({length:257},()=>({}))},{version:1,values:[]}));
});
