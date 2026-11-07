import assert from 'node:assert/strict';
import {test} from 'node:test';
import {Segment} from '../../web/app/sketcher/shapes/segment.ts';
import {HeadlessSketchWorkspace} from '../../web/app/sketcher/headless/workspace.ts';
import {createRigidGroup,poseRigidGroup} from '../../web/app/sketcher/rigid/rigidGroupOperation.js';
import {validateProjectSketch} from '../../web/app/sketcher/io.ts';
function fixture(){
 const viewer=new HeadlessSketchWorkspace({}),layer=viewer.findLayerByName('sketch');viewer.traverse=fn=>viewer.layers.forEach(l=>l.traverseSketchObjects(fn));
 viewer.historyManager={diffs:[],historyPointer:-1,lastCheckpoint:'',_counter:0,_checkpoint(){this.lastCheckpoint=viewer.io.serializeSketch(undefined,{strict:true});}};
 const segs=[new Segment(0,0,100,0,'a'),new Segment(100,0,100,50,'b'),new Segment(100,50,0,50,'c'),new Segment(0,50,0,0,'d')];
 for(const s of segs){layer.add(s);s.stabilize(viewer);}const result=createRigidGroup(viewer,segs);return {viewer,group:viewer.createIndex()[result.id]};
}
test('accepted rigid pose must remain loadable at the world-coordinate boundary',()=>{
 const {viewer,group}=fixture(),before=viewer.io.serializeSketch(undefined,{strict:true});
 try{poseRigidGroup(viewer,group,{x:999950,y:0,angle:0});}catch{assert.equal(viewer.io.serializeSketch(undefined,{strict:true}),before);return;}
 const sketch=JSON.parse(viewer.io.serializeSketch(undefined,{strict:true}));
 assert.doesNotThrow(()=>validateProjectSketch(sketch),'accepted native sketch must pass its own project preflight');
});

test('accepted group creation must remain loadable when valid world coordinates span the local-frame bound',()=>{
 const viewer=new HeadlessSketchWorkspace({}),layer=viewer.findLayerByName('sketch');viewer.traverse=fn=>viewer.layers.forEach(l=>l.traverseSketchObjects(fn));
 viewer.historyManager={diffs:[],historyPointer:-1,lastCheckpoint:'',_counter:0,_checkpoint(){this.lastCheckpoint=viewer.io.serializeSketch(undefined,{strict:true});}};
 const segs=[new Segment(-900000,0,900000,0,'a'),new Segment(0,10,0,20,'b')];for(const s of segs){layer.add(s);s.stabilize(viewer);}
 const before=viewer.io.serializeSketch(undefined,{strict:true});
 try{createRigidGroup(viewer,segs);}catch{assert.equal(viewer.io.serializeSketch(undefined,{strict:true}),before);return;}
 assert.doesNotThrow(()=>viewer.io.serializeSketch(undefined,{strict:true}),'accepted group must serialize');
});

test('out-of-range translation refuses atomically and a nearby accepted pose remains loadable',()=>{
 const {viewer,group}=fixture(),h=viewer.historyManager,before=viewer.io.serializeSketch(undefined,{strict:true});
 const history=JSON.stringify([h.diffs,h.historyPointer,h.lastCheckpoint,h._counter,h.recoverySnapshot??null]);
 assert.throws(()=>poseRigidGroup(viewer,group,{x:999950,y:0,angle:0}));
 assert.equal(viewer.io.serializeSketch(undefined,{strict:true}),before);assert.equal(JSON.stringify([h.diffs,h.historyPointer,h.lastCheckpoint,h._counter,h.recoverySnapshot??null]),history);
 assert.doesNotThrow(()=>validateProjectSketch(JSON.parse(viewer.io.serializeSketch(undefined,{strict:true}))));
 assert.equal(poseRigidGroup(viewer,group,{x:999800,y:0,angle:0}).status,'accepted');
 assert.doesNotThrow(()=>validateProjectSketch(JSON.parse(viewer.io.serializeSketch(undefined,{strict:true}))));
});
test('rotation that crosses the world bound is refused without changing the accepted group',()=>{
 const {viewer,group}=fixture();
 assert.equal(poseRigidGroup(viewer,group,{x:999895,y:0,angle:0}).status,'accepted');
 const before=viewer.io.serializeSketch(undefined,{strict:true});
 assert.throws(()=>poseRigidGroup(viewer,group,{x:999895,y:0,angle:-Math.PI/4}));
 assert.equal(viewer.io.serializeSketch(undefined,{strict:true}),before);
 assert.doesNotThrow(()=>validateProjectSketch(JSON.parse(before)));
});

test('headless sketch solve retains a valid near-bound pose and rejects malformed native world bounds',async()=>{
 const {solveSketch}=await import('../../web/app/sketcher/headless/solve.ts');
 const {viewer,group}=fixture();poseRigidGroup(viewer,group,{x:999800,y:0,angle:0});
 const sketch=JSON.parse(viewer.io.serializeSketch(undefined,{strict:true}));sketch.boundary={lines:[],arcs:[],circles:[],nurbses:[]};
 const request={revision:'near',sketch,boundary:structuredClone(sketch.boundary),externalParameters:{}};
 const good=solveSketch(request);assert.equal(good.ok,true,JSON.stringify(good.error));
 const invalid=structuredClone(sketch),record=invalid.objects.find(o=>o.type==='RigidGroup');record.data.transform.x=999950;
 const bad=solveSketch({...request,sketch:invalid,boundary:structuredClone(sketch.boundary)});assert.equal(bad.ok,false);
});
