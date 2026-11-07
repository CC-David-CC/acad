// Normal-build entry for the explicit experimental revision. Existing fixed
// stager verifies approved JS/WASM; existing emitter seals its declared graph.
const path=require('node:path'),{execFileSync}=require('node:child_process');
const input=process.argv[2]||process.env.CODI_SWEEP_NATIVE_DIR;
if(typeof input!=='string'||!input.trim())throw Error('Set CODI_SWEEP_NATIVE_DIR to the reviewed owned-sweep native artifacts (occ-portable.js and main.wasm).');
execFileSync(process.execPath,[path.join(__dirname,'prepare-sweep-profile-assets.cjs'),input],{stdio:'inherit'});
execFileSync(process.execPath,[path.join(__dirname,'sweep-profile-assets-entry.cjs')],{stdio:'inherit'});
