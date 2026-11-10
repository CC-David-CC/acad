/** Private pure witness arithmetic; no source or event authority. */
declare const exactCertificateRational:unique symbol;
export type ExactCertificateRational=Readonly<{readonly [exactCertificateRational]:true}>;
export type EncodedCertificateRational=Readonly<{numeratorHex:string;denominatorHex:string}>;
export const FINITE_CURVE_CERTIFICATE_LIMITS:Readonly<{integerBits:16384;work:500000;boxSteps:readonly [1,2,4,8,16,32,64];refinements:64;responseBytes:65536}>;
export interface FiniteCurveCertificateArithmetic {
 integer(value:number):ExactCertificateRational;
 number(value:number):ExactCertificateRational;
 add(a:ExactCertificateRational,b:ExactCertificateRational):ExactCertificateRational;
 sub(a:ExactCertificateRational,b:ExactCertificateRational):ExactCertificateRational;
 mul(a:ExactCertificateRational,b:ExactCertificateRational):ExactCertificateRational;
 div(a:ExactCertificateRational,b:ExactCertificateRational):ExactCertificateRational;
 neg(a:ExactCertificateRational):ExactCertificateRational;
 abs(a:ExactCertificateRational):ExactCertificateRational;
 min(a:ExactCertificateRational,b:ExactCertificateRational):ExactCertificateRational;
 max(a:ExactCertificateRational,b:ExactCertificateRational):ExactCertificateRational;
 cmp(a:ExactCertificateRational,b:ExactCertificateRational):-1|0|1;
 sign(a:ExactCertificateRational):-1|0|1;
 encode(value:ExactCertificateRational):EncodedCertificateRational;
 neighbor(value:number,up:boolean):number|null;
 tick(units?:number):void;
 readonly work:number;
}
export function createFiniteCurveCertificateArithmetic():FiniteCurveCertificateArithmetic;
