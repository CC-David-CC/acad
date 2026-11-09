/** Metadata admission only; no source/native membership or measured fact proof. */
export const LINKED_DRAWING_MAX_BYTES: 65536;
export const LINKED_DRAWING_MAX_DIMENSIONS: 16;
export const LINKED_DRAWING_MAX_ANNOTATIONS: 16;
export const LINKED_DRAWING_MAX_VIEWS: 6;
export type PaperPoint = readonly [number, number];
export type DatumAxis = 'datum-x' | 'datum-y';
export type SourcePoint = Readonly<{kind:'source-point';featureId:number;faceId:string;regionId:string;curveId:string} & (
  {curveType:'segment';point:'a'|'b'} | {curveType:'circle';point:'center'})>;
export type NativeFace = Readonly<{kind:'native-face';originFeatureId:number;selectionId:string;geometry:'plane'}>;
export type NativeEdge = Readonly<{kind:'native-edge';originFeatureId:number;selectionId:string;geometry:'line'}>;
export type CenterHole = Readonly<{kind:'center-hole';featureId:number;sourceFeatureId:number;faceId:string;regionId:string;slot:'center';geometry:'cylinder'}>;
type DimensionBase = Readonly<{dimensionId:string;viewId:string;label:PaperPoint}>;
export type LinkedPartDrawingDimension = DimensionBase & (
  Readonly<{kind:'source-distance';axis:DatumAxis;from:SourcePoint;to:SourcePoint}> |
  Readonly<{kind:'plane-distance';axis:'datum-normal';first:NativeFace;second:NativeFace}> |
  Readonly<{kind:'edge-length';edge:NativeEdge}> |
  Readonly<{kind:'hole-diameter';hole:CenterHole|BoreReference}> |
  Readonly<{kind:'hole-offset';axis:DatumAxis;hole:CenterHole}>);
export type LinkedPartDrawingView = Readonly<{viewId:string;paperOrigin:PaperPoint} & (
 {basis:'top'|'front'|'right'|'isometric';visibility:'visible-and-hidden'} |
 {basis:'bore-center-section';hole:BoreReference;retainedSide:'positive-datum-y';visibility:'cut-boundary-only'} |
 {basis:'detail';parentViewId:string;focus:BoreReference;aperture:Readonly<{kind:'rectangle';halfWidth:number;halfHeight:number}>;scale:Readonly<{numerator:2;denominator:1}>;visibility:'inherit'})>;
export type BoreReference = Readonly<{kind:'through-hole';featureId:number;sourceFeatureId:number;faceId:string;regionId:string;geometry:'cylinder'} & ({holeKind:'centered-through';slot:'center'}|{holeKind:'four-corner-through';slot:'MIN_X_MIN_Y'|'MAX_X_MIN_Y'|'MAX_X_MAX_Y'|'MIN_X_MAX_Y'})>;
/** Position admits the actual centered-through variant, not legacy CenterHole or corner bores. */
export type CenteredThroughBoreReference = BoreReference & Readonly<{holeKind:'centered-through';slot:'center'}>;
export type BoreAnnotation = Readonly<{annotationId:string;viewId:string} & ({kind:'bore-center';hole:BoreReference;extension:number}|{kind:'baseline'|'ordinate';axis:DatumAxis;holes:readonly BoreReference[];labels:readonly PaperPoint[]}|{kind:'hole-callout';holes:readonly BoreReference[];label:PaperPoint})>;
export type DatumFeatureSymbol = 'A'|'B'|'C';
export type LinkedDatumFeature = Readonly<{annotationId:string;symbol:DatumFeatureSymbol;viewId:string;label:PaperPoint;reference:NativeFace}>;
type RequirementBase = Readonly<{annotationId:string;viewId:string;label:PaperPoint}>;
export type LinkedManufacturingRequirement = RequirementBase & (
 Readonly<{kind:'position-tolerance';target:CenteredThroughBoreReference;zone:Readonly<{kind:'diameter';value:number;unit:'millimeter'}>;datumSymbols:readonly ['A','B','C']}> |
 Readonly<{kind:'surface-finish';target:NativeFace;parameter:'Ra';maximum:Readonly<{value:number;unit:'micrometer'}>}> |
 Readonly<{kind:'clearance-fit';nominalDimensionId:string;hole:Readonly<{lowerDeviation:number;upperDeviation:number}>;declaredShaft:Readonly<{lowerDeviation:number;upperDeviation:number}>;unit:'millimeter'}>);
export type LinkedPartDrawingDefinition = Readonly<{
  version:1|2|3|4;unit:'millimeter';drawingId:string;title:string;
  target:Readonly<{featureId:number;operationType:string;engine:'occ';engineRevision:string;output:'complete-native-result'}>;
  datum:Readonly<{featureId:number;faceId:string;regionId:string}>;
  sheet:Readonly<{width:number;height:number;scale:Readonly<{numerator:number;denominator:number}>}>;
  /** v1: original1..3 orthographic subsequence; v2: exactly top/front/right/isometric. */
  views:readonly LinkedPartDrawingView[];
  dimensions:readonly LinkedPartDrawingDimension[];
  /** Present exactly in v3/v4. Signed ordinate facts are distinct from dimensions. */
  annotations?:readonly BoreAnnotation[];
  /** Present exactly in v4. Combined bore/datum/requirement annotation count<=16. */
  datumFeatures?:readonly LinkedDatumFeature[];
  requirements?:readonly LinkedManufacturingRequirement[];
}>;
export function captureLinkedPartDrawingDefinition(value:unknown):LinkedPartDrawingDefinition;

export type LinkedPartBoreQuery=Readonly<{version:1;unit:'millimeter';target:LinkedPartDrawingDefinition['target'];datum:LinkedPartDrawingDefinition['datum']}>;
export function captureLinkedPartBoreQuery(value:unknown):LinkedPartBoreQuery;
export function captureLinkedPartBoreReference(value:unknown,datum:LinkedPartDrawingDefinition['datum']):BoreReference;
