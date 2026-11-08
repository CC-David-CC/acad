import {hashCanonicalInWorker} from './incrementalCanonical.mjs';
import {PREPARE_LIMIT_BYTES,validateManufacturingMetadata} from './manufacturingMetadata.mjs';
import {encodeProjectEnvelope} from './projectEnvelope.mjs';

// Caller owns the detached snapshot and worker, guarantees no mutation of the
// snapshot, supplies a monotonic document generation, and terminates worker.
// Preserve both existing digest domains and the native version-2 envelope.
export async function prepareManufacturingForSave(captured,{worker,signal,getGeneration,maxBytes=PREPARE_LIMIT_BYTES}) {
  if (!captured || !captured.project || !captured.manufacturing || typeof getGeneration !== 'function') throw new Error('Project is unavailable');
  const generation=getGeneration();
  const check=()=>{if(signal?.aborted)throw new Error('Hash cancelled');if(getGeneration()!==generation)throw new Error('Project changed while preparing the save');};
  const manufacturing=validateManufacturingMetadata(captured.manufacturing), project=captured.project;
  check();
  const geometryRevision=await hashCanonicalInWorker({kind:'codi-jsketcher-geometry-v1',project},worker,signal,getGeneration,maxBytes);
  check();
  if(manufacturing.revision!==geometryRevision)throw Object.assign(new Error('Model changed; review material assignments before saving'),{code:'MANUFACTURING_REVIEW_REQUIRED'});
  // The legacy limit applies to canonical {project, manufacturing}. The
  // digest domain adds this fixed ASCII field; account for it without changing
  // the accepted payload bound or serializing that document into one string.
  const domainOverhead=new TextEncoder().encode('\"kind\":\"codi-jsketcher-manufacturing-snapshot-v1\",').byteLength;
  const snapshotDigest=await hashCanonicalInWorker({kind:'codi-jsketcher-manufacturing-snapshot-v1',project,manufacturing},worker,signal,getGeneration,maxBytes+domainOverhead);
  check();
  return {envelope:encodeProjectEnvelope(project,manufacturing),geometryRevision,snapshotDigest};
}
