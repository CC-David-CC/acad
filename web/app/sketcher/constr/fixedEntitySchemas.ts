import {Polynomial,POW_1_FN} from './polynomial';
import {LockConstraintIcon} from '../icons/constraints/ConstraintIcons';

const numeric=(description,positive=false)=>({type:'number',finite:true,positive,readOnly:true,description,initialValue:()=>0});
function fixed(out,param,value){out.push(new Polynomial(-value).monomial(1).term(param,POW_1_FN));}

// Persist physical geometry as literal constants. Derived direction/radius/
// sweep constants are checked independently, not represented by duplicate
// equations that would introduce artificial solver rank claims.
export const FixSegmentSchema={
  id:'FixSegment',name:'Fix Segment',icon:LockConstraintIcon,
  constants:{ax:numeric('start X'),ay:numeric('start Y'),bx:numeric('end X'),by:numeric('end Y'),length:numeric('length',true),direction:numeric('direction')},
  defineParamsScope:([segment],cb)=>{segment.a.visitParams(cb);segment.b.visitParams(cb);},
  collectPolynomials:(out,[ax,ay,bx,by],c)=>{fixed(out,ax,c.ax);fixed(out,ay,c.ay);fixed(out,bx,c.bx);fixed(out,by,c.by);},
};
export const FixCircleSchema={
  id:'FixCircle',name:'Fix Circle',icon:LockConstraintIcon,
  constants:{cx:numeric('center X'),cy:numeric('center Y'),radius:numeric('radius',true)},
  defineParamsScope:([circle],cb)=>{circle.c.visitParams(cb);cb(circle.r);},
  collectPolynomials:(out,[cx,cy,r],c)=>{fixed(out,cx,c.cx);fixed(out,cy,c.cy);fixed(out,r,c.radius);},
};
export const FixArcSchema={
  id:'FixArc',name:'Fix Arc',icon:LockConstraintIcon,
  constants:{ax:numeric('start X'),ay:numeric('start Y'),bx:numeric('end X'),by:numeric('end Y'),cx:numeric('center X'),cy:numeric('center Y'),radius:numeric('radius',true),sweep:numeric('sweep',true)},
  defineParamsScope:([arc],cb)=>{arc.a.visitParams(cb);arc.b.visitParams(cb);arc.c.visitParams(cb);},
  collectPolynomials:(out,[ax,ay,bx,by,cx,cy],c)=>{fixed(out,ax,c.ax);fixed(out,ay,c.ay);fixed(out,bx,c.bx);fixed(out,by,c.by);fixed(out,cx,c.cx);fixed(out,cy,c.cy);},
};
