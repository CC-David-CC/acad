import {Polynomial,POW_1_FN,SIN_FN,COS_FN} from './polynomial';
import {ParallelConstraintIcon,SymmetryConstraintIcon} from '../icons/constraints/ConstraintIcons';

// Signed distance from a point to a supporting line, in sketch length units.
function pointLine(x,y,ax,ay,angle) {
  return new Polynomial(0)
    .monomial(-1).term(x,POW_1_FN).term(angle,SIN_FN)
    .monomial(1).term(y,POW_1_FN).term(angle,COS_FN)
    .monomial(1).term(ax,POW_1_FN).term(angle,SIN_FN)
    .monomial(-1).term(ay,POW_1_FN).term(angle,COS_FN);
}

export const CollinearSchema = {
  id:'Collinear',name:'Collinear supporting lines',icon:ParallelConstraintIcon,
  defineParamsScope:([line,other],cb)=>{
    line.a.visitParams(cb);cb(line.params.ang);other.a.visitParams(cb);other.b.visitParams(cb);
  },
  collectPolynomials:(out,[ax,ay,angle,cx,cy,dx,dy])=>{
    out.push(pointLine(cx,cy,ax,ay,angle),pointLine(dx,dy,ax,ay,angle));
  },
};

export const AxisSymmetrySchema = {
  id:'AxisSymmetry',name:'Symmetry about a line',icon:SymmetryConstraintIcon,
  defineParamsScope:([first,second,line],cb)=>{
    first.visitParams(cb);second.visitParams(cb);line.a.visitParams(cb);cb(line.params.ang);
  },
  collectPolynomials:(out,[px,py,qx,qy,ax,ay,angle])=>{
    // Midpoint lies on the line; the connecting vector is normal to it.
    out.push(new Polynomial(0)
      .monomial(-0.5).term(px,POW_1_FN).term(angle,SIN_FN)
      .monomial(-0.5).term(qx,POW_1_FN).term(angle,SIN_FN)
      .monomial(0.5).term(py,POW_1_FN).term(angle,COS_FN)
      .monomial(0.5).term(qy,POW_1_FN).term(angle,COS_FN)
      .monomial(1).term(ax,POW_1_FN).term(angle,SIN_FN)
      .monomial(-1).term(ay,POW_1_FN).term(angle,COS_FN));
    out.push(new Polynomial(0)
      .monomial(1).term(qx,POW_1_FN).term(angle,COS_FN)
      .monomial(-1).term(px,POW_1_FN).term(angle,COS_FN)
      .monomial(1).term(qy,POW_1_FN).term(angle,SIN_FN)
      .monomial(-1).term(py,POW_1_FN).term(angle,SIN_FN));
  },
};
