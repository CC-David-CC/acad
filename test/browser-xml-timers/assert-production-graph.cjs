// Check JSON from the actual application webpack configuration, not a test shim.
const assert=require('node:assert/strict'),fs=require('node:fs');
const stats=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
assert.equal(stats.errors?.length,0,'production webpack errors');
const names=[];function visit(modules){for(const module of modules||[]){if(typeof module.name==='string')names.push(module.name);visit(module.modules)}}visit(stats.modules);for(const child of stats.children||[])visit(child.modules);
assert.ok(names.some(x=>/node_modules\/browser-xml2js\/lib\/parser\.js/.test(x)),'actual XML parser absent');
assert.ok(names.some(x=>/modules\/platform\/browserTimers\.js/.test(x)),'browser timer adapter absent');
const adapter=(stats.modules||[]).find(m=>/modules\/platform\/browserTimers\.js$/.test(m.name||''));
assert.ok(adapter?.reasons?.some(r=>/browser-xml2js\/lib\/parser\.js$/.test(r.moduleName||'')&&r.userRequest==='timers'),'XML parser does not resolve to the adapter');
assert.ok(!names.some(x=>/node_modules\/timers(?:\/|$)/.test(x)),'unrelated npm timers package included');
console.log('PASS application webpack graph uses browserTimers for browser-xml2js and excludes npm timers');
