export type PrincipalPlaneOrientation='XY'|'XZ'|'ZY';
export type PrincipalPlanePlacementRequest=Readonly<{revision:string;index:number;featureId:number;faceId:string;orientation:PrincipalPlaneOrientation;depth:number}>;
export type PrincipalPlaneOperation=Readonly<{type:'PLANE';params:Readonly<{featureId:number|string;orientation:PrincipalPlaneOrientation;datum:null;depth:number}>}>;
export type PrincipalPlanePlacementDraft=Readonly<{request:PrincipalPlanePlacementRequest;beforeOperation:PrincipalPlaneOperation;afterOperation:PrincipalPlaneOperation;changed:boolean}>;
export type PrincipalPlaneReviewPosition=Readonly<{beforePointer:number;afterPointer:number;beforeSignature:string;afterSignature:string}>;
export type PrincipalPlaneReviewContext=Readonly<{index:number;historyLength:number}>;
/** Pure bounded data capture, never a publication/owner proof. Canonical mm. */
export function capturePrincipalPlanePlacementRequest(value:unknown):PrincipalPlanePlacementRequest;
/** Explicit UI decimal/exponent literal only; never evaluates typed bindings. */
export function capturePrincipalPlaneDepthLiteral(value:unknown):number;
export function capturePrincipalPlanePlacementDraft(value:unknown):PrincipalPlanePlacementDraft;
/** Shape/range only. Actual current J/head and signatures require coordinator proof. */
export function capturePrincipalPlaneReviewPosition(value:unknown,context:unknown):PrincipalPlaneReviewPosition;
export function principalPlaneReviewPositionByteSize(value:unknown,context:unknown):number;
