// Actual formatting methods without a canvas/DOM. This does not qualify paint,
// visual layout or native selectable-edge availability in the combined app.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {fixture} from './manager-fixture.mjs';
globalThis.self=globalThis;globalThis.importScripts=()=>{throw Error('Unexpected code import');};vm.runInThisContext(readFileSync(new URL('../../web/lib/verb.js',import.meta.url),'utf8'));
const real=createRequire(import.meta.url)('../../.build/display-units/formatting/formatting.cjs');
const set=(f,lengthUnit)=>f.manager.setDisplayUnits({revision:f.manager.inspectDisplayUnits().revision,lengthUnit});
test('actual linear/radius/diameter methods use the document formatter and preserve source data',async()=>{
 const f=fixture(),viewer={applicationContext:{projectManager:f.manager}};try{
  const annotation=Object.create(real.DiameterLengthAnnotation.prototype);annotation.angle=Math.PI/4;const saved=annotation.save();
  assert.equal(real.LinearDimension.prototype.dimensionText(25.4,viewer),'25.40 mm');set(f,'inch');assert.equal(real.LinearDimension.prototype.dimensionText(25.4,viewer),'1.00 in');assert.equal(real.DiameterDimension.prototype.dimensionText(25.4,viewer),'R 1.00 in');assert.equal(annotation.dimensionText(12.7,viewer),'Ø 1.00 in');assert.deepEqual(annotation.save(),saved);assert.equal(f.manager.unit,'millimeter');
 }finally{await f.close();}
});
test('actual signed/projected annotation methods preserve prefixes, signs and undefined domain',async()=>{
 const f=fixture(),viewer={applicationContext:{projectManager:f.manager}};try{set(f,'inch');const x=Object.create(real.SignedXAnnotation.prototype),y=Object.create(real.SignedYAnnotation.prototype),p=Object.create(real.ProjectedDistanceAnnotation.prototype);for(const a of [x,y,p])Object.assign(a,{a:{x:0,y:0},b:{x:25.4,y:-50.8},offset:17});p.direction={a:{x:0,y:0},b:{x:1,y:0}};const before=JSON.stringify([x.a,x.b,x.save(),y.save(),p.save()]);assert.equal(x.dimensionText(undefined,viewer),'ΔX 1.00 in');assert.equal(y.dimensionText(undefined,viewer),'ΔY -2.00 in');assert.equal(p.dimensionText(undefined,viewer),'P 1.00 in');assert.equal(JSON.stringify([x.a,x.b,x.save(),y.save(),p.save()]),before);p.direction.b.x=0;assert.equal(p.dimensionText(undefined,viewer),'P undefined');}finally{await f.close();}
});
test('actual shared angle formatting stays degrees across mm/inch documents',async()=>{
 const f=fixture(),viewer={applicationContext:{projectManager:f.manager}};try{const before=real.formatDimensionValue(Math.PI/2,'angle',viewer);set(f,'inch');assert.equal(real.formatDimensionValue(Math.PI/2,'angle',viewer),before);assert.equal(before,'90.00°');assert.equal(real.formatDimensionValue(25.4,'length',null),'25.40 mm');}finally{await f.close();}
});
test('real measurement formatter converts all coordinates/deltas/chord while canonical API stays unchanged',async()=>{
 const f=fixture();try{const edge={brepEdge:{halfEdge1:{vertexA:{point:{x:25.4,y:50.8,z:76.2}},vertexB:{point:{x:101.6,y:152.4,z:76.2}}}},shell:{location:{apply3:p=>p}}},measured=real.measureEdgeEndpoints(edge),before=JSON.stringify(measured);assert(Math.abs(measured.distance-127)<1e-10);set(f,'inch');const text=real.formatEdgeMeasurement(measured,v=>f.manager.formatDisplayQuantity(v,'length'));assert.match(text,/displayed in inch \(canonical model: millimeter\)/);assert.match(text,/Start: 1, 2, 3/);assert.match(text,/End: 4, 6, 3/);assert.match(text,/Change \(end − start\): 3, 4, 0/);assert.match(text,/distance: 5 inch/);assert.match(text,/chord distance/);assert.equal(JSON.stringify(measured),before);assert.equal(f.workers.geometry,0);}finally{await f.close();}
});
