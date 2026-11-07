// Test-only entry: retain the source writer, replace its presentation constructor
// with the actual nonvisual workspace, and compile the complete import closure.
const babel=require('@babel/core'),{traverse,types:t}=babel;
const parse=(source,parserOpts)=>babel.parseSync(source,{babelrc:false,configFile:false,parserOpts});
const generate=node=>babel.transformFromAstSync(t.file(t.program([node])),null,{babelrc:false,configFile:false}).code;
module.exports=function(source){
 const file=parse(source,{sourceType:'module',plugins:['typescript','jsx']});
 const activation=file.program.body.find(n=>t.isExportNamedDeclaration(n)&&t.isFunctionDeclaration(n.declaration)&&n.declaration.id.name==='activate')?.declaration;
 const original=activation?.body.body.filter(n=>t.isFunctionDeclaration(n)&&n.id.name==='reevaluateSketch');
 if(original?.length!==1)throw Error('Expected one original reevaluateSketch declaration');
 const fn=t.cloneNode(original[0],true);
 let canvas=0,viewer=0,reset=0;
 const member=(node,owner,name)=>t.isMemberExpression(node)&&!node.computed&&t.isIdentifier(node.object,{name:owner})&&t.isIdentifier(node.property,{name});
 traverse(t.file(t.program([fn])),{
  IfStatement(path){
   const n=path.node;
   if(!t.isUnaryExpression(n.test,{operator:'!'})||!t.isIdentifier(n.test.argument,{name:'headlessCanvas'}))return;
   const a=n.consequent?.expression;
   if(n.alternate||!t.isExpressionStatement(n.consequent)||!t.isAssignmentExpression(a,{operator:'='})||!t.isIdentifier(a.left,{name:'headlessCanvas'})||!t.isCallExpression(a.right)||!member(a.right.callee,'document','createElement')||a.right.arguments.length!==1||!t.isStringLiteral(a.right.arguments[0],{value:'canvas'}))throw Error('Unexpected legacy Canvas presentation boundary');
   canvas++;path.remove();
  },
  VariableDeclaration(path){
   const n=path.node,d=n.declarations[0];
   if(!t.isIdentifier(d?.id,{name:'viewer'}))return;
   const init=d.init;
   if(n.kind!=='const'||n.declarations.length!==1||!t.isNewExpression(init)||!t.isIdentifier(init.callee,{name:'Viewer'})||init.arguments.length!==3||!t.isIdentifier(init.arguments[0],{name:'headlessCanvas'})||!t.isIdentifier(init.arguments[1],{name:'IO'})||!t.isObjectExpression(init.arguments[2])||init.arguments[2].properties.length)throw Error('Unexpected legacy Viewer presentation boundary');
   viewer++;d.init=t.newExpression(t.identifier('HeadlessSketchWorkspace'),[t.objectExpression([])]);
   path.insertAfter(t.expressionStatement(t.callExpression(t.identifier('onWorkspace'),[t.identifier('viewer')])));
  },
  ExpressionStatement(path){
   const call=path.node.expression;
   if(t.isCallExpression(call)&&member(call.callee,'Generator','resetIDGenerator')){
    if(call.arguments.length)throw Error('Unexpected legacy identifier reset contract');
    reset++;path.insertAfter(t.expressionStatement(t.callExpression(t.identifier('onReset'),[])));
   }
  }
 });
 if(canvas!==1||viewer!==1||reset!==1)throw Error(`Unexpected writer boundaries: ${canvas}/${viewer}/${reset}`);
 const declaration=generate(fn);
 const code=`import {unchangedSketchSave} from './unchangedSketchSave.mjs';\nimport {bindSketchConstants} from './sketchConstantResolver';\nimport {HeadlessSketchWorkspace} from 'sketcher/headless/workspace';\nimport {Generator} from 'sketcher/id-generator';\nexport function createLegacyReevaluationEntry({ctx,services,onWorkspace,onReset}) {\n${declaration}\nreturn reevaluateSketch;\n}`;
 // An added source dependency must be imported deliberately, never supplied as
 // a global helper or silently replaced by a test double.
 const closure=parse(code,{sourceType:'module'});
 traverse(closure,{ReferencedIdentifier(path){const name=path.node.name;if(!path.scope.hasBinding(name)&&!['JSON','console'].includes(name))throw Error(`Unbound writer entry dependency: ${name}`);}});
 return code;
};
