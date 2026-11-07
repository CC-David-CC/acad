/** Authored data only; capture does not prove capability or source ancestry. */
export interface OwnedHoleIntentBase {
 readonly version:1;
 readonly unit:'millimeter';
 readonly engine:'occ';
 readonly engineRevision:string;
 readonly featureId:number;
 readonly target:string;
 readonly producerFeatureId:number;
 /** Origin selected extrusion; evaluation must prove this relationship. */
 readonly sourceFeatureId:number;
 readonly sourceFaceId:string;
 readonly sourceRegionId:string;
 readonly diameter:number;
}
export interface CenteredThroughHoleIntent extends OwnedHoleIntentBase {
 readonly kind:'centered-through';
 readonly offsetX?:never;
 readonly offsetY?:never;
}
export interface FourCornerThroughHoleIntent extends OwnedHoleIntentBase {
 readonly kind:'four-corner-through';
 readonly offsetX:number;
 readonly offsetY:number;
}
export type OwnedHoleIntent=CenteredThroughHoleIntent|FourCornerThroughHoleIntent;
export function captureOwnedHoleIntent(input:unknown):OwnedHoleIntent;
