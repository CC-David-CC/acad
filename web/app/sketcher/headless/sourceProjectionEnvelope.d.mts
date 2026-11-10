import type {SourceProjectionParameters} from '../../../../modules/engine/source/sourceProjectionIntent.mjs';
export type ProjectionPoint=Readonly<{x:number;y:number}>;
export type ProjectionFrame=Readonly<{origin:readonly number[];x:readonly number[];y:readonly number[];z:readonly number[]}>;
export type ProjectedReference=Readonly<{sourceObjectId:string;referenceId:string}>&Readonly<
 {kind:'Segment';members:readonly[string,string,string];geometry:Readonly<{a:ProjectionPoint;b:ProjectionPoint}>}|
 {kind:'Circle';members:readonly[string,string];geometry:Readonly<{c:ProjectionPoint;r:number}>}>;
export type ProjectionPreparationSuccess=Readonly<{revision:string;ok:true;frame:ProjectionFrame;serializedSketch:string;sourceSha256:string;bindingSha256:string;roots:readonly ProjectedReference[]}>;
export type ProjectionFailure=Readonly<{revision:string;ok:false;error:Readonly<{code:string;message:string;cause?:Readonly<{kind:string;basis:string}>}>}>;
export type ProjectionPreparationReply=ProjectionPreparationSuccess|ProjectionFailure;
export type ProjectionPreparationInput=Readonly<{revision:string;mode:'prepare'|'validate';parameters:SourceProjectionParameters;sourceJSON:string;sourceFrame:ProjectionFrame;externalParameters:Readonly<Record<string,number>>;existingTargetJSON:string|null}>;
export type ProjectionInspectionInput=Readonly<{revision:string;sourceJSON:string;sourceFrame:ProjectionFrame;externalParameters:Readonly<Record<string,number>>}>;
export type ProjectionInspectionObject=Readonly<{id:string;role:string|null;stage:number}>&Readonly<
 {type:'Segment'|'Circle';canProject:true;reason:null}|
 {type:string;canProject:false;reason:Readonly<{code:'PROJECTION_REFERENCE_GENERATED'|'PROJECTION_REFERENCE_TYPE'|'PROJECTION_COLLAPSED_SEGMENT'|'PROJECTION_CIRCLE_FRAME_UNQUALIFIED'|'PROJECTION_COORDINATE_UNQUALIFIED';message:string}>}>;
export type ProjectionInspectionReply=ProjectionFailure|Readonly<{revision:string;ok:true;sourceSha256:string;objects:readonly ProjectionInspectionObject[]}>;
export function captureProjectionPreparation(value:unknown,verify?:false):ProjectionPreparationInput;
export function captureProjectionPreparation(value:unknown,verify:true):ProjectionPreparationInput&Readonly<{expected:ProjectionPreparationReply}>;
export function captureProjectionPreparationReply(value:unknown,revision:string):ProjectionPreparationReply;
export function captureProjectionInspection(value:unknown):ProjectionInspectionInput;
export function captureProjectionInspectionReply(value:unknown,revision:string):ProjectionInspectionReply;
export function sameProjectionPreparation(a:unknown,b:unknown):boolean;
