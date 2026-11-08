import {canonicalAuthoredFeatureId} from './authoredFeatureIdentity.mjs';
export function sourcePlaneShellId(raw, materializedFeatureId) {
  const descriptor = raw && typeof raw === 'object' && !Array.isArray(raw)
    ? Object.getOwnPropertyDescriptor(raw, 'featureId') : null;
  const value = descriptor && Object.prototype.hasOwnProperty.call(descriptor, 'value') ? descriptor.value : undefined;
  const featureId = canonicalAuthoredFeatureId(value);
  if (!descriptor?.enumerable || !Number.isSafeInteger(featureId) || featureId <= 0 || materializedFeatureId !== featureId) {
    throw Object.assign(new Error('Plane identity requires its canonical saved positive safe feature ID.'), {code:'INVALID_FEATURE_ID'});
  }
  return 'source-plane:1:' + JSON.stringify([featureId, 'body']);
}

export function sourcePlaneFaceId(featureId){return sourcePlaneShellId({featureId},featureId)+'/SURFACE';}
