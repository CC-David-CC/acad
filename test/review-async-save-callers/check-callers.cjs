// Static migration audit only: no app imports, browser, Worker or service calls.
const fs=require('node:fs'),cp=require('node:child_process'),vm=require('node:vm'),assert=require('node:assert/strict');
const babel=require('@babel/core'),inventory=require('./callers.json');
const files=[...new Set(inventory.map(row=>row.file))],calls=[];
for(const file of files){
 const source=fs.readFileSync(file,'utf8');
 cp.execFileSync(process.execPath,['--check',file]);
 const options={filename:file,configFile:false,babelrc:false,sourceType:'unambiguous'};
 const ast=babel.parseSync(source,options);
 const compiled=babel.transformSync(source,{...options,presets:[[require.resolve('@babel/preset-env'),{targets:{chrome:'49'},modules:'commonjs'}]]}).code;
 new vm.Script(compiled,{filename:file});
 function visit(node,parents=[]){
  if(!node||typeof node!=='object')return;
  if(node.type==='CallExpression'){
   const callee=node.callee,member=callee.type==='MemberExpression'&&!callee.computed?callee.property.name:null;
   const helper=member==='commitSketch';
   const save=member==='save'&&callee.object.type==='MemberExpression'&&callee.object.property.name==='inPlaceEditor';
   const action=member==='run'&&['sketchSaveAndExit','sketchSave'].includes(node.arguments[0]?.value);
   if(helper||save||action){
    const owner=[...parents].reverse().find(n=>['ArrowFunctionExpression','FunctionExpression','FunctionDeclaration'].includes(n.type));
    const point=file+':'+node.loc.start.line;
    assert.equal(parents.at(-1)?.type,'AwaitExpression',point+' must await save');
    assert.equal(owner?.async,true,point+' must propagate an async result');
    calls.push({file,line:node.loc.start.line,call:source.slice(node.start,node.end)});
   }
  }
  for(const [key,value]of Object.entries(node)){
   if(['loc','tokens','comments','leadingComments','innerComments','trailingComments'].includes(key))continue;
   if(Array.isArray(value)){for(const child of value)if(child?.type)visit(child,[...parents,node]);}
   else if(value?.type)visit(value,[...parents,node]);
  }
 }
 visit(ast);
}
assert.deepEqual(calls,inventory.map(({file,line,call})=>({file,line,call})),'Inventory must describe all affected calls');
console.log(JSON.stringify({files:files.length,calls:calls.length,nodeSyntaxPassed:files.length,babelEnvCompiled:files.length,awaitedAndAsync:calls.length}));
