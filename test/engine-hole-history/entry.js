const {runWorkerRectangleExtrusion}=require('../../modules/engine/extrusion/rectanglePrismAdapter.ts');
const {createWorkerCenteredHoleOperation}=require('../../modules/workbenches/modeler/features/workerCenteredHole/workerCenteredHole.operation.ts');
const {createEvaluationResourcePool}=require('../../web/app/cad/craft/evaluationResources.mjs');
const {activate}=require('../../web/app/cad/craft/cadRegistryBundle.ts');
const {state}=require('../../modules/lstream');
window.holeHistoryFixture={runWorkerRectangleExtrusion,createWorkerCenteredHoleOperation,createEvaluationResourcePool,activate,state};
