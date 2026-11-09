export interface OwnedBlindHoleIntent {readonly version:1;readonly unit:'millimeter';readonly engine:'occ';readonly engineRevision:string;readonly featureId:number;readonly target:string;readonly producerFeatureId:number;readonly sourceFeatureId:number;readonly sourceFaceId:string;readonly sourceRegionId:string;readonly entryFaceId:string;readonly kind:'centered-blind-flat';readonly diameter:number;readonly depth:number;}
export const BLIND_HOLE_KEYS:readonly string[];
export const BLIND_HOLE_GEOMETRY_CODES:readonly string[];
export const BLIND_HOLE_CODES:readonly string[];
export function captureOwnedBlindHoleIntent(input:unknown):Readonly<OwnedBlindHoleIntent>;
