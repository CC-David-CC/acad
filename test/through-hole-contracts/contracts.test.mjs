// Pure host metadata/accounting tests. Mount stubs never evaluate geometry.
import test from 'node:test';
import assert from 'node:assert/strict';
import {CAD_ENGINES,DEFAULT_CAD_ENGINE,OCC_SELECTED_PROFILE_BUILD as v2,OCC_POLYGON_PROFILE_BUILD as v3,OCC_MECHANICAL_PROFILE_BUILD as mechanical,OCC_BOOLEAN_HISTORY_BUILD as build,requireCadEngineBuild,validateEngineMount} from '../../modules/engine/mount/engineCatalog.mjs';
import {selectedProfileHistoryBudget as budget} from '../../modules/engine/mount/selectedProfileBudget.mjs';
import {genericHistoryBuild,selectSelectedProfileHistoryBuild} from '../../modules/engine/mount/selectedProfileBuildSelection.mjs';
import {captureOwnedHoleIntent} from '../../modules/engine/solid/ownedHoleIntent.mjs';
import {solidBodyId} from '../../modules/engine/solid/solidIntent.mjs';

const OP='WORKER_THROUGH_HOLES_V1';
const binding=()=>({id:'solid.holes.through',version:1,kinds:['centered-through','four-corner-through'],source:'selected-rectangle',termination:'through-all',nativeResultCost:{'centered-through':2,'four-corner-through':8}});
const stub=spec=>({ready:Promise.resolve(),execute(){throw Error('No geometry');},close(){},readSolidMesh(){throw Error('No geometry');},assertSolidBinding(){throw Error('No geometry');},descriptor:{contractVersion:1,engine:spec.mountEngine,representation:spec.representation,unit:'millimeter',runtimeAssets:{...spec.runtimeAssets},operations:[
 ...['solid.box.create','solid.boolean.common','solid.boolean.union','solid.boolean.subtract','solid.mesh.read','solid.dispose'].map(id=>({id,version:1,...(id.startsWith('solid.boolean.')?{input:spec===build?'oci-boolean-history-mm-v1':'oci-boolean-mm-v1'}:{})})),
 ...(spec===v2?[{id:'solid.profile.extrude',version:2}]:[]),
 ...([v3,mechanical,build].includes(spec)?[{id:'solid.profile.extrude',version:3}]:[]),
 ...([mechanical,build].includes(spec)?[{id:'solid.edge.treat',version:1}]:[]),
 ...(spec===build?[{id:'solid.selections.read',version:1,selectionPlanVersion:2},{id:'solid.holes.pattern.linear',version:1},binding()]:[])
]}});
const validate=operation=>{const m=stub(build);m.descriptor.operations[m.descriptor.operations.length-1]=operation;return validateEngineMount('occ',m,build.revision);};
const intent=(kind='centered-through')=>({version:1,unit:'millimeter',engine:'occ',engineRevision:build.revision,featureId:30,target:solidBodyId(20),producerFeatureId:20,sourceFeatureId:10,sourceFaceId:'1/SURFACE',sourceRegionId:'actual-rectangle-region',kind,diameter:4,...(kind==='four-corner-through'?{offsetX:10,offsetY:10}:{})});
const entry=(kind='centered-through',spec=build)=>({type:OP,params:{...intent(kind),engine:spec.id,engineRevision:spec.revision}});
const ordinary=(type='WORKER_SOLID_BOX_V1',spec=build)=>({type,params:{engine:spec.id,engineRevision:spec.revision}});
const invalid=fn=>assert.throws(fn,{code:'INVALID_REQUEST'});

test('explicit capability adds no new runtime revision or historical/default identity',()=>{
 assert.equal(build.throughHoleVersion,1);assert(Object.isFrozen(build));
 assert.equal(build.revision,'sha256:dd666902fe926d69cc3c8843f5568c2a3e569f38ff49291baa2f248165b5ea99:8d5e537e0d7f9e12b8ae0eaf239c0be1080934ed12a24bf6e7f849c9135ed5a2');
 assert.equal(requireCadEngineBuild('occ',build.revision),build);
 assert.equal(DEFAULT_CAD_ENGINE,'occ');assert.equal(requireCadEngineBuild('occ'),CAD_ENGINES.occ);
 assert.equal(selectSelectedProfileHistoryBuild([]),build);
 for(const spec of [...Object.values(CAD_ENGINES),v2,v3,mechanical]){assert.equal(spec.throughHoleVersion,undefined);const m=stub(spec);assert.equal(validateEngineMount(spec.id,m,spec.revision),m);}
});
test('complete exact metadata binds both kinds independent of array order',()=>{
 assert(validate(binding()));const reverse=binding();reverse.kinds.reverse();assert(validate(reverse));
 const nullCost=binding();nullCost.nativeResultCost=Object.assign(Object.create(null),nullCost.nativeResultCost);assert(validate(nullCost));
});
test('missing capability and wrong version/source/termination reject',()=>{
 const m=stub(build);m.descriptor.operations.pop();assert.throws(()=>validateEngineMount('occ',m,build.revision),{code:'UNBOUND_OPERATION'});
 for(const [key,values] of Object.entries({version:[undefined,2,'1'],source:[undefined,'rectangle','selected-profile'],termination:[undefined,'blind','through-all ']}))for(const value of values){const op=binding();op[key]=value;assert.throws(()=>validate(op),{code:'UNBOUND_OPERATION'});}
});
test('kinds must be exact bounded dense own primitive data',()=>{
 for(const kinds of [undefined,['centered-through'],['four-corner-through','four-corner-through'],['centered-through','four-corner-through','other'],['centered-through',new String('four-corner-through')],[,'four-corner-through'],Object.assign(['centered-through','four-corner-through'],{extra:true})]){const op=binding();op.kinds=kinds;assert.throws(()=>validate(op),{code:'UNBOUND_OPERATION'});}
 let reads=0;const kinds=['centered-through','four-corner-through'];Object.defineProperty(kinds,'0',{enumerable:true,get(){reads++;return 'centered-through';}});assert.throws(()=>validate({...binding(),kinds}),{code:'UNBOUND_OPERATION'});assert.equal(reads,0);
});
test('cost map must be exact own numeric 2/8 data without accessor invocation',()=>{
 for(const cost of [undefined,{'centered-through':1,'four-corner-through':8},{'centered-through':2,'four-corner-through':4},{'centered-through':'2','four-corner-through':8},{'centered-through':2,'four-corner-through':8,extra:0},Object.create({'centered-through':2,'four-corner-through':8}),[2,8]])assert.throws(()=>validate({...binding(),nativeResultCost:cost}),{code:'UNBOUND_OPERATION'});
 let reads=0;for(const key of ['source','termination','nativeResultCost','kinds']){const op=binding();Object.defineProperty(op,key,{enumerable:true,get(){reads++;throw Error('read');}});assert.throws(()=>validate(op),{code:'UNBOUND_OPERATION'});}
 const cost={'four-corner-through':8};Object.defineProperty(cost,'centered-through',{enumerable:true,get(){reads++;return 2;}});assert.throws(()=>validate({...binding(),nativeResultCost:cost}),{code:'UNBOUND_OPERATION'});assert.equal(reads,0);
});
test('authored forms remain detached exact 12/14 fields, without runtime handles or tool depth',()=>{
 for(const kind of ['centered-through','four-corner-through']){const raw=intent(kind),captured=captureOwnedHoleIntent(raw);assert.equal(Object.keys(captured).length,kind==='centered-through'?12:14);assert.notEqual(captured,raw);assert(Object.isFrozen(captured));assert.deepEqual(captured,raw);for(const key of ['handle','sourceHandle','depth','toolProfiles','producerId'])invalid(()=>captureOwnedHoleIntent({...raw,[key]:'forbidden'}));}
});
test('center costs two names; four corners cost eight including consumed intermediates',()=>{
 assert.equal(budget([entry()],build.revision).plannedNativeResults,2);assert.equal(budget([entry('four-corner-through')],build.revision).plannedNativeResults,8);
 const result=budget([ordinary('WORKER_SELECTED_PROFILE_EXTRUDE_V2'),entry(),entry('four-corner-through'),ordinary('WORKER_SOLID_EDGE_TREATMENT_V1')],build.revision);
 assert.equal(result.plannedNativeResults,12);assert.equal(result.remainingNativeResults,20);assert.equal(result.canAppend,true);assert(Object.isFrozen(result));
});
test('32-name inclusive replay boundary is exact, with generic append flag distinct from operation cost',()=>{
 const full=budget(Array.from({length:4},()=>entry('four-corner-through')),build.revision);assert.equal(full.plannedNativeResults,32);assert.equal(full.withinLimit,true);assert.equal(full.canAppend,false);
 const over=budget([...Array.from({length:4},()=>entry('four-corner-through')),entry()],build.revision);assert.equal(over.plannedNativeResults,34);assert.equal(over.reason,'RESOURCE_LIMIT');assert.equal(over.canAppend,false);
 for(const n of [30,31]){const history=Array.from({length:n},()=>ordinary());assert.equal(budget(history,build.revision).canAppend,true);const next=budget([...history,entry()],build.revision);assert.equal(next.plannedNativeResults,n+2);assert.equal(next.withinLimit,n===30);}
});
test('kind accounting refuses missing/inherited/nonenumerable/accessor/nonprimitive values',()=>{
 let reads=0;
 for(const make of [p=>{delete p.kind;},p=>{delete p.kind;Object.setPrototypeOf(p,{kind:'centered-through'});},p=>Object.defineProperty(p,'kind',{value:'centered-through',enumerable:false}),p=>Object.defineProperty(p,'kind',{enumerable:true,get(){reads++;return 'centered-through';}}),...['centered','FOUR',null,{},new String('centered-through')].map(value=>p=>{p.kind=value;})]){const h=entry();make(h.params);invalid(()=>budget([h],build.revision));}
 assert.equal(reads,0);
});
test('existing generic costs and separate mounts stay unchanged; incompatible identities explicit',()=>{
 const ordinaryTypes=['WORKER_SELECTED_PROFILE_EXTRUDE_V2','WORKER_SOLID_BOX_V1','WORKER_SOLID_BOOLEAN_V1','WORKER_SOLID_EDGE_TREATMENT_V1'];assert.equal(budget(ordinaryTypes.map(t=>ordinary(t)),build.revision).plannedNativeResults,4);
 const legacy=['WORKER_RECTANGLE_EXTRUDE_V1','WORKER_CENTERED_THROUGH_HOLE_V1','WORKER_FOUR_CORNER_THROUGH_HOLES_V1','WORKER_ENCLOSURE_V1','WORKER_ENCLOSURE_V2'].map(type=>({type}));const r=budget([...legacy,entry()],build.revision);assert.equal(r.plannedNativeResults,2);assert.equal(r.separateMountFeatures,5);
 for(const h of [entry('centered-through',mechanical),{type:OP,params:{...intent(),engine:'manifold'}}]){const r=budget([h],build.revision);assert.equal(r.reason,'INCOMPATIBLE_ENGINE_BUILD');assert.equal(r.plannedNativeResults,null);assert.equal(r.canAppend,false);}
});
test('holes own whole-part backend identity with no implicit mixed-build fallback',()=>{
 assert.equal(genericHistoryBuild([entry()]),build);assert.equal(genericHistoryBuild([ordinary(),entry(),ordinary('WORKER_SOLID_BOOLEAN_V1')]),build);
 for(const old of [v2,v3,mechanical]){assert.equal(genericHistoryBuild([entry('centered-through',old)]),old);assert.equal(selectSelectedProfileHistoryBuild([entry('centered-through',old)]),old);assert.throws(()=>genericHistoryBuild([ordinary('WORKER_SELECTED_PROFILE_EXTRUDE_V2',old),entry()]),{code:'ENGINE_REVISION_MISMATCH'});}
 // Choosing an old recorded build is retention, not permission to execute holes there.
});
test('bounded dense history and backend data remain getter-free',()=>{
 invalid(()=>budget([,entry()],build.revision));invalid(()=>budget(Array.from({length:257},()=>entry()),build.revision));
 invalid(()=>genericHistoryBuild([,entry()]));let reads=0;const h=entry();Object.defineProperty(h.params,'engineRevision',{enumerable:true,get(){reads++;return build.revision;}});invalid(()=>budget([h],build.revision));invalid(()=>genericHistoryBuild([h]));assert.equal(reads,0);
});
