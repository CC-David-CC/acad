import assert from 'node:assert/strict';import {test} from 'node:test';
import {prepare} from '../../web/app/sketcher/constr/solver.js';
function linear(){let x=2e-7;const param={j:-1,constant:false,get:()=>x,set:v=>{x=v;},rollback:()=>{x=2e-7;}},residual={params:[param],error:()=>x,gradient:g=>{g[0]=1;}};return{solver:prepare([residual]),value:()=>x};}
test('fine numerical solve resolves a residual below the old1e-6 stop but above directional guards',()=>{const{solver,value}=linear(),result=solver.solveSystem(false);assert.equal(result.success,true);assert.ok(Math.abs(value())<=1e-8,JSON.stringify({result,residual:value()}));assert.ok(result.evalCount>0);});
test('rough numerical solve retains its existing1e-3 target',()=>{const{solver,value}=linear(),result=solver.solveSystem(true);assert.equal(result.success,true);assert.equal(result.evalCount,0);assert.equal(value(),2e-7);});
