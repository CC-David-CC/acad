import {eqEps} from "geom/tolerance";
import {SolverParam} from "./solverParam";

export class Polynomial {

  monomials = [];
  constant = 0;

  // Ephemeral proof provenance, never authored geometry. Legacy reductions
  // may discard a small nonzero coefficient; that derived row must not be
  // used to justify an exact, domain-dependent cancellation.
  usedApproximateReduction = false;

  constructor(constant = 0) {
    this.constant = constant;
  }

  get lastMonomial() {
    return this.monomials[this.monomials.length - 1];
  }

  term(p, fn) {
    this.lastMonomial.addParam(p, fn);
    return this;
  }

  monomial(k = 1) {
    this.monomials.push(new Monomial(k));
    return this;
  }

  eliminate(param, value, approximateSource = false) {
    let touched = false;
    for (const m of this.monomials) {
      for (let i = 0; i < m.terms.length; ++i) {
        if (m.terms[i].param === param) {
          m.eliminate(i, value);
          touched = true;
        }
      }
    }
    if (touched && approximateSource) this.usedApproximateReduction = true;
    return touched;
  }

  substitute(param, toParam, dotConstant, approximateSource = false) {
    const transaction = this.linearSubstitution(param, toParam, dotConstant, 0, approximateSource);
    if (!transaction) return false;
    transaction();
    return true;
  }

  linearSubstitution(param, toParam, k, b, approximateSource = false) {
    if (![k, b, this.constant].every(Number.isFinite)) return null;
    // This is an optional algebraic reduction, not an input-size limit. Keep
    // the original equations for numerical solving if expansion is excessive
    // or a function cannot supply a valid composition.
    const MAX_EXPANSION = 1024;
    const output = [];
    let constant = this.constant, touched = false;
    let approximate = this.usedApproximateReduction;
    const multiply = (a, b) => {
      const value = a * b;
      if (!Number.isFinite(value)) return null;
      if (value === 0 && a !== 0 && b !== 0) approximate = true;
      return value;
    };
    for (const source of this.monomials) {
      let expanded = [new Monomial(source.constant)];
      for (const term of source.terms) {
        if (term.param !== param) {
          for (const item of expanded) item.terms.push({...term});
          continue;
        }
        touched = true;
        let replacement;
        try {
          if (k === 1 && b === 0) {
            // Pure renaming is valid even for opaque functions. Preserve the
            // singleton identity used by domain certificates and compaction.
            replacement = new Polynomial().monomial().term(toParam, term.fn);
          } else if (k === 0) {
            const value = term.fn.apply(b);
            if (!Number.isFinite(value)) return null;
            replacement = new Polynomial(value);
          } else {
            replacement = typeof term.fn.linearSubstitution === 'function' ?
              term.fn.linearSubstitution(k, toParam, b) : null;
          }
        } catch (_) { return null; }
        if (!(replacement instanceof Polynomial) || !Number.isFinite(replacement.constant)) return null;
        approximate ||= approximateSource || replacement.usedApproximateReduction;
        const alternatives = replacement.monomials.slice();
        if (replacement.constant !== 0) alternatives.push(new Monomial(replacement.constant));
        if (alternatives.length > MAX_EXPANSION || expanded.length * alternatives.length > MAX_EXPANSION) return null;
        const products = [];
        for (const prior of expanded) for (const factor of alternatives) {
          const coefficient = multiply(prior.constant, factor.constant);
          if (coefficient === null) return null;
          const product = new Monomial(coefficient);
          product.terms = [...prior.terms.map(t => ({...t})), ...factor.terms.map(t => ({...t}))];
          products.push(product);
        }
        expanded = products;
      }
      for (const item of expanded) {
        item.mergeTerms();
        item.sort();
        if (item.terms.length) output.push(item);
        else {
          constant += item.constant;
          if (!Number.isFinite(constant)) return null;
        }
      }
      if (output.length > MAX_EXPANSION) return null;
    }
    if (!touched) return () => {};
    // Publish only after every term/function has been checked. In particular,
    // a later unsupported factor must not partially rewrite earlier factors.
    return () => {
      this.monomials = output;
      this.constant = constant;
      this.usedApproximateReduction = approximate;
    };
  }

  compact() {
    for (let i = 0; i < this.monomials.length; ++i) {
      const m1 = this.monomials[i];
      if (m1 === null) {
        continue;
      }
      for (let j = i + 1; j < this.monomials.length; ++j) {
        const m2 = this.monomials[j];
        if (m2 === null) {
          continue;
        }

        if (m1.equalVars(m2)) {
          m1.constant += m2.constant;
          this.monomials[j] = null;
        }
      }
      if (eqEps(m1.constant, 0)) {
        if (m1.constant !== 0) this.usedApproximateReduction = true;
        this.monomials[i] = null;
      } else if (m1.terms.length === 0) {
        this.constant += m1.constant;
        this.monomials[i] = null;
      }
    }
    this.monomials = this.monomials.filter(m => m !== null);
  }

  cancelCommonNonzeroFactors(certified: ReadonlySet<any>) {
    if (this.usedApproximateReduction || this.constant !== 0 || !this.monomials.length) return 0;
    const candidates = this.monomials[0].terms
      .filter(t => t.fn === POW_1_FN && certified.has(t.param)).map(t => t.param);
    let cancelled = 0;
    for (const param of candidates) {
      const indices = this.monomials.map(m => m.terms.findIndex(t => t.param === param && t.fn === POW_1_FN));
      if (indices.some(i => i < 0)) continue;
      this.monomials.forEach((m, i) => m.terms.splice(indices[i], 1));
      cancelled++;
    }
    return cancelled;
  }

  get isLinear() {
    for (const m of this.monomials) {
      if (m.terms.length !== 1 || m.terms[0].fn.degree !== 1) {
        return false;
      }
    }
    return true;
  }

  value(valueFn = GET_VALUE) {
    let res = this.constant;
    for (const m of this.monomials) {
      res += m.value(valueFn);
    }
    return res;
  }

  asResidual() {

    const paramsSet: Set<SolverParam> = new Set();

    for (const m of this.monomials) {
      for (const t of m.terms) {
        paramsSet.add(t.param.solverParam);
      }
    }

    const params = Array.from(paramsSet);

    const solverValue = p => p.solverParam.get();

    return {

      params,

      error: () => this.value(solverValue),

      gradient: out => {

        for (let i = 0; i < params.length; i++) {

          out[i] = 0;

          for (const m of this.monomials) {
            out[i] += m.differentiate(params[i].objectParam, solverValue);
          }
        }

      },

    };


  }

  visitParams(callback) {
    for (const m of this.monomials) {
      for (const t of m.terms) {
        callback(t.param);
      }
    }
  }

  toString() {

    return this.monomials.map(m => {

        let out = '';
        if (m.constant === 1) {
          out += '+';
        } else if (m.constant === -1) {
          out += '-';
        } else {
          out += (m.constant >= 0 ? '+' : '') + m.constant.toFixed(2);
          if (m.terms.length) {
            out += '*';
          }
        }

        out += m.terms.map(t => {
          let out = t.param.debugSymbol + t.param.id;
          if (t.fn.degree === 1) {

          } else if (t.fn.degree !== Infinity) {
            out += t.fn.id;
          } else if (t.fn.render) {
            out = t.fn.render(out);
          } else {
            out = t.fn.id + '(' + out + ')';
          }
          return out;
        }).join('*');

        return out;
      }
    ).join(' ') + (this.constant >= 0 ? ' + ' : ' ') + this.constant.toFixed(2);

  }

}

export class Monomial {

  terms = [];
  constant = 1;

  constructor(constant = 1) {
    this.constant = constant;
  }

  get linearParam() {
    return this.terms[0].param;
  }

  addParam(param, fn) {
    this.terms.push({param, fn});
    this.sort();
  }

  sort() {
    this.terms.sort(t => t.param.id);
  }

  eliminate(i, value) {
    const fn = this.terms[i].fn;
    this.constant *= fn.apply(value);
    this.terms.splice(i, 1);
  }


  mergeTerms() {
    let wasMerge = false;
    for (let i = 0; i < this.terms.length; ++i) {
      const merger = this.terms[i];
      if (!merger) {
        continue;
      }
      for (let j = i + 1; j < this.terms.length; ++j) {
        const term = this.terms[j];
        if (merger.param === term.param) {
          const mergedFn = merger.fn.merge(term.fn);
          if (mergedFn) {
            merger.fn = mergedFn;
            this.terms[j] = null;
            wasMerge = true;
          }
        }
      }
    }
    if (wasMerge) {
      this.terms = this.terms.filter(t => t);
    }
  }

  equalVars(other) {
    if (this.terms.length !== other.terms.length) {
      return false;
    }

    for (let i = 0; i < this.terms.length; ++i) {
      const t1 = this.terms[i];
      const t2 = other.terms[i];
      if (t1.fn.id !== t2.fn.id || t1.param.id !== t2.param.id) {
        return false;
      }
    }
    return true;
  }

  differentiate(partialParam, valueFn = GET_VALUE) {

    let cnst = this.constant;

    let diffProduct = 0;
    let freeProduct = 1;

    for (const term of this.terms) {
      const pVal = valueFn(term.param);
      const d0 = term.fn.apply(pVal);
      if (partialParam === term.param) {
        const d1 = term.fn.derivative1(pVal);
        diffProduct = diffProduct*d0 + freeProduct * d1;
        freeProduct *= d0;
      } else {
        cnst *= d0;
      }
    }

    return cnst * diffProduct;
  }

  value(valueFn) {
    let res = this.constant;
    for (const t of this.terms) {
      res *= t.fn.apply(valueFn(t.param));
    }
    return res;
  }
}

export abstract class PolynomialFunction {

  id: string;
  abstract get degree(): number;
  abstract apply(x: number): number;
  abstract merge(fn: PolynomialFunction): PolynomialFunction;
  abstract derivative1(x: number): number
}

export class ToThePowerFunction extends PolynomialFunction {

  static get(degree) {
    switch (degree) {
      case 0: return POW_0_FN;
      case 1: return POW_1_FN;
      case 2: return POW_2_FN;
      case 3: return POW_3_FN;
      case 4: return POW_4_FN;
      default: return new ToThePowerFunction(degree,
        x => {
          let val = 1;
          for (let i = 0; i < degree; ++i) {
            val *= x;
          }
          return val
        },
        x => {
          let val = 1;
          for (let i = 0; i < degree - 1; ++i) {
            val *= x;
          }
          return degree * val
        }
      )
    }
  }

  _degree: number;
  fn: (number) => number;
  d1: (number) => number;

  constructor(degree, fn, d1) {
    super();
    this._degree = degree;
    this.fn = fn;
    this.d1 = d1;
    this.id = '^' + degree;
  }

  get degree() {
    return this._degree;
  }

  apply(x) {
    return this.fn(x);
  }

  merge(fn) {
    if (fn.constructor.name === this.constructor.name) {
      return ToThePowerFunction.get(fn.degree + this.degree);
    }
    return null;
  }

  derivative1(x) {
    return this.d1(x)
  }

  linearSubstitution(k, x, b) {
    // Current schemas use low nonnegative integer powers. Higher integral
    // powers remain bounded optional optimizations; all other functions keep
    // their original equations instead of inventing a coefficient heuristic.
    const n = this.degree;
    if (!Number.isSafeInteger(n) || n < 0 || n > 32 || ![k, b].every(Number.isFinite)) return null;
    const result = new Polynomial();
    let choose = 1;
    for (let power = 0; power <= n; power++) {
      const coefficient = choose * Math.pow(k, power) * Math.pow(b, n - power);
      if (!Number.isFinite(coefficient)) return null;
      if (coefficient === 0 && (power === 0 || k !== 0) && (n === power || b !== 0)) result.usedApproximateReduction = true;
      if (power === 0) result.constant = coefficient;
      else if (coefficient !== 0) result.monomial(coefficient).term(x, ToThePowerFunction.get(power));
      choose = choose * (n - power) / (power + 1);
    }
    return result;
  }

}


export class FreeFunction extends PolynomialFunction {

  fn: (number) => number;
  d1: (number) => number;
  linearSubstitutionFn: (k: number, param: any, b :number) => Polynomial;

  constructor(fn, d1, id, linearSubstitutionFn) {
    super();
    this.fn = fn;
    this.d1 = d1;
    this.id = id;
    this.linearSubstitutionFn = linearSubstitutionFn || null;
  }

  apply(x) {
    return this.fn(x);
  }

  get degree() {
    return Infinity;
  }

  merge(fn) {
    return null;
  }

  derivative1(x) {
    return this.d1(x)
  }

  linearSubstitution(k, x, b) {
    return this.linearSubstitutionFn ? this.linearSubstitutionFn(k, x, b) : null;
  }

}

export class CosineOfSum extends PolynomialFunction {

  k: number;
  b: number;

  constructor(k, b) {
    super();
    this.k = k;
    this.b = b;
    this.id = 'cos(' + k + 'x + ' + b + ')';
  }

  apply(x) {
    return Math.cos(this.k * x + this.b);
  }

  get degree() {
    return Infinity;
  }

  merge(fn) {
    return null;
  }

  derivative1(x) {
    return - this.k * Math.sin(this.k * x + this.b);
  }

  linearSubstitution(k, x, b) {
    const scale = this.k * k, offset = this.k * b + this.b;
    return [scale, offset].every(Number.isFinite) ? new Polynomial(0).monomial(1).term(x, new CosineOfSum(scale, offset)) : null;
  }

  render(x) {
    return 'cos(' + this.k.toFixed(2) + '*' + x + ' + ' + this.b.toFixed(2) + ')';
  }

}

export class SineOfSum extends PolynomialFunction {

  k: number;
  b: number;

  constructor(k, b) {
    super();
    this.k = k;
    this.b = b;
    this.id = 'sin(' + k + 'x + ' + b + ')';
  }

  apply(x) {
    return Math.sin(this.k * x + this.b);
  }

  get degree() {
    return Infinity;
  }

  merge(fn) {
    return null;
  }

  derivative1(x) {
    return this.k * Math.cos(this.k * x + this.b);
  }

  linearSubstitution(k, x, b) {
    const scale = this.k * k, offset = this.k * b + this.b;
    return [scale, offset].every(Number.isFinite) ? new Polynomial(0).monomial(1).term(x, new SineOfSum(scale, offset)) : null;
  }

  render(x) {
    return 'sin(' + this.k.toFixed(2) + '*' + x + ' + ' + this.b.toFixed(2) + ')';
  }
}

const GET_VALUE = param => param.get();

export const POW_0_FN = new ToThePowerFunction(0, x => 1, x => 0);
export const POW_1_FN = new ToThePowerFunction(1, x => x,  x => 1);
export const POW_2_FN = new ToThePowerFunction(2, x => x*x, x => 2*x);
export const POW_3_FN = new ToThePowerFunction(3, x => x*x*x, x => 3*x*x);
export const POW_4_FN = new ToThePowerFunction(4, x => x*x*x*x, x => 4*x*x*x);

export const COS_FN = new FreeFunction(x => Math.cos(x), x => -Math.sin(x) ,'cos', (k, x, b) => new Polynomial(0).monomial(1).term(x, new CosineOfSum(k, b)));
export const SIN_FN = new FreeFunction(x => Math.sin(x), x =>  Math.cos(x), 'sin', (k, x, b) => new Polynomial(0).monomial(1).term(x, new SineOfSum(k, b)));


