// Bounded, data-only physical expressions. Length and angle bases are mm and radians.
import {parse} from 'acorn';
import {MILLIMETERS_PER_INCH,RADIANS_PER_DEGREE} from './physicalUnitConstants.mjs';
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const dimensions=Object.freeze({scalar:[0,0],length:[1,0],area:[2,0],volume:[3,0],angle:[0,1]});
export class QuantityError extends Error {constructor(code,message,name){super(message);this.name='QuantityError';this.code=code;if(name!==undefined)this.parameter=name;}}
function fail(code,message,name){throw new QuantityError(code,message,name)}
function fields(value,keys){
 if(!value||typeof value!=='object'||Array.isArray(value)||(Object.getPrototypeOf(value)!==Object.prototype&&Object.getPrototypeOf(value)!==null)||Reflect.ownKeys(value).length!==keys.length)fail('INVALID_INPUT','Expected data fields.');
 const out=Object.create(null);for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!own(d,'value'))fail('INVALID_INPUT','Expected data fields.');out[key]=d.value;}return out;
}
function finite(value){if(typeof value!=='number'||!Number.isFinite(value)||Math.abs(value)>1e12)fail('NUMERIC_DOMAIN','Quantity must be finite and within bounds.');return value;}
function expression(text){if(typeof text!=='string'||!text.trim()||text.length>2048)fail('INVALID_EXPRESSION','Invalid expression length.');let p;try{p=parse(text,{ecmaVersion:2020})}catch{fail('INVALID_EXPRESSION','Expression could not be parsed.')}if(p.body.length!==1||p.body[0].type!=='ExpressionStatement')fail('INVALID_EXPRESSION','Only one expression is supported.');return p.body[0].expression;}
const q=(l,a,value)=>({l,a,value});
export function evaluatePhysicalDefinitions(input){
 const root=fields(input,['version','definitions']);if(root.version!==1)fail('UNSUPPORTED_VERSION','Unsupported quantity request version.');
 const defs=root.definitions;if(!Array.isArray(defs)||defs.length>256||Reflect.ownKeys(defs).length!==defs.length+1)fail('INVALID_INPUT','Definitions must be a dense bounded array.');
 const map=new Map();let bytes=0;
 for(let i=0;i<defs.length;i++){const d=Object.getOwnPropertyDescriptor(defs,String(i));if(!d?.enumerable||!own(d,'value'))fail('INVALID_INPUT','Definitions must be a dense bounded array.');const item=fields(d.value,['name','dimension','expression']);
  if(typeof item.name!=='string'||!/^[A-Za-z_$][A-Za-z0-9_$]{0,127}$/.test(item.name)||['mm','inch','rad','deg','PI','__proto__','prototype','constructor'].includes(item.name)||map.has(item.name))fail('INVALID_NAME','Invalid or duplicate parameter name.');
  if(!own(dimensions,item.dimension)&&!['count','boolean'].includes(item.dimension))fail('INVALID_DIMENSION','Unsupported dimension.',item.name);if(typeof item.expression!=='string')fail('INVALID_EXPRESSION','Expression must be text.',item.name);bytes+=item.expression.length;if(bytes>65536)fail('LIMIT','Definitions exceed the size limit.');
  try{map.set(item.name,{...item,ast:expression(item.expression),state:0})}catch(e){if(e instanceof QuantityError&&!e.parameter)e.parameter=item.name;throw e;}
 }
 let steps=0;const values=Object.create(null);
 function evaluate(def,depth=0){if(depth>128)fail('LIMIT','Dependency chain exceeds the limit.',def.name);if(def.state===2)return values[def.name];if(def.state===1)fail('CYCLE','Cyclic parameter dependency.',def.name);def.state=1;
  function visit(n,level=0){if(++steps>32768||level>32)fail('LIMIT','Expression complexity exceeds the limit.',def.name);if(!n)fail('INVALID_EXPRESSION','Invalid expression.',def.name);
   if(n.type==='Literal'&&typeof n.value==='number')return q(0,0,finite(n.value));if(n.type==='Literal'&&typeof n.value==='boolean')return {boolean:true,value:n.value};
   if(n.type==='Identifier'){if(n.name==='PI')return q(0,0,Math.PI);const dep=map.get(n.name);if(!dep)fail('UNKNOWN_PARAMETER','Unknown parameter: '+n.name,def.name);return evaluate(dep,depth+1);}
   if(n.type==='UnaryExpression'&&['+','-'].includes(n.operator)){const x=visit(n.argument,level+1);if(x.boolean)fail('DIMENSION_MISMATCH','Boolean arithmetic is unsupported.',def.name);const result=q(x.l,x.a,finite(n.operator==='-'?-x.value:x.value));if(x.count)result.count=true;return result;}
   if(n.type==='CallExpression'&&!n.optional&&n.callee.type==='Identifier'&&['mm','inch','rad','deg'].includes(n.callee.name)&&n.arguments.length===1){const x=visit(n.arguments[0],level+1);if(x.boolean||x.count||x.l||x.a)fail('DIMENSION_MISMATCH','Unit constructors require a scalar.',def.name);const unit=n.callee.name;return q(unit==='mm'||unit==='inch'?1:0,unit==='rad'||unit==='deg'?1:0,finite(x.value*(unit==='inch'?MILLIMETERS_PER_INCH:unit==='deg'?RADIANS_PER_DEGREE:1)));}
   if(n.type==='BinaryExpression'&&['+','-','*','/'].includes(n.operator)){const a=visit(n.left,level+1),b=visit(n.right,level+1);if(a.boolean||b.boolean)fail('DIMENSION_MISMATCH','Boolean arithmetic is unsupported.',def.name);
    if(n.operator==='+'||n.operator==='-'){if(a.l!==b.l||a.a!==b.a||!!a.count!==!!b.count)fail('DIMENSION_MISMATCH','Addition requires matching dimensions.',def.name);const result=q(a.l,a.a,finite(n.operator==='+'?a.value+b.value:a.value-b.value));if(a.count)result.count=true;return result;}
    if(n.operator==='/'&&b.value===0)fail('NUMERIC_DOMAIN','Division by zero.',def.name);const sign=n.operator==='*'?1:-1,l=a.l+sign*b.l,angle=a.a+sign*b.a;if(Math.abs(l)>3||Math.abs(angle)>3)fail('DIMENSION_DOMAIN','Dimension exponent exceeds limits.',def.name);return q(l,angle,finite(n.operator==='*'?a.value*b.value:a.value/b.value));
   }
   fail('INVALID_EXPRESSION','Unsupported expression syntax.',def.name);
  }
  let value=visit(def.ast);if(def.dimension==='boolean'){if(!value.boolean)fail('DIMENSION_MISMATCH','Boolean expected.',def.name);}else if(def.dimension==='count'){if(value.boolean||value.l||value.a||!Number.isSafeInteger(value.value)||value.value<0||value.value>1000000)fail('COUNT_DOMAIN','Count must be a nonnegative bounded integer.',def.name);value={...value,count:true};}else{const [l,a]=dimensions[def.dimension];if(value.boolean||value.count||value.l!==l||value.a!==a)fail('DIMENSION_MISMATCH','Expression dimension does not match its declaration.',def.name);}def.state=2;values[def.name]=Object.freeze(value);return value;
 }
 for(const def of map.values())evaluate(def);return Object.freeze({version:1,values:Object.freeze([...map.values()].map(def=>Object.freeze({name:def.name,dimension:def.dimension,value:values[def.name].value})))});
}
