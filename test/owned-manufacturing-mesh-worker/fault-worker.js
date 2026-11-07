// TEST-ONLY throws after genuine Native work; no successful reply substitute.
const mode=new URL(self.location.href).searchParams.get('mode'),nativePost=self.postMessage.bind(self),witness={mode,reads:0,releases:[],caught:null};
self.postMessage=function(message,...args){
 if(message.kind==='ready'){
  const read=Module._ReadOwnedManufacturingMeshV1,release=Module._ReleaseOwnedManufacturingMeshV1,service=self.readOwnedManufacturingMesh;
  Module._ReadOwnedManufacturingMeshV1=function(...args){const status=read(...args);witness.reads++;if(witness.reads===1&&mode!=='release-only')throw Error('injected-primary-after-genuine-read');return status;};
  Module._ReleaseOwnedManufacturingMeshV1=function(...args){const status=release(...args),r=globalThis.__OCI_EXCHANGE_VAL;witness.releases.push({status,released:r?.released,activeCount:r?.activeCount});if(mode!=='primary-only')throw 0;return status;};
  self.readOwnedManufacturingMesh=async function(...args){try{return await service(...args);}catch(e){witness.caught={code:e?.code??null,primaryMessage:e?.operationError?.message??e?.message??null,cleanupCauseIsZero:e?.cause===0};throw e;}};
 }
 if(message.kind==='error'&&message.seq)message={...message,error:JSON.stringify({...witness,sourceNames:Module._OwnedShapeNamesV2()})};
 return nativePost(message,...args);
};
importScripts('/modules/engine/mount/manufacturing-mesh-worker.js');
