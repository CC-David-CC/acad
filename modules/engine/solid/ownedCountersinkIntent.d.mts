export interface OwnedCountersinkIntent {
 readonly version:1;readonly unit:'millimeter';readonly engine:'occ';readonly engineRevision:string;
 readonly featureId:number;readonly target:string;readonly producerFeatureId:number;readonly sourceFeatureId:number;
 readonly sourceFaceId:string;readonly sourceRegionId:string;readonly entryFaceId:string;readonly kind:'centered-countersink-conical';
 readonly throughDiameter:number;readonly entryDiameter:number;readonly includedAngleRadians:number;
}
export const COUNTERSINK_NUMERIC_KEYS:readonly string[];
export const COUNTERSINK_LENGTH_KEYS:readonly ['throughDiameter','entryDiameter'];
export function assertCountersinkDiameterOrder(through:number,entry:number):void;
export function captureNumericCountersinkIntent(value:unknown):Readonly<OwnedCountersinkIntent>;
