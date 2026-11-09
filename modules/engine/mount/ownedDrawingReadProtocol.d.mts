import type {BoreFact} from './ownedBoreReadProtocol.mjs';
import type {LinkedPartDrawingDefinition,LinkedPartDrawingDimension,LinkedPartBoreQuery,NativeFace,BoreAnnotation,LinkedDatumFeature,LinkedManufacturingRequirement} from '../../drawing/linkedPartDrawingDefinition.mjs';
export const DRAWING_PROJECTION_LIMITS:Readonly<{views:6;projectionViews:4;perViewPackedBytes:819200;projectionBytes:3276800;sectionBytes:51200;detailBytes:98304;packedBytes:3426304;transferBuffers:11}>;
type V=readonly [number,number,number];
type H=Readonly<{mountId:string;generation:1;representation:'occ-brep-worker-owned';id:string}>;
export type DrawingDimensionObservation=Readonly<{dimensionId:string;kind:LinkedPartDrawingDimension['kind']}&({status:'available';reason:null;quality:'solved-source-datum'|'native-brep-analytic'|'native-prism-cut-lineage';value:number;anchors:readonly [V,V]}|{status:'unresolved';reason:string;quality:null;value:null;anchors:readonly []})>;
export interface DrawingReferenceObservation {readonly version:1;readonly unit:'millimeter';readonly scope:'response-local';readonly quality:'native-bound-drawing-references';readonly drawingId:string;readonly featureId:number;readonly status:'available'|'unresolved';readonly reason:string|null;readonly datumFrame:Readonly<{origin:V;x:V;y:V;z:V}>|null;readonly viewFrames:readonly Readonly<{viewId:string;status?:'available'|'unresolved';reason?:string|null;frame:Readonly<{origin:V;u:V;v:V;n:V}>|null}>[];readonly dimensions:readonly DrawingDimensionObservation[];readonly annotations?:readonly Readonly<{annotationId:string;kind:'bore-center'|'baseline'|'ordinate'|'hole-callout';status:'available'|'unresolved';reason:string|null;quality:'native-prism-cut-lineage'|null;facts:any}>[];readonly datumFeatures?:readonly DrawingDatumFeatureObservation[];readonly requirements?:readonly DrawingManufacturingRequirementObservation[];}
export interface DrawingReadRequest {readonly op:'solid.drawing.references.read';readonly version:1;readonly unit:'millimeter';readonly handle:H;readonly sourceHandle:H;readonly producerFeatureId:number;readonly definition:LinkedPartDrawingDefinition;}
export function captureDrawingReadRequest(value:unknown):DrawingReadRequest;
export function captureDrawingReadResult(value:unknown,definition:DrawingRequirementDefinition):DrawingRequirementReadObservation;
export function captureDrawingReadResult(value:unknown,definition:LinkedPartDrawingDefinition):DrawingReferenceObservation;
export function unresolvedDrawingRead(definition:DrawingRequirementDefinition,reason:string):DrawingRequirementReadObservation;
export function unresolvedDrawingRead(definition:LinkedPartDrawingDefinition,reason:string):DrawingReferenceObservation;
export function drawingFields(value:unknown,keys:readonly string[]):Record<string,any>;

export function captureDrawingObservationData(value:unknown):any;

/** Response-local Native reference facts; never manufactured conformance. */
export type DrawingSourceFrame = Readonly<{origin:V;x:V;y:V;z:V}>;
export type DrawingPlaneSupport = Readonly<{origin:V;normal:V}>;
export type DrawingRequirementPlaneFacts = Readonly<{support:DrawingPlaneSupport;anchor:V;sourceAxis:'x'|'y'|'z'|null}>;
type DatumFeatureRow<S extends 'A'|'B'|'C',A extends 'x'|'y'|'z'> = Readonly<{annotationId:string;symbol:S} & (
 {status:'available';reason:null;quality:'native-brep-analytic';facts:DrawingRequirementPlaneFacts & Readonly<{sourceAxis:A}>} |
 {status:'unresolved';reason:string;quality:null;facts:null})>;
export type DrawingDatumFeatureObservation = DatumFeatureRow<'A','z'> | DatumFeatureRow<'B','x'> | DatumFeatureRow<'C','y'>;
export type DrawingPositionRequirementFacts = Readonly<{
 datumFrame:DrawingSourceFrame;axisPoint:V;axisDirection:V;axisEnds:readonly [V,V];
 diameter:number;coordinates:V;anchor:V;
}>;
export type DrawingFinishRequirementFacts = Readonly<{support:DrawingPlaneSupport;anchor:V;maximumMillimeters:number}>;
export type DrawingFitRequirementFacts = Readonly<{
 nominalDimensionId:string;nominalDiameter:number;holeLimits:readonly [number,number];
 declaredShaftLimits:readonly [number,number];
 clearance:Readonly<{minimum:number;maximum:number;unit:'millimeter'}>;anchor:V;
}>;
type RequirementRow<K extends 'position-tolerance'|'surface-finish'|'clearance-fit',F> = Readonly<{
 annotationId:string;kind:K;requirementRole:'authored-manufacturing-requirement';
} & (
 {status:'available';reason:null;quality:'native-bound-requirement-reference';facts:F} |
 {status:'unresolved';reason:string;quality:null;facts:null})>;
export type DrawingManufacturingRequirementObservation =
 RequirementRow<'position-tolerance',DrawingPositionRequirementFacts> |
 RequirementRow<'surface-finish',DrawingFinishRequirementFacts> |
 RequirementRow<'clearance-fit',DrawingFitRequirementFacts>;
export type DrawingRequirementDefinition = LinkedPartDrawingDefinition & Readonly<{
 version:4;annotations:readonly BoreAnnotation[];datumFeatures:readonly LinkedDatumFeature[];
 requirements:readonly LinkedManufacturingRequirement[];
}>;
/** Same captured facts as the full read, without projection buffers. */
export type DrawingRequirementReadObservation = DrawingReferenceObservation & Readonly<{
 annotations:NonNullable<DrawingReferenceObservation['annotations']>;
 datumFeatures:readonly DrawingDatumFeatureObservation[];
 requirements:readonly DrawingManufacturingRequirementObservation[];
}>;
export type DrawingRequirementReadRequest = Readonly<Omit<DrawingReadRequest,'op'|'definition'> & {
 op:'solid.drawing.requirements.read';definition:DrawingRequirementDefinition;
}>;
export type DrawingRequirementTargetsRequest = Readonly<{
 op:'solid.drawing.requirement-targets.read';version:1;unit:'millimeter';handle:H;
 sourceHandle:H;producerFeatureId:number;query:LinkedPartBoreQuery;
}>;
export type DrawingRequirementPlaneObservation = Readonly<{reference:NativeFace;sourceRole:string} & (
 {status:'available';reason:null;quality:'native-brep-analytic';facts:DrawingRequirementPlaneFacts} |
 {status:'unresolved';reason:string;quality:null;facts:null})>;
type RequirementTargetsBase = Readonly<{
 version:1;unit:'millimeter';scope:'response-local';quality:'native-bound-drawing-requirement-targets';
 featureId:number;datum:LinkedPartDrawingDefinition['datum'];
}>;
export type DrawingRequirementTargetsObservation = RequirementTargetsBase & Readonly<
 {status:'available';reason:null;sourceFrame:DrawingSourceFrame;
  planes:readonly Extract<DrawingRequirementPlaneObservation,{status:'available'}>[];
  bores:readonly Extract<BoreFact,{status:'available'}>[]} |
 {status:'unresolved';reason:string|null;sourceFrame:DrawingSourceFrame|null;
  planes:readonly DrawingRequirementPlaneObservation[];bores:readonly BoreFact[]}
>;
export function captureDrawingRequirementReadRequest(value:unknown):DrawingRequirementReadRequest;
export function captureDrawingRequirementTargetsRequest(value:unknown):DrawingRequirementTargetsRequest;
export function captureDrawingRequirementTargetsResult(value:unknown,query:LinkedPartBoreQuery):DrawingRequirementTargetsObservation;
export function unresolvedDrawingRequirementTargets(query:LinkedPartBoreQuery,reason:string):Extract<DrawingRequirementTargetsObservation,{status:'unresolved'}>;
