import {FreeFunction, Polynomial} from './polynomial';

// Segment.t is signed; physical length is its magnitude. Squaring this affine
// relation would lose the offset sign and admit additional solutions.
const absoluteLength = new FreeFunction(Math.abs, Math.sign, 'length-magnitude',
  (k, param, b) => new Polynomial().monomial().term(param,
    new FreeFunction(x => Math.abs(k*x+b), x => k*Math.sign(k*x+b),
      'length-magnitude('+k+','+b+')', () => null)));

export const LengthRelationDefinition = {
  id: 'LengthRelation', name: 'Length relation',
  constants: {
    factor: {type:'number', nonnegative:true, description:'Dimensionless length ratio', initialValue:()=>1},
    offset: {type:'number', finite:true, description:'Signed length difference (mm)', initialValue:()=>0}
  },
  defineParamsScope: ([a,b], callback) => {callback(a.params.t);callback(b.params.t);},
  collectPolynomials: (out, [a,b], {factor,offset}) => {
    if(!Number.isFinite(factor)||factor<0||!Number.isFinite(offset))throw Error('Invalid length relation constants.');
    out.push(new Polynomial(-offset).monomial().term(a,absoluteLength).monomial(-factor).term(b,absoluteLength));
  }
};
