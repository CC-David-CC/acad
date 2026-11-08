import {admissionCause,causeForSolveStatus,withAdmissionCause} from './admissionCause.mjs';
import {prepare} from "./solver";
import {eqEps} from "geom/tolerance";
import {Polynomial, POW_1_FN} from "./polynomial";
import {AlgNumConstraint, ConstraintDefinitions} from "./ANConstraints";
import {SolverParam} from "./solverParam";
import {initializeSingularPointDistance} from './distancePPSingularInitialization';
import {directionalRelation,directionalSegments,directionalRelationValid,directionalSegmentNonzero} from './lineRelationDomain.mjs';
import {noteSketchMutation} from '../sketchMutationEpoch.mjs';
import {assertRetainedStageValid} from '../rigid/rigidGroupDomain.mjs';

const DEBUG = false;
// A projected direction needs a synchronous rollback snapshot for interactive
// drags. Refuse this specific feature outside the measured bounded workspace;
// this is not a general sketch or Files size limit.
const PROJECTED_MAX_OBJECTS = 6000;
const PROJECTED_MAX_CONSTRAINTS = 6000;
const PROJECTED_MAX_PARAMS = 32768;
const PROJECTED_MAX_PARAM_VISITS = 65536;
const PROJECTED_LIMIT_ERROR = 'Directional relation exceeds the interactive rollback limit.';

export class AlgNumSubSystem {

  allConstraints = [];
  // Legacy field names also cover the other live-direction relations.
  projectedConstraintCount = 0;

  paramToIsolation = new Map();

  eliminatedParams = new Map();

  polynomials = [];
  substitutedParams = new Map();
  substitutionOrder = [];

  polyToConstr = new Map();

  conflicting = new Set<AlgNumConstraint>();
  redundant  = new Set<AlgNumConstraint>();
  // Object-keyed and ephemeral: discarded with the trial/owner, never saved.
  rejectionCauses = new Map<AlgNumConstraint,any>();

  getAdmissionCause(constraint) {
    if (constraint?.stage?.solverSystem !== this || !this.allConstraints.includes(constraint) || !this.conflicting.has(constraint) || this.redundant.has(constraint)) return undefined;
    return this.rejectionCauses.get(constraint) || admissionCause('unclassified-rejection');
  }

  admissionFailureCause(constraints, finite = true, solved = true) {
    for (const c of constraints) {
      const cause = this.getAdmissionCause(c);
      if (cause && cause.kind !== 'unclassified-rejection') return cause;
    }
    if (!finite) return admissionCause('nonfinite-result');
    return (solved && causeForSolveStatus(this.solveStatus)) || admissionCause('unclassified-rejection');
  }

  interactiveParams = new Set();

  controlBounds = false;

  snapshot = new Map();

  externalConflictValues = new Map();

  inTransaction = false;

  transactionBefore: any = null;
  projectedLastValid: Map<any,number> = null;

  visualLimit = 100;

  stage = null;

  // No rank-qualified subsystem DOF calculation is available yet.
  dof: number | null = null;

  requiresHardSolve: boolean = false;

  polynomialIsolations: Isolation[];

  calcVisualLimit: () => number;

  expressionResolver: (string) => any;

  solveStatus: SolveStatus;

  constructor(calcVisualLimit, expressionResolver, stage) {

    this.calcVisualLimit = calcVisualLimit;
    this.expressionResolver = expressionResolver;
    this.stage = stage;

    this.solveStatus = {
      error: 0,
      success: true
    }

  }

  get ownTopObjects() {
    return this.stage.objects;
  }

  get fullyConstrained() {
    return this.dof === null ? null : this.dof === 0;
  }

  owns(obj) {
    return this.stage === obj.stage;
  }

  validConstraints(callback) {
    // Intrinsic equations are regenerated before authored rows on cold load,
    // but a warm append registers its intrinsic rows later. Derive the same
    // stable evaluation order without mutating stored/authored row order.
    for (const internal of [true, false]) {
      for (const c of this.allConstraints) {
        if (!!c.internal === internal && !this.conflicting.has(c)) callback(c);
      }
    }
  }

  addConstraint(constraint) {
    // Keep every retained relation discoverable for object deletion, including
    // those presently rejected or redundant. A transaction defers admission.
    noteSketchMutation();
    if (this.inTransaction) this.trackTransactionConstraint(constraint);
    constraint.objects.forEach(o => o.constraints.add(constraint));
    this.allConstraints.push(constraint);
    if(directionalRelation(constraint))this.projectedConstraintCount++;
    if (this.inTransaction) return;
    try {
      this.admitOne(constraint);
    } catch (error) {
      this._removeConstraint(constraint);
      throw error;
    }
  }

  recordAdmissionHints() {
    for (const c of this.allConstraints) {
      // Internal hints are not serialized and cannot be hidden warm-only
      // priority state. Actual internal conflict/redundancy stays derived.
      if (c.internal) delete c.admissionHint;
      else c.admissionHint = {version: 1, state: this.redundant.has(c) ? 'redundant' : this.conflicting.has(c) ? 'rejected' : 'accepted'};
    }
    this.externalConflictValues = new Map();
    for (const c of this.conflicting) {
      c.objects.forEach(o => {
        if (!this.owns(o)) o.visitParams(p => this.externalConflictValues.set(p, p.get()));
      });
    }
  }

  // A deliberately narrow algebraic proof, not a numerical rank estimate:
  // two previously admitted point locks fix the endpoints of this segment.
  // Consequently their distance is fixed on the current positive-t branch. Only use
  // locks which are still satisfied and non-rejected, with exactly matching
  // represented values; leave all uncertain cases to ordinary admission.
  impliedByLockedEndpoints(candidate, prior) {
    if (candidate.schema !== ConstraintDefinitions.SegmentLength || candidate.objects.length !== 1) return false;
    const segment = candidate.objects[0] as any;
    if (!segment || !segment.a || !segment.b || segment.a === segment.b) return false;
    // The endpoint locks imply t only when the segment's polar relationship
    // is itself among the previously admitted relationships.
    if (!prior.some(c => c.schema === ConstraintDefinitions.Polar && c.objects.length === 3 &&
        c.objects[0] === segment && c.objects[1] === segment.a && c.objects[2] === segment.b)) return false;
    const close = (a, b) => Number.isFinite(a) && Number.isFinite(b) && a === b;
    const numeric = value => {
      const resolved = this.expressionResolver(value);
      if (typeof resolved === 'number') return resolved;
      if (typeof resolved !== 'string' || !resolved.trim()) return NaN;
      const parsed = Number(resolved);
      // Match the existing constraint resolver's parseFloat semantics rather
      // than proving an equation with a different interpretation of its input.
      return Number.isFinite(parsed) && parseFloat(resolved) === parsed ? parsed : NaN;
    };
    const locked = point => {
      const matches = prior.filter(c => c.schema === ConstraintDefinitions.LockPoint && c.objects.length === 1 && c.objects[0] === point);
      if (!matches.length) return null;
      let result = null;
      for (const c of matches) {
        const x = numeric(c.constants && c.constants.x);
        const y = numeric(c.constants && c.constants.y);
        if (!close(x, point.x) || !close(y, point.y)) return null;
        if (result && (!close(result.x, x) || !close(result.y, y))) return null;
        result = {x, y};
      }
      return result;
    };
    const a = locked(segment.a), b = locked(segment.b);
    if (!a || !b) return false;
    const length = numeric(candidate.constants && candidate.constants.length);
    const fixedLength = Math.hypot(b.x - a.x, b.y - a.y);
    // SegmentLength constrains the internal signed t parameter. Exclude the
    // zero and reversed branches, where distance alone would not prove t.
    return length > 0 && fixedLength > 0 && close(length, fixedLength) && close(segment.t, fixedLength);
  }

  // Research only: use the already-admitted set as the stable priority for a
  // single new relation. Bulk restore and removal still use full readmission.
  admitOne(candidate) {
    const previousConflicts = new Set(this.conflicting), previousRedundant = new Set(this.redundant), previousCauses = new Map(this.rejectionCauses);
    const accepted = this.allConstraints.filter(c => c !== candidate && !previousConflicts.has(c));
    const snapshot = new Map();
    for (const c of this.allConstraints) {
      c.params.forEach(p => snapshot.set(p, p.get()));
      c.objects.forEach(o => o.visitParams(p => snapshot.set(p, p.get())));
    }
    const restore = () => snapshot.forEach((v, p) => p.set(v));
    try {
      if (candidate.schema === ConstraintDefinitions.SegmentLength && this.impliedByLockedEndpoints(candidate,
          this.allConstraints.filter(c => c !== candidate && (!previousConflicts.has(c) || previousRedundant.has(c))))) {
        this.conflicting = new Set([...previousConflicts, candidate]);
        this.redundant = new Set([...previousRedundant, candidate]);
        this.rejectionCauses.delete(candidate);
        this.recordAdmissionHints();
        return;
      }
      this.prepareRaw();
      let candidateRedundant = this.redundant.has(candidate);
      let attemptedSolve = false;
      let rejected = accepted.some(c => this.conflicting.has(c)) || (this.conflicting.has(candidate) && !candidateRedundant);
      if (!rejected && !candidateRedundant) {
        attemptedSolve = true;
        this.solveFineForAdmission();
        candidateRedundant = this.redundant.has(candidate);
        rejected = !this.solveStatus.success || [...snapshot.keys()].some(p => !Number.isFinite(p.get())) ||
          accepted.some(c => this.conflicting.has(c)) || (this.conflicting.has(candidate) && !candidateRedundant);
      }
      const cause = rejected ? this.admissionFailureCause([candidate, ...accepted], [...snapshot.keys()].every(p => Number.isFinite(p.get())), attemptedSolve) : undefined;
      if (rejected || candidateRedundant) {
        restore();
        this.rejectionCauses = new Map(previousCauses);
        this.conflicting = new Set([...previousConflicts, candidate]);
        this.redundant = new Set(previousRedundant);
        if (candidateRedundant && !rejected) this.redundant.add(candidate);
        this.prepareRaw();
      }
      if (cause) this.rejectionCauses.set(candidate,cause);
      else this.rejectionCauses.delete(candidate);
      this.updateFullyConstrainedObjects();
      // Direct admission can move a rigid group while satisfying a new
      // external constraint. Future rejected drags must restore that newly
      // accepted state, not the state before the external constraint.
      if (this.projectedRelations().some(c => c.schema.id === 'RigidGroup')) this.rememberProjectedState();
      this.recordAdmissionHints();
    } catch (error) {
      restore();
      this.conflicting = new Set([...previousConflicts, candidate]);
      this.redundant = previousRedundant;
      this.rejectionCauses = previousCauses;
      try { this.prepareRaw(); } catch (_) { /* preserve original error */ }
      throw error;
    }
  }

  revalidateConstraint(constraint) {
    this.conflicting.delete(constraint);
    this.redundant.delete(constraint);
    this.rejectionCauses.delete(constraint);
  }

  startTransaction() {
    if (this.inTransaction || this.transactionBefore) throw new Error('Nested constraint transactions are not supported');
    this.transactionBefore = {
      constraints: [...this.allConstraints], conflicting: new Set(this.conflicting), redundant: new Set(this.redundant),
      values: new Map(), solverParams: new Map(), objectStates: new Map(), hints: new Map(),
      derived: {
        polynomials: this.polynomials, substitutedParams: new Map(this.substitutedParams),
        substitutionOrder: this.substitutionOrder, eliminatedParams: new Map(this.eliminatedParams),
        paramToIsolation: new Map(this.paramToIsolation), polyToConstr: new Map(this.polyToConstr),
        polynomialIsolations: this.polynomialIsolations, interactiveParams: new Set(this.interactiveParams),
        requiresHardSolve: this.requiresHardSolve, visualLimit: this.visualLimit,
        solveStatus: {...this.solveStatus}, rejectionCauses: new Map(this.rejectionCauses), externalConflictValues: new Map(this.externalConflictValues),
        projectedLastValid:this.projectedLastValid && new Map(this.projectedLastValid)
      }
    };
    try {
      this.stage.objects.forEach(o => {
        if (typeof o.visitParams === 'function') this.trackTransactionObject(o);
      });
      this.allConstraints.forEach(c => this.trackTransactionConstraint(c));
    } catch (error) {
      this.transactionBefore = null;
      throw error;
    }
    this.inTransaction = true;
  }

  trackTransactionConstraint(constraint) {
    const before = this.transactionBefore;
    if (!before) return;
    if (!before.hints.has(constraint)) before.hints.set(constraint, constraint.admissionHint);
    constraint.params.forEach(p => this.trackTransactionParam(p));
    constraint.objects.forEach(o => this.trackTransactionObject(o));
  }

  trackTransactionParam(p) {
    const before = this.transactionBefore;
    if (before && !before.values.has(p)) {
      before.values.set(p, p.get());
      before.solverParams.set(p, p.solverParam && {...p.solverParam});
    }
  }

  trackTransactionObject(o) {
    const before = this.transactionBefore;
    if (!before) return;
    if (!before.objectStates.has(o)) before.objectStates.set(o, o.fullyConstrained);
    o.visitParams(p => this.trackTransactionParam(p));
  }

  rollbackTransaction() {
    const before = this.transactionBefore;
    if (!before) { this.inTransaction = false; return; }
    noteSketchMutation();
    this.inTransaction = false;
    for (const c of this.allConstraints) {
      if (!before.constraints.includes(c)) c.objects.forEach(o => o.constraints.delete(c));
    }
    this.allConstraints = before.constraints;
    this.projectedConstraintCount=this.allConstraints.filter(directionalRelation).length;
    before.constraints.forEach(c => c.objects.forEach(o => o.constraints.add(c)));
    this.conflicting = before.conflicting;
    this.redundant = before.redundant;
    before.values.forEach((value, p) => p.set(value));
    Object.assign(this, before.derived);
    before.solverParams.forEach((value, p) => { if (value) Object.assign(p.solverParam, value); });
    before.objectStates.forEach((value, o) => { o.fullyConstrained = value; });
    before.hints.forEach((value, c) => { c.admissionHint = value; });
    this.transactionBefore = null;
  }

  finishTransaction(keepSnapshot = false) {
    this.inTransaction = false;
    try {
      this.rebuildAdmission();
      this.rememberProjectedState();
      if (!keepSnapshot) this.transactionBefore = null;
    } catch (error) {
      if (!keepSnapshot) this.rollbackTransaction();
      throw error;
    }
  }


  invalidate() {
    this.rebuildAdmission();
  }

  removeConstraint(constraint) {
    if (this.inTransaction) {
      this._removeConstraint(constraint);
      return;
    }
    // Removing an external relation may also move a rigid group during
    // readmission. Keep the same rollback boundary as grouped operations and
    // refresh the accepted drag snapshot only after successful readmission.
    if (this.allConstraints.some(c => c.schema.id === 'RigidGroup')) {
      if (this.transactionBefore) {
        this._removeConstraint(constraint); this.rebuildAdmission(); this.rememberProjectedState();
        return;
      }
      this.startTransaction();
      try { this._removeConstraint(constraint); this.finishTransaction(); }
      catch (error) { this.rollbackTransaction(); throw error; }
      return;
    }
    const before = [...this.allConstraints], conflicts = new Set(this.conflicting), redundant = new Set(this.redundant), causes = new Map(this.rejectionCauses);
    this._removeConstraint(constraint);
    try {
      this.invalidate();
      if (!this.projectedConstraintCount) this.projectedLastValid = null;
    }
    catch (error) {
      this.allConstraints = before;
      this.projectedConstraintCount=this.allConstraints.filter(directionalRelation).length;
      this.conflicting = conflicts;
      this.redundant = redundant;
      this.rejectionCauses = causes;
      constraint.objects.forEach(o => o.constraints.add(constraint));
      throw error;
    }
  }

  _removeConstraint(constraint) {
    const index = this.allConstraints.indexOf(constraint);
    if (index !== -1) {
      noteSketchMutation();
      this.allConstraints.splice(index, 1);
      if(directionalRelation(constraint))this.projectedConstraintCount--;
      this.conflicting.delete(constraint);
      this.redundant.delete(constraint);
      this.rejectionCauses.delete(constraint);
      constraint.objects.forEach(o => o.constraints.delete(constraint));
    }
  }

  // Research prototype: admit whole constraints in deterministic priority
  // order, never retaining a partial equation from a rejected candidate.
  rebuildAdmission() {
    const originalConflicting = new Set(this.conflicting);
    const originalRedundant = new Set(this.redundant);
    // Intrinsics have the same derived priority warm or cold. Retain the
    // existing authored accepted/legacy/retry precedence and source row order.
    const internal = this.allConstraints.filter(c => c.internal);
    const authored = this.allConstraints.filter(c => !c.internal);
    const hinted = authored.filter(c => !originalConflicting.has(c) && c.admissionHint && c.admissionHint.state === 'accepted');
    const legacy = authored.filter(c => !originalConflicting.has(c) && !c.admissionHint);
    const retry = authored.filter(c => originalConflicting.has(c) || (c.admissionHint && c.admissionHint.state !== 'accepted'));
    const candidates = [...internal, ...hinted, ...legacy, ...retry];
    const original = new Map();
    const oldDerived = {
      polynomials: this.polynomials, substitutedParams: new Map(this.substitutedParams),
      substitutionOrder: this.substitutionOrder, eliminatedParams: new Map(this.eliminatedParams),
      paramToIsolation: new Map(this.paramToIsolation), polyToConstr: new Map(this.polyToConstr),
      polynomialIsolations: this.polynomialIsolations, interactiveParams: new Set(this.interactiveParams),
      requiresHardSolve: this.requiresHardSolve, visualLimit: this.visualLimit,
      solveStatus: {...this.solveStatus}, rejectionCauses: new Map(this.rejectionCauses), externalConflictValues: new Map(this.externalConflictValues)
    };
    const objectStates = new Map();
    for (const c of candidates) {
      c.objects.forEach(o => objectStates.set(o, o.fullyConstrained));
      c.params.forEach(p => original.set(p, p.get()));
      c.objects.forEach(o => o.visitParams(p => original.set(p, p.get())));
    }
    const solverBefore = new Map([...original.keys()].map(p => [p, p.solverParam && {value: p.solverParam.value, constant: p.solverParam.constant, j: p.solverParam.j}]));
    const capture = () => new Map([...original.keys()].map(p => [p, p.get()]));
    const restore = values => values.forEach((v, p) => p.set(v));
    const finite = () => [...original.keys()].every(p => Number.isFinite(p.get()));
    let accepted = [];
    const rejected = new Set<AlgNumConstraint>();
    const redundant = new Set<AlgNumConstraint>();
    const rejectedCauses = new Map<AlgNumConstraint,any>();
    try {
      // Fast path for a clean, previously unambiguous set: one tentative build.
      // Any actual conflict, failure or non-finite result restores the snapshot
      // and falls back to deterministic whole-constraint admission.
      if (!authored.some(c => originalConflicting.has(c)) && !authored.some(c => c.admissionHint && c.admissionHint.state !== 'accepted')) {
        this.conflicting = new Set();
        this.redundant = new Set();
        this.rejectionCauses = new Map();
        this.prepareRaw();
        const bad = [...this.conflicting].some(c => !this.redundant.has(c));
        if (!bad) {
          this.solveFineForAdmission();
          const badAfterSolve = [...this.conflicting].some(c => !this.redundant.has(c));
          if (this.solveStatus.success && finite() && !badAfterSolve) {
            this.updateFullyConstrainedObjects();
            this.recordAdmissionHints();
            return;
          }
        }
        restore(original);
      }
      // Independent point locks have a unique result per parameter, so their
      // accepted order cannot affect the solution. Trial only that narrowly
      // defined set together before retrying rejected constraints; arbitrary
      // nonlinear or connected constraints retain ordered replay. If the
      // trial fails, discard its geometry and use the complete replay.
      const lockedParams = new Set();
      const independentLocks = internal.length === 0 && hinted.every(c => {
        if (c.schema !== ConstraintDefinitions.LockPoint || c.params.length !== 2) return false;
        for (const p of c.params) {
          if (lockedParams.has(p)) return false;
          lockedParams.add(p);
        }
        return true;
      });
      if (hinted.length && independentLocks && !legacy.length && retry.length) {
        this.conflicting = new Set(retry);
        this.redundant = new Set();
        this.rejectionCauses = new Map();
        this.prepareRaw();
        if (!hinted.some(c => this.conflicting.has(c))) {
          this.solveFineForAdmission();
          if (this.solveStatus.success && finite() && !hinted.some(c => this.conflicting.has(c))) {
            accepted = [...hinted];
          }
        }
        if (!accepted.length) restore(original);
      }
      // A legacy bulk load may contain many unrelated point locks plus a
      // conflicting pair. Batch only locks whose parameters occur nowhere
      // else in the entire candidate set; every interacting lock stays in
      // authored order for ordinary admission. Restrict this to the built-in
      // lock schema to avoid changing nonlinear branch or custom semantics.
      if (internal.length === 0 && !accepted.length && candidates.every(c => c.schema === ConstraintDefinitions.LockPoint && c.params.length === 2)) {
        const uses = new Map();
        candidates.forEach(c => c.params.forEach(p => uses.set(p, (uses.get(p) || 0) + 1)));
        const isolated = [...hinted, ...legacy].filter(c => c.params.every(p => uses.get(p) === 1));
        if (isolated.length) {
          const isolatedSet = new Set(isolated);
          this.conflicting = new Set(candidates.filter(c => !isolatedSet.has(c)));
          this.redundant = new Set();
          this.rejectionCauses = new Map();
          this.prepareRaw();
          if (!isolated.some(c => this.conflicting.has(c))) {
            this.solveFineForAdmission();
            if (this.solveStatus.success && finite() && !isolated.some(c => this.conflicting.has(c))) {
              accepted = isolated;
            }
          }
          if (!accepted.length) restore(original);
        }
      }
      for (const candidate of candidates.filter(c => !accepted.includes(c))) {
        const checkpoint = capture();
        if (candidate.schema === ConstraintDefinitions.SegmentLength && this.impliedByLockedEndpoints(candidate, [...accepted, ...redundant])) {
          redundant.add(candidate);
          continue;
        }
        // Only prior accepted constraints and the current candidate can affect
        // this trial; all remaining candidates are excluded from the system.
        this.conflicting = new Set(candidates.filter(c => !accepted.includes(c) && c !== candidate));
        this.redundant = new Set();
        this.rejectionCauses = new Map();
        this.prepareRaw();
        const oldRejected = accepted.some(c => this.conflicting.has(c));
        let candidateRedundant = this.redundant.has(candidate);
        let attemptedSolve = false;
        let failed = oldRejected || (this.conflicting.has(candidate) && !candidateRedundant);
        if (!failed && !candidateRedundant) {
          attemptedSolve = true;
          this.solveFineForAdmission();
          candidateRedundant = this.redundant.has(candidate);
          failed = !this.solveStatus.success || !finite() || accepted.some(c => this.conflicting.has(c)) ||
            (this.conflicting.has(candidate) && !candidateRedundant);
        }
        if (failed) {
          rejectedCauses.set(candidate,this.admissionFailureCause([candidate,...accepted],finite(),attemptedSolve));
          restore(checkpoint);
          rejected.add(candidate);
        } else if (candidateRedundant) {
          restore(checkpoint);
          redundant.add(candidate);
        } else {
          accepted.push(candidate);
        }
      }
      this.conflicting = new Set([...rejected, ...redundant]);
      this.redundant = redundant;
      this.rejectionCauses = rejectedCauses;
      this.prepareRaw();
      this.solveFineForAdmission();
      if (!this.solveStatus.success || !finite()) throw withAdmissionCause(new Error('Accepted constraint system failed to solve'),causeForSolveStatus(this.solveStatus));
      this.updateFullyConstrainedObjects();
      this.recordAdmissionHints();
    } catch (error) {
      restore(original);
      this.conflicting = originalConflicting;
      this.redundant = originalRedundant;
      Object.assign(this, oldDerived);
      solverBefore.forEach((value, p) => { if (value) Object.assign(p.solverParam, value); });
      objectStates.forEach((value, o) => { o.fullyConstrained = value; });
      throw error;
    }
  }

  isConflicting(constraint) {
    return this.conflicting.has(constraint);
  }

  makeSnapshot() {
    this.snapshot.clear();
    this.validConstraints(c => c.params.forEach(p => this.snapshot.set(p, p.get())));
  }

  rollback() {
    this.snapshot.forEach((val, param) => param.set(val));
  }

  reset() {
    this.polyToConstr.clear();
    this.interactiveParams.clear();
    this.requiresHardSolve = false;
  }

  evaluatePolynomials() {

    const polynomialCounts = new Map();
    const redundantCounts = new Map();
    // Rebuilt for this retained/trial system, including active redundant
    // direction requirements. A current value alone is not a certificate.
    const nonzeroDirectionParams = new Set();
    for (const constraint of this.projectedRelations()) {
      if (constraint.stage?.algNumSystem !== this) continue;
      for (const segment of directionalSegments(constraint)) {
        if (directionalSegmentNonzero(segment)) nonzeroDirectionParams.add(segment.params.t);
      }
    }
    // Transitive proof provenance is local to this build. A substituted or
    // eliminated parameter may acquire an approximate ancestor after its
    // first alias was recorded; propagate to a fixed point before certifying
    // any final row. Unrelated equations are not ancestors of that row.
    const approximateParams = new Set();
    const inheritReductionProvenance = () => {
      const inherit = p => {
        p.visitParams(param => { if (approximateParams.has(param)) p.usedApproximateReduction = true; });
      };
      let changed;
      do {
        changed = false;
        this.substitutedParams.forEach((p, param) => {
          inherit(p);
          if (p.usedApproximateReduction && !approximateParams.has(param)) {
            approximateParams.add(param); changed = true;
          }
        });
      } while (changed);
      this.polynomials.forEach(p => { if (p) inherit(p); });
    };

    this.validConstraints(c => {
      this.rejectionCauses.delete(c);
      let i = this.polynomials.length;
      c.collectPolynomials(this.polynomials);
      polynomialCounts.set(c, this.polynomials.length - i);
      for (; i<this.polynomials.length; i++) {
        const polynomial = this.polynomials[i];
        this.polyToConstr.set(polynomial, c);

        c.objects.forEach(obj => {
          if (!this.owns(obj)) {
            obj.visitParams(p => {
              polynomial.eliminate(p, p.get());
            });
          }
        });
        polynomial.compact();
      }
    });

    inheritReductionProvenance();

    if (DEBUG) {
      console.log('reducing system(of', this.polynomials.length, '):');
      this.polynomials.forEach(p => console.log(p.toString()));
    }

    let requirePass = true;

    while (requirePass) {
      requirePass = false;
      for (let i = 0; i < this.polynomials.length; ++i) {
        const polynomial = this.polynomials[i];
        if (!polynomial) {
          continue;
        }

        if (polynomial.monomials.length === 0) {
          const constraint = this.polyToConstr.get(polynomial);
          if (DEBUG) {
            console.log("CONFLICT: " + polynomial.toString());
          }
          if (eqEps(polynomial.constant, 0)) {
            if (polynomial.constant !== 0) {
              polynomial.usedApproximateReduction = true;
            }
            redundantCounts.set(constraint, (redundantCounts.get(constraint) || 0) + 1);
          } else {
            this.conflicting.add(constraint);
            this.rejectionCauses.set(constraint,admissionCause(!Number.isFinite(polynomial.constant) ? 'nonfinite-result' : polynomial.usedApproximateReduction ? 'approximate-reduction-rejection' : 'algebraic-contradiction'));
          }
          this.polynomials[i] = null;
        } else if (polynomial.isLinear && polynomial.monomials.length === 1) {
          this.polynomials[i] = null;
          const monomial = polynomial.monomials[0];
          const terms = monomial.terms;
          if (terms.length === 1) {
            const term = terms[0];
            if (term.fn.degree === 1) {
              const p = term.param;
              const val = - polynomial.constant / monomial.constant;
              p.set(val);

              this.eliminatedParams.set(p, val);
              if (polynomial.usedApproximateReduction) approximateParams.add(p);

              for (const otherPolynomial of this.polynomials) {
                if (otherPolynomial) {
                  otherPolynomial.eliminate(p, val, polynomial.usedApproximateReduction);
                }
              }

              requirePass = true;
            }
          }

        } else if (polynomial.monomials.length === 2 && polynomial.isLinear) {
          let [m1, m2] = polynomial.monomials;

          if (this.interactiveParams.has(m1.linearParam)) {
            const t = m1;
            m1 = m2;
            m2 = t;
          }

          const p1 = m1.linearParam;
          const p2 = m2.linearParam;

          const constant = - m2.constant / m1.constant;
          const discardOffset = eqEps(polynomial.constant, 0);
          const b = discardOffset ? 0 : -polynomial.constant / m1.constant;
          // A nonzero ratio/offset which underflows must not become an exact
          // zero alias. Retain the original equation for numerical solving.
          if (Number.isFinite(constant) && Number.isFinite(b) &&
              !(constant === 0 && m2.constant !== 0) &&
              !(b === 0 && !discardOffset && polynomial.constant !== 0)) {
            const approximateSource = polynomial.usedApproximateReduction ||
              (discardOffset && polynomial.constant !== 0);
            const transactions = [];
            let supported = true;
            for (const otherPolynomial of this.polynomials) {
              if (!otherPolynomial || otherPolynomial === polynomial) continue;
              const transaction = otherPolynomial.linearSubstitution(p1, p2, constant, b, approximateSource);
              if (!transaction) { supported = false; break; }
              transactions.push(transaction);
            }
            if (supported) {
              for (const transaction of transactions) transaction();
              const replacement = new Polynomial(b).monomial(constant).term(p2, POW_1_FN);
              replacement.usedApproximateReduction = approximateSource;
              this.substitute(p1, replacement);
              this.polynomials[i] = null;
              requirePass = true;
            }
          }
        }
        // A reduction can make an earlier polynomial linear. Revisit that
        // prior row before a later relation becomes the substitution pivot;
        // otherwise dependency credit can move to the earlier constraint.
        // Admission retains the existing numerical-algebraic zero tolerance.
        if (requirePass) break;
      }

      if (requirePass) {
        this.polynomials.forEach(polynomial => polynomial && polynomial.compact());
        inheritReductionProvenance();
      }
    }

    // Only after ALL substitutions have finished is their complete proof
    // provenance known. Do not run further algebraic substitution passes
    // after cancellation: the numerical solver handles the resulting rows.
    // Thus a later approximate ancestor cannot retroactively invalidate an
    // earlier exact cancellation.
    inheritReductionProvenance();
    this.polynomials.forEach(p => {
      if (p) p.cancelCommonNonzeroFactors(nonzeroDirectionParams);
    });

    // A multi-equation constraint remains active when only some equations
    // are implied; its remaining independent equations must not be dropped.
    for (const [constraint, count] of redundantCounts) {
      if (count === polynomialCounts.get(constraint) && !this.conflicting.has(constraint)) {
        this.conflicting.add(constraint);
        this.redundant.add(constraint);
      }
    }

    this.polynomials = this.polynomials.filter(p => p);

  }

  substitute(param, overPolynomial) {
    this.substitutionOrder.push(param);
    this.substitutedParams.set(param, overPolynomial);
  }


  admissionSolve = false;

  solveFineForAdmission() {
    const previous = this.admissionSolve;
    this.admissionSolve = true;
    try { this.solveFine(); } finally { this.admissionSolve = previous; }
  }

  // Preparation can discover a newly conflicting multi-equation relation
  // after earlier equations have already modified parameters and reductions.
  // Restore the pre-build values and readmit complete constraints before
  // allowing those reductions to be used by the interactive solver.
  atomicReclassification(build, interactiveObjects = null) {
    const before = new Map();
    const objectStates = new Map(), hints = new Map();
    for (const c of this.allConstraints) {
      hints.set(c, c.admissionHint);
      c.params.forEach(p => before.set(p, p.get()));
      c.objects.forEach(o => {
        objectStates.set(o, o.fullyConstrained);
        o.visitParams(p => before.set(p, p.get()));
      });
    }
    const oldConflicting = new Set(this.conflicting), oldRedundant = new Set(this.redundant);
    const oldDerived = {
      polynomials: this.polynomials, substitutedParams: new Map(this.substitutedParams),
      substitutionOrder: this.substitutionOrder, eliminatedParams: new Map(this.eliminatedParams),
      paramToIsolation: new Map(this.paramToIsolation), polyToConstr: new Map(this.polyToConstr),
      polynomialIsolations: this.polynomialIsolations, interactiveParams: new Set(this.interactiveParams),
      requiresHardSolve: this.requiresHardSolve, visualLimit: this.visualLimit,
      solveStatus: {...this.solveStatus}, rejectionCauses: new Map(this.rejectionCauses), externalConflictValues: new Map(this.externalConflictValues)
    };
    const oldSolver = new Map([...before.keys()].map(p => [p, p.solverParam && {...p.solverParam}]));
    const restore = () => before.forEach((value, p) => p.set(value));
    const checkFinite = () => {
      if ([...before.keys()].some(p => !Number.isFinite(p.get()))) {
        throw new Error('Constraint preparation produced non-finite geometry');
      }
    };
    try {
      build();
      checkFinite();
      const newlyConflicting = [...this.conflicting].some(c => !oldConflicting.has(c) && !this.redundant.has(c));
      if (newlyConflicting) {
        restore();
        this.rebuildAdmission();
        const admittedConflicts = new Set(this.conflicting);
        if (interactiveObjects !== null) this.prepareRaw(interactiveObjects);
        else this.prepareRaw([], oldDerived.interactiveParams);
        checkFinite();
        if ([...this.conflicting].some(c => !admittedConflicts.has(c) && !this.redundant.has(c))) {
          throw new Error('Constraint system changed during reclassification');
        }
      }
    } catch (error) {
      restore();
      this.conflicting = oldConflicting;
      this.redundant = oldRedundant;
      Object.assign(this, oldDerived);
      oldSolver.forEach((value, p) => { if (value) Object.assign(p.solverParam, value); });
      objectStates.forEach((value, o) => { o.fullyConstrained = value; });
      hints.forEach((value, c) => { c.admissionHint = value; });
      throw error;
    }
  }

  prepare(interactiveObjects = []) {
    this.atomicReclassification(() => this.prepareRaw(interactiveObjects), interactiveObjects);
  }

  prepareRaw(interactiveObjects = [], retainedInteractiveParams = null) {

    this.reset();
    interactiveObjects.forEach(obj => obj.visitParams(p => this.interactiveParams.add(p)));
    if (retainedInteractiveParams) retainedInteractiveParams.forEach(p => this.interactiveParams.add(p));

    this.validConstraints(c => c.objects.forEach(obj => {
      if (!this.owns(obj)) {
        this.requiresHardSolve = true;
      }
    }));

    this.validConstraints(c => c.resolveConstants(this.expressionResolver));

    this.evaluateAndBuildSolver();

    this.visualLimit = this.calcVisualLimit();

    if (DEBUG) {
      console.log('solving system:');
      this.polynomialIsolations.forEach((iso, i) => {
        console.log(i + ". ISOLATION, DOF: " + iso.dof);
        iso.polynomials.forEach(p => console.log(p.toString()));
      });

      console.log('with respect to:');
      this.substitutionOrder.forEach(x => console.log(x.toString() + ' = ' + this.substitutedParams.get(x).toString()));
    }
  }

  evaluateAndBuildSolver() {
    this.polynomials = [];
    this.substitutedParams.clear();
    this.substitutionOrder = [];
    this.eliminatedParams.clear();
    this.paramToIsolation.clear();

    this.validConstraints(c => c.params.forEach(p => p.normalizer && p.set(p.normalizer(p.get()))));

    this.evaluatePolynomials();

    this.polynomialIsolations = this.splitByIsolatedClusters(this.polynomials);
    this.polynomialIsolations.forEach(iso => {
      iso.beingSolvedParams.forEach(solverParam => this.paramToIsolation.set(solverParam.objectParam, iso))
    });
  }

  splitByIsolatedClusters(polynomials) {


    const graph = new Map();

    function link(a, b) {
      let list = graph.get(a);
      if (!list) {
        list = [];
        graph.set(a, list);
      }
      list.push(b);
    }

    const visited = new Set();

    polynomials.forEach(pl => {
      visited.clear();
      pl.visitParams(p => {
        if (visited.has(p)) {
          return;
        }
        visited.add(p);
        link(p, pl);
        link(pl, p);
      })
    });

    visited.clear();

    const clusters = [];

    for (const initPl of polynomials) {
      if (visited.has(initPl)) {
        continue
      }
      const stack = [initPl];
      const isolation = [];
      while (stack.length) {
        const pl = stack.pop();
        if (visited.has(pl)) {
          continue;
        }
        isolation.push(pl);
        visited.add(pl);
        const params = graph.get(pl);
        for (const p of params) {
          const linkedPolynomials = graph.get(p);
          for (const linkedPolynomial of linkedPolynomials) {
            if (linkedPolynomial !== pl) {
              stack.push(linkedPolynomial);
            }
          }
        }
      }
      if (isolation.length) {
        clusters.push(new Isolation(isolation, this));
      }
    }

    return clusters;
  }

  solveRough() {
    this.solve(true);
  }

  solveFine() {
    this.solve(false);
  }

  projectedRelations() {
    if(!this.projectedConstraintCount)return [];
    return this.allConstraints.filter(c=>directionalRelation(c) && (!this.conflicting.has(c)||this.redundant.has(c)));
  }
  rememberProjectedState() {
    const relations=this.projectedRelations();
    if(!relations.length){this.projectedLastValid=null;return;}
    if(relations.some(c=>!directionalRelationValid(c)))throw new Error('DIRECTION_DOMAIN');
    this.projectedLastValid=this.captureProjectedState();
  }
  captureProjectedState() {
    if(this.stage.objects.size>PROJECTED_MAX_OBJECTS||this.allConstraints.length>PROJECTED_MAX_CONSTRAINTS)
      throw new Error(PROJECTED_LIMIT_ERROR);
    const values=new Map();
    let visits=0;
    const capture = p => {
      if(++visits>PROJECTED_MAX_PARAM_VISITS)throw new Error(PROJECTED_LIMIT_ERROR);
      if(!values.has(p)&&values.size>=PROJECTED_MAX_PARAMS)throw new Error(PROJECTED_LIMIT_ERROR);
      values.set(p,p.get());
    };
    for(const object of this.stage.objects)object.visitParams(capture);
    for(const constraint of this.allConstraints)constraint.objects.forEach(object=>object.visitParams(capture));
    return values;
  }
  rejectProjectedDomain(reason='PROJECTED_DIRECTION_DOMAIN') {
    if(this.admissionSolve){this.solveStatus={success:false,error:Infinity,domainError:reason};return;}
    if(!this.projectedLastValid)throw new Error(reason);
    this.projectedLastValid.forEach((value,param)=>param.set(value));
    this.solveStatus={success:false,error:Infinity,domainError:reason};
  }


  solve(rough) {

    const projected=this.projectedRelations();
    // Rough iterations can leave a valid direction's endpoint/polar values
    // temporarily inconsistent. Use the precise solve before enforcing the
    // directional domain rather than treating ordinary dragging as collapse.
    if(projected.some(c=>c.schema.id!=='ProjectedDistance'))rough=false;
    const resourceError=projected.some(c=>c.schema.id!=='ProjectedDistance')?'DIRECTION_RESOURCE_LIMIT':'PROJECTED_RESOURCE_LIMIT';
    if(this.projectedLastValid&&(this.stage.objects.size>PROJECTED_MAX_OBJECTS||this.allConstraints.length>PROJECTED_MAX_CONSTRAINTS)) {
      this.rejectProjectedDomain(resourceError);return;
    }
    if(projected.length&&!this.admissionSolve) {
      try { this.captureProjectedState(); }
      catch(error) {
        if(!(error instanceof Error)||error.message!==PROJECTED_LIMIT_ERROR)throw error;
        this.rejectProjectedDomain(resourceError);return;
      }
    }
    const invalid=projected.find(c=>directionalSegments(c).some(s=>!directionalSegmentNonzero(s)));
    if(invalid) {
      this.rejectProjectedDomain(invalid.schema.id==='ProjectedDistance'?'PROJECTED_DIRECTION_DOMAIN':'DIRECTION_DOMAIN');return;
    }
    delete this.solveStatus.domainError;

    // Rejected external-stage relationships must be reconsidered when their
    // dependencies change; they are otherwise excluded from hard rebuilding.
    // Keep the active drag preference while replaying the authored priorities.
    if (!this.admissionSolve && [...this.externalConflictValues].some(([p, value]) => !Object.is(p.get(), value))) {
      const interactive = new Set(this.interactiveParams);
      this.atomicReclassification(() => {
        this.rebuildAdmission();
        this.prepareRaw([], interactive);
      });
    }

    if (this.requiresHardSolve) {
      if (this.admissionSolve) this.evaluateAndBuildSolver();
      else this.atomicReclassification(() => this.evaluateAndBuildSolver());
    }

    this.polynomialIsolations.forEach(iso => {
      iso.solve(rough);
    });

    if (!rough) {

      this.solveStatus.error = 0;
      this.solveStatus.success = true;

      this.polynomialIsolations.forEach(iso => {
        this.solveStatus.error = Math.max(this.solveStatus.error, iso.solveStatus.error);
        this.solveStatus.success = this.solveStatus.success && iso.solveStatus.success;
      });

      if (DEBUG) {
        console.log('numerical result: ' + this.solveStatus.success);
      }
    }

    for (const [p, val] of this.eliminatedParams) {
      p.set(val);
    }

    for (let i = this.substitutionOrder.length - 1; i >= 0; i--) {
      const param = this.substitutionOrder[i];
      const expression = this.substitutedParams.get(param);
      param.set(expression.value());
    }
    if(projected.length&&!rough&&!this.admissionSolve&&!this.solveStatus.success) {
      this.rejectProjectedDomain(projected.some(c=>c.schema.id!=='ProjectedDistance')?'DIRECTION_SOLVE_FAILED':'PROJECTED_SOLVE_FAILED');return;
    }
    const badDirection=projected.find(c=>!directionalRelationValid(c));
    if(badDirection) {this.rejectProjectedDomain(badDirection.schema.id.startsWith('Fix')?'FIXED_ENTITY_DOMAIN':badDirection.schema.id==='ProjectedDistance'?'PROJECTED_DIRECTION_DOMAIN':'DIRECTION_DOMAIN');return;}
    if(projected.some(c=>c.schema.id==='RigidGroup')&&!rough) {
      try { assertRetainedStageValid(this.stage,{skipRejected:this.admissionSolve}); }
      catch (_) { this.rejectProjectedDomain('RIGID_CONSTRAINT_DOMAIN');return; }
    }
    if(!this.admissionSolve && this.solveStatus.success)this.rememberProjectedState();
  }

  updateFullyConstrainedObjects() {

    this.validConstraints(c => {

      c.objects.forEach(obj => {

        let allLocked = true;

        obj.visitParams(p => {
          if (!this.isParamFullyConstrained(p)) {
            allLocked = false;
          }
        });

        obj.fullyConstrained = allLocked;
      });
    });
  }

  isParamShallowConstrained(p) {
    const iso = this.paramToIsolation.get(p);
    return this.eliminatedParams.has(p) || (iso && iso.fullyConstrained);
  }

  isParamFullyConstrained(sourceParam) {

    const visited = new Set();

    const dfs = param => {
      if (visited.has(param)) {
        return;
      }
      visited.add(param);
      if (this.isParamShallowConstrained(param)) {
        return true;
      }
      const substitution = this.substitutedParams.get(param);
      let res = false;
      if (substitution) {
        substitution.visitParams(p => {
          if (dfs(p)) {
            res = true;
          }
        });
      }
      return res;
    };
    return dfs(sourceParam);
  }

}


class Isolation {
  polynomials: Polynomial[];
  system: AlgNumSubSystem;
  beingSolvedParams: Set<SolverParam>;
  beingSolvedConstraints: Set<AlgNumConstraint>;
  dof: number | null;
  solveStatus: SolveStatus;
  numericalSolver: { system; diagnose; solveSystem; error; updateLock };

  constructor(polynomials, system) {
    this.system = system;
    this.polynomials = polynomials;
    this.beingSolvedParams = new Set();
    this.beingSolvedConstraints = new Set();
    const residuals = [];

    this.polynomials.forEach(p => {
      residuals.push(p.asResidual());
      this.beingSolvedConstraints.add(system.polyToConstr.get(p));
    });

    for (const residual of residuals) {
      residual.params.forEach(solverParam => {
        if (!this.beingSolvedParams.has(solverParam)) {
          solverParam.reset(solverParam.objectParam.get());
          this.beingSolvedParams.add(solverParam);
        }
      });
    }
    // Equation counts do not establish independent rank, especially at
    // singular solutions. Do not present this unqualified value as fact.
    this.dof = null;
    const penaltyFunction = new PolynomialResidual();
    this.beingSolvedParams.forEach(sp => {
      const param = sp.objectParam;
      if (param.constraints) {
        penaltyFunction.add(sp, param.constraints);
      }
    });

    if (penaltyFunction.params.length) {
      residuals.push(penaltyFunction);
    }

    this.numericalSolver = prepare(residuals);
  }

  get fullyConstrained() {
    return this.dof === null ? null : this.dof === 0;
  }

  solve(rough) {

    this.beingSolvedConstraints.forEach(c => c.initialGuess());

    // A deterministic DistancePP starting value uses only actual free reduced
    // Point coordinates. This never declares solve/admission success.
    initializeSingularPointDistance(this.system, this.polynomials,
      this.numericalSolver.system.params, this.numericalSolver.system.constraints.length);

    this.beingSolvedParams.forEach(solverParam => {
      let val = solverParam.objectParam.get();

      if (this.system.controlBounds) {
        if (solverParam.objectParam.enforceVisualLimit && val < this.system.visualLimit) {
          val = this.system.visualLimit;
        }
      }
      solverParam.set(val);
    });

    this.solveStatus = this.numericalSolver.solveSystem(rough);

    this.beingSolvedParams.forEach(solverParam => {
      solverParam.objectParam.set(solverParam.get());
    });
  }

}

class PolynomialResidual {

  params = [];
  functions = [];

  add(param, fns) {
    this.params.push(param);
    this.functions.push(fns);
  }

  error() {
    let err = 0;
    for (let i = 0 ; i < this.params.length; ++i) {
      const val = this.params[i].get();
      const paramFunctions = this.functions[i];
      for (const fn of paramFunctions) {
        const d0 = fn.d0(val);
        err += d0;// * d0;
      }
    }

    return err;//0.5 * err;
  }

  gradient(out) {
    for (let i = 0 ; i < this.params.length; ++i) {
      const val = this.params[i].get();
      const paramFunctions = this.functions[i];
      for (const fn of paramFunctions) {
        // const d0 = fn.d0(val);
        const d1 = fn.d1(val);
        out[i] += d1; //d0 * d1; //degenerated chain rule
      }
    }
  }

}

export interface SolveStatus {
  success: boolean;
  error: number;
  domainError?: string;
}
