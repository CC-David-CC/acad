import assert from 'node:assert/strict';
import {test} from 'node:test';
import {state} from 'lstream';
import {MWorkerEnclosureBody} from '../../web/app/cad/model/mworkerEnclosure.ts';
import {WorkerEnclosureView} from '../../web/app/cad/scene/views/workerEnclosureView.js';
import {assertLegacyGeometry,assertLegacyCommandName} from '../../web/app/cad/model/workerGeometry.ts';
const tetra=()=>new Float64Array([0,0,0,0,1,0,1,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,1,0,1,0,1,0,0,0,1,0,0,0,1]);
test('engine provenance stays distinct while authored role identity remains stable',()=>{
 const occ=new MWorkerEnclosureBody(4,'BODY',tetra(),'occ'),mesh=new MWorkerEnclosureBody(4,'BODY',tetra(),'manifold');
 assert.equal(occ.id,mesh.id);assert.equal(mesh.ext.workerGeometry.engine,'manifold');
 assert.equal(mesh.ext.workerGeometry.representation,'worker-owned-manifold-enclosure');
 assert.equal(occ.ext.workerGeometry.representation,'worker-owned-occ-enclosure');
 assert.equal(Object.isFrozen(mesh.ext.workerGeometry),true);
 assert.throws(()=>assertLegacyGeometry(mesh,'cut'));
 assert.throws(()=>new MWorkerEnclosureBody(4,'BODY',tetra(),'unknown'),/Unsupported/);
});
test('authored roles distinguish outputs across display changes',()=>{
 const source=tetra(),a=new MWorkerEnclosureBody(4,'BODY',source),b=new MWorkerEnclosureBody(4,'LID',source),scaled=new MWorkerEnclosureBody(4,'BODY',source.map(v=>v*2));
 assert.notEqual(a.id,b.id);assert.equal(a.id,scaled.id);assert.equal(a.faces.length,0);assert.equal(a.edges.length,0);
 source.fill(99);a.copyDisplayPositions().fill(12);assert.equal(a.copyDisplayPositions()[0],0);
 assert.throws(()=>assertLegacyGeometry(a,'cut'));assert.throws(()=>assertLegacyCommandName(a.id,'cut'));assert.equal(a.ext.workerGeometry.quality,'display-only');
});
test('invalid or collapsed display geometry refuses',()=>{
 assert.throws(()=>new MWorkerEnclosureBody(0,'BODY',tetra()));assert.throws(()=>new MWorkerEnclosureBody(1,'OTHER',tetra()));
 assert.throws(()=>new MWorkerEnclosureBody(1,'BODY',new Float64Array(513*9)));
 const nonfinite=tetra();nonfinite[0]=NaN;assert.throws(()=>new MWorkerEnclosureBody(1,'BODY',nonfinite));
 assert.throws(()=>new MWorkerEnclosureBody(1,'BODY',tetra().map(v=>1e6+v*0.001)),/precision/);
});
test('display resources and subscriptions release on repeated disposal',()=>{
 const model=new MWorkerEnclosureBody(5,'BODY',tetra()),attributes=state({hidden:false,color:0x112233});let renders=0;
 const ctx={attributesService:{streams:{get:()=>attributes}},viewer:{requestRender(){renders++}}};
 const view=new WorkerEnclosureView(ctx,model);let geometries=0,materials=0;
 view.geometry.addEventListener('dispose',()=>geometries++);view.material.addEventListener('dispose',()=>materials++);
 assert.equal(view.geometry.attributes.position.count,12);view.dispose();view.dispose();const stopped=renders;
 model.location$.next(model.location);attributes.next({hidden:true,color:0xffffff});
 assert.equal(renders,stopped);assert.equal(geometries,1);assert.equal(materials,1);assert.equal(model.ext.view,null);
});
test("versioned label identity is explicit and legacy label is refused",()=>{
 const label=new MWorkerEnclosureBody(4,"LABEL",tetra(),"occ",2),body=new MWorkerEnclosureBody(4,"BODY",tetra(),"occ",2);
 assert.equal(label.id,"worker-enclosure:2:"+JSON.stringify([4,"LABEL"]));
 assert.equal(body.id,"worker-enclosure:2:"+JSON.stringify([4,"BODY"]));
 assert.equal(label.ext.workerGeometry.version,2);assert.equal(label.faces.length,0);
 assert.throws(()=>new MWorkerEnclosureBody(4,"LABEL",tetra(),"occ",1));
 assert.throws(()=>new MWorkerEnclosureBody(4,"BODY",tetra(),"occ",3));
});
