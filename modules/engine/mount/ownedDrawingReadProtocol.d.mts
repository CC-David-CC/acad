import type {LinkedPartDrawingDefinition,LinkedPartDrawingDimension} from '../../drawing/linkedPartDrawingDefinition.mjs';
export const DRAWING_PROJECTION_LIMITS:Readonly<{views:6;projectionViews:4;perViewPackedBytes:819200;projectionBytes:3276800;sectionBytes:51200;detailBytes:98304;packedBytes:3426304;transferBuffers:11}>;
type V=readonly [number,number,number];
type H=Readonly<{mountId:string;generation:1;representation:'occ-brep-worker-owned';id:string}>;
export type DrawingDimensionObservation=Readonly<{dimensionId:string;kind:LinkedPartDrawingDimension['kind']}&({status:'available';reason:null;quality:'solved-source-datum'|'native-brep-analytic'|'native-prism-cut-lineage';value:number;anchors:readonly [V,V]}|{status:'unresolved';reason:string;quality:null;value:null;anchors:readonly []})>;
export interface DrawingReferenceObservation {readonly version:1;readonly unit:'millimeter';readonly scope:'response-local';readonly quality:'native-bound-drawing-references';readonly drawingId:string;readonly featureId:number;readonly status:'available'|'unresolved';readonly reason:string|null;readonly datumFrame:Readonly<{origin:V;x:V;y:V;z:V}>|null;readonly viewFrames:readonly Readonly<{viewId:string;status?:'available'|'unresolved';reason?:string|null;frame:Readonly<{origin:V;u:V;v:V;n:V}>|null}>[];readonly dimensions:readonly DrawingDimensionObservation[];readonly annotations?:readonly Readonly<{annotationId:string;kind:'bore-center'|'baseline'|'ordinate'|'hole-callout';status:'available'|'unresolved';reason:string|null;quality:'native-prism-cut-lineage'|null;facts:any}>[];}
export interface DrawingReadRequest {readonly op:'solid.drawing.references.read';readonly version:1;readonly unit:'millimeter';readonly handle:H;readonly sourceHandle:H;readonly producerFeatureId:number;readonly definition:LinkedPartDrawingDefinition;}
export function captureDrawingReadRequest(value:unknown):DrawingReadRequest;
export function captureDrawingReadResult(value:unknown,definition:LinkedPartDrawingDefinition):DrawingReferenceObservation;
export function unresolvedDrawingRead(definition:LinkedPartDrawingDefinition,reason:string):DrawingReferenceObservation;
export function drawingFields(value:unknown,keys:readonly string[]):Record<string,any>;

export function captureDrawingObservationData(value:unknown):any;
