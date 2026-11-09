import type {OwnedBlindHoleIntent} from './ownedBlindHoleIntent.mjs';
export type AuthoredBlindHoleIntent=Readonly<Omit<OwnedBlindHoleIntent,'diameter'|'depth'>&{diameter:number|string;depth:number|string}>;
export function captureAuthoredBlindHoleIntent(input:unknown):AuthoredBlindHoleIntent;
export function materializeAuthoredBlindHoleIntent(input:unknown,expressions:any,materialized?:any):Readonly<OwnedBlindHoleIntent>;
