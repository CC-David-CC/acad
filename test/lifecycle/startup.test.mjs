import {test} from 'node:test';
import assert from 'node:assert/strict';
import {activate} from '../../web/app/cad/init/lifecycleBundle.js';

function fixture() {
  let loads = 0;
  const ctx = {streams:{}, services:{extension:{allExtensionsReady:()=>true,activateAllExtensions(){}}}, projectService:{load(){loads++;}}};
  activate(ctx);
  return {ctx, service:ctx.services.lifecycle, streams:ctx.streams.lifecycle, loads:()=>loads};
}

test('startup waits for actual jobs and publishes readiness once', () => {
  const f=fixture(), observed=[]; f.streams.projectLoaded.attach(value=>observed.push(value));
  f.service.startAsyncInitializingJob('engine'); f.service.declareAppReady();
  assert.equal(f.loads(),0); assert.deepEqual(f.service.pendingInitializingJobs(),['engine']);
  f.service.finishAsyncInitializingJob('engine'); f.service.finishAsyncInitializingJob('engine');
  assert.equal(f.loads(),1); assert.deepEqual(observed,[false,true]);
});

test('an initialization failure remains observable and cannot become ready later', () => {
  const f=fixture(); f.service.startAsyncInitializingJob('e0:loader'); f.service.declareAppReady();
  f.service.failAsyncInitializingJob('e0:loader',Error('WASM response failed'));
  f.service.finishAsyncInitializingJob('e0:loader'); f.service.declareAppReady();
  assert.deepEqual(f.streams.initializationFailure.value,{job:'e0:loader',message:'WASM response failed'});
  assert.equal(f.streams.projectLoaded.value,false); assert.equal(f.loads(),0);
  f.service.failAsyncInitializingJob('another',Error('later error'));
  assert.equal(f.streams.initializationFailure.value.job,'e0:loader');
});

test('a reentrant initialization callback cannot load the project twice', () => {
  const f=fixture();
  f.ctx.services.extension.activateAllExtensions=()=>f.service.finishAsyncInitializingJob('already-finished');
  f.service.declareAppReady();
  assert.equal(f.loads(),1); assert.equal(f.streams.projectLoaded.value,true);
});

test('project-load exceptions become failed readiness rather than an unhandled pending boot', () => {
  const f=fixture(); let calls=0;
  f.ctx.projectService.load=()=>{calls++;throw Error('Unable to load project')};
  f.service.declareAppReady(); f.service.loadProjectRequest();
  assert.equal(calls,1); assert.equal(f.streams.projectLoaded.value,false);
  assert.deepEqual(f.streams.initializationFailure.value,{job:'project:load',message:'Unable to load project'});
});

test('failure during extension activation cannot publish a ready project', () => {
  const f=fixture();
  f.ctx.services.extension.activateAllExtensions=()=>f.service.failAsyncInitializingJob('extension',Error('Activation failed'));
  f.service.declareAppReady();
  assert.equal(f.loads(),0); assert.equal(f.streams.projectLoaded.value,false);
});

test('failure reporting survives an unreadable error message', () => {
  const f=fixture(),error={}; Object.defineProperty(error,'message',{get(){throw Error('Unreadable')}});
  assert.doesNotThrow(()=>f.service.failAsyncInitializingJob('engine',error));
  assert.equal(f.streams.initializationFailure.value.message,'Initialization failed');
});
