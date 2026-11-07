import assert from 'node:assert/strict';
import {test} from 'node:test';
import {IO} from '../../web/app/sketcher/io.ts';
import {HistoryManager} from '../../web/app/sketcher/history.js';
import {AlgNumSubSystem} from '../../web/app/sketcher/constr/AlgNumSystem.ts';
import {Param} from '../../web/app/sketcher/shapes/param.ts';
import {readFileSync} from 'node:fs';
import {runInThisContext} from 'node:vm';
runInThisContext(readFileSync('web/lib/diff_match_patch.js','utf8'));
global.window={diff_match_patch:global.diff_match_patch};
function fixture(){
 let p,sys;
 const viewer={layers:[],dimLayers:[],dimLayer:{objects:[]},labelLayer:{objects:[]},createGroundObjects(){},deselectAll(){},fullHeavyUIRefresh(){},findLayerByName(){return {add(){}}},createIndex(){return {p}}};
 const stage={index:0,objects:[],generators:[],assignObject(){},addConstraint(c){c.stage=stage;sys.addConstraint(c)}};
 const pm=viewer.parametricManager={stages:[stage],stage,constantDefinition:'',getStageIndex(){return 0},accommodateStages(){},getStage(){return stage},startTransaction(){sys.startTransaction()},finishTransaction(){sys.finishTransaction()},notify(){},$constantDefinition:{next(){}}};
 function reset(){p={stage,id:'p',constraints:new Set(),x:new Param(0),y:new Param(0),visitParams(cb){cb(this.x);cb(this.y)}};sys=new AlgNumSubSystem(()=>100,v=>v,stage);stage.algNumSystem=sys;}
 reset();const io=viewer.io=new IO(viewer);io.cleanUpData=reset;
 return {viewer,io,get point(){return p},get system(){return sys}};
}
const row=(x,y,admission)=>({typeId:'LockPoint',objects:['p'],constants:{x:String(x),y:String(y)},stage:0,annotations:[],...(admission?{admission}: {})});
const sketch=rows=>JSON.stringify({version:3,objects:[],dimensions:[],labels:[],stages:[{constraints:rows,generators:[]}],constants:''});
test('strict and regular IO restore stored admission priority without changing authored order',()=>{
 const text=sketch([row(3,0,{version:1,state:'rejected'}),row(0,1,{version:1,state:'accepted'})]);
 for(const strict of [false,true]){const f=fixture();f.io.loadSketch(text,{strict});assert.equal(f.point.x.get(),0);assert.equal(f.point.y.get(),1);assert.equal(f.system.isConflicting(f.system.allConstraints[0]),true);const saved=JSON.parse(f.io.serializeSketch(undefined,{strict}));assert.deepEqual(saved.stages[0].constraints.map(c=>c.admission.state),['rejected','accepted']);}
});
test('legacy snapshots without hints load and strict history restore tolerates only new hints',()=>{
 const legacy=sketch([row(0,1)]),f=fixture();f.io.loadSketch(legacy,{strict:true});const h=new HistoryManager(f.viewer);h.init(f.io.serializeSketch(undefined,{strict:true}));h.restoreChecked(legacy);assert.equal(f.point.y.get(),1);
 const tampered=sketch([row(0,1,{version:1,state:'rejected'})]);assert.throws(()=>h.restoreChecked(tampered),/previous sketch was restored/);assert.equal(f.point.y.get(),1);
});
test('bad hint is rejected before destructive cleanup in strict and regular IO',()=>{
 for(const strict of [false,true])for(const admission of [{version:9,state:'accepted'},{version:1,state:'invalid'},{version:1,state:'accepted',extra:true},null,[]]){const f=fixture();f.point.x.set(42);const record=row(0,1);record.admission=admission;const bad=sketch([record]);assert.throws(()=>f.io.loadSketch(bad,{strict}),/Invalid constraint admission hint/);assert.equal(f.point.x.get(),42)}
});
test('undo and redo preserve the selected priority and authored order',()=>{
 const f=fixture(),first=sketch([row(3,0,{version:1,state:'rejected'}),row(0,1,{version:1,state:'accepted'})]);
 const second=sketch([row(3,0,{version:1,state:'accepted'})]);
 f.io.loadSketch(first,{strict:true});const h=new HistoryManager(f.viewer);h.init(f.io.serializeSketch(undefined,{strict:true}));
 f.io.loadSketch(second,{strict:true});h._checkpoint();assert.equal(f.point.x.get(),3);
 h.undo();assert.equal(f.point.x.get(),0);assert.equal(f.point.y.get(),1);assert.equal(f.system.isConflicting(f.system.allConstraints[0]),true);
 h.redo();assert.equal(f.point.x.get(),3);assert.equal(f.point.y.get(),0);
});
test('well-formed forged hints never bypass actual constraint solving',()=>{
 const f=fixture(),forged=sketch([row(3,0,{version:1,state:'accepted'}),row(0,1,{version:1,state:'accepted'})]);
 f.io.loadSketch(forged,{strict:true});assert.equal(f.system.isConflicting(f.system.allConstraints[1]),true);
 const states=JSON.parse(f.io.serializeSketch(undefined,{strict:true})).stages[0].constraints.map(x=>x.admission.state);
 assert.deepEqual(states,['accepted','rejected']);
});
test('mixed legacy and hinted rows give verified accepted hints priority',()=>{
 const f=fixture(),text=sketch([row(3,0),row(0,1,{version:1,state:'accepted'})]);f.io.loadSketch(text,{strict:true});
 assert.equal(f.point.x.get(),0);assert.equal(f.point.y.get(),1);assert.equal(f.system.isConflicting(f.system.allConstraints[0]),true);
});
test('swapped valid hints change replay priority but do not bypass solving',()=>{
 const f=fixture(),text=sketch([row(3,0,{version:1,state:'accepted'}),row(0,1,{version:1,state:'rejected'})]);f.io.loadSketch(text,{strict:true});
 assert.equal(f.point.x.get(),3);assert.equal(f.point.y.get(),0);assert.equal(f.system.isConflicting(f.system.allConstraints[1]),true);
});
