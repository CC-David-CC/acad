// Bounded arithmetic expressions without evaluating JavaScript code.
import {parse} from 'acorn';
const unary = Object.freeze({'+': x=>x, '-': x=>-x});
const binary = Object.freeze({'+':(a,b)=>a+b,'-':(a,b)=>a-b,'*':(a,b)=>a*b,'/':(a,b)=>a/b,'%':(a,b)=>a%b,'**':(a,b)=>a**b});
const functions = Object.freeze(Object.fromEntries(['abs','acos','asin','atan','atan2','ceil','cos','exp','floor','hypot','log','log10','max','min','pow','round','sign','sin','sqrt','tan','trunc'].map(k=>[k,Math[k]])));
const constants = Object.freeze({PI:Math.PI,E:Math.E});
const own = (o,k)=>Object.prototype.hasOwnProperty.call(o,k);
export function validVariableName(name){return typeof name==='string'&&/^[A-Za-z_$][A-Za-z0-9_$]{0,127}$/.test(name)&&!['Math','__proto__','prototype','constructor'].includes(name)&&!own(constants,name);}
// An external numeric binding is resolved literally before math parsing. Typed
// engineering parameters may use E or Math; this does not redefine constants
// or permit those names in the legacy arithmetic-definition script.
export function validExternalParameterName(name){return validVariableName(name)||name==='E'||name==='Math';}
export function evaluateMath(source,variables=Object.create(null)){
 if(typeof source!=='string'||source.length>2048||!source.trim())throw Error('Enter a math expression of at most 2048 characters.');
 let program;try{program=parse(source,{ecmaVersion:2020});}catch{throw Error('Invalid math expression.');}
 if(program.body.length!==1||program.body[0].type!=='ExpressionStatement')throw Error('Only a math expression is allowed.');
 let steps=0;
 function visit(n,depth=0){
  if(!n||++steps>512||depth>32)throw Error('Math expression is too complex.');
  let value;
  if(n.type==='Literal'&&typeof n.value==='number')value=n.value;
  else if(n.type==='Identifier'){
   if(own(variables,n.name))value=variables[n.name];
   else if(own(constants,n.name))value=constants[n.name];
   else throw Error('Unknown math variable: '+n.name);
  }else if(n.type==='UnaryExpression'&&own(unary,n.operator))value=unary[n.operator](visit(n.argument,depth+1));
  else if(n.type==='BinaryExpression'&&own(binary,n.operator))value=binary[n.operator](visit(n.left,depth+1),visit(n.right,depth+1));
  else if(n.type==='MemberExpression'&&!n.computed&&n.object.type==='Identifier'&&n.object.name==='Math'&&n.property.type==='Identifier'&&own(constants,n.property.name))value=constants[n.property.name];
  else if(n.type==='CallExpression'&&!n.optional&&n.callee.type==='MemberExpression'&&!n.callee.computed&&n.callee.object.type==='Identifier'&&n.callee.object.name==='Math'&&n.callee.property.type==='Identifier'&&own(functions,n.callee.property.name)&&n.arguments.length<=8&&!n.arguments.some(x=>x.type==='SpreadElement'))value=functions[n.callee.property.name](...n.arguments.map(x=>visit(x,depth+1)));
  else throw Error('Only numbers, variables and supported math functions are allowed.');
  if(typeof value!=='number'||!Number.isFinite(value))throw Error('Math result must be a finite number.');
  return value;
 }
 return visit(program.body[0].expression);
}

// Build a dependency graph without executing user code. The arithmetic
// evaluator remains the authority for which syntax and functions are allowed.
function dependencies(source){
 if(typeof source!=='string'||source.length>2048||!source.trim())throw Error('Enter a math expression of at most 2048 characters.');
 let program;try{program=parse(source,{ecmaVersion:2020});}catch{throw Error('Invalid math expression.');}
 if(program.body.length!==1||program.body[0].type!=='ExpressionStatement')throw Error('Only a math expression is allowed.');
 const names=new Set();let steps=0;
 function walk(node,depth=0){
  if(!node||++steps>512||depth>32)throw Error('Math expression is too complex.');
  if(node.type==='Identifier'){if(node.name!=='Math'&&!own(constants,node.name))names.add(node.name);return}
  if(node.type==='Literal')return;
  if(node.type==='UnaryExpression'){walk(node.argument,depth+1);return}
  if(node.type==='BinaryExpression'){walk(node.left,depth+1);walk(node.right,depth+1);return}
  if(node.type==='MemberExpression'){walk(node.object,depth+1);if(node.computed)walk(node.property,depth+1);return}
  if(node.type==='CallExpression'){walk(node.callee,depth+1);node.arguments.forEach(arg=>walk(arg,depth+1));return}
  throw Error('Only numbers, variables and supported math functions are allowed.');
 }
 walk(program.body[0].expression);return names;
}
export function parseMathDefinitions(script){
 const varList=[],errors=[],variables=Object.create(null),definitions=new Map();
 if(typeof script!=='string'||script.length>262144)return {varList,errors:[{line:0,message:'Expression script is too large.'}],variables};
 const lines=script.split('\n');if(lines.length>2048)return {varList,errors:[{line:0,message:'Too many expression lines.'}],variables};
 for(let i=0;i<lines.length;i++){
  if(!lines[i].trim())continue;
  const m=lines[i].match(/^\s*([^\s]+)\s*=(.+)$/);
  try{
   if(!m||!validVariableName(m[1]))throw Error('Use a valid variable name followed by = and a math expression.');
   if(definitions.has(m[1]))throw Error('Variable names must be unique.');
   definitions.set(m[1],{name:m[1],line:i,expression:m[2],dependencies:dependencies(m[2]),state:'new'});
  }catch(error){errors.push({line:i,message:error.message});}
 }
 function evaluate(def,depth=0){
  if(depth>128)throw Error('Parameter dependency chain is too deep.');
  if(def.state==='done')return;
  if(def.state==='visiting')throw Error('Cyclic parameter dependency.');
  if(def.state==='failed')throw Error('Invalid parameter dependency: '+def.name);
  def.state='visiting';
  try{
   for(const name of def.dependencies){const dependency=definitions.get(name);if(!dependency)throw Error('Unknown math variable: '+name);evaluate(dependency,depth+1)}
   variables[def.name]=evaluateMath(def.expression,variables);def.state='done';
  }catch(error){def.state='failed';throw error}
 }
 for(const def of definitions.values())try{evaluate(def)}catch(error){errors.push({line:def.line,message:error.message})}
 for(const def of definitions.values())if(def.state==='done')varList.push({name:def.name,value:variables[def.name]});
 errors.sort((a,b)=>a.line-b.line);return {varList,errors,variables};
}
