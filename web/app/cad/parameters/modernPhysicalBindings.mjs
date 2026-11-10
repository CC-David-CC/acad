import {SOURCE_PROJECTION_TYPE,captureSourceProjection} from '../../../../modules/engine/source/sourceProjectionIntent.mjs';
import {captureAuthoredCountersinkIntent} from '../../../../modules/engine/solid/authoredCountersinkIntent.mjs';
import {captureAuthoredCounterboreIntent} from '../../../../modules/engine/solid/authoredCounterboreIntent.mjs';
import {PROFILE_EXTENT_TYPE,captureOwnedProfileExtentFeature} from '../../../../modules/engine/solid/ownedProfileExtentFeature.mjs';
import {captureAuthoredBlindHoleIntent} from '../../../../modules/engine/solid/authoredBlindHoleIntent.mjs';
import {historyStateVersion} from '../../../../modules/engine/solid/authoredHistoryState.mjs';
import {AUTHORED_SOLID_KINDS} from '../../../../modules/engine/solid/authoredSolidKinds.mjs';
import {captureAuthoredHoleIntent} from '../../../../modules/engine/solid/authoredLengthBinding.mjs';
import {captureSelectedProfileDepthParameters} from '../craft/authoredEditJournal.mjs';
export const MODERN_PHYSICAL_TYPES=Object.freeze(['WORKER_SELECTED_PROFILE_EXTRUDE_V2','WORKER_THROUGH_HOLES_V1','WORKER_CENTERED_BLIND_HOLE_V1','WORKER_CENTERED_COUNTERBORE_V1','WORKER_CENTERED_COUNTERSINK_V1',PROFILE_EXTENT_TYPE]);
// A formula dependency document is not a geometric simultaneous-equation system.
export function captureModernPhysicalProfiles(history){
 if(historyStateVersion(history)===1)throw Object.assign(Error('Typed history controls are not integrated.'),{code:'UNSUPPORTED_PARAMETERS'});
 if(!Array.isArray(history)||history.length>256)throw Object.assign(Error('Expected bounded authored parameter history.'),{code:'UNSUPPORTED_PARAMETERS'});
 const modern=history.some(row=>AUTHORED_SOLID_KINDS.includes(row.type));if(!modern)return null;
 for(const row of history)if(row.type===SOURCE_PROJECTION_TYPE)captureSourceProjection(row.params);else if(row.type!=='PLANE'&&!MODERN_PHYSICAL_TYPES.includes(row.type))throw Object.assign(Error('Typed generic parts currently support only selected profiles and through holes.'),{code:'UNSUPPORTED_PARAMETERS'});
 const profiles=[],byFeature=new Map(),faces=new Set();
 for(let index=0;index<history.length;index++){
  const row=history[index];
  if(['WORKER_SELECTED_PROFILE_EXTRUDE_V2',PROFILE_EXTENT_TYPE].includes(row.type)){
   const profile=row.type===PROFILE_EXTENT_TYPE?captureOwnedProfileExtentFeature(row.params):captureSelectedProfileDepthParameters(row.params);
   if(byFeature.has(profile.featureId)||faces.has(profile.faceId))throw Object.assign(Error('Selected profile identity is ambiguous.'),{code:'UNSUPPORTED_PARAMETERS'});
   const entry=Object.freeze({index,type:row.type,profile});profiles.push(entry);byFeature.set(profile.featureId,entry);faces.add(profile.faceId);
  }else if(['WORKER_THROUGH_HOLES_V1','WORKER_CENTERED_BLIND_HOLE_V1','WORKER_CENTERED_COUNTERBORE_V1','WORKER_CENTERED_COUNTERSINK_V1'].includes(row.type)){
   const hole=row.type==='WORKER_CENTERED_COUNTERSINK_V1'?captureAuthoredCountersinkIntent(row.params):row.type==='WORKER_CENTERED_COUNTERBORE_V1'?captureAuthoredCounterboreIntent(row.params):row.type==='WORKER_CENTERED_BLIND_HOLE_V1'?captureAuthoredBlindHoleIntent(row.params):captureAuthoredHoleIntent(row.params);
   const source=byFeature.get(hole.sourceFeatureId),profile=source?.profile;
   if(!source||hole.sourceFaceId!==profile.faceId||hole.sourceRegionId!==profile.regionId||hole.engine!==profile.engine||hole.engineRevision!==profile.engineRevision)throw Object.assign(Error('The typed hole source must be an earlier matching selected profile in the same part build.'),{code:'UNSUPPORTED_PARAMETERS'});
   if(['WORKER_CENTERED_COUNTERBORE_V1','WORKER_CENTERED_COUNTERSINK_V1'].includes(row.type)&&source.type!=='WORKER_SELECTED_PROFILE_EXTRUDE_V2')throw Object.assign(Error('Counterbores and countersinks require the existing positive-depth selected-profile source.'),{code:'UNSUPPORTED_PARAMETERS'});
  }
 }
 if(!profiles.length)throw Object.assign(Error('A selected profile is required by this typed transaction.'),{code:'UNSUPPORTED_PARAMETERS'});
 return Object.freeze(profiles);
}
export function requireModernPhysicalHistory(history){
 return captureModernPhysicalProfiles(history)!==null;
}
// Pure admission over existing authority. No facade, quantity table, ticket or
// new lifetime state: readers retain their captured service/stream guards.
export function physicalReadUnsupportedReason(expressions,history){
 if(expressions.errors$.value.length)return 'The accepted project parameters are invalid.';
 if(!expressions.isTyped)return expressions.script$.value.trim()||Object.keys(expressions.table$.value||{}).length?'Nonempty legacy project expressions are unsupported by this reader.':null;
 if(!expressions.hasCurrentPhysicalResult())return 'The accepted typed project parameters are stale.';
 try{if(!requireModernPhysicalHistory(history))return 'Typed reads require the integrated selected profile and through-hole history.';}
 catch(error){return error.message||'This typed feature history is unsupported.';}
 return null;
}
