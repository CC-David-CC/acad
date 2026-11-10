// Ordinary optional cohort packaging. No runtime fallback or test-only flag.
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),base=path.join(root,'.build/boolean-history-assets'),entry=path.join(root,'.build/boolean-history-entry.mjs'),input=process.env.CODI_BOOLEAN_HISTORY_NATIVE_DIR;
fs.mkdirSync(path.dirname(entry),{recursive:true});
if(typeof input!=='string'||!input.trim()){
 if(fs.existsSync(base))throw Error('An unconfigured Boolean-history cohort still has staged assets; use a fresh build directory.');
 fs.writeFileSync(entry,'// Optional Boolean-history native assets were not explicitly configured.\nexport default null;\n');
 console.log(JSON.stringify({available:false,nativeInputsRead:false,entry}));
}else{
 // The existing stage validates the exact pair/source; the entry producer
 // validates every emitted byte and the same closed module inventory.
 execFileSync(process.execPath,[path.join(__dirname,'prepare-boolean-history-assets.cjs'),input],{stdio:'inherit'});
 execFileSync(process.execPath,[path.join(__dirname,'boolean-history-assets-entry.cjs')],{stdio:'inherit'});
}
