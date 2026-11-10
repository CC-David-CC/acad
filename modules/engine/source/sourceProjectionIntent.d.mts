export const SOURCE_PROJECTION_TYPE:'SOURCE_PROJECTION_V1';
export type SourceProjectionParameters=Readonly<{version:1;unit:'millimeter';featureId:number;source:Readonly<{featureId:number;faceId:string;objectIds:readonly string[]}>;target:Readonly<{plane:'XY';depth:0}>;outputs:readonly Readonly<{sourceObjectId:string;referenceId:string}>[]}>;
export const SOURCE_PROJECTION_LIMITS:Readonly<{roots:16;sources:64;sourceBytes:65536;history:256;retainedCharacters:32768;replyBytes:65536}>;
export const SOURCE_PROJECTION_CODES:readonly string[];
export function projectionFail(code:string,message:string):never;
export function projectionId(value:unknown):string;
export function projectionArray(value:unknown,minimum?:number,maximum?:number):unknown[];
export function captureSourceProjection(value:unknown):SourceProjectionParameters;
export function projectionSourceText(value:unknown):string;
