import {IO} from '../../web/app/sketcher/io';
import {ParametricManager} from '../../web/app/sketcher/parametric';
import {Segment} from '../../web/app/sketcher/shapes/segment';
import {AlgNumConstraint,ConstraintDefinitions} from '../../web/app/sketcher/constr/ANConstraints';

// Diagnostic only: real strict sketch serialization with synthetic geometry.
window.measureSignedDistanceSnapshot = count => {
  const viewer = {layers:[{objects:[]}],dimLayer:{objects:[]},labelLayer:{objects:[]},refresh(){}};
  const manager = viewer.parametricManager = new ParametricManager(viewer);
  for(let i=0;i<count;i++) {
    const segment = new Segment(i, 0, i+1, 1, `line-${i}`);
    manager.stage.assignObject(segment);
    viewer.layers[0].objects.push(segment);
  }
  const io = new IO(viewer), samples=[];
  let text='';
  for(let i=0;i<15;i++) {
    const start=performance.now();
    text=io.serializeSketch(undefined,{strict:true});
    new TextEncoder().encode(text);
    samples.push(performance.now()-start);
  }
  samples.sort((a,b)=>a-b);
  return {count,bytes:new TextEncoder().encode(text).byteLength,medianMs:samples[7],maxMs:samples[14]};
};
window.measureProjectedSnapshot = count => {
  const viewer = {refresh(){},screenToModel2(x,y,p){p.x=x;p.y=y;},annotationLayer:{add(){},remove(){}},historyManager:{_checkpoint(){}}};
  const manager = viewer.parametricManager = new ParametricManager(viewer), stage=manager.stage;
  const first=new Segment(0,0,10,0,'direction'), second=new Segment(0,5,10,5,'second');
  stage.assignObject(first);stage.assignObject(second);
  stage.addConstraint(new AlgNumConstraint(ConstraintDefinitions.Polar,[first,first.a,first.b],undefined,true));
  stage.addConstraint(new AlgNumConstraint(ConstraintDefinitions.ProjectedDistance,[second.a,second.b,first],{distance:'10'}));
  for(let i=0;i<count;i++) stage.assignObject(new Segment(i,10,i+1,10,`extra-${i}`));
  const samples=[];
  for(let i=0;i<25;i++){const start=performance.now();stage.algNumSystem.rememberProjectedState();samples.push(performance.now()-start);}
  samples.sort((a,b)=>a-b);
  return {count,parameters:stage.algNumSystem.projectedLastValid.size,medianMs:samples[12],maxMs:samples[24]};
};
