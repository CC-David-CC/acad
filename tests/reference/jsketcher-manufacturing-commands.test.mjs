import test from 'node:test';
import assert from 'node:assert/strict';
import {registerManufacturingCommands} from '../apps/system/jsketcher/manufacturing-commands.mjs';

function fixture(){
 const lifetime=new AbortController(),handlers=new Map(),calls=[];
 const state={session:{},revision:'r1',current:true,proposal:'proposal-1'};
 const receipt=Object.freeze({path:'/enclosure.3mf',version:'v1',status:'pending',serverStatus:'not-verified'});
 const manager={
  getManufacturingMetadata:()=>({version:1,objects:[]}),
  async proposeHostManufacturingRebind(options){assert.equal(options.valid(),true);calls.push(['propose']);return {token:state.proposal,objectCount:2,regionCount:3,details:[]};},
  confirmHostManufacturingRebind(token){if(token!==state.proposal)throw Error('The model changed; review again.');calls.push(['confirm',token]);state.revision='r2';}
 };
 state.exportModel=async args=>{calls.push(['export',args]);return receipt;};
 const host={signal:lifetime.signal,session:()=>state.session,commands:{register(spec,handler){handlers.set(spec.id,handler);return ()=>handlers.delete(spec.id);}}};
 const stop=registerManufacturingCommands(host,{getTarget:()=>({manager,valid:()=>state.current}),inspect:()=>({revision:state.revision,path:null}),exportModel:args=>state.exportModel(args)});
 return {state,lifetime,handlers,calls,manager,receipt,stop};
}
test('export passes inspected explicit file intent to the shared operation',async()=>{
 const f=fixture(),result=await f.handlers.get('export-core-3mf')({revision:'r1',path:'/enclosure.3mf'});
 assert.equal(result,f.receipt);assert.deepEqual(f.calls,[['export',{revision:'r1',path:'/enclosure.3mf'}]]);assert.ok(Object.isFrozen(f.calls[0][1]));
 f.stop();assert.equal(f.handlers.size,0);
});
test('stale, wrong extension and accessor arguments cannot start export',async()=>{
 const f=fixture();let accessed=false;const accessor={revision:'r1'};
 Object.defineProperty(accessor,'path',{enumerable:true,get(){accessed=true;return '/bad.3mf';}});
 for(const args of [{revision:'old',path:'/a.3mf'},{revision:'r1',path:'/a.stl'},{revision:'r1',path:'/a.3mf',overwrite:true},accessor])await assert.rejects(f.handlers.get('export-core-3mf')(args));
 assert.equal(accessed,false);assert.deepEqual(f.calls,[]);
});
test('possible export commit and lost replies remain errors with no automatic retry',async()=>{
 const f=fixture(),failure=Object.assign(Error('Reply lost'),{possiblyCommitted:true});
 f.state.exportModel=async args=>{f.calls.push(['export',args]);throw failure;};
 await assert.rejects(f.handlers.get('export-core-3mf')({revision:'r1',path:'/a.3mf'}),error=>error===failure);
 assert.equal(f.calls.length,1);
});
test('account changes during export cannot become successful receipts',async()=>{
 const f=fixture();f.state.exportModel=async args=>{f.calls.push(['export',args]);f.state.session={};return f.receipt;};
 await assert.rejects(f.handlers.get('export-core-3mf')({revision:'r1',path:'/a.3mf'}));assert.equal(f.calls.length,1);
 const g=fixture();g.lifetime.abort();await assert.rejects(g.handlers.get('export-core-3mf')({revision:'r1',path:'/a.3mf'}));assert.equal(g.calls.length,0);
});
test('material proposals require a current revision and never confirm implicitly',async()=>{
 const f=fixture();assert.equal(f.handlers.get('inspect-manufacturing')({}).revision,'r1');
 await assert.rejects(f.handlers.get('propose-material-rebind')({revision:'old'}));
 const proposal=await f.handlers.get('propose-material-rebind')({revision:'r1'});
 assert.equal(proposal.token,'proposal-1');assert.deepEqual(f.calls,[['propose']]);
 assert.equal(f.handlers.get('confirm-material-rebind')({token:proposal.token}).revision,'r2');
 assert.deepEqual(f.calls,[['propose'],['confirm','proposal-1']]);
});
test('stale tokens and stale windows cannot mutate assignments',async()=>{
 const f=fixture();assert.throws(()=>f.handlers.get('confirm-material-rebind')({token:'other'}),/model changed/);assert.deepEqual(f.calls,[]);
 f.state.current=false;assert.throws(()=>f.handlers.get('confirm-material-rebind')({token:'proposal-1'}),/unavailable/);assert.deepEqual(f.calls,[]);
});
test('late supersession after confirmation is reported as committed',()=>{
 const f=fixture();f.manager.confirmHostManufacturingRebind=()=>{f.calls.push(['confirm']);f.state.current=false;};
 assert.throws(()=>f.handlers.get('confirm-material-rebind')({token:'proposal-1'}),error=>error.committed===true);assert.equal(f.calls.length,1);
});
