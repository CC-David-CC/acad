// Read-only actual-source transpilation; no solver/product edits, browser shim
// or substitute implementation of polynomial/tolerance/parameter mathematics.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),assert=require('node:assert/strict'),ts=require(process.env.CODI_TYPESCRIPT_PATH||'typescript');
const root=path.resolve(__dirname,'../..'),cache=new Map();
function load(file){if(cache.has(file))return cache.get(file).exports;const source=fs.readFileSync(file,'utf8'),m=new Module(file);cache.set(file,m);m.filename=file;m.paths=Module._nodeModulePaths(path.dirname(file));m.require=id=>{
 let target=id.startsWith('.')?path.resolve(path.dirname(file),id):path.resolve(root,'modules',id);if(id.startsWith('node:'))return require(id);
 const actual=['','.ts','.tsx','.js','.mjs'].map(ext=>target+ext).find(f=>fs.existsSync(f)&&fs.statSync(f).isFile());if(!actual)throw Error('Unresolved actual-source import '+id+' from '+file);return load(actual);
};m._compile(ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText,file);return m.exports;}
module.exports={...load(root+'/web/app/sketcher/constr/polynomial.ts'),...load(root+'/web/app/sketcher/shapes/param.ts'),...load(root+'/web/app/sketcher/constr/lengthRelation.ts')};
