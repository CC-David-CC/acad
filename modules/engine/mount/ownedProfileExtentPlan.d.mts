import type {ProfileExtent} from '../solid/ownedProfileExtentFeature.mjs';
export const PROFILE_EXTENT_REFUSALS:readonly string[];
export const PROFILE_EXTENT_OPERATION:Readonly<{id:'solid.profile.extrude.extents';version:1;input:'source-owned-profile-extents-mm-v1';output:'oci-shape-result-v1';nativeProfileVersion:3;nativeResultCost:1;variants:readonly ['one-sided','symmetric','two-sided'];capRoles:readonly ['lower-cap','upper-cap'];qualification:'workflow-unqualified'}>;
export interface ProfileExtentBinding {
 readonly version:1;readonly featureId:number;readonly faceId:string;readonly sourceSha256:string;readonly regionId:string;readonly requestSha256:string;
 readonly authoredExtent:ProfileExtent;readonly extent:ProfileExtent<number>;
 readonly interval:Readonly<{lower:number;upper:number;span:number;sourcePlane:'lower-boundary'|'upper-boundary'|'interior'}>;
}
export interface ProfileExtentIntent {
 readonly op:'solid.profile.extrude.extents';readonly version:1;readonly unit:'millimeter';
 readonly source:Readonly<{featureId:number;faceId:string;sourceSha256:string}>;
 readonly authoredExtent:ProfileExtent;readonly extent:ProfileExtent<number>;
 readonly frame:Readonly<{origin:readonly number[];x:readonly number[];y:readonly number[];z:readonly number[]}>;
 readonly region:Readonly<{id:string;outer:readonly any[];holes:readonly (readonly any[])[]}>;
}
export function captureProfileExtentIntent(input:unknown):ProfileExtentIntent;
export function captureProfileExtentBinding(input:unknown):ProfileExtentBinding;
export function sameProfileExtentBinding(a:unknown,b:unknown):boolean;
export function captureProfileExtentEvaluation(input:unknown):Readonly<{version:1;unit:'millimeter';engine:'occ';engineRevision:string;featureId:number;profileExtent:ProfileExtentIntent;extentBinding:ProfileExtentBinding}>;
/** Worker-only source geometry, digest and one Native V3 placed-face payload. */
export function prepareOwnedProfileExtent(input:unknown,expectedRequestSha256?:string):Promise<Readonly<{request:ProfileExtentIntent;binding:ProfileExtentBinding;originalFace:any;frame:any;depth:number;loops:readonly any[];nativeValues:readonly number[];expected:Readonly<{volume:number;bounds:Readonly<{min:readonly number[];max:readonly number[]}>}>}>>;
