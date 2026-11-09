// Canonical body identity only. No geometry/Native/source-capture dependency.
const fail=message=>{throw Object.assign(new Error(message),{code:'INVALID_REQUEST'});};
export function solidBodyId(featureId){if(!Number.isSafeInteger(featureId)||featureId<1)fail('Invalid feature identity.');return 'worker-solid:1:'+JSON.stringify([featureId,'body']);}
