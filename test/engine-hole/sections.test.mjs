import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {inspectCutSections} from './inspect-cut-sections.mjs';
const controls=JSON.parse(fs.readFileSync(new URL('../engine-hole-projection/fixtures/authored-worker-results.json',import.meta.url)));
test('retained authored meshes have through openings and move the hole with the parent',()=>{
 for(const c of controls)inspectCutSections(c.cut.portableTopology,{width:c.width,height:c.height,depth:c.depth,origin:[10000,20000,7]});
});
test('section oracle detects a false filled hole despite unchanged volume metadata',()=>{
 const c=controls[0],t=structuredClone(c.cut.portableTopology),z=27;
 t.faces[0].triangles.push([[10040,20015,z],[10060,20015,z],[10050,20040,z]]);
 assert.throws(()=>inspectCutSections(t,{width:c.width,height:c.height,depth:c.depth,origin:[10000,20000,7]}),/obstructed/);
});
