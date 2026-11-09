export interface OwnedCounterboreIntent {readonly version:1;readonly unit:'millimeter';readonly engine:'occ';readonly engineRevision:string;readonly featureId:number;readonly target:string;readonly producerFeatureId:number;readonly sourceFeatureId:number;readonly sourceFaceId:string;readonly sourceRegionId:string;readonly entryFaceId:string;readonly kind:'centered-counterbore-flat';readonly throughDiameter:number;readonly stepDiameter:number;readonly stepDepth:number;}
export const COUNTERBORE_KEYS:readonly string[];
export const COUNTERBORE_GEOMETRY_CODES:readonly string[];
export const COUNTERBORE_CODES:readonly string[];
export function captureOwnedCounterboreIntent(input:unknown):Readonly<OwnedCounterboreIntent>;

export const COUNTERBORE_LENGTH_KEYS:readonly ['throughDiameter','stepDiameter','stepDepth'];
export function assertCounterboreDiameterOrder(small:number,large:number):void;
