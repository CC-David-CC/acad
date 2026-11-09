export type ProfileMechanicalSource=Readonly<{version:1;kind:'axis-rectangle';curveIds:readonly string[];vertices:readonly (readonly number[])[]}>|Readonly<{version:1;kind:'unsupported';reason:'SOURCE_HOLES'|'NON_RECTANGULAR_SOURCE'|'NON_AXIS_RECTANGLE'}>;
/** Small own-data capture only; no geometric inference or membership authority. */
export function captureProfileMechanicalSource(input:unknown):ProfileMechanicalSource;
/** Worker-only derivation from the actual validated original prepared face. */
export function deriveProfileMechanicalSource(preparedFace:any):ProfileMechanicalSource;
