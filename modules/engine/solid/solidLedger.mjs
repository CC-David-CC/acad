import {requireCadEngineBuild,validateEngineMount} from '../mount/engineCatalog.mjs';
import {requireManufacturingMeshBuild} from '../mount/selectedProfileBuildSelection.mjs';
import {captureManufacturingControls,captureManufacturingMetadata} from '../mount/ownedManufacturingMeshProtocol.mjs';
import {captureLinkedPartDrawingDefinition} from '../../drawing/linkedPartDrawingDefinition.mjs';
import {captureDrawingReadResult,unresolvedDrawingRead} from '../mount/ownedDrawingReadProtocol.mjs';
import {qualifySourceCurveId} from '../extrusion/selectedRegionDescriptor.mjs';
import {captureOwnedLoftEvaluation,captureLoftSectionReferences} from './ownedLoftFeature.mjs';
import {captureOwnedSweepEvaluation,captureSweepPathReferences} from './ownedSweepFeature.mjs';
import {captureOwnedRevolveEvaluation} from './ownedRevolveFeature.mjs';
import {captureOwnedHoleIntent} from './ownedHoleIntent.mjs';
import {captureOwnedShellFeature} from './ownedShellFeature.mjs';
import {captureOwnedLinearHolePatternIntent,linearHolePatternNativeCost} from './ownedLinearHolePatternIntent.mjs';
import {requireSingleGeometricSolid} from './solidResultPolicy.mjs';
import {captureSolidMetrics} from './solidMetrics.mjs';
import {captureSolidBox,captureSolidBoolean,captureSolidProfile,captureSolidEdgeTreatment,solidBodyId} from './solidIntent.mjs';
const ledgers=new WeakMap();
const selectionSnapshots=new WeakMap();
const holeSeedSnapshots=new WeakMap();
const STEP_BLOB_SIZE=typeof Blob==='function'?Object.getOwnPropertyDescriptor(Blob.prototype,'size').get:null;
const STEP_BLOB_TYPE=typeof Blob==='function'?Object.getOwnPropertyDescriptor(Blob.prototype,'type').get:null;
// Only immutable authored keys/roles are published. Native edge indices and
// handles never leave the private Worker/candidate ledger.
const freezeSelection=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freezeSelection(child);Object.freeze(value);}return value;};
export function inspectWorkerSolidSelections(model){return selectionSnapshots.get(model)||Object.freeze({status:'unavailable',reason:'NO_AUTHORED_PRISM_SELECTIONS'});}
export function inspectWorkerSolidPatternSeeds(model){return holeSeedSnapshots.get(model)||Object.freeze({status:'unavailable',reason:'NO_QUALIFIED_HOLE_PATH'});}
const fail=(message,code='INVALID_REQUEST')=>{throw Object.assign(new Error(message),{code});};
const cancelled=()=>new DOMException('Solid evaluation was cancelled or superseded.','AbortError');
function state(owner){let s=ledgers.get(owner);if(!s){s={engine:null,engineRevision:null,mount:null,outputs:new Map(),sources:new Map()};ledgers.set(owner,s);}return s;}
// All handles remain in the candidate-owner ledger and never enter history,
// model metadata or a command response. Factories must return a closable mount.
export async function evaluateWorkerSolid({owner,kind,request,registry,createMount,validateMount,createModel,createEmptyModel,valid,sourceBinding}) {
 if(!owner||typeof owner.requireCurrent!=='function'||typeof owner.getOrCreateMount!=='function'||typeof createMount!=='function'||typeof validateMount!=='function'||typeof createModel!=='function'||typeof valid!=='function'||!registry||typeof registry.find!=='function')fail('Invalid solid evaluation.');
 const intent=kind==='box'?captureSolidBox(request):kind==='boolean'?captureSolidBoolean(request):kind==='profile'?captureSolidProfile(request):kind==='revolve'?captureOwnedRevolveEvaluation(request):kind==='sweep'?captureOwnedSweepEvaluation(request):kind==='loft'?captureOwnedLoftEvaluation(request):kind==='edge-treatment'?captureSolidEdgeTreatment(request):kind==='shell'?captureOwnedShellFeature(request):kind==='through-hole'?captureOwnedHoleIntent(request):kind==='linear-hole-pattern'?captureOwnedLinearHolePatternIntent(request):fail('Unsupported solid operation.');
 if(kind==='linear-hole-pattern')linearHolePatternNativeCost(intent.count);
 const alive=()=>{try{return owner.state==='candidate'&&!owner.signal.aborted&&valid()===true}catch{return false}};
 const current=()=>{owner.requireCurrent();if(!alive())throw cancelled();owner.requireCurrent();};current();
 const s=state(owner);if(s.engine&&s.engine!==intent.engine)fail('Mixed engine candidates are not supported.','ENGINE_MISMATCH');
 if(s.engineRevision&&s.engineRevision!==intent.engineRevision)fail('Mixed engine runtime revisions are not supported.','ENGINE_REVISION_MISMATCH');
 const id=solidBodyId(intent.featureId);if(s.outputs.has(id)||registry.find(id))fail('Solid feature identity is already used.');
 // The exact registered build selects the internal authored-box protocol.
 // Existing builds keep their original request shape, never a guessed fallback.
 const constructionBuild=kind==='box'||kind==='shell'?requireCadEngineBuild(intent.engine,intent.engineRevision):null;
 if(kind==='shell'&&(constructionBuild.shellVersion!==1||constructionBuild.selectionPlanVersion!==2))fail('The recorded part runtime does not support authored shells.','UNSUPPORTED_SHELL_BUILD');
 let parents=[],source=null,binding=null,loftSources=null,shellParentCheck=null;
 if(['revolve','sweep','loft'].includes(kind)&&sourceBinding===undefined)fail('The authored source binding is required.','STALE_SOURCE');
 // Both authored sections remain independent model sources. Native traversal
 // ordinals are validated by semantic preparation, never used as saved identity.
 if(kind==='loft'){
  if(!sourceBinding||typeof sourceBinding!=='object'||Array.isArray(sourceBinding)||Reflect.ownKeys(sourceBinding).length!==2||!['featureId','sections'].every(key=>{const d=Object.getOwnPropertyDescriptor(sourceBinding,key);return d?.enumerable&&Object.hasOwn(d,'value');}))fail('Invalid loft source binding.');
  if(sourceBinding.featureId!==intent.featureId||typeof registry.findFace!=='function')fail('The selected loft sources are unavailable.','STALE_SOURCE');
  const sections=captureLoftSectionReferences(sourceBinding.sections),corr=intent.loft.correspondence;
  loftSources=Object.freeze(sections.map((section,index)=>{
   const actual=intent.loft.sections[index],face=registry.findFace(section.faceId),seam=section.seam;
   if(!face||actual.source.faceId!==section.faceId||actual.region.id!==section.regionId)fail('The selected loft source or region changed.','STALE_SOURCE');
   if((seam.kind==='vertex'?corr.kind!=='polygon':corr.kind!=='circle')||corr[index===0?'reverseA':'reverseB']!==seam.reversed||seam.kind==='circle-angle'&&(corr[index===0?'startA':'startB']!==seam.angleRadians||actual.region.outer.length!==1||actual.region.outer[0].id!==qualifySourceCurveId(actual.source.faceId,seam.curveId)))fail('The selected loft correspondence changed.','STALE_SOURCE');
   return Object.freeze({faceId:section.faceId,face});
  }));
 }
 if(sourceBinding!==undefined&&kind!=='loft'){
  const bindingKeys=kind==='sweep'?['featureId','faceId','regionId','pathFaceId','pathCurves']:kind==='revolve'?['featureId','faceId','regionId','axisSegmentId']:['featureId','faceId','regionId'];
  if(!['profile','revolve','sweep'].includes(kind)||!sourceBinding||typeof sourceBinding!=='object'||Array.isArray(sourceBinding)||Reflect.ownKeys(sourceBinding).length!==bindingKeys.length)fail('Invalid profile source binding.');
  binding={};for(const key of bindingKeys){const d=Object.getOwnPropertyDescriptor(sourceBinding,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('Profile source binding must be own data.');binding[key]=d.value;}
  const region=kind==='sweep'?intent.sweep.region.id:kind==='revolve'?intent.revolve.region.id:intent.profile.region.id;
  if(binding.featureId!==intent.featureId||binding.regionId!==region||typeof binding.faceId!=='string'||!binding.faceId||binding.faceId.length>256||typeof registry.findFace!=='function'||!registry.findFace(binding.faceId)||kind==='revolve'&&(binding.faceId!==intent.revolve.source.faceId||binding.axisSegmentId!==intent.revolve.axis.id))fail('The selected profile source is unavailable.','STALE_SOURCE');
  if(kind==='sweep'){
   binding.pathCurves=captureSweepPathReferences(binding.pathCurves);
   if(binding.faceId!==intent.sweep.source.faceId||binding.pathFaceId!==intent.sweep.path.source.faceId||!registry.findFace(binding.pathFaceId)||JSON.stringify(binding.pathCurves)!==JSON.stringify(intent.sweep.path.curves.map(curve=>({curveId:curve.id,reversed:curve.reversed}))))fail('The selected sweep source path changed.','STALE_SOURCE');
   binding.pathFace=registry.findFace(binding.pathFaceId);
  }
  binding=Object.freeze({...binding,face:registry.findFace(binding.faceId)});
 }
 if(kind==='through-hole'){
  const item=s.outputs.get(intent.target);source=s.sources.get(intent.sourceFeatureId);
  if(!item||item.engine!==intent.engine||registry.find(intent.target)!==item.model||item.featureId!==intent.producerFeatureId||item.model.featureId!==intent.producerFeatureId)fail('Through-hole target is missing, stale or belongs to another producer.','INVALID_OPERAND');
  if(!source||source.engine!==intent.engine||source.engineRevision!==intent.engineRevision||source.faceId!==intent.sourceFaceId||source.regionId!==intent.sourceRegionId||typeof registry.findFace!=='function'||registry.findFace(source.faceId)!==source.face)fail('The owned selected-profile source is unavailable.','STALE_SOURCE');
  const selections=selectionSnapshots.get(item.model);
  if(selections?.status!=='available'||selections.plan.version!==2||selections.plan.featureId!==intent.producerFeatureId||!selections.plan.sourceContexts.some(c=>c.kind==='sketch-profile'&&c.featureId===intent.sourceFeatureId&&c.regionId===intent.sourceRegionId))fail('The target no longer carries its selected-profile origin.','UNRESOLVED_SELECTION');
  parents=[item];
 }
 if(kind==='linear-hole-pattern'){
  const item=s.outputs.get(intent.target),path=item?.holeState;
  if(!item||item.engine!==intent.engine||registry.find(intent.target)!==item.model||item.featureId!==intent.producerFeatureId||item.model.featureId!==intent.producerFeatureId)fail('Pattern target is missing, stale or belongs to another producer.','INVALID_OPERAND');
  if(!path||path.records.filter(r=>r.intent.featureId===intent.seedFeatureId&&r.intent.kind==='centered-through').length!==1)fail('The target has no authenticated centered-hole seed.','UNSUPPORTED_SEED');
  source=path.source;
  if(s.sources.get(source.featureId)!==source||source.engine!==intent.engine||source.engineRevision!==intent.engineRevision||typeof registry.findFace!=='function'||registry.findFace(source.faceId)!==source.face)fail('The actual pattern source constructor is unavailable.','STALE_SOURCE');
  parents=[item];
 }

 if(kind==='boolean'){
  parents=[intent.a,intent.b].map(key=>{const item=s.outputs.get(key);if(!item||item.engine!==intent.engine||registry.find(key)!==item.model||item.model.featureId!==item.featureId||key!==solidBodyId(item.featureId))fail('Boolean operand is missing, stale or from another engine.','INVALID_OPERAND');return item;});
 }
 if(kind==='edge-treatment'){
  const item=s.outputs.get(intent.target),selections=item&&selectionSnapshots.get(item.model);
  if(!item||item.engine!==intent.engine||registry.find(intent.target)!==item.model||item.model.featureId!==intent.producerFeatureId)fail('Edge treatment target is missing, stale or belongs to another producer.','INVALID_OPERAND');
  if(selections?.status!=='available'||selections.plan.featureId!==intent.producerFeatureId||intent.edgeIds.some(id=>!selections.plan.edges.some(e=>e.id===id)))fail('The target has no unique current authored edge selections.','UNRESOLVED_SELECTION');
  parents=[item];
 }
 if(kind==='shell'){
  const item=s.outputs.get(intent.target),model=item?.model,selected=model&&selectionSnapshots.get(model),inspect=model?.inspectKernelMetrics,
   metrics=typeof inspect==='function'?inspect.call(model):null,ext=model?.ext,tag=ext?.workerGeometry;
  if(!item||item.engine!==intent.engine||item.featureId!==intent.producerFeatureId||registry.find(intent.target)!==model||model.featureId!==intent.producerFeatureId||model.id!==solidBodyId(intent.producerFeatureId))fail('Shell target is missing, stale or belongs to another producer.','INVALID_OPERAND');
  if(!metrics||!Object.isFrozen(metrics)||metrics.resultKind!=='single-solid'||metrics.solidCount!==1||metrics.nativeValidity?.valid!==true||!(metrics.nativeVolume>0)||!metrics.nativeBounds||!['min','max'].every(k=>Array.isArray(metrics.nativeBounds[k])&&metrics.nativeBounds[k].length===3&&metrics.nativeBounds[k].every(Number.isFinite))||metrics.nativeBounds.min.some((n,i)=>n>=metrics.nativeBounds.max[i])||tag?.engine!==intent.engine||tag.runtime!==metrics.runtime||'sha256:'+metrics.runtime?.jsSha256+':'+metrics.runtime?.wasmSha256!==intent.engineRevision)fail('Shell target lacks a measured valid positive solid on the recorded runtime.','INVALID_OPERAND');
  const location=model.location$,matrix=location?.value,csys=model.csys,matrixKeys=['mxx','mxy','mxz','tx','myx','myy','myz','ty','mzx','mzy','mzz','tz'],identity=[1,0,0,0,0,1,0,0,0,0,1,0],axisNames=['origin','x','y','z'];
  const unplaced=()=>!!matrix&&!!csys&&matrixKeys.every((k,i)=>Object.is(matrix[k],identity[i]))&&axisNames.every((k,i)=>csys[k]&&[csys[k].x,csys[k].y,csys[k].z].every((n,j)=>Object.is(n,i===0?0:i-1===j?1:0)));
  if(!unplaced())fail('Shell requires the current unplaced native parent.','UNSUPPORTED_PLACEMENT');
  const plan=selected?.plan;
  if(selected?.status!=='available'||!Object.isFrozen(selected)||!Object.isFrozen(plan)||plan.version!==2||plan.scope!=='authored-source'||plan.featureId!==intent.producerFeatureId||!Array.isArray(plan.faces)||!Array.isArray(plan.sourceContexts)||!plan.sourceContexts.length||plan.sourceContexts.some(c=>c.featureId===intent.featureId))fail('The shell parent has no current authored face selections.','UNRESOLVED_SELECTION');
  for(const id of intent.removedFaceIds){const faces=plan.faces.filter(face=>face.id===id);if(faces.length!==1||!plan.sourceContexts.some(c=>c.featureId===faces[0].originFeatureId))fail('Select only unique advertised faces on the current parent.','UNRESOLVED_SELECTION');}
  // Membership is required until THIS operation consumes the parent. Its
  // immutable measurements/selection snapshot and private handle stay bound
  // during subsequent suffix publication, after the registry removes it.
  shellParentCheck=(membership=false)=>{
   if(item.model!==model||model.id!==intent.target||model.featureId!==intent.producerFeatureId||model.ext!==ext||ext.workerGeometry!==tag||model.inspectKernelMetrics!==inspect||inspect.call(model)!==metrics||selectionSnapshots.get(model)!==selected||model.location$!==location||location.value!==matrix||model.csys!==csys||!unplaced())fail('The captured shell parent changed.','INVALID_OPERAND');
   if(membership&&(s.outputs.get(intent.target)!==item||registry.find(intent.target)!==model))fail('The shell parent is no longer current.','INVALID_OPERAND');
  };
  shellParentCheck(true);parents=[item];
 }
 let mount=s.mount;
 try {
  if(!mount){mount=owner.getOrCreateMount('worker-solid:'+intent.engine,()=>createMount(intent.engine,intent.engineRevision));s.engine=intent.engine;s.engineRevision=intent.engineRevision;s.mount=mount;}
  validateMount(intent.engine,mount,intent.engineRevision);
  if(kind==='loft'&&!mount?.descriptor?.operations?.some(op=>op.id==='solid.profile.loft'&&op.version===1))fail('The selected part runtime does not support loft.','ENGINE_CAPABILITY_UNAVAILABLE');
  if(kind==='sweep'&&!mount?.descriptor?.operations?.some(op=>op.id==='solid.profile.sweep'&&op.version===1))fail('The selected part runtime does not support sweep.','ENGINE_CAPABILITY_UNAVAILABLE');
  if(kind==='revolve'&&!mount?.descriptor?.operations?.some(op=>op.id==='solid.profile.revolve'&&op.version===1))fail('The selected part runtime does not support revolve.','ENGINE_CAPABILITY_UNAVAILABLE');
  if(kind==='edge-treatment'&&!mount?.descriptor?.operations?.some(op=>op.id==='solid.edge.treat'&&op.version===1))fail('The selected part runtime does not support edge treatments.','ENGINE_CAPABILITY_UNAVAILABLE');
  if(kind==='through-hole'&&!mount?.descriptor?.operations?.some(op=>op.id==='solid.holes.through'&&op.version===1))fail('The selected part runtime does not support through holes.','ENGINE_CAPABILITY_UNAVAILABLE');
  if(kind==='linear-hole-pattern'&&!mount?.descriptor?.operations?.some(op=>op.id==='solid.holes.pattern.linear'&&op.version===1))fail('The selected part runtime does not support linear hole patterns.','ENGINE_CAPABILITY_UNAVAILABLE');
  if(kind==='shell'&&(!mount?.descriptor?.operations?.some(op=>op.id==='solid.shell'&&op.version===1)||!mount?.descriptor?.operations?.some(op=>op.id==='solid.selections.read'&&op.version===1&&op.selectionPlanVersion===2)))fail('The selected part runtime does not bind shell and authored selections.','ENGINE_CAPABILITY_UNAVAILABLE');
  if(kind==='box'&&constructionBuild.boxConstructionVersion===1&&!mount?.descriptor?.operations?.some(op=>op.id==='solid.box.create'&&op.version===1&&op.input==='oci-authored-box-mm-v1'))fail('The selected part runtime does not bind authored box construction.','ENGINE_CAPABILITY_UNAVAILABLE');
  if(!mount||!mount.ready||typeof mount.execute!=='function'||typeof mount.readSolidMesh!=='function'||typeof mount.assertSolidBinding!=='function')fail('The requested engine is not available.','ENGINE_CAPABILITY_UNAVAILABLE');
  const d=mount.descriptor,assets=d?.runtimeAssets;if(typeof d?.engine!=='string'||typeof d?.representation!=='string'||!['jsSha256','wasmSha256'].every(k=>typeof assets?.[k]==='string'&&/^[a-f0-9]{64}$/.test(assets[k]))||(assets?.workerSha256!==undefined&&(typeof assets.workerSha256!=='string'||!/^[a-f0-9]{64}$/.test(assets.workerSha256))))fail('Runtime provenance is unavailable.','ENGINE_BINDING_MISMATCH');if(intent.engineRevision!==`sha256:${assets.jsSha256}:${assets.wasmSha256}`)fail('The saved solid requires a different engine build.','ENGINE_REVISION_MISMATCH');const provenance=Object.freeze({mountEngine:d.engine,representation:d.representation,jsSha256:assets.jsSha256,wasmSha256:assets.wasmSha256,...(assets.workerSha256?{workerSha256:assets.workerSha256}:{})});
  await mount.ready;current();shellParentCheck?.(true);
  const modernSelections=mount.descriptor.operations?.some(op=>op.id==='solid.selections.read'&&op.version===1&&op.selectionPlanVersion===2);
  const message=kind==='linear-hole-pattern'?{...intent,op:'solid.holes.pattern.linear',handle:parents[0].handle,sourceHandle:source.handle}:kind==='through-hole'?{...intent,op:'solid.holes.through',handle:parents[0].handle,sourceHandle:source.handle}:kind==='profile'?intent.profile:kind==='revolve'?intent.revolve:kind==='sweep'?intent.sweep:kind==='loft'?intent.loft:kind==='box'?{op:'solid.box.create',version:1,unit:'millimeter',origin:intent.origin.slice(),dimensions:intent.dimensions.slice(),...(constructionBuild.boxConstructionVersion===1?{featureId:intent.featureId}:{})}:kind==='shell'?{op:'solid.shell',version:1,unit:'millimeter',handle:parents[0].handle,featureId:intent.featureId,producerFeatureId:intent.producerFeatureId,removedFaceIds:intent.removedFaceIds.slice(),thickness:intent.thickness,direction:intent.direction}:kind==='edge-treatment'?{op:'solid.edge.treat',version:1,unit:'millimeter',handle:parents[0].handle,producerFeatureId:intent.producerFeatureId,featureId:intent.featureId,kind:intent.kind,edgeIds:intent.edgeIds.slice(),size:intent.size}:{op:'solid.boolean.'+(intent.kind==='join'?'union':intent.kind),version:1,unit:'millimeter',a:parents[0].handle,b:parents[1].handle,...(modernSelections?{featureId:intent.featureId,producerAFeatureId:parents[0].featureId,producerBFeatureId:parents[1].featureId}:{})};
  const result=await mount.execute(message,{signal:owner.signal});current();
  shellParentCheck?.(true);
  if(!result?.handle||result.op!==message.op||result.contractVersion!==1)fail('Invalid engine result.','ENGINE_FAILURE');
  mount.assertSolidBinding(result.handle);
  let selections=null;
  if(modernSelections||kind==='profile'&&intent.profile.version===3||kind==='edge-treatment'){
   const selectionOp=modernSelections?'solid.selections.read':'solid.prism.selections.read';
   const observed=await mount.execute({op:selectionOp,version:1,handle:result.handle,featureId:intent.featureId},{signal:owner.signal});current();
   if(observed?.contractVersion!==1||observed.op!==selectionOp||observed.unit!=='millimeter'||!['available','unavailable'].includes(observed.selection?.status)||observed.selection.status==='available'&&(observed.selection.plan?.featureId!==intent.featureId||observed.selection.plan.scope!=='authored-source'))fail('Invalid authored selection snapshot.','ENGINE_FAILURE');
   if(observed.selection.status==='available'){
    const plan=observed.selection.plan;
    if(modernSelections){
     let expected=null;
     if(kind==='profile')expected=[{kind:'sketch-profile',featureId:intent.featureId,regionId:intent.profile.region.id}];
     else if(kind==='box'&&constructionBuild.boxConstructionVersion===1)expected=[{kind:'box',featureId:intent.featureId,regionId:null}];
     else if(kind==='boolean'||kind==='edge-treatment'||kind==='shell'||kind==='through-hole'||kind==='linear-hole-pattern'){
      const plans=parents.map(p=>selectionSnapshots.get(p.model));
      if(plans.every(p=>p?.status==='available'&&p.plan.version===2)){
       const origins=new Map();for(const p of plans)for(const c of p.plan.sourceContexts){const previous=origins.get(c.featureId);if(previous&&(previous.kind!==c.kind||previous.regionId!==c.regionId))fail('Conflicting authored source contexts.','ENGINE_FAILURE');origins.set(c.featureId,c);}
       expected=[...origins.values()].sort((a,b)=>a.featureId-b.featureId);
      }
     }
     const contexts=plan.sourceContexts;
     if(plan.version!==2||!expected||!Array.isArray(contexts)||contexts.length<1||contexts.length>32||contexts.length!==expected.length||Reflect.ownKeys(contexts).length!==contexts.length+1||Object.hasOwn(plan,'regionId'))fail('Invalid multi-source selection context.','ENGINE_FAILURE');
     for(let i=0;i<contexts.length;i++){
      const d=Object.getOwnPropertyDescriptor(contexts,String(i)),c=d?.value,e=expected[i];
      if(!d?.enumerable||!Object.hasOwn(d,'value')||!c||Object.keys(c).sort().join(',')!=='featureId,kind,regionId'||c.kind!==e.kind||c.featureId!==e.featureId||c.regionId!==e.regionId)fail('Selection origins differ from the authored inputs.','ENGINE_FAILURE');
     }
    }else{
     const regionId=kind==='profile'?intent.profile.region.id:selectionSnapshots.get(parents[0].model).plan.regionId;
     if(plan.regionId!==regionId)fail('Invalid authored prism selection snapshot.','ENGINE_FAILURE');
    }
   }
   selections=freezeSelection(observed.selection);
  }
  const mesh=await mount.readSolidMesh({op:'solid.mesh.read',version:1,handle:result.handle},{signal:owner.signal});current();
  if(mesh?.contractVersion!==1||mesh.op!=='solid.mesh.read'||mesh.unit!=='millimeter'||mesh.quality!=='display-only'||!(mesh.buffer instanceof ArrayBuffer)||!Number.isSafeInteger(mesh.triangleCount)||mesh.triangleCount<0||mesh.buffer.byteLength%72||mesh.buffer.byteLength/72!==mesh.triangleCount)fail('Invalid native-result mesh.','ENGINE_FAILURE');
  const modern=Object.hasOwn(mesh,'displayBuffer');
  if(modern&&(!(mesh.displayBuffer instanceof ArrayBuffer)||!['available','unavailable'].includes(mesh.displayStatus)||(mesh.displayStatus==='available'?(mesh.displayReason!==null||mesh.displayBuffer.byteLength/36!==mesh.triangleCount):(mesh.displayBuffer.byteLength!==0||!['float32-overflow','float32-collapsed-triangle','material-orientation-unqualified'].includes(mesh.displayReason)))))fail('Invalid verified Worker display projection.','ENGINE_FAILURE');
  const metrics=captureSolidMetrics(intent.engine,mesh.evidence,mesh.triangleCount,provenance),empty=metrics.resultKind==='empty';
  if(kind==='boolean'&&intent.kind==='join')requireSingleGeometricSolid({engine:intent.engine,engineRevision:intent.engineRevision,metrics});
  if(['profile','revolve','sweep','loft','edge-treatment','shell','through-hole','linear-hole-pattern'].includes(kind)&&(metrics.resultKind!=='single-solid'||metrics.solidCount!==1||metrics.nativeValidity?.valid!==true||metrics.nativeVolume===null||metrics.nativeBounds===null))fail('The authored feature requires one measured valid native solid.','ENGINE_FAILURE');
  if(intent.engine==='smlib'&&metrics.materialRegions>1&&metrics.voidRegions>0&&(!modern||mesh.displayStatus!=='unavailable'||mesh.displayReason!=='material-orientation-unqualified'))fail('Material-side preview orientation is unqualified.','ENGINE_FAILURE');
  if(mesh.displayReason==='material-orientation-unqualified'&&(intent.engine!=='smlib'||metrics.resultKind!=='multi-material'||metrics.materialRegions<2||metrics.voidRegions<1))fail('Orientation qualification does not match the native result.','ENGINE_FAILURE');
  if(kind==='box'&&empty)fail('A positive box cannot produce an empty native result.','ENGINE_FAILURE');
  if(['revolve','sweep','loft','shell'].includes(kind)&&!(metrics.nativeVolume>0))fail('An authored solid requires positive measured native volume.','ENGINE_FAILURE');
  let model,checkProjection;
  if(empty){
   if(typeof createEmptyModel!=='function'||modern&&mesh.displayStatus!=='available')fail('Empty metadata output is unavailable.','ENGINE_CAPABILITY_UNAVAILABLE');
   model=createEmptyModel(intent.featureId,intent.engine,provenance,metrics);
   if(!model||model.parent!==null||model.topology!==null||model.faces!==undefined||model.edges!==undefined||model.vertices!==undefined)fail('Empty result must be metadata, not a shell.','ENGINE_FAILURE');
   const type=model.TYPE,traverse=model.traverse;
   checkProjection=()=>{if(model.parent!==null||model.topology!==null||model.TYPE!==type||model.traverse!==traverse||model.faces!==undefined||model.edges!==undefined||model.vertices!==undefined)fail('Empty output changed.','ENGINE_FAILURE');};
  }else{
   if(!modern&&mesh.triangleCount>512)fail('Legacy Float64 display exceeds the temporary main-thread projection gate; verified Worker Float32 data is required.','UNSUPPORTED_CASE');
   const projection=modern?Object.freeze({displayBuffer:mesh.displayBuffer,displayStatus:mesh.displayStatus,displayReason:mesh.displayReason}):new Float64Array(mesh.buffer);
   model=createModel(intent.featureId,intent.engine,projection,provenance,metrics);
   const display=model?.hasDisplayProjection,inspectDisplay=model?.inspectDisplayProjection,view=typeof inspectDisplay==='function'?inspectDisplay.call(model):null;
   if(typeof display!=='function'||!view||!Object.isFrozen(view)||!['available','unavailable'].includes(view.status)||view.sourceTriangleCount!==mesh.triangleCount||view.renderTriangleCount!==(view.status==='available'?mesh.triangleCount:0)||display.call(model)!==(view.status==='available')||(modern&&(view.status!==mesh.displayStatus||view.reason!==mesh.displayReason)))fail('Invalid solid display ownership.','ENGINE_FAILURE');
   const csys=model.csys,location=model.location$,matrix=location?.value,faces=model.faces,edges=model.edges,vertices=model.vertices;
   const vectorNames=['origin','x','y','z'],matrixNames=['mxx','mxy','mxz','tx','myx','myy','myz','ty','mzx','mzy','mzz','tz'];
   const vectors=vectorNames.map(key=>[csys?.[key]?.x,csys?.[key]?.y,csys?.[key]?.z]),matrixValues=matrixNames.map(key=>matrix?.[key]);
   if(vectors.flat().concat(matrixValues).some(value=>!Number.isFinite(value))||![faces,edges,vertices].every(value=>Array.isArray(value)&&value.length===0))fail('Invalid solid placement or topology.','ENGINE_FAILURE');
   checkProjection=()=>{if(model.hasDisplayProjection!==display||model.inspectDisplayProjection!==inspectDisplay||inspectDisplay.call(model)!==view||display.call(model)!==(view.status==='available')||model.csys!==csys||model.location$!==location||location.value!==matrix||model.faces!==faces||model.edges!==edges||model.vertices!==vertices||faces.length||edges.length||vertices.length)fail('Solid projection changed.','ENGINE_FAILURE');if(vectorNames.some((key,i)=>[csys[key]?.x,csys[key]?.y,csys[key]?.z].some((v,j)=>!Object.is(v,vectors[i][j])))||matrixNames.some((key,i)=>!Object.is(matrix[key],matrixValues[i])))fail('Solid placement changed.','ENGINE_FAILURE');};
  }
  if(!model||model.id!==id)fail('Invalid feature output identity.','ENGINE_FAILURE');
  if(selections)selectionSnapshots.set(model,selections);
  const tag=model.ext?.workerGeometry,ext=model.ext,inspect=model.inspectKernelMetrics;
  if(!tag||tag.engine!==intent.engine||tag.resultKind!==metrics.resultKind||tag.runtime!==provenance||typeof inspect!=='function'||inspect.call(model)!==metrics)fail('Invalid native result provenance.','ENGINE_FAILURE');
  const publicationCheck=()=>{if(!alive())throw cancelled();mount.assertSolidBinding(result.handle);if(model.id!==id||model.ext!==ext||ext.workerGeometry!==tag||tag.engine!==intent.engine||tag.resultKind!==metrics.resultKind||model.inspectKernelMetrics!==inspect||inspect.call(model)!==metrics)fail('Native output changed.','ENGINE_FAILURE');checkProjection();shellParentCheck?.();if(kind==='boolean'&&intent.kind==='join')requireSingleGeometricSolid({engine:intent.engine,engineRevision:intent.engineRevision,metrics});for(const parent of parents)mount.assertSolidBinding(parent.handle);if(source){mount.assertSolidBinding(source.handle);if(registry.findFace(source.faceId)!==source.face)fail('The selected-profile source changed.','STALE_SOURCE');}if(binding&&kind==='sweep'&&registry.findFace(binding.pathFaceId)!==binding.pathFace)fail('The sweep path source changed.','STALE_SOURCE');if(binding&&registry.findFace(binding.faceId)!==binding.face)fail('The selected-profile source changed.','STALE_SOURCE');if(loftSources)for(const section of loftSources)if(registry.findFace(section.faceId)!==section.face)fail('A selected loft source changed.','STALE_SOURCE');if(!alive())throw cancelled();};
  shellParentCheck?.(true);publicationCheck();
  let holeState=null;
  // Revolve, sweep and loft have no qualified prism lineage or hole constructor. Keep only
  // its source-lifetime check, never fabricate extrusion selection provenance.
  if(binding&&kind==='profile'){
   const constructor=Object.freeze({...binding,engine:intent.engine,engineRevision:intent.engineRevision,handle:result.handle});
   s.sources.set(intent.featureId,constructor);holeState=Object.freeze({source:constructor,records:Object.freeze([])});
  }else if(kind==='through-hole'&&parents[0].holeState?.source===source){
   const prior=parents[0].holeState.records;
   if(prior.length>=32||prior.some(r=>r.intent.featureId===intent.featureId))fail('Hole ancestry exceeds its bounded unique records.','RESOURCE_LIMIT');
   holeState=Object.freeze({source,records:Object.freeze([...prior,Object.freeze({intent})])});
  }else if(kind==='edge-treatment')holeState=parents[0].holeState||null;
  if(holeState){
   const origin=holeState.source;
   holeSeedSnapshots.set(model,Object.freeze({status:'available',sourceFeatureId:origin.featureId,sourceFaceId:origin.faceId,sourceRegionId:origin.regionId,
    seeds:Object.freeze(holeState.records.filter(r=>r.intent.kind==='centered-through').map(r=>Object.freeze({seedFeatureId:r.intent.featureId,kind:r.intent.kind})))}));
  }
  for(const parent of parents)s.outputs.delete(parent.model.id);
  s.outputs.set(id,Object.freeze({engine:intent.engine,featureId:intent.featureId,kind,model,handle:result.handle,holeState}));
  return Object.freeze({model,resultKind:metrics.resultKind,outputId:id,consumed:Object.freeze(parents.map(x=>x.model)),publicationCheck});
 } catch(error){if(mount)owner.close();throw error;}
}

// Read-only use of a FRESH candidate's real private native output. Accepted
// models have retired handles; no public caller can supply or receive one here.
export async function readCandidateWorkerDrawing({owner,registry,bodyId,definition,expectedMetrics,valid}){
 const def=captureLinkedPartDrawingDefinition(definition),engine=def.target.engine,engineRevision=def.target.engineRevision,featureId=def.target.featureId;
 if(!owner||typeof owner.requireObservationOnly!=='function'||typeof owner.requireCurrent!=='function'||typeof valid!=='function'||!registry||typeof registry.find!=='function'||bodyId!==solidBodyId(featureId))fail('Invalid drawing candidate observation.');
 const current=()=>{owner.requireObservationOnly();owner.requireCurrent();if(owner.state!=='candidate'||owner.signal.aborted||valid()!==true)throw cancelled();owner.requireObservationOnly();owner.requireCurrent();};
 current();const s=ledgers.get(owner),mount=s?.mount,item=s?.outputs.get(bodyId),operationKinds={profile:'WORKER_SELECTED_PROFILE_EXTRUDE_V2',box:'WORKER_SOLID_BOX_V1',boolean:'WORKER_SOLID_BOOLEAN_V1','edge-treatment':'WORKER_SOLID_EDGE_TREATMENT_V1','through-hole':'WORKER_THROUGH_HOLES_V1','linear-hole-pattern':'WORKER_LINEAR_HOLE_PATTERN_V1',revolve:'WORKER_SELECTED_PROFILE_REVOLVE_V1',sweep:'WORKER_SELECTED_PROFILE_SWEEP_V1',loft:'WORKER_SELECTED_PROFILE_LOFT_V1'};
 if(!s||s.engine!==engine||s.engineRevision!==engineRevision||!mount||!item||item.featureId!==featureId||registry.find(bodyId)!==item.model||item.model.featureId!==featureId||operationKinds[item.kind]!==def.target.operationType)fail('Drawing target differs from the actual candidate.','INVALID_OPERAND');
 const build=requireCadEngineBuild(engine,engineRevision);if(build.drawingReferenceVersion!==1||!mount.descriptor.operations.some(op=>op.id==='solid.drawing.references.read'&&op.version===1)||!mount.descriptor.operations.some(op=>op.id==='solid.drawing.orthographic.read'&&op.version===1))fail('The whole-part build does not bind drawing observations.','ENGINE_CAPABILITY_UNAVAILABLE');validateEngineMount(engine,mount,engineRevision);
 const metrics=item.model.inspectKernelMetrics();
 if(!Object.isFrozen(expectedMetrics)||metrics.resultKind!=='single-solid'||expectedMetrics.resultKind!=='single-solid'||metrics.solidCount!==1||expectedMetrics.solidCount!==1||metrics.nativeValidity?.valid!==true||expectedMetrics.nativeValidity?.valid!==true||!(metrics.nativeVolume>0)||!Object.is(metrics.nativeVolume,expectedMetrics.nativeVolume)||!metrics.nativeBounds||!expectedMetrics.nativeBounds||['min','max'].some(key=>!Array.isArray(expectedMetrics.nativeBounds[key])||expectedMetrics.nativeBounds[key].length!==3||metrics.nativeBounds[key].some((v,i)=>!Object.is(v,expectedMetrics.nativeBounds[key][i])))||'sha256:'+metrics.runtime.jsSha256+':'+metrics.runtime.wasmSha256!==engineRevision||'sha256:'+expectedMetrics.runtime?.jsSha256+':'+expectedMetrics.runtime?.wasmSha256!==engineRevision)fail('Drawing replay differs from the captured native result.','REPLAY_RESULT_MISMATCH');
 const source=s.sources.get(def.datum.featureId),check=()=>{current();if(s.outputs.get(bodyId)!==item||registry.find(bodyId)!==item.model||item.model.inspectKernelMetrics()!==metrics)fail('Drawing target changed.','INVALID_OPERAND');mount.assertSolidBinding(item.handle);if(source&&(s.sources.get(def.datum.featureId)!==source||registry.findFace(source.faceId)!==source.face))throw cancelled();current();};
 try{
  check();let observation;
  if(!source||source.engine!==engine||source.engineRevision!==engineRevision||source.faceId!==def.datum.faceId||source.regionId!==def.datum.regionId||registry.findFace(source.faceId)!==source.face||source.face.isPlaneBased!==true)observation=unresolvedDrawingRead(def,'DRAWING_DATUM_UNAVAILABLE');
  else{mount.assertSolidBinding(source.handle);const result=await mount.execute({op:'solid.drawing.references.read',version:1,unit:'millimeter',handle:item.handle,sourceHandle:source.handle,producerFeatureId:featureId,definition:def},{signal:owner.signal});check();if(result?.contractVersion!==1||result.op!=='solid.drawing.references.read'||result.unit!=='millimeter')fail('Malformed drawing references.','ENGINE_FAILURE');observation=captureDrawingReadResult(result.observation,def);}
  const views=[];for(const row of observation.viewFrames){check();try{const result=await mount.execute({op:'solid.drawing.orthographic.read',version:1,unit:'millimeter',handle:item.handle,frame:row.frame},{signal:owner.signal});check();if(result?.contractVersion!==1||result.op!=='solid.drawing.orthographic.read'||result.unit!=='millimeter')fail('Malformed drawing projection.','ENGINE_FAILURE');views.push(Object.freeze({viewId:row.viewId,status:'available',reason:null,metadata:result.metadata,values:result.values,tags:result.tags}));}catch(error){if(!['ORTHOGRAPHIC_INVALID_REQUEST','ORTHOGRAPHIC_INVALID_FRAME','ORTHOGRAPHIC_INVALID_INPUT','ORTHOGRAPHIC_RESOURCE_LIMIT','ORTHOGRAPHIC_CURVE_UNSUPPORTED','ORTHOGRAPHIC_NUMERIC_RANGE','ORTHOGRAPHIC_FAILED'].includes(error?.code))throw error;check();views.push(Object.freeze({viewId:row.viewId,status:'unavailable',reason:error.code,metadata:null,values:null,tags:null}));}}
  check();return Object.freeze({observation,views:Object.freeze(views),status:observation.status==='available'&&views.length===def.views.length&&views.every(v=>v.status==='available')?'available':'unresolved'});
 }catch(operationError){if(owner.state==='candidate')try{owner.close();}catch(cause){throw Object.assign(Error('Drawing observation cleanup failed'),{code:'ENGINE_CLEANUP_FAILED',cause,operationError});}throw operationError;}
}

export async function classifyCandidateWorkerSolidPoints({owner,registry,bodyId,featureId,engine,engineRevision,points,expectedMetrics,valid}){
 const alive=()=>{try{return owner?.state==='candidate'&&!owner.signal.aborted&&valid()===true;}catch{return false;}};
 const current=()=>{owner.requireCurrent();if(!alive())throw cancelled();};
 if(!owner||typeof owner.requireCurrent!=='function'||typeof valid!=='function'||!registry||typeof registry.find!=='function'||engine!=='occ'||typeof bodyId!=='string'||bodyId!==solidBodyId(featureId)||!Array.isArray(points)||points.length<1||points.length>64||Reflect.ownKeys(points).length!==points.length+1)fail('Invalid candidate observation.');
 const captured=[];for(let i=0;i<points.length;i++){const d=Object.getOwnPropertyDescriptor(points,String(i)),p=d?.value;if(!d?.enumerable||!Object.hasOwn(d,'value')||!Array.isArray(p)||p.length!==3||Reflect.ownKeys(p).length!==4)fail('Invalid observation point.');const q=[];for(let j=0;j<3;j++){const n=Object.getOwnPropertyDescriptor(p,String(j));if(!n?.enumerable||!Object.hasOwn(n,'value')||typeof n.value!=='number'||!Number.isFinite(n.value)||Math.abs(n.value)>4e6)fail('Invalid observation coordinate.');q.push(n.value);}captured.push(Object.freeze(q));}
 current();const s=ledgers.get(owner),item=s?.outputs.get(bodyId),mount=s?.mount;
 if(!item||s.engine!==engine||s.engineRevision!==engineRevision||item.featureId!==featureId||item.engine!==engine||registry.find(bodyId)!==item.model||item.model.featureId!==featureId)fail('The replayed current output is unavailable.','INVALID_OPERAND');
 if(!mount.descriptor?.operations?.some(op=>op.id==='solid.point.classify'&&op.version===1))fail('The requested runtime cannot classify native points.','ENGINE_CAPABILITY_UNAVAILABLE');
 const metrics=item.model.inspectKernelMetrics();
 if(!Object.isFrozen(expectedMetrics)||metrics.resultKind!=='single-solid'||expectedMetrics.resultKind!==metrics.resultKind||metrics.solidCount!==1||expectedMetrics.solidCount!==1||metrics.nativeValidity?.valid!==true||expectedMetrics.nativeValidity?.valid!==true||!Number.isFinite(metrics.nativeVolume)||metrics.nativeVolume<=0||!Object.is(metrics.nativeVolume,expectedMetrics.nativeVolume)||!metrics.nativeBounds||!expectedMetrics.nativeBounds||['min','max'].some(key=>!Array.isArray(expectedMetrics.nativeBounds[key])||expectedMetrics.nativeBounds[key].length!==3||metrics.nativeBounds[key].some((v,i)=>!Object.is(v,expectedMetrics.nativeBounds[key][i])))||'sha256:'+metrics.runtime.jsSha256+':'+metrics.runtime.wasmSha256!==engineRevision||'sha256:'+expectedMetrics.runtime?.jsSha256+':'+expectedMetrics.runtime?.wasmSha256!==engineRevision)fail('Native replay measurements differ from the captured current output.','REPLAY_RESULT_MISMATCH');
 try{const results=[];for(const point of captured){current();mount.assertSolidBinding(item.handle);if(registry.find(bodyId)!==item.model||s.outputs.get(bodyId)!==item)fail('The observed output changed.','INVALID_OPERAND');const response=await mount.execute({op:'solid.point.classify',version:1,unit:'millimeter',handle:item.handle,point},{signal:owner.signal});current();if(!response||Reflect.ownKeys(response).sort().join(',')!=='classification,contractVersion,op,unit'||response.contractVersion!==1||response.op!=='solid.point.classify'||response.unit!=='millimeter'||!['inside','outside','boundary','unknown'].includes(response.classification))fail('Malformed native classification.','ENGINE_FAILURE');mount.assertSolidBinding(item.handle);results.push(Object.freeze({point,classification:response.classification}));}current();return Object.freeze(results);}catch(error){owner.close();throw error;}
}

// Manufacturing reads the same fresh candidate ledger as point observation.
// Native handles remain private and never become caller-supplied selections.
export async function exportCandidateWorkerSTEP({owner,registry,engine,engineRevision,bodies,valid}){
 const current=()=>{owner.requireCurrent();let alive=false;try{alive=owner.state==='candidate'&&!owner.signal.aborted&&valid()===true;}catch{}if(!alive)throw cancelled();};
 if(!owner||typeof owner.requireCurrent!=='function'||typeof valid!=='function'||!registry||typeof registry.find!=='function'||engine!=='occ'||!Array.isArray(bodies)||bodies.length<1||bodies.length>32||Reflect.ownKeys(bodies).length!==bodies.length+1)fail('Invalid candidate STEP selection.');
 current();const s=ledgers.get(owner),mount=s?.mount;
 if(!s||s.engine!==engine||s.engineRevision!==engineRevision||!mount?.descriptor?.operations?.some(op=>op.id==='solid.step.export'&&op.version===1))fail('The current part runtime cannot export STEP.','ENGINE_CAPABILITY_UNAVAILABLE');
 const ids=new Set(),selected=[];
 for(let i=0;i<bodies.length;i++){
  const d=Object.getOwnPropertyDescriptor(bodies,String(i)),row=d?.value;
  if(!d?.enumerable||!Object.hasOwn(d,'value')||!row||typeof row!=='object'||!Object.isFrozen(row)||Reflect.ownKeys(row).sort().join(',')!=='bodyId,expectedMetrics,featureId')fail('Invalid captured STEP selection.');
  for(const key of ['bodyId','featureId','expectedMetrics']){const field=Object.getOwnPropertyDescriptor(row,key);if(!field?.enumerable||!Object.hasOwn(field,'value'))fail('STEP selection requires own data.');}
  const{bodyId,featureId,expectedMetrics}=row,item=s.outputs.get(bodyId),metrics=item?.model.inspectKernelMetrics();
  if(!Number.isSafeInteger(featureId)||featureId<1||bodyId!==solidBodyId(featureId)||ids.has(bodyId)||!item||item.featureId!==featureId||item.engine!==engine||registry.find(bodyId)!==item.model||item.model.featureId!==featureId)fail('The replayed STEP output is unavailable.','INVALID_OPERAND');
  ids.add(bodyId);
  if(!expectedMetrics||typeof expectedMetrics!=='object'||!Object.isFrozen(expectedMetrics)||!['single-solid','multi-solid'].includes(metrics?.resultKind)||expectedMetrics.resultKind!==metrics.resultKind||!Number.isSafeInteger(metrics.solidCount)||metrics.solidCount<1||metrics.resultKind!==(metrics.solidCount===1?'single-solid':'multi-solid')||metrics.solidCount!==expectedMetrics.solidCount||metrics.nativeValidity?.valid!==true||expectedMetrics.nativeValidity?.valid!==true||!Number.isFinite(metrics.nativeVolume)||metrics.nativeVolume<=0||!Object.is(metrics.nativeVolume,expectedMetrics.nativeVolume)||!metrics.nativeBounds||!expectedMetrics.nativeBounds||['min','max'].some(key=>!Array.isArray(expectedMetrics.nativeBounds[key])||expectedMetrics.nativeBounds[key].length!==3||metrics.nativeBounds[key].some((n,j)=>!Object.is(n,expectedMetrics.nativeBounds[key][j])))||'sha256:'+metrics.runtime?.jsSha256+':'+metrics.runtime?.wasmSha256!==engineRevision||'sha256:'+expectedMetrics.runtime?.jsSha256+':'+expectedMetrics.runtime?.wasmSha256!==engineRevision)fail('STEP replay measurements differ from the captured output.','REPLAY_RESULT_MISMATCH');
  selected.push({item,metrics});
 }
 const check=()=>{current();for(const{item,metrics}of selected){if(s.outputs.get(item.model.id)!==item||registry.find(item.model.id)!==item.model||item.model.inspectKernelMetrics()!==metrics)fail('A selected STEP output changed.','INVALID_OPERAND');mount.assertSolidBinding(item.handle);}current();};
 try{
  check();const result=await mount.execute({op:'solid.step.export',version:1,unit:'millimeter',handles:Object.freeze(selected.map(x=>x.item.handle))},{signal:owner.signal});check();
  const own=(value,keys)=>!!value&&typeof value==='object'&&!Array.isArray(value)&&Reflect.ownKeys(value).length===keys.length&&keys.every(key=>{const d=Object.getOwnPropertyDescriptor(value,key);return d?.enumerable&&Object.hasOwn(d,'value');});
  if(!own(result,['op','contractVersion','unit','blob','metadata'])||result.op!=='solid.step.export'||result.contractVersion!==1||result.unit!=='millimeter')fail('Malformed candidate STEP artifact.','ENGINE_FAILURE');
  const m=result.metadata;
  if(!own(m,['format','schema','structure','byteLength','inputShapeCount','inputSolidCounts','transferCount'])||m.format!=='step'||m.schema!=='AP214IS'||m.structure!=='geometric-solid-set'||!Number.isSafeInteger(m.byteLength)||m.byteLength<1||m.byteLength>8388608||m.inputShapeCount!==selected.length||m.transferCount!==selected.length||!Array.isArray(m.inputSolidCounts)||m.inputSolidCounts.length!==selected.length||Reflect.ownKeys(m.inputSolidCounts).length!==selected.length+1)fail('Malformed candidate STEP metadata.','ENGINE_FAILURE');
  for(let i=0;i<selected.length;i++){const d=Object.getOwnPropertyDescriptor(m.inputSolidCounts,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value')||d.value!==selected[i].metrics.solidCount)fail('STEP solid counts differ from owned results.','ENGINE_FAILURE');}
  let size,type;try{size=STEP_BLOB_SIZE.call(result.blob);type=STEP_BLOB_TYPE.call(result.blob);}catch{fail('STEP artifact is not a native Blob.','ENGINE_FAILURE');}
  if(size!==m.byteLength||type!=='application/octet-stream')fail('STEP artifact bytes disagree with native receipt.','ENGINE_FAILURE');
  check();return Object.freeze({op:result.op,contractVersion:1,unit:'millimeter',blob:result.blob,metadata:Object.freeze({...m,inputSolidCounts:Object.freeze([...m.inputSolidCounts])})});
 }catch(error){owner.close();throw error;}
}

// Read only a protected replay candidate; no accepted handle or display fallback.
export async function readCandidateWorkerManufacturingMesh({owner,registry,engine,engineRevision,body,controls,valid}){
 const own=(value,keys)=>!!value&&typeof value==='object'&&!Array.isArray(value)&&Reflect.ownKeys(value).length===keys.length&&keys.every(key=>{const d=Object.getOwnPropertyDescriptor(value,key);return d?.enumerable&&Object.hasOwn(d,'value');});
 if(!owner||typeof owner.requireCurrent!=='function'||typeof owner.close!=='function'||typeof owner.requireObservationOnly!=='function'||typeof valid!=='function'||!registry||typeof registry.find!=='function'||engine!=='occ'||!own(body,['bodyId','featureId','expectedMetrics'])||!Object.isFrozen(body)||!own(controls,['linearDeflectionMm','angularDeflectionRadians','relative','maxVertices','maxTriangles']))fail('Invalid candidate manufacturing selection.');
 const captured=Object.freeze({bodyId:body.bodyId,featureId:body.featureId,expectedMetrics:body.expectedMetrics}),limits=captureManufacturingControls({...controls});
 if(typeof captured.bodyId!=='string'||!captured.bodyId||captured.bodyId.length>256||!Number.isSafeInteger(captured.featureId)||captured.featureId<1||captured.bodyId!==solidBodyId(captured.featureId))fail('Invalid authored manufacturing identity.');
 const current=()=>{owner.requireObservationOnly();owner.requireCurrent();if(owner.state!=='candidate'||owner.signal.aborted)throw cancelled();let live=false;try{live=valid()===true;}catch{}if(!live||owner.state!=='candidate'||owner.signal.aborted)throw cancelled();owner.requireCurrent();owner.requireObservationOnly();if(owner.state!=='candidate'||owner.signal.aborted)throw cancelled();};
 current();const s=ledgers.get(owner),mount=s?.mount;
 if(!s||s.engine!==engine||s.engineRevision!==engineRevision||!mount)fail('The candidate part runtime cannot provide controlled manufacturing mesh.','ENGINE_CAPABILITY_UNAVAILABLE');
 requireManufacturingMeshBuild(engine,engineRevision);validateEngineMount(engine,mount,engineRevision);current();
 const item=s.outputs.get(captured.bodyId);
 if(!item||item.featureId!==captured.featureId||item.engine!==engine||registry.find(captured.bodyId)!==item.model||item.model.featureId!==captured.featureId)fail('The replayed manufacturing output is unavailable.','INVALID_OPERAND');
 const metrics=item.model.inspectKernelMetrics();
 const measurement=value=>{
  const field=(v,k)=>{const d=v&&typeof v==='object'?Object.getOwnPropertyDescriptor(v,k):null;if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('Manufacturing replay measurements must be data.','REPLAY_RESULT_MISMATCH');return d.value;};
  if(!value||typeof value!=='object'||!Object.isFrozen(value)||field(value,'resultKind')!=='single-solid'||field(value,'solidCount')!==1)fail('Manufacturing requires a current single-solid measurement.','REPLAY_RESULT_MISMATCH');
  const validity=field(value,'nativeValidity'),volume=field(value,'nativeVolume'),bounds=field(value,'nativeBounds'),runtime=field(value,'runtime');
  const js=runtime&&field(runtime,'jsSha256'),wasm=runtime&&field(runtime,'wasmSha256');if(!validity||field(validity,'valid')!==true||typeof volume!=='number'||!Number.isFinite(volume)||volume<=0||!bounds||typeof js!=='string'||typeof wasm!=='string'||!/^[a-f0-9]{64}$/.test(js)||!/^[a-f0-9]{64}$/.test(wasm)||'sha256:'+js+':'+wasm!==engineRevision)fail('Manufacturing replay measurements differ.','REPLAY_RESULT_MISMATCH');
  const vectors=['min','max'].map(key=>{const v=field(bounds,key),length=v&&Object.getOwnPropertyDescriptor(v,'length');if(!Array.isArray(v)||!length||length.value!==3||Reflect.ownKeys(v).length!==4)fail('Malformed manufacturing native bounds.','REPLAY_RESULT_MISMATCH');return Object.freeze([0,1,2].map(i=>{const n=field(v,String(i));if(typeof n!=='number'||!Number.isFinite(n))fail('Invalid manufacturing bound.','REPLAY_RESULT_MISMATCH');return n;}));});
  if(vectors[0].some((n,i)=>n>vectors[1][i]))fail('Invalid manufacturing native bounds.','REPLAY_RESULT_MISMATCH');return Object.freeze({volume,min:vectors[0],max:vectors[1]});
 };
 const expected=measurement(captured.expectedMetrics),actual=measurement(metrics);
 if(!Object.is(actual.volume,expected.volume)||['min','max'].some(key=>actual[key].some((n,i)=>!Object.is(n,expected[key][i]))))fail('Native manufacturing replay differs from captured output.','REPLAY_RESULT_MISMATCH');
 const check=()=>{current();if(s.outputs.get(captured.bodyId)!==item||registry.find(captured.bodyId)!==item.model||item.model.featureId!==captured.featureId||item.model.inspectKernelMetrics()!==metrics)fail('The selected manufacturing output changed.','INVALID_OPERAND');validateEngineMount(engine,mount,engineRevision);mount.assertSolidBinding(item.handle);current();};
 try{
  check();const result=await mount.execute({op:'solid.manufacturing.mesh.read',version:1,unit:'millimeter',handle:item.handle,...limits},{signal:owner.signal});check();
  if(!own(result,['op','contractVersion','unit','metadata','buffer'])||result.op!=='solid.manufacturing.mesh.read'||result.contractVersion!==1||result.unit!=='millimeter')fail('Malformed candidate manufacturing artifact.','ENGINE_FAILURE');
  const metadata=captureManufacturingMetadata(result.metadata,limits);let length;try{length=Object.getOwnPropertyDescriptor(ArrayBuffer.prototype,'byteLength').get.call(result.buffer);new DataView(result.buffer);}catch{fail('Expected standalone manufacturing binary.','ENGINE_FAILURE');}if(length!==metadata.byteLength)fail('Manufacturing artifact byte count changed.','ENGINE_FAILURE');
  check();return Object.freeze({op:result.op,contractVersion:1,unit:'millimeter',body:Object.freeze({bodyId:captured.bodyId,featureId:captured.featureId}),engine,engineRevision,metadata,buffer:result.buffer});
 }catch(operationError){
  // Observation purpose permanently forbids accept, including after this read. Never
  // destroy an accepted owner, even if a caller violated that custody contract.
  if(owner.state==='candidate')try{owner.close();}catch(cause){throw Object.assign(Error('Candidate manufacturing cleanup failed'),{code:'ENGINE_CLEANUP_FAILED',cause,operationError});}
  if(owner.state==='closed')try{owner.requireCurrent();}catch(cause){let expectedAbort=false;try{expectedAbort=cause instanceof DOMException&&Object.getOwnPropertyDescriptor(DOMException.prototype,'name').get.call(cause)==='AbortError';}catch{}if(!expectedAbort)throw Object.assign(Error('Candidate manufacturing cleanup was not established'),{code:'ENGINE_CLEANUP_FAILED',cause,operationError});}
  throw operationError;
 }
}
