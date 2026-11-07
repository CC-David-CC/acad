import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createVolatileWorkspace} from '../../web/app/cad/storage/volatileWorkspace.mjs';

test('authored namespace tokens ignore cache saves but detect rewrite and delete/re-add',()=>{
 const w=createVolatileWorkspace(), initial=w.namespaceRevision('sketch/'), other=w.namespaceRevision('other/');
 w.set('project/cache','snapshot');assert.equal(w.namespaceRevision('sketch/'),initial);
 w.set('sketch/a','bytes');const first=w.namespaceRevision('sketch/');assert.notEqual(first,initial);
 assert.equal(w.namespaceRevision('other/'),other);
 w.set('sketch/a','bytes');const rewrite=w.namespaceRevision('sketch/');assert.notEqual(rewrite,first);
 w.remove('sketch/a');w.set('sketch/a','bytes');assert.notEqual(w.namespaceRevision('sketch/'),rewrite);
 w.set('project/cache','another snapshot');assert.equal(w.get('sketch/a'),'bytes');
});

test('prepared writes publish matching namespace counters only at successful commit',()=>{
 const w=createVolatileWorkspace();w.set('sketch/a','old');const old=w.namespaceRevision('sketch/'), other=w.namespaceRevision('other/');
 let p=w.prepareWrites([{key:'sketch/a',value:'new'}]);
 assert.equal(p.get('sketch/a'),'new');assert.equal(w.get('sketch/a'),'old');assert.equal(w.namespaceRevision('sketch/'),old);
 p.discard();assert.equal(w.namespaceRevision('sketch/'),old);
 p=w.prepareWrites([{key:'sketch/a',value:'new'}]);p.commit();
 assert.equal(w.get('sketch/a'),'new');assert.notEqual(w.namespaceRevision('sketch/'),old);assert.equal(w.namespaceRevision('other/'),other);
});

test('registering a namespace during preparation neither loses its change nor invalidates the write',()=>{
 const w=createVolatileWorkspace();const p=w.prepareWrites([{key:'sketch/a',value:'new'}]);
 const old=w.namespaceRevision('sketch/');assert.equal(p.isCurrent(),true);p.commit();
 assert.notEqual(w.namespaceRevision('sketch/'),old);
});

test('the complete workspace commit fence is retained across unrelated writes',()=>{
 const w=createVolatileWorkspace();w.set('sketch/a','old');const old=w.namespaceRevision('sketch/');
 const p=w.prepareWrites([{key:'sketch/a',value:'new'}]);w.set('project/cache','snapshot');
 assert.throws(()=>p.commit(),/superseded/);assert.equal(w.get('sketch/a'),'old');assert.equal(w.namespaceRevision('sketch/'),old);
});

test('prefix observation is bounded independently from document file count',()=>{
 const w=createVolatileWorkspace();for(let i=0;i<1000;i++)w.set('sketch/'+i,'');
 const revision=w.revision;assert.doesNotThrow(()=>w.namespaceRevision('sketch/'));
 for(let i=0;i<63;i++)w.namespaceRevision('observer-'+i+'/');
 assert.throws(()=>w.namespaceRevision('extra/'),/tracked/);
 assert.throws(()=>w.namespaceRevision('x'.repeat(1025)),/namespace/);assert.equal(w.revision,revision);
 assert.doesNotThrow(()=>w.namespaceRevision('sketch/'));
});
