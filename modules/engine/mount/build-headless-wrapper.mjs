// Research-only deterministic wrapper adaptation. This does not rebuild WASM.
import {readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const [input, output] = process.argv.slice(2);
if (!input || !output || input === output) throw Error('Specify separate input and output paths');
const source = await readFile(input, 'utf8');
const hash = text => createHash('sha256').update(text).digest('hex');
if (!['89b3b85fb8afcfbdf343ec3f7f2ecf222067012d994cf9af6eb649ef30d9257b','81996d394b9fd2fcd7b02a0448bf7968c2decc04969d2be7ace4512cbfc5620a','7dfb70d551333756d9936f7a7882d9f8f5482b921c7bee398e95ad03ef979641'].includes(hash(source))) throw Error('Unexpected original interpreter JS hash');
const before = 'window.__OCI_EXCHANGE_VAL = null;\nwindow.__OCI_EXCHANGE = function(objStr) {\n  __OCI_EXCHANGE_VAL = JSON.parse(objStr);\n  console.log("EXCHANGE VALUE:");\n  console.log(__OCI_EXCHANGE_VAL);\n};';
const after = 'globalThis.__OCI_EXCHANGE_VAL = null;\nglobalThis.__OCI_EXCHANGE = function(objStr) {\n  globalThis.__OCI_EXCHANGE_VAL = JSON.parse(objStr);\n};';
if (source.split(before).length !== 2) throw Error('Expected exactly one original exchange wrapper');
const derived = source.replace(before, after);
await writeFile(output, derived, {flag:'wx'});
console.log(JSON.stringify({inputSha256:hash(source), outputSha256:hash(derived), wasm:'unchanged'}));
