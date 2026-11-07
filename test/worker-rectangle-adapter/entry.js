const {runWorkerRectangleExtrusion}=require('../../modules/engine/extrusion/rectanglePrismAdapter.ts');
const {createEvaluationResourcePool}=require('../../web/app/cad/craft/evaluationResources.mjs');
function ownerForTest(pool,signal,valid){return pool.begin({signal,valid});}
window.adapterFixture={runWorkerRectangleExtrusion,createEvaluationResourcePool,ownerForTest};
