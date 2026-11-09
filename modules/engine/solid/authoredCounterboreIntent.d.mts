import type {OwnedCounterboreIntent} from './ownedCounterboreIntent.mjs';
export type AuthoredCounterboreIntent=Readonly<Omit<OwnedCounterboreIntent,'throughDiameter'|'stepDiameter'|'stepDepth'>&{throughDiameter:number|string;stepDiameter:number|string;stepDepth:number|string}>;
export function captureAuthoredCounterboreIntent(input:unknown):AuthoredCounterboreIntent;
export function materializeAuthoredCounterboreIntent(input:unknown,expressions:any,materialized?:any):Readonly<OwnedCounterboreIntent>;

export function captureAuthoredCounterboreLengths(input:unknown):Readonly<{throughDiameter:number|string;stepDiameter:number|string;stepDepth:number|string}>;
export function materializeAuthoredCounterboreLengths(input:unknown,expressions:any):Readonly<{throughDiameter:number;stepDiameter:number;stepDepth:number}>;
