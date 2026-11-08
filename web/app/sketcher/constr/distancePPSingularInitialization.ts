import {ConstraintDefinitions} from './ANConstraints';
import {Polynomial, POW_1_FN, POW_2_FN} from './polynomial';
import {SolverParam} from './solverParam';
import {Param} from '../shapes/param';
import {EndPoint} from '../shapes/point';

// An initial value for the existing solver, never a success/admission result.
// Only one exact reduced Point-distance quadratic with actual free coordinates
// is covered. Other systems keep the ordinary solver and its truthful refusal.
const MAX_MONOMIALS = 1024, MAX_FREE = 4096, MAX_WORK = 100000, MAX_COORD = 1e9;
export function initializeSingularPointDistance(system, polynomials: Polynomial[], free: SolverParam[], residualCount: number): boolean {
  if (polynomials.length !== 1 || residualCount !== 1 || !free.length || free.length > MAX_FREE) return false;
  const polynomial = polynomials[0], constraint = system.polyToConstr.get(polynomial);
  if (!constraint || constraint.schema !== ConstraintDefinitions.DistancePP || constraint.stage?.algNumSystem !== system ||
      constraint.objects.length !== 2 || constraint.objects[0] === constraint.objects[1] ||
      constraint.objects.some(point => !(point instanceof EndPoint) || point.parent || point.generator || point.stage !== system.stage) ||
      !Number.isFinite(constraint.resolvedConstants?.distance) || constraint.resolvedConstants.distance <= 0 ||
      constraint.resolvedConstants.distance > 1e6 || polynomial.usedApproximateReduction ||
      !Number.isFinite(polynomial.constant) || !polynomial.monomials.length || polynomial.monomials.length > MAX_MONOMIALS) return false;

  // Actual current stage Point Params, not original constraint fields assumed
  // free. Affine elimination may leave a different Point as representative.
  const coordinates = new Set<Param>();
  let work = 0;
  for (const object of system.stage.objects) {
    if (++work > MAX_WORK) return false;
    if (object instanceof EndPoint && !object.parent && !object.generator) {
      coordinates.add(object.params.x); coordinates.add(object.params.y);
    }
  }
  const actual = new Map<Param, SolverParam>();
  for (const value of free) {
    if (++work > MAX_WORK) return false;
    const param = value.objectParam;
    if (actual.has(param) || value.constant !== false || !Number.isSafeInteger(value.j) || value.j < 0 ||
        !coordinates.has(param) || param.normalizer || param.enforceVisualLimit || param.constraints?.length ||
        system.eliminatedParams.has(param) || system.substitutedParams.has(param) || !Number.isFinite(param.get())) return false;
    actual.set(param, value);
  }
  // No finite differences or opaque-function approximations: the retained row
  // must still be a genuine degree<=2 polynomial of these actual coordinates.
  const used = new Set<Param>();
  for (const monomial of polynomial.monomials) {
    if (++work > MAX_WORK || !Number.isFinite(monomial.constant)) return false;
    let degree = 0;
    for (const term of monomial.terms) {
      if (++work > MAX_WORK || (term.fn !== POW_1_FN && term.fn !== POW_2_FN)) return false;
      degree += term.fn === POW_2_FN ? 2 : 1;
      if (degree > 2 || (!actual.has(term.param) && term.param.solverParam.constant !== true)) return false;
      if (actual.has(term.param)) used.add(term.param);
    }
  }
  if (!used.size) return false;
  const residual = polynomial.value();
  if (!Number.isFinite(residual) || residual >= 0) return false;
  for (const param of used) {
    let gradient = 0;
    for (const monomial of polynomial.monomials) {
      if (++work > MAX_WORK) return false;
      gradient += monomial.differentiate(param);
    }
    if (!Number.isFinite(gradient) || gradient !== 0) return false;
  }
  // The direct B axes win when free; aliases use the canonical actual matrix
  // order. No debug IDs, randomness or imposed persisted direction flag.
  const [a,b] = constraint.objects;
  const ordered = [...new Set<Param>([b.params.x,b.params.y,a.params.x,a.params.y,...free.map(v => v.objectParam)])];
  for (const param of ordered) {
    if (!actual.has(param) || !used.has(param)) continue;
    let curvature = 0;
    for (const monomial of polynomial.monomials) {
      if (++work > MAX_WORK) return false;
      let power = 0, coefficient = monomial.constant;
      for (const term of monomial.terms) {
        if (++work > MAX_WORK) return false;
        if (term.param === param) power += term.fn === POW_2_FN ? 2 : 1;
        else coefficient *= term.fn.apply(term.param.get());
      }
      if (power === 2) curvature += coefficient;
    }
    if (!Number.isFinite(curvature) || curvature <= 0) continue;
    const square = -residual / curvature;
    if (!Number.isFinite(square) || square <= 0) continue;
    const displacement = Math.sqrt(square), before = param.get(), seeded = before + displacement;
    if (!Number.isFinite(displacement) || displacement <= 0 || !Number.isFinite(seeded) || Math.abs(seeded) > MAX_COORD || Object.is(seeded,before)) continue;
    // Before Isolation copies object values into SolverParams: ordinary LM
    // fallback rollback consequently retains this same seed. Only this actual
    // free representative is changed; normal substitution reconstructs aliases.
    param.set(seeded);
    return true;
  }
  return false;
}
