import {curveRecord,curveArray,captureCurveSampleIntent,captureCurveControlIntent} from '../shapes/cubicCurveRecord.mjs';
import {captureSketchFailure} from '../constr/admissionCause.mjs';
export function captureCurvePointsReply(value,revision,intent){
 const marker=value&&typeof value==='object'?Object.getOwnPropertyDescriptor(value,'ok'):null;
 const a=curveRecord(value,marker&&Object.hasOwn(marker,'value')&&marker.value===false?['revision','ok','error']:['revision','ok','curve','samples']);if(a.revision!==revision)throw Error('Curve observation revision changed.');if(a.ok===false)return Object.freeze({revision,ok:false,error:captureSketchFailure(a.error)});
 const requested=captureCurveSampleIntent(intent),curve=curveRecord(a.curve,['id','type']),samples=curveArray(a.samples);
 if(a.ok!==true||curve.id!==requested.id||!['BezierCurve','BSpline'].includes(curve.type)||samples.length!==requested.parameters.length)throw Error('Curve observation binding changed.');
 return Object.freeze({revision,ok:true,curve:Object.freeze(curve),samples:Object.freeze(samples.map((v,i)=>{const s=curveRecord(v,['parameter','x','y']);if(s.parameter!==requested.parameters[i]||![s.x,s.y].every(n=>typeof n==='number'&&Number.isFinite(n)))throw Error('Invalid actual curve observation.');return Object.freeze(s);} ))});
}
export function captureCurveControlReceipt(value,intent){const actual=captureCurveControlIntent(value),expected=captureCurveControlIntent(intent);if(JSON.stringify(actual)!==JSON.stringify(expected))throw Error('Curve control receipt changed.');return actual;}
