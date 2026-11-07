// Independent comparisons of actual production-module results: no mock reader
// and no replacement curve math.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const before=JSON.parse(fs.readFileSync(path.join(__dirname,'baseline-browser.json'))),after=JSON.parse(fs.readFileSync(path.join(__dirname,'fixed-browser.json')));
for(const row of before.single.filter(row=>row.type!=='Point'))assert.deepEqual(after.single.find(other=>other.type===row.type),row,'Ordinary curve identity/geometry changed: '+row.type);
for(const row of after.single){const construction=after.allConstructionTessellations.find(other=>other.id===row.ids[0]);assert.deepEqual(construction.points,row.tessellation[0],'Construction changes geometry: '+row.type)}
assert.equal(before.single.find(row=>row.type==='Point').ids.length,0);
assert.deepEqual(after.single.find(row=>row.type==='Point').tessellation,[[[0,0,0]]]);
assert.notDeepEqual(before.profileFacts.auxiliaryIds,[before.profileFacts.profileId]);
assert.deepEqual(after.profileFacts.auxiliaryIds,[after.profileFacts.profileId]);
console.log('PASS seven carried curve IDs/exact tessellations unchanged; all eight construction geometries equal ordinary geometry; auxiliary profile identity fixed');
