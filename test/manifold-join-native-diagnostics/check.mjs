import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';
const read=n=>JSON.parse(fs.readFileSync(new URL(n,import.meta.url)));
const receipt=read('receipt.json'), pins=read('pins.json'), same=read('same-boundary.json'), preservation=read('preservation.json');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
for(const name of ['pins.json','same-boundary.json','preservation.json'])assert.equal(sha(fs.readFileSync(new URL(name,import.meta.url))),receipt.evidence[name]);
assert.equal(receipt.status,'PASS_DIAGNOSTICS_NOT_JOIN');assert.equal(same.status,'PASS_OBSERVATIONS');assert.equal(same.retainedWrappers,0);
assert.equal(pins.wasmSha256,'636b7dc8e03a31a355ce5d7ec5a2bf3bb449eb7ea1c0aba5819bfb467d46ca0f');
assert.equal(receipt.unchangedApp.wasmSha256,'7bb5f8ee10fcafdab78799b1e5dd2cdc7c282ea0bf8e7939c43f3ad34b823e3d');
for(const [i,volume]of [[0,27000-15**3-14**3],[1,27000-2*15**3],[2,27000-15**3-15*15*30]]){
 const row=same.rows[i];assert.equal(row.volume,volume);assert.equal(row.status,'NoError');assert.equal(row.components.length,1);assert.equal(row.components[0].volume,volume);assert.equal(row.twoManifold,true);assert.equal(row.selfIntersecting,false);
}
assert.equal(preservation.status,'PASS');assert.equal(preservation.shapes,16);assert.equal(preservation.bitwiseMeshGL64Snapshots,44);assert.equal(preservation.twoInputPreservedPairs,16);
console.log(JSON.stringify({status:'PASS',nativeObservationRowsReferenced:21,notchRows:3,exactDoubleSnapshots:44,claim:'Recorded native diagnostics, not a Join certificate'}));
