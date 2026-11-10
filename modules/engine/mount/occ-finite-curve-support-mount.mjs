// Explicit raw-support-only component factory. Its common controller branch,
// catalog and staged assets are separate Root-owned prerequisites. This source
// leaf alone confers NO mounted availability or certified finite events.
import {createWorkerMount} from './worker-controller.mjs';
import {FINITE_CURVE_SUPPORT_CANDIDATE as candidate} from './ownedFiniteCurveSupportCandidate.mjs';
import {
  FINITE_CURVE_SUPPORT_OPERATION,
  captureFiniteCurveSupportRequest,
  encodeFiniteCurveSupportRequest,
  captureFiniteCurveSupportResult,
  captureFiniteCurveSupportDescriptor
} from './finiteCurveSupportRequest.mjs';

export function createFiniteCurveSupportOccMount(options) {
  return createWorkerMount(options,Object.freeze({
    engine:candidate.engine,
    representation:candidate.representation,
    sourceQueryOnly:true,
    finiteCurveSupportReadVersion:1,
    mesh:false,
    profile:false,
    jsSha256:candidate.jsSha256,
    wasmSha256:candidate.wasmSha256,
    captureFiniteCurveSupportRequest,
    encodeFiniteCurveSupportRequest,
    captureFiniteCurveSupportResult,
    captureFiniteCurveSupportDescriptor,
    finiteCurveSupportOperation:FINITE_CURVE_SUPPORT_OPERATION
  }));
}
