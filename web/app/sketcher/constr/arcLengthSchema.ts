import {Polynomial,POW_1_FN} from './polynomial';
import {arcLengthFromObject,arcLengthConstantValid} from './arcLengthDomain.mjs';
const TAU=2*Math.PI;
const fail=(message:string):never=>{throw Object.assign(Error(message),{code:'INVALID_ARC_LENGTH'});};
// Core equation only. Public reference-ruler/role lifecycle is separately
// required before advertising a complete ArcLength measurement capability.
export const ArcLengthSchema={
 id:'ArcLength',name:'Arc Length',
 constants:{length:{type:'number',dimension:'length' as const,positive:true,
  description:'length of the authored circular Arc interval',
  initialValue:([arc])=>arcLengthFromObject(arc).length}},
 defineParamsScope:([arc],callback)=>{callback(arc.r);callback(arc.ang1);callback(arc.ang2);},
 collectPolynomials:(polynomials,params,{length},[arc])=>{
  if(!arcLengthConstantValid(length))fail('ArcLength requires positive canonical millimeters up to 1000000.');
  const facts=arcLengthFromObject(arc),[radius,start,end]=params;
  if(facts.branch==='full-ccw'){
   polynomials.push(new Polynomial(-length).monomial(TAU).term(radius,POW_1_FN));return;
  }
  const delta=end.get()-start.get(),turns=Math.round((facts.sweep-delta)/TAU),lift=TAU*turns;
  if(!Number.isFinite(delta)||!Number.isSafeInteger(turns)||!Number.isFinite(lift))fail('ArcLength angle chart is unrepresentable.');
  // The ordinary polynomial engine differentiates each product: dF/dr is the
  // lifted sweep and dF/d(start,end) is (-r,+r). No winding flag is authored.
  polynomials.push(new Polynomial(-length).monomial(1).term(radius,POW_1_FN).term(end,POW_1_FN)
   .monomial(-1).term(radius,POW_1_FN).term(start,POW_1_FN)
   .monomial(lift).term(radius,POW_1_FN));
 }
};
