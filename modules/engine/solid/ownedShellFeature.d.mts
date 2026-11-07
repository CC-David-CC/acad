export type OwnedShellFeature=Readonly<{version:1;unit:'millimeter';engine:'occ';engineRevision:string;featureId:number;target:string;producerFeatureId:number;removedFaceIds:readonly string[];thickness:number;direction:'inward'}>;
export function captureOwnedShellFeature(input:unknown):OwnedShellFeature;
