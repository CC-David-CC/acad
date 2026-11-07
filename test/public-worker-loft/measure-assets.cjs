// Exact emitted-resource accounting; main-bundle delta is deliberately excluded.
const fs=require('node:fs'),assert=require('node:assert/strict');
const component=JSON.parse(fs.readFileSync(process.argv[2])),inventory=JSON.parse(fs.readFileSync(process.argv[3])),files=Object.fromEntries(Object.entries(inventory.files).filter(([n])=>n.startsWith('loft-profile/')));
assert.equal(Object.keys(files).length,25);
for(const[name,pin]of Object.entries(files))assert.deepEqual(pin,component.files[name.slice('loft-profile/'.length)],name);
const emittedBytes=Object.values(files).reduce((n,x)=>n+x.bytes,0),existingPackageBytes=334085580,capBytes=320*1024*1024;
const value={scope:'Exact normal webpack optional resource graph; excludes main-bundle delta. Parent supplied existing package total; no package-cap change.',emittedResources:Object.keys(files).length,emittedBytes,existingPackageBytes,minimumCombined:existingPackageBytes+emittedBytes,capBytes,overCapBeforeMainDelta:existingPackageBytes+emittedBytes-capBytes,files};
fs.writeFileSync(process.argv[4],JSON.stringify(value,null,2)+'\n');console.log(JSON.stringify({...value,files:undefined}));
