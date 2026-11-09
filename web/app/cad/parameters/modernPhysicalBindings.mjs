import {captureOwnedProfileExtentFeature} from '../../../../modules/engine/solid/ownedProfileExtentFeature.mjs';
import {captureAuthoredBlindHoleIntent} from '../../../../modules/engine/solid/authoredBlindHoleIntent.mjs';
import {historyStateVersion} from '../../../../modules/engine/solid/authoredHistoryState.mjs';
import {AUTHORED_SOLID_KINDS} from '../../../../modules/engine/solid/authoredSolidKinds.mjs';
import {captureAuthoredHoleIntent} from '../../../../modules/engine/solid/authoredLengthBinding.mjs';
export const MODERN_PHYSICAL_TYPES=Object.freeze(['WORKER_SELECTED_PROFILE_EXTRUDE_V2','WORKER_THROUGH_HOLES_V1','WORKER_CENTERED_BLIND_HOLE_V1','WORKER_SELECTED_PROFILE_EXTENT_EXTRUDE_V1']);
// A formula dependency document is not a geometric simultaneous-equation system.
export function requireModernPhysicalHistory(history){
 if(historyStateVersion(history)===1)throw Object.assign(Error('Typed history controls are not integrated.'),{code:'UNSUPPORTED_PARAMETERS'});
 if(!Array.isArray(history)||history.length>256)throw Object.assign(Error('Expected bounded authored parameter history.'),{code:'UNSUPPORTED_PARAMETERS'});
 const modern=history.some(row=>AUTHORED_SOLID_KINDS.includes(row.type));if(!modern)return false;
 for(const row of history)if(row.type!=='PLANE'&&!MODERN_PHYSICAL_TYPES.includes(row.type))throw Object.assign(Error('Typed generic parts currently support only selected profiles and through holes.'),{code:'UNSUPPORTED_PARAMETERS'});
 const profiles=history.filter(row=>[MODERN_PHYSICAL_TYPES[0],MODERN_PHYSICAL_TYPES[3]].includes(row.type));
 if(profiles.length!==1)throw Object.assign(Error('One unambiguous selected profile is supported by this typed transaction.'),{code:'UNSUPPORTED_PARAMETERS'});
 const profile=profiles[0].params;if(profiles[0].type===MODERN_PHYSICAL_TYPES[3])captureOwnedProfileExtentFeature(profile);
 for(const row of history)if([MODERN_PHYSICAL_TYPES[1],MODERN_PHYSICAL_TYPES[2]].includes(row.type)){const hole=row.type===MODERN_PHYSICAL_TYPES[2]?captureAuthoredBlindHoleIntent(row.params):captureAuthoredHoleIntent(row.params);if(hole.sourceFeatureId!==profile.featureId||hole.sourceFaceId!==profile.faceId||hole.sourceRegionId!==profile.regionId||hole.engine!==profile.engine||hole.engineRevision!==profile.engineRevision)throw Object.assign(Error('The typed hole source must be the actual selected profile in the same part build.'),{code:'UNSUPPORTED_PARAMETERS'});}
 return true;
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
