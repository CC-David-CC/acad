const {runWorkerRectangleExtrusion}=require('../../modules/engine/extrusion/rectanglePrismAdapter.ts');
const {resolveCandidatePrism}=require('../../modules/engine/extrusion/candidatePrismLedger.mjs');
const {createEvaluationResourcePool}=require('../../web/app/cad/craft/evaluationResources.mjs');
window.candidateFixture={runWorkerRectangleExtrusion,resolveCandidatePrism,createEvaluationResourcePool};
