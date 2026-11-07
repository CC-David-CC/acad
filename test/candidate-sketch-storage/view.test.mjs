import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createCandidateSketchStorage} from '../../web/app/cad/craft/candidateSketchStorage.mjs';

test('candidate reads override only its target and never writes the workspace',()=>{
 const values=new Map([['face','old'],['other','other bytes']]);let writes=0;
 const source={getAllSketches:()=>[...values.keys()],getSketchData:k=>values.get(k)??null,hasSketch:k=>values.has(k),readSketch:k=>'live:'+k,setSketchData(){writes++},removeSketchData(){writes++}};
 const override={id:'face',data:'{"candidate":true}'},read=(data,id,strict)=>({data,id,strict}),view=createCandidateSketchStorage(source,[override],read);
 override.id='other';override.data='{}';
 assert.equal(view.getSketchData('face'),'{"candidate":true}');assert.equal(view.getSketchData('other'),'other bytes');
 assert.deepEqual(view.readSketch('face'),{data:{candidate:true},id:'face',strict:true});assert.equal(view.readSketch('other'),'live:other');
 assert.equal(view.hasSketch('face'),true);assert.deepEqual(view.getAllSketches(),['face','other']);assert.equal(Object.isFrozen(view),true);
 assert.throws(()=>view.setSketchData('face','bad'),/read-only/);assert.throws(()=>view.removeSketchData('face'),/read-only/);
 assert.equal(values.get('face'),'old');assert.equal(writes,0);
});

test('invalid sources fail closed and absence of an override preserves existing behavior',()=>{
 const source={};assert.equal(createCandidateSketchStorage(source,[],()=>{}),source);
 for(const value of [{id:'',data:'{}'},{id:'x',data:'x'.repeat(1048577)},{id:'x'.repeat(1025),data:'{}'},{id:'x',data:'{}',extra:true}])assert.throws(()=>createCandidateSketchStorage(source,[value],()=>{}));
 let called=false;const active={id:'x',get data(){called=true;return '{}'}};assert.throws(()=>createCandidateSketchStorage(source,[active],()=>{}));assert.equal(called,false);
});
test('multiple candidates are detached, bounded and duplicate identities refuse',()=>{const source={getAllSketches:()=>['a','b','c'],getSketchData:k=>'live:'+k,hasSketch:()=>false,readSketch:k=>'live:'+k};const inputs=[{id:'a',data:'{"x":1}'},{id:'b',data:'{"x":2}'}],view=createCandidateSketchStorage(source,inputs,x=>x);inputs[0].data='{}';assert.equal(view.getSketchData('a'),'{"x":1}');assert.equal(view.getSketchData('b'),'{"x":2}');assert.equal(view.getSketchData('c'),'live:c');assert.deepEqual(view.readSketch('b'),{x:2});assert.throws(()=>createCandidateSketchStorage(source,[{id:'a',data:'{}'},{id:'a',data:'{}'}],()=>{}));const sparse=Array(2);sparse[0]={id:'a',data:'{}'};assert.throws(()=>createCandidateSketchStorage(source,sparse,()=>{}));assert.throws(()=>createCandidateSketchStorage(source,[{id:'a',data:'€'.repeat(349526)}],()=>{}));});
