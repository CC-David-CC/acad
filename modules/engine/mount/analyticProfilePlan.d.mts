export type AnalyticCurve=Readonly<{kind:'segment';id:string;a:readonly number[];b:readonly number[];orientation:'forward'|'reversed'}>|Readonly<{kind:'arc';id:string;a:readonly number[];b:readonly number[];center:readonly number[];branch:'proper-ccw'|'full-ccw';orientation:'forward'|'reversed'}>;
export interface AnalyticProfileRequest{readonly op:'solid.profile.extrude';readonly version:5;readonly unit:'millimeter';readonly frame:Readonly<{origin:readonly number[];x:readonly number[];y:readonly number[];z:readonly number[]}>;readonly depth:number;readonly region:Readonly<{id:string;outer:readonly AnalyticCurve[];holes:readonly []}>;}
export const ANALYTIC_PROFILE_VERSION:1;
export const ANALYTIC_PROFILE_LIMITS:Readonly<{sourceCurves:170;loops:1;nativeValues:1546;supportIncidenceMm:1e-9;direction:1e-12}>;
export const ANALYTIC_PROFILE_NATIVE_CODES:readonly string[];
export function analyticProfileFields(value:unknown,keys:readonly string[]):Record<string,any>;
export function captureAnalyticProfileRequest(value:unknown):AnalyticProfileRequest;
export function orderAnalyticProfileLoop(value:unknown):readonly AnalyticCurve[];
export function prepareAnalyticProfileExtrusion(value:unknown):Readonly<{request:AnalyticProfileRequest;frame:AnalyticProfileRequest['frame'];depth:number;loops:readonly any[];nativeValues:readonly number[];expected:Readonly<{volume:number;bounds:Readonly<{min:readonly number[];max:readonly number[]}>}>}>;
