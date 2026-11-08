import {Polynomial,POW_1_FN,SIN_FN,COS_FN,FreeFunction} from './polynomial';
import {GenericConstraintIcon} from '../icons/constraints/ConstraintIcons';
const SIGN=new FreeFunction(t=>Math.abs(t)>1e-9?Math.sign(t):NaN,()=>0,'slot-directed-segment-sign',()=>null);
// [axis ax,ay,bx,by,angle,t; start ax,ay,bx,by,cx,cy,r;
// end ax,ay,bx,by,cx,cy,r]. Ten mm residuals; no dimensionless
// equation receives a length tolerance. Directed branch is a separate domain.
export const StraightSlotSchema={
 id:'StraightSlot',name:'Straight Slot',icon:GenericConstraintIcon,
 constants:{radius:{type:'number',positive:true,description:'Slot radius',initialValue:objects=>objects[2].r.get()}},
 defineParamsScope:([axis,,start,,end],cb)=>{axis.a.visitParams(cb);axis.b.visitParams(cb);cb(axis.params.ang);cb(axis.params.t);for(const arc of [start,end]){arc.a.visitParams(cb);arc.b.visitParams(cb);arc.c.visitParams(cb);cb(arc.r);}},
 collectPolynomials:(out,p,{radius})=>{
  const [ax,ay,bx,by,angle,t]=p;
  const equal=(x,y)=>out.push(new Polynomial(0).monomial(1).term(x,POW_1_FN).monomial(-1).term(y,POW_1_FN));
  const radial=(x,y,cx,cy)=>out.push(new Polynomial(0).monomial(1).term(x,POW_1_FN).term(angle,COS_FN).term(t,SIGN).monomial(-1).term(cx,POW_1_FN).term(angle,COS_FN).term(t,SIGN).monomial(1).term(y,POW_1_FN).term(angle,SIN_FN).term(t,SIGN).monomial(-1).term(cy,POW_1_FN).term(angle,SIN_FN).term(t,SIGN));
  equal(p[10],ax);equal(p[11],ay);equal(p[17],bx);equal(p[18],by);
  out.push(new Polynomial(-radius).monomial(1).term(p[12],POW_1_FN),new Polynomial(-radius).monomial(1).term(p[19],POW_1_FN));
  radial(p[6],p[7],p[10],p[11]);radial(p[8],p[9],p[10],p[11]);radial(p[13],p[14],p[17],p[18]);radial(p[15],p[16],p[17],p[18]);
 },
};
