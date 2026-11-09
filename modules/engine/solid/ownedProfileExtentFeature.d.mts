export type ProfileExtentValue=number|string;
export type ProfileExtent<T=ProfileExtentValue>=
 |Readonly<{extent:'one-sided';distance:T}>
 |Readonly<{extent:'symmetric';length:T}>
 |Readonly<{extent:'two-sided';positive:T;negative:T}>;
export type OwnedProfileExtentFeature<T=ProfileExtentValue>=Readonly<{version:1;unit:'millimeter';engine:'occ';engineRevision:string;featureId:number;faceId:string;regionId:string;bodyPolicy:'separate'}>&ProfileExtent<T>;
export const PROFILE_EXTENT_TYPE:'WORKER_SELECTED_PROFILE_EXTENT_EXTRUDE_V1';
export const PROFILE_EXTENT_FIELDS:Readonly<Record<'one-sided'|'symmetric'|'two-sided',readonly string[]>>;
export function profileExtentFields(input:unknown):readonly string[];
export function profileExtentValueValid(mode:unknown,key:unknown,value:unknown,allowName?:boolean):boolean;
export function captureProfileExtent(input:unknown,options:{numeric:true}):ProfileExtent<number>;
export function captureProfileExtent(input:unknown,options?:{numeric?:false}):ProfileExtent;
export function profileExtentInterval(input:unknown):Readonly<{lower:number;upper:number;span:number}>;
export function captureOwnedProfileExtentFeature(input:unknown):OwnedProfileExtentFeature;
export function profileExtentDimensions(input:unknown):ProfileExtent;
export function materializeOwnedProfileExtentFeature(input:unknown,expressions:any,materialized?:any):Readonly<{authored:OwnedProfileExtentFeature;resolved:OwnedProfileExtentFeature<number>}>;
export function profileExtentFromFields(input:unknown,options?:{numeric?:boolean}):ProfileExtent;
