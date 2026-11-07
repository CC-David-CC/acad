export function captureSolidBox(input:unknown): any;
export function captureSolidBoolean(input:unknown): any;
export function captureSolidEdgeTreatment(input:unknown):Readonly<{version:1;unit:'millimeter';engine:'occ';engineRevision:string;featureId:number;target:string;producerFeatureId:number;kind:'fillet'|'chamfer-equal';edgeIds:readonly string[];size:number}>;
export function solidBodyId(featureId:number): string;
