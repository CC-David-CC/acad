import '../public-worker-sweep/platform.mjs';
import {installWindow,drain,lifecycle} from '../public-worker-sweep/platform.mjs';
import {createRequire} from 'node:module';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
const api=createRequire(import.meta.url)('../../.build/public-worker-sweep/service/service.cjs');installWindow();const f=api.fixture(''),frame=f.frame;f.close();
async function run(task,rest){const r=await api.runSketchSolve('/static/sketch.js',{task,revision:crypto.randomUUID(),...rest});assert.equal(r.ok,true,JSON.stringify(r.error));return r;}
let r=await run('sketch-transition-empty',{unit:'millimeter',frame});r=await run('sketch-transition-primitive',{sketchJSON:r.serializedSketch,externalParameters:{},primitive:{id:'agent-primitive-'+crypto.randomUUID(),stage:0,kind:'Arc',role:null,data:{a:{x:10,y:0},b:{x:0,y:10},c:{x:0,y:0}}}});
const found=await run('sketch-transition-inspection',{sketchJSON:r.serializedSketch,externalParameters:{}});await drain();assert.equal(lifecycle.started,lifecycle.terminated);assert.equal(found.objects.length,1);assert.equal(found.objects[0].type,'Arc');assert.equal(found.points.length,0);
console.log(JSON.stringify({status:'CONFIRMED_MISSING_ARC_POINT_DISCOVERY',scope:'Actual production sketch Worker primitive and inspection; no native solid/app claim',sourceSHA256:createHash('sha256').update(readFileSync('web/app/sketcher/headless/closedSketchInspection.ts')).digest('hex'),object:found.objects[0],points:found.points,workerLifecycle:lifecycle},null,2));
