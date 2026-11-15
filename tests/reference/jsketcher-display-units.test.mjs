// Adapter/metadata controls, not geometry or persistence qualification.
import test from 'node:test';
import assert from 'node:assert/strict';
import {registerDisplayUnitCommands} from "../../webos/display-unit-commands.mjs";
import {inspectedProjectIsDirty} from "../../webos/inspect-state.mjs";

const project={model:{history:[],expressions:'width = 25.4'},sketches:[]},inch=Object.freeze({version:1,lengthUnit:'inch'}),manufacture={version:1,unit:'millimeter',revision:'m0',materials:[],appearances:[],bindings:[],objects:[]};
const envelope=(m=null,d=null)=>JSON.stringify({format:'codi-jsketcher-project',version:2,unit:'millimeter',project,...(m?{manufacturing:m}:{}),...(d?{presentation:d}:{})});
test('dirty state follows display toggles without changing model/material bytes',()=>{
 const before=JSON.stringify({project,manufacture});
 for(const m of [null,manufacture]){const get=()=>m;assert.equal(inspectedProjectIsDirty(project,envelope(m),get,'millimeter',()=>null),false);assert.equal(inspectedProjectIsDirty(project,envelope(m),get,'millimeter',()=>inch),true);assert.equal(inspectedProjectIsDirty(project,envelope(m,inch),get,'millimeter',()=>inch),false);assert.equal(inspectedProjectIsDirty(project,envelope(m,inch),get,'millimeter',()=>null),true);assert.equal(inspectedProjectIsDirty(project,envelope(m),get,'millimeter',()=>null),false);}
 assert.equal(JSON.stringify({project,manufacture}),before);
});
test('unknown or malformed display state cannot falsely report a clean file',()=>{
 assert.throws(()=>inspectedProjectIsDirty(project,envelope(null,inch),null,'millimeter'),/unavailable/);
 for(const d of [undefined,false,[],{},{version:1,lengthUnit:'millimeter'},{version:2,lengthUnit:'inch'},{...inch,extra:1},{...inch,[Symbol('extra')]:1}])assert.throws(()=>inspectedProjectIsDirty(project,envelope(),null,'millimeter',()=>d),/unavailable/);
 let reads=0;const d={version:1};Object.defineProperty(d,'lengthUnit',{enumerable:true,get(){reads++;return 'inch';}});assert.throws(()=>inspectedProjectIsDirty(project,envelope(),null,'millimeter',()=>d),/unavailable/);assert.equal(reads,0);
 assert.throws(()=>inspectedProjectIsDirty(project,JSON.stringify({...JSON.parse(envelope()),presentation:null}),null,'millimeter',()=>null),/unavailable/);
});

function fixture(){
 const handlers=new Map(),abort=new AbortController(),s={session:{},current:true,calls:0,revision:'r0',unit:'millimeter'};
 const manager={inspectDisplayUnits(){return {revision:s.revision,canonicalLengthUnit:'millimeter',canonicalAngleUnit:'radian',lengthUnit:s.unit,angleUnit:'degree'};},setDisplayUnits(input,options){assert(Object.isFrozen(input));assert.equal(options.signal,abort.signal);if(input.revision!==s.revision)throw Error('stale revision');if(options.signal.aborted||!options.valid())throw Error('closed');const changed=input.lengthUnit!==s.unit;s.calls++;if(changed){s.unit=input.lengthUnit;s.revision='r'+s.calls;}return {...manager.inspectDisplayUnits(),changed,authoredUndo:false};}};
 const host={signal:abort.signal,session:()=>s.session,commands:{register(d,fn){handlers.set(d.id,fn);return ()=>handlers.delete(d.id);}}};
 return {handlers,abort,s,manager,dispose:registerDisplayUnitCommands(host,()=>({manager,valid:()=>s.current}))};
}
test('inspect/set preserves canonical units and distinguishes stale/no-op',()=>{
 const f=fixture();assert.equal(f.handlers.get('inspect-display-units')({}).lengthUnit,'millimeter');
 const r=f.handlers.get('set-display-units')({revision:'r0',lengthUnit:'inch'});assert.equal(r.changed,true);assert.equal(r.canonicalLengthUnit,'millimeter');assert.equal(r.authoredUndo,false);
 assert.throws(()=>f.handlers.get('set-display-units')({revision:'r0',lengthUnit:'millimeter'}),/stale/);
 const noop=f.handlers.get('set-display-units')({revision:'r1',lengthUnit:'inch'});assert.equal(noop.changed,false);assert.equal(noop.revision,'r1');f.dispose();f.dispose();assert.equal(f.handlers.size,0);
});
test('malformed arguments and accessors never reach core',()=>{
 const f=fixture(),run=f.handlers.get('set-display-units');
 for(const a of [null,[],{},{revision:'r0',lengthUnit:'meter'},{revision:'',lengthUnit:'inch'},{revision:'r0',lengthUnit:'inch',extra:1},{revision:'r0',lengthUnit:'inch',[Symbol('extra')]:1}])assert.throws(()=>run(a));
 let reads=0;const a={revision:'r0'};Object.defineProperty(a,'lengthUnit',{enumerable:true,get(){reads++;return 'inch';}});assert.throws(()=>run(a),/data/);assert.equal(reads,0);assert.equal(f.s.calls,0);assert.throws(()=>f.handlers.get('inspect-display-units')({extra:1}));f.dispose();
});
test('closed hosts and unavailable methods refuse before changing presentation',()=>{
 for(const invalidate of [f=>f.abort.abort(),f=>f.s.current=false,f=>f.s.session=null,f=>delete f.manager.setDisplayUnits]){const f=fixture();invalidate(f);assert.throws(()=>f.handlers.get('set-display-units')({revision:'r0',lengthUnit:'inch'}),/unavailable/);assert.equal(f.s.calls,0);f.dispose();}
});
test('scope loss preserves known commit and registration failure cleans up',()=>{
 for(const changed of [true,false]){const f=fixture();f.manager.setDisplayUnits=()=>{f.s.current=false;return {changed,authoredUndo:false};};assert.throws(()=>f.handlers.get('set-display-units')({revision:'r0',lengthUnit:'inch'}),e=>changed?e.committed===true:e.committed===undefined);f.dispose();}
 let n=0,removed=0;assert.throws(()=>registerDisplayUnitCommands({commands:{register(){if(++n===2)throw Error('register');return ()=>removed++;}}},()=>null),/register/);assert.equal(removed,1);
});
