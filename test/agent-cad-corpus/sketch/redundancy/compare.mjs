// Adapts fixed-source outputs; does not implement another solver.
import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';
const [beforePath,afterPath,outputPath]=process.argv.slice(2);
const bytes=path=>fs.readFileSync(path),before=JSON.parse(bytes(beforePath)),after=JSON.parse(bytes(afterPath));
assert.equal(before.rows.length,89);assert.equal(after.rows.length,89);
const schemaIds=new Set(after.rows.flatMap(r=>(r.loaded.systems||[]).flatMap(s=>s.rows.map(c=>c.typeId))));
assert.deepEqual([...schemaIds].sort(),[...after.registeredSchemas].sort());assert.equal(schemaIds.size,37);
const authoredIds=new Set(after.rows.flatMap(row=>row.sourceSchemas).filter(id=>after.registeredSchemas.includes(id)));
assert.equal(authoredIds.size,35);assert.deepEqual([...schemaIds].filter(id=>!authoredIds.has(id)).sort(),['ArcConsistency','Polar']);
const changes=[],geometryChanges=[];let unchanged=0;
for(let i=0;i<before.rows.length;i++){
 const a=before.rows[i],b=after.rows[i];assert.equal(a.name,b.name);assert.equal(a.inputUnchanged,true);assert.equal(b.inputUnchanged,true);
 if(JSON.stringify(a.loaded.sketch?.objects)!==JSON.stringify(b.loaded.sketch?.objects))geometryChanges.push(a.name);
 if(JSON.stringify(a.loaded.hints)!==JSON.stringify(b.loaded.hints)||a.ok!==b.ok||JSON.stringify(a.error)!==JSON.stringify(b.error))changes.push({name:a.name,before:{ok:a.ok,error:a.error,hints:a.loaded.hints},after:{ok:b.ok,error:b.error,hints:b.loaded.hints}});else unchanged++;
}
assert.equal(changes.length,1);assert.equal(unchanged,88);assert.deepEqual(geometryChanges,[]);
assert.equal(changes[0].name,'p0/sketch.p0.known-implied-redundancy-label');assert.equal(changes[0].before.ok,true);assert.equal(changes[0].after.error.code,'INTENT_CHANGED');
assert.deepEqual(before.freshRoundtrip.admissions.map(c=>c.admission.state),['accepted','accepted']);assert.deepEqual(after.freshRoundtrip.admissions.map(c=>c.admission.state),['accepted','redundant']);
assert.equal(before.freshRoundtrip.strictReload,true);assert.equal(after.freshRoundtrip.strictReload,true);
const median=values=>[...values].sort((a,b)=>a-b)[Math.floor(values.length/2)];
const summary={version:1,scope:'Source-controlled Node backend only; no installed browser/frontend/Worker qualification',inputs:89,registeredSchemas:37,coverage:'35 registered authored schemas plus Polar/ArcConsistency internal equations; unknown-schema negative retained separately',allGeometryJsonEqual:true,allInputsUnchanged:true,unchangedAdmissionAndErrorOutcomes:unchanged,changes,multistage:after.rows.filter(r=>r.stageCount>1).map(r=>({name:r.name,ok:r.ok})),freshAuthoring:{before:before.freshRoundtrip,after:after.freshRoundtrip},existingZeroTolerance:after.generic.inheritedTolerance,benchmark:before.benchmark.map((row,i)=>({count:row.count,beforeMedianMs:median(row.samplesMs),afterMedianMs:median(after.benchmark[i].samplesMs)})),sourceReceipts:{beforeSha256:crypto.createHash('sha256').update(bytes(beforePath)).digest('hex'),afterSha256:crypto.createHash('sha256').update(bytes(afterPath)).digest('hex')}};
fs.writeFileSync(outputPath,JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary,null,2));
