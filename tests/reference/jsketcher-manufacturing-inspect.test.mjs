import {test} from 'node:test';
import assert from 'node:assert/strict';
import {inspectedProjectIsDirty} from '../apps/system/jsketcher/inspect-state.mjs';
const project={model:{history:[],expressions:''},sketches:[]};
const metadata={version:1,unit:'millimeter',revision:'r',materials:[],appearances:[],bindings:[],objects:[]};
const wrapped=JSON.stringify({format:'codi-jsketcher-manufacturing',version:1,project,manufacturing:metadata});
test('legacy projects and wrappers report unchanged state accurately',()=>{
 assert.equal(inspectedProjectIsDirty(project,JSON.stringify(project),null),false);
 assert.equal(inspectedProjectIsDirty(project,wrapped,()=>metadata),false);
 assert.equal(inspectedProjectIsDirty({...project,sketches:[{}]},wrapped,()=>metadata),true);
 assert.equal(inspectedProjectIsDirty(project,wrapped,()=>({...metadata,unit:'inch'})),true);
 assert.equal(inspectedProjectIsDirty(project,JSON.stringify(project),()=>metadata),true);
});
test('missing wrapped state fails closed',()=>{
 assert.throws(()=>inspectedProjectIsDirty(project,wrapped,null),/unavailable/);
 assert.throws(()=>inspectedProjectIsDirty(project,wrapped,()=>null),/unavailable/);
});
