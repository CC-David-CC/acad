// Read-only binary/glue introspection. Never instantiate or call native CAD.
const fs=require('node:fs'),crypto=require('node:crypto');
const [wasmPath,jsPath]=process.argv.slice(2),wasm=fs.readFileSync(wasmPath),js=fs.readFileSync(jsPath,'utf8'),sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const moduleExports=WebAssembly.Module.exports(new WebAssembly.Module(wasm));
const names=new Set();for(const pattern of [/Module\[['"](_[A-Za-z0-9_]+)['"]\]/g,/Module\.(_[A-Za-z][A-Za-z0-9_]*)/g])for(const m of js.matchAll(pattern))names.add(m[1]);
const relevant=[...names].filter(n=>/Owned|Drilled|FourCorner|SelectedProfile|Topology|History|Classif|CallCommand|Interogate/.test(n)).sort();
const semanticWasm=moduleExports.filter(x=>/Owned|Drilled|FourCorner|SelectedProfile|Topology|History|Classif|CallCommand|Interogate/.test(x.name));
console.log(JSON.stringify({status:'READ_ONLY_OBSERVED',scope:'Frozen mechanical module exports and JS-exposed ABI only; no native operation or geometry executed',wasmPath,jsPath,wasmSha256:sha(wasm),jsSha256:sha(js),wasmExportCount:moduleExports.length,wasmSemanticExports:semanticWasm,jsExposedRelevantNames:relevant,glueExposedNameCount:names.size},null,2));
