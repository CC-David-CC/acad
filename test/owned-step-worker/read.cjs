const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(process.argv[2]),inputs=path.resolve(process.argv[3]),pins=JSON.parse(fs.readFileSync(process.argv[4])),js=fs.readFileSync(path.join(root,'reader.js')),wasm=fs.readFileSync(path.join(root,'reader.wasm')),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
if(sha(js)!==pins.jsSha256||sha(wasm)!==pins.wasmSha256)throw Error('Reader differs from frozen pins');
const prefix='var Module={wasmBinary:require("node:fs").readFileSync(__dirname+"/reader.wasm"),arguments:[inputs]};\n';
new Function('require','__dirname','__filename','inputs',prefix+js)(require,root,path.join(root,'reader.js'),inputs);
