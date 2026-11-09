import type {BoreReference,LinkedPartBoreQuery,LinkedPartDrawingDefinition} from '../../drawing/linkedPartDrawingDefinition.mjs';
type P=readonly [number,number,number];
export const BORE_DISCOVERY_LIMIT:16;
export type BoreFact=Readonly<{reference:BoreReference}&({status:'available';reason:null;quality:'native-prism-cut-lineage';diameter:number;center:P;axis:P;ends:readonly[P,P];through:Readonly<{status:'available';reason:null}|{status:'unqualified';reason:string}>}|{status:'unresolved';reason:string;quality:null;diameter:null;center:null;axis:null;ends:readonly[];through:null})>;
export type BoreReferenceObservation=Readonly<{version:1;unit:'millimeter';scope:'response-local';quality:'native-bound-bore-references';featureId:number;datum:LinkedPartDrawingDefinition['datum'];status:'available'|'unresolved';reason:string|null;bores:readonly BoreFact[]}>;
export function captureBoreReadRequest(value:unknown):any;
export function captureBoreFact(value:unknown,datum:LinkedPartDrawingDefinition['datum']):BoreFact;
export function captureBoreReadResult(value:unknown,query:LinkedPartBoreQuery):BoreReferenceObservation;
export function unresolvedBoreRead(query:LinkedPartBoreQuery,reason:string):BoreReferenceObservation;
