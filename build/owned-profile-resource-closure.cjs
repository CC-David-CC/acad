// Build-only admission of the verbatim .mjs resources emitted by webpack.
// Native runtime bytes/bootstrap and the factory's explicit roots stay separate.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
module.exports.assertOwnedProfileResourceClosure=function(base,manifest,modules){
 const emitted=new Set(modules);
 if(emitted.size!==modules.length)throw Error('Duplicate owned-profile resource module');
 for(const name of modules){
  if(typeof name!=='string'||!name.startsWith('modules/')||!name.endsWith('.mjs')||path.posix.normalize(name)!==name||name.includes('\\'))throw Error('Invalid owned-profile resource path');
  const bytes=fs.readFileSync(path.join(base,name)),sha=crypto.createHash('sha256').update(bytes).digest('hex');
  if(manifest.sources?.[name]!==sha||manifest.files?.[name]?.sha256!==sha||manifest.files[name].bytes!==bytes.length)throw Error('Owned-profile source snapshot differs from emitted resource: '+name);
  const imports=/\b(?:import|export)\s+(?:[^'";]*?\s+from\s*)?['"]([^'"]+)['"]/g;let match;
  while((match=imports.exec(bytes.toString('utf8')))){
   const specifier=match[1],dependency=path.posix.normalize(path.posix.join(path.posix.dirname(name),specifier));
   if(!specifier.startsWith('.')||!dependency.startsWith('modules/')||!emitted.has(dependency))throw Error('Owned-profile emitted resource closure is incomplete: '+name+' -> '+specifier);
  }
 }
};
