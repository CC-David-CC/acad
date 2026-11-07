const {runWorkerRectangleExtrusion}=require('../../modules/engine/extrusion/rectanglePrismAdapter.ts');
const {runWorkerCenteredThroughHole}=require('../../modules/engine/extrusion/centeredHoleAdapter.ts');
const {runWorkerFourCornerHoles}=require('../../modules/engine/extrusion/fourCornerHoleAdapter.ts');
const {resolveCandidateCenteredHole}=require('../../modules/engine/extrusion/candidatePrismLedger.mjs');
const {createEvaluationResourcePool}=require('../../web/app/cad/craft/evaluationResources.mjs');
window.fourCornerFixture={runWorkerRectangleExtrusion,runWorkerCenteredThroughHole,runWorkerFourCornerHoles,resolveCandidateCenteredHole,createEvaluationResourcePool};
