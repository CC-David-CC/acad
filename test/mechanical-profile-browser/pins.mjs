// Bind the test to a root-reviewed frozen component, never a mutable source
// worktree. The supplied manifest hash must be received independently.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const [manifest,expectedSha,baseURL,output]=process.argv.slice(2),raw=readFileSync(manifest);
assert.equal(createHash('sha256').update(raw).digest('hex'),expectedSha);
const c=JSON.parse(raw),base=new URL(baseURL);assert(['127.0.0.1','localhost'].includes(base.hostname));
assert.equal(c.format,'mechanical-profile-component/1');
assert.equal(c.jsSha256,'b3d91cbb02f90ba56732039283d787b92eda97c51091fafbd933ecf4db30dd97');
assert.equal(c.wasmSha256,'28e8e2c2752cef100a98e24ec487f7d90021edb98fb060fdd1160fe63501bbe2');
const result={format:'independent-mechanical-profile-browser-pins/1',componentManifestSHA256:expectedSha,baseURL:base.href,pagePath:'index.html',constructorPath:'/modules/engine/mount/occ-mechanical-profile-mount.mjs',mountOptions:{workerUrl:'/modules/engine/mount/mechanical-profile-worker.js',jsPath:'/mechanical-profile-occ-portable.js',wasmPath:'/mechanical-profile-occ.wasm'},assets:c.files,componentSourceModules:c.sources,bootstrapSHA256:c.bootstrapSha256};
writeFileSync(output,JSON.stringify(result,null,2)+'\n');
