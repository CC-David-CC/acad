import {PROFILE_EXTENT_ATTACHMENT_POLICY} from './ownedPlanarAttachmentProtocol.mjs';
import {captureDrawingDerivedRequest,DRAWING_DERIVED_REFUSALS} from './ownedDrawingDerivedProtocol.mjs';
import {captureProfileExtentIntent,captureProfileExtentEvaluation,sameProfileExtentBinding,PROFILE_EXTENT_REFUSALS,PROFILE_EXTENT_OPERATION} from './ownedProfileExtentPlan.mjs';
import {captureDrawingSectionTransfer} from './ownedDrawingSectionProtocol.mjs';
import {captureDrawingDetailTransfer} from './drawingDetailClip.mjs';
import {isMechanicalConstructorRuntime,captureBoundProfileConstructor,captureProfileConstructorBinding,sameProfileConstructorBinding} from './profileConstructorSourceBinding.mjs';
import {captureBoreReadRequest,captureBoreReadResult} from './ownedBoreReadProtocol.mjs';
import {SHELL_JS_SHA,SHELL_WASM_SHA,SHELL_OPERATION,SHELL_REFUSALS,BOX_CONSTRUCTION_REFUSALS,captureShellRequest,captureShellBinding,captureShellBoxRequest} from './ownedShellProtocol.mjs';
import {SWEEP_NATIVE_REFUSALS,SWEEP_PREPARATION_REFUSALS} from '../solid/ownedSweepIntent.mjs';
import {captureOwnedLinearHolePatternIntent,linearHolePatternNativeCost} from '../solid/ownedLinearHolePatternIntent.mjs';
import {captureOwnedHoleIntent} from '../solid/ownedHoleIntent.mjs';
import {SELECTED_PROFILE_BUDGET,createSelectedResultTriangleBudget} from './selectedProfileBudget.mjs';
import {validateEnclosureManufacturingRequest} from './enclosureManufacturingMesh.mjs';
import {validateEnclosureMesh} from './enclosureMesh.mjs';
import {enclosurePlan,enclosurePlanV2,validateManifoldEnclosureInput,validateManifoldEnclosureInputV2} from './enclosurePlan.mjs';
// Research adapter. The bootstrap worker itself must be pinned by the host.
import {EngineContractError} from './contract.mjs';
import {captureDrawingReadRequest,captureDrawingReadResult} from './ownedDrawingReadProtocol.mjs';
import {captureWorkerReplyRecord,captureWorkerMetadata} from './workerReplyRecord.mjs';
import {validatePortableEnvelope} from './portable-topology-envelope.mjs';
import {copyDrilledTopology} from './drilledTopologyEnvelope.mjs';
import {captureFourCornerRequest,captureFourCornerBinding,copyFourCornerTopology} from './fourCornerMountContract.mjs';
const err=(code,message,...causes)=>{const failure=new EngineContractError(code,message);if(causes.length)Object.defineProperty(failure,'cause',{value:causes[0],configurable:true});return failure;};
export function createWorkerMount({workerUrl, jsPath, wasmPath, timeoutMs=30000}, config) {
  const {jsSha256:JS_SHA,wasmSha256:WASM_SHA,representation,engine,mesh,profile,centeredCut=false,fourCornerCut=false,enclosure=false,selectedProfile=false,selectedProfileVersion=2,edgeTreatments=false,booleanHistory=false,throughHoles=false,blindHoles=false,counterbores=false,linearHolePatterns=false,revolve=false,sweep=false,loft=false,adaptiveMetrology=false,stepExport=false,orthographicRead=false,manufacturingMesh=false,shell=false,captureManufacturingMeshRequest,captureManufacturingMeshResult,manufacturingNativeCodes=[],manufacturingRefusalCodes=[],captureOrthographicReadRequest,captureOrthographicReadResult,orthographicFrameValues,orthographicNativeCodes=[],orthographicRefusalCodes=[],captureStepExportRequest,captureStepExportResult,stepNativeCodes=[],stepRefusalCodes=[],captureSelectedProfile,captureRevolve,bindRevolve,captureSweep,bindSweep,captureLoft,loftBindingFields,captureLoftBinding,sameLoftBinding,loftNativeCodes=[],loftPreparationCodes=[]} = config;
  const {captureBlindHoleIntent:captureOwnedBlindHoleIntent,blindHoleCodes:BLIND_HOLE_CODES=[]}=config;
  const {captureCounterboreIntent:captureOwnedCounterboreIntent,counterboreCodes:COUNTERBORE_CODES=[]}=config;
  const primaryManufacturingRuntime=JS_SHA==='32eec74e3019d9e2d767c9016f05aa3daa49441c6102423a269d67b9c7f02a08'&&WASM_SHA==='abbf2aa02a6f2101c600aa1eedd20fa80ab2db206e677ca860d9c5103cdfbfcc';
  const profileExtents=config.profileExtents===true;
  if(config.profileExtents!==undefined&&typeof config.profileExtents!=='boolean'||profileExtents&&(!primaryManufacturingRuntime||!selectedProfile||selectedProfileVersion!==3||!booleanHistory||!manufacturingMesh||!throughHoles||config.planarAttachments!==true))throw err('INVALID_MOUNT','Profile extents require the explicit source-bound primary manufacturing cohort');
  const circularArrangementVersion=config.circularArrangementVersion??0;
  const {captureCircularCellRequest,captureCircularConstructionCertificate,matchesCircularRuntime,circularNativeCodes=[]}=config;
  // Only the reviewed private factory supplies this exact-pair matcher.
  const circularRuntime=circularArrangementVersion===1&&typeof matchesCircularRuntime==='function'&&matchesCircularRuntime(JS_SHA,WASM_SHA)===true;
  if(![0,1].includes(circularArrangementVersion)||circularArrangementVersion===1&&(!circularRuntime||!shell||!booleanHistory||!selectedProfile||selectedProfileVersion!==3||typeof captureCircularCellRequest!=='function'||typeof captureCircularConstructionCertificate!=='function'||!Array.isArray(circularNativeCodes)||circularNativeCodes.length!==12||!circularNativeCodes.includes('CIRCULAR_INPUT_CHANGED')||!circularNativeCodes.includes('MEASUREMENT_PRECISION_UNRESOLVED')))throw err('INVALID_MOUNT','Circular cells require their exact registered owned runtime and captures');
  const profileSourceBindingVersion=config.profileSourceBindingVersion??0,mechanicalConstructorRuntime=isMechanicalConstructorRuntime('sha256:'+JS_SHA+':'+WASM_SHA);
  if(![0,1].includes(profileSourceBindingVersion)||(profileSourceBindingVersion===1&&(!mechanicalConstructorRuntime||!selectedProfile||selectedProfileVersion!==3))||(mechanicalConstructorRuntime&&selectedProfile&&profileSourceBindingVersion!==1))throw err('INVALID_MOUNT','Constructor source binding requires its exact closed mechanical runtime.');
  const mechanicalBoundRuntime=profileSourceBindingVersion===1&&mechanicalConstructorRuntime;
  if(mechanicalBoundRuntime&&(engine!=='occ-mechanical-native-v1-component'||mesh||profile||centeredCut||fourCornerCut||enclosure||config.selectedRegionArrangementVersion!==1||![selectedProfile,edgeTreatments,booleanHistory,throughHoles,linearHolePatterns,revolve,sweep,loft,adaptiveMetrology,stepExport,orthographicRead,manufacturingMesh,config.drawingReferences].every(value=>value===true)||shell||circularArrangementVersion!==0||profileExtents||blindHoles||counterbores||config.planarAttachments===true||config.drawingDetails===true||config.drawingSections===true))throw err('INVALID_MOUNT','The initial bound mechanical cohort requires its exact enabled and pending mode vocabulary');
  const selectedRegionArrangementVersion=config.selectedRegionArrangementVersion??0;
  if(![0,1].includes(selectedRegionArrangementVersion)||selectedRegionArrangementVersion===1&&(!selectedProfile||selectedProfileVersion!==3||!booleanHistory))throw err('INVALID_MOUNT','Arrangement cells require an explicit complete V3/selection-plan-v2 adapter');
  if(selectedProfile&&(mesh||representation!=='occ-brep-worker-owned'||typeof captureSelectedProfile!=='function'))throw err('INVALID_MOUNT','Selected profiles require the explicit OCC component adapter');
  if(![2,3].includes(selectedProfileVersion)||selectedProfileVersion===3&&!selectedProfile)throw err('INVALID_MOUNT','Invalid selected-profile component version');
  if(typeof edgeTreatments!=='boolean'||edgeTreatments&&(!selectedProfile||selectedProfileVersion!==3))throw err('INVALID_MOUNT','Edge treatments require the explicit owned polygon runtime');
  const shellRuntime=circularRuntime||JS_SHA===SHELL_JS_SHA&&WASM_SHA===SHELL_WASM_SHA;
  if(typeof shell!=='boolean'||shell&&(!shellRuntime||!manufacturingMesh||!booleanHistory))throw err('INVALID_MOUNT','Shell requires its exact owned runtime and inherited cohort');
  const manufacturingRuntime=shell&&shellRuntime||JS_SHA==='32eec74e3019d9e2d767c9016f05aa3daa49441c6102423a269d67b9c7f02a08'&&WASM_SHA==='abbf2aa02a6f2101c600aa1eedd20fa80ab2db206e677ca860d9c5103cdfbfcc';
  const planarAttachments=config.planarAttachments===true;
  const {capturePlanarAttachmentRequest,capturePlanarAttachmentObservation,planarAttachmentReasons=[]}=config;
  if(config.planarAttachments!==undefined&&typeof config.planarAttachments!=='boolean'||planarAttachments&&(!(shellRuntime&&shell||primaryManufacturingRuntime&&manufacturingMesh)||!throughHoles||!booleanHistory||(![capturePlanarAttachmentRequest,capturePlanarAttachmentObservation].every(fn=>typeof fn==='function')||!Array.isArray(planarAttachmentReasons)||planarAttachmentReasons.length<1||planarAttachmentReasons.length>32||planarAttachmentReasons.some(r=>typeof r!=='string'||r.length>128))))throw err('INVALID_MOUNT','Planar attachments require the explicit source-bound shell cohort and captures');
  if(typeof blindHoles!=='boolean'||blindHoles&&(!primaryManufacturingRuntime||!manufacturingMesh||!planarAttachments||selectedProfileVersion!==3||!booleanHistory||typeof captureOwnedBlindHoleIntent!=='function'||!Array.isArray(BLIND_HOLE_CODES)||BLIND_HOLE_CODES.length>32))throw err('INVALID_MOUNT','Blind holes require the exact entry-bound manufacturing cohort');
  if(typeof counterbores!=='boolean'||counterbores&&(!primaryManufacturingRuntime||!manufacturingMesh||!planarAttachments||selectedProfileVersion!==3||!booleanHistory||typeof captureOwnedCounterboreIntent!=='function'||!Array.isArray(COUNTERBORE_CODES)||COUNTERBORE_CODES.length>32))throw err('INVALID_MOUNT','Counterbores require the exact entry-bound manufacturing cohort');
  const drawingReferences=config.drawingReferences===true;
  if(config.drawingReferences!==undefined&&typeof config.drawingReferences!=='boolean'||drawingReferences&&(!orthographicRead||!throughHoles||!booleanHistory))throw err('INVALID_MOUNT','Drawing references require the explicit owned orthographic/hole runtime');
  const drawingDetails=config.drawingDetails===true,drawingSections=config.drawingSections===true;
  if(config.drawingDetails!==undefined&&typeof config.drawingDetails!=='boolean'||config.drawingSections!==undefined&&typeof config.drawingSections!=='boolean'||drawingDetails&&!drawingReferences||drawingSections&&(!drawingDetails||!shell||JS_SHA!==SHELL_JS_SHA||WASM_SHA!==SHELL_WASM_SHA))throw err('INVALID_MOUNT','Derived drawing roles require their exact reviewed owned source graph');
  if(typeof manufacturingMesh!=='boolean'||manufacturingMesh&&(!(manufacturingRuntime||mechanicalBoundRuntime)||!orthographicRead||!stepExport||!adaptiveMetrology||!loft||![captureManufacturingMeshRequest,captureManufacturingMeshResult].every(fn=>typeof fn==='function')||!Array.isArray(manufacturingNativeCodes)||!Array.isArray(manufacturingRefusalCodes)))throw err('INVALID_MOUNT','Manufacturing mesh requires its exact owned cohort and captures');
  const orthographicRuntime=manufacturingMesh&&manufacturingRuntime||JS_SHA==='2f2e9f92b2b57024b372143c3f2f4aa3dc4999bad7f6636c36f0b0f599f04cb7'&&WASM_SHA==='26d94303a8561b0922acae5b921f486e857083d8febaa9638d1ebd0eff590018';
  if(typeof orthographicRead!=='boolean'||orthographicRead&&(!(orthographicRuntime||mechanicalBoundRuntime)||!stepExport||!adaptiveMetrology||!loft||![captureOrthographicReadRequest,captureOrthographicReadResult,orthographicFrameValues].every(fn=>typeof fn==='function')||!Array.isArray(orthographicNativeCodes)||!Array.isArray(orthographicRefusalCodes)))throw err('INVALID_MOUNT','Orthographic read requires its exact owned cohort and captures');
  const stepRuntime=orthographicRead&&orthographicRuntime||JS_SHA==='ca349411fc9e27677bf27072497abb22077d80c28e27ef073266966d16b07733'&&WASM_SHA==='c154a4e04961a9a50108fadcf72eca54169ba4db2e9564d24519f197e0568c2f';
  if(typeof stepExport!=='boolean'||stepExport&&(!(stepRuntime||mechanicalBoundRuntime)||!adaptiveMetrology||!loft||typeof captureStepExportRequest!=='function'||typeof captureStepExportResult!=='function'||!Array.isArray(stepNativeCodes)||!Array.isArray(stepRefusalCodes)))throw err('INVALID_MOUNT','STEP requires its exact owned runtime and capture');
  const adaptiveRuntime=stepExport&&stepRuntime||JS_SHA==='ed06b634a3e81f9a51c89f75b3d65e03b8ace1fc483900ea2858eae8eff970a4'&&WASM_SHA==='bc8895ceb123e33aad68c8a1cf6322b5c0ccef9bfb129207defe1b8a5a7c893a';
  if(typeof adaptiveMetrology!=='boolean'||adaptiveMetrology&&(!(adaptiveRuntime||mechanicalBoundRuntime)||!loft))throw err('INVALID_MOUNT','Adaptive metrology requires its explicit owned loft runtime');
  const loftRuntime=adaptiveMetrology&&adaptiveRuntime||JS_SHA==='5ce2aa94ecdd48dc16f0b9c3ad2a065ea1416ddb7d123c3168661e31ade0a1b5'&&WASM_SHA==='b18af4376fb0fb8b4aaa7478ede6b47346c331ee45e1198347c0a70232fd4180';
  if(typeof loft!=='boolean'||loft&&(!(loftRuntime||mechanicalBoundRuntime)||!selectedProfile||selectedProfileVersion!==3||![captureLoft,loftBindingFields,captureLoftBinding,sameLoftBinding].every(fn=>typeof fn==='function')||!Array.isArray(loftNativeCodes)||!Array.isArray(loftPreparationCodes)||loftPreparationCodes.includes('LOFT_INPUT_CHANGED')||loftNativeCodes.includes('LOFT_INPUT_CHANGED')))throw err('INVALID_MOUNT','Loft requires its explicit owned runtime and capture');
  const sweepRuntime=loft&&loftRuntime||JS_SHA==='a9cfa6e53a8bc14f2fb035e33afd1a82d9ae36ace1cf9f66169c739d2de72580'&&WASM_SHA==='e105bdfe7c7bcb113eee5398d8202831cb8e8b1608dcc1730fc4461c9f24263d';
  if(typeof sweep!=='boolean'||sweep&&(!(sweepRuntime||mechanicalBoundRuntime)||!selectedProfile||selectedProfileVersion!==3||typeof captureSweep!=='function'||typeof bindSweep!=='function'))throw err('INVALID_MOUNT','Sweep requires its explicit owned runtime and capture');
  const revolveRuntime=sweep&&sweepRuntime||JS_SHA==='567419c13c78fff46cbc9cd07e5a993106b652a13cb9f6944831f68ef48729cc'&&WASM_SHA==='ad9475c81ea2eecadd41c73f0b0860d7d06c53e4292b16047472f03995f3efdd';
  if(typeof revolve!=='boolean'||revolve&&(!(revolveRuntime||mechanicalBoundRuntime)||!selectedProfile||selectedProfileVersion!==3||typeof captureRevolve!=='function'||typeof bindRevolve!=='function'))throw err('INVALID_MOUNT','Revolution requires its explicit owned runtime and capture');
  if(typeof booleanHistory!=='boolean'||booleanHistory&&(!edgeTreatments||!(JS_SHA==='dd666902fe926d69cc3c8843f5568c2a3e569f38ff49291baa2f248165b5ea99'&&WASM_SHA==='8d5e537e0d7f9e12b8ae0eaf239c0be1080934ed12a24bf6e7f849c9135ed5a2'||revolve&&revolveRuntime||mechanicalBoundRuntime)))throw err('INVALID_MOUNT','Boolean history requires its explicit owned runtime');
  if(typeof throughHoles!=='boolean'||throughHoles&&!booleanHistory)throw err('INVALID_MOUNT','Through holes require the owned Boolean-history runtime');
  if(typeof linearHolePatterns!=='boolean'||linearHolePatterns&&!throughHoles)throw err('INVALID_MOUNT','Linear hole patterns require authenticated through-hole ownership');
  const oldHoleRuntime=JS_SHA==='f74142622c9ced56b8f2e7955301ace5902f811734a71128767fb05de4159972' && WASM_SHA==='c39793b8aff34dc548b57fee1d901219e372702a5005ef92dfdf94994c012897';
  // Source-exact 8c child link against freshly built 846 OCCT libraries.
  const fourHoleRuntime=JS_SHA==='a8774acbbe3a90d7c82fe294c769096179eae351e5a8c854d4d0a31737a706ee' && WASM_SHA==='13617eda9a2118edfd1244b5d46523e7d9628a87ec995a0237b2b5cc58d532f2' || JS_SHA==='a84b31900e58e61a1d7e3f8d04978408455764ad149923359e7fba19d3d07884' && WASM_SHA==='07d763a05f35cd257501d339d9087df63c65bcaeb51a4f4f80832e333892e12e';
  if (centeredCut && (mesh || !profile || representation!=='occ-brep-worker-owned' || !(oldHoleRuntime||fourHoleRuntime))) throw err('INVALID_MOUNT','Centered cut requires a pinned OCC runtime');
  if (fourCornerCut && (!centeredCut || !fourHoleRuntime)) throw err('INVALID_MOUNT','Four-corner cut requires its pinned research OCC runtime');
  const manifoldRuntime=JS_SHA==='cd2031fd75cbbc812b550dd228f95b9fd666ae4da6557f840e3d3ed4cbed268b' && WASM_SHA==='7bb5f8ee10fcafdab78799b1e5dd2cdc7c282ea0bf8e7939c43f3ad34b823e3d';
  if(enclosure && !(mesh ? manifoldRuntime&&representation==='manifold-mesh-worker-owned' : fourHoleRuntime&&representation==='occ-brep-worker-owned'))throw err('INVALID_MOUNT','Enclosure requires pinned engine runtime');
  if (![workerUrl,jsPath,wasmPath].every(x=>typeof x==='string'&&x.startsWith('/')&&!x.startsWith('//')) ||
      !Number.isInteger(timeoutMs)||timeoutMs<1||timeoutMs>30000) throw err('INVALID_MOUNT','Expected same-origin paths and bounded timeout');
  const selectedTriangleBudget=selectedProfile?createSelectedResultTriangleBudget():null,maxLifetimeNames=selectedProfile?SELECTED_PROFILE_BUDGET.maxLifetimeNames:8;
  const mountId=crypto.randomUUID(), handles=new Map(), solidRecords=new Map(), portableRecords=new Map(), holeRecords=new Map(), cornerRecords=new Map(), enclosureRecords=new Map(), worker=new Worker(workerUrl);
  let next=0, seq=0, pending=null, state='initializing', readyResolve, readyReject, cleanupFailure=null;
  const descriptor=Object.freeze({contractVersion:1,engine,mountId,generation:1,
    unit:'millimeter',representation, bootstrap:'host-trusted',
    runtimeAssets:Object.freeze({jsSha256:JS_SHA,wasmSha256:WASM_SHA,verification:'worker-sha256'}), maxLifetimeNames, maxPending:1,...(selectedProfile?{maxCumulativeResultTriangles:SELECTED_PROFILE_BUDGET.maxCumulativeResultTriangles,budgetScope:SELECTED_PROFILE_BUDGET.scope}:{}),
    ...(adaptiveMetrology?{nativeMeasurement:Object.freeze({version:1,method:'occ-adaptive-volume-properties',relativeEps:1e-10,onlyClosed:false,skipShared:false})}:{}),
    tolerances:mesh ? 'Manifold defaults; not yet configurable or qualified' : 'OCC interpreter defaults; not yet configurable or qualified',
    operations:Object.freeze([
      ...(profileExtents?[PROFILE_EXTENT_OPERATION]:[]),
      ...(shell?[SHELL_OPERATION]:[]),
      ...(planarAttachments?[Object.freeze({id:'solid.face.frame.read',version:1,input:'owned-source-bound-last-cap-v1',output:'owned-planar-attachment-v1',maxBytes:4096,nativeResultCost:0,qualification:'workflow-unqualified',...(profileExtents?{extentCapVersion:1,extentInput:'owned-source-bound-extent-caps-v1'}:{})})]:[]),
      ...(manufacturingMesh?[Object.freeze({id:'solid.manufacturing.mesh.read',version:1,input:'owned-current-single-solid-controls-v1',output:'owned-manufacturing-mesh-buffer-v1',maxBytes:8388608,maxChunkBytes:65536,maxVertices:150000,maxTriangles:100000,linearDeflectionMm:0.01,angularDeflectionRadians:0.1,relative:false,nativeResultCost:0,scope:'response-local',qualification:'native-component'})]:[]),
      ...(orthographicRead?[Object.freeze({id:'solid.drawing.orthographic.read',version:1,input:'owned-orthographic-frame-mm-v1',output:'orthographic-analytic-buffers-v1',maxFragments:8192,maxNativeJsonBytes:4194304,maxChunkBytes:65536,maxTransferBytes:819200,nativeResultCost:0,scope:'response-local',qualification:'component-research'})]:[]),
      ...(drawingDetails?[Object.freeze({id:'solid.drawing.derived.read',version:1,roles:Object.freeze(['detail',...(drawingSections?['bore-center-section']:[])]),detailNativeResultCost:0,sectionNativeResultCost:drawingSections?2:null,maxViews:6,maxPackedBytes:3426304,scope:'response-local',qualification:'workflow-unqualified'})]:[]),
      ...(drawingReferences?[Object.freeze({id:'solid.drawing.bores.read',version:1,input:'owned-source-datum-bore-query-v1',output:'bounded-bore-facts-v1',maxMembers:16,maxBytes:65536,nativeResultCost:0,scope:'response-local',qualification:'workflow-unqualified'}),Object.freeze({id:'solid.drawing.references.read',version:1,input:'owned-semantic-drawing-definition-v1',output:'bounded-drawing-reference-facts-v1',maxDimensions:16,maxPrimitiveReferences:32,maxAnnotations:16,maxAnnotationReferences:64,maxBytes:65536,nativeResultCost:0,scope:'response-local',qualification:'workflow-unqualified'})]:[]),
      ...(stepExport?[Object.freeze({id:'solid.step.export',version:1,input:'owned-current-solids-v1',output:'step-blob-v1',maxInputs:32,maxBytes:8388608,maxChunkBytes:65536,schema:'AP214IS',structure:'geometric-solid-set',qualification:'native-component'})]:[]),
      Object.freeze({id:'solid.box.create',version:1,input:shell?'oci-authored-box-mm-v1':'oci-box-mm-v1',output:mesh?'manifold-shape-result-v1':'oci-shape-result-v1',qualification:shell||mechanicalBoundRuntime?'workflow-unqualified':'scoped-browser-evidence'}),
      Object.freeze({id:'solid.mesh.read',version:1,input:'owned-solid-mesh-request-v1',output:'owned-solid-mesh-result-v1',qualification:'unqualified',purpose:'display-only'}),
      ...(circularArrangementVersion===1?[Object.freeze({id:'solid.profile.extrude',version:4,input:'two-circle-arrangement-cell-mm-v1',output:'oci-shape-result-v1',circularArrangementVersion:1,maxSourceCircles:2,maxCells:3,sourceBoundaryReferences:'circle-source-span-v1',sourceMutation:'none',qualification:'workflow-unqualified'})]:[]),
      ...(profileSourceBindingVersion===1?[Object.freeze({id:'solid.profile.extrude.bound',version:1,input:'source-bound-selected-profile-mm-v1',output:'oci-shape-result-v1',profileSourceBindingVersion:1,qualification:'workflow-unqualified',...(selectedRegionArrangementVersion===1?{selectedRegionArrangementVersion:1,arrangementScope:'axis-aligned-two-rectangle-cells-v1',sourceBoundaryReferences:'source-span-v1',maxSourceRectangles:2,maxCells:5,sourceMutation:'none'}:{})})]:[]),
      ...(selectedProfile&&profileSourceBindingVersion!==1 ? [Object.freeze({id:'solid.profile.extrude',version:selectedProfileVersion,input:'selected-profile-mm-v'+selectedProfileVersion,output:'oci-shape-result-v1',qualification:'component-research',...(selectedRegionArrangementVersion===1?{selectedRegionArrangementVersion:1,arrangementScope:'axis-aligned-two-rectangle-cells-v1',sourceBoundaryReferences:'source-span-v1',maxSourceRectangles:2,maxCells:5,sourceMutation:'none'}:{})})] : []),
      ...(selectedProfileVersion===3 ? [Object.freeze({id:'solid.topology.read',version:1,scope:'response-local',qualification:'component-research'}),Object.freeze({id:'solid.point.classify',version:1,qualification:'component-research'}),Object.freeze({id:booleanHistory?'solid.selections.read':'solid.prism.selections.read',version:1,...(booleanHistory?{selectionPlanVersion:2}:{}),qualification:'component-research'})] : []),
      ...(loft?[Object.freeze({id:'solid.profile.loft',version:1,input:'solved-sections-mm-v1',output:'oci-shape-result-v1',sections:2,construction:'ruled-solid',sourceQualification:'requires-two-solved-source-bindings',qualification:'component-research'})]:[]),
      ...(sweep?[Object.freeze({id:'solid.profile.sweep',version:1,input:'solved-profile-path-mm-v1',output:'oci-shape-result-v1',qualification:'component-research'})]:[]),
      ...(revolve?[Object.freeze({id:'solid.profile.revolve',version:1,input:'solved-profile-axis-mm-v1',output:'oci-shape-result-v1',sourceQualification:'requires-solved-source-binding',qualification:'component-research'})]:[]),
      ...(blindHoles?[Object.freeze({id:'solid.holes.blind',version:1,kinds:Object.freeze(['centered-blind-flat']),source:'selected-rectangle',entry:'source-last-cap',termination:'flat-bottom',nativeResultCost:2})]:[]),
      ...(counterbores?[Object.freeze({id:'solid.holes.counterbore',version:1,kinds:Object.freeze(['centered-counterbore-flat']),source:'selected-rectangle',entry:'source-last-cap',termination:'small-through-large-interior-step',nativeResultCost:4})]:[]),
      ...(throughHoles?[Object.freeze({id:'solid.holes.through',version:1,kinds:Object.freeze(['centered-through','four-corner-through']),source:'selected-rectangle',termination:'through-all',nativeResultCost:Object.freeze({'centered-through':2,'four-corner-through':8}),qualification:'component-research'})]:[]),
      ...(linearHolePatterns?[Object.freeze({id:'solid.holes.pattern.linear',version:1,axis:'source-local-x-positive',countIncludesSeed:true,executableCounts:Object.freeze({min:2,max:17}),unsupportedCounts:Object.freeze([1]),qualification:'component-research'})]:[]),
      ...(edgeTreatments?[Object.freeze({id:'solid.edge.treat',version:1,kinds:Object.freeze(['fillet','chamfer-equal']),scope:'selected-line-edges-between-planar-faces',qualification:'component-research'})]:[]),
      ...(profile ? [Object.freeze({id:'solid.profile.extrude',version:1,input:'oci-rectangle-profile-v1',output:'oci-profile-result-v1',qualification:'research',researchTopology:Object.freeze({version:1,scope:'mount-lifetime'})})] : []),
      ...(centeredCut ? [Object.freeze({id:'solid.profile.centered-through-hole',version:1,input:'oci-centered-hole-v1',output:'oci-centered-hole-result-v1',qualification:'research'})] : []),
      ...(fourCornerCut ? [Object.freeze({id:'solid.profile.four-corner-through-holes',version:1,input:'oci-four-corner-hole-v1',output:'oci-four-corner-hole-result-v1',qualification:'research'})] : []),
      ...(enclosure ? [Object.freeze({id:'solid.enclosure.interface',version:1,input:mesh?'manifold-enclosure-interface-v1':'oci-enclosure-interface-v1',output:'enclosure-interface-result-v1',qualification:'research'}), Object.freeze({id:'solid.enclosure.manufacturing-mesh',version:1,input:mesh?'manifold-enclosure-manufacturing-v1':'oci-enclosure-manufacturing-v1',output:'enclosure-manufacturing-result-v1',qualification:'research'}), Object.freeze({id:'solid.enclosure.mesh',version:1,input:mesh?'manifold-enclosure-mesh-v1':'oci-enclosure-mesh-v1',output:'oci-enclosure-mesh-result-v1',qualification:'research'}), Object.freeze({id:'solid.enclosure.create',version:1,input:mesh?'manifold-enclosure-v1':'oci-enclosure-v1',output:mesh?'manifold-enclosure-result-v1':'oci-enclosure-result-v1',qualification:'research'}), Object.freeze({id:'solid.enclosure.create',version:2,input:mesh?'manifold-enclosure-v2':'oci-enclosure-v2',output:'enclosure-result-v2',qualification:'research'})] : []),
      ...['common','union','subtract'].map(k=>Object.freeze({id:'solid.boolean.'+k,version:1,input:mesh?'manifold-boolean-mm-v1':booleanHistory?'oci-boolean-history-mm-v1':'oci-boolean-mm-v1',output:mesh?'manifold-shape-result-v1':'oci-shape-result-v1',qualification:mechanicalBoundRuntime?'workflow-unqualified':'scoped-browser-evidence'})),
      Object.freeze({id:'solid.dispose',version:1,input:mesh?'manifold-dispose-v1':'oci-dispose-v1',output:'empty-v1',qualification:mesh?'wrapper-delete-checked':selectedProfile?'native-owned-name-release-v2':'logical-only'})
    ])});
  const ready=new Promise((resolve,reject)=>{readyResolve=resolve;readyReject=reject;});
  ready.catch(()=>{}); // closing before a caller awaits readiness must not leak a rejection
  function removeAbortListener(p) {
    // Mark before invoking caller code: reentrant shutdown must not retry it.
    if(p.listenerDetached)return true;
    p.listenerDetached=true;
    try {p.signal?.removeEventListener('abort',p.abort);return true;}
    catch(cause) {cleanupFailure=cleanupFailure||{cause};return false;}
  }
  function shutdown(code,message,...causes) {
    if (state==='closed') return; const before=state; state='closed';clearTimeout(initTimer);
    // Terminal promise/handle revocation must finish even if native Worker
    // termination throws. Preserve the first exact cause for the resource
    // owner's later explicit close; asynchronous event handlers do not throw.
    try {worker.terminate();} catch(cause) {cleanupFailure=cleanupFailure||{cause};}
    finally {
      handles.clear();solidRecords.clear();portableRecords.clear();holeRecords.clear();cornerRecords.clear();enclosureRecords.clear();selectedTriangleBudget?.close();
      if (before==='initializing') readyReject(err(code,message,...causes));
      if (pending) {
        const p=pending;pending=null;clearTimeout(p.timer);
        removeAbortListener(p);
        p.reject(err(code,message,...causes));
      }
    }
  }
  const initDeadline=performance.now()+timeoutMs;
  const initTimer=setTimeout(()=>shutdown('TIMEOUT','Engine initialization timed out'),timeoutMs);
  worker.onerror=()=>shutdown('ENGINE_FAILURE','Engine worker failed');
  worker.onmessageerror=()=>shutdown('ENGINE_FAILURE','Engine worker message failed');
  worker.onmessage=event=>{
    if(state==='closed')return;
    let msg;try{msg=captureWorkerReplyRecord(event.data);}catch{shutdown('ENGINE_FAILURE','Invalid engine Worker reply fields');return;}
    if(msg.error!==undefined&&typeof msg.error!=='string'){shutdown('ENGINE_FAILURE','Invalid engine Worker error field');return;}
    if (state==='initializing') {
      if (performance.now()>=initDeadline) {shutdown('TIMEOUT','Engine initialization timed out');return;}
      if (msg?.kind==='ready') {clearTimeout(initTimer);state='ready';readyResolve();}
      else {clearTimeout(initTimer);shutdown('ENGINE_FAILURE',String(msg?.error||'Engine initialization failed'));} return;
    }
    // Derive the new substate from the ONE pending job, not another lifetime.
    // This private progress contains bounded binding metadata, never geometry.
    if(msg.kind==='loft-prepared'){
      const p=pending;
      if(!loft||state!=='ready'||!p||p.kind!=='selected-profile-loft'||msg.seq!==p.seq||p.loftBinding||Object.keys(msg).sort().join(',')!=='binding,kind,seq') {shutdown('ENGINE_FAILURE','Unexpected loft preparation');return;}
      let aborted;try{aborted=p.signal?.aborted;}catch(cause){shutdown('ENGINE_FAILURE','Engine cancellation state failed',cause);return;}
      if(performance.now()>=p.deadline||aborted){shutdown(aborted?'CANCELLED':'TIMEOUT','Loft preparation expired');return;}
      try{p.loftBinding=captureLoftBinding(msg.binding,p.loftExpected);}catch{shutdown('ENGINE_FAILURE','Invalid loft preparation binding');return;}
      try{aborted=p.signal?.aborted;}catch(cause){shutdown('ENGINE_FAILURE','Engine cancellation state failed',cause);return;}
      if(performance.now()>=p.deadline||aborted)shutdown(aborted?'CANCELLED':'TIMEOUT','Loft preparation expired');
      return;
    }
    if(msg.kind==='manufacturing-mesh-begun'){
      const p=pending;
      if(!manufacturingMesh||state!=='ready'||!p||p.kind!=='solid-manufacturing-mesh'||msg.seq!==p.seq||p.manufacturingBegan||Object.keys(msg).sort().join(',')!=='kind,op,seq'||msg.op!=='solid.manufacturing.mesh.read'){shutdown('ENGINE_FAILURE','Unexpected manufacturing mesh lease phase');return;}
      let aborted;try{aborted=p.signal?.aborted;}catch(cause){shutdown('ENGINE_FAILURE','Manufacturing cancellation state failed',cause);return;}
      if(state!=='ready'||pending!==p)return;
      if(performance.now()>=p.deadline||aborted){shutdown(aborted?'CANCELLED':'TIMEOUT','Manufacturing mesh expired');return;}
      p.manufacturingBegan=true;return;
    }
    if(msg.kind==='orthographic-read-begun'){
      const p=pending;
      if(!orthographicRead||state!=='ready'||!p||!(p.kind==='solid-orthographic-read'||p.kind==='solid-drawing-derived'&&p.drawingProjection)||msg.seq!==p.seq||p.orthographicBegan||Object.keys(msg).sort().join(',')!=='kind,op,seq'||msg.op!=='solid.drawing.orthographic.read'){shutdown('ENGINE_FAILURE','Unexpected orthographic lease phase');return;}
      let aborted;try{aborted=p.signal?.aborted;}catch(cause){shutdown('ENGINE_FAILURE','Orthographic cancellation state failed',cause);return;}
      if(state!=='ready'||pending!==p)return;
      if(performance.now()>=p.deadline||aborted){shutdown(aborted?'CANCELLED':'TIMEOUT','Orthographic read expired');return;}
      p.orthographicBegan=true;return;
    }
    if(msg.kind==='step-export-begun'){
      const p=pending;
      if(!stepExport||state!=='ready'||!p||p.kind!=='solid-step-export'||msg.seq!==p.seq||p.stepBegan||Object.keys(msg).sort().join(',')!=='kind,op,seq'||msg.op!=='solid.step.export'){shutdown('ENGINE_FAILURE','Unexpected STEP lease phase');return;}
      let aborted;try{aborted=p.signal?.aborted;}catch(cause){shutdown('ENGINE_FAILURE','STEP cancellation state failed',cause);return;}
      if(state!=='ready'||pending!==p)return;
      if(performance.now()>=p.deadline||aborted){shutdown(aborted?'CANCELLED':'TIMEOUT','STEP export expired');return;}
      p.stepBegan=true;return;
    }
    if (state!=='ready'||!pending) return;
    if (!msg || msg.seq!==pending.seq || !['result','step-exported','orthographic-read-result','manufacturing-mesh-result','disposed','error','unsupported','refused'].includes(msg.kind)) {shutdown('ENGINE_FAILURE','Unexpected worker response');return;}
    const p=pending;
    let aborted,cancellationStateFailure;
    try{aborted=p.signal?.aborted;}catch(cause){cancellationStateFailure={cause};}
    // Keep custody while external cleanup runs. It may synchronously cancel or
    // close, in which case shutdown already settled this exact request.
    const listenerRemoved=removeAbortListener(p);
    if(state!=='ready'||pending!==p)return;
    pending=null;clearTimeout(p.timer);
    if(!listenerRemoved||cancellationStateFailure)shutdown('ENGINE_FAILURE','Engine cancellation cleanup failed');
    if (performance.now()>=p.deadline || aborted) {p.reject(err('TIMEOUT','Engine request expired'));shutdown('MOUNT_CLOSED','Engine request expired');return;}
    if (msg.kind==='error') {p.reject(err(profileExtents&&p.kind==='selected-profile-extents'&&['PROFILE_EXTENT_INPUT_CHANGED','ENGINE_CLEANUP_FAILED'].includes(msg.code)?msg.code:counterbores&&p.kind==='solid-counterbore'&&msg.code==='ENGINE_CLEANUP_FAILED'?msg.code:drawingDetails&&p.kind==='solid-drawing-derived'&&msg.code==='ENGINE_CLEANUP_FAILED'?'ENGINE_CLEANUP_FAILED':blindHoles&&p.kind==='solid-blind-hole'&&msg.code==='ENGINE_CLEANUP_FAILED'?msg.code:manufacturingMesh&&p.kind==='solid-manufacturing-mesh'&&(manufacturingNativeCodes.includes(msg.code)||msg.code==='ENGINE_CLEANUP_FAILED')?msg.code:orthographicRead&&p.kind==='solid-orthographic-read'&&(orthographicNativeCodes.includes(msg.code)||msg.code==='ENGINE_CLEANUP_FAILED')?msg.code:stepExport&&p.kind==='solid-step-export'&&(stepNativeCodes.includes(msg.code)||msg.code==='ENGINE_CLEANUP_FAILED')?msg.code:circularArrangementVersion===1&&p.kind==='selected-profile-extrude'&&(circularNativeCodes.includes(msg.code)||msg.code==='ENGINE_CLEANUP_FAILED')?msg.code:msg.code==='MEASUREMENT_PRECISION_UNRESOLVED'?'MEASUREMENT_PRECISION_UNRESOLVED':msg.code==='MESH_VOLUME_NUMERIC_RANGE'?'MESH_VOLUME_NUMERIC_RANGE':loft&&p.kind==='selected-profile-loft'&&msg.code==='LOFT_INPUT_CHANGED'?'LOFT_INPUT_CHANGED':'ENGINE_FAILURE',String(msg.error)));shutdown('MOUNT_CLOSED','Engine job failed');return;}
    if (msg.kind==='refused') {
      const allowed=['INVALID_REQUEST','UNSUPPORTED_ENGINE','INVALID_FRAME','UNSUPPORTED_FRAME','STALE_SKETCH','INVALID_SKETCH','UNSUPPORTED_SKETCH','UNSUPPORTED_CONSTRAINT','STALE_FRAME','UNSUPPORTED_PROFILE','OPEN_OR_AMBIGUOUS_PROFILE','INVALID_PROFILE','STALE_REGION',...(selectedProfileVersion===3?['PROFILE_BELOW_RESOLUTION','UNSUPPORTED_REGION_TOPOLOGY','ZERO_LENGTH_EDGE','OVERLAPPING_EDGES','SELF_INTERSECTION','SELF_TOUCHING_BOUNDARY','ZERO_AREA_PROFILE','UNREPRESENTABLE_AREA']:[])];
      const extentRefused=profileExtents&&p.kind==='selected-profile-extents'&&PROFILE_EXTENT_REFUSALS.includes(msg.code);
      if(extentRefused&&(Object.keys(msg).sort().join(',')!=='code,error,kind,seq'||typeof msg.error!=='string'||msg.error.length>512)){p.reject(err('ENGINE_FAILURE','Malformed profile-extent refusal'));shutdown('MOUNT_CLOSED','Malformed profile-extent refusal');return;}
      const boundRefused=profileSourceBindingVersion===1&&p.kind==='selected-profile-bound'&&[...allowed,'RESOURCE_LIMIT'].includes(msg.code);
      if(boundRefused&&(Object.keys(msg).sort().join(',')!=='code,error,kind,seq'||typeof msg.error!=='string'||msg.error.length>512)){p.reject(err('ENGINE_FAILURE','Malformed bound constructor refusal'));shutdown('MOUNT_CLOSED','Malformed bound constructor refusal');return;}
      const derivedRefused=drawingDetails&&p.kind==='solid-drawing-derived'&&[...DRAWING_DERIVED_REFUSALS,...orthographicRefusalCodes].includes(msg.code);
      if(derivedRefused&&(Object.keys(msg).sort().join(',')!=='code,error,kind,seq'||typeof msg.error!=='string'||msg.error.length>512)){p.reject(err('ENGINE_FAILURE','Malformed derived drawing refusal'));shutdown('MOUNT_CLOSED','Malformed derived drawing refusal');return;}
      const circularRefused=circularArrangementVersion===1&&p.kind==='selected-profile-extrude'&&circularNativeCodes.includes(msg.code)&&!['CIRCULAR_INPUT_CHANGED','CIRCULAR_PUBLICATION_FAILED','MEASUREMENT_PRECISION_UNRESOLVED'].includes(msg.code);
      if(circularRefused&&(Object.keys(msg).sort().join(',')!=='code,error,kind,seq'||typeof msg.error!=='string'||msg.error.length>512)){p.reject(err('ENGINE_FAILURE','Malformed circular refusal'));shutdown('MOUNT_CLOSED','Malformed circular refusal');return;}
      let loftRefused=false;
      if(loft&&p.kind==='selected-profile-loft'){
        const phase=p.loftBinding?'native':'preparation',codes=phase==='native'?[...loftNativeCodes,'RESOURCE_LIMIT']:[...allowed,...loftPreparationCodes,'RESOURCE_LIMIT'];
        if(Object.keys(msg).sort().join(',')!=='code,error,kind,phase,seq'||msg.phase!==phase||typeof msg.error!=='string'||msg.error.length>512||!codes.includes(msg.code)){p.reject(err('ENGINE_FAILURE','Invalid loft refusal phase/code'));shutdown('MOUNT_CLOSED','Invalid loft refusal');return;}
        loftRefused=true;
      }
      if(stepExport&&p.kind==='solid-step-export'&&(Object.keys(msg).sort().join(',')!=='code,error,kind,seq'||typeof msg.error!=='string'||msg.error.length>512)){p.reject(err('ENGINE_FAILURE','Invalid STEP refusal'));shutdown('MOUNT_CLOSED','Invalid STEP refusal');return;}
      const stepRefused=stepExport&&p.kind==='solid-step-export'&&stepRefusalCodes.includes(msg.code);
      if(orthographicRead&&p.kind==='solid-orthographic-read'&&(Object.keys(msg).sort().join(',')!=='code,error,kind,seq'||typeof msg.error!=='string'||msg.error.length>512)){p.reject(err('ENGINE_FAILURE','Invalid orthographic refusal'));shutdown('MOUNT_CLOSED','Invalid orthographic refusal');return;}
      const orthographicRefused=orthographicRead&&p.kind==='solid-orthographic-read'&&orthographicRefusalCodes.includes(msg.code);
      if(manufacturingMesh&&p.kind==='solid-manufacturing-mesh'&&(Object.keys(msg).sort().join(',')!=='code,error,kind,seq'||typeof msg.error!=='string'||msg.error.length>512)){p.reject(err('ENGINE_FAILURE','Invalid manufacturing refusal'));shutdown('MOUNT_CLOSED','Invalid manufacturing refusal');return;}
      const manufacturingRefused=manufacturingMesh&&p.kind==='solid-manufacturing-mesh'&&manufacturingRefusalCodes.includes(msg.code);
      const planarRefused=planarAttachments&&p.kind==='solid-face-frame'&&['UNRESOLVED_SOURCE','UNSUPPORTED_FRAME_PARENT','INVALID_FRAME_DEPENDENCY','STALE_FRAME','RESOURCE_LIMIT'].includes(msg.code);
      if(planarRefused&&(Object.keys(msg).sort().join(',')!=='code,error,kind,reason,seq'||!planarAttachmentReasons.includes(msg.reason)||typeof msg.error!=='string'||msg.error.length>512)){p.reject(err('ENGINE_FAILURE','Malformed attachment refusal'));shutdown('MOUNT_CLOSED','Malformed attachment refusal');return;}
      const shellRefused=shell&&(p.kind==='solid-shell'&&SHELL_REFUSALS.includes(msg.code)||p.kind==='box'&&[...BOX_CONSTRUCTION_REFUSALS,'RESOURCE_LIMIT','INVALID_REQUEST'].includes(msg.code));
      if(shellRefused&&(Object.keys(msg).sort().join(',')!=='code,error,kind,seq'||typeof msg.error!=='string'||msg.error.length>512)){p.reject(err('ENGINE_FAILURE','Malformed shell refusal'));shutdown('MOUNT_CLOSED','Malformed shell refusal');return;}
      const sweepRefused=sweep&&p.kind==='selected-profile-sweep'&&[...allowed,'RESOURCE_LIMIT',...SWEEP_PREPARATION_REFUSALS,...SWEEP_NATIVE_REFUSALS].includes(msg.code);
      const revolveRefused=revolve&&p.kind==='selected-profile-revolve'&&[...allowed,'RESOURCE_LIMIT','REVOLVE_INVALID_REQUEST','REVOLVE_INVALID_PROFILE','REVOLVE_INVALID_AXIS','REVOLVE_AXIS_NOT_COPLANAR','REVOLVE_PROFILE_CROSSES_AXIS','REVOLVE_INVALID_ANGLE','REVOLVE_UNSUPPORTED_PROFILE','REVOLVE_FAILED','REVOLVE_INVALID_RESULT','REVOLVE_RESOURCE_LIMIT'].includes(msg.code);
      const cornerAllowed=['INVALID_REQUEST','STALE_SOURCE','UNSUPPORTED_PROFILE','HOLES_OVERLAP','HOLE_OUTSIDE_PROFILE','ENGINE_CAPABILITY_UNAVAILABLE'];
      const holeAllowed=['INVALID_REQUEST','STALE_SOURCE','UNSUPPORTED_PROFILE','HOLE_OUTSIDE_PROFILE','ENGINE_CAPABILITY_UNAVAILABLE'];
      const edgeAllowed=['EDGE_TREATMENT_INVALID_REQUEST','EDGE_TREATMENT_INVALID_INPUT','EDGE_TREATMENT_UNSUPPORTED','EDGE_TREATMENT_FAILED','EDGE_TREATMENT_INVALID_RESULT','EDGE_TREATMENT_RESOURCE_LIMIT','UNRESOLVED_SELECTION','INVALID_SELECTION_BINDING','SELECTION_UNAVAILABLE','RESOURCE_LIMIT'];
      const edgeRefused=edgeTreatments&&(p.kind==='solid-edge-treatment'&&edgeAllowed.includes(msg.code)||['solid-prism-selections','solid-selections'].includes(p.kind)&&msg.code==='INVALID_SELECTION_BINDING');
      const booleanRefused=booleanHistory&&['common','union','subtract'].includes(p.kind)&&['BOOLEAN_INVALID_REQUEST','BOOLEAN_INVALID_INPUT','BOOLEAN_NON_SOLID_INPUT','BOOLEAN_NON_SOLID_RESULT','BOOLEAN_FAILED','BOOLEAN_INVALID_RESULT','BOOLEAN_RESOURCE_LIMIT','BOOLEAN_COPY_FAILED','INVALID_SELECTION_BINDING','SELECTION_UNAVAILABLE'].includes(msg.code);
      const patternRefused=linearHolePatterns&&p.kind==='solid-linear-hole-pattern'&&['INVALID_REQUEST','UNSUPPORTED_IDENTITY_OPERATION','UNSUPPORTED_SEED','UNSUPPORTED_TARGET_PATH','STALE_SOURCE','PATTERN_OVERLAP','PATTERN_OUTSIDE_PROFILE','PATTERN_DOMAIN','UNSUPPORTED_PROFILE','HOLE_OUTSIDE_PROFILE','HOLES_OVERLAP','UNSUPPORTED_TARGET','TOOL_DOMAIN','SELECTION_UNAVAILABLE','INVALID_SELECTION_BINDING','SELECTION_RESOURCE_LIMIT','RESOURCE_LIMIT','BOOLEAN_INVALID_REQUEST','BOOLEAN_INVALID_INPUT','BOOLEAN_NON_SOLID_INPUT','BOOLEAN_NON_SOLID_RESULT','BOOLEAN_FAILED','BOOLEAN_INVALID_RESULT','BOOLEAN_RESOURCE_LIMIT','BOOLEAN_COPY_FAILED'].includes(msg.code);
      const blindRefused=blindHoles&&p.kind==='solid-blind-hole'&&[...BLIND_HOLE_CODES,'BOOLEAN_INVALID_REQUEST','BOOLEAN_INVALID_INPUT','BOOLEAN_NON_SOLID_INPUT','BOOLEAN_NON_SOLID_RESULT','BOOLEAN_FAILED','BOOLEAN_INVALID_RESULT','BOOLEAN_RESOURCE_LIMIT','BOOLEAN_COPY_FAILED'].includes(msg.code);
      const counterboreRefused=counterbores&&p.kind==='solid-counterbore'&&[...COUNTERBORE_CODES,'BOOLEAN_INVALID_REQUEST','BOOLEAN_INVALID_INPUT','BOOLEAN_NON_SOLID_INPUT','BOOLEAN_NON_SOLID_RESULT','BOOLEAN_FAILED','BOOLEAN_INVALID_RESULT','BOOLEAN_RESOURCE_LIMIT','BOOLEAN_COPY_FAILED'].includes(msg.code);
      const throughRefused=throughHoles&&p.kind==='solid-through-holes'&&['INVALID_REQUEST','STALE_SOURCE','UNSUPPORTED_PROFILE','HOLE_OUTSIDE_PROFILE','HOLES_OVERLAP','UNSUPPORTED_TARGET','TOOL_DOMAIN','SELECTION_UNAVAILABLE','INVALID_SELECTION_BINDING','SELECTION_RESOURCE_LIMIT','RESOURCE_LIMIT','BOOLEAN_INVALID_REQUEST','BOOLEAN_INVALID_INPUT','BOOLEAN_NON_SOLID_INPUT','BOOLEAN_NON_SOLID_RESULT','BOOLEAN_FAILED','BOOLEAN_INVALID_RESULT','BOOLEAN_RESOURCE_LIMIT','BOOLEAN_COPY_FAILED'].includes(msg.code);
      if (!(profile||selectedProfile) || !(boundRefused||extentRefused||derivedRefused||circularRefused||planarRefused||shellRefused||manufacturingRefused||orthographicRefused||stepRefused||loftRefused||sweepRefused||revolveRefused||patternRefused||counterboreRefused||blindRefused||throughRefused||booleanRefused||edgeRefused||(selectedProfile&&msg.code==='RESOURCE_LIMIT'&&['selected-profile-extrude','box','common','union','subtract'].includes(p.kind))||(p.kind==='selected-profile-extrude'&&selectedProfile&&allowed.includes(msg.code))||(p.kind==='profile-extrude'&&allowed.includes(msg.code))||(p.kind==='research-centered-cut'&&holeAllowed.includes(msg.code))||(p.kind==='research-four-corner-cut'&&cornerAllowed.includes(msg.code)))) {p.reject(err('ENGINE_FAILURE','Invalid profile refusal'));shutdown('MOUNT_CLOSED','Invalid refusal');return;}
      if(planarRefused){p.reject(Object.assign(err(msg.code,msg.error),{attachmentReason:msg.reason}));return;}
      p.reject(err(msg.code,boundRefused||extentRefused||derivedRefused||circularRefused||planarRefused||shellRefused||manufacturingRefused||orthographicRefused||stepRefused||loftRefused||sweepRefused||revolveRefused||patternRefused||counterboreRefused||blindRefused||throughRefused||edgeRefused||booleanRefused?String(msg.error||'Edge treatment was refused').slice(0,512):p.kind==='selected-profile-extrude'||selectedProfile&&msg.code==='RESOURCE_LIMIT'?String(msg.error||'Selected-profile request was refused').slice(0,512):'Profile request was refused'));return;
    }
    if (msg.kind==='unsupported') {
      if (mesh || p.expected!=='result' || msg.code!=='EMPTY_OR_NON_SOLID_UNSUPPORTED') {p.reject(err('ENGINE_FAILURE','Invalid refusal'));shutdown('MOUNT_CLOSED','Invalid refusal');return;}
      p.reject(err('EMPTY_OR_NON_SOLID_UNSUPPORTED','OCC returned no faces; this mount does not support empty or non-solid results'));return;
    }
    if (msg.kind!==p.expected) {p.reject(err('ENGINE_FAILURE','Unexpected engine response'));shutdown('MOUNT_CLOSED','Engine job failed');return;}
    if ((mesh||selectedProfile) && p.expected==='disposed' && msg.released!==true) {p.reject(err('ENGINE_FAILURE',mesh?'Manifold disposal was not confirmed':'Native OCC name release was not confirmed'));shutdown('MOUNT_CLOSED',mesh?'Manifold disposal failed':'Native OCC disposal failed');return;}
    if(!listenerRemoved||cancellationStateFailure){p.reject(err('ENGINE_FAILURE','Engine cancellation cleanup failed',(cancellationStateFailure||cleanupFailure).cause));return;}
    if(p.kind==='solid-manufacturing-mesh'&&!p.manufacturingBegan){p.reject(err('ENGINE_FAILURE','Missing manufacturing lease phase'));shutdown('MOUNT_CLOSED','Missing manufacturing lease phase');return;}
    if(p.kind==='solid-orthographic-read'&&!p.orthographicBegan){p.reject(err('ENGINE_FAILURE','Missing orthographic lease phase'));shutdown('MOUNT_CLOSED','Missing orthographic lease phase');return;}
    if(p.kind==='solid-drawing-derived'&&p.drawingProjection&&!p.orthographicBegan){p.reject(err('ENGINE_FAILURE','Missing detail parent projection lease phase'));shutdown('MOUNT_CLOSED','Missing detail parent projection lease phase');return;}
    if(p.kind==='solid-step-export'&&!p.stepBegan){p.reject(err('ENGINE_FAILURE','Missing STEP lease phase'));shutdown('MOUNT_CLOSED','Missing STEP lease phase');return;}
    if(p.kind==='selected-profile-loft'){
      if(!p.loftBinding){p.reject(err('ENGINE_FAILURE','Missing loft preparation binding'));shutdown('MOUNT_CLOSED','Missing loft preparation');return;}
      p.resolve({response:msg,progressBinding:p.loftBinding});
    }else p.resolve(msg);
  };
  try {worker.postMessage({kind:'init',...(selectedProfile?{nativeOwnership:2,...(selectedProfileVersion===3?{selectedProfileVersion:3}:{})}:{}),...(profileSourceBindingVersion===1?{profileSourceBindingVersion:1}:{}),...(edgeTreatments?{edgeTreatments:1}:{}),...(booleanHistory?{booleanHistory:1}:{}),...(throughHoles?{throughHoles:1}:{}),...(blindHoles?{blindHoles:1}:{}),...(counterbores?{counterbores:1}:{}),...(profileExtents?{profileExtents:1}:{}),...(linearHolePatterns?{linearHolePatterns:1}:{}),...(revolve?{revolve:1}:{}),...(sweep?{sweep:1}:{}),...(loft?{loft:1}:{}),...(adaptiveMetrology?{adaptiveMetrology:1}:{}),...(stepExport?{stepExport:1}:{}),...(orthographicRead?{orthographicRead:1}:{}),...(drawingReferences?{drawingReferences:1}:{}),...(manufacturingMesh?{manufacturingMesh:1}:{}),...(shell?{shell:1}:{}),...(circularArrangementVersion===1?{circularArrangementVersion:1}:{}),...(planarAttachments?{planarAttachments:1}:{}),manifest:{version:1,js:{path:jsPath,sha256:JS_SHA},wasm:{path:wasmPath,sha256:WASM_SHA}}});}catch(cause){shutdown('ENGINE_FAILURE','Engine initialization transport failed',cause);}
  function owned(h) {
    if (!h || Object.keys(h).sort().join(',')!=='generation,id,mountId,representation' || h.mountId!==mountId || h.generation!==1 ||
        h.representation!==representation || !handles.has(h.id)) throw err('INVALID_HANDLE','Handle not owned by this mount');
    return handles.get(h.id);
  }
  function validOptions(options, allowTopology=false) {
    if (!options || typeof options!=='object' || Reflect.ownKeys(options).some(k=>k!=='signal' && !(allowTopology&&k==='researchTopology')) ||
        (options.signal!==undefined && (options.signal===null || typeof options.signal.aborted!=='boolean' || typeof options.signal.addEventListener!=='function' || typeof options.signal.removeEventListener!=='function')))
      throw err('INVALID_REQUEST','Invalid request options');
    if(Object.hasOwn(options,'researchTopology')){const d=Object.getOwnPropertyDescriptor(options,'researchTopology'),v=d?.value;if(!allowTopology||!d?.enumerable||!Object.hasOwn(d,'value')||!v||typeof v!=='object'||Array.isArray(v)||Reflect.ownKeys(v).join(',')!=='version'||!Object.getOwnPropertyDescriptor(v,'version')?.enumerable||!Object.hasOwn(Object.getOwnPropertyDescriptor(v,'version'),'value')||v.version!==1)throw err('INVALID_REQUEST','Invalid research topology request');return true;}return false;
  }
  const finite3 = value => Array.isArray(value) && value.length===3 && [0,1,2].every(i => Object.hasOwn(value,i) && Number.isFinite(value[i]));
  const dense = (value, length) => Array.isArray(value) && value.length===length && Array.from({length},(_,i)=>i).every(i=>Object.hasOwn(value,i));
  async function send(message, expected, signal, loftExpected) {
    if (signal?.aborted) throw err('CANCELLED','Engine request cancelled');
    if (state==='initializing') throw err('NOT_READY','Await mount readiness before submitting work');
    if (state!=='ready') throw err('MOUNT_CLOSED','Engine mount is closed');
    if (pending) throw err('BUSY','One Engine operation may run at a time');
    if (signal?.aborted) throw err('CANCELLED','Engine request cancelled');
    return new Promise((resolve,reject)=>{
      const s=++seq, deadline=performance.now()+timeoutMs;
      const abort=()=>shutdown('CANCELLED','Engine request cancelled');
      const timer=setTimeout(()=>shutdown('TIMEOUT','Engine request timed out'),timeoutMs);
      pending={seq:s,resolve,reject,signal,abort,timer,deadline,expected,kind:message.kind,loftExpected,drawingProjection:message.kind==='solid-drawing-derived'&&message.parentFrame!==null};
      const p=pending;
      try {
        signal?.addEventListener('abort',abort,{once:true});
        // Registration is caller code; synchronous abort/close must prevent a
        // post to an already retired Worker. Also cover abort without dispatch.
        if(state!=='ready'||pending!==p)return;
        if(signal?.aborted){shutdown('CANCELLED','Engine request cancelled');return;}
      }catch(cause){shutdown('ENGINE_FAILURE','Engine cancellation registration failed',cause);return;}
      try {worker.postMessage({...message,seq:s});} catch(cause) {shutdown('ENGINE_FAILURE','Engine request transport failed',cause);}
    });
  }
  function makeHandle(token) {if(state!=='ready') throw err('MOUNT_CLOSED','Engine mount is closed');const id=crypto.randomUUID();handles.set(id,token);return {mountId,generation:1,representation,id};}
  function reserve(cost=1) {
    if(state==='initializing') throw err('NOT_READY','Await mount readiness before submitting work');
    if(state!=='ready') throw err('MOUNT_CLOSED','Engine mount is closed');
    if(pending) throw err('BUSY','One Engine operation may run at a time');
    if(!Number.isSafeInteger(cost)||cost<1||cost>maxLifetimeNames)throw err('INVALID_REQUEST','Invalid native result reservation');
    if(cost>maxLifetimeNames-next) throw err('RESOURCE_LIMIT','Engine mount lifetime shape budget exhausted');
    next+=cost;return String(next);
  }
  function checkEvidence(v) {
    try{v=captureWorkerMetadata(v);}catch{shutdown('ENGINE_FAILURE','Invalid native evidence fields');throw err('ENGINE_FAILURE','Invalid native evidence fields');}
    if (mesh) {
      if (!v || typeof v.empty!=='boolean' || !Number.isSafeInteger(v.triangles) || v.triangles<0 || v.triangles>100000 ||
          !Number.isSafeInteger(v.vertices) || v.vertices<0 || v.vertices>100000 || !Number.isSafeInteger(v.components) || v.components<0 || v.components>1000 ||
          !Number.isFinite(v.volume) || v.volume<0 ||
          (v.empty ? v.triangles!==0 || v.vertices!==0 || v.components!==0 || v.volume!==0 || v.bounds!==null :
            v.triangles<1 || v.vertices<1 || v.components<1 || ![v.bounds?.min,v.bounds?.max].every(finite3) || v.bounds.min.some((n,i)=>n>v.bounds.max[i]))) {
        shutdown('ENGINE_FAILURE','Invalid Manifold evidence');throw err('ENGINE_FAILURE','Invalid Manifold evidence');
      }
      if(Object.hasOwn(v,'resultKind')&&(v.resultKind!==(v.empty?'empty':'mesh-container')||v.nativeStatus!=='NoError'||v.meshComponents!==v.components||v.nativeValidity!==null||v.solidCount!==null||v.materialRegions!==null||v.voidRegions!==null||v.validLevel0!==null||v.validLevel2!==null||v.manifoldPredicate!==null||v.volumeQuality!=='mesh-kernel-volume')){shutdown('ENGINE_FAILURE','Invalid Manifold classification');throw err('ENGINE_FAILURE','Invalid Manifold classification');}
      return v;
    }
    const empty=v?.empty===true;
    if (!v || !Number.isSafeInteger(v.faces) || v.faces<(empty?0:1) || v.faces>1000 || !Number.isSafeInteger(v.triangles) || v.triangles<(empty?0:1) || v.triangles>100000 ||
        !Number.isFinite(v.signedVolume) || (empty ? v.faces!==0||v.triangles!==0||v.signedVolume!==0||v.bounds!==null||v.solidCount!==0||v.nativeValidity?.valid!==true : ![v.bounds?.min,v.bounds?.max].every(finite3) || v.bounds.min.some((n,i)=>n>v.bounds.max[i])))
      {shutdown('ENGINE_FAILURE','Invalid OCC evidence');throw err('ENGINE_FAILURE','Invalid OCC evidence');}
    if(Object.hasOwn(v,'resultKind')){
      const count=v.solidCount,kind=empty?'empty':count===null?'unclassified-nonempty':count===1?'single-solid':'multi-solid';
      if(v.resultKind!==kind||typeof v.empty!=='boolean'||!(count===null||Number.isSafeInteger(count)&&count>=(empty?0:1))||(count===null?v.nativeValidity!==null:!['occ-inspect-analytic-v1','occ-owned-solid-v2'].includes(v.nativeValidity?.method)||v.nativeValidity.valid!==true)||v.materialRegions!==null||v.voidRegions!==null||v.validLevel0!==null||v.validLevel2!==null||v.manifoldPredicate!==null||v.volumeQuality!=='tessellation-signed-integral'){shutdown('ENGINE_FAILURE','Invalid OCC classification');throw err('ENGINE_FAILURE','Invalid OCC classification');}
    }else if(empty){shutdown('ENGINE_FAILURE','Unclassified OCC empty result');throw err('ENGINE_FAILURE','Unclassified OCC empty result');}
    if(empty){const c=v.nativeTopology;if(!c||c.version!==1||c.method!=='occ-topology-census-v1'||c.shapeType!==0||c.directChildren!==0||!c.counts||['solids','compsolids','shells','faces','wires','edges','vertices'].some(k=>c.counts[k]!==0)){shutdown('ENGINE_FAILURE','Unverified OCC empty topology');throw err('ENGINE_FAILURE','Unverified OCC empty topology');}}
    return v;
  }
  async function extrudeProfileExtents(value,options={}) {
    if(!profileExtents)throw err('UNSUPPORTED_OPERATION','Profile extents are not installed for this exact runtime');
    const getAbort=Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get,addAbort=EventTarget.prototype.addEventListener,removeAbort=EventTarget.prototype.removeEventListener;
    if(!options||typeof options!=='object'||Array.isArray(options)||![null,Object.prototype].includes(Object.getPrototypeOf(options))||Reflect.ownKeys(options).some(key=>key!=='signal'))throw err('INVALID_REQUEST','Invalid extent options');
    const signalField=Object.getOwnPropertyDescriptor(options,'signal');
    if(signalField&&(!signalField.enumerable||!Object.hasOwn(signalField,'value')))throw err('INVALID_REQUEST','Extent options must be own data');
    const originalSignal=signalField?.value;
    if(originalSignal!==undefined)try{if(getAbort.call(originalSignal))throw err('CANCELLED','Extent request cancelled');}catch(cause){if(cause?.code==='CANCELLED')throw cause;throw err('INVALID_REQUEST','Expected a genuine AbortSignal',cause);}
    let raw,captured;
    try{raw=captureWorkerReplyRecord(value);if(Object.keys(raw).sort().join(',')!=='extentBinding,op,request,unit,version'||raw.op!=='solid.profile.extrude.extents'||raw.version!==1||raw.unit!=='millimeter')throw Error('Invalid extent request envelope');const request=captureProfileExtentIntent(raw.request);captured=captureProfileExtentEvaluation({version:1,unit:'millimeter',engine:'occ',engineRevision:`sha256:${JS_SHA}:${WASM_SHA}`,featureId:request.source.featureId,profileExtent:request,extentBinding:raw.extentBinding});}catch(cause){throw err('INVALID_REQUEST','Expected a captured original-source extent request',cause);}
    // The legacy send protocol receives only our private signal. Every access
    // and listener operation on a caller signal uses the actual intrinsics.
    const cancellation=new AbortController(),abort=()=>cancellation.abort();let listening=false,failure=null;
    try{
      if(originalSignal!==undefined){listening=true;addAbort.call(originalSignal,'abort',abort,{once:true});if(getAbort.call(originalSignal))abort();}
      if(getAbort.call(cancellation.signal))throw err('CANCELLED','Extent request cancelled');
      const token=reserve(),response=await send({kind:'selected-profile-extents',token,request:captured.profileExtent,expectedBinding:captured.extentBinding},'result',cancellation.signal);
      if(getAbort.call(cancellation.signal))throw err('CANCELLED','Extent request cancelled');
      let evidence;
      try{
        if(Reflect.ownKeys(response).sort().join(',')!=='evidence,extentBinding,kind,seq'||!sameProfileExtentBinding(response.extentBinding,captured.extentBinding))throw Error('Extent result changed its complete source/construction binding');
        evidence=checkEvidence(response.evidence);
        if(Reflect.ownKeys(evidence).sort().join(',')!==['nativeVolume','nativeBounds','faces','triangles','bounds','signedVolume','empty','resultKind','solidCount','nativeValidity','nativeTopology','materialRegions','voidRegions','validLevel0','validLevel2','manifoldPredicate','volumeQuality'].sort().join(',')||evidence.empty!==false||evidence.resultKind!=='single-solid'||evidence.solidCount!==1||evidence.nativeValidity?.valid!==true||!Number.isFinite(evidence.nativeVolume)||evidence.nativeVolume<=0||!['min','max'].every(key=>finite3(evidence.nativeBounds?.[key])))throw Error('Extent result is not one actual valid positive Native solid');
      }catch(cause){shutdown('ENGINE_FAILURE','Invalid source-bound extent result',cause);throw err('ENGINE_FAILURE','Invalid source-bound extent result',cause);}
      return solidResult('solid.profile.extrude.extents',token,evidence);
    }catch(cause){failure={cause};throw cause;}
    finally{
      if(listening)try{removeAbort.call(originalSignal,'abort',abort);}catch(cause){shutdown('ENGINE_CLEANUP_FAILED','Extent cancellation cleanup failed',cause);const cleanup=err('ENGINE_CLEANUP_FAILED','Extent cancellation cleanup failed',cause);if(failure!==null)Object.defineProperty(cleanup,'operationError',{value:failure.cause});throw cleanup;}
    }
  }
  async function extrudeSelectedProfile(request,options={},constructor=null) {
    validOptions(options);if(!selectedProfile)throw err('UNSUPPORTED_OPERATION','Selected-profile extrusion is not bound by this mount');
    if(profileSourceBindingVersion===1?!constructor:constructor!==null)throw err('INVALID_REQUEST','Use the actual constructor-time source binding for this cohort.');
    let copied;try{const version=Object.getOwnPropertyDescriptor(request||{},'version');if(version?.value===4){if(circularArrangementVersion!==1)throw err('UNSUPPORTED_PROFILE','Circular cells require their explicit runtime');copied=captureCircularCellRequest(request);}else copied=captureSelectedProfile(request);}catch(e){throw err(e.code||'INVALID_REQUEST',e.message);}
    if(copied.region.boundaryProvenance&&selectedRegionArrangementVersion!==1)throw err('UNSUPPORTED_PROFILE','Arrangement cells require the complete recorded arrangement/selection-plan-v2 runtime');
    if(options.signal?.aborted)throw err('CANCELLED','Engine request cancelled');
    const token=reserve(),response=await send(constructor?{kind:'selected-profile-bound',token,request:{...constructor,request:copied}}:{kind:'selected-profile-extrude',token,request:copied},'result',options.signal);
    let binding;try{binding=captureWorkerReplyRecord(response.binding);}catch{shutdown('ENGINE_FAILURE','Invalid selected-profile binding');throw err('ENGINE_FAILURE','Invalid selected-profile binding');}
    const v=checkEvidence(response.evidence),keys=['nativeVolume','nativeBounds','faces','triangles','bounds','signedVolume','empty','resultKind','solidCount','nativeValidity','nativeTopology','materialRegions','voidRegions','validLevel0','validLevel2','manifoldPredicate','volumeQuality'].sort().join(',');
    const responseKeys=constructor?'binding,constructionProvenance,evidence,kind,seq,sourceCreationBinding':selectedProfileVersion===3?'binding,constructionProvenance,evidence,kind,seq':'binding,evidence,kind,seq',bindingKeys=selectedProfileVersion===3?'profileVersion,regionId,unit':'regionId,unit';
    if(Reflect.ownKeys(response).sort().join(',')!==responseKeys||!v||Reflect.ownKeys(v).sort().join(',')!==keys||Reflect.ownKeys(binding).sort().join(',')!==bindingKeys||selectedProfileVersion===3&&binding.profileVersion!==copied.version||!Number.isFinite(v.nativeVolume)||v.nativeVolume<=0||v.solidCount!==1||v.nativeValidity?.valid!==true||!['min','max'].every(k=>finite3(v.nativeBounds?.[k]))||v.nativeBounds.min.some((n,i)=>n>v.nativeBounds.max[i])||binding.regionId!==copied.region.id||binding.unit!=='millimeter') {shutdown('ENGINE_FAILURE','Invalid selected-profile evidence');throw err('ENGINE_FAILURE','Invalid selected-profile evidence');}
    let sourceCreationBinding=null;if(constructor){try{sourceCreationBinding=captureProfileConstructorBinding(response.sourceCreationBinding);if(!sameProfileConstructorBinding(sourceCreationBinding,constructor.sourceCreationBinding))throw Error('Constructor source mismatch');}catch(cause){shutdown('ENGINE_FAILURE','Invalid actual constructor source binding',cause);throw err('ENGINE_FAILURE','Invalid actual constructor source binding',cause);}}
    const result=solidResult(constructor?'solid.profile.extrude.bound':'solid.profile.extrude',token,v,sourceCreationBinding);
    if(selectedProfileVersion===3){
      const p=response.constructionProvenance;
      if(copied.version===4){try{result.constructionProvenance=captureCircularConstructionCertificate(p,copied);}catch(cause){shutdown('ENGINE_FAILURE','Invalid circular constructor certificate',cause);throw err('ENGINE_FAILURE','Invalid circular constructor certificate',cause);}return result;}
      const boundaryKind=p?.status==='available'?Object.getOwnPropertyDescriptor(p.sourceBinding||{},'boundaryKind'):undefined;
      if(p?.status==='available'&&(copied.region.boundaryProvenance?(!boundaryKind?.enumerable||!Object.hasOwn(boundaryKind,'value')||boundaryKind.value!=='source-spans'):boundaryKind!==undefined)){shutdown('ENGINE_FAILURE','Construction source-boundary kind changed');throw err('ENGINE_FAILURE','Construction source-boundary kind changed');}
      if(!p||!(p.status==='available'&&p.data?.scope==='response-local'&&p.data.persistentIds===false&&p.sourceBinding?.scope==='solved-request'&&p.sourceBinding.regionId===copied.region.id||p.status==='unavailable'&&['PROFILE_PROVENANCE_UNSUPPORTED','PROFILE_PROVENANCE_RESOURCE_LIMIT','PROFILE_PROVENANCE_FAILED'].includes(p.reason))){shutdown('ENGINE_FAILURE','Invalid construction provenance binding');throw err('ENGINE_FAILURE','Invalid construction provenance binding');}
      result.constructionProvenance=p;
    }
    return result;
  }
  async function revolveSelectedProfile(request,options={}) {
    validOptions(options);if(!revolve)throw err('UNSUPPORTED_OPERATION','Revolution is not bound by this mount');
    let copied;try{copied=captureRevolve(request);}catch(e){throw err(e.code||'INVALID_REQUEST',e.message);}
    if(options.signal?.aborted)throw err('CANCELLED','Engine request cancelled');
    const expectedBinding=await bindRevolve(copied);
    if(options.signal?.aborted)throw err('CANCELLED','Engine request cancelled');
    const token=reserve(),response=await send({kind:'selected-profile-revolve',token,request:copied},'result',options.signal);
    let binding;try{binding=captureWorkerMetadata(response.binding);}catch{shutdown('ENGINE_FAILURE','Invalid revolution binding');throw err('ENGINE_FAILURE','Invalid revolution binding');}
    const v=checkEvidence(response.evidence),keys=['nativeVolume','nativeBounds','faces','triangles','bounds','signedVolume','empty','resultKind','solidCount','nativeValidity','nativeTopology','materialRegions','voidRegions','validLevel0','validLevel2','manifoldPredicate','volumeQuality'].sort().join(',');
    if(Object.keys(response).sort().join(',')!=='binding,evidence,kind,seq'||JSON.stringify(binding)!==JSON.stringify(expectedBinding)||Object.keys(v).sort().join(',')!==keys||v.empty||v.solidCount!==1||v.nativeValidity?.valid!==true||!Number.isFinite(v.nativeVolume)||v.nativeVolume<=0||!['min','max'].every(k=>finite3(v.nativeBounds?.[k]))||v.nativeBounds.min.some((n,i)=>n>v.nativeBounds.max[i])){shutdown('ENGINE_FAILURE','Invalid revolution result');throw err('ENGINE_FAILURE','Invalid revolution result');}
    return {...solidResult('solid.profile.revolve',token,v),binding};
  }
  async function sweepSelectedProfile(request,options={}) {
    validOptions(options);if(!sweep)throw err('UNSUPPORTED_OPERATION','Sweep is not bound by this mount');
    let copied;try{copied=captureSweep(request);}catch(e){throw err(e.code||'INVALID_REQUEST',e.message);}
    if(options.signal?.aborted)throw err('CANCELLED','Engine request cancelled');
    const expectedBinding=await bindSweep(copied);
    if(options.signal?.aborted)throw err('CANCELLED','Engine request cancelled');
    const token=reserve(),response=await send({kind:'selected-profile-sweep',token,request:copied},'result',options.signal);
    let binding;try{binding=captureWorkerMetadata(response.binding);}catch{shutdown('ENGINE_FAILURE','Invalid sweep binding');throw err('ENGINE_FAILURE','Invalid sweep binding');}
    const v=checkEvidence(response.evidence),keys=['nativeVolume','nativeBounds','faces','triangles','bounds','signedVolume','empty','resultKind','solidCount','nativeValidity','nativeTopology','materialRegions','voidRegions','validLevel0','validLevel2','manifoldPredicate','volumeQuality'].sort().join(',');
    if(Object.keys(response).sort().join(',')!=='binding,evidence,kind,seq'||JSON.stringify(binding)!==JSON.stringify(expectedBinding)||Object.keys(v).sort().join(',')!==keys||v.empty||v.solidCount!==1||v.nativeValidity?.valid!==true||!Number.isFinite(v.nativeVolume)||v.nativeVolume<=0||!['min','max'].every(k=>finite3(v.nativeBounds?.[k]))||v.nativeBounds.min.some((n,i)=>n>v.nativeBounds.max[i])){shutdown('ENGINE_FAILURE','Invalid sweep result');throw err('ENGINE_FAILURE','Invalid sweep result');}
    return {...solidResult('solid.profile.sweep',token,v),binding};
  }
  async function loftSelectedProfiles(request,options={}){
    validOptions(options);if(!loft)throw err('UNSUPPORTED_OPERATION','Loft is not bound by this mount');
    let copied;try{copied=captureLoft(request);}catch(e){throw err(e.code||'INVALID_REQUEST',e.message);}
    if(options.signal?.aborted)throw err('CANCELLED','Engine request cancelled');
    const expected=loftBindingFields(copied),token=reserve(),{response,progressBinding}=await send({kind:'selected-profile-loft',token,request:copied},'result',options.signal,expected);
    if(options.signal?.aborted){shutdown('CANCELLED','Loft was cancelled');throw err('CANCELLED','Loft was cancelled');}
    let binding;try{binding=captureLoftBinding(response.binding,expected);}catch{shutdown('ENGINE_FAILURE','Invalid loft result binding');throw err('ENGINE_FAILURE','Invalid loft result binding');}
    if(!sameLoftBinding(binding,progressBinding)){shutdown('ENGINE_FAILURE','Loft binding differs from preparation');throw err('ENGINE_FAILURE','Loft binding differs from preparation');}
    const v=checkEvidence(response.evidence),keys=['nativeVolume','nativeBounds','faces','triangles','bounds','signedVolume','empty','resultKind','solidCount','nativeValidity','nativeTopology','materialRegions','voidRegions','validLevel0','validLevel2','manifoldPredicate','volumeQuality'].sort().join(',');
    if(Object.keys(response).sort().join(',')!=='binding,evidence,kind,seq'||Object.keys(v).sort().join(',')!==keys||v.empty||v.solidCount!==1||v.nativeValidity?.valid!==true||!Number.isFinite(v.nativeVolume)||v.nativeVolume<=0||!['min','max'].every(k=>finite3(v.nativeBounds?.[k]))||v.nativeBounds.min.some((n,i)=>n>v.nativeBounds.max[i])){shutdown('ENGINE_FAILURE','Invalid loft result');throw err('ENGINE_FAILURE','Invalid loft result');}
    return {...solidResult('solid.profile.loft',token,v),binding};
  }
  async function box(request, options={}) {
    validOptions(options);
    if(shell){
      const captured=captureShellBoxRequest(request);if(options.signal?.aborted)throw err('CANCELLED','Engine request cancelled');
      const token=reserve(),response=await send({kind:'box',origin:captured.origin,dimensions:captured.dimensions,featureId:captured.featureId,token},'result',options.signal);
      if(Object.keys(response).sort().join(',')!=='box,evidence,kind,seq'||!response.box||Object.keys(response.box).sort().join(',')!=='featureId,version'||response.box.version!==1||response.box.featureId!==captured.featureId){shutdown('ENGINE_FAILURE','Invalid box construction binding');throw err('ENGINE_FAILURE','Invalid box construction binding');}
      requireShellEvidence(response.evidence);return solidResult(captured.op,token,response.evidence);
    }
    if (!request || typeof request!=='object' || Object.keys(request).sort().join(',')!=='dimensions,op,origin,unit,version' ||
        request.op!=='solid.box.create' || request.version!==1) throw err('INVALID_REQUEST','Invalid versioned box request');
    const {origin,dimensions,unit}=request;
    if (unit!=='millimeter'||![origin,dimensions].every(finite3)||
        dimensions.some(n=>n<=0||n>1e6)||origin.some(n=>Math.abs(n)>1e6)) throw err('INVALID_REQUEST','Invalid millimeter box');
    const op=request.op;
    if(options.signal?.aborted) throw err('CANCELLED','Engine request cancelled');
    const token=reserve(), response=await send({kind:'box',origin:origin.slice(),dimensions:dimensions.slice(),token},'result',options.signal);
    return solidResult(op,token,response.evidence);
  }
  async function boolean(request,options={}) {
    validOptions(options);
    let r;try{r=captureWorkerReplyRecord(request);}catch{throw err('INVALID_REQUEST','Expected Boolean data');}
    const fields=booleanHistory?'a,b,featureId,op,producerAFeatureId,producerBFeatureId,unit,version':'a,b,op,unit,version';
    if(Object.keys(r).sort().join(',')!==fields||!['solid.boolean.common','solid.boolean.union','solid.boolean.subtract'].includes(r.op)||r.version!==1||r.unit!=='millimeter')throw err('INVALID_REQUEST','Invalid versioned Boolean request');
    if(booleanHistory&&(![r.featureId,r.producerAFeatureId,r.producerBFeatureId].every(n=>Number.isSafeInteger(n)&&n>0)||r.featureId===r.producerAFeatureId||r.featureId===r.producerBFeatureId))throw err('INVALID_REQUEST','Expected current source and new feature identities');
    const {op}=r,ta=owned(captureSolidHandle(r.a)),tb=owned(captureSolidHandle(r.b));
    if(!booleanHistory&&ta===tb)throw err('INVALID_REQUEST','Operands must be distinct');
    if(options.signal?.aborted)throw err('CANCELLED','Engine request cancelled');
    const kind=op.slice('solid.boolean.'.length),binding=booleanHistory?{featureId:r.featureId,producerAFeatureId:r.producerAFeatureId,producerBFeatureId:r.producerBFeatureId}:{};
    const token=reserve(),response=await send({kind,a:ta,b:tb,token,...binding},'result',options.signal);
    if(booleanHistory){
      const v=response.boolean;
      if(Object.keys(response).sort().join(',')!=='boolean,evidence,kind,seq'||!v||Object.keys(v).sort().join(',')!=='featureId,kind,producerAFeatureId,producerBFeatureId,version'||v.version!==1||v.kind!==kind||Object.keys(binding).some(k=>v[k]!==binding[k])){shutdown('ENGINE_FAILURE','Invalid Boolean binding');throw err('ENGINE_FAILURE','Invalid Boolean binding');}
    }
    return solidResult(op,token,response.evidence);
  }
  // Only generic box/Boolean handles are admitted here. Their kernel identity
  // and recorded evidence stay private; this is not an OCC topology adapter.
  function solidResult(op,token,value,sourceCreationBinding=null) {
    const checked=checkEvidence(value);
    if(selectedTriangleBudget)try{selectedTriangleBudget.charge(token,checked.triangles);}catch(error){shutdown(error.code||'ENGINE_FAILURE',error.message);throw error;}
    const snapshot=JSON.stringify(checked),handle=makeHandle(token);
    solidRecords.set(handle.id,Object.freeze({token,evidence:snapshot,triangles:checked.triangles,...(sourceCreationBinding?{sourceCreationBinding}:{})}));
    const result={contractVersion:1,op,handle,evidence:JSON.parse(snapshot)};if(sourceCreationBinding)Object.defineProperty(result,'sourceCreationBinding',{value:sourceCreationBinding,enumerable:true});return result;
  }
  function captureSolidHandle(handle) {
    if(!handle||typeof handle!=='object'||Reflect.ownKeys(handle).some(k=>typeof k!=='string')||Reflect.ownKeys(handle).sort().join(',')!=='generation,id,mountId,representation')throw err('INVALID_HANDLE','Invalid solid handle');
    const copied={};for(const key of ['generation','id','mountId','representation']){const d=Object.getOwnPropertyDescriptor(handle,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))throw err('INVALID_HANDLE','Solid handles must use data properties');copied[key]=d.value;}return copied;
  }
  function assertSolidBinding(handle) {
    if(state!=='ready')throw err('MOUNT_CLOSED','Engine mount is not ready');
    if(pending)throw err('BUSY','Engine operation pending');
    const copied=captureSolidHandle(handle),token=owned(copied),record=solidRecords.get(copied.id);
    if(!record||record.token!==token)throw err('INVALID_BINDING','Solid is not bound to this mount');
    return true;
  }
  async function readManufacturingMesh(request,options={}) {
    if(!manufacturingMesh)throw err('UNSUPPORTED_OPERATION','This runtime does not bind owned manufacturing meshes');
    const captured=captureManufacturingMeshRequest(request),controls=Object.freeze({linearDeflectionMm:captured.linearDeflectionMm,angularDeflectionRadians:captured.angularDeflectionRadians,relative:captured.relative,maxVertices:captured.maxVertices,maxTriangles:captured.maxTriangles});
    validOptions(options);assertSolidBinding(captured.handle);
    const record=solidRecords.get(captured.handle.id),metrics=JSON.parse(record.evidence);
    if(metrics.empty||metrics.solidCount!==1||metrics.nativeValidity?.valid!==true||!Number.isFinite(metrics.nativeVolume)||metrics.nativeVolume<=0)throw err('MANUFACTURING_MESH_UNSUPPORTED_SHAPE','Manufacturing mesh requires one valid positive native solid');
    const response=await send({kind:'solid-manufacturing-mesh',token:record.token,...controls},'manufacturing-mesh-result',options.signal);
    let result;try{result=captureManufacturingMeshResult(response,controls,record.token);}catch(cause){shutdown('ENGINE_FAILURE','Invalid manufacturing mesh packet',cause);throw err('ENGINE_FAILURE','Invalid manufacturing mesh packet',cause);}
    assertSolidBinding(captured.handle);if(solidRecords.get(captured.handle.id)!==record)throw err('INVALID_HANDLE','Manufacturing mesh input changed');return result;
  }

  async function readOrthographic(request,options={}) {
    if(!orthographicRead)throw err('UNSUPPORTED_OPERATION','This runtime does not bind owned orthographic reads');
    validOptions(options);const captured=captureOrthographicReadRequest(request),frame=orthographicFrameValues(captured.frame);assertSolidBinding(captured.handle);
    const record=solidRecords.get(captured.handle.id),metrics=JSON.parse(record.evidence);
    if(metrics.empty||metrics.solidCount!==1||metrics.nativeValidity?.valid!==true||!(metrics.nativeVolume>0))throw err('ORTHOGRAPHIC_INVALID_INPUT','Orthographic projection requires one valid measured native solid');
    const response=await send({kind:'solid-orthographic-read',token:record.token,frame},'orthographic-read-result',options.signal);
    let result;try{result=captureOrthographicReadResult(response,frame);}catch(cause){shutdown('ENGINE_FAILURE','Invalid orthographic packet',cause);throw err('ENGINE_FAILURE','Invalid orthographic packet',cause);}
    assertSolidBinding(captured.handle);if(solidRecords.get(captured.handle.id)!==record)throw err('INVALID_HANDLE','Orthographic input changed');return result;
  }

  async function readPlanarAttachment(request,options={}){
    if(!planarAttachments)throw err('UNSUPPORTED_FRAME_PARENT','This runtime does not bind native planar attachments');
    validOptions(options);const r=capturePlanarAttachmentRequest(request);if(r.framePolicy===PROFILE_EXTENT_ATTACHMENT_POLICY&&!profileExtents)throw err('UNSUPPORTED_FRAME_PARENT','This runtime does not bind extent cap attachments');assertSolidBinding(r.handle);assertSolidBinding(r.sourceHandle);
    const target=solidRecords.get(r.handle.id),source=solidRecords.get(r.sourceHandle.id);
    const response=await send({kind:'solid-face-frame',token:target.token,sourceToken:source.token,producerFeatureId:r.producerFeatureId,originFeatureId:r.originFeatureId,selectionId:r.selectionId,sourceFeatureId:r.sourceFeatureId,sourceRegionId:r.sourceRegionId,framePolicy:r.framePolicy},'result',options.signal);
    let observation;try{if(Reflect.ownKeys(response).sort().join(',')!=='kind,observation,producerFeatureId,seq,token'||response.token!==target.token||response.producerFeatureId!==r.producerFeatureId)throw Error('Attachment reply binding changed');observation=capturePlanarAttachmentObservation(response.observation);if(observation.framePolicy!==r.framePolicy)throw Error('Attachment policy changed');}catch(cause){shutdown('ENGINE_FAILURE','Malformed native attachment observation',cause);throw err('ENGINE_FAILURE','Malformed native attachment observation',cause);}
    assertSolidBinding(r.handle);assertSolidBinding(r.sourceHandle);if(solidRecords.get(r.handle.id)!==target||solidRecords.get(r.sourceHandle.id)!==source)throw err('INVALID_BINDING','Attachment input changed');
    return Object.freeze({contractVersion:1,op:'solid.face.frame.read',unit:'millimeter',observation});
  }

  async function readDrawingReferences(request,options={}){
    if(!drawingReferences)throw err('UNSUPPORTED_OPERATION','This runtime does not bind semantic drawing reads');
    validOptions(options);const captured=captureDrawingReadRequest(request);assertSolidBinding(captured.handle);assertSolidBinding(captured.sourceHandle);
    const target=solidRecords.get(captured.handle.id),source=solidRecords.get(captured.sourceHandle.id);
    const facts=JSON.parse(target.evidence);if(facts.nativeValidity?.valid!==true||facts.resultKind!=='single-solid'||facts.solidCount!==1||!(facts.nativeVolume>0))throw err('UNSUPPORTED_TARGET','Drawing reads require a current valid native single solid');
    const response=await send({kind:'solid-drawing-references',token:target.token,sourceToken:source.token,producerFeatureId:captured.producerFeatureId,definition:captured.definition},'result',options.signal);
    let observation;try{if(Reflect.ownKeys(response).sort().join(',')!=='kind,observation,producerFeatureId,seq,token'||response.token!==target.token||response.producerFeatureId!==captured.producerFeatureId)throw Error('Drawing result binding differs');observation=captureDrawingReadResult(response.observation,captured.definition);}catch(cause){shutdown('ENGINE_FAILURE','Malformed drawing observation',cause);throw err('ENGINE_FAILURE','Malformed drawing observation',cause);}
    assertSolidBinding(captured.handle);assertSolidBinding(captured.sourceHandle);if(solidRecords.get(captured.handle.id)!==target||solidRecords.get(captured.sourceHandle.id)!==source)throw err('INVALID_BINDING','Drawing input changed');
    return{contractVersion:1,op:'solid.drawing.references.read',unit:'millimeter',observation};
  }

  async function readDrawingDerived(request,options={}){
    if(!drawingDetails)throw err('UNSUPPORTED_OPERATION','Derived drawing observations are unavailable');
    validOptions(options);const r=captureDrawingDerivedRequest(request),view=r.definition.views.find(v=>v.viewId===r.viewId);
    if(view.basis==='bore-center-section'&&!drawingSections)throw err('ENGINE_CAPABILITY_UNAVAILABLE','This exact build does not bind section caps');
    assertSolidBinding(r.handle);assertSolidBinding(r.sourceHandle);const target=solidRecords.get(r.handle.id),source=solidRecords.get(r.sourceHandle.id),facts=JSON.parse(target.evidence);
    if(facts.nativeValidity?.valid!==true||facts.resultKind!=='single-solid'||facts.solidCount!==1||!(facts.nativeVolume>0))throw err('UNSUPPORTED_TARGET','Derived drawing reads require a current valid native single solid');
    const response=await send({kind:'solid-drawing-derived',token:target.token,sourceToken:source.token,producerFeatureId:r.producerFeatureId,definition:r.definition,viewId:r.viewId,frame:r.frame,parentFrame:r.parentFrame},'result',options.signal);
    let geometry=null,projection=null;
    try{
      const keys=['kind','seq','token','producerFeatureId','viewId','projection','geometry','status','reason'];
      if(Reflect.ownKeys(response).length!==keys.length||keys.some(k=>!Object.hasOwn(response,k))||response.token!==target.token||response.producerFeatureId!==r.producerFeatureId||response.viewId!==r.viewId||!['available','unavailable'].includes(response.status)||response.status==='available'&&response.reason!==null||response.status==='unavailable'&&(!['DRAWING_DETAIL_UNQUALIFIED','RESOURCE_LIMIT'].includes(response.reason)||response.geometry!==null))throw Error('Derived drawing binding differs');
      const frame=[...r.frame.origin,...r.frame.u,...r.frame.v,...r.frame.n];
      if(view.basis==='detail'){
        if(!response.projection)throw Error('A detail has no actual parent projection');
        const pf=[...r.parentFrame.origin,...r.parentFrame.u,...r.parentFrame.v,...r.parentFrame.n];
        projection=captureOrthographicReadResult({kind:'orthographic-read-result',seq:response.seq,...response.projection},pf);
        if(response.status==='available')geometry=captureDrawingDetailTransfer(response.geometry,view,r.frame,projection);
        if(geometry&&(geometry.intervals===projection.values||geometry.intervals===projection.tags))throw Error('Detail aliases a parent buffer');
      }else{
        if(response.projection!==null||response.status!=='available')throw Error('Invalid section result role');
        geometry=captureDrawingSectionTransfer(response.geometry,frame);
      }
    }catch(cause){shutdown('ENGINE_FAILURE','Malformed derived drawing observation',cause);throw err('ENGINE_FAILURE','Malformed derived drawing observation',cause);}
    assertSolidBinding(r.handle);assertSolidBinding(r.sourceHandle);if(solidRecords.get(r.handle.id)!==target||solidRecords.get(r.sourceHandle.id)!==source)throw err('INVALID_BINDING','Derived drawing input changed');
    return Object.freeze({contractVersion:1,op:r.op,unit:'millimeter',viewId:r.viewId,status:response.status,reason:response.reason,projection,geometry});
  }

  async function readDrawingBores(request,options={}){
    if(!drawingReferences)throw err('UNSUPPORTED_OPERATION','This runtime does not bind bore observations');
    validOptions(options);const r=captureBoreReadRequest(request);assertSolidBinding(r.handle);assertSolidBinding(r.sourceHandle);
    const target=solidRecords.get(r.handle.id),source=solidRecords.get(r.sourceHandle.id),facts=JSON.parse(target.evidence);
    if(facts.nativeValidity?.valid!==true||facts.resultKind!=='single-solid'||facts.solidCount!==1||!(facts.nativeVolume>0))throw err('UNSUPPORTED_TARGET','Bore reads require a current valid native single solid');
    const response=await send({kind:'solid-drawing-bores',token:target.token,sourceToken:source.token,producerFeatureId:r.producerFeatureId,query:r.query},'result',options.signal);
    let observation;try{if(Reflect.ownKeys(response).sort().join(',')!=='kind,observation,producerFeatureId,seq,token'||response.token!==target.token||response.producerFeatureId!==r.producerFeatureId)throw Error('Bore result binding differs');observation=captureBoreReadResult(response.observation,r.query);}catch(cause){shutdown('ENGINE_FAILURE','Malformed bore observation',cause);throw err('ENGINE_FAILURE','Malformed bore observation',cause);}
    assertSolidBinding(r.handle);assertSolidBinding(r.sourceHandle);if(solidRecords.get(r.handle.id)!==target||solidRecords.get(r.sourceHandle.id)!==source)throw err('INVALID_BINDING','Bore input changed');
    return Object.freeze({contractVersion:1,op:'solid.drawing.bores.read',unit:'millimeter',observation});
  }

  async function exportSTEP(request,options={}) {
    if(!stepExport)throw err('UNSUPPORTED_OPERATION','This runtime does not bind owned STEP export');
    validOptions(options);const captured=captureStepExportRequest(request),records=captured.handles.map(handle=>{assertSolidBinding(handle);const r=solidRecords.get(handle.id),metrics=JSON.parse(r.evidence);if(!Number.isSafeInteger(metrics.solidCount)||metrics.solidCount<1||metrics.solidCount>16384||metrics.empty||metrics.nativeValidity?.valid!==true)throw err('STEP_EXPORT_EMPTY_INPUT','STEP requires positive valid native solids');return {handle,record:r,solidCount:metrics.solidCount};});
    const response=await send({kind:'solid-step-export',tokens:records.map(r=>r.record.token)},'step-exported',options.signal);
    let result;try{result=captureStepExportResult(response,records.map(r=>r.solidCount));}catch(cause){shutdown('ENGINE_FAILURE','Invalid STEP result',cause);throw err('ENGINE_FAILURE','Invalid STEP result',cause);}
    for(const r of records){assertSolidBinding(r.handle);if(solidRecords.get(r.handle.id)!==r.record)throw err('INVALID_HANDLE','STEP input changed');}
    return result;
  }

  async function readSolidMesh(request,options={}) {
    validOptions(options);
    if(!request||typeof request!=='object'||Reflect.ownKeys(request).some(k=>typeof k!=='string')||Reflect.ownKeys(request).sort().join(',')!=='handle,op,version')throw err('INVALID_REQUEST','Invalid solid mesh request');
    const captured={};for(const key of ['op','version','handle']){const d=Object.getOwnPropertyDescriptor(request,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))throw err('INVALID_REQUEST','Solid mesh fields must use data properties');captured[key]=d.value;}
    if(captured.op!=='solid.mesh.read'||captured.version!==1)throw err('INVALID_REQUEST','Unsupported solid mesh request');
    const handle=captureSolidHandle(captured.handle);assertSolidBinding(handle);
    const record=solidRecords.get(handle.id),response=await send({kind:'solid-mesh',token:record.token},'result',options.signal);
    try{
      if(Reflect.ownKeys(response).sort().join(',')!=='buffer,displayBuffer,displayReason,displayStatus,evidence,kind,seq,token,triangleCount'||owned(handle)!==record.token||solidRecords.get(handle.id)!==record||response.token!==record.token||response.triangleCount!==record.triangles||!(response.buffer instanceof ArrayBuffer)||response.buffer.byteLength!==record.triangles*9*8||JSON.stringify(response.evidence)!==record.evidence||!(response.displayBuffer instanceof ArrayBuffer)||!(response.displayStatus==='available'?response.displayReason===null&&response.displayBuffer.byteLength===record.triangles*36:response.displayStatus==='unavailable'&&['float32-overflow','float32-collapsed-triangle'].includes(response.displayReason)&&record.triangles>0&&response.displayBuffer.byteLength===0))throw Error();
    }catch{shutdown('ENGINE_FAILURE','Invalid owned solid mesh response');throw err('ENGINE_FAILURE','Invalid owned solid mesh response');}
    assertSolidBinding(handle);
    // Typed-array traversal and geometry checks belong to the worker. The
    // transferred display buffer is neither native geometry nor save data.
    return {contractVersion:1,op:'solid.mesh.read',unit:'millimeter',quality:'display-only',triangleCount:record.triangles,buffer:response.buffer,evidence:JSON.parse(record.evidence),displayBuffer:response.displayBuffer,displayStatus:response.displayStatus,displayReason:response.displayReason};
  }
  function captureObservationRequest(request,op,withPoint=false){
    if(selectedProfileVersion!==3)throw err('UNSUPPORTED_OPERATION','Native observations require the polygon component');
    let r;try{r=captureWorkerReplyRecord(request);}catch{throw err('INVALID_REQUEST','Expected observation data');}
    if(Object.keys(r).sort().join(',')!==(withPoint?'handle,op,point,unit,version':'handle,op,version')||r.op!==op||r.version!==1||withPoint&&r.unit!=='millimeter')throw err('INVALID_REQUEST','Invalid observation request');
    r.handle=captureSolidHandle(r.handle);assertSolidBinding(r.handle);
    if(withPoint){
      if(!Array.isArray(r.point)||r.point.length!==3||Reflect.ownKeys(r.point).length!==4)throw err('INVALID_REQUEST','Invalid classification point');
      r.point=[0,1,2].map(i=>{const d=Object.getOwnPropertyDescriptor(r.point,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value')||typeof d.value!=='number'||!Number.isFinite(d.value)||Math.abs(d.value)>4e6)throw err('INVALID_REQUEST','Invalid classification coordinate');return d.value;});
    }
    return r;
  }
  async function readSolidTopology(request,options={}){
    validOptions(options);const r=captureObservationRequest(request,'solid.topology.read'),record=solidRecords.get(r.handle.id);
    const response=await send({kind:'solid-topology',token:record.token},'result',options.signal);
    if(Reflect.ownKeys(response).sort().join(',')!=='kind,seq,token,topology'||response.token!==record.token||response.topology?.version!==1||response.topology.scope!=='response-local'||response.topology.persistentIds!==false||response.topology.valid!==true){shutdown('ENGINE_FAILURE','Invalid topology observation');throw err('ENGINE_FAILURE','Invalid topology observation');}
    assertSolidBinding(r.handle);if(solidRecords.get(r.handle.id)!==record)throw err('INVALID_BINDING','Solid changed during observation');
    // The pinned Worker validates the complete bounded native catalog. This
    // detached response is not retained or used as an authoring authority.
    return{contractVersion:1,op:r.op,unit:'millimeter',catalog:response.topology};
  }
  async function classifySolidPoint(request,options={}){
    validOptions(options);const r=captureObservationRequest(request,'solid.point.classify',true),record=solidRecords.get(r.handle.id);
    const response=await send({kind:'solid-point-classify',token:record.token,point:r.point},'result',options.signal);
    if(Reflect.ownKeys(response).sort().join(',')!=='classification,kind,seq,token'||response.token!==record.token||!['inside','outside','boundary','unknown'].includes(response.classification)){shutdown('ENGINE_FAILURE','Invalid point classification');throw err('ENGINE_FAILURE','Invalid point classification');}
    assertSolidBinding(r.handle);if(solidRecords.get(r.handle.id)!==record)throw err('INVALID_BINDING','Solid changed during classification');
    return{contractVersion:1,op:r.op,unit:'millimeter',classification:response.classification};
  }
  async function readPrismSelections(request,options={}){
    validOptions(options);if(selectedProfileVersion!==3||booleanHistory)throw err('UNSUPPORTED_OPERATION','Prism selections require the polygon component');
    let r;try{r=captureWorkerReplyRecord(request);}catch{throw err('INVALID_REQUEST','Expected prism observation data');}
    if(Object.keys(r).sort().join(',')!=='featureId,handle,op,version'||r.op!=='solid.prism.selections.read'||r.version!==1||!Number.isSafeInteger(r.featureId)||r.featureId<1)throw err('INVALID_REQUEST','Invalid prism observation request');
    r.handle=captureSolidHandle(r.handle);assertSolidBinding(r.handle);const record=solidRecords.get(r.handle.id);
    const response=await send({kind:'solid-prism-selections',token:record.token,featureId:r.featureId},'result',options.signal),selection=response.selection;
    if(Reflect.ownKeys(response).sort().join(',')!=='featureId,kind,selection,seq,token'||response.token!==record.token||response.featureId!==r.featureId||!(selection?.status==='available'&&selection.plan?.version===1&&selection.plan.featureId===r.featureId&&selection.plan.scope==='authored-source'||selection?.status==='unavailable'&&['NOT_A_PRISM_RESULT','PROFILE_PROVENANCE_UNSUPPORTED','PROFILE_PROVENANCE_RESOURCE_LIMIT','PROFILE_PROVENANCE_FAILED','SELECTION_RESOURCE_LIMIT'].includes(selection.reason))){shutdown('ENGINE_FAILURE','Invalid prism selection observation');throw err('ENGINE_FAILURE','Invalid prism selection observation');}
    assertSolidBinding(r.handle);if(solidRecords.get(r.handle.id)!==record)throw err('INVALID_BINDING','Solid changed during observation');
    return{contractVersion:1,op:r.op,unit:'millimeter',selection};
  }
  async function readSolidSelections(request,options={}){
    validOptions(options);if(!booleanHistory)throw err('UNSUPPORTED_OPERATION','Multi-source selections require the explicit Boolean-history runtime');
    let r;try{r=captureWorkerReplyRecord(request);}catch{throw err('INVALID_REQUEST','Expected selection observation data');}
    if(Object.keys(r).sort().join(',')!=='featureId,handle,op,version'||r.op!=='solid.selections.read'||r.version!==1||!Number.isSafeInteger(r.featureId)||r.featureId<1)throw err('INVALID_REQUEST','Invalid selection observation request');
    r.handle=captureSolidHandle(r.handle);assertSolidBinding(r.handle);const record=solidRecords.get(r.handle.id);
    const response=await send({kind:'solid-selections',token:record.token,featureId:r.featureId},'result',options.signal),selection=response.selection;
    const unavailable=['NOT_A_PRISM_RESULT','PROFILE_PROVENANCE_UNSUPPORTED','PROFILE_PROVENANCE_RESOURCE_LIMIT','PROFILE_PROVENANCE_FAILED','SELECTION_RESOURCE_LIMIT','SELECTION_UNAVAILABLE','NO_AUTHORED_SOURCE_SELECTIONS','BOOLEAN_HISTORY_UNSUPPORTED','BOOLEAN_HISTORY_RESOURCE_LIMIT','BOOLEAN_HISTORY_FAILED'];
    if(Object.keys(response).sort().join(',')!=='featureId,kind,selection,seq,token'||response.token!==record.token||response.featureId!==r.featureId||!(selection?.status==='available'&&selection.plan?.version===2&&selection.plan.featureId===r.featureId&&selection.plan.scope==='authored-source'||selection?.status==='unavailable'&&unavailable.includes(selection.reason))){shutdown('ENGINE_FAILURE','Invalid selection observation');throw err('ENGINE_FAILURE','Invalid selection observation');}
    assertSolidBinding(r.handle);if(solidRecords.get(r.handle.id)!==record)throw err('INVALID_BINDING','Solid changed during observation');
    return{contractVersion:1,op:r.op,unit:'millimeter',selection};
  }
  async function blindSolidHole(request,options={}){
    validOptions(options);if(!blindHoles)throw err('UNSUPPORTED_OPERATION','Blind holes require the explicit owned runtime');
    let raw;try{raw=captureWorkerReplyRecord(request);}catch{throw err('INVALID_REQUEST','Expected blind-hole data');}
    const {op,handle,sourceHandle,...authored}=raw;
    if(op!=='solid.holes.blind')throw err('INVALID_REQUEST','Invalid blind-hole operation');
    let intent;try{intent=captureOwnedBlindHoleIntent(authored);}catch(e){throw err(e.code||'INVALID_REQUEST',e.message);}
    if(intent.engineRevision!==`sha256:${JS_SHA}:${WASM_SHA}`)throw err('INVALID_REQUEST','Hole intent requires another runtime');
    const parent=captureSolidHandle(handle),source=captureSolidHandle(sourceHandle);assertSolidBinding(parent);assertSolidBinding(source);
    const cost=2,token=reserve(cost),response=await send({kind:'solid-blind-hole',token,parentToken:owned(parent),sourceToken:owned(source),request:intent},'result',options.signal);
    let binding,work,counts;
    try{
      binding=captureOwnedBlindHoleIntent(response.blind);work=captureWorkerReplyRecord(response.work);
      if(Object.keys(response).sort().join(',')!=='blind,evidence,kind,seq,work'||JSON.stringify(binding)!==JSON.stringify(intent)||Object.keys(work).sort().join(',')!=='nativeResults,resultTriangles,version'||work.version!==1||work.nativeResults!==cost||!Array.isArray(work.resultTriangles)||work.resultTriangles.length!==cost||Reflect.ownKeys(work.resultTriangles).length!==cost+1)throw Error();
      counts=Array.from({length:cost},(_,i)=>{const d=Object.getOwnPropertyDescriptor(work.resultTriangles,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value')||!Number.isSafeInteger(d.value)||d.value<1||d.value>100000)throw Error();return d.value;});
      if(counts.reduce((a,b)=>a+b,0)>100000)throw Error();
    }catch{shutdown('ENGINE_FAILURE','Invalid hole binding or work receipt');throw err('ENGINE_FAILURE','Invalid hole binding or work receipt');}
    const evidence=checkEvidence(response.evidence);
    if(evidence.resultKind!=='single-solid'||evidence.solidCount!==1||evidence.nativeValidity?.valid!==true||!Number.isFinite(evidence.nativeVolume)||evidence.nativeVolume<=0||!['min','max'].every(k=>finite3(evidence.nativeBounds?.[k]))||evidence.nativeBounds.min.some((n,i)=>n>evidence.nativeBounds.max[i])||counts.at(-1)!==evidence.triangles){shutdown('ENGINE_FAILURE','Invalid hole result evidence');throw err('ENGINE_FAILURE','Invalid hole result evidence');}
    try{for(let i=0;i<cost-1;i++)selectedTriangleBudget.charge(token+':internal:'+i,counts[i]);}
    catch(e){shutdown(e.code||'ENGINE_FAILURE',e.message);throw e;}
    assertSolidBinding(parent);assertSolidBinding(source);
    return solidResult('solid.holes.blind',token,evidence);
  }
  async function counterboreSolidHole(request,options={}){
    validOptions(options);if(!counterbores)throw err('UNSUPPORTED_OPERATION','Counterbore holes require the explicit owned runtime');
    let raw;try{raw=captureWorkerReplyRecord(request);}catch{throw err('INVALID_REQUEST','Expected counterbore data');}
    const {op,handle,sourceHandle,...authored}=raw;
    if(op!=='solid.holes.counterbore')throw err('INVALID_REQUEST','Invalid counterbore operation');
    let intent;try{intent=captureOwnedCounterboreIntent(authored);}catch(e){throw err(e.code||'INVALID_REQUEST',e.message);}
    if(intent.engineRevision!==`sha256:${JS_SHA}:${WASM_SHA}`)throw err('INVALID_REQUEST','Hole intent requires another runtime');
    const parent=captureSolidHandle(handle),source=captureSolidHandle(sourceHandle);assertSolidBinding(parent);assertSolidBinding(source);
    const cost=4,token=reserve(cost),response=await send({kind:'solid-counterbore',token,parentToken:owned(parent),sourceToken:owned(source),request:intent},'result',options.signal);
    let binding,work,counts;
    try{
      binding=captureOwnedCounterboreIntent(response.counterbore);work=captureWorkerReplyRecord(response.work);
      if(Object.keys(response).sort().join(',')!=='counterbore,evidence,kind,seq,work'||JSON.stringify(binding)!==JSON.stringify(intent)||Object.keys(work).sort().join(',')!=='nativeResults,resultTriangles,version'||work.version!==1||work.nativeResults!==cost||!Array.isArray(work.resultTriangles)||work.resultTriangles.length!==cost||Reflect.ownKeys(work.resultTriangles).length!==cost+1)throw Error();
      counts=Array.from({length:cost},(_,i)=>{const d=Object.getOwnPropertyDescriptor(work.resultTriangles,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value')||!Number.isSafeInteger(d.value)||d.value<1||d.value>100000)throw Error();return d.value;});
      if(counts.reduce((a,b)=>a+b,0)>100000)throw Error();
    }catch{shutdown('ENGINE_FAILURE','Invalid hole binding or work receipt');throw err('ENGINE_FAILURE','Invalid hole binding or work receipt');}
    const evidence=checkEvidence(response.evidence);
    if(evidence.resultKind!=='single-solid'||evidence.solidCount!==1||evidence.nativeValidity?.valid!==true||!Number.isFinite(evidence.nativeVolume)||evidence.nativeVolume<=0||!['min','max'].every(k=>finite3(evidence.nativeBounds?.[k]))||evidence.nativeBounds.min.some((n,i)=>n>evidence.nativeBounds.max[i])||counts.at(-1)!==evidence.triangles){shutdown('ENGINE_FAILURE','Invalid hole result evidence');throw err('ENGINE_FAILURE','Invalid hole result evidence');}
    try{for(let i=0;i<cost-1;i++)selectedTriangleBudget.charge(token+':internal:'+i,counts[i]);}
    catch(e){shutdown(e.code||'ENGINE_FAILURE',e.message);throw e;}
    assertSolidBinding(parent);assertSolidBinding(source);
    return solidResult('solid.holes.counterbore',token,evidence);
  }
  async function throughSolidHoles(request,options={}){
    validOptions(options);if(!throughHoles)throw err('UNSUPPORTED_OPERATION','Through holes require the explicit owned runtime');
    let raw;try{raw=captureWorkerReplyRecord(request);}catch{throw err('INVALID_REQUEST','Expected through-hole data');}
    const {op,handle,sourceHandle,...authored}=raw;
    if(op!=='solid.holes.through')throw err('INVALID_REQUEST','Invalid through-hole operation');
    let intent;try{intent=captureOwnedHoleIntent(authored);}catch(e){throw err(e.code||'INVALID_REQUEST',e.message);}
    if(intent.engineRevision!==`sha256:${JS_SHA}:${WASM_SHA}`)throw err('INVALID_REQUEST','Hole intent requires another runtime');
    const parent=captureSolidHandle(handle),source=captureSolidHandle(sourceHandle);assertSolidBinding(parent);assertSolidBinding(source);
    const cost=intent.kind==='centered-through'?2:8,token=reserve(cost),response=await send({kind:'solid-through-holes',token,parentToken:owned(parent),sourceToken:owned(source),request:intent},'result',options.signal);
    let binding,work,counts;
    try{
      binding=captureOwnedHoleIntent(response.hole);work=captureWorkerReplyRecord(response.work);
      if(Object.keys(response).sort().join(',')!=='evidence,hole,kind,seq,work'||JSON.stringify(binding)!==JSON.stringify(intent)||Object.keys(work).sort().join(',')!=='nativeResults,resultTriangles,version'||work.version!==1||work.nativeResults!==cost||!Array.isArray(work.resultTriangles)||work.resultTriangles.length!==cost||Reflect.ownKeys(work.resultTriangles).length!==cost+1)throw Error();
      counts=Array.from({length:cost},(_,i)=>{const d=Object.getOwnPropertyDescriptor(work.resultTriangles,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value')||!Number.isSafeInteger(d.value)||d.value<1||d.value>100000)throw Error();return d.value;});
      if(counts.reduce((a,b)=>a+b,0)>100000)throw Error();
    }catch{shutdown('ENGINE_FAILURE','Invalid hole binding or work receipt');throw err('ENGINE_FAILURE','Invalid hole binding or work receipt');}
    const evidence=checkEvidence(response.evidence);
    if(evidence.resultKind!=='single-solid'||evidence.solidCount!==1||evidence.nativeValidity?.valid!==true||!Number.isFinite(evidence.nativeVolume)||evidence.nativeVolume<=0||!['min','max'].every(k=>finite3(evidence.nativeBounds?.[k]))||evidence.nativeBounds.min.some((n,i)=>n>evidence.nativeBounds.max[i])||counts.at(-1)!==evidence.triangles){shutdown('ENGINE_FAILURE','Invalid hole result evidence');throw err('ENGINE_FAILURE','Invalid hole result evidence');}
    try{for(let i=0;i<cost-1;i++)selectedTriangleBudget.charge(token+':internal:'+i,counts[i]);}
    catch(e){shutdown(e.code||'ENGINE_FAILURE',e.message);throw e;}
    assertSolidBinding(parent);assertSolidBinding(source);
    return solidResult('solid.holes.through',token,evidence);
  }
  async function linearThroughHolePattern(request,options={}){
    validOptions(options);if(!linearHolePatterns)throw err('UNSUPPORTED_OPERATION','Linear hole patterns require the explicit owned runtime');
    let raw;try{raw=captureWorkerReplyRecord(request);}catch{throw err('INVALID_REQUEST','Expected linear pattern data');}
    const {op,handle,sourceHandle,...authored}=raw;if(op!=='solid.holes.pattern.linear')throw err('INVALID_REQUEST','Invalid linear hole pattern operation');
    let intent,cost;try{intent=captureOwnedLinearHolePatternIntent(authored);cost=linearHolePatternNativeCost(intent.count);}catch(e){throw err(e.code||'INVALID_REQUEST',e.message);}
    if(intent.engineRevision!==`sha256:${JS_SHA}:${WASM_SHA}`)throw err('INVALID_REQUEST','Pattern requires another native runtime');
    const parent=captureSolidHandle(handle),source=captureSolidHandle(sourceHandle);assertSolidBinding(parent);assertSolidBinding(source);
    const token=reserve(cost),response=await send({kind:'solid-linear-hole-pattern',token,parentToken:owned(parent),sourceToken:owned(source),request:intent},'result',options.signal);
    let binding,work,counts;try{
      binding=captureOwnedLinearHolePatternIntent(response.pattern);work=captureWorkerReplyRecord(response.work);
      if(Object.keys(response).sort().join(',')!=='evidence,kind,pattern,seq,work'||JSON.stringify(binding)!==JSON.stringify(intent)||Object.keys(work).sort().join(',')!=='nativeResults,resultTriangles,version'||work.version!==1||work.nativeResults!==cost||!Array.isArray(work.resultTriangles)||work.resultTriangles.length!==cost||Reflect.ownKeys(work.resultTriangles).length!==cost+1)throw Error();
      counts=Array.from({length:cost},(_,i)=>{const d=Object.getOwnPropertyDescriptor(work.resultTriangles,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value')||!Number.isSafeInteger(d.value)||d.value<1||d.value>100000)throw Error();return d.value;});if(counts.reduce((a,b)=>a+b,0)>100000)throw Error();
    }catch{shutdown('ENGINE_FAILURE','Invalid pattern binding or work receipt');throw err('ENGINE_FAILURE','Invalid pattern binding or work receipt');}
    const evidence=checkEvidence(response.evidence);
    if(evidence.resultKind!=='single-solid'||evidence.solidCount!==1||evidence.nativeValidity?.valid!==true||!Number.isFinite(evidence.nativeVolume)||evidence.nativeVolume<=0||!['min','max'].every(k=>finite3(evidence.nativeBounds?.[k]))||evidence.nativeBounds.min.some((n,i)=>n>evidence.nativeBounds.max[i])||counts.at(-1)!==evidence.triangles){shutdown('ENGINE_FAILURE','Invalid pattern result evidence');throw err('ENGINE_FAILURE','Invalid pattern result evidence');}
    try{for(let i=0;i<cost-1;i++)selectedTriangleBudget.charge(token+':internal:'+i,counts[i]);}catch(e){shutdown(e.code||'ENGINE_FAILURE',e.message);throw e;}
    assertSolidBinding(parent);assertSolidBinding(source);return solidResult('solid.holes.pattern.linear',token,evidence);
  }
  async function treatSolidEdges(request,options={}){
    validOptions(options);if(!edgeTreatments)throw err('UNSUPPORTED_OPERATION','Edge treatments require the explicit mechanical runtime');
    let r;try{r=captureWorkerReplyRecord(request);}catch{throw err('INVALID_REQUEST','Expected edge treatment data');}
    if(Object.keys(r).sort().join(',')!=='edgeIds,featureId,handle,kind,op,producerFeatureId,size,unit,version'||r.op!=='solid.edge.treat'||r.version!==1||r.unit!=='millimeter'||!['fillet','chamfer-equal'].includes(r.kind)||![r.featureId,r.producerFeatureId].every(n=>Number.isSafeInteger(n)&&n>0)||r.featureId===r.producerFeatureId||typeof r.size!=='number'||!Number.isFinite(r.size)||r.size<=0||r.size>1e6)throw err('INVALID_REQUEST','Invalid authored edge treatment');
    r.handle=captureSolidHandle(r.handle);assertSolidBinding(r.handle);const parent=solidRecords.get(r.handle.id);
    if(!Array.isArray(r.edgeIds)||r.edgeIds.length<1||r.edgeIds.length>16||Reflect.ownKeys(r.edgeIds).length!==r.edgeIds.length+1)throw err('INVALID_REQUEST','Select one to sixteen discovered edge identities');
    r.edgeIds=Array.from({length:r.edgeIds.length},(_,i)=>{const d=Object.getOwnPropertyDescriptor(r.edgeIds,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value')||typeof d.value!=='string'||!d.value||d.value.length>16384)throw err('INVALID_REQUEST','Edge identities must be bounded data');return d.value;});
    if(new Set(r.edgeIds).size!==r.edgeIds.length)throw err('INVALID_REQUEST','Select distinct edges');
    if(options.signal?.aborted)throw err('CANCELLED','Engine request cancelled');
    const token=reserve(),response=await send({kind:'solid-edge-treatment',token,parentToken:parent.token,producerFeatureId:r.producerFeatureId,featureId:r.featureId,treatment:r.kind,edgeIds:r.edgeIds,size:r.size},'result',options.signal),binding=response.treatment;
    if(Reflect.ownKeys(response).sort().join(',')!=='evidence,kind,seq,treatment'||!binding||Object.keys(binding).sort().join(',')!=='edgeIds,featureId,kind,producerFeatureId,size,version'||binding.version!==1||binding.featureId!==r.featureId||binding.producerFeatureId!==r.producerFeatureId||binding.kind!==r.kind||binding.size!==r.size||!Array.isArray(binding.edgeIds)||binding.edgeIds.length!==r.edgeIds.length||binding.edgeIds.some((id,i)=>id!==r.edgeIds[i])){shutdown('ENGINE_FAILURE','Invalid edge treatment binding');throw err('ENGINE_FAILURE','Invalid edge treatment binding');}
    return solidResult('solid.edge.treat',token,response.evidence);
  }
  function requireShellEvidence(raw){
    const evidence=checkEvidence(raw);
    if(evidence.empty||evidence.solidCount!==1||evidence.nativeValidity?.valid!==true||!Number.isFinite(evidence.nativeVolume)||evidence.nativeVolume<=0||![evidence.nativeBounds?.min,evidence.nativeBounds?.max].every(finite3)||evidence.nativeBounds.min.some((n,i)=>n>=evidence.nativeBounds.max[i])){shutdown('ENGINE_FAILURE','Invalid positive shell/box evidence');throw err('ENGINE_FAILURE','Invalid positive shell/box evidence');}
  }
  async function shellSolid(request,options={}){
    validOptions(options);if(!shell)throw err('UNSUPPORTED_OPERATION','Shell is not bound by this mount');
    const captured=captureShellRequest(request);assertSolidBinding(captured.handle);const parent=solidRecords.get(captured.handle.id);
    if(options.signal?.aborted)throw err('CANCELLED','Engine request cancelled');
    const token=reserve(),response=await send({kind:'solid-shell',token,parentToken:parent.token,featureId:captured.featureId,producerFeatureId:captured.producerFeatureId,removedFaceIds:captured.removedFaceIds,thickness:captured.thickness,direction:captured.direction},'result',options.signal);
    try{if(Object.keys(response).sort().join(',')!=='evidence,kind,seq,shell')throw Error('Invalid shell result fields');captureShellBinding(response.shell,captured);requireShellEvidence(response.evidence);assertSolidBinding(captured.handle);if(solidRecords.get(captured.handle.id)!==parent)throw Error('Shell parent changed');}
    catch(cause){shutdown('ENGINE_FAILURE','Invalid shell result binding',cause);throw err('ENGINE_FAILURE','Invalid shell result binding',cause);}
    return solidResult(captured.op,token,response.evidence);
  }
  async function dispose(request,options={}) {
    validOptions(options);
    if (!request || typeof request!=='object' || Object.keys(request).sort().join(',')!=='handle,op,version' ||
        request.op!=='solid.dispose' || request.version!==1) throw err('INVALID_REQUEST','Invalid versioned dispose request');
    const {handle,op}=request;
    const token=owned(handle), id=handle.id;await send({kind:'dispose',token},'disposed',options.signal);handles.delete(id);solidRecords.delete(id);portableRecords.delete(id);holeRecords.delete(id);cornerRecords.delete(id);enclosureRecords.delete(id);
    return {contractVersion:1,op};
  }
  async function createEnclosure(request,options={}) {
    validOptions(options);
    if(!enclosure)throw err('UNSUPPORTED_OPERATION','Enclosure requires a qualified engine mount');
    if(!request || typeof request!=='object' || Reflect.ownKeys(request).some(k=>typeof k!=='string') || Reflect.ownKeys(request).sort().join(',')!=='op,plan,version')throw err('INVALID_REQUEST','Invalid enclosure request');
    for(const key of ['op','version','plan']){const d=Object.getOwnPropertyDescriptor(request,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))throw err('INVALID_REQUEST','Invalid request fields');}
    if(request.op!=='solid.enclosure.create' || ![1,2].includes(request.version))throw err('INVALID_REQUEST','Invalid enclosure request');
    const version=request.version,field=Object.getOwnPropertyDescriptor(request,'plan');let plan;
    try {
      const validate=version===1?(mesh?validateManifoldEnclosureInput:enclosurePlan):(mesh?validateManifoldEnclosureInputV2:enclosurePlanV2);
      validate(field.value);plan={};for(const key of ['unit','width','length','height','wall','clearance','lidThickness','lipDepth'])plan[key]=Object.getOwnPropertyDescriptor(field.value,key).value;
      if(version===2){const inputLabel=Object.getOwnPropertyDescriptor(field.value,'label').value;plan.label=Object.freeze(Object.fromEntries(['width','length','depth'].map(k=>[k,Object.getOwnPropertyDescriptor(inputLabel,k).value])));}
    }catch(e) {if(mesh&&e?.message==='UNSUPPORTED_MANIFOLD_PRECISION')throw err('UNSUPPORTED_PRECISION','Enclosure dimensions exceed the Manifold precision domain');throw err('INVALID_REQUEST','Invalid enclosure dimensions');}
    if(options.signal?.aborted)throw err('CANCELLED','Engine request cancelled');
    if(next!==0)throw err('RESOURCE_LIMIT','Enclosure requires a fresh candidate mount');
    const bodyToken=reserve(),lidToken=reserve(),labelToken=version===2?reserve():null;for(let i=version===2?3:2;i<(version===2?8:6);i++)reserve();
    const response=await send({kind:'enclosure-build',bodyToken,lidToken,...(labelToken?{labelToken}:{}),plan,version},'result',options.signal);
    let bodyEvidence,lidEvidence,labelEvidence,interfaceEvidence;try{
      if(response.bodyToken!==bodyToken||response.lidToken!==lidToken||(version===2?response.labelToken!==labelToken:Object.hasOwn(response,'labelToken')))throw Error();
      const expected=(version===1?enclosurePlan:enclosurePlanV2)(plan);
      const check=(part,v)=>{const tol=Math.max(1e-6,part.volume*(mesh?1e-6:1e-9));if(!v||!Number.isFinite(v.nativeVolume)||Math.abs(v.nativeVolume-part.volume)>tol)throw Error();const evidence=checkEvidence(v.mesh),value=mesh?evidence.volume:evidence.signedVolume,coordTol=mesh?Math.max(1e-6,Math.max(...part.bounds.max.map(Math.abs))*2**-21):1e-6;if((mesh&&(evidence.empty||evidence.components!==1))||Math.abs(value-part.volume)>tol||evidence.bounds.min.some((x,i)=>Math.abs(x-part.bounds.min[i])>coordTol)||evidence.bounds.max.some((x,i)=>Math.abs(x-part.bounds.max[i])>coordTol))throw Error();return {nativeVolume:v.nativeVolume,mesh:evidence};};
      bodyEvidence=check(expected.body,response.bodyEvidence);lidEvidence=check(expected.lid,response.lidEvidence);if(version===2){labelEvidence=check(expected.label,response.labelEvidence);const e=response.interfaceEvidence;if(!e||Object.keys(e).sort().join(',')!=='commonVolume,engine,kind,version'||e.version!==1||e.kind!=='bounded-common-volume'||e.engine!==(mesh?'manifold':'occ')||!Number.isFinite(e.commonVolume)||Math.abs(e.commonVolume)>1e-7)throw Error();interfaceEvidence=Object.freeze({...e});}
    }catch {shutdown('ENGINE_FAILURE','Invalid enclosure response');throw err('ENGINE_FAILURE','Invalid enclosure response');}
    try {
      const body=makeHandle(bodyToken),lid=makeHandle(lidToken),label=labelToken?makeHandle(labelToken):null,pair=Object.freeze({bodyId:body.id,lidId:lid.id,labelId:label?.id||null,interfaceEvidence}),savedPlan=Object.freeze({...plan}),save=(h,token,role,e)=>enclosureRecords.set(h.id,{token,role,pair,plan:savedPlan,manufacturing:null,evidence:{nativeVolume:e.nativeVolume,precision:mesh?'float32':'float64',mesh:{triangles:e.mesh.triangles,bounds:{min:[...e.mesh.bounds.min],max:[...e.mesh.bounds.max]}}},buffer:null,count:0});
      save(body,bodyToken,'BODY',bodyEvidence);save(lid,lidToken,'LID',lidEvidence);if(label)save(label,labelToken,'LABEL',labelEvidence);
      return {contractVersion:version,op:'solid.enclosure.create',body:{role:'BODY',handle:body,evidence:bodyEvidence},lid:{role:'LID',handle:lid,evidence:lidEvidence},...(label?{label:{role:'LABEL',handle:label,evidence:labelEvidence},interfaceEvidence}:{})};
    }catch {shutdown('ENGINE_FAILURE','Enclosure handle allocation failed');throw err('ENGINE_FAILURE','Enclosure handle allocation failed');}
  }
  function assertEnclosureBinding(body,lid,label) {
    if(!enclosure)throw err('UNSUPPORTED_OPERATION','Enclosure requires a qualified engine mount');
    if(state!=='ready')throw err('MOUNT_CLOSED','Engine mount is closed');if(pending)throw err('BUSY','Engine operation pending');
    const capture=h=>{if(!h||typeof h!=='object'||Reflect.ownKeys(h).some(k=>typeof k!=='string')||Reflect.ownKeys(h).sort().join(',')!=='generation,id,mountId,representation')throw err('INVALID_HANDLE','Invalid handle');const out={};for(const k of ['generation','id','mountId','representation']){const d=Object.getOwnPropertyDescriptor(h,k);if(!d?.enumerable||!Object.hasOwn(d,'value'))throw err('INVALID_HANDLE','Invalid handle');out[k]=d.value;}return out;};
    const ba=capture(body),li=capture(lid),tokenA=owned(ba),tokenB=owned(li),a=enclosureRecords.get(ba.id),b=enclosureRecords.get(li.id);
    if(!a||!b||a.token!==tokenA||b.token!==tokenB||a.role!=='BODY'||b.role!=='LID'||a.pair!==b.pair||a.pair.bodyId!==ba.id||a.pair.lidId!==li.id)throw err('INVALID_BINDING','Enclosure pair does not belong to this live mount');if(a.pair.labelId){const la=capture(label),lt=owned(la),lr=enclosureRecords.get(la.id);if(!lr||lr.token!==lt||lr.role!=='LABEL'||lr.pair!==a.pair||la.id!==a.pair.labelId)throw err('INVALID_BINDING','Enclosure label binding is invalid');}else if(label!==undefined)throw err('INVALID_BINDING','Unlabeled enclosure has no label');return true;
  }
  async function readEnclosureInterface(request,options={}) {
    validOptions(options);
    const keys=['op','version','body','lid','label','maxDeviationMm'];
    if(!request||typeof request!=='object'||Reflect.ownKeys(request).length!==keys.length||Reflect.ownKeys(request).some(k=>typeof k!=='string'||!keys.includes(k)))throw err('INVALID_REQUEST','Invalid enclosure interface request');
    const captured={};for(const k of keys){const d=Object.getOwnPropertyDescriptor(request,k);if(!d?.enumerable||!Object.hasOwn(d,'value'))throw err('INVALID_REQUEST','Invalid interface request fields');captured[k]=d.value;}
    if(captured.op!=='solid.enclosure.interface'||captured.version!==1)throw err('INVALID_REQUEST','Invalid enclosure interface request');
    const copyHandle=h=>{const ks=['generation','id','mountId','representation'];if(!h||typeof h!=='object'||Reflect.ownKeys(h).length!==ks.length||Reflect.ownKeys(h).some(k=>typeof k!=='string'||!ks.includes(k)))throw err('INVALID_HANDLE','Invalid handle');const out={};for(const k of ks){const d=Object.getOwnPropertyDescriptor(h,k);if(!d?.enumerable||!Object.hasOwn(d,'value'))throw err('INVALID_HANDLE','Invalid handle');out[k]=d.value;}return out;};
    const body=copyHandle(captured.body),lid=copyHandle(captured.lid),label=copyHandle(captured.label),maxDeviationMm=captured.maxDeviationMm;
    assertEnclosureBinding(body,lid,label);
    const br=enclosureRecords.get(body.id),lr=enclosureRecords.get(lid.id),rr=enclosureRecords.get(label.id),bt=owned(body),lt=owned(lid),rt=owned(label),pair=br.pair;
    if(!pair.interfaceEvidence)throw err('INVALID_BINDING','An inset label is required');
    const check=()=>{assertEnclosureBinding(body,lid,label);if(enclosureRecords.get(body.id)!==br||enclosureRecords.get(lid.id)!==lr||enclosureRecords.get(label.id)!==rr||owned(body)!==bt||owned(lid)!==lt||owned(label)!==rt)throw err('INVALID_BINDING','Enclosure binding changed');};
    await readEnclosureManufacturingMesh({op:'solid.enclosure.manufacturing-mesh',version:1,handle:lid,maxDeviationMm},options);check();
    await readEnclosureManufacturingMesh({op:'solid.enclosure.manufacturing-mesh',version:1,handle:label,maxDeviationMm},options);check();
    const response=await send({kind:'enclosure-interface',bodyToken:bt,lidToken:lt,labelToken:rt,maxDeviationMm},'result',options.signal);
    try {
      check();if(Object.keys(response).sort().join(',')!=='bodyToken,commonVolume,kind,labelToken,lidToken,maxSeparationMm,minSharedAreaMm2,seq,surfaceCount'||response.bodyToken!==bt||response.lidToken!==lt||response.labelToken!==rt||response.surfaceCount!==5||!Number.isFinite(response.commonVolume)||!Object.is(response.commonVolume,pair.interfaceEvidence.commonVolume)||!Number.isFinite(response.maxSeparationMm)||response.maxSeparationMm<0||response.maxSeparationMm>maxDeviationMm||!Number.isFinite(response.minSharedAreaMm2)||response.minSharedAreaMm2<=0)throw Error();
      return Object.freeze({version:1,quality:'paired-planar-contact-v1',roles:Object.freeze(['LID','LABEL']),unit:'millimeter',maxDeviationMm,commonVolume:response.commonVolume,surfaceCount:5,maxSeparationMm:response.maxSeparationMm,minSharedAreaMm2:response.minSharedAreaMm2});
    } catch {shutdown('ENGINE_FAILURE','Invalid enclosure interface response');throw err('ENGINE_FAILURE','Invalid enclosure interface response');}
  }
  async function readEnclosureManufacturingMesh(request,options={}) {
    validOptions(options);if(!enclosure)throw err('UNSUPPORTED_OPERATION','Enclosure manufacturing requires a qualified engine mount');
    if(!request||typeof request!=='object'||Reflect.ownKeys(request).some(k=>typeof k!=='string')||Reflect.ownKeys(request).sort().join(',')!=='handle,maxDeviationMm,op,version')throw err('INVALID_REQUEST','Invalid manufacturing mesh request');
    for(const k of ['handle','maxDeviationMm','op','version']){const d=Object.getOwnPropertyDescriptor(request,k);if(!d?.enumerable||!Object.hasOwn(d,'value'))throw err('INVALID_REQUEST','Invalid request fields');}
    if(request.op!=='solid.enclosure.manufacturing-mesh'||request.version!==1)throw err('INVALID_REQUEST','Invalid manufacturing mesh request');
    const input=request.handle,copy={};if(!input||typeof input!=='object'||Reflect.ownKeys(input).some(k=>typeof k!=='string')||Reflect.ownKeys(input).sort().join(',')!=='generation,id,mountId,representation')throw err('INVALID_HANDLE','Invalid handle');
    for(const k of ['generation','id','mountId','representation']){const d=Object.getOwnPropertyDescriptor(input,k);if(!d?.enumerable||!Object.hasOwn(d,'value'))throw err('INVALID_HANDLE','Invalid handle');copy[k]=d.value;}
    if(state!=='ready')throw err('MOUNT_CLOSED','Engine mount is closed');if(pending)throw err('BUSY','Engine operation pending');if(options.signal?.aborted)throw err('CANCELLED','Engine request cancelled');
    const token=owned(copy),record=enclosureRecords.get(copy.id),engineName=mesh?'manifold':'occ',tolerance=request.maxDeviationMm;if(!record||record.token!==token)throw err('INVALID_HANDLE','Not an enclosure handle');
    try{validateEnclosureManufacturingRequest(record.plan,record.role,engineName,tolerance);}catch(e){throw err(e?.code||'INVALID_REQUEST',String(e?.message||'Invalid manufacturing request'));}
    if(record.manufacturing && record.manufacturing.evidence.maxDeviationMm!==tolerance)throw err('UNSUPPORTED_PRECISION','Use a fresh reconstruction for a different deviation.');
    if(!record.manufacturing){const response=await send({kind:'enclosure-manufacturing',token,maxDeviationMm:tolerance},'result',options.signal);
      try{
        if(Object.keys(response).sort().join(',')!=='evidence,kind,role,seq,token,trianglesBuffer,verticesBuffer'||owned(copy)!==token||enclosureRecords.get(copy.id)!==record||response.token!==token||response.role!==record.role)throw Error();
        const vb=response.verticesBuffer,tb=response.trianglesBuffer,e=response.evidence;
        if(!(vb instanceof ArrayBuffer)||!(tb instanceof ArrayBuffer)||vb.byteLength<96||vb.byteLength>384*24||vb.byteLength%24||tb.byteLength<48||tb.byteLength>128*12||tb.byteLength%12)throw Error();
        if(!e||Object.keys(e).sort().join(',')!=='engine,maxDeviationMm,observedPlaneDeviationMm,role,surfaceCount,triangleCount,unit,version,vertexCount,volume'||e.version!==1||e.role!==record.role||e.unit!=='millimeter'||e.engine!==engineName||e.maxDeviationMm!==tolerance||!Number.isFinite(e.observedPlaneDeviationMm)||e.observedPlaneDeviationMm<0||e.observedPlaneDeviationMm>tolerance||!Number.isFinite(e.volume)||e.volume<=0||e.vertexCount!==vb.byteLength/24||e.triangleCount!==tb.byteLength/12||e.surfaceCount!==(record.role==='LABEL'?6:record.role==='LID'&&record.plan.label?16:11))throw Error();
        const vertices=new Float64Array(vb),indices=new Uint32Array(tb);for(const x of vertices)if(!Number.isFinite(x)||Math.abs(x)>1e6)throw Error();for(let i=0;i<indices.length;i+=3){const a=indices[i],b=indices[i+1],c=indices[i+2];if(a>=e.vertexCount||b>=e.vertexCount||c>=e.vertexCount||a===b||b===c||c===a)throw Error();}
        record.manufacturing={vertices:vb,triangles:tb,evidence:Object.freeze({...e})};
      }catch {shutdown('ENGINE_FAILURE','Invalid manufacturing mesh response');throw err('ENGINE_FAILURE','Invalid manufacturing mesh response');}}
    const data=record.manufacturing;return {contractVersion:1,op:'solid.enclosure.manufacturing-mesh',role:record.role,unit:'millimeter',quality:'planar-boundary-checked-v1',vertices:new Float64Array(data.vertices.slice(0)),triangles:new Uint32Array(data.triangles.slice(0)),evidence:data.evidence};
  }
  async function readEnclosureMesh(request,options={}) {
    validOptions(options);if(!enclosure)throw err('UNSUPPORTED_OPERATION','Enclosure mesh requires a qualified engine mount');
    if(!request||typeof request!=='object'||Reflect.ownKeys(request).some(k=>typeof k!=='string')||Reflect.ownKeys(request).sort().join(',')!=='handle,op,version')throw err('INVALID_REQUEST','Invalid enclosure mesh request');
    for(const k of ['handle','op','version']){const d=Object.getOwnPropertyDescriptor(request,k);if(!d?.enumerable||!Object.hasOwn(d,'value'))throw err('INVALID_REQUEST','Invalid request fields');}
    if(request.op!=='solid.enclosure.mesh'||request.version!==1)throw err('INVALID_REQUEST','Invalid enclosure mesh request');
    const input=request.handle,copy={};if(!input||typeof input!=='object'||Reflect.ownKeys(input).some(k=>typeof k!=='string')||Reflect.ownKeys(input).sort().join(',')!=='generation,id,mountId,representation')throw err('INVALID_HANDLE','Invalid handle');
    for(const k of ['generation','id','mountId','representation']){const d=Object.getOwnPropertyDescriptor(input,k);if(!d?.enumerable||!Object.hasOwn(d,'value'))throw err('INVALID_HANDLE','Invalid handle');copy[k]=d.value;}
    if(state!=='ready')throw err('MOUNT_CLOSED','Engine mount is closed');if(pending)throw err('BUSY','Engine operation pending');if(options.signal?.aborted)throw err('CANCELLED','Engine request cancelled');
    const token=owned(copy),record=enclosureRecords.get(copy.id);if(!record||record.token!==token)throw err('INVALID_HANDLE','Not an enclosure handle');
    if(!record.buffer){const response=await send({kind:'enclosure-mesh',token},'result',options.signal);
      try{if(Object.keys(response).sort().join(',')!=='buffer,kind,role,seq,token,triangleCount'||owned(copy)!==token||enclosureRecords.get(copy.id)!==record||response.token!==token||response.role!==record.role)throw Error();validateEnclosureMesh(response.buffer,response.triangleCount,record.evidence);record.buffer=response.buffer;record.count=response.triangleCount;}catch {shutdown('ENGINE_FAILURE','Invalid enclosure mesh response');throw err('ENGINE_FAILURE','Invalid enclosure mesh response');}}
    return {contractVersion:1,op:'solid.enclosure.mesh',role:record.role,unit:'millimeter',quality:mesh?'manifold-float32-preview-unqualified':'kernel-display-preview-unqualified',triangleCount:record.count,buffer:record.buffer.slice(0)};
  }
  async function extrudeProfile(request,options={}) {
    const requestTopology=validOptions(options,!!profile);
    if(!profile) throw err('UNSUPPORTED_OPERATION','Profile extrusion is not bound by this mount');
    if(!request || typeof request!=='object' || Object.keys(request).sort().join(',')!=='op,profile,version' || request.op!=='solid.profile.extrude' || request.version!==1) throw err('INVALID_REQUEST','Invalid profile request');
    const p=request.profile,keys=['version','unit','engine','revision','sketchDigest','faceId','regionId','frame','depth','sketchJSON'];
    if(!p || typeof p!=='object' || Array.isArray(p) || Reflect.ownKeys(p).sort().join(',')!==keys.sort().join(',')) throw err('INVALID_REQUEST','Invalid bounded profile request');
    const copied={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(p,key);if(!d?.enumerable || !Object.hasOwn(d,'value'))throw err('INVALID_REQUEST','Profile fields must be data');copied[key]=d.value;}
    if(typeof copied.sketchJSON!=='string' || copied.sketchJSON.length>1048576 || typeof copied.regionId!=='string' || copied.regionId.length>8192 || typeof copied.revision!=='string' || copied.revision.length>256 || typeof copied.faceId!=='string' || copied.faceId.length>256 || typeof copied.sketchDigest!=='string' || copied.sketchDigest.length!==64 || !copied.frame || Reflect.ownKeys(copied.frame).sort().join(',')!=='origin,x,y,z') throw err('INVALID_REQUEST','Invalid bounded profile request');
    if(copied.engine!=='occ')throw err('UNSUPPORTED_ENGINE','This mount only accepts OCC profiles');
    const frame={};for(const key of ['origin','x','y','z']){const field=Object.getOwnPropertyDescriptor(copied.frame,key),array=field?.value;
      if(!field?.enumerable||!Object.hasOwn(field,'value')||!Array.isArray(array)||array.length!==3||Reflect.ownKeys(array).sort().join(',')!=='0,1,2,length')throw err('INVALID_REQUEST','Invalid frame data');
      frame[key]=[0,1,2].map(i=>{const d=Object.getOwnPropertyDescriptor(array,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value')||!Number.isFinite(d.value))throw err('INVALID_REQUEST','Invalid frame data');return d.value;});
    }copied.frame=frame;
    if(options.signal?.aborted)throw err('CANCELLED','Engine request cancelled');
    const token=reserve(), response=await send({kind:'profile-extrude',token,profile:copied,...(requestTopology?{researchTopology:{version:1}}:{})},'result',options.signal);
    const evidence=checkEvidence(response.evidence),v=response.provenance;let descriptor;
    try {descriptor=JSON.parse(copied.regionId.slice('sketch-region:'.length));}catch{}
    const topology=evidence.topologySummary;
    if(Object.keys(evidence).sort().join(',')!=='bounds,faces,signedVolume,topologySummary,triangleOrientationConsistent,triangles,triangulatedClosed' || evidence.faces!==6 || evidence.triangulatedClosed!==true || evidence.triangleOrientationConsistent!==true || evidence.signedVolume<=0 ||
       !topology || Object.keys(topology).sort().join(',')!=='curveTypes,edgeFieldNames,edgeUseCounts,loopLengths,surfaceTypes,uniqueEdgeGroups' ||
       !dense(topology.surfaceTypes,6) || topology.surfaceTypes.some(x=>x!=='PLANE') || !dense(topology.loopLengths,6) || topology.loopLengths.some(x=>!dense(x,1)||x[0]!==4) ||
       topology.uniqueEdgeGroups!==12 || !dense(topology.edgeUseCounts,12) || topology.edgeUseCounts.some(n=>n!==2) || JSON.stringify(topology.curveTypes)!=='["B-SPLINE"]' || JSON.stringify(topology.edgeFieldNames)!=='["a","b","curve","curveBounds","inverted","tess"]' ||
       !v || Object.keys(v).sort().join(',')!=='edgeFaces,faceId,regionId,revision,sketchDigest' || v.revision!==copied.revision || v.sketchDigest!==copied.sketchDigest || v.faceId!==copied.faceId || v.regionId!==copied.regionId || !dense(descriptor?.outer,4) || descriptor.outer.some(id=>typeof id!=='string'||!id) || new Set(descriptor.outer).size!==4 || !dense(v.edgeFaces,4) || new Set(v.edgeFaces.map(e=>e?.faceOrdinal)).size!==4 || v.edgeFaces.some(e=>!e || Object.keys(e).sort().join(',')!=='baseEdgeReversed,binding,faceInverted,faceOrdinal,sourceEdgeId,sourceReversed' || typeof e.sourceReversed!=='boolean' || typeof e.baseEdgeReversed!=='boolean' || typeof e.faceInverted!=='boolean' || !descriptor.outer.includes(e.sourceEdgeId) || e.binding!=='kernel-history-and-geometric-match' || !Number.isInteger(e.faceOrdinal) || e.faceOrdinal<0 || e.faceOrdinal>=6) || new Set(v.edgeFaces.map(e=>e.sourceEdgeId)).size!==4) {shutdown('ENGINE_FAILURE','Invalid profile evidence');throw err('ENGINE_FAILURE','Invalid profile evidence');}
    // Return a fresh allowlisted record; no native ptr/ref or extra Worker data
    // can escape even if a malformed response carries extra array properties.
    const safeEvidence={faces:evidence.faces,triangles:evidence.triangles,bounds:{min:[...evidence.bounds.min],max:[...evidence.bounds.max]},signedVolume:evidence.signedVolume,triangulatedClosed:true,triangleOrientationConsistent:true,
      topologySummary:{surfaceTypes:[...topology.surfaceTypes],loopLengths:topology.loopLengths.map(row=>[...row]),edgeFieldNames:[...topology.edgeFieldNames],curveTypes:[...topology.curveTypes],uniqueEdgeGroups:topology.uniqueEdgeGroups,edgeUseCounts:[...topology.edgeUseCounts]}};
    const provenance={revision:v.revision,sketchDigest:v.sketchDigest,faceId:v.faceId,regionId:v.regionId,edgeFaces:v.edgeFaces.map(e=>({sourceEdgeId:e.sourceEdgeId,sourceReversed:e.sourceReversed,baseEdgeReversed:e.baseEdgeReversed,faceOrdinal:e.faceOrdinal,faceInverted:e.faceInverted,binding:e.binding}))};
    let portableTopology;
    if(requestTopology){try{portableTopology=validatePortableEnvelope(response.portableTopology,provenance,safeEvidence);}catch{shutdown('ENGINE_FAILURE','Invalid portable topology');throw err('ENGINE_FAILURE','Invalid portable topology');}}
    const handle=makeHandle(token),result={contractVersion:1,op:'solid.profile.extrude',handle,evidence:safeEvidence,provenance};
    if(requestTopology){const binding={revision:provenance.revision,sketchDigest:provenance.sketchDigest,faceId:provenance.faceId,regionId:provenance.regionId};portableRecords.set(handle.id,{binding:JSON.stringify(binding),topology:JSON.stringify(portableTopology),provenance:structuredClone(provenance),evidence:structuredClone(safeEvidence)});result.portableTopology=portableTopology;}
    return result;
  }
  function assertPortableBinding(handle,binding,topology) {
    if(state!=='ready')throw err('MOUNT_CLOSED','Engine mount is closed');if(pending)throw err('BUSY','Engine operation pending');owned(handle);const record=portableRecords.get(handle.id);
    try{if(!record||!binding||Reflect.ownKeys(binding).sort().join(',')!=='faceId,regionId,revision,sketchDigest')throw Error();const values={};for(const k of ['revision','sketchDigest','faceId','regionId']){const d=Object.getOwnPropertyDescriptor(binding,k);if(!d?.enumerable||!Object.hasOwn(d,'value')||typeof d.value!=='string')throw Error();values[k]=d.value;}if(JSON.stringify(values)!==record.binding||JSON.stringify(validatePortableEnvelope(topology,record.provenance,record.evidence))!==record.topology)throw Error();}catch{throw err('INVALID_BINDING','Portable topology does not match this live handle');}return true;
  }
  async function centeredThroughHole(input,options={}) {
    validOptions(options);if(!centeredCut)throw err('UNSUPPORTED_OPERATION','Centered analytic hole requires the pinned OCC profile runtime');
    const fields=(value,keys)=>{if(!value||typeof value!=='object'||Array.isArray(value)||Reflect.ownKeys(value).length!==keys.length||Reflect.ownKeys(value).some(k=>typeof k!=='string'||!keys.includes(k)))throw err('INVALID_REQUEST','Invalid centered hole fields');const out={};for(const k of keys){const d=Object.getOwnPropertyDescriptor(value,k);if(!d?.enumerable||!Object.hasOwn(d,'value'))throw err('INVALID_REQUEST','Centered hole fields must be data');out[k]=d.value}return out};
    const outer=fields(input,['op','version','parent','request']);if(outer.op!=='solid.profile.centered-through-hole'||outer.version!==1)throw err('INVALID_REQUEST','Invalid centered hole operation');
    const request=fields(outer.request,['version','unit','revision','sketchDigest','faceId','regionId','diameter']);
    if(request.version!==1||request.unit!=='millimeter'||!Number.isFinite(request.diameter)||request.diameter<=0||request.diameter>1e6||['revision','sketchDigest','faceId','regionId'].some(k=>typeof request[k]!=='string'))throw err('INVALID_REQUEST','Invalid centered hole intent');
    const parent=fields(outer.parent,['generation','id','mountId','representation']);const parentToken=owned(parent),parentRecord=portableRecords.get(parent.id);if(!parentRecord)throw err('INVALID_BINDING','Parent lacks captured authored topology');const previous=JSON.parse(parentRecord.binding);if(['revision','sketchDigest','faceId','regionId'].some(k=>request[k]!==previous[k]))throw err('INVALID_BINDING','Parent source binding changed');
    if(options.signal?.aborted)throw err('CANCELLED','Engine request cancelled');const token=reserve(),response=await send({kind:'research-centered-cut',parent:parentToken,token,request},'result',options.signal);try{if(owned(parent)!==parentToken||portableRecords.get(parent.id)!==parentRecord)throw Error()}catch{shutdown('ENGINE_FAILURE','Parent changed during centered hole');throw err('ENGINE_FAILURE','Parent changed during centered hole')}
    const binding={unit:'millimeter',revision:request.revision,sketchDigest:request.sketchDigest,faceId:request.faceId,regionId:request.regionId,diameter:request.diameter};let text,topology;
    try{if(JSON.stringify(response.binding)!==JSON.stringify(binding))throw Error();topology=copyDrilledTopology(response.portableTopology);text=JSON.stringify(topology);const e=response.evidence;if(!e||!Number.isFinite(e.analyticVolume)||e.analyticVolume<=0||!Number.isFinite(e.meshVolume)||e.meshVolume<=0||!Number.isSafeInteger(e.triangleCount)||e.triangleCount<1||e.triangleCount>10000||e.rimCount!==2||![e.bounds?.min,e.bounds?.max].every(finite3)||!dense(e.parentFaceDescendants,6)||new Set(e.parentFaceDescendants).size!==6||e.parentFaceDescendants.some(n=>!Number.isSafeInteger(n)||n<1||n>7))throw Error()}catch{shutdown('ENGINE_FAILURE','Invalid centered hole response');throw err('ENGINE_FAILURE','Invalid centered hole response')}
    const handle=makeHandle(token),e=response.evidence,evidence={bounds:{min:[...e.bounds.min],max:[...e.bounds.max]},analyticVolume:e.analyticVolume,meshVolume:e.meshVolume,triangleCount:e.triangleCount,rimCount:2,parentFaceDescendants:[...e.parentFaceDescendants]};holeRecords.set(handle.id,{parentId:parent.id,parentToken,binding:JSON.stringify(binding),topology:text});return {contractVersion:1,op:outer.op,handle,evidence,portableTopology:topology,binding};
  }
  function assertCenteredHoleBinding(handle,parent,binding,topology){
    if(state!=='ready')throw err('MOUNT_CLOSED','Engine mount is closed');if(pending)throw err('BUSY','Engine operation pending');owned(handle);const parentToken=owned(parent),record=holeRecords.get(handle.id);
    try{if(!record||record.parentId!==parent.id||record.parentToken!==parentToken||!binding||Reflect.ownKeys(binding).sort().join(',')!=='diameter,faceId,regionId,revision,sketchDigest,unit')throw Error();const v={};for(const k of ['unit','revision','sketchDigest','faceId','regionId','diameter']){const d=Object.getOwnPropertyDescriptor(binding,k);if(!d?.enumerable||!Object.hasOwn(d,'value'))throw Error();v[k]=d.value}if(JSON.stringify(v)!==record.binding||JSON.stringify(copyDrilledTopology(topology))!==record.topology)throw Error()}catch{throw err('INVALID_BINDING','Centered hole does not match this live parent and result')};return true;
  }
  async function fourCornerThroughHoles(input,options={}) {
    validOptions(options);
    if(!fourCornerCut)throw err('UNSUPPORTED_OPERATION','Four-corner analytic holes require their pinned research OCC runtime');
    let outer,request,parent,parentToken,parentRecord,sourceRecord;
    try {
      if(!input||typeof input!=='object'||Array.isArray(input)||Reflect.ownKeys(input).sort().join(',')!=='op,parent,request,version')throw Error();
      outer={};for(const k of ['op','version','parent','request']){const d=Object.getOwnPropertyDescriptor(input,k);if(!d?.enumerable||!Object.hasOwn(d,'value'))throw Error();outer[k]=d.value;}
      if(outer.op!=='solid.profile.four-corner-through-holes'||outer.version!==1)throw Error();
      request=captureFourCornerRequest(outer.request);
      if(!outer.parent||Reflect.ownKeys(outer.parent).sort().join(',')!=='generation,id,mountId,representation')throw Error();
      parent={};for(const k of ['generation','id','mountId','representation']){const d=Object.getOwnPropertyDescriptor(outer.parent,k);if(!d?.enumerable||!Object.hasOwn(d,'value'))throw Error();parent[k]=d.value;}
    } catch {throw err('INVALID_REQUEST','Invalid four-corner intent');}
    parentToken=owned(parent);parentRecord=holeRecords.get(parent.id);
    if(!parentRecord)throw err('INVALID_BINDING','Parent is not a retained centered hole');
    const source=JSON.parse(parentRecord.binding);
    if(['unit','revision','sketchDigest','faceId','regionId'].some(k=>source[k]!==request[k]))throw err('INVALID_BINDING','Parent source binding changed');
    sourceRecord=portableRecords.get(parentRecord.parentId);
    if(!sourceRecord||handles.get(parentRecord.parentId)!==parentRecord.parentToken)throw err('INVALID_BINDING','Centered hole source is no longer live');
    if(options.signal?.aborted)throw err('CANCELLED','Engine request cancelled');
    const token=reserve(),response=await send({kind:'research-four-corner-cut',parent:parentToken,token,request},'result',options.signal);
    try{if(owned(parent)!==parentToken||holeRecords.get(parent.id)!==parentRecord||portableRecords.get(parentRecord.parentId)!==sourceRecord||handles.get(parentRecord.parentId)!==parentRecord.parentToken)throw Error();}
    catch{shutdown('ENGINE_FAILURE','Parent changed during corner holes');throw err('ENGINE_FAILURE','Parent changed during corner holes');}
    const binding={unit:'millimeter',revision:request.revision,sketchDigest:request.sketchDigest,faceId:request.faceId,regionId:request.regionId,featureId:request.featureId,parentFeatureId:request.parentFeatureId,centerFeatureId:request.centerFeatureId,sideIds:request.sideIds,offsetX:request.offsetX,offsetY:request.offsetY,diameter:request.diameter,centerDiameter:source.diameter};
    let topology,text,evidence;
    try {
      if(JSON.stringify(captureFourCornerBinding(response.binding))!==JSON.stringify(binding))throw Error();
      topology=copyFourCornerTopology(response.portableTopology);text=JSON.stringify(topology);
      const e=response.evidence;
      if(!e||Object.keys(e).sort().join(',')!=='analyticVolume,bounds,meshVolume,parentFaceDescendants,rimCount,triangleCount'||!Number.isFinite(e.analyticVolume)||e.analyticVolume<=0||!Number.isFinite(e.meshVolume)||e.meshVolume<=0||!Number.isSafeInteger(e.triangleCount)||e.triangleCount<1||e.triangleCount>10000||e.rimCount!==10||![e.bounds?.min,e.bounds?.max].every(finite3)||!dense(e.parentFaceDescendants,7)||new Set(e.parentFaceDescendants).size!==7||e.parentFaceDescendants.some(n=>!Number.isSafeInteger(n)||n<1||n>11))throw Error();
      evidence={bounds:{min:[...e.bounds.min],max:[...e.bounds.max]},analyticVolume:e.analyticVolume,meshVolume:e.meshVolume,triangleCount:e.triangleCount,parentFaceDescendants:[...e.parentFaceDescendants],rimCount:10};
    } catch {shutdown('ENGINE_FAILURE','Invalid four-corner response');throw err('ENGINE_FAILURE','Invalid four-corner response');}
    const handle=makeHandle(token);
    cornerRecords.set(handle.id,{parentId:parent.id,parentToken,sourceId:parentRecord.parentId,sourceToken:parentRecord.parentToken,parentRecord,sourceRecord,binding:JSON.stringify(binding),topology:text});
    return {contractVersion:1,op:outer.op,handle,evidence,portableTopology:topology,binding};
  }
  function assertFourCornerBinding(handle,parent,binding,topology) {
    if(state!=='ready')throw err('MOUNT_CLOSED','Engine mount is closed');
    if(pending)throw err('BUSY','Engine operation pending');
    owned(handle);const parentToken=owned(parent),record=cornerRecords.get(handle.id);
    try {
      if(!record||record.parentId!==parent.id||record.parentToken!==parentToken||holeRecords.get(parent.id)!==record.parentRecord||portableRecords.get(record.sourceId)!==record.sourceRecord||handles.get(record.sourceId)!==record.sourceToken)throw Error();
      if(JSON.stringify(captureFourCornerBinding(binding))!==record.binding||JSON.stringify(copyFourCornerTopology(topology))!==record.topology)throw Error();
    } catch {throw err('INVALID_BINDING','Corner holes do not match their live parent and result');}
    return true;
  }
  function execute(request,options={}) {
    // Dispatch obeys the same data-only boundary as operation capture.
    let op,version;
    try {
      if(!request||typeof request!=='object'||Array.isArray(request))throw err('INVALID_REQUEST','Engine requests require data fields');
      const operation=Object.getOwnPropertyDescriptor(request,'op');
      if(!operation?.enumerable||!Object.hasOwn(operation,'value'))throw err('INVALID_REQUEST','Operation must be an own data field');
      op=operation.value;
      if(op==='solid.profile.extrude'){
        const discriminator=Object.getOwnPropertyDescriptor(request,'version');
        if(!discriminator?.enumerable||!Object.hasOwn(discriminator,'value'))throw err('INVALID_REQUEST','Profile version must be an own data field');
        version=discriminator.value;
      }
    } catch(error) { return Promise.reject(error); }
    if (op==='solid.profile.extrude.extents') return extrudeProfileExtents(request,options);
    if (op==='solid.manufacturing.mesh.read') return readManufacturingMesh(request,options);
    if (op==='solid.drawing.orthographic.read') return readOrthographic(request,options);
    if (op==='solid.face.frame.read') return readPlanarAttachment(request,options);
    if (op==='solid.drawing.bores.read') return readDrawingBores(request,options);
    if (op==='solid.drawing.derived.read') return readDrawingDerived(request,options);
    if (op==='solid.drawing.references.read') return readDrawingReferences(request,options);
    if (op==='solid.step.export') return exportSTEP(request,options);
    if (op==='solid.mesh.read') return readSolidMesh(request,options);
    if (op==='solid.topology.read') return readSolidTopology(request,options);
    if (op==='solid.point.classify') return classifySolidPoint(request,options);
    if (op==='solid.selections.read') return readSolidSelections(request,options);
    if (op==='solid.prism.selections.read') return readPrismSelections(request,options);
    if (op==='solid.holes.pattern.linear') return linearThroughHolePattern(request,options);
    if (op==='solid.holes.counterbore') return counterboreSolidHole(request,options);
    if (op==='solid.holes.blind') return blindSolidHole(request,options);
    if (op==='solid.holes.through') return throughSolidHoles(request,options);
    if (op==='solid.shell') return shellSolid(request,options);
    if (op==='solid.edge.treat') return treatSolidEdges(request,options);
    if (op==='solid.enclosure.interface') return readEnclosureInterface(request,options);
    if (op==='solid.enclosure.manufacturing-mesh') return readEnclosureManufacturingMesh(request,options);
    if (op==='solid.enclosure.mesh') return readEnclosureMesh(request,options);
    if (op==='solid.enclosure.create') return createEnclosure(request,options);
    if (op==='solid.profile.loft') return loftSelectedProfiles(request,options);
    if (op==='solid.profile.sweep') return sweepSelectedProfile(request,options);
    if (op==='solid.profile.revolve') return revolveSelectedProfile(request,options);
    if(op==='solid.profile.extrude.bound'){if(profileSourceBindingVersion!==1)throw err('UNSUPPORTED_OPERATION','This cohort has no bound constructor path');let captured;try{captured=captureBoundProfileConstructor(request);}catch(cause){throw err(cause.code||'INVALID_REQUEST',cause.message,cause);}return extrudeSelectedProfile(captured.request,options,captured);}
    if (op==='solid.profile.extrude') return version===2||version===3||version===4?extrudeSelectedProfile(request,options):extrudeProfile(request,options);
    if (op==='solid.profile.centered-through-hole') return centeredThroughHole(request,options);
    if (op==='solid.profile.four-corner-through-holes') return fourCornerThroughHoles(request,options);
    if (op==='solid.box.create') return box(request,options);
    if (['solid.boolean.common','solid.boolean.union','solid.boolean.subtract'].includes(op)) return boolean(request,options);
    if (op==='solid.dispose') return dispose(request,options);
    return Promise.reject(err('UNSUPPORTED_OPERATION','Operation is not bound by this mount'));
  }
  function close(){clearTimeout(initTimer);shutdown('MOUNT_CLOSED','Engine mount closed');if(cleanupFailure)throw cleanupFailure.cause;}
  return Object.freeze({descriptor,ready,execute,box,boolean,dispose,extrudeProfileExtents,treatSolidEdges,shellSolid,blindSolidHole,counterboreSolidHole,throughSolidHoles,readSolidMesh,exportSTEP,readOrthographic,readDrawingDerived,readDrawingReferences,readDrawingBores,readManufacturingMesh,readSolidTopology,classifySolidPoint,readPrismSelections,readSolidSelections,assertSolidBinding,createEnclosure,readEnclosureMesh,readEnclosureManufacturingMesh,readEnclosureInterface,assertEnclosureBinding,centeredThroughHole,fourCornerThroughHoles,assertPortableBinding,assertCenteredHoleBinding,assertFourCornerBinding,close});
}
