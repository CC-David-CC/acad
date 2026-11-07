import {test} from 'node:test';
import assert from 'node:assert/strict';
import {AlgNumConstraint} from '../../web/app/sketcher/constr/ANConstraints.ts';
const schema={id:'boolean-test',constants:{distance:{type:'number'},inverted:{type:'boolean'}},defineParamsScope(){},collectPolynomials(){}};
test('boolean literals bypass numeric resolver while numeric expressions remain evaluated',()=>{
 for(const [literal,expected] of [[true,true],['true',true],[false,false],['false',false]]){
  const c=new AlgNumConstraint(schema,[],{distance:'length',inverted:literal});let seen=[];
  c.resolveConstants(v=>{seen.push(v);if(v==='length')return 10;throw Error('unexpected numeric expression')});
  assert.deepEqual(seen,['length']);assert.deepEqual(c.resolvedConstants,{distance:10,inverted:expected});
 }
});
test('invalid boolean literal cannot be treated as false or passed to numeric evaluator',()=>{
 for(const literal of ['yes','1',0,null,undefined]){
  const c=new AlgNumConstraint(schema,[],{distance:'10',inverted:literal});let seen=[];
  assert.throws(()=>c.resolveConstants(v=>{seen.push(v);return v}),/true or false/);assert.deepEqual(seen,[]);
 }
});
test('point-to-line distance accepts zero but rejects negative and nonnumeric values',()=>{
 const domain={...schema,constants:{distance:{type:'number',nonnegative:true},inverted:{type:'boolean'}}};
 for(const value of ['0','10'])assert.doesNotThrow(()=>new AlgNumConstraint(domain,[],{distance:value,inverted:'false'}).resolveConstants(x=>x));
 for(const value of ['-1','not-a-number','Infinity'])assert.throws(()=>new AlgNumConstraint(domain,[],{distance:value,inverted:'false'}).resolveConstants(x=>x),/nonnegative/);
});
