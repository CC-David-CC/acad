import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createVolatileWorkspace} from '../../web/app/cad/storage/volatileWorkspace.mjs';
import {sketchRevision} from '../../web/app/cad/craft/sketchRevision.mjs';

test('project cache saves leave sketch revision intact; same-byte and ABA sketch writes do not',()=>{
 const workspace=createVolatileWorkspace(), storage={get revision(){return workspace.revision},getAllKeysFromNamespace:workspace.getAllKeysFromNamespace,versionOf:workspace.versionOf};
 workspace.set('sketch/a','content');const before=sketchRevision(storage,'sketch/');
 workspace.set('project/cache','snapshot');assert.equal(sketchRevision(storage,'sketch/'),before);
 workspace.set('sketch/a','content');const rewritten=sketchRevision(storage,'sketch/');assert.notEqual(rewritten,before);
 workspace.remove('sketch/a');workspace.set('sketch/a','content');assert.notEqual(sketchRevision(storage,'sketch/'),rewritten);
 workspace.set('sketch/b','another');assert.notEqual(sketchRevision(storage,'sketch/'),before);
});
test('nonvolatile or oversized namespaces fail closed',()=>{
 assert.throws(()=>sketchRevision({revision:null},'sketch/'));
 const workspace=createVolatileWorkspace();for(let i=0;i<257;i++)workspace.set(`sketch/${i}`,'');
 assert.throws(()=>sketchRevision({get revision(){return workspace.revision},getAllKeysFromNamespace:workspace.getAllKeysFromNamespace,versionOf:workspace.versionOf},'sketch/'),/limit/);
});
