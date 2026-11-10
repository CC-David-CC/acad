export type ArcBranch='proper-ccw'|'full-ccw';
export type ArcPoint=Readonly<{x:number;y:number}>;
export type AuthoredArcData=Readonly<{a:ArcPoint;b:ArcPoint;c:ArcPoint;branch:ArcBranch}>;
export type ArcBranchFacts=Readonly<{branch:ArcBranch;sector:'minor'|'semicircle'|'major'|'full';start:number;end:number;sweep:number;representable:boolean}>;
export const ARC_BRANCHES:readonly ['proper-ccw','full-ccw'];
export function captureArcBranch(value:unknown):ArcBranch;
export function captureArcData(value:unknown):AuthoredArcData;
/** NEW authoring only; saved IO must use mandatory captureArcData. */
export function captureNewArcData(value:unknown):AuthoredArcData;
export function arcDataFromObject(arc:Readonly<{a:ArcPoint;b:ArcPoint;c:ArcPoint;branch:ArcBranch}>):AuthoredArcData;
export function arcBranchFacts(value:AuthoredArcData):ArcBranchFacts;
export function requireArcInterval(value:AuthoredArcData):ArcBranchFacts;
export function arcSectorContains(value:AuthoredArcData,x:number,y:number):boolean;
