// Bind only an independently frozen component. Paths are fixed below; the
// parent manifest must declare the complete transitive graph before execution.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const [manifest,expectedSha,baseURL,pathsFile,output]=process.argv.slice(2),raw=readFileSync(manifest);
assert.equal(createHash('sha256').update(raw).digest('hex'),expectedSha);
const c=JSON.parse(raw),base=new URL(baseURL),paths=JSON.parse(readFileSync(pathsFile));
assert(['127.0.0.1','localhost'].includes(base.hostname));
assert.equal(c.jsSha256,'dd666902fe926d69cc3c8843f5568c2a3e569f38ff49291baa2f248165b5ea99');
assert.equal(c.wasmSha256,'8d5e537e0d7f9e12b8ae0eaf239c0be1080934ed12a24bf6e7f849c9135ed5a2');
assert.equal(paths.constructorPath,'/modules/engine/mount/occ-boolean-history-mount.mjs');
for(const p of [paths.constructorPath,...Object.values(paths.mountOptions)]){assert.equal(typeof p,'string');assert(p.startsWith('/')&&!p.includes('..'));assert(Object.hasOwn(c.files,p.slice(1)),p);}
assert(Object.keys(c.files).length>=12);assert.equal(c.files[paths.mountOptions.jsPath.slice(1)].sha256,c.jsSha256);assert.equal(c.files[paths.mountOptions.wasmPath.slice(1)].sha256,c.wasmSha256);
writeFileSync(output,JSON.stringify({format:'independent-through-hole-browser-pins/1',componentManifestSHA256:expectedSha,baseURL:base.href,pagePath:'index.html',...paths,assets:c.files,componentSourceModules:c.sources,bootstrapSHA256:c.bootstrapSha256},null,2)+'\n');
