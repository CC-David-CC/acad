// Native component INPUTS only, not public authoring or sketch-solver evidence.
import fs from 'node:fs';import {pathToFileURL} from 'node:url';import path from 'node:path';
import {prepareOwnedSweep} from '../../modules/engine/mount/ownedSweepPlan.mjs';
const desktop=path.resolve(process.argv[2]),output=process.argv[3],revision=process.argv[4];
const {makeSweepFixture}=await import(pathToFileURL(path.join(desktop,'test/agent-cad-corpus/sweep/cases.mjs')));
const {deriveSweepExpectation,corroborateSweepPath}=await import(pathToFileURL(path.join(desktop,'test/agent-cad-corpus/sweep/oracle.mjs')));
const rows=[];
for(const curved of [false,true])for(const reversed of [false,true])for(const kind of ['circle','annulus','rectangle']){
 const input=makeSweepFixture({kind,curved,reversed,engineRevision:revision}),p=input.profile,s=input.path,xy=v=>[v.x,v.y],objects=new Map(p.sketch.objects.map(o=>[o.id,o]));
 const loop=ids=>ids.map(id=>{const o=objects.get(id);return o.type==='Circle'?{kind:'circle',id,center:xy(o.data.c),radius:o.data.r}:{kind:'segment',id,a:xy(o.data.a),b:xy(o.data.b)};});
 const curves=s.refs.map(ref=>{const o=s.sketch.objects.find(o=>o.id===ref.curveId);return{kind:o.type==='Arc'?'arc':'segment',id:o.id,a:xy(o.data.a),b:xy(o.data.b),...(o.type==='Arc'?{c:xy(o.data.c)}:{}),reversed:ref.reversed};});
 const request={op:'solid.profile.sweep',version:1,unit:'millimeter',source:{faceId:p.faceId,sourceSha256:p.digest},frame:p.frame,region:{id:p.region.regionId,outer:loop(p.region.outerCurveIds),holes:p.region.holeCurveIds.map(loop)},path:{source:{faceId:s.faceId,sourceSha256:s.digest},frame:s.frame,curves},transport:'corrected-frenet'};
 corroborateSweepPath(request,input);const prepared=await prepareOwnedSweep(request);
 rows.push({label:[curved?'quarter':'line',kind,reversed?'reverse':'forward'].join('-'),profile:prepared.nativeValues,path:prepared.nativePathValues,expected:deriveSweepExpectation(input),binding:prepared.binding});
}
fs.writeFileSync(output,JSON.stringify({scope:'Production JS planner to full-main FFI component; fixture source, no solver/public/history qualification',rows},null,2)+'\n');
