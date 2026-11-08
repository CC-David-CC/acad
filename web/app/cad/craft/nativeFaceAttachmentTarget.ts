import {captureNativeFaceParent,sourceFrameRecord as fields,sourceFrameFail as fail} from 'engine/source/sourceFrameIntent.mjs';
import {inspectWorkerSolidSelections} from 'engine/solid/solidLedger.mjs';
import {genericHistoryBuild} from 'engine/mount/selectedProfileBuildSelection.mjs';
import {captureSelectedProfileDepthParameters} from './authoredEditJournal.mjs';
import {canonicalAuthoredFeatureId as fid} from './authoredFeatureIdentity.mjs';
import {MWorkerSolid} from '../model/mworkerSolid';
// Metadata admission only. Actual native planar support is re-read in candidate.
export function captureCurrentNativeAttachmentTarget(ctx:any,value:any){
 const a=fields(value,['kind','bodyId','featureId','selectionId'],'INVALID_REQUEST'),history=ctx.craftService.modifications$.value.history,build:any=genericHistoryBuild(history),featureId=fid(a.featureId);
 if(a.kind!=='native-planar-face'||typeof a.bodyId!=='string'||typeof a.selectionId!=='string'||!a.selectionId||a.selectionId.length>16384)fail('INVALID_REQUEST','Select an inspected native face.');
 if(!build||build.id!=='occ'||build.planarAttachmentVersion!==1)fail('UNSUPPORTED_FRAME_PARENT','The exact staged part build does not advertise native planar attachments.');
 const target=ctx.cadRegistry.find(a.bodyId),selection=inspectWorkerSolidSelections(target),entry=history.find((row:any)=>fid(row.params.featureId)===featureId);
 if(!(target instanceof MWorkerSolid)||target.id!==a.bodyId||target.featureId!==featureId||!entry||entry.params.engine!=='occ'||entry.params.engineRevision!==build.revision||selection.status!=='available'||selection.plan.version!==2||selection.plan.featureId!==featureId)fail('UNRESOLVED_SOURCE','The actual native parent is unavailable.');
 const keys=['mxx','mxy','mxz','tx','myx','myy','myz','ty','mzx','mzy','mzz','tz'],identity=[1,0,0,0,0,1,0,0,0,0,1,0],location=target.location$,matrix=location.value,csys=target.csys,axes=['origin','x','y','z'];
 const unplaced=()=>target.location$===location&&location.value===matrix&&target.csys===csys&&keys.every((key,i)=>Object.is(matrix[key],identity[i]))&&axes.every((key,i)=>['x','y','z'].every((axis,j)=>Object.is(csys[key][axis],i===0?0:i-1===j?1:0)));
 if(!unplaced())fail('UNSUPPORTED_FRAME_PARENT','Native attachment does not infer placement from displayed model transforms.');
 const metrics=target.inspectKernelMetrics();if(metrics.resultKind!=='single-solid'||metrics.solidCount!==1||metrics.nativeValidity?.valid!==true||!(metrics.nativeVolume>0)||'sha256:'+metrics.runtime.jsSha256+':'+metrics.runtime.wasmSha256!==build.revision)fail('UNSUPPORTED_FRAME_PARENT','Select an actual valid single solid from the exact part build.');
 const rows=selection.plan.faces.filter(row=>row.id===a.selectionId),descriptor=rows[0];if(rows.length!==1||descriptor.role!=='last-cap'||descriptor.geometry!=='plane')fail('UNSUPPORTED_FRAME_PARENT','Select a uniquely inherited last-cap plane.');
 const origin=fid(descriptor.originFeatureId),constructor=history.find((row:any)=>fid(row.params.featureId)===origin);if(constructor?.type!=='WORKER_SELECTED_PROFILE_EXTRUDE_V2')fail('UNSUPPORTED_FRAME_PARENT','The face must retain a genuine selected-extrusion constructor.');
 const p:any=captureSelectedProfileDepthParameters(constructor.params);if(p.engine!=='occ'||p.engineRevision!==build.revision||!selection.plan.sourceContexts.some(row=>row.kind==='sketch-profile'&&row.featureId===origin&&row.regionId===p.regionId))fail('UNRESOLVED_SOURCE','The current face lost its exact constructor datum.');
 const parent=captureNativeFaceParent({kind:a.kind,bodyId:a.bodyId,featureId,selectionId:a.selectionId,engine:'occ',engineRevision:build.revision,originFeatureId:origin,sourceFeatureId:origin,sourceFaceId:p.faceId,sourceRegionId:p.regionId,framePolicy:'extrusion-cap-source-datum-v1'});
 return Object.freeze({parent,target,metrics,unplaced});
}
export function discoveredNativeAttachmentParents(ctx:any,bodyId:string,featureId:number){const target=ctx.cadRegistry.find(bodyId),selection=inspectWorkerSolidSelections(target);if(selection.status!=='available'||selection.plan.version!==2||selection.plan.featureId!==featureId)fail('UNRESOLVED_SOURCE','The current parent has no genuine selection plan.');const faces=selection.plan.faces.filter(row=>row.role==='last-cap');if(faces.length>16)fail('RESOURCE_LIMIT','Native attachment discovery exceeds16 candidate caps.');return Object.freeze(faces.map(row=>captureCurrentNativeAttachmentTarget(ctx,{kind:'native-planar-face',bodyId,featureId,selectionId:row.id})));}
