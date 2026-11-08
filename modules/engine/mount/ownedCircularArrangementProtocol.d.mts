export type CircularRelation='disjoint'|'external-tangent'|'proper-overlap'|'nested-0'|'nested-1'|'coincident';
export type Pair2=readonly[number,number];
export interface CircularCellRequest {
 readonly op:'solid.profile.extrude';readonly version:4;readonly unit:'millimeter';readonly depth:number;
 readonly frame:Readonly<{origin:readonly[number,number,number];x:readonly[number,number,number];y:readonly[number,number,number];z:readonly[number,number,number]}>;
 readonly region:Readonly<{id:string;faceId:string;circles:readonly Readonly<{id:string;center:Pair2;radius:number}>[];descriptor:Readonly<Record<string,unknown>>}>;
}
export interface CircularFragment {readonly center:Pair2;readonly a:Pair2;readonly b:Pair2;readonly first:number;readonly last:number;readonly orientation:'FORWARD';}
export interface CircularNativeUse {readonly span:number;readonly fragment:number;readonly orientation:'FORWARD'|'REVERSED';}
export interface CircularNativeObservation {
 readonly version:1;readonly unit:'millimeter';readonly scope:'response-local';readonly relation:CircularRelation;readonly sourceCount:2;
 readonly events:readonly Readonly<{branch:'left'|'right'|'tangent';point:Pair2;owners:readonly number[]}>[];
 readonly spans:readonly Readonly<{owners:readonly number[];range:'full'|'inside-other'|'outside-other';ends:readonly string[];fragments:readonly CircularFragment[]}>[];
 readonly cells:readonly Readonly<{mask:number;area:number;bounds:Readonly<{min:Pair2;max:Pair2}>;outer:readonly CircularNativeUse[];holes:readonly(readonly CircularNativeUse[])[]}>[];
}
export const CIRCULAR_NATIVE_ERRORS:readonly string[];
export const CIRCULAR_LIMITS:Readonly<Record<string,number>>;
export function circularFields(value:unknown,keys:readonly string[]):Record<string,any>;
export function circularArray(value:unknown,min:number,max:number):any[];
export function captureCircularCellRequest(value:unknown):CircularCellRequest;
export function captureCircularProfileEvaluation(value:unknown):Readonly<{version:1;unit:'millimeter';engine:'occ';engineRevision:string;featureId:number;profile:CircularCellRequest}>;
export function captureNativeCircularObservation(value:unknown):CircularNativeObservation;
export function circularNativeStatus(code:number):string|null;

export function captureCircularConstructionCertificate(input:unknown,request:CircularCellRequest):Readonly<{status:"available";data:Readonly<Record<string,unknown>>;sourceBinding:Readonly<{scope:"solved-request";regionId:string;boundaryKind:"circular-source-spans";circularArrangementVersion:1}>}>;

export type CircularNativeFailureStage='capture'|'construct'|'observe'|'create'|'cap-mapping'|'source-edge-mapping'|'first-edge-mapping'|'last-edge-mapping'|'generated-history'|'swept-face-membership'|'fragment-closure'|'final-closure'|'receipt'|'input-verification'|'publication';
export interface CircularNativeFailure {readonly version:1;readonly error:string;readonly stage:CircularNativeFailureStage;}
export const CIRCULAR_NATIVE_FAILURE_STAGES:readonly CircularNativeFailureStage[];
export function captureNativeCircularFailure(input:unknown,status:number):CircularNativeFailure;
