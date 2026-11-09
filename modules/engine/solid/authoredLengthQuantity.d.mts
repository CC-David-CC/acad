export interface CurrentAuthoredQuantityFacade {
 readonly isTyped:boolean;hasCurrentPhysicalResult():boolean;resolveQuantity(name:string,dimension:'length'|'angle'):number;
}
export function isAuthoredLength(value:unknown):value is number|string;
export function resolveAuthoredLength(value:unknown,expressions?:CurrentAuthoredQuantityFacade):number;
