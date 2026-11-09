import {FreeFunction, Polynomial} from './polynomial';

// Segment.t is signed; physical length is its magnitude. Squaring this affine
// relation would lose the offset sign and admit additional solutions.
const affineMagnitude = (k, param, b) => new Polynomial().monomial().term(param,
  new FreeFunction(x => Math.abs(k*x+b), x => k*Math.sign(k*x+b),
    'length-magnitude('+k+','+b+')', () => null));
// Preserve conservative reduction for general coefficient/offset arithmetic.
const absoluteLength = new FreeFunction(Math.abs,Math.sign,'length-magnitude',affineMagnitude);
// Primitive abs is exact for finite represented input. Use the certificate only
// in the unit-equality row: coefficients±1, initial constant0. General constant
// accumulation/product certification is a separate, unclaimed algebra policy.
const exactEqualMagnitude = new FreeFunction(Math.abs,Math.sign,
  'length-magnitude-unit-equality',affineMagnitude,x=>Number.isFinite(x));

export const LengthRelationDefinition = {
  id: 'LengthRelation', name: 'Length relation',
  constants: {
    factor: {type:'number', nonnegative:true, description:'Dimensionless length ratio', initialValue:()=>1},
    offset: {type:'number', finite:true, description:'Signed length difference (mm)', initialValue:()=>0}
  },
  defineParamsScope: ([a,b], callback) => {callback(a.params.t);callback(b.params.t);},
  collectPolynomials: (out, [a,b], {factor,offset}) => {
    if(!Number.isFinite(factor)||factor<0||!Number.isFinite(offset))throw Error('Invalid length relation constants.');
    const magnitude=factor===1&&offset===0?exactEqualMagnitude:absoluteLength;
    out.push(new Polynomial(-offset).monomial().term(a,magnitude).monomial(-factor).term(b,magnitude));
  }
};
