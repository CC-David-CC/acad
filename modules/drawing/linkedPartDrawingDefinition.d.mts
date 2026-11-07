/** Metadata admission only; no source/native membership or measured fact proof. */
export const LINKED_DRAWING_MAX_BYTES: 65536;
export const LINKED_DRAWING_MAX_DIMENSIONS: 16;
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
  Readonly<{kind:'hole-diameter';hole:CenterHole}> |
  Readonly<{kind:'hole-offset';axis:DatumAxis;hole:CenterHole}>);
export type LinkedPartDrawingView = Readonly<{viewId:string;basis:'top'|'front'|'right';paperOrigin:PaperPoint;visibility:'visible-and-hidden'}>;
export type LinkedPartDrawingDefinition = Readonly<{
  version:1;unit:'millimeter';drawingId:string;title:string;
  target:Readonly<{featureId:number;operationType:string;engine:'occ';engineRevision:string;output:'complete-native-result'}>;
  datum:Readonly<{featureId:number;faceId:string;regionId:string}>;
  sheet:Readonly<{width:number;height:number;scale:Readonly<{numerator:number;denominator:number}>}>;
  /** One to three unique named bases in top/front/right subsequence order. */
  views:readonly LinkedPartDrawingView[];
  dimensions:readonly LinkedPartDrawingDimension[];
}>;
export function captureLinkedPartDrawingDefinition(value:unknown):LinkedPartDrawingDefinition;
