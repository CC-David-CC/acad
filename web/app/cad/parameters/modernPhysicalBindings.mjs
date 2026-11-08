import {AUTHORED_SOLID_KINDS} from '../../../../modules/engine/solid/authoredSolidKinds.mjs';
import {captureAuthoredHoleIntent} from '../../../../modules/engine/solid/authoredLengthBinding.mjs';
import {prepareTypedRectangle} from './typedRectangleBindings.mjs';
export const MODERN_PHYSICAL_TYPES=Object.freeze(['WORKER_SELECTED_PROFILE_EXTRUDE_V2','WORKER_THROUGH_HOLES_V1']);
// A formula dependency document is not a geometric simultaneous-equation system.
export function requireModernPhysicalHistory(history){
 if(!Array.isArray(history)||history.length>256)throw Object.assign(Error('Expected bounded authored parameter history.'),{code:'UNSUPPORTED_PARAMETERS'});
 const modern=history.some(row=>AUTHORED_SOLID_KINDS.includes(row.type));if(!modern)return false;
 for(const row of history)if(row.type!=='PLANE'&&!MODERN_PHYSICAL_TYPES.includes(row.type))throw Object.assign(Error('Typed generic parts currently support only selected rectangles and through holes.'),{code:'UNSUPPORTED_PARAMETERS'});
 const profiles=history.filter(row=>row.type===MODERN_PHYSICAL_TYPES[0]);
 if(profiles.length!==1)throw Object.assign(Error('One unambiguous selected rectangle is supported by this typed transaction.'),{code:'UNSUPPORTED_PARAMETERS'});
 const profile=profiles[0].params;
 for(const row of history)if(row.type===MODERN_PHYSICAL_TYPES[1]){const hole=captureAuthoredHoleIntent(row.params);if(hole.sourceFeatureId!==profile.featureId||hole.sourceFaceId!==profile.faceId||hole.sourceRegionId!==profile.regionId||hole.engine!==profile.engine||hole.engineRevision!==profile.engineRevision)throw Object.assign(Error('The typed hole source must be the actual selected rectangle in the same part build.'),{code:'UNSUPPORTED_PARAMETERS'});}
 return true;
}
// Worker-only: parse source constraints and resolve dimensions from the current
// typed result; no inferred topology or caller-provided solved geometry.
export function resolveSelectedRectangleTarget(target,readSketch,resolveLength){
 if(typeof readSketch!=='function')throw Error('Selected rectangle source inventory is required.');
 const prepared=prepareTypedRectangle(readSketch(target.faceId),[],resolveLength),bindings=new Map(prepared.bindings.map(row=>[row.segmentId,row.value]));
 const value=name=>{const raw=bindings.get(name),n=typeof raw==='number'?raw:typeof raw==='string'&&/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(raw.trim())?Number(raw):resolveLength(raw);if(!Number.isFinite(n)||n<0.001||n>1e6)throw Error('Selected rectangle length is outside the supported domain.');return n;};
 return Object.freeze({...target,dimension:'length',width:value('rect-0'),height:value('rect-1'),widthBinding:bindings.get('rect-0'),heightBinding:bindings.get('rect-1')});
}
