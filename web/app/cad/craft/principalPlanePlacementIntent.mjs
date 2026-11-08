import {planeRecord,captureSourcePlaneParameters,sourcePlaneDepth,planeFailure} from '../../sketcher/headless/sourcePlaneDepthEnvelope.mjs';
import {canonicalAuthoredFeatureId} from './authoredFeatureIdentity.mjs';

// Data capture only. These records confer no wizard/J/owner/replay authority.
const fail=(code,message)=>{throw planeFailure(code,message);};
const orientation=value=>['XY','XZ','ZY'].includes(value);
const positiveId=value=>Number.isSafeInteger(value)&&value>0;
const index=value=>Number.isSafeInteger(value)&&value>=0&&value<=255;
const freezeRecord=value=>Object.freeze({...value});

export function capturePrincipalPlanePlacementRequest(value){
 const p=planeRecord(value,['revision','index','featureId','faceId','orientation','depth']);
 if(typeof p.revision!=='string'||!p.revision||p.revision.length>256||!index(p.index)||!positiveId(p.featureId)||
    typeof p.faceId!=='string'||!p.faceId||p.faceId.length>256||!orientation(p.orientation)||!sourcePlaneDepth(p.depth))
  fail('INVALID_REQUEST','Use an inspected principal source identity and finite signed millimeter placement.');
 return freezeRecord(p);
}

// Only explicit UI literal input is converted. No identifier, unit expression,
// formula table, source binding or formatted quantity is evaluated here.
export function capturePrincipalPlaneDepthLiteral(value){
 if(typeof value==='number'){
  if(!sourcePlaneDepth(value))fail('INVALID_REQUEST','Principal depth must be finite and within its signed millimeter domain.');
  return value;
 }
 if(typeof value!=='string'||value.length>128)fail('UNSUPPORTED_PARAMETERS','Principal placement accepts a numeric literal, not a bound expression.');
 const text=value.trim();
 if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(text))
  fail('UNSUPPORTED_PARAMETERS','Principal placement accepts a numeric literal, not a bound expression.');
 const number=Number(text),mantissa=text.split(/[eE]/,1)[0];
 if(!sourcePlaneDepth(number)||number===0&&/[1-9]/.test(mantissa))
  fail('INVALID_REQUEST','The literal depth is outside the finite representable millimeter domain.');
 return number;
}

export function capturePrincipalPlanePlacementDraft(value){
 const raw=planeRecord(value,['revision','index','featureId','faceId','beforeOperation','draft']);
 const operation=planeRecord(raw.beforeOperation,['type','params']);
 if(operation.type!=='PLANE')fail('UNSUPPORTED_PLANE','Only an existing independent principal PLANE is supported.');
 const old=planeRecord(operation.params,['featureId','orientation','datum','depth']);
 if(typeof old.depth!=='number')fail('UNSUPPORTED_PARAMETERS','An existing depth expression must remain authored; numeric placement cannot replace its binding.');
 const before=captureSourcePlaneParameters(old),draft=planeRecord(raw.draft,['featureId','orientation','datum','depth']);
 if(canonicalAuthoredFeatureId(before.featureId)!==raw.featureId||!Object.is(draft.featureId,before.featureId))
  fail('INVALID_REQUEST','Principal placement must preserve the actual authored feature identity and spelling.');
 if(draft.datum!==null)fail('UNSUPPORTED_PARAMETERS','Picked datum or parent changes are outside numeric principal placement.');
 const request=capturePrincipalPlanePlacementRequest({revision:raw.revision,index:raw.index,featureId:raw.featureId,faceId:raw.faceId,
  orientation:draft.orientation,depth:capturePrincipalPlaneDepthLiteral(draft.depth)});
 const beforeOperation=Object.freeze({type:'PLANE',params:before}),afterOperation=Object.freeze({type:'PLANE',params:Object.freeze({
  featureId:before.featureId,orientation:request.orientation,datum:before.datum,depth:request.depth})});
 return Object.freeze({request,beforeOperation,afterOperation,changed:before.orientation!==request.orientation||before.depth!==request.depth});
}

// Optional future source-frame J data. Exact current J/head/signature ownership
// and proof/prefix publication are REQUIRED from the coordinator, never this.
export function capturePrincipalPlaneReviewPosition(value,context){
 const p=planeRecord(value,['beforePointer','afterPointer','beforeSignature','afterSignature']),c=planeRecord(context,['index','historyLength']);
 if(!index(c.index)||!Number.isSafeInteger(c.historyLength)||c.historyLength<1||c.historyLength>256||c.index>=c.historyLength||
    p.beforePointer!==c.index-1||p.afterPointer!==c.historyLength-1||
    [p.beforeSignature,p.afterSignature].some(text=>typeof text!=='string'||!text||text.length>262144)||p.beforeSignature===p.afterSignature)
  fail('INVALID_REQUEST','A source placement review must bind its before-prefix and after-tip definition signatures.');
 return freezeRecord(p);
}
export function principalPlaneReviewPositionByteSize(value,context){
 const p=capturePrincipalPlaneReviewPosition(value,context);
 // UTF-8 is at most3 bytes per UTF-16 code unit (surrogate pairs need4/2).
 // Covers both storage encodings conservatively without copying/hashing or
 // allocating a giant encoder/serialized history on the UI thread.
 return 256+3*(p.beforeSignature.length+p.afterSignature.length);
}
