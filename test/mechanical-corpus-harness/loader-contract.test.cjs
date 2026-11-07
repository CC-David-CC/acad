const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const babel=require('@babel/core'),{traverse,types:t}=babel;
const parse=(source,parserOpts)=>babel.parseSync(source,{babelrc:false,configFile:false,parserOpts});
const loader=require('./reevaluate-entry-loader.cjs');
const source=fs.readFileSync(path.resolve(__dirname,'../../web/app/cad/sketch/sketcherBundle.ts'),'utf8');
const ast=text=>parse(text,{sourceType:'module',plugins:['typescript','jsx']});
const find=tree=>{let fn;traverse(tree,{FunctionDeclaration(p){if(p.node.id.name==='reevaluateSketch'){assert.equal(fn,undefined);fn=t.cloneNode(p.node,true);}}});return fn;};
const normalized=value=>JSON.parse(JSON.stringify(value,(k,v)=>['start','end','loc','extra','leadingComments','innerComments','trailingComments'].includes(k)?undefined:v));
test('test entry retains every original writer statement except the pinned presentation seam and observers',()=>{
 const original=find(ast(source)),entry=find(ast(loader(source)));
 let removed=0;
 traverse(t.file(t.program([original])),{IfStatement(p){if(t.isUnaryExpression(p.node.test)&&t.isIdentifier(p.node.test.argument,{name:'headlessCanvas'})){removed++;p.remove();}}});
 assert.equal(removed,1);
 let workspace=0,reset=0;
 traverse(t.file(t.program([entry])),{
  VariableDeclarator(p){if(t.isIdentifier(p.node.id,{name:'viewer'})){workspace++;p.node.init=t.newExpression(t.identifier('Viewer'),[t.identifier('headlessCanvas'),t.identifier('IO'),t.objectExpression([])]);}},
  ExpressionStatement(p){const n=p.node.expression;if(t.isCallExpression(n)&&t.isIdentifier(n.callee)&&['onWorkspace','onReset'].includes(n.callee.name)){if(n.callee.name==='onReset')reset++;p.remove();}}
 });
 assert.equal(workspace,1);assert.equal(reset,1);
 assert.deepEqual(normalized(entry),normalized(original));
 const output=loader(source);assert.match(output,/import \{ HeadlessSketchWorkspace \}|import \{HeadlessSketchWorkspace\}/);assert.doesNotMatch(output,/new Function|\beval\(|document\.createElement|global\./);
});
for(const [name,from,to,pattern]of[
 ['Canvas tag',"document.createElement('canvas')","document.createElement('div')",/Canvas presentation/],
 ['Viewer options','new Viewer(headlessCanvas, IO, {})','new Viewer(headlessCanvas, IO, {changed:true})',/Viewer presentation/],
 ['identifier reset','Generator.resetIDGenerator();','Generator.resetIDGenerator(1);',/identifier reset/],
 ['new lexical dependency','function reevaluateSketch(sketchId) {','function reevaluateSketch(sketchId) { unimportedDependency();',/Unbound writer entry dependency/]
])test(`presentation/dependency drift refuses entry generation: ${name}`,()=>{assert.ok(source.includes(from));assert.throws(()=>loader(source.replace(from,to)),pattern);});
