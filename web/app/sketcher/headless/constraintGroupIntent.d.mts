export type ConstraintGroupIntent=Readonly<{kind:'midpoint';action:'create';ids:readonly string[]}>|Readonly<{kind:'angle-chain';action:'create'|'edit';ids:readonly string[];angleDegrees:number}>;
export function groupData(value:unknown,keys:readonly string[]):any;
export function groupIds(value:unknown,min?:number,max?:number):readonly string[];
export function captureConstraintGroupIntent(value:unknown):ConstraintGroupIntent;
export function captureConstraintGroupReply(value:unknown,intent:ConstraintGroupIntent):any;
