// Normal-build entry for the explicit experimental revision. Existing fixed
// stager verifies approved JS/WASM; existing emitter seals its declared graph.
const path=require('node:path'),{execFileSync}=require('node:child_process');
const input=process.argv[2]||process.env.CODI_REVOLVE_NATIVE_DIR;
if(typeof input!=='string'||!input.trim())throw Error('Set CODI_REVOLVE_NATIVE_DIR to the reviewed owned-revolve native artifacts (occ-portable.js and main.wasm).');
execFileSync(process.execPath,[path.join(__dirname,'prepare-revolve-profile-assets.cjs'),input],{stdio:'inherit'});
execFileSync(process.execPath,[path.join(__dirname,'revolve-profile-assets-entry.cjs')],{stdio:'inherit'});
