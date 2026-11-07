import CadError from 'utils/errors';
import {MObject} from './mobject';

// Representation metadata is a compatibility boundary, not authorization.
// The coordinator separately validates document lifetime and engine ownership.
export function workerGeometryRoot(model: MObject): MObject | null {
  const root = model?.root;
  return root?.ext?.workerGeometry != null ? root : null;
}

export function assertLegacyGeometry(model: MObject, operation: string): void {
  if (workerGeometryRoot(model)) {
    throw new CadError({kind:CadError.KIND.UNSUPPORTED_CASE, code:'WORKER_REPRESENTATION_UNSUPPORTED',
      userMessage:`${operation} is not supported for this body yet. No geometry conversion was performed.`});
  }
}

// Portable model IDs never name an object in the legacy command registry.
// This also covers internal callers that pass an ID instead of an MObject.
export function assertLegacyCommandName(name: string, operation: string): void {
  if (name.startsWith('worker-prism:') || name.startsWith('worker-enclosure:')) {
    throw new CadError({kind:CadError.KIND.UNSUPPORTED_CASE, code:'WORKER_REPRESENTATION_UNSUPPORTED',
      userMessage:`${operation} cannot use a worker geometry ID as a legacy engine name.`});
  }
}

export function assertDurableReference(model: MObject, operation: string): void {
  if (model?.ext?.workerIdentity?.stability === 'transient' ||
      model?.ext?.vertexIdentity?.stability === 'transient' ||
      model?.topology?.data?.portableIdentity?.stability === 'transient') {
    throw new CadError({kind:CadError.KIND.UNSUPPORTED_CASE, code:'TRANSIENT_REFERENCE_UNSUPPORTED',
      userMessage:`${operation} cannot save a reference to this temporary edge or vertex.`});
  }
}

export function requireLegacyPointer(model: MObject, operation: string): number {
  assertLegacyGeometry(model, operation);
  if (model?.root?.topology?.data?.__meshWithOrigins) {
    throw new CadError({kind:CadError.KIND.UNSUPPORTED_CASE, code:'NATIVE_REPRESENTATION_UNSUPPORTED',
      userMessage:`${operation} cannot mix Native Mesh and OCC geometry. No conversion was performed.`});
  }
  return requireLegacyTopologyPointer(model?.topology, operation);
}

// Classifiers receive raw topology rather than a model wrapper. They still
// must not pass an absent/zero/invalid address into the in-page kernel.
export function requireLegacyTopologyPointer(topology: any, operation: string): number {
  const ptr = topology?.data?.externals?.ptr;
  if (!Number.isSafeInteger(ptr) || ptr <= 0) {
    throw new CadError({kind:CadError.KIND.INVALID_INPUT, code:'LEGACY_GEOMETRY_UNAVAILABLE',
      userMessage:`${operation} cannot use this geometry because its engine representation is unavailable.`});
  }
  return ptr;
}
