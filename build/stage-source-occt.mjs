import {copyFile, mkdir, readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {dirname, relative, resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {sourceEngine} from '../modules/engine/source-occt/pins.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const [engineDist, destination] = process.argv.slice(2);
if (!engineDist || !destination) throw Error('Usage: stage-source-occt.mjs <libcascade dist> <empty package directory>');
await mkdir(destination, {recursive:false});
const visited = new Set();
async function copyModule(path) {
  const rel = relative(root,path);
  if (!rel.startsWith('modules'+sep) || !rel.endsWith('.mjs')) throw Error('Invalid worker dependency');
  if (visited.has(rel)) return;
  visited.add(rel);
  const source = await readFile(path,'utf8');
  const output = resolve(destination,rel);
  await mkdir(dirname(output),{recursive:true});
  await copyFile(path,output);
  const imports = [...source.matchAll(/^import\s+[^;]+?\s+from\s+['"]([^'"]+)['"]\s*;/gm)];
  for (const [,name] of imports) {
    if (!name.startsWith('.')) throw Error('External worker dependency '+name);
    await copyModule(resolve(dirname(path),name));
  }
}
await copyModule(resolve(root,'modules/engine/source-occt/worker.mjs'));
const packaged = {};
const runtime = resolve(destination,'modules/engine/runtime');
await mkdir(runtime,{recursive:true});
for (const [name,hash,ext] of [['opencascade_single.js',sourceEngine.glue,'mjs'],['opencascade_single.wasm',sourceEngine.wasm,'wasm']]) {
  const bytes = await readFile(resolve(engineDist,name));
  if (createHash('sha256').update(bytes).digest('hex') !== hash) throw Error('Incorrect candidate '+name);
  await writeFile(resolve(runtime,hash+'.'+ext),bytes,{flag:'wx'});
  packaged[name]=hash;
}
await writeFile(resolve(destination,'receipt.json'),JSON.stringify({sourceEngine,modules:[...visited].sort(),packaged},null,2)+'\n',{flag:'wx'});
