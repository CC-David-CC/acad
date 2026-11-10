import {requireArcInterval} from '../shapes/arcBranch.mjs';
const fail=message=>{throw Object.assign(Error(message),{code:'INVALID_ARC_LENGTH'});};
// One original geometric measurement. This never reads solver angle/radius
// auxiliaries or a cached/persisted measured length.
export function arcLengthFromData(data){
 const interval=requireArcInterval(data),radius=Math.hypot(data.a.x-data.c.x,data.a.y-data.c.y),length=radius*interval.sweep;
 if(!Number.isFinite(radius)||radius<=0||!Number.isFinite(length)||length<=0)fail('Arc length cannot be represented as a positive finite length.');
 return Object.freeze({radius,sweep:interval.sweep,length,branch:interval.branch});
}
export function arcLengthFromObject(arc){
 if(arc?.TYPE!=='Arc'||!arc.a||!arc.b||!arc.c)fail('ArcLength requires an actual ordinary circular Arc.');
 return arcLengthFromData({a:{x:arc.a.x,y:arc.a.y},b:{x:arc.b.x,y:arc.b.y},c:{x:arc.c.x,y:arc.c.y},branch:arc.branch});
}
export const arcLengthConstantValid=value=>typeof value==='number'&&Number.isFinite(value)&&value>0&&value<=1e6;
