import test from 'node:test';
import assert from 'node:assert/strict';
import {createCadAgent} from '../apps/system/jsketcher/examples/cad-agent.mjs';

function registry({windows = ['cad-1'], execute} = {}) {
  const ids = ['inspect','inspect-rectangle-creation','create-rectangle-sketch','inspect-worker-features','create-worker-extrusion','create-worker-centered-hole','create-worker-four-corner-holes','inspect-published-worker-geometry','save','new-project','open-project'];
  const requests = [];
  return {requests, list: () => windows.flatMap(windowId => ids.map(id => ({windowId,appId:'jsketcher',id,documentToken:'fixture-document-token'}))), execute: async request => {requests.push(request);return execute?.(request);}};
}

test('ambiguous windows refuse; explicit window remains bound', async () => {
  const api = registry({windows:['a','b'],execute:() => ({revision:'r'})});
  assert.throws(() => createCadAgent({api}), /explicitly/);
  const cad = createCadAgent({api,windowId:'b'});
  await cad.inspect();
  assert.equal(api.requests[0].windowId,'b');
});

test('nonempty or saved work is preserved before any authoring', async () => {
  for (const document of [{operationCount:1,sketchCount:0},{operationCount:0,sketchCount:1},{operationCount:0,sketchCount:0,path:'/work.jsketcher.json'},{operationCount:0,sketchCount:0,dirty:true}]) {
    const api = registry({execute:() => document});
    await assert.rejects(createCadAgent({api}).buildBracket(), /new, empty/);
    assert.deepEqual(api.requests.map(r=>r.command),['inspect']);
  }
});

test('close between demo steps stops authoring; no alternate window or retry', async () => {
  const windows = ['cad-1'];
  const api = registry({windows,execute:() => {windows.length=0;return {operationCount:0,sketchCount:0,dirty:false};}});
  await assert.rejects(createCadAgent({api}).buildBracket(), /window or account changed/);
  assert.deepEqual(api.requests.map(r=>r.command),['inspect']);
});

test('helper cancellation stops later steps, while accepted receipt stays accepted', async () => {
  const controller = new AbortController();
  const api = registry({execute:() => {controller.abort();return {revision:'accepted'};}});
  const cad = createCadAgent({api,signal:controller.signal});
  assert.deepEqual(await cad.inspect(),{revision:'accepted'});
  await assert.rejects(cad.inspect(),{name:'AbortError'});
  assert.equal(api.requests.length,1);
});

test('uncertain save error is preserved exactly and never retried', async () => {
  const error = Object.assign(Error('connection lost after write'),{possiblyCommitted:true});
  const api = registry({execute:({command}) => {if(command==='inspect')return {revision:'fresh',path:null};throw error;}});
  await assert.rejects(createCadAgent({api}).save('/new.jsketcher.json'), actual=>actual===error);
  assert.deepEqual(api.requests.map(r=>r.command),['inspect','save']);
  assert.deepEqual(api.requests[1].args,{revision:'fresh',path:'/new.jsketcher.json'});
});

test('existing document save uses current path implicitly; different path refuses', async () => {
  const api = registry({execute:({command}) => command==='inspect'?{revision:'now',path:'/saved.jsketcher.json'}:{persistence:'browser',serverStatus:'not-verified'}});
  const cad = createCadAgent({api});
  assert.equal((await cad.save()).serverStatus,'not-verified');
  assert.deepEqual(api.requests[1].args,{revision:'now'});
  await assert.rejects(cad.save('/other.jsketcher.json'), /Save a copy/);
  assert.equal(api.requests.filter(r=>r.command==='save').length,1);
});

test('one pending operation blocks another on the same helper', async () => {
  let release;
  const api = registry({execute:()=>new Promise(resolve=>{release=resolve;})});
  const cad = createCadAgent({api}),pending=cad.inspect();
  await assert.rejects(cad.inspect(), /Wait for/);
  release({revision:'r'});await pending;
  assert.equal(api.requests.length,1);
});

test('new/open carry freshly inspected revision and preserve cancellation outcome', async () => {
  let revision=0;
  const api = registry({execute:({command})=>command==='inspect'?{revision:String(++revision)}:{status:'cancelled'}});
  const cad=createCadAgent({api});
  assert.equal((await cad.newProject()).status,'cancelled');
  assert.equal((await cad.open('/mine.jsketcher.json')).status,'cancelled');
  assert.deepEqual(api.requests[1].args,{revision:'1'});
  assert.deepEqual(api.requests[3].args,{revision:'2',path:'/mine.jsketcher.json'});
});

test('log observers never receive mutable model inspection results', async () => {
  const document={operationCount:1,sketchCount:1,dirty:true};
  const api=registry({execute:()=>document});
  const cad=createCadAgent({api,onStep:event=>{
    if(event.phase==='accepted') {
      assert.equal(Object.hasOwn(event,'result'),false);
      if(event.result)Object.assign(event.result,{operationCount:0,sketchCount:0,dirty:false});
    }
  }});
  await assert.rejects(cad.buildBracket(), /new, empty/);
  assert.deepEqual(document,{operationCount:1,sketchCount:1,dirty:true});
  assert.deepEqual(api.requests.map(r=>r.command),['inspect']);
});
