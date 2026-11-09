import type {OwnedCountersinkIntent} from './ownedCountersinkIntent.mjs';
import type {BoundProfileConstructor,ProfileConstructorBinding} from '../mount/profileConstructorSourceBinding.mjs';
import type {OwnedCounterboreIntent} from './ownedCounterboreIntent.mjs';
import type {ProfileExtentIntent,ProfileExtentBinding} from '../mount/ownedProfileExtentPlan.mjs';
import type {OwnedBlindHoleIntent} from './ownedBlindHoleIntent.mjs';
// The bounded common solid API. The application owns authored graph/history;
// a kernel owns transient shapes for one candidate evaluation. Additional
// operations require explicit inputs and capability evidence; this interface
// does not imply extrusion, fillet, STEP or manufacturing qualification.
import type {OwnedLinearHolePatternIntent} from './ownedLinearHolePatternIntent.mjs';
import type {OwnedHoleIntent} from './ownedHoleIntent.mjs';
export type SolidKernelId='occ'|'manifold'|'smlib';
export type SolidRepresentation='occ-brep-worker-owned'|'manifold-mesh-worker-owned'|'smlib-brep-worker-owned';
export type Vector3=readonly [number,number,number];
export interface TransientShapeHandle {
 readonly mountId:string;readonly generation:1;
 readonly representation:SolidRepresentation;readonly id:string;
}
export interface KernelOperationOptions {readonly signal?:AbortSignal;}
export interface KernelBounds {readonly min:Vector3;readonly max:Vector3;}
export type SolidResultKind='empty'|'single-material'|'multi-material'|'single-solid'|'multi-solid'|'mesh-container'|'unclassified-nonempty';
export interface NativeTopologyCensus {
 readonly version:1;readonly method:'occ-topology-census-v1';
 readonly shapeType:number;readonly directChildren:number;
 readonly counts:Readonly<{compounds:number;compsolids:number;solids:number;shells:number;faces:number;wires:number;edges:number;vertices:number}>;
}
// Provider-specific observations. Missing/null means unknown; a mesh component
// is not automatically a solid, material region, printable object or part.
export interface SolidResultFacts {
 readonly nativeVolume?:number;readonly nativeBounds?:KernelBounds|null;
 readonly resultKind?:SolidResultKind;
 readonly solidCount?:number|null;readonly materialRegions?:number|null;
 readonly voidRegions?:number|null;readonly meshComponents?:number|null;
 readonly validLevel0?:boolean|null;readonly validLevel2?:boolean|null;
 readonly manifoldPredicate?:boolean|null;
 readonly nativeValidity?:Readonly<{method:'occ-inspect-analytic-v1'|'occ-owned-solid-v2';valid:boolean}>|null;
 readonly nativeTopology?:NativeTopologyCensus|null;
 readonly nativeStatus?:'NoError'|null;
 readonly volumeQuality?:'empty'|'tessellation-signed-integral'|'mesh-kernel-volume'|'native-relative-0.001'|'native-undefined-nonmanifold';
}
export type SolidEvidence=SolidResultFacts & (
 Readonly<{volume:number|null;bounds:KernelBounds|null}> |
 Readonly<{signedVolume:number;bounds:KernelBounds|null;faces:number;triangles:number;empty?:boolean}> |
 Readonly<{empty:boolean;volume:number;bounds:KernelBounds|null;vertices:number;triangles:number;components:number}>);
export interface CreateBox {
 readonly op:'solid.box.create';readonly version:1;readonly unit:'millimeter';
 readonly origin:Vector3;readonly dimensions:Vector3;
 readonly featureId?:never;
}
// Internal constructor provenance only on a build declaring
// boxConstructionVersion1. Existing cohorts retain CreateBox exactly.
export interface CreateAuthoredBox extends Omit<CreateBox,'featureId'> {readonly featureId:number;}
export interface BooleanSolidOperands {
 readonly op:'solid.boolean.union'|'solid.boolean.common'|'solid.boolean.subtract';
 readonly version:1;readonly unit:'millimeter';
 readonly a:TransientShapeHandle;readonly b:TransientShapeHandle;
}
// Runtime identity selects one exact protocol. Partial producer bindings must
// not silently satisfy the legacy variant of the common request union.
export interface BooleanSolid extends BooleanSolidOperands {
 readonly featureId?:never;readonly producerAFeatureId?:never;readonly producerBFeatureId?:never;
}
export interface BooleanHistorySolid extends BooleanSolidOperands {
 readonly featureId:number;readonly producerAFeatureId:number;readonly producerBFeatureId:number;
}
// One selected, already-resolved authored region. Loops are ordered in local
// coordinates; authored IDs provide identity rather than traversal order.
// Version 1 is reserved for the legacy rectangle research envelope.
export type ProfileCurve =
 Readonly<{kind:'segment';id:string;a:readonly [number,number];b:readonly [number,number]}> |
 Readonly<{kind:'circle';id:string;center:readonly [number,number];radius:number}>;
export interface ExtrudeSelectedProfile {
 readonly op:'solid.profile.extrude';readonly version:2;readonly unit:'millimeter';
 readonly frame:Readonly<{origin:Vector3;x:Vector3;y:Vector3;z:Vector3}>;
 readonly depth:number;
 readonly region:Readonly<{id:string;outer:ReadonlyArray<ProfileCurve>;holes:ReadonlyArray<ReadonlyArray<ProfileCurve>>}>;
}
export interface ReadSolidMesh {readonly op:'solid.mesh.read';readonly version:1;readonly handle:TransientShapeHandle;}
export interface SourceSpanReference {readonly kind:'source-span';readonly owners:readonly string[];readonly ends:readonly [Readonly<{incidentCurveIds:readonly string[]}>,Readonly<{incidentCurveIds:readonly string[]}>];}
export interface ArrangementBoundaryReference {readonly id:string;readonly sourceSpan:SourceSpanReference;}
export interface RectangleArrangementCellDescriptor {readonly version:2;readonly kind:'axis-rectangle-arrangement-cell';readonly outerBoundaryRefs:readonly ArrangementBoundaryReference[];readonly holeBoundaryRefs:readonly [];readonly coveringSourceLoops:readonly (readonly string[])[];}
export interface RectangleContactCellDescriptor {readonly version:3;readonly kind:'axis-rectangle-contact-cell';readonly sourceCurveIds:readonly string[];readonly outerBoundaryRefs:readonly ArrangementBoundaryReference[];readonly holeBoundaryRefs:readonly [];}
export type ArrangementCellDescriptor=RectangleArrangementCellDescriptor|RectangleContactCellDescriptor;
export interface ArrangementBoundaryProvenance {readonly version:1;readonly kind:'axis-rectangle-arrangement';readonly faceId:string;readonly descriptor:ArrangementCellDescriptor;}
export interface ExtrudePolygonProfile extends Omit<ExtrudeSelectedProfile,'version'|'region'> {readonly version:3;readonly region:ExtrudeSelectedProfile['region']&Readonly<{boundaryProvenance?:ArrangementBoundaryProvenance}>;}
// Depth-free solved-region input. Authored history stores source/region/axis
// identities and angle; this evaluated request and native handles are transient.
export interface RevolveSelectedProfile extends Omit<ExtrudePolygonProfile,'op'|'version'|'depth'> {
 readonly op:'solid.profile.revolve';readonly version:1;
 readonly source:Readonly<{faceId:string;sourceSha256:string}>;
 readonly axis:Readonly<{kind:'source-segment';id:string;a:readonly [number,number];b:readonly [number,number]}>;
 readonly angleRadians:number;
}
// The path is authored on its own source plane. Arc a→b is the source CCW
// branch; reversed traverses that same branch backwards, never its complement.
export type DirectedSourcePathCurve =
 Readonly<{kind:'segment';id:string;a:readonly [number,number];b:readonly [number,number];reversed:boolean}> |
 Readonly<{kind:'arc';id:string;a:readonly [number,number];b:readonly [number,number];c:readonly [number,number];reversed:boolean}>;
export interface SweepSelectedProfile extends Omit<ExtrudePolygonProfile,'op'|'version'|'depth'> {
 readonly op:'solid.profile.sweep';readonly version:1;
 readonly source:Readonly<{faceId:string;sourceSha256:string}>;
 readonly path:Readonly<{source:Readonly<{faceId:string;sourceSha256:string}>;
  frame:ExtrudeSelectedProfile['frame'];curves:ReadonlyArray<DirectedSourcePathCurve>}>;
 readonly transport:'corrected-frenet';
}
// Transient solved sections only. History retains authored source, region
// and seam identities; polygon start ordinals never belong in saved documents.
export interface LoftSelectedSection {
 readonly source:Readonly<{faceId:string;sourceSha256:string}>;
 readonly frame:ExtrudeSelectedProfile['frame'];
 readonly region:ExtrudeSelectedProfile['region'];
}
export interface LoftSelectedProfiles {
 readonly op:'solid.profile.loft';readonly version:1;readonly unit:'millimeter';
 readonly sections:readonly [LoftSelectedSection,LoftSelectedSection];
 readonly correspondence:Readonly<{kind:'polygon'|'circle';startA:number;reverseA:boolean;startB:number;reverseB:boolean}>;
 readonly construction:'ruled-solid';
}
export interface ReadSolidTopology {readonly op:'solid.topology.read';readonly version:1;readonly handle:TransientShapeHandle;}
export interface ClassifySolidPoint {readonly op:'solid.point.classify';readonly version:1;readonly unit:'millimeter';readonly handle:TransientShapeHandle;readonly point:Vector3;}
export interface ReadPrismSelections {readonly op:'solid.prism.selections.read';readonly version:1;readonly handle:TransientShapeHandle;readonly featureId:number;}
export interface ReadSolidSelections {readonly op:'solid.selections.read';readonly version:1;readonly handle:TransientShapeHandle;readonly featureId:number;}
export interface TreatSolidEdges {readonly op:'solid.edge.treat';readonly version:1;readonly unit:'millimeter';readonly handle:TransientShapeHandle;readonly producerFeatureId:number;readonly featureId:number;readonly kind:'fillet'|'chamfer-equal';readonly edgeIds:readonly string[];readonly size:number;}
// Opaque authored face IDs resolve only against the private current parent.
// Native indices and detached-copy/history certificates never enter this API.
export interface ShellSolid {readonly op:'solid.shell';readonly version:1;readonly unit:'millimeter';readonly handle:TransientShapeHandle;readonly featureId:number;readonly producerFeatureId:number;readonly removedFaceIds:readonly string[];readonly thickness:number;readonly direction:'inward';}
// Authored hole fields remain exactly the shared intent. Handles are private
// runtime inputs; tool coordinates/depth are derived anew for every replay.
export type KernelCountersink=OwnedCountersinkIntent&Readonly<{op:'solid.holes.countersink';handle:TransientShapeHandle;sourceHandle:TransientShapeHandle}>;
export type KernelCounterbore=OwnedCounterboreIntent&Readonly<{op:'solid.holes.counterbore';handle:TransientShapeHandle;sourceHandle:TransientShapeHandle}>;
export type KernelBlindHole=OwnedBlindHoleIntent&Readonly<{op:'solid.holes.blind';handle:TransientShapeHandle;sourceHandle:TransientShapeHandle}>;
export type KernelThroughHole=OwnedHoleIntent&Readonly<{op:'solid.holes.through';handle:TransientShapeHandle;sourceHandle:TransientShapeHandle}>;
export type KernelLinearHolePattern=OwnedLinearHolePatternIntent&Readonly<{op:'solid.holes.pattern.linear';handle:TransientShapeHandle;sourceHandle:TransientShapeHandle}>;
export interface PrismSelectionsResult {readonly contractVersion:1;readonly op:'solid.prism.selections.read';readonly unit:'millimeter';readonly selection:Readonly<{status:'available';plan:Readonly<{version:1;featureId:number;regionId:string;scope:'authored-source';edges:ReadonlyArray<Readonly<Record<string,unknown>>>;faces:ReadonlyArray<Readonly<Record<string,unknown>>>;unresolved:ReadonlyArray<Readonly<Record<string,unknown>>>}>}>|Readonly<{status:'unavailable';reason:string}>;}
export type SelectionKind='vertex'|'edge'|'face';
export interface SketchProfileSelectionContext {
 readonly kind:'sketch-profile';readonly featureId:number;readonly regionId:string;
}
export interface SketchProfileExtentSelectionContext {readonly kind:'sketch-profile-extent';readonly featureId:number;readonly regionId:string;}
export interface BoxConstructionSelectionContext {
 readonly kind:'box';readonly featureId:number;readonly regionId:null;
}
export interface SelectionDescriptorV2 {
 readonly id:string;readonly role:string;readonly geometry:string;readonly originFeatureId:number;
 readonly curveId?:string;readonly incidentCurveIds?:readonly [string,string];
 readonly boundaryRef?:ArrangementBoundaryReference;readonly incidentBoundaryRefs?:readonly [ArrangementBoundaryReference,ArrangementBoundaryReference];
 readonly sourceEdgeId?:string;readonly kind?:'fillet'|'chamfer-equal';
}
export type SelectionDeletionEvidence=boolean|
 readonly [Readonly<{input:0|1;reportedDeleted:boolean}>]|
 readonly [Readonly<{input:0;reportedDeleted:boolean}>,Readonly<{input:1;reportedDeleted:boolean}>];
export interface UnresolvedSelectionV2 {
 readonly kind:SelectionKind;readonly id:string;
 readonly reason:'NO_DESCENDANT'|'MULTIPLE_DESCENDANTS'|'MERGED_DESCENDANT';
 readonly candidateCount:number;readonly reportedDeleted:SelectionDeletionEvidence;
 /** First failure, not the latest result producer. */
 readonly featureId:number;readonly originFeatureId:number;
}
export interface UnclaimedSelectionV2 {
 readonly kind:SelectionKind;readonly count:number;readonly reason:'UNCLAIMED_KERNEL_ENTITY';
}
// Deliberate semantic retirement by a shell feature. This reports no native
// deletion flag or descendant count; actual kernel relations remain separate.
export interface AuthoredRemovalSelectionV2 {
 readonly kind:'face';readonly id:string;readonly reason:'AUTHORED_REMOVAL';
 readonly sourceFeatureId:number;readonly featureId:number;readonly originFeatureId:number;
}
export interface SelectionPlanV2 {
 readonly version:2;readonly featureId:number;readonly scope:'authored-source';
 readonly source:'prism-construction-history'|'profile-extent-construction-history'|'box-construction-history'|'kernel-operation-history';
 readonly sourceContexts:ReadonlyArray<SketchProfileSelectionContext|SketchProfileExtentSelectionContext|BoxConstructionSelectionContext>;
 readonly vertices:ReadonlyArray<SelectionDescriptorV2>;readonly edges:ReadonlyArray<SelectionDescriptorV2>;readonly faces:ReadonlyArray<SelectionDescriptorV2>;
 readonly unresolved:ReadonlyArray<UnresolvedSelectionV2|AuthoredRemovalSelectionV2|UnclaimedSelectionV2>;
}
export type SolidSelectionUnavailableReason='NOT_A_PRISM_RESULT'|
 'PROFILE_PROVENANCE_UNSUPPORTED'|'PROFILE_PROVENANCE_RESOURCE_LIMIT'|'PROFILE_PROVENANCE_FAILED'|
 'SELECTION_RESOURCE_LIMIT'|'SELECTION_UNAVAILABLE'|'NO_AUTHORED_SOURCE_SELECTIONS'|
 'BOOLEAN_HISTORY_UNSUPPORTED'|'BOOLEAN_HISTORY_RESOURCE_LIMIT'|'BOOLEAN_HISTORY_FAILED';
export interface SolidSelectionsResult {
 readonly contractVersion:1;readonly op:'solid.selections.read';readonly unit:'millimeter';
 readonly selection:Readonly<{status:'available';plan:SelectionPlanV2}>|Readonly<{status:'unavailable';reason:SolidSelectionUnavailableReason}>;
}
// Response-local native indices are observations, never persistent selections.
export interface NativeTopologyObservation {
 readonly version:1;readonly scope:'response-local';readonly persistentIds:false;readonly valid:true;readonly solidCount:number;
 readonly vertices:ReadonlyArray<Readonly<{index:number;point:Vector3}>>;
 readonly edges:ReadonlyArray<Readonly<Record<string,unknown>>>;
 readonly faces:ReadonlyArray<Readonly<Record<string,unknown>>>;
}
export interface TopologyResult {readonly contractVersion:1;readonly op:'solid.topology.read';readonly unit:'millimeter';readonly catalog:NativeTopologyObservation;}
export interface PointClassificationResult {readonly contractVersion:1;readonly op:'solid.point.classify';readonly unit:'millimeter';readonly classification:'inside'|'outside'|'boundary'|'unknown';}
export type ConstructionProvenance=
 Readonly<{status:'available';data:Readonly<{version:1;scope:'response-local';persistentIds:false;kind:'circular-cell-prism';relation:string;mask:number;resultCounts:Readonly<{edges:number;faces:number;vertices:number}>}>;sourceBinding:Readonly<{scope:'solved-request';regionId:string;boundaryKind:'circular-source-spans';circularArrangementVersion:1}>}>|
 Readonly<{status:'unavailable';reason:'PROFILE_PROVENANCE_UNSUPPORTED'|'PROFILE_PROVENANCE_RESOURCE_LIMIT'|'PROFILE_PROVENANCE_FAILED'}>|
 Readonly<{status:'available';data:Readonly<Record<string,unknown>>;sourceBinding:Readonly<{scope:'solved-request';regionId:string;boundaryKind?:'source-spans';nativeSlotBindings:ReadonlyArray<Readonly<{
  loop:number;edges:ReadonlyArray<Readonly<{source:number;curveId:string;nativeReversed:boolean}>|Readonly<{source:number;boundaryRef:ArrangementBoundaryReference;nativeReversed:boolean}>>;
  vertices:ReadonlyArray<Readonly<{source:number;incidentCurveIds:readonly [string,string]}>|Readonly<{source:number;incidentBoundaryRefs:readonly [ArrangementBoundaryReference,ArrangementBoundaryReference]}>>;
 }>>}>}>;
export interface DisposeSolid {readonly op:'solid.dispose';readonly version:1;readonly handle:TransientShapeHandle;}
export interface ExportOwnedSTEP {readonly op:'solid.step.export';readonly version:1;readonly unit:'millimeter';readonly handles:ReadonlyArray<TransientShapeHandle>;}
export interface STEPBlobResult {readonly contractVersion:1;readonly op:'solid.step.export';readonly unit:'millimeter';readonly blob:Blob;readonly metadata:Readonly<{format:'step';schema:'AP214IS';structure:'geometric-solid-set';byteLength:number;inputShapeCount:number;inputSolidCounts:readonly number[];transferCount:number}>;}
export interface ReadPlanarAttachment {readonly op:'solid.face.frame.read';readonly version:1;readonly unit:'millimeter';readonly handle:TransientShapeHandle;readonly sourceHandle:TransientShapeHandle;readonly producerFeatureId:number;readonly originFeatureId:number;readonly selectionId:string;readonly sourceFeatureId:number;readonly sourceRegionId:string;readonly framePolicy:'extrusion-cap-source-datum-v1'|'profile-extent-cap-source-datum-v1';}
export interface PlanarAttachmentResult {readonly contractVersion:1;readonly op:'solid.face.frame.read';readonly unit:'millimeter';readonly observation:import('../mount/ownedPlanarAttachmentProtocol.mjs').PlanarAttachmentObservation;}
export interface ReadOwnedBores {readonly op:'solid.drawing.bores.read';readonly version:1;readonly unit:'millimeter';readonly handle:TransientShapeHandle;readonly sourceHandle:TransientShapeHandle;readonly producerFeatureId:number;readonly query:import('../../drawing/linkedPartDrawingDefinition.mjs').LinkedPartBoreQuery;}
export interface ReadOwnedDrawingRequirementTargets extends Omit<ReadOwnedBores,'op'> {readonly op:'solid.drawing.requirement-targets.read';}
export interface DrawingRequirementTargetsReadResult {readonly contractVersion:1;readonly op:'solid.drawing.requirement-targets.read';readonly unit:'millimeter';readonly observation:import('../mount/ownedDrawingReadProtocol.mjs').DrawingRequirementTargetsObservation;}
export interface ReadOwnedDrawingRequirements extends Omit<ReadOwnedDrawingReferences,'op'|'definition'> {readonly op:'solid.drawing.requirements.read';readonly definition:import('../mount/ownedDrawingReadProtocol.mjs').DrawingRequirementDefinition;}
export interface DrawingRequirementsReadResult extends Omit<DrawingReferenceReadResult,'op'|'observation'> {readonly op:'solid.drawing.requirements.read';readonly observation:import('../mount/ownedDrawingReadProtocol.mjs').DrawingRequirementReadObservation;}
export interface BoreReferenceReadResult {readonly contractVersion:1;readonly op:'solid.drawing.bores.read';readonly unit:'millimeter';readonly observation:import('../mount/ownedBoreReadProtocol.mjs').BoreReferenceObservation;}
export interface ReadOwnedDrawingDerived {readonly op:'solid.drawing.derived.read';readonly version:1;readonly unit:'millimeter';readonly handle:TransientShapeHandle;readonly sourceHandle:TransientShapeHandle;readonly producerFeatureId:number;readonly definition:import('../../drawing/linkedPartDrawingDefinition.mjs').LinkedPartDrawingDefinition;readonly viewId:string;readonly frame:ReadOwnedOrthographic['frame'];readonly parentFrame:ReadOwnedOrthographic['frame']|null;}
/** Role-specific response-local geometry. No authored identity comes from it. */
export interface DrawingDerivedReadResult {readonly contractVersion:1;readonly op:'solid.drawing.derived.read';readonly unit:'millimeter';readonly viewId:string;readonly status:'available'|'unavailable';readonly reason:string|null;readonly projection:OrthographicReadResult|null;readonly geometry:Readonly<{metadata:any;values:ArrayBuffer;tags:ArrayBuffer}>|Readonly<{metadata:any;intervals:ArrayBuffer}>|null;}
export interface ReadOwnedDrawingReferences {readonly op:'solid.drawing.references.read';readonly version:1;readonly unit:'millimeter';readonly handle:TransientShapeHandle;readonly sourceHandle:TransientShapeHandle;readonly producerFeatureId:number;readonly definition:import('../../drawing/linkedPartDrawingDefinition.mjs').LinkedPartDrawingDefinition;}
export interface DrawingReferenceReadResult {readonly contractVersion:1;readonly op:'solid.drawing.references.read';readonly unit:'millimeter';readonly observation:import('../mount/ownedDrawingReadProtocol.mjs').DrawingReferenceObservation;}
export interface ReadOwnedOrthographic {readonly op:'solid.drawing.orthographic.read';readonly version:1;readonly unit:'millimeter';readonly handle:TransientShapeHandle;readonly frame:Readonly<{origin:Vector3;u:Vector3;v:Vector3;n:Vector3}>;}
/** Derived mutable buffers, never authored IDs or dimension witnesses. */
export interface OrthographicReadResult {readonly contractVersion:1;readonly op:'solid.drawing.orthographic.read';readonly unit:'millimeter';readonly values:ArrayBuffer;readonly tags:ArrayBuffer;readonly metadata:Readonly<{version:1;quality:'native-brep-orthographic';scope:'response-local';persistentIds:false;copyTShapesDisjoint:true;frame:readonly number[];fragmentCount:number;groupCounts:readonly number[];layout:'orthographic-f64le12-u8x4/1';valueBytes:number;tagBytes:number}>;}
/** Derived controlled tessellation; neither authored geometry nor a universal manufacturing certificate. */
export interface ReadOwnedManufacturingMesh {readonly op:'solid.manufacturing.mesh.read';readonly version:1;readonly unit:'millimeter';readonly handle:TransientShapeHandle;readonly linearDeflectionMm:0.01;readonly angularDeflectionRadians:0.1;readonly relative:false;readonly maxVertices:number;readonly maxTriangles:number;}
export interface ManufacturingMeshResult {readonly contractVersion:1;readonly op:'solid.manufacturing.mesh.read';readonly unit:'millimeter';readonly buffer:ArrayBuffer;readonly metadata:Readonly<{version:1;quality:'native-controlled-tessellation';format:'owned-manufacturing-mesh-v1';byteLength:number;vertexCount:number;triangleCount:number;positionsOffset:32;indicesOffset:number;linearDeflectionMm:0.01;angularDeflectionRadians:0.1;relative:false;correspondence:'native-topology-parameters-v1';maxBoundaryDiscrepancyMm:number;sourcePreserved:true}>;}
export type ExtrudeCircularCell=import('../mount/ownedCircularArrangementProtocol.mjs').CircularCellRequest;
export interface ExtrudeProfileExtents {readonly op:'solid.profile.extrude.extents';readonly version:1;readonly unit:'millimeter';readonly request:ProfileExtentIntent;readonly extentBinding:ProfileExtentBinding;}
export type SolidRequest=ReadOwnedDrawingRequirementTargets|ReadOwnedDrawingRequirements|BoundProfileConstructor|ExtrudeProfileExtents|ReadOwnedDrawingDerived|ReadOwnedBores|ExtrudeCircularCell|ReadPlanarAttachment|ReadOwnedDrawingReferences|ReadOwnedManufacturingMesh|ReadOwnedOrthographic|ExportOwnedSTEP|CreateBox|CreateAuthoredBox|BooleanSolid|BooleanHistorySolid|ExtrudeSelectedProfile|ExtrudePolygonProfile|RevolveSelectedProfile|SweepSelectedProfile|LoftSelectedProfiles|ReadSolidMesh|ReadSolidTopology|ClassifySolidPoint|ReadPrismSelections|ReadSolidSelections|TreatSolidEdges|ShellSolid|KernelCountersink|KernelCounterbore|KernelBlindHole|KernelThroughHole|KernelLinearHolePattern|DisposeSolid;
export interface ShapeResult {
 readonly contractVersion:1;readonly op:BoundProfileConstructor['op']|CreateBox['op']|BooleanSolid['op']|ExtrudeProfileExtents['op']|ExtrudeSelectedProfile['op']|RevolveSelectedProfile['op']|SweepSelectedProfile['op']|LoftSelectedProfiles['op']|TreatSolidEdges['op']|ShellSolid['op']|KernelCountersink['op']|KernelCounterbore['op']|KernelBlindHole['op']|KernelThroughHole['op']|KernelLinearHolePattern['op'];
 readonly handle:TransientShapeHandle;readonly evidence:SolidEvidence;
 readonly constructionProvenance?:ConstructionProvenance;
 // Private constructor receipt; not persisted model metadata or a handle.
 readonly sourceCreationBinding?:Readonly<ProfileConstructorBinding>;
}
export interface MeshResult {
 readonly contractVersion:1;readonly op:'solid.mesh.read';readonly unit:'millimeter';
 readonly quality:'display-only';readonly triangleCount:number;
 // Expanded Float64 triangle coordinates, transferred from a real Worker.
 // Derived render data must not be serialized as authored history.
 readonly buffer:ArrayBuffer;readonly evidence:SolidEvidence;
 // Modern providers prepare and validate rendering coordinates off-thread.
 // Preview precision loss does not invalidate the underlying native result.
 readonly displayBuffer?:ArrayBuffer;
 readonly displayStatus?:'available'|'unavailable';
 readonly displayReason?:null|'float32-overflow'|'float32-collapsed-triangle'|'material-orientation-unqualified';
}
export interface DisposeResult {readonly contractVersion:1;readonly op:'solid.dispose';}
export interface SolidKernel {
 readonly descriptor:Readonly<{
  contractVersion:1;engine:string;representation:SolidRepresentation;unit:'millimeter';
  runtimeAssets:Readonly<{jsSha256:string;wasmSha256:string;workerSha256?:string}>;
  operations:ReadonlyArray<Readonly<{id:string;version:number;qualification:string;input?:string;output?:string;selectionPlanVersion?:1|2}>>;
 }>;
 readonly ready:Promise<void>;
 execute(request:SolidRequest,options?:KernelOperationOptions):Promise<DrawingRequirementTargetsReadResult|DrawingRequirementsReadResult|DrawingDerivedReadResult|BoreReferenceReadResult|PlanarAttachmentResult|DrawingReferenceReadResult|ManufacturingMeshResult|OrthographicReadResult|STEPBlobResult|ShapeResult|MeshResult|TopologyResult|PointClassificationResult|PrismSelectionsResult|SolidSelectionsResult|DisposeResult>;
 readSolidMesh(request:ReadSolidMesh,options?:KernelOperationOptions):Promise<MeshResult>;
 assertSolidBinding(handle:TransientShapeHandle):true;
 // Revokes all handles and pending work by terminating the entire Worker.
 close():void;
}
