// Light backend transport policy only. These codes do NOT grant geometry or
// reusable-realm authority: actual Native WeakMap/cleanup disposition wins.
// Native subsets are the exact current countersinkNativeCalls frustum/nativeError
// and ownedBooleanContract BOOLEAN_REFUSAL_CODES vocabularies, not text matches.
export const COUNTERSINK_NATIVE_REFUSALS=Object.freeze([
 'PROFILE_CONSTRUCTION_FAILED',
 'CONICAL_INVALID_REQUEST','CONICAL_UNSUPPORTED_DOMAIN','CONICAL_INVALID_SHAPE',
 'CONICAL_CONSTRUCTION_FAILED','CONICAL_PROVENANCE_UNRESOLVED','CONICAL_RESOURCE_LIMIT',
 'BOOLEAN_INVALID_REQUEST','BOOLEAN_INVALID_INPUT','BOOLEAN_NON_SOLID_INPUT',
 'BOOLEAN_NON_SOLID_RESULT','BOOLEAN_FAILED','BOOLEAN_INVALID_RESULT',
 'BOOLEAN_RESOURCE_LIMIT','BOOLEAN_COPY_FAILED'
]);
export const COUNTERSINK_TERMINAL_CODES=Object.freeze([
 'ENGINE_FAILURE','ENGINE_CAPABILITY_UNAVAILABLE','ENGINE_CLEANUP_FAILED','PROFILE_INSPECTION_FAILED',
 'MEASUREMENT_PRECISION_UNRESOLVED','CONICAL_INPUT_CHANGED',
 'CONICAL_INSPECTION_FAILED','CONICAL_PUBLICATION_FAILED'
]);
export const COUNTERSINK_OPERATION=Object.freeze({id:'solid.holes.countersink',version:1,
 kinds:Object.freeze(['centered-countersink-conical']),source:'selected-rectangle',
 entry:'source-last-cap',termination:'through-shank-interior-cone',nativeResultCost:4,
 qualification:'workflow-unqualified'});

export const COUNTERSINK_NATIVE_PORTS=Object.freeze(['_CreateOwnedConicalFrustumV1','_ReadOwnedConeTopologyV1']);
