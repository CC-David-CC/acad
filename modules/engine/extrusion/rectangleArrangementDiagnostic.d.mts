export type RectangleArrangementDiagnostic=Readonly<{
 version:1;kind:'rectangle-arrangement-eligibility';phase:'source-topology';unit:'millimeter';
 loopCount:2;segmentCount:8;loopIndex:number;vertexCount:number;
 distinctX:number;distinctY:number;distinctVertices:number;
 reason:'EDGE_COUNT'|'DISTINCT_X_COUNT'|'DISTINCT_Y_COUNT'|'NON_AXIS_EDGE'|'REPEATED_VERTEX';
 edgeIndex:number|null;equalX:boolean|null;equalY:boolean|null;dx:number|null;dy:number|null;
}>;
export declare function captureRectangleArrangementDiagnostic(value:unknown):RectangleArrangementDiagnostic;
