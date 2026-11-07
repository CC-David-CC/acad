import assert from 'node:assert/strict';
import {test} from 'node:test';
import {AlgNumConstraint,ConstraintDefinitions} from '../../web/app/sketcher/constr/ANConstraints.ts';
import {ParametricManager} from '../../web/app/sketcher/parametric.ts';
import {Circle} from '../../web/app/sketcher/shapes/circle.js';
import {Arc} from '../../web/app/sketcher/shapes/arc.ts';
import {addDiameter,inspectDiameterTargets,addDiameterByIdAtRevision} from '../../web/app/sketcher/actions/diameterOperation.js';
import {matchAvailableActions} from '../../web/app/sketcher/actions/index.js';
function fixture(){const viewer={layers:[],dimLayers:[],io:{serializeSketch(){return JSON.stringify(viewer.items.map(o=>[o.id,o.r.get()]))}},screenToModel2(x,y,p){p.x=x;p.y=y},annotationLayer:{add(a){a.layer=this},remove(a){a.layer=null}},historyManager:{diffs:[],historyPointer:-1,lastCheckpoint:null,_counter:0,_checkpoint(){this.lastCheckpoint=viewer.io.serializeSketch(undefined,{strict:true})}},refresh(){},traverse(fn){this.items.forEach(fn)}};viewer.parametricManager=new ParametricManager(viewer);const c=new Circle(2,3,5,'circle'),a=new Arc(11,0,10,1,10,0,'arc');for(const x of [c,a]){viewer.parametricManager.stage.assignObject(x);}viewer.items=[c,a];return {viewer,c,a};}
test('circle and arc expose only single-object diameter action',()=>{const {c,a}=fixture(),ids=x=>matchAvailableActions(x).map(a=>a.id);assert.ok(ids([c]).includes('DiameterLength'));assert.ok(ids([a]).includes('DiameterLength'));assert.ok(!ids([c,a]).includes('DiameterLength'));});
test('diameter drives two radii without changing authored diameter intent',()=>{for(const name of ['c','a']){const f=fixture(),obj=f[name];const result=addDiameter(f.viewer,obj,12);assert.equal(result.status,'accepted');assert.ok(Math.abs(obj.r.get()-6)<1e-6);const relation=obj.stage.algNumSystem.allConstraints.find(c=>c.schema.id==='DiameterLength');assert.equal(relation.constants.diameter,12);assert.equal(relation.write().typeId,'DiameterLength');}});
test('invalid and conflicting diameter are atomic; redundancy remains removable',()=>{const {viewer,c}=fixture(),sys=c.stage.algNumSystem;assert.throws(()=>addDiameter(viewer,c,0));assert.throws(()=>addDiameter(viewer,c,Infinity));assert.equal(sys.allConstraints.length,0);assert.equal(addDiameter(viewer,c,10).status,'accepted');const before=c.r.get(),old=sys.allConstraints[0];assert.throws(()=>addDiameter(viewer,c,12),/conflict/i);assert.equal(sys.allConstraints.length,1);assert.equal(sys.allConstraints[0],old);assert.equal(c.r.get(),before);assert.equal(addDiameter(viewer,c,10).status,'redundant');const duplicate=sys.allConstraints[1];sys.removeConstraint(old);assert.equal(sys.isConflicting(duplicate),false);assert.ok(Math.abs(c.r.get()-5)<1e-6);});
test('agent revision binds exact objects, rejects stale and cancelled state',async()=>{const {viewer,c}=fixture();let view=await inspectDiameterTargets(viewer);assert.ok(view.objects.some(o=>o.id===c.id));assert.equal((await addDiameterByIdAtRevision(viewer,c.id,12,view.revision)).status,'accepted');await assert.rejects(addDiameterByIdAtRevision(viewer,c.id,12,view.revision));view=await inspectDiameterTargets(viewer);await assert.rejects(addDiameterByIdAtRevision(viewer,c.id,12,view.revision,{valid:()=>false}));});
test('headless native sketch regeneration preserves driving diameter for circles and arcs',async()=>{
 const {solveSketch}=await import('../../web/app/sketcher/headless/solve.ts');
 const boundary={lines:[],arcs:[],circles:[],nurbses:[]};
 for(const object of [{id:'c',type:'Circle',role:null,stage:0,data:{c:{x:0,y:0},r:5}},{id:'a',type:'Arc',role:null,stage:0,data:{a:{x:5,y:0},b:{x:0,y:5},c:{x:0,y:0}}}]){
  const sketch={version:3,objects:[object],dimensions:[],labels:[],stages:[{constraints:[{typeId:'DiameterLength',objects:[object.id],constants:{diameter:'12'},stage:0,annotations:[{angle:0.7853981633974483}],admission:{version:1,state:'accepted'}}],generators:[]}],constants:'',metadata:{},boundary};
  const result=solveSketch({revision:'r',sketch,boundary:structuredClone(boundary),externalParameters:{}});assert.equal(result.ok,true,JSON.stringify(result));
  const saved=result.sketch.stages[0].constraints.find(c=>c.typeId==='DiameterLength');assert.equal(saved.constants.diameter,'12');
  const geometry=result.sketch.objects[0].data,radius=object.type==='Circle'?geometry.r:Math.hypot(geometry.a.x-geometry.c.x,geometry.a.y-geometry.c.y);assert.ok(Math.abs(radius-6)<1e-6);
 }
});
test('named diameter remains authored and failed admission restores undo metadata',()=>{
 const {viewer,c}=fixture(),pm=viewer.parametricManager;pm.constantTable.D=12;
 assert.equal(addDiameter(viewer,c,'D').status,'accepted');assert.equal(c.stage.algNumSystem.allConstraints[0].constants.diameter,'D');assert.ok(Math.abs(c.r.get()-6)<1e-6);
 const h=viewer.historyManager;Object.assign(h,{diffs:[{forward:'old'}],historyPointer:0,lastCheckpoint:'before',_counter:7});h._checkpoint=()=>{h.diffs.push({forward:'candidate'});h.historyPointer=1;h.lastCheckpoint=viewer.io.serializeSketch(undefined,{strict:true});h._counter=0};
 assert.throws(()=>addDiameter(viewer,c,14),/conflict/i);assert.deepEqual(h.diffs,[{forward:'old'}]);assert.equal(h.historyPointer,0);assert.equal(h.lastCheckpoint,'before');assert.equal(h._counter,7);
});
test('agent refuses replacement objects with identical serialized data',async()=>{
 const {viewer,c}=fixture(),view=await inspectDiameterTargets(viewer),replacement=new Circle(c.c.x,c.c.y,c.r.get(),c.id);
 replacement.stage=c.stage;viewer.items[0]=replacement;
 await assert.rejects(addDiameterByIdAtRevision(viewer,c.id,12,view.revision),/changed/);
 assert.equal(c.stage.algNumSystem.allConstraints.length,0);
});
test('diameter inspection rejects radius ABA even if serialized values return',async()=>{
 const {viewer,c}=fixture(),view=await inspectDiameterTargets(viewer);c.r.set(6);c.r.set(5);
 await assert.rejects(addDiameterByIdAtRevision(viewer,c.id,12,view.revision),/changed/);
 assert.equal(c.stage.algNumSystem.allConstraints.length,0);assert.equal(c.r.get(),5);
});
test('reentrant lifetime callback cannot change geometry before diameter publication',async()=>{
 const {viewer,c}=fixture(),view=await inspectDiameterTargets(viewer);let calls=0;
 await assert.rejects(addDiameterByIdAtRevision(viewer,c.id,12,view.revision,{valid(){if(++calls===2)c.r.set(7);return true}}),/changed/);
 assert.equal(c.r.get(),7);assert.equal(c.stage.algNumSystem.allConstraints.length,0);
});
test('failed rollback marks the previous checkpoint for explicit recovery',()=>{
 const {viewer,c}=fixture(),pm=viewer.parametricManager,prior=viewer.io.serializeSketch(),finish=pm.finishTransaction;
 pm.finishTransaction=()=>{throw Error('injected rollback failure')};
 try{assert.throws(()=>addDiameter(viewer,c,12),/previous sketch is held for recovery/i);assert.equal(viewer.historyManager.recoverySnapshot,prior);}
 finally{pm.finishTransaction=finish;if(pm.inTransaction)try{pm.finishTransaction(()=>{throw Error('test cleanup')})}catch{}}
});
test('typed diameter accepts a length name and rejects an angle atomically',async()=>{
 const {bindSketchConstants}=await import('../../web/app/cad/sketch/sketchConstantResolver.js');
 const {viewer,c}=fixture();const expressions={isTyped:true,hasCurrentPhysicalResult:()=>true,resolveQuantity(name,dimension){const values={D:{dimension:'length',value:12},angle:{dimension:'angle',value:1.2}},item=values[name];if(!item||item.dimension!==dimension)throw Error('dimension mismatch');return item.value;}};
 bindSketchConstants(viewer,expressions);const old=viewer.io.serializeSketch(),history=viewer.historyManager.diffs.slice();
 assert.throws(()=>addDiameter(viewer,c,'angle'),/dimension/);assert.equal(viewer.io.serializeSketch(),old);assert.deepEqual(viewer.historyManager.diffs,history);assert.equal(c.stage.algNumSystem.allConstraints.length,0);
 assert.equal(addDiameter(viewer,c,'D').status,'accepted');assert.equal(c.stage.algNumSystem.allConstraints[0].constants.diameter,'D');assert.ok(Math.abs(c.r.get()-6)<1e-6);
});
