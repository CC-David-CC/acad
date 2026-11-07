import assert from 'node:assert/strict';
import {test} from 'node:test';
import {AlgNumConstraint,ConstraintDefinitions} from '../../web/app/sketcher/constr/ANConstraints.ts';
import {ParametricManager} from '../../web/app/sketcher/parametric.ts';
import {EndPoint} from '../../web/app/sketcher/shapes/point.ts';
import {Segment} from '../../web/app/sketcher/shapes/segment.ts';
import {addSignedDistance} from '../../web/app/sketcher/actions/signedDistanceOperation.js';

function fixture(){
 const history={diffs:[],historyPointer:-1,lastCheckpoint:'{}',_counter:0,_checkpoint(){this.lastCheckpoint='{}';}};
 const viewer={refresh(){},screenToModel2(x,y,p){p.x=x;p.y=y},annotationLayer:{add(){},remove(){}},historyManager:history,io:{serializeSketch:()=>'{}'}};
 const pm=viewer.parametricManager=new ParametricManager(viewer),stage=pm.stage;
 const a=new EndPoint(0,0,'a'),b=new EndPoint(3,4,'b'),axis=new Segment(0,0,10,0,'axis');
 for(const o of [a,b,axis])stage.assignObject(o);
 stage.addConstraint(new AlgNumConstraint(ConstraintDefinitions.Polar,[axis,axis.a,axis.b],undefined,true));
 viewer.traverse=fn=>[a,b,axis].forEach(fn);addSignedDistance(viewer,'projected',[a,b,axis],3);
 return {stage,axis};
}
test('successful last directional removal releases references and stage budget',()=>{
 const {stage,axis}=fixture(),system=stage.algNumSystem,c=system.allConstraints.find(c=>c.schema.id==='ProjectedDistance');
 assert.ok(system.projectedLastValid.has(axis.a.params.x));
 assert.ok(system.projectedLastValid.has(axis.b.params.x));
 system.removeConstraint(c);
 assert.equal(system.projectedLastValid,null,'removed relation must release the retained parameter map');
 while(stage.objects.size<=6000)stage.objects.add({visitParams(){}});
 system.solveFine();assert.equal(system.solveStatus.success,true);assert.notEqual(system.solveStatus.domainError,'PROJECTED_RESOURCE_LIMIT');
});
test('failed last directional removal restores relation and original snapshot',()=>{
 const {stage}=fixture(),system=stage.algNumSystem,c=system.allConstraints.find(c=>c.schema.id==='ProjectedDistance'),snapshot=system.projectedLastValid,original=system.invalidate;
 system.invalidate=()=>{throw Error('injected rebuild failure');};
 try{assert.throws(()=>system.removeConstraint(c),/injected/);assert.ok(system.allConstraints.includes(c));assert.equal(system.projectedLastValid,snapshot);}
 finally{system.invalidate=original;}
});
