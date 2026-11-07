import {strict as assert} from 'assert';
import {MBrepShell} from 'cad/model/mshell';
import {Shell} from 'brep/topo/shell';
import {OCI, clearImplicitModels} from 'cad/craft/e0/occCommandInterface';
import {createOCCUtils} from 'cad/craft/e0/OCCUtils';
import {createOCCIO} from 'cad/craft/e0/occIO';
import {createNativeOperationService} from 'cad/craft/nativeEngine/nativeOperationService';
import {OCCClassifier} from 'cad/craft/production/classifier';
import {assertLegacyOperationInputs} from 'cad/craft/legacyOperationInputs';
import {assertDurableReference, requireLegacyPointer} from 'cad/model/workerGeometry';

// Admission tests use actual model wrappers and kernel spies. Empty topology
// fixtures here are not evidence of valid CAD geometry or actual kernel work.
const body = (id: string, ptr?: number) => {
  const topology = new Shell();
  if (ptr !== undefined) topology.data.externals = {ptr};
  const model = new MBrepShell(topology); model.id = id; return model;
};
const legacy = body('legacy', 123), other = body('other', 456);
const worker = body('worker', 789), missing = body('missing');
worker.ext.workerGeometry = {representation:'worker-owned-occ-prism'};
const code = expected => error => error?.code === expected;
const before = (calls, action, expected) => {
  const count = calls.length;
  assert.throws(action, code(expected));
  assert.equal(calls.length, count, 'rejected inputs must not call the kernel');
};
const calls: any[] = [], pushes: any[] = [];
let pushAccepted = true, pointer = 1000;
(globalThis as any)._malloc = () => pointer += 16;
(globalThis as any)._free = () => {};
(globalThis as any).writeAsciiToMemory = () => {};
(globalThis as any).Module = {
  setValue() {}, _CallCommand(...args) { calls.push(['command', ...args]); return 0; },
  _UpdateTessellation(...args) { calls.push(['tessellate', ...args]); },
  _ClassifyFaceToFace(...args) { calls.push(['classify', ...args]); return 1; },
  _IsEdgesOverlap(...args) { calls.push(['overlap', ...args]); return true; },
  _ClassifyEdgeToFace(...args) { calls.push(['edge-face', ...args]); return 1; }
};
(globalThis as any).__CAD_APP = {occService:{io:{pushModel(model, name) {
  pushes.push([model, name]); return pushAccepted;
}}}};

async function main() {
  clearImplicitModels();
  before(calls, () => (OCI as any).copy(legacy, worker), 'WORKER_REPRESENTATION_UNSUPPORTED');
  assert.equal(pushes.length, 0);
  before(calls, () => (OCI as any).copy('worker-prism:1:["feature","body"]'), 'WORKER_REPRESENTATION_UNSUPPORTED');
  before(calls, () => (OCI as any).copy(missing), 'LEGACY_GEOMETRY_UNAVAILABLE');
  pushAccepted = false;
  before(calls, () => (OCI as any).copy(legacy), 'LEGACY_GEOMETRY_UNAVAILABLE');
  assert.equal(pushes.length, 1);
  pushAccepted = true;
  (OCI as any).copy(legacy);
  assert.equal(pushes.length, 2, 'failed registration must not poison the cache');
  (OCI as any).copy(legacy);
  assert.equal(pushes.length, 2);
  (OCI as any).copy(body('legacy', 321));
  assert.equal(pushes.length, 3, 'same ID with new geometry must register again');
  const native = body('native'); native.brepShell.data.__meshWithOrigins = {};
  assert.throws(() => requireLegacyPointer(native, 'test'), code('NATIVE_REPRESENTATION_UNSUPPORTED'));
  for (const ptr of [0,-1,NaN,Infinity,0.5,Number.MAX_SAFE_INTEGER+1]) {
    assert.throws(() => requireLegacyPointer(body('bad',ptr), 'test'), code('LEGACY_GEOMETRY_UNAVAILABLE'));
  }
  assert.equal(requireLegacyPointer(legacy,'test'),123);
  worker.ext.workerIdentity={stability:'transient'};
  assert.throws(() => assertDurableReference(worker,'test'),code('TRANSIENT_REFERENCE_UNSUPPORTED'));
  assert.doesNotThrow(() => assertDurableReference(legacy,'test'));
  assert.throws(() => assertLegacyOperationInputs({sections:[{face:worker}]},[]),code('WORKER_REPRESENTATION_UNSUPPORTED'));
  assert.throws(() => assertLegacyOperationInputs({boolean:{kind:'UNION',targets:[]}},[legacy,worker]),code('WORKER_REPRESENTATION_UNSUPPORTED'));
  assert.doesNotThrow(() => assertLegacyOperationInputs({boolean:{kind:'NONE'}},[worker]));
  assert.doesNotThrow(() => assertLegacyOperationInputs({boolean:{kind:'UNION',targets:[legacy]}},[worker,legacy]));
  const booleanCalls=[];
  const ctx:any={cadRegistry:{shells:[legacy,worker]},occService:{
    commandInterface:new Proxy({}, {get:(_,name)=>(...args)=>{booleanCalls.push([name,...args]);return 0;}}),
    io:{pushModel(model,name){booleanCalls.push(['push',model,name]);return pushAccepted;},getShell(){throw Error('unexpected interrogation');}}
  }};
  const occ=createOCCUtils(ctx);
  before(booleanCalls,()=>occ.applyBooleanModifier([other],{kind:'UNION',targets:[],simplify:false}),'WORKER_REPRESENTATION_UNSUPPORTED');
  before(booleanCalls,()=>occ.applyBooleanModifier([other],{kind:'UNION',targets:[legacy,missing],simplify:false}),'LEGACY_GEOMETRY_UNAVAILABLE');
  pushAccepted=false;
  assert.throws(()=>occ.applyBooleanModifier([other],{kind:'UNION',targets:[legacy],simplify:false}),code('LEGACY_GEOMETRY_UNAVAILABLE'));
  assert.deepEqual(booleanCalls.map(call=>call[0]),['push'],'false push must not start Boolean commands');
  pushAccepted=true;
  assert.deepEqual(occ.applyBooleanModifier([legacy],{kind:'NONE',targets:[],simplify:false}),{created:[legacy],consumed:[]});
  const classifier=new OCCClassifier();
  before(calls,()=>classifier.prepare(missing.brepShell),'LEGACY_GEOMETRY_UNAVAILABLE');
  before(calls,()=>classifier.classifyFaceToFace(legacy.brepShell as any,missing.brepShell as any),'LEGACY_GEOMETRY_UNAVAILABLE');
  before(calls,()=>classifier.classifyEdgeToEdge(missing.brepShell as any,legacy.brepShell as any),'LEGACY_GEOMETRY_UNAVAILABLE');
  before(calls,()=>classifier.classifyEdgeToFace(legacy.brepShell as any,missing.brepShell as any),'LEGACY_GEOMETRY_UNAVAILABLE');
  classifier.prepare(legacy.brepShell);
  assert.deepEqual(calls[calls.length-1],['tessellate',123,2]);
  const service=createNativeOperationService(ctx);
  await assert.rejects(service.applyBooleanModifier([native],{kind:'UNION',targets:[native,worker],simplify:false}),code('WORKER_REPRESENTATION_UNSUPPORTED'));
  await assert.rejects(service.applyBooleanModifier([native],{kind:'UNION',targets:[native,legacy],simplify:false}),code('NATIVE_REPRESENTATION_UNSUPPORTED'));
  await assert.rejects(service.applyBooleanModifier([legacy],{kind:'UNION',targets:[native,native],simplify:false}),code('NATIVE_REPRESENTATION_UNSUPPORTED'));
  assert.equal((globalThis as any).__guardMeshKernelCalls||0,0,'check all native operands before first job');
  assert.deepEqual(await service.applyBooleanModifier([native],{kind:'NONE',targets:[],simplify:false}),{created:[native],consumed:[]});
  let engineStatus=7, registrations=0;
  const io=createOCCIO({occService:{engineInterface:{io:{pushModel(){registrations++;return engineStatus;}}}}} as any);
  (globalThis as any).__CAD_APP={occService:{io}};
  clearImplicitModels();
  before(calls,()=> (OCI as any).copy(legacy),'LEGACY_GEOMETRY_UNAVAILABLE');
  assert.equal(registrations,1);
  engineStatus=0;
  (OCI as any).copy(legacy);
  assert.equal(registrations,2,'underlying failed registration must be retried, not cached');
  (OCI as any).copy(legacy);
  assert.equal(registrations,2);
  console.log('PASS operand/cache, Boolean, classifier, registration status and native admission guards');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
