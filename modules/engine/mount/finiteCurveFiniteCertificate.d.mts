/** Pure mathematics only: not original-source, document, event or edit authority. */
import type {PreparedFiniteCurve,RawFiniteCurveReadResult,FinitePoint2} from './finiteCurveReadProtocol.mjs';
import type {EncodedCertificateRational as Q} from './finiteCurveCertificateArithmetic.mjs';
export type FiniteCurveCertificateDomain=Readonly<{kind:'finite-pair'}|{kind:'endpoint-ray';targetCurveId:string;endpoint:'a'|'b'}>;
export type FiniteCurveUncertainty='NATIVE_BASIS_UNQUALIFIED'|'ARC_BRANCH_UNCERTAIN'|'ARC_ENDPOINT_INCIDENCE'|'NATIVE_NOT_DONE'|'NATIVE_ROOT_CENSUS'|'NATIVE_FLAGS'|'CANDIDATE_NOT_ENCLOSED'|'ROOTS_NOT_SEPARATED'|'FINITE_DOMAIN_UNRESOLVED';
export const FINITE_CURVE_CERTIFICATE_UNCERTAIN_REASONS:readonly FiniteCurveUncertainty[];
export type FiniteCurveEndpointOccurrence=Readonly<{curveId:string;endpoint:'a'|'b'}>;
export type FiniteCurveMembership=Readonly<{
 curveId:string;location:'endpoint-a'|'endpoint-b'|'interior'|'outside'|'periodic';selectedDomain:boolean;
 /** q(z)'s actual dimensionless Segment parameter, distinct from Native mm. */
 sourceParameter?:Readonly<{origin:Q;coefficient:Q;interval:Readonly<{lower:Q;upper:Q}>}>;
}>;
export type FiniteCurveRootProof=Readonly<{
 nativeIndex:number;candidate:FinitePoint2;multiplicity:1|2;boxSteps:1|2|4|8|16|32|64;refinements:number;
 parameterInterval:Readonly<{lower:Q;upper:Q}>;
 parameterRole:'radical-axis-v'|'dimensionless-source-line-t';
 /** Copied in actual algorithm order; implicit second parameters stay null. */
 nativeParametersRole:'raw-observation-only';
 nativeParameters:readonly [Readonly<{curveId:string;value:number;implicit:false}>,Readonly<{curveId:string;value:number|null;implicit:boolean}>];
 coordinateEnclosure:Readonly<{min:readonly [Q,Q];max:readonly [Q,Q]}>;
 derivativeLower:Q|null;memberships:readonly [FiniteCurveMembership,FiniteCurveMembership];
 /** Distance-only evidence; withinBudget never grants permission to publish. */
 distanceEvidence:Readonly<{budgetMm:5e-8;squaredUpper:Q;withinBudget:boolean}>;
}>;
export type FiniteCurveCircularMarker=Readonly<{
 /** A symbolic periodic cut, not a generated point or selectable event. */
 periodicSeam:boolean;occurrences:readonly FiniteCurveEndpointOccurrence[];
}>;
export type FiniteCurveOverlapProof=Readonly<
 {kind:'periodic-full'}|
 {kind:'linear-contact'|'linear-interval';lower:Q;upper:Q;lowerClosed:boolean;upperClosed:boolean;lowerOccurrences:readonly FiniteCurveEndpointOccurrence[];upperOccurrences:readonly FiniteCurveEndpointOccurrence[]}|
 {kind:'circular-interval';from:FiniteCurveCircularMarker;to:FiniteCurveCircularMarker;wraps:boolean;lowerClosed:true;upperClosed:true}|
 {kind:'circular-contact';at:FiniteCurveCircularMarker}
>;
export type FiniteCurveSupportProof=Readonly<{
 kind:'line-line'|'line-circle'|'circle-circle';rootCount:0|1|2|'continuum';censusWitness:Q;
 witnessRole:'source-determinant'|'quadratic-discriminant'|'squared-center-separation'|'radical-axis-H';commonSupportEquality?:Q;
}>;
type CertificateBase=Readonly<{
 version:1;scope:'pure-mathematical-verification';sourceAuthority:false;editAuthority:false;
 curveIds:readonly [string,string];inputBits:readonly string[];domain:FiniteCurveCertificateDomain;
 work:Readonly<{charged:number;limit:500000}>;
}>;
export type FiniteCurveMathematicalCertificate=CertificateBase&Readonly<
 {status:'uncertain';reason:FiniteCurveUncertainty;nativeIndex:number|null}|
 {status:'certified';kind:'finite-points'|'finite-empty'|'overlap-intervals';support:FiniteCurveSupportProof;intervals:readonly FiniteCurveOverlapProof[];roots:readonly FiniteCurveRootProof[];finiteRootIndices:readonly number[]}
>;
/** Inputs are structurally recaptured. No caller positive proof/owner flags exist. */
export function verifyFiniteCurveCandidates(curves:readonly [PreparedFiniteCurve,PreparedFiniteCurve],raw:RawFiniteCurveReadResult,domain?:FiniteCurveCertificateDomain):FiniteCurveMathematicalCertificate;
