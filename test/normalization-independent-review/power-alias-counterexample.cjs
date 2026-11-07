// Read-only actual-source transpilation; no solver/product edits, browser shim
// or substitute implementation of polynomial/tolerance/parameter mathematics.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),assert=require('node:assert/strict'),ts=require(process.env.CODI_TYPESCRIPT_PATH||'typescript');
const root=path.resolve(__dirname,'../..'),cache=new Map();
function load(file){if(cache.has(file))return cache.get(file).exports;const source=fs.readFileSync(file,'utf8'),m=new Module(file);cache.set(file,m);m.filename=file;m.paths=Module._nodeModulePaths(path.dirname(file));m.require=id=>{
 let target=id.startsWith('.')?path.resolve(path.dirname(file),id):path.resolve(root,'modules',id);if(id.startsWith('node:'))return require(id);
 const actual=['','.ts','.tsx','.js','.mjs'].map(ext=>target+ext).find(f=>fs.existsSync(f)&&fs.statSync(f).isFile());if(!actual)throw Error('Unresolved actual-source import '+id+' from '+file);return load(actual);
};m._compile(ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText,file);return m.exports;}
const {Polynomial,POW_1_FN,POW_2_FN}=load(root+'/web/app/sketcher/constr/polynomial.ts'),{Param}=load(root+'/web/app/sketcher/shapes/param.ts');
const t=new Param(10),x=new Param(2),y=new Param(1),p=new Polynomial().monomial(1).term(t,POW_1_FN).term(x,POW_2_FN).monomial(-4).term(t,POW_1_FN);
const originalAtValid=p.value();assert.equal(originalAtValid,0);p.substitute(x,y,2);p.compact();const substitutedAtValid=p.value();assert.equal(substitutedAtValid,-20);assert.equal(p.usedApproximateReduction,false);
const cancelled=p.cancelCommonNonzeroFactors(new Set([t]));assert.equal(cancelled,1);y.set(Math.SQRT2);const derivedResidual=p.value(),originalWithAuthoredAlias=t.get()*((2*y.get())**2-4);assert.ok(Math.abs(derivedResidual)<1e-12);assert.ok(Math.abs(originalWithAuthoredAlias-40)<1e-12);
console.log(JSON.stringify({source:'7757cf749f51bc82d79ee0d23b9be35e8305b0c8',scope:'Inherited non-unit power substitution, actual Polynomial/Param core; no public Worker acceptance claim.',originalAtValid,substitutedAtValid,usedApproximateReduction:p.usedApproximateReduction,cancelled,derivedResidual,originalWithAuthoredAlias,formula:'t*x^2 -4*t =0 with authored x=2*y; substitution produces2*t*y^2 -4*t instead of4*t*y^2 -4*t'}));
