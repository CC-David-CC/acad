// UNREGISTERED, private OCI busy-owner coordinator. This is not an entry point,
// context issuer, pair/capability admission, transport decoder or token publisher.
import {captureNumericCountersinkIntent,planOwnedCountersink} from './ownedCountersinkPlan.mjs';
import {createCountersinkNativeCalls,countersinkCallFailure} from './countersinkNativeCalls.mjs';
import {conicalFields,captureConicalConstruction} from './ownedConicalContract.mjs';
import {preparePolygonProfileExtrusion} from './polygonProfilePlan.mjs';
import {validatePrismProvenance,bindPrismSourceSlots} from './ownedTopologyContract.mjs';
import {resolveNativePlanarAttachment} from './nativePlanarAttachmentFacts.mjs';
import {validateOwnedBooleanResult} from './ownedBooleanContract.mjs';
import {qualifyConicalTool,qualifyCountersinkFirst,qualifyCountersinkFinal} from './countersinkFacts.mjs';
import {deriveSequentialInheritedSelectionIndexV2} from './selectionLineageIndex.mjs';
const error=(code,message,cause)=>Object.assign(Error(message),{code,cause});
const fail=(code,message,cause)=>{throw error(code,message,cause);};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
const contextKeys=['Module','malloc','free','runtimeRevision','parentName','sourceName','parentRecord','sourceRecord','sourceProfile','sourceConstruction','sourceCreationBinding','requireCurrent','allocateName','inspectWork','chargeSelectedResult'];
const workKeys=['maxNames','nextName','triangleLimit','triangleTotal','chargedResults'];

// ONLY a future lexical busy-operation owner may call this function. Matching
// these fields is necessary data validation, never authentication of a caller.
// The old Worker cannot issue sourceCreationBinding: integration is pending.
export async function runOwnedCountersinkWorker(value,numericIntent){
 const c=conicalFields(value,contextKeys),request=captureNumericCountersinkIntent(numericIntent);
 if(['malloc','free','requireCurrent','allocateName','inspectWork','chargeSelectedResult'].some(k=>typeof c[k]!=='function'))fail('ENGINE_CAPABILITY_UNAVAILABLE','A private countersink busy owner is required.');
 const source=c.sourceRecord,index=source?.index,binding=conicalFields(c.sourceCreationBinding,['featureId','faceId','sourceSha256','regionId','requestSha256']);
 if(!Object.isFrozen(c.sourceCreationBinding)||binding.featureId!==request.sourceFeatureId||binding.faceId!==request.sourceFaceId||binding.regionId!==request.sourceRegionId||!['sourceSha256','requestSha256'].every(k=>typeof binding[k]==='string'&&/^[a-f0-9]{64}$/.test(binding[k])))fail('COUNTERSINK_UNSUPPORTED_TARGET','The actual immutable constructor-input source binding is unavailable.');
 if(c.runtimeRevision!==request.engineRevision||c.parentName!==c.sourceName||c.parentRecord!==source||source?.featureId!==request.sourceFeatureId||index?.plan?.source!=='prism-construction-history'||index.plan.featureId!==request.producerFeatureId||c.sourceProfile?.version!==3||c.sourceProfile.region.id!==request.sourceRegionId)fail('COUNTERSINK_UNSUPPORTED_TARGET','Countersink requires the same actual earlier rectangular constructor.');
 let ownerLost=false;
 const guard=()=>{try{c.requireCurrent();}catch(cause){ownerLost=true;throw Object.assign(error('ENGINE_FAILURE','The exclusive countersink operation owner is no longer current.',cause),{terminateWorker:true});}};
 guard();const calls=createCountersinkNativeCalls({...c,requireCurrent:guard});
 const work=()=>{
  guard();const w=conicalFields(c.inspectWork(),workKeys);
  if(w.maxNames!==32||w.triangleLimit!==100000||!['nextName','triangleTotal','chargedResults'].every(k=>Number.isSafeInteger(w[k])&&w[k]>=0)||w.nextName>w.maxNames||w.chargedResults>w.nextName||w.triangleTotal>w.triangleLimit)fail('ENGINE_CLEANUP_FAILED','The actual shared lifetime work state is unqualified.');return w;
 };
 const originalWork=work(),baseline=calls.census(),beforeTopology=calls.topology(c.parentName),beforeMetrics=calls.metrics(c.parentName),preparedSource=preparePolygonProfileExtrusion(c.sourceProfile);
 // The retained map contains bindPrismSourceSlots' complete record. Validate
 // Native roles first, then recompute its actual source slots, preserving all.
 const construction=c.sourceConstruction,validatedSource=validatePrismProvenance({status:construction?.status,data:construction?.data},beforeTopology,preparedSource);
 if(validatedSource.status!=='available'||!same(bindPrismSourceSlots(validatedSource,preparedSource),construction))fail('COUNTERSINK_ENTRY_UNRESOLVED','The actual retained source prism construction is unavailable.');
 if(Math.abs(beforeMetrics.nativeVolume-preparedSource.expected.volume)>Math.max(1e-7,preparedSource.expected.volume*1e-9)||['min','max'].some(k=>beforeMetrics.nativeBounds[k].some((n,i)=>Math.abs(n-preparedSource.expected.bounds[k][i])>1e-6)))fail('COUNTERSINK_UNSUPPORTED_TARGET','Actual constructor metrics differ from the captured numeric source.');
 if(baseline<1)fail('ENGINE_CLEANUP_FAILED','The retained actual constructor has no owned-name census membership.');
 const sourceCaps={first:validatedSource.data.caps.firstFace,last:validatedSource.data.caps.lastFace};
 for(const [role,ordinal] of [['first-cap',sourceCaps.first],['last-cap',sourceCaps.last]]){
  const rows=index.plan.faces.filter(row=>row.role===role&&row.originFeatureId===request.sourceFeatureId);
  if(rows.length!==1||index.resolveFace(rows[0].id)!==ordinal||role==='last-cap'&&rows[0].id!==request.entryFaceId)fail('COUNTERSINK_ENTRY_UNRESOLVED','Actual source builder cap and current authored selection disagree.');
 }
 const entry=resolveNativePlanarAttachment({topology:beforeTopology,index,sourceProfile:c.sourceProfile,request:{sourceRegionId:request.sourceRegionId,framePolicy:'extrusion-cap-source-datum-v1',selectionId:request.entryFaceId,originFeatureId:request.sourceFeatureId,sourceFeatureId:request.sourceFeatureId}});
 const plan=planOwnedCountersink({request,sourceProfile:c.sourceProfile,entry,targetMetrics:beforeMetrics}),smallPrepared=preparePolygonProfileExtrusion(plan.smallTool);
 const inputSeal=JSON.stringify({profile:c.sourceProfile,construction,binding:c.sourceCreationBinding});
 const attempts=new Map(),cleanupFailures=[],counts=[];let finalName=null,output,complete=false,operationFailed=false,operationError,preservationFailure=null;
 const cleanup=(message,cause)=>{complete=false;const e=error('ENGINE_CLEANUP_FAILED',message,cause);if(cleanupFailures.length<8)cleanupFailures.push(e);return e;};
 const exclusive=()=>{guard();if(JSON.stringify({profile:c.sourceProfile,construction:c.sourceConstruction,binding:c.sourceCreationBinding})!==inputSeal){ownerLost=true;throw error('ENGINE_FAILURE','Captured countersink source metadata changed.');}};
 const preserved=()=>{
  exclusive();if(!same(calls.topology(c.parentName),beforeTopology)||!same(calls.metrics(c.parentName),beforeMetrics))fail('ENGINE_FAILURE','Retained Native source catalog or metrics changed.');exclusive();
 };
 const pause=async()=>{exclusive();await tick();exclusive();};
 function attempt(name,fn){
  exclusive();if(attempts.size>=4||attempts.has(name)||name===c.parentName)throw cleanup('Invalid countersink attempted-name obligation.');
  const record={name,state:'attempting',topology:null,metrics:null};attempts.set(name,record);const before=calls.census();let result,failed=false,cause;
  try{result=fn();}catch(e){failed=true;cause=e;}
  // A thrown call revokes every exchanged payload. Census alone never repairs
  // uncertain allocation ownership, even if it happens to equal baseline.
  if(failed){const info=countersinkCallFailure(cause);if(!ownerLost&&info&&!info.terminal){try{if(calls.census()===before){record.state='absent';throw cause;}}catch(e){if(e===cause)throw cause;record.state='unknown';throw cleanup('Countersink refusal ownership is unconfirmed',{cause,error:e});}}record.state='unknown';throw cleanup('Countersink dispatch did not establish exact allocation ownership',cause);}
  try{if(calls.census()!==before+1)throw Error('Allocation census differs');record.topology=calls.topology(name);record.metrics=calls.metrics(name);record.state='owned';exclusive();}
  catch(e){record.state='unknown';throw cleanup('Countersink attempted result cannot be bound to its exact fresh name',e);}return result;
 }
 function release(name){
  const record=attempts.get(name);if(record?.state!=='owned')throw cleanup('Countersink release lacks a positive owned obligation.');
  let before;try{exclusive();before=calls.census();if(!same(calls.topology(name),record.topology)||!same(calls.metrics(name),record.metrics))throw Error('Owned catalog/metrics differ');}
  catch(cause){record.state='unknown';throw cleanup('Countersink release target exclusivity is unconfirmed',cause);}
  record.state='releasing';try{calls.release(name);if(calls.census()!==before-1)throw Error('Release census differs');exclusive();record.state='released';}
  catch(cause){record.state='unknown';throw cleanup('Countersink exact-name retirement is unconfirmed',cause);}
 }
 function charge(name,evidence){
  const record=attempts.get(name);if(record?.state!=='owned')throw cleanup('Countersink budget charge lacks its actual result.');
  const before=work(),census=calls.census(),triangles=evidence.triangles;
  if(!Number.isSafeInteger(triangles)||triangles<1||triangles>100000)throw cleanup('Actual result triangle work is unqualified.');
  const retiring=triangles>before.triangleLimit-before.triangleTotal;if(retiring)record.state='releasing';
  try{c.chargeSelectedResult(name,evidence);const after=work();if(retiring||calls.census()!==census||after.nextName!==before.nextName||after.triangleTotal!==before.triangleTotal+triangles||after.chargedResults!==before.chargedResults+1)throw Error('Actual shared charge differs');record.state='owned';}
  catch(cause){
   if(retiring){try{const after=work();if(cause?.code==='RESOURCE_LIMIT'&&calls.census()===census-1&&same(after,before)){record.state='released';throw cause;}}catch(e){if(e===cause)throw cause;record.state='unknown';throw cleanup('Countersink resource-refusal retirement is unconfirmed',{cause,error:e});}record.state='unknown';throw cleanup('Countersink resource charge has an unknown release outcome',cause);}
   try{if(calls.census()!==census)record.state='unknown';}catch{record.state='unknown';}throw cleanup('Countersink actual shared charge is unconfirmed',cause);
  }counts.push(triangles);
 }
 function constructorMetrics(created,evidence,expected=null){
  if(created.nativeVolume!==evidence.nativeVolume||!same(created.nativeBounds,evidence.nativeBounds))fail('COUNTERSINK_CONE_UNQUALIFIED','Actual constructor receipt and independent solid metrics differ.');
  if(expected&&(Math.abs(evidence.nativeVolume-expected.volume)>Math.max(1e-7,expected.volume*1e-9)||['min','max'].some(k=>evidence.nativeBounds[k].some((n,i)=>Math.abs(n-expected.bounds[k][i])>1e-6))))fail('COUNTERSINK_CONE_UNQUALIFIED','Actual Circle prism differs from its captured numeric request.');
 }
 function corroborate(before,cut,expected){
  const actual=cut.evidence.nativeVolume,tolerance=Math.max(128*Number.EPSILON*Math.max(Math.abs(before),Math.abs(actual)),expected*1e-8);
  if(expected<=8*tolerance||cut.created.empty||cut.created.solidCount!==1||before-actual<=0||Math.abs(before-actual-expected)>tolerance||Math.abs(cut.created.nativeVolume-actual)>tolerance||!same(cut.created.nativeBounds,cut.evidence.nativeBounds)||['min','max'].some(k=>cut.evidence.nativeBounds[k].some((n,i)=>Math.abs(n-beforeMetrics.nativeBounds[k][i])>1e-6)))fail('COUNTERSINK_CONE_UNQUALIFIED','Actual Native incremental removal or retained bounds do not corroborate this countersink.');
 }
 function boolean(a,b,name){
  const sourceTopologies=[calls.topology(a),calls.topology(b)],sourceMetrics=[calls.metrics(a),calls.metrics(b)],created=attempt(name,()=>calls.subtract(a,b,name));
  if(!same(calls.topology(a),sourceTopologies[0])||!same(calls.topology(b),sourceTopologies[1])||!same(calls.metrics(a),sourceMetrics[0])||!same(calls.metrics(b),sourceMetrics[1]))fail('ENGINE_FAILURE','Actual Boolean input catalogs or metrics changed.');
  const topology=calls.topology(name),validation=validateOwnedBooleanResult(created,{sourceTopologies,topology});
  if(validation.reason!==null)fail('COUNTERSINK_CONE_UNQUALIFIED','Actual sequential Native ancestry is unresolved: '+validation.reason);
  const evidence=calls.evidence(name);charge(name,evidence);return{created,topology,sourceTopologies,validation,evidence};
 }
 const localPoint=(rho,z)=>plan.frame.origin.map((n,i)=>n+plan.frame.x[i]*(plan.centerLocal[0]+rho)+plan.frame.y[i]*plan.centerLocal[1]+plan.frame.z[i]*z);
 // Finite analytic/ancestry proofs above remain authority; these actual Native
 // queries corroborate distinct material/void/boundary roles, never replace it.
 function points(name,final){
  const vertices=preparedSource.loops[0].vertices,clearance=Math.min(...vertices.map(v=>Math.abs(v[0]-plan.centerLocal[0])),...vertices.map(v=>Math.abs(v[1]-plan.centerLocal[1]))),material=(clearance+plan.entryRadius)/2,r=plan.smallRadius,R=plan.entryRadius,s=plan.transitionLevel,T=plan.sourceDepth;
  const rows=final?[[0,T/2,'outside'],[r,s/2,'boundary'],[r,s,'boundary'],[(r+R)/2,s,'inside'],[(r+R)/2,s+plan.sinkDepth/2,'boundary'],[r+(R-r)/4,s+plan.sinkDepth/2,'outside'],[r+3*(R-r)/4,s+plan.sinkDepth/2,'inside'],[R,T,'boundary'],[r,0,'boundary'],[material,T/2,'inside']]:[[0,T/2,'outside'],[r,T/2,'boundary'],[material,T/2,'inside'],[r,0,'boundary'],[r,T,'boundary']];
  const seen=new Set();for(const [rho,z,expected]of rows){const point=localPoint(rho,z),key=JSON.stringify(point);if(seen.has(key)||point.some(n=>!Number.isFinite(n)))fail('COUNTERSINK_CONE_UNQUALIFIED','Distinct Native corroboration roles are not representable.');seen.add(key);if(calls.classify(name,point)!==expected)fail('COUNTERSINK_CONE_UNQUALIFIED','Actual Native material/void/boundary corroboration disagrees.');}
 }
 try{
  if(originalWork.maxNames-originalWork.nextName<4)fail('RESOURCE_LIMIT','Countersink requires four remaining actual lifetime result names.');
  const names=[];for(let i=1;i<=4;i++){exclusive();const n=c.allocateName();if(n!=='m'+(originalWork.nextName+i)||names.includes(n)||n===c.parentName)throw cleanup('The actual monotone Native allocator changed.');names.push(n);}
  const allocated=work();if(allocated.nextName!==originalWork.nextName+4||allocated.triangleTotal!==originalWork.triangleTotal||allocated.chargedResults!==originalWork.chargedResults)throw cleanup('Name reservation changed actual shared work unexpectedly.');
  const [smallName,firstName,coneName,lastName]=names;finalName=lastName;
  const smallCreated=conicalFields(attempt(smallName,()=>calls.profile(smallName,smallPrepared)),['version','valid','solidCount','nativeVolume','nativeBounds','constructionProvenance']),smallTopology=calls.topology(smallName),smallConstruction=validatePrismProvenance(smallCreated.constructionProvenance,smallTopology,smallPrepared);
  if(smallCreated.version!==3||smallCreated.valid!==true||smallCreated.solidCount!==1||smallConstruction.status!=='available')fail('COUNTERSINK_CONE_UNQUALIFIED','Actual small tool construction is unavailable.');
  const smallEvidence=calls.evidence(smallName);constructorMetrics(smallCreated,smallEvidence,smallPrepared.expected);charge(smallName,smallEvidence);await pause();
  const first=boolean(c.parentName,smallName,firstName);preserved();corroborate(beforeMetrics.nativeVolume,first,plan.firstRemoval);
  const firstFacts=qualifyCountersinkFirst({first,toolConstruction:smallCreated.constructionProvenance,toolRequest:smallPrepared.request,sourceCaps,plan});points(firstName,false);release(smallName);await pause();
  const coneCreated=attempt(coneName,()=>calls.frustum(coneName,plan.frustumTool)),toolObservation=calls.cone(coneName);
  captureConicalConstruction(coneCreated,plan.frustumTool,toolObservation);qualifyConicalTool({observation:toolObservation,construction:coneCreated,request:plan.frustumTool});
  const coneEvidence=calls.evidence(coneName);constructorMetrics(coneCreated,coneEvidence);charge(coneName,coneEvidence);await pause();
  const final=boolean(firstName,coneName,finalName),resultObservation=calls.cone(finalName);corroborate(first.evidence.nativeVolume,final,plan.secondRemoval);
  const facts=qualifyCountersinkFinal({firstFacts,final,toolObservation,resultObservation,frustumConstruction:coneCreated,plan});points(finalName,true);
  const nextIndex=deriveSequentialInheritedSelectionIndexV2({sourceIndex:index,sourceTopology:first.sourceTopologies[0],firstAncestry:first.created.ancestryA.data,firstTopology:first.topology,finalAncestry:final.created.ancestryA.data,finalSourceTopology:final.sourceTopologies[0],finalTopology:final.topology,featureId:request.featureId});
  release(firstName);release(coneName);preserved();const finalWork=work();
  if(counts.length!==4||finalWork.nextName!==originalWork.nextName+4||finalWork.chargedResults!==originalWork.chargedResults+4||finalWork.triangleTotal!==originalWork.triangleTotal+counts.reduce((n,v)=>n+v,0)||calls.census()!==baseline+1)throw cleanup('Countersink final actual work/name reconciliation differs.');
  output={name:finalName,index:nextIndex,evidence:final.evidence,request,facts,work:Object.freeze({version:1,nativeResults:4,resultTriangles:Object.freeze([...counts])})};complete=true;
 }catch(cause){operationFailed=true;operationError=cause;complete=false;}
 finally{
  try{preserved();}catch(cause){complete=false;preservationFailure=cause;}
  // No release after losing lexical exclusivity, nor retry for unknown/releasing
  // names: terminate this realm rather than repairing an unidentified result.
  for(const record of attempts.values())if(record.state==='owned'&&(!complete||record.name!==finalName)){
   if(ownerLost){record.state='unknown';cleanup('Exclusive owner lost before exact-name cleanup.');}
   else try{release(record.name);}catch{/* first bounded cleanup error retained */}
  }
  if(!ownerLost){try{if(calls.census()!==baseline+(complete?1:0))cleanup('Countersink final owned-name baseline differs.');}catch(cause){cleanup('Countersink final owned-name census is unavailable',cause);}}
  else cleanup('Countersink private realm must terminate; currentness/exclusivity was lost.');
  if(cleanupFailures.length&&attempts.get(finalName)?.state==='owned'){
   if(!ownerLost)try{release(finalName);}catch{/* never retry unknown */}
   else attempts.get(finalName).state='unknown';
  }
  for(const r of attempts.values())if(!['absent','released'].includes(r.state)&&!(complete&&r.name===finalName&&r.state==='owned'))cleanup('Countersink has an unresolved attempted allocation',{name:r.name,state:r.state});
  if(!ownerLost)try{if(calls.census()!==baseline+(complete?1:0))cleanup('Countersink post-cleanup baseline differs.');}catch(cause){cleanup('Countersink post-cleanup census is unavailable',cause);}
 }
 if(cleanupFailures.length)throw Object.assign(error('ENGINE_CLEANUP_FAILED','Countersink Native cleanup or exclusive ownership is unconfirmed.',cleanupFailures[0]),{operationFailed,operationError,preservationFailure,cleanupFailures:Object.freeze([...cleanupFailures]),terminateWorker:true});
 if(preservationFailure)throw Object.assign(preservationFailure,{operationFailed,operationError,terminateWorker:true});
 if(operationFailed)throw operationError;
 if(!complete||!output)fail('ENGINE_FAILURE','No complete privately owned countersink result is available.');return output;
}
