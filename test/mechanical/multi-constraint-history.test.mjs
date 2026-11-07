import assert from 'node:assert/strict';
import {test} from 'node:test';
import {HistoryManager} from '../../web/app/sketcher/history.js';
import {ParametricManager} from '../../web/app/sketcher/parametric.ts';
import {getSketcherAction} from '../../web/app/sketcher/actions/index.js';
import {Segment} from '../../web/app/sketcher/shapes/segment.ts';
import {Circle} from '../../web/app/sketcher/shapes/circle.js';
import {EndPoint} from '../../web/app/sketcher/shapes/point.ts';
import {AlgNumSubSystem} from '../../web/app/sketcher/constr/AlgNumSystem.ts';
import {AlgNumConstraint, ConstraintDefinitions} from '../../web/app/sketcher/constr/ANConstraints.ts';

// Real history bookkeeping with exact whole-snapshot patches; patch compression
// is immaterial to whether an action creates an independent undo boundary.
window.diff_match_patch = class {
  diff_main(a,b) { return [a,b]; }
  patch_make(a,b) { return {before:a,after:b}; }
  patch_apply(p,text) { return [p.after,[p.before===text]]; }
};

for (const id of ['EqualLength', 'EqualRadius', 'Coincident']) {
  test(`${id} preserves the previous sketch edit on undo and redoes the relationship`, () => {
    let state={prior:'initial',relations:[]};
    const viewer={io:{serializeSketch:()=>JSON.stringify(state),loadSketch:s=>{state=JSON.parse(s)}},
      refresh(){},fullHeavyUIRefresh(){}};
    viewer.historyManager=new HistoryManager(viewer);
    viewer.historyManager.init(JSON.stringify(state));
    const pm=viewer.parametricManager=Object.create(ParametricManager.prototype);
    const stage={index:0,algNumSystem:{allConstraints:[],conflicting:new Set(),redundant:new Set(),isConflicting:()=>false}};
    stage.addConstraint=c=>{c.stage=stage;stage.algNumSystem.allConstraints.push(c);state.relations.push(c.schema.id)};
    Object.defineProperties(pm,{stages:{value:[stage]},stage:{value:stage}});
    pm.viewer=viewer;pm.inTransaction=false;pm.notify=()=>{};
    pm.startTransaction=()=>{pm.inTransaction=true;stage.algNumSystem.transactionBefore={conflicting:new Set(),redundant:new Set()}};
    pm.finishTransaction=validate=>{pm.inTransaction=false;validate([stage])};
    const selected = [0,1,2].map(i => id === 'EqualLength'
      ? new Segment(i,0,i+1,1,`s${i}`)
      : id === 'EqualRadius' ? new Circle(i,0,1,`c${i}`) : new EndPoint(i,0,`p${i}`));
    for (const object of selected) object.stage=stage;
    state.prior='independent earlier edit';
    getSketcherAction(id).invoke({viewer},selected);
    assert.equal(state.relations.length,2);
    viewer.historyManager.undo();
    assert.equal(state.prior,'independent earlier edit');
    assert.deepEqual(state.relations,[]);
    viewer.historyManager.redo();
    assert.equal(state.prior,'independent earlier edit');
    assert.equal(state.relations.length,2);
  });
}

test('equal-radius action still creates real solvable relationships', () => {
  const stage={index:0};
  const solver=new AlgNumSubSystem(()=>100,v=>v,stage);
  stage.algNumSystem=solver;
  stage.addConstraint=constraint=>{constraint.stage=stage;solver.addConstraint(constraint)};
  const viewer={refresh(){},historyManager:{_checkpoint(){}}};
  const pm=viewer.parametricManager=Object.create(ParametricManager.prototype);
  Object.defineProperties(pm,{stages:{value:[stage]},stage:{value:stage}});
  pm.viewer=viewer;pm.inTransaction=false;pm.notify=()=>{};
  pm.startTransaction=()=>{pm.inTransaction=true;solver.transactionBefore={conflicting:new Set(),redundant:new Set()}};
  pm.finishTransaction=validate=>{pm.inTransaction=false;validate([stage])};
  const circles=[new Circle(0,0,2,'a'),new Circle(10,0,4,'b'),new Circle(20,0,7,'c')];
  for (const circle of circles) circle.stage=stage;
  getSketcherAction('EqualRadius').invoke({viewer},circles);
  solver.solveFine();
  assert.equal(solver.allConstraints.length,2);
  assert.ok(solver.allConstraints.every(c=>!solver.isConflicting(c)));
  assert.ok(circles.every(c=>Math.abs(c.r.get()-circles[0].r.get())<1e-8));
});

test('mixed valid and contradictory equal-radius group is not partially admitted', () => {
  const viewer={refresh(){},screenToModel2(x,y,p){p.x=x;p.y=y},annotationLayer:{add(){},remove(){}},historyManager:{checkpoint(){},_checkpoint(){}}};
  const pm=viewer.parametricManager=new ParametricManager(viewer);
  const stage=pm.stage, solver=stage.algNumSystem;
  const circles=[new Circle(0,0,2,'a'),new Circle(10,0,2,'b'),new Circle(20,0,7,'c')];
  for (const circle of circles) stage.assignObject(circle);
  for (const [circle,radius] of [[circles[0],2],[circles[2],7]]) {
    stage.addConstraint(new AlgNumConstraint(ConstraintDefinitions.RadiusLength,[circle],{length:String(radius)}));
  }
  solver.solveFine();
  const before=circles.map(c=>c.r.get());
  try { getSketcherAction('EqualRadius').invoke({viewer},circles); } catch (_) { /* group refusal */ }
  assert.equal(solver.allConstraints.filter(c=>c.schema.id==='EqualRadius').length,0);
  assert.deepEqual(circles.map(c=>c.r.get()),before);
});
