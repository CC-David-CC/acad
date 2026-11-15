import {test} from 'node:test';
import assert from 'node:assert/strict';
import {inspectedProjectIsDirty} from '../apps/system/jsketcher/inspect-state.mjs';
const project={model:{history:[],expressions:''},sketches:[]};
const metadata={version:1,unit:'millimeter',revision:'r',materials:[],appearances:[],bindings:[],objects:[]};
const plain=JSON.stringify({format:'codi-jsketcher-project',version:2,unit:'millimeter',project});
const wrapped=JSON.stringify({format:'codi-jsketcher-project',version:2,unit:'millimeter',project,manufacturing:metadata});
test('canonical projects report unchanged and changed state accurately',()=>{
 assert.equal(inspectedProjectIsDirty(project,plain,null,'millimeter'),false);
 assert.equal(inspectedProjectIsDirty(project,wrapped,()=>metadata,'millimeter'),false);
 assert.equal(inspectedProjectIsDirty({...project,sketches:[{}]},wrapped,()=>metadata,'millimeter'),true);
 assert.equal(inspectedProjectIsDirty(project,wrapped,()=>({...metadata,revision:'changed'}),'millimeter'),true);
 assert.equal(inspectedProjectIsDirty(project,plain,()=>metadata,'millimeter'),true);
});
test('missing wrapped state fails closed',()=>{
 assert.throws(()=>inspectedProjectIsDirty(project,wrapped,null,'millimeter'),/unavailable/);
 assert.throws(()=>inspectedProjectIsDirty(project,wrapped,()=>null,'millimeter'),/unavailable/);
});
test('unknown format and mismatched model/material units fail closed',()=>{
 assert.throws(()=>inspectedProjectIsDirty(project,JSON.stringify(project),null,'millimeter'),/unavailable/);
 for(const version of [1,3,'2',null])assert.throws(()=>inspectedProjectIsDirty(project,JSON.stringify({...JSON.parse(plain),version}),null,'millimeter'),/unavailable/);
 assert.throws(()=>inspectedProjectIsDirty(project,wrapped,()=>metadata,undefined),/unavailable/);
 assert.throws(()=>inspectedProjectIsDirty(project,wrapped,()=>({...metadata,unit:'inch'}),'millimeter'),/units/);
});
