// Analytic mathematical fixtures, not measurements from a native engine.
import {make as throughFixture} from '../owned-through-hole-plan/fixtures.mjs';
import {solidBodyId} from '../../modules/engine/solid/solidIntent.mjs';
export function make(options={}){
 const through=throughFixture(options),seed={...through.request},producerFeatureId=70;
 const request={version:1,unit:'millimeter',engine:'occ',engineRevision:seed.engineRevision,featureId:90,target:solidBodyId(producerFeatureId),producerFeatureId,seedFeatureId:seed.featureId,axis:'source-local-x-positive',count:3,spacing:20};
 const binding={engineRevision:seed.engineRevision,sourceFeatureId:seed.sourceFeatureId,sourceFaceId:seed.sourceFaceId,sourceRegionId:seed.sourceRegionId,seedFeatureId:seed.featureId,producerFeatureId,target:request.target};
 // This target hint represents the already-seeded part AFTER outer treatments.
 // Independent reference: one centered bore and two radius3 outer corner fillets.
 through.targetMetrics.nativeVolume-=Math.PI*(seed.diameter/2)**2*through.sourceProfile.depth+2*(9-9*Math.PI/4)*through.sourceProfile.depth;
 return {request,seed,sourceProfile:through.sourceProfile,targetMetrics:through.targetMetrics,binding};
}
