/** Structural transport only. A captured reply grants no proof/source/edit authority. */
import type {PreparedFiniteCurve,RawFiniteCurveReadResult} from '../../../../modules/engine/mount/finiteCurveReadProtocol.mjs';
import type {FiniteCurveCertificateDomain,FiniteCurveMathematicalCertificate} from '../../../../modules/engine/mount/finiteCurveFiniteCertificate.mjs';
export const FINITE_CURVE_CERTIFICATE_ENVELOPE_LIMITS:Readonly<{bytes:65536;nodes:1024;depth:16;integerHexDigits:4096;work:500000}>;
export type FiniteCurveCertificateRequest=Readonly<{
 revision:string;
 curves:readonly [PreparedFiniteCurve,PreparedFiniteCurve];
 raw:RawFiniteCurveReadResult;
 domain:FiniteCurveCertificateDomain;
}>;
export type FiniteCurveCertificateFailure=Readonly<{
 code:string;message:string;
 cause?:Readonly<
  {kind:'algebraic-contradiction';basis:'exact-reduced-row'}|
  {kind:'approximate-reduction-rejection';basis:'approximate-reduced-row'}|
  {kind:'original-residual-failure';basis:'original-equations'}|
  {kind:'invalid-domain';basis:'domain-check'}|
  {kind:'numerical-convergence-failure';basis:'solver-status'}|
  {kind:'nonfinite-result';basis:'finite-check'}|
  {kind:'resource-limit';basis:'resource-check'}|
  {kind:'retained-validation-failure';basis:'retained-validation'}|
  {kind:'unclassified-rejection';basis:'admission-membership'}
 >;
}>;
export type FiniteCurveCertificateReply=Readonly<
 {revision:string;ok:true;certificate:FiniteCurveMathematicalCertificate}|
 {revision:string;ok:false;error:FiniteCurveCertificateFailure}
>;
/** Complete request bound: 64KiB UTF-8 JSON, 1024 value nodes, maximum depth16. */
export function captureFiniteCurveCertificateRequest(value:unknown):FiniteCurveCertificateRequest;
/** Must receive the exact captured ORIGINAL request held across the Worker await. */
export function captureFiniteCurveCertificateReply(value:unknown,originalRequest:FiniteCurveCertificateRequest):FiniteCurveCertificateReply;
