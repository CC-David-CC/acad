export interface ProfileConstructorBinding {readonly featureId:number;readonly faceId:string;readonly sourceSha256:string;readonly regionId:string;readonly requestSha256:string;}
export interface ProfileConstructorSource {readonly unit:'millimeter';readonly engine:'occ';readonly profileVersion:3;readonly revision:string;readonly sketchDigest:string;readonly faceId:string;readonly regionId:string;readonly frame:Readonly<{origin:readonly number[];x:readonly number[];y:readonly number[];z:readonly number[]}>;readonly depth:number;readonly sketchJSON:string;}
export interface BoundProfileConstructor {readonly op:'solid.profile.extrude.bound';readonly version:1;readonly source:Readonly<ProfileConstructorSource>;readonly request:import('../solid/SolidKernel').ExtrudePolygonProfile;readonly sourceCreationBinding:Readonly<ProfileConstructorBinding>;}
export const PROFILE_CONSTRUCTOR_BINDING_VERSION:1;
export const PROFILE_CONSTRUCTOR_BINDING_RUNTIME:string;
export function isMechanicalConstructorRuntime(revision:unknown):boolean;
export function constructorFields(value:unknown,keys:readonly string[]):Record<string,unknown>;
export function captureProfileConstructorBinding(value:unknown):Readonly<ProfileConstructorBinding>;
export function sameProfileConstructorBinding(a:unknown,b:unknown):boolean;
export function captureProfileConstructorSource(value:unknown):Readonly<ProfileConstructorSource>;
export function captureBoundProfileConstructor(value:unknown):Readonly<BoundProfileConstructor>;
