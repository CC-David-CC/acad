import {Constraints} from './constraints';
import {noteSketchMutation} from './sketchMutationEpoch.mjs';
import {AlgNumConstraint, ConstraintDefinitions} from "./constr/ANConstraints";
import {AlgNumSubSystem} from "./constr/AlgNumSystem";
import {state, stream} from 'lstream';
import {toast} from "react-toastify";
import {ISolveStage, SolvableObject} from "./constr/solvableObject";
import {Viewer} from "./viewer2d";
import {desktopFileMode} from 'cad/desktopFileActions';
import {evaluateMath, validVariableName, parseMathDefinitions} from 'gems/safeExpression.mjs';

export {Constraints, ParametricManager}

class ParametricManager {

  constantTable = {};
  constantErrors = [];
  externalConstantResolver = null;
  externalConstantDefinitionCheck = null;

  $update = stream();

  inTransaction = false;
  transactionConstraints = [];
  transactionRemovedAnnotations = [];

  $constraints = this.$update
    .map(() => [...this.algNumSystem.allConstraints].sort((c1, c2) => c1.id - c2.id))
    .remember([]);

  $generators = this.$update
    .map(() => [...this.stage.generators].sort((c1, c2) => c1.id - c2.id))
    .remember([]);

  $stages = state({
    list: null,
    pointer: -1
  });

  $constantDefinition = state('');

  groundStage = new SolveStage(this);
  viewer: Viewer;
  messageSink: (msg) => void;

  constructor(viewer) {
    this.viewer = viewer;

    this.$constantDefinition.attach((def) => this.rebuildConstantTable(def))

    this.reset();

    this.$stages.pipe(this.$update);
    this.$stages.attach(() => this.viewer.refresh());

    this.messageSink = msg => alert(msg);
  }

  reset() {
    noteSketchMutation();
    this.$stages.next({
      list: [new SolveStage(this)],
      pointer: 0
    });
  }

  get stage() {
    const {list, pointer} = this.$stages.value;
    return list[pointer];
  }

  get stages() {
    return this.$stages.value.list;
  }

  get algNumSystem() {
    return this.stage.algNumSystem;
  }

  get constantDefinition() {
    return this.$constantDefinition.value;
  }

  startTransaction() {
    if (this.inTransaction) throw new Error('Nested sketch transactions are not supported');
    this.inTransaction = true;
    this.transactionConstraints = [];
    this.transactionRemovedAnnotations = [];
    const started = [];
    try {
      for (const stage of this.stages) {
        stage.algNumSystem.startTransaction();
        started.push(stage);
      }
    } catch (error) {
      for (const stage of started) stage.algNumSystem.rollbackTransaction();
      this.inTransaction = false;
      throw error;
    }
  }

  finishTransaction(validate = null, refresh = true) {
    this.inTransaction = false;
    const stages = [...this.stages];
    const attached = [];
    const removed = [];
    try {
      for (const stage of stages) {
        stage.algNumSystem.finishTransaction(true);
      }
      if (validate) validate(stages);
      for (const {constraint, previousStage} of this.transactionConstraints) {
        if (!constraint.stage.algNumSystem.allConstraints.includes(constraint)) {
          constraint.stage = previousStage;
          continue;
        }
        for (const annotation of constraint.annotations) {
          attached.push(annotation);
          this.viewer.annotationLayer.add(annotation);
        }
      }
      for (const entry of this.transactionRemovedAnnotations) {
        removed.push(entry);
        entry.layer.remove(entry.annotation);
      }
    } catch (error) {
      for (const annotation of attached.reverse()) {
        try { this.viewer.annotationLayer.remove(annotation); } catch (_) { /* preserve original failure */ }
      }
      for (const {annotation, layer, stage} of removed.reverse()) {
        try {
          if (Array.isArray(layer.objects) && layer.objects.includes(annotation)) continue;
          if (stage && annotation.stage !== stage) stage.assignObject(annotation);
          if (annotation.layer === layer) annotation.layer = null;
          layer.add(annotation);
        } catch (_) { /* preserve original failure; full layer rollback remains unqualified */ }
      }
      // Later stages may snapshot parameters owned by an earlier stage after
      // an in-transaction edit. Restore in reverse stage order so the owning
      // earlier stage has the final word on its transaction-start values.
      for (const stage of [...stages].reverse()) stage.algNumSystem.rollbackTransaction();
      for (const {constraint, previousStage} of this.transactionConstraints) constraint.stage = previousStage;
      this.transactionConstraints = [];
      this.transactionRemovedAnnotations = [];
      throw error;
    }
    for (const stage of stages) stage.algNumSystem.transactionBefore = null;
    this.transactionConstraints = [];
    this.transactionRemovedAnnotations = [];
    if (refresh) this.refresh();
  }

  get allConstraints() {
    return this.$constraints.value;
  }

  addAlgNum(constr) {
    this.add(constr);
  }

  constantResolver = (value, field?) => {
    let _value = this.constantTable[value];
    if (_value === undefined && this.externalConstantResolver) {
      _value = this.externalConstantResolver(value, field);
    }
    if (_value !== undefined) {
      value = _value;
    }
    return value;
  };

  rebuildConstantTable(constantDefinition) {
    if (desktopFileMode || (this.viewer as any).safeExpressions) {
      const result = parseMathDefinitions(constantDefinition || '');
      this.constantErrors = result.errors;
      if (!result.errors.length) this.constantTable = result.variables;
      return;
    }
    this.constantTable = desktopFileMode ? Object.create(null) : {};
    if (constantDefinition == null) return;
    const lines = constantDefinition.split('\n');
    let prefix = "(function() { \n";
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const m = line.match(/^\s*([^\s]+)\s*=(.+)$/);
      if (m != null && m.length === 3) {
        const constant = m[1];
        try {
          if (desktopFileMode && (!validVariableName(constant) || Object.prototype.hasOwnProperty.call(this.constantTable,constant))) throw new Error('Invalid or duplicate constant name.');
          const value = desktopFileMode ? evaluateMath(m[2],this.constantTable) : eval(prefix + "return " + m[2] + "; \n})()");
          this.constantTable[constant] = value;
          prefix += "const " + constant + " = " + value + ";\n"
        } catch(e) {
        }
      }
    }
  }

  onConstantsExternalChange(constantDefinition) {
    this.rebuildConstantTable(constantDefinition);
   // this.refresh();
  }

  defineNewConstant(name, value) {
    let constantDefinition = this.constantDefinition;
    const constantText = name + ' = ' + value;
    if (constantDefinition) {
      constantDefinition += '\n' + constantText;
    } else {
      constantDefinition = constantText;
    }
    if (desktopFileMode) this.applyConstantDefinition(constantDefinition);
    else { noteSketchMutation(); this.$constantDefinition.next(constantDefinition); }
  }

  // Keep the editable draft outside the authored sketch until its dependency
  // graph, dimensional domains and all currently accepted relationships have
  // been checked against the proposed values.
  applyConstantDefinition(definition) {
    const text = definition || '';
    const parsed = parseMathDefinitions(text);
    this.externalConstantDefinitionCheck?.(text);
    if (parsed.errors.length) throw new Error(parsed.errors.map(e => `Line ${e.line + 1}: ${e.message}`).join('\n'));
    const oldTable = this.constantTable;
    const resolve = (value,field) => Object.prototype.hasOwnProperty.call(parsed.variables, value) ? parsed.variables[value] :
      (this.externalConstantResolver ? this.externalConstantResolver(value,field) : value);
    for (const stage of this.stages) {
      for (const constraint of stage.algNumSystem.allConstraints) constraint.validateCandidateConstants(constraint.constants, resolve);
    }
    // A failed history checkpoint must not be swallowed: an unresolved
    // recovery snapshot means the displayed sketch is not safe to modify.
    noteSketchMutation();
    this.viewer.historyManager._checkpoint();
    this.startTransaction();
    this.constantTable = parsed.variables;
    try {
      this.finishTransaction(stages => {
        for (const stage of stages) {
          const system = stage.algNumSystem, before = system.transactionBefore;
          for (const constraint of system.allConstraints) {
            const wasRejected = before.conflicting.has(constraint) && !before.redundant.has(constraint);
            const nowRejected = system.conflicting.has(constraint) && !system.redundant.has(constraint);
            if (!wasRejected && nowRejected) {
              throw new Error('The parameter change could not be applied without invalidating existing constraints.');
            }
          }
        }
      }, false);
    } catch (error) {
      this.constantTable = oldTable;
      throw error;
    }
    // The staged geometry has committed. Do not restore its old parameter
    // table if a later presentation refresh happens to fail.
    this.$constantDefinition.next(text);
    this.refresh();
  }

  updateConstraintConstants(constr) {
    this.viewer.parametricManager.refresh();
  }

  notify() {
    this.$update.next();
  }

  commit() {
    this.refresh();
  }

  _add(constr) {

    let highestStage = this.stages[0];

    constr.objects.forEach(obj => {
      if (obj.stage.index > highestStage.index) {
        highestStage = obj.stage;
      }
    });

    for (const obj of constr.objects) {
      if (obj.generator && obj.stage === highestStage) {
        toast("Cannot refer to a generated object from the same stage is being added to.");
        return;
      }
    }

    highestStage.addConstraint(constr);


    if (highestStage !== this.stage && !this.inTransaction) {
      toast("Constraint's been added to stage " + highestStage.index + "!")
    }
  }

  refresh() {
    if (this.inTransaction) {
      return;
    }
    this.notify();
    this.viewer.refresh();
  }

  add(constr) {
    this.viewer.historyManager.checkpoint();
    this._add(constr);
    this.refresh();
  }

  addAll(constrs) {
    this.viewer.historyManager.checkpoint();
    for (let i = 0; i < constrs.length; i++) {
      this._add(constrs[i]);
    }
    this.refresh();
  }

  remove(constr) {
    if (constr?.schema?.id === 'RigidGroup') throw new Error('Dissolve the rigid group before removing its relation.');
    this.viewer.historyManager.checkpoint();
    constr.stage.algNumSystem.removeConstraint(constr);
    constr.annotations.forEach(ann => ann.layer.remove(ann));
    this.refresh();
  }

  _removeConstraint(constr) {
    if (constr?.schema?.id === 'RigidGroup') throw new Error('Dissolve the rigid group before removing its relation.');
    constr.stage.algNumSystem.removeConstraint(constr);
    constr.annotations.forEach(ann => {
      if (this.inTransaction) {
        if (ann.layer) this.transactionRemovedAnnotations.push({annotation: ann, layer: ann.layer, stage: ann.stage});
      } else ann.layer.remove(ann);
    });
  }

  removeGenerator(generator) {
    this.viewer.deselectAll();
    this.startTransaction();
    this._removeGenerator(generator);
    this.finishTransaction();
  }

  _removeGenerator(generator) {
    if (generator.__disposed) {
      return;
    }
    generator.__disposed = true;
    this._removeObjects(generator.generatedObjects, true);
    generator.stage.removeGenerator(generator);
  }

  removeObjects(objects) {
    objects.forEach(obj => this.assertRigidRemovalAllowed(obj));
    this.startTransaction();
    this._removeObjects(objects);
    this.finishTransaction();
  }

  _removeObjects(objects, force = false) {
    objects.forEach(obj => {
      if (obj.isRoot) {
        this._removeObject(obj, force);
      }
    });
  }

  _removeObject = (obj, force?) => {
    this.assertRigidRemovalAllowed(obj);
    if (obj.__disposed) {
      return;
    }
    obj.__disposed = true;
    if (obj.isGenerated && !force) {
      return;
    }

    obj.traverse(o => o.constraints.forEach(c => this._removeConstraint(c)));

    if (obj.layer != null) {
      obj.layer.remove(obj);
    }

    obj.traverse(co => co.generators.forEach(gen => {
      gen.removeObject(co, o => this._removeObject(o, true), () => this._removeGenerator(gen));
    }));
    obj.constraints.clear();
    obj.generators.clear();

    [this.viewer.dimLayer, this.viewer.labelLayer].forEach(l => {
      l.traverseSketchObjects(dim => {
        obj.accept(o => {
          if (dim.dependsOn && dim.dependsOn(o)) {
            this._removeObject(dim);
            return false;
          }
          return true;
        });
      });
    })

  };

  assertRigidRemovalAllowed(obj) {
    let grouped = obj?.TYPE === 'RigidGroup';
    if (obj && typeof obj.traverse === 'function') obj.traverse(o => {
      if (o?.TYPE === 'RigidGroup' || [...(o?.constraints || [])].some((c: any) => c?.schema?.id === 'RigidGroup')) grouped = true;
    });
    if (grouped) throw new Error('Dissolve the rigid group before deleting its members.');
  }

  invalidate() {
    for (const stage of this.stages) {
      stage.algNumSystem.invalidate();
    }
  }

  revalidateConstraint(constraint) {
    constraint.stage.algNumSystem.revalidateConstraint(constraint);
    this.notify();
  }

  constraintUpdated(constraint) {
    this.revalidateConstraint(constraint);
    this.invalidate();
  }

  prepare(interactiveObjects) {
    this.groundStage.prepare(interactiveObjects);
    for (const stage of this.stages) {
      stage.prepare(interactiveObjects);
    }
  }

  solve(rough) {
    this.groundStage.solve(rough);
    for (const stage of this.stages) {
      stage.solve(rough);
    }
  }

  addGenerator(generator) {

    let highestStage = this.stages[0];

    generator.sourceObjects(obj => {
      if (obj.stage.index > highestStage.index) {
        highestStage = obj.stage;
      }
    });

    this.addGeneratorToStage(generator, highestStage);

    if (highestStage !== this.stage && !this.inTransaction) {
      toast("Generator's been added to stage " + highestStage.index + "!")
    }

    this.refresh();
  }

  addGeneratorToStage(generator, stage) {

    const fail = false;
    generator.sourceObjects(obj => {
      if (obj.isGenerated && obj.stage === stage) {
        toast("Cannot refer to a generated object from the same stage is being added to.");
      }
    });

    if (fail) {
      return;
    }

    stage.addGenerator(generator);
    generator.generate(this.viewer);
  }

  coincidePoints(pt1, pt2) {
    this.add(new AlgNumConstraint(ConstraintDefinitions.PCoincident, [pt1, pt2]));
  }

  lockPoint(pt) {
    const lockConstr = new AlgNumConstraint(ConstraintDefinitions.LockPoint, [pt]);
    lockConstr.initConstants();
    this.add(lockConstr);
  }

  lockAngle(segment) {
    const constr = new AlgNumConstraint(ConstraintDefinitions.Angle, [segment]);
    constr.initConstants();
    this.add(constr);
  }

  lockLength(segment) {
    const constr = new AlgNumConstraint(ConstraintDefinitions.SegmentLength, [segment]);
    constr.initConstants();
    this.add(constr);
  }

  setConstantsFromGeometry(obj) {
    obj.visitLinked(o => {
      o.ancestry(ao => {
        ao.syncGeometry();
        ao.constraints.forEach(c => {
          c.setConstantsFromGeometry && c.setConstantsFromGeometry()
        })
      });
    });
  }

  newStage() {
    noteSketchMutation();
    const stage = new SolveStage(this);
    if (this.inTransaction) stage.solverSystem.startTransaction();
    this.$stages.update(s => ({
      pointer: s.pointer + 1,
      list: [...s.list, stage]
    }));
  }

  accommodateStages(uptoIndex) {
    const list = this.$stages.value.list;
    if (uptoIndex < list.length) {
      return;
    }
    noteSketchMutation();
    let i = list.length;
    const createdStages = [];
    for (;i<=uptoIndex;i++) {
      const stage = new SolveStage(this);
      if (this.inTransaction) stage.solverSystem.startTransaction();
      createdStages.push(stage);
    }
    this.$stages.update(s => ({
      pointer: uptoIndex,
      list: [...s.list, ...createdStages]
    }));
  }

  getStage(index) {
    return this.stages[index];
  }

  getStageIndex(stage) {
    return this.stages.indexOf(stage);
  }
}

class SolveStage implements ISolveStage{

  generators = new Set();
  objects = new Set<SolvableObject>();
  private parametricManager: ParametricManager;
  private algNumSystem: AlgNumSubSystem;

  constructor(parametricManager) {
    this.parametricManager = parametricManager;
    this.algNumSystem = this.createAlgNumSystem();
  }

  get solverSystem(): AlgNumSubSystem {
    return this.algNumSystem;
  }

  get viewer() {
    return this.parametricManager.viewer;
  }

  assignObject(object) {
    noteSketchMutation();
    object.stage = this;
    this.objects.add(object);
  }

  unassignObject(object) {
    noteSketchMutation();
    object.stage = null;
    this.objects.delete(object);
  }

  addConstraint(constraint) {
    const previousStage = constraint.stage;
    constraint.stage = this;
    try {
      this.algNumSystem.addConstraint(constraint);
    } catch (error) {
      constraint.stage = previousStage;
      throw error;
    }
    if (this.parametricManager.inTransaction) {
      this.parametricManager.transactionConstraints.push({constraint, previousStage});
    } else {
      constraint.annotations.forEach(ann => this.viewer.annotationLayer.add(ann));
    }
  }

  addGenerator(generator) {
    noteSketchMutation();
    generator.stage = this;
    this.generators.add(generator);
  }

  removeGenerator(generator) {
    noteSketchMutation();
    this.generators.delete(generator);
    generator.sourceObjects(obj => obj.generators.delete(generator))
  }

  createAlgNumSystem() {
    const pt = {x:0,y:0};
    const limit = 30; //px
    const calcVisualLimit = () => {
      //100 px limit
      this.viewer.screenToModel2(0, 0, pt);
      const x1 = pt.x;
      this.viewer.screenToModel2(limit, 0, pt);
      const x2 = pt.x;
      return Math.abs(x2 - x1);
    };

    return new AlgNumSubSystem(calcVisualLimit, this.parametricManager.constantResolver, this);
  }

  prepare(interactiveObjects) {
    this.algNumSystem.prepare(interactiveObjects);
  }

  solve(rough) {
    this.algNumSystem.solve(rough);
    this.generators.forEach(gen => {
      // @ts-ignore
      gen.regenerate(this.viewer);
    })
  }

  get index() {
    return this.viewer.parametricManager.getStageIndex(this);
  }
}
