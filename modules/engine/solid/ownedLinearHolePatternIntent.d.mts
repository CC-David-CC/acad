/** Data capture alone does not prove actual seed/source/target custody. */
export interface OwnedLinearHolePatternIntent {
 readonly version:1;readonly unit:'millimeter';readonly engine:'occ';
 readonly engineRevision:string;readonly featureId:number;readonly target:string;
 readonly producerFeatureId:number;readonly seedFeatureId:number;
 readonly axis:'source-local-x-positive';readonly count:number;readonly spacing:number;
}
export const MAX_LINEAR_HOLE_PATTERN_COUNT:17;
export function captureOwnedLinearHolePatternIntent(input:unknown):OwnedLinearHolePatternIntent;
/** Count1 deliberately refuses until an owned identity operation is qualified. */
export function linearHolePatternNativeCost(count:number):number;
