/** Structural transport only; no actual-source authority or numerical certificate. */
export const FINITE_CURVE_READ_LIMITS: Readonly<{curves:2;inputCapacity:64;actualValues:24;rawPoints:8;responseBytes:65536}>;
export type FiniteCurveReadErrorCode = "CURVE_QUERY_INVALID_REQUEST"|"CURVE_QUERY_UNCERTAIN"|"CURVE_QUERY_RESOURCE_LIMIT"|"CURVE_QUERY_INPUT_CHANGED"|"CURVE_QUERY_PUBLICATION_FAILED"|"CURVE_QUERY_FAILED"|"ENGINE_CLEANUP_FAILED";
export const FINITE_CURVE_READ_ERROR_CODES: readonly FiniteCurveReadErrorCode[];
export type FinitePoint2 = readonly [number,number];
export type PreparedFiniteCurve = Readonly<{id:string;stage:number;curve:
 Readonly<{kind:"segment";a:FinitePoint2;b:FinitePoint2}> |
 Readonly<{kind:"circle";center:FinitePoint2;radius:number}> |
 Readonly<{kind:"arc";a:FinitePoint2;b:FinitePoint2;center:FinitePoint2;radius:number;startRadians:number;endRadians:number;sense:"ccw"}>
}>;
export type EncodedFiniteCurveReadInput = Readonly<{
 curves:readonly [PreparedFiniteCurve,PreparedFiniteCurve];
 values:readonly number[];inputBits:readonly string[];algorithmOrder:readonly [0|1,0|1];
}>;
type RawFiniteCurveDomain = Readonly<{first:number;last:number;parameterUnit:"millimeter"|"radian";fullCircle:boolean}>;
export type RawFiniteCurveBasis = Readonly<{origin:FinitePoint2;domain:RawFiniteCurveDomain;evaluatedEnds:readonly [FinitePoint2,FinitePoint2]} & (
 {sourceKind:"segment";geometry:"line";direction:FinitePoint2} |
 {sourceKind:"circle"|"arc";geometry:"circle";x:FinitePoint2;y:FinitePoint2;radius:number;direct:true}
)>;
export type RawFiniteCurvePoint = Readonly<{point:FinitePoint2;firstParameter:number} & (
 {secondIsImplicit:true;secondParameter:null}|{secondIsImplicit:false;secondParameter:number}
)>;
export type RawFiniteCurveReadResult = Readonly<{
 version:1;kind:"analytic-support-query";scope:"response-local";persistentIds:false;coordinateUnit:"millimeter";
 algorithm:Readonly<{name:"IntAna2d_AnaIntersection";occtVersion:"7.6.0"}>;
 inputBits:readonly string[];bases:readonly [RawFiniteCurveBasis,RawFiniteCurveBasis];algorithmOrder:readonly [0|1,0|1];
} & (
 {flags:Readonly<{done:false;empty:null;identical:null;parallel:null}>;rawPointCount:null;rawPoints:readonly []} |
 {flags:Readonly<{done:true;empty:boolean;identical:boolean;parallel:boolean}>;rawPointCount:number;rawPoints:readonly RawFiniteCurvePoint[]}
)>;
export type RawFiniteCurveReadError = Readonly<{version:1;error:FiniteCurveReadErrorCode}>;
export function encodeFiniteCurveReadInput(value:unknown):EncodedFiniteCurveReadInput;
export function captureFiniteCurveReadResult(value:unknown,input:EncodedFiniteCurveReadInput):RawFiniteCurveReadResult;
/** Caller MUST independently settle the invocation/exchange first. A known packet cannot swallow a thrown invocation. */
export function captureFiniteCurveReadError(value:unknown):RawFiniteCurveReadError;
