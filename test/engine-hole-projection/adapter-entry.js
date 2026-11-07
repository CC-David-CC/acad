const {runWorkerRectangleExtrusion}=require('../../modules/engine/extrusion/rectanglePrismAdapter.ts');
const {runWorkerCenteredThroughHole}=require('../../modules/engine/extrusion/centeredHoleAdapter.ts');
const {createEvaluationResourcePool}=require('../../web/app/cad/craft/evaluationResources.mjs');
window.holeAdapterFixture={runWorkerRectangleExtrusion,runWorkerCenteredThroughHole,createEvaluationResourcePool};
const {tessDataToGeom}=require('../../web/app/cad/scene/views/viewUtils.js');
window.holeAdapterFixture.testFaceGeometry=(model)=>model.faces.every(f=>{const g=tessDataToGeom(f.brepFace.data.tessellation.data);try{return g.attributes.position.count===f.brepFace.data.tessellation.data.length*3&&g.attributes.normal.count===g.attributes.position.count;}finally{g.dispose()}});
