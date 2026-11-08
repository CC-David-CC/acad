// Independent whole saved-artifact checker. This does not establish that UI
// gestures occurred; the real complete browser/manual receipt supplies that proof.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {FIXTURE} from './example.mjs';
const one=(rows,label)=>{assert.equal(rows.length,1,'One '+label);return rows[0];};
const withoutAdmission=c=>{const r={...c};delete r.admission;return r;};
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
export function checkDefaultConstraintPrecisionArtifacts(directory,manifest){
 assert.equal(manifest.version,1);const b=manifest.binding;for(const k of['faceId','circleId','centerId','datumId','unrelatedId'])assert.equal(typeof b[k],'string');assert.equal(b.rectangleIds.length,4);assert.equal(new Set([...b.rectangleIds,b.circleId,b.unrelatedId]).size,6);
 const stages=new Map([['before-default',null],['default',2*FIXTURE.radius],['edited',FIXTURE.editedDiameter],['reopened',FIXTURE.editedDiameter],['reedited-second-open',FIXTURE.reeditedDiameter]]);
 assert.deepEqual(manifest.saved.map(r=>r.label),[...stages.keys()]);let baseline=null,history=null,otherModel=null;const results=[];
 for(const row of manifest.saved){
  assert.equal(path.basename(row.file),row.file);assert.match(row.sha256,/^[a-f0-9]{64}$/);const bytes=fs.readFileSync(path.join(directory,row.file));assert.equal(sha(bytes),row.sha256);const n=JSON.parse(bytes);assert.equal(n.format,'codi-jsketcher-project');assert.equal(n.version,2);assert.equal(n.unit,'millimeter');
  const p=n.project,s=one(p.sketches.filter(s=>s.id===b.faceId),'bound saved source').data;assert.equal(p.sketches.length,1);assert.equal(s.version,3);assert.equal(s.objects.length,6);assert.equal(s.stages.length,1);assert.deepEqual(s.stages[0].generators,[]);assert.equal(p.model.history.length,1);assert.equal(p.model.history[0].type,'PLANE');assert.equal(p.model.history[0].params.orientation,'XY');assert.equal(p.model.history[0].params.depth,0);
  const circle=one(s.objects.filter(o=>o.id===b.circleId&&o.type==='Circle'),'authored circle'),free=one(s.objects.filter(o=>o.id===b.unrelatedId&&o.type==='Point'),'unrelated Point');assert.deepEqual(circle.data.c,FIXTURE.center);assert.deepEqual(free.data,FIXTURE.unrelated);
  const constraints=s.stages[0].constraints,d=constraints.filter(c=>c.typeId==='DiameterLength'&&JSON.stringify(c.objects)===JSON.stringify([b.circleId])),want=stages.get(row.label);
  if(want===null){assert.equal(d.length,0);assert.equal(circle.data.r,FIXTURE.radius);}
  else{const c=one(d,'actual diameter');assert.deepEqual(Object.keys(c.constants),['diameter']);assert.equal(c.constants.diameter,String(want),'Full round-trip authored constant, not a display-rounded value');assert.equal(Number(c.constants.diameter),want);assert(['accepted','redundant'].includes(c.admission?.state));assert(Math.abs(2*circle.data.r-want)<=1e-9,'1pm-scoped saved radius consistency (not a BRep accuracy certificate)');}
  for(const [type,value]of[['SignedDistanceX',FIXTURE.center.x],['SignedDistanceY',FIXTURE.center.y]]){const c=one(constraints.filter(c=>c.typeId===type&&JSON.stringify(c.objects)===JSON.stringify([b.datumId,b.centerId])),'real center '+type);assert.equal(Number(c.constants.distance),value);assert(['accepted','redundant'].includes(c.admission?.state));}
  const others=s.objects.filter(o=>o.id!==b.circleId),otherConstraints=constraints.filter(c=>!d.includes(c)).map(withoutAdmission),model=Object.fromEntries(Object.entries(p.model).filter(([k])=>k!=='history'));
  if(!baseline){baseline={others,otherConstraints};history=p.model.history;otherModel=model;}else{assert.deepEqual(others,baseline.others);assert.deepEqual(otherConstraints,baseline.otherConstraints);assert.deepEqual(p.model.history,history);assert.deepEqual(model,otherModel);}
  assert.equal(new Set(s.objects.map(o=>o.id)).size,6);assert.deepEqual(s.objects.filter(o=>o.type==='Segment').map(o=>o.id),b.rectangleIds);for(const c of constraints)assert(['accepted','redundant'].includes(c.admission?.state));results.push({label:row.label,sha256:row.sha256,diameter:want,radius:circle.data.r});
 }
 return{status:'PASS',scope:'Actual saved source identities/default numeric literal/geometry and unrelated intent; not UI gesture, solver completeness or BRep accuracy proof',files:results};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){const file=path.resolve(process.argv[2]||'');const manifest=JSON.parse(fs.readFileSync(file));console.log(JSON.stringify(checkDefaultConstraintPrecisionArtifacts(path.dirname(file),manifest),null,2));}
