// Disposable native reconstruction. Caller supplies a pinned mount factory and
// authored/account revision guard. Preview triangles never enter this path.
export async function readManufacturingEnclosurePair({plan,createMount,isCurrent,signal,maxDeviationMm=0.001,version=1}) {
 if(version!==1&&version!==2)throw Error('Unsupported manufacturing enclosure version');
 if(typeof createMount!=='function'||typeof isCurrent!=='function')throw Error('Manufacturing reconstruction is unavailable');
 const captured=structuredClone(plan);
 const check=()=>{if(signal?.aborted||!isCurrent())throw new DOMException('Manufacturing export was cancelled or changed','AbortError');};
 check();let mount;
 try {
  mount=createMount();
  await new Promise((resolve,reject)=>{
   const cleanup=()=>signal?.removeEventListener('abort',aborted);
   const aborted=()=>{cleanup();reject(new DOMException('Manufacturing export cancelled','AbortError'));};
   if(signal?.aborted){aborted();return;}
   signal?.addEventListener('abort',aborted,{once:true});
   Promise.resolve(mount.ready).then(value=>{cleanup();resolve(value);},error=>{cleanup();reject(error);});
  });check();
  if(version===2&&typeof mount.readEnclosureInterface!=='function')throw Error('Verified lid/label contact is unavailable');
  const pair=await mount.createEnclosure({op:'solid.enclosure.create',version,plan:captured},{signal});check();
  if(pair?.body?.role!=='BODY'||pair?.lid?.role!=='LID'||(version===2&&pair?.label?.role!=='LABEL'))throw Error('Invalid manufacturing enclosure pair');
  mount.assertEnclosureBinding(pair.body.handle,pair.lid.handle,pair.label?.handle);
  const parts={};
  for(const role of (version===2?['BODY','LID','LABEL']:['BODY','LID'])) {
   const handle=role==='BODY'?pair.body.handle:role==='LID'?pair.lid.handle:pair.label.handle;
   parts[role]=await mount.readEnclosureManufacturingMesh({op:'solid.enclosure.manufacturing-mesh',version:1,handle,maxDeviationMm},{signal});
   check();mount.assertEnclosureBinding(pair.body.handle,pair.lid.handle,pair.label?.handle);
   const part=parts[role];
   if(part?.role!==role||part.unit!=='millimeter'||part.quality!=='planar-boundary-checked-v1'||!(part.vertices instanceof Float64Array)||!(part.triangles instanceof Uint32Array))throw Error('Unsupported manufacturing mesh');
  }
  if(version===2){
   const proof=await mount.readEnclosureInterface({op:'solid.enclosure.interface',version:1,body:pair.body.handle,lid:pair.lid.handle,label:pair.label.handle,maxDeviationMm},{signal});
   check();mount.assertEnclosureBinding(pair.body.handle,pair.lid.handle,pair.label.handle);
   if(proof?.version!==1||proof.quality!=='paired-planar-contact-v1'||proof.unit!=='millimeter'||proof.maxDeviationMm!==maxDeviationMm||proof.surfaceCount!==5||!Number.isFinite(proof.commonVolume)||Math.abs(proof.commonVolume)>1e-7||!Array.isArray(proof.roles)||proof.roles.join(',')!=='LID,LABEL')throw Error('Verified lid/label contact is unavailable');
   parts.interfaceEvidence=Object.freeze({...proof,roles:Object.freeze([...proof.roles])});
  }
  check();return Object.freeze(parts);
 } finally {
  // Cleanup failure refuses successful output too. No native ownership escapes.
  if(mount)await mount.close();
 }
}
