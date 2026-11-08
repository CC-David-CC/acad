import {captureSketchFailure} from '../constr/admissionCause.mjs';
const fail=()=>{throw Error('Invalid length measurement envelope.');};
/** @returns {Readonly<Record<string, any>>} */
export function measurementRecord(value,keys){if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value))||Reflect.ownKeys(value).length!==keys.length)fail();const r={};for(const k of keys){const d=Object.getOwnPropertyDescriptor(value,k);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail();r[k]=d.value;}return r;}
function dense(v,max){if(!Array.isArray(v)||Object.getPrototypeOf(v)!==Array.prototype||v.length>max||Reflect.ownKeys(v).length!==v.length+1)fail();return Array.from({length:v.length},(_,i)=>{const d=Object.getOwnPropertyDescriptor(v,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value'))fail();return d.value;});}
export function measurementId(v,max=256){if(typeof v!=='string'||!v||v.length>max)fail();return v;}
/** @returns {Readonly<Record<string, any>>} */
export function captureLengthMeasurementIntent(value){
 const action=Object.getOwnPropertyDescriptor(value||{},'action');if(!action?.enumerable||!Object.hasOwn(action,'value'))fail();let r;
 if(action.value==='inspect')r=measurementRecord(value,['action']);
 else if(action.value==='create'){r=measurementRecord(value,['action','segmentId']);measurementId(r.segmentId);}
 else if(action.value==='convert'){
  const role=Object.getOwnPropertyDescriptor(value,'role');if(!role?.enumerable||!Object.hasOwn(role,'value')||!['driving','reference'].includes(role.value))fail();r=measurementRecord(value,role.value==='driving'?['action','target','role','value']:['action','target','role']);
  const keys=Reflect.ownKeys(r.target||{});if(keys.length!==1||!['measurementId','constraintId'].includes(keys[0]))fail();const target=measurementRecord(r.target,keys);measurementId(target[keys[0]],keys[0]==='constraintId'?4096:256);r.target=Object.freeze(target);
  if(r.role==='driving'&&(typeof r.value!=='number'||!Number.isFinite(r.value)||r.value<=0||r.value>1e6))fail();
 }else fail();return Object.freeze(r);
}
/** @returns {Readonly<Record<string, any>>} */
export function captureLengthMeasurementRequest(value,verify=false){
 const a=measurementRecord(value,verify?['revision','sketchJSON','externalParameters','intent','allocatedId','candidateJSON']:['revision','sketchJSON','externalParameters','intent','allocatedId']);measurementId(a.revision);if(typeof a.sketchJSON!=='string'||a.sketchJSON.length>1048576)fail();a.intent=captureLengthMeasurementIntent(a.intent);if(a.allocatedId!==null)measurementId(a.allocatedId);if(a.intent.action==='inspect'&&a.allocatedId!==null)fail();
 const keys=Reflect.ownKeys(a.externalParameters||{});if(keys.length>1024||keys.some(k=>typeof k!=='string'))fail();a.externalParameters=measurementRecord(a.externalParameters,keys);for(const k of keys)if(!k||k.length>256||typeof a.externalParameters[k]!=='number'||!Number.isFinite(a.externalParameters[k])||Math.abs(a.externalParameters[k])>1e9)fail();Object.freeze(a.externalParameters);if(verify&&(typeof a.candidateJSON!=='string'||a.candidateJSON.length>1048576))fail();return Object.freeze(a);
}
function captureRows(value){return Object.freeze(dense(value,1024).map(raw=>{
 const r=measurementRecord(raw,['segmentId','measurementId','constraintId','role','canonicalValue','unit','canCreate','canConvert','reason']);for(const k of ['segmentId','measurementId','constraintId'])if(r[k]!==null)measurementId(r[k],k==='constraintId'?4096:256);
 if(!['reference','driving','unresolved'].includes(r.role)||r.canonicalValue!==null&&(typeof r.canonicalValue!=='number'||!Number.isFinite(r.canonicalValue)||r.canonicalValue<0)||![null,'millimeter'].includes(r.unit)||typeof r.canCreate!=='boolean'||typeof r.canConvert!=='boolean'||r.reason!==null&&(typeof r.reason!=='string'||!r.reason||r.reason.length>128))fail();return Object.freeze(r);
}));}
function evidence(value){let total=0;return Object.freeze(dense(value,10000).map(raw=>{const r=measurementRecord(raw,['typeId','state','residuals','tolerances','units','tolerance','unit']);measurementId(r.typeId);if(!['accepted','redundant'].includes(r.state))fail();r.residuals=dense(r.residuals,1024);r.tolerances=dense(r.tolerances,1024);r.units=dense(r.units,1024);total+=r.residuals.length;if(total>100000||r.residuals.length!==r.tolerances.length||r.units.length!==r.residuals.length||r.residuals.some((v,i)=>typeof v!=='number'||!Number.isFinite(v)||typeof r.tolerances[i]!=='number'||!Number.isFinite(r.tolerances[i])||r.tolerances[i]<=0||Math.abs(v)>r.tolerances[i]||!['millimeter','radian'].includes(r.units[i])))fail();const mixed=new Set(r.units).size>1,unit=mixed?'mixed':r.units[0]||'millimeter';if(r.unit!==unit||(mixed?r.tolerance!==null:typeof r.tolerance!=='number'||!Number.isFinite(r.tolerance)||r.tolerance<=0||r.tolerances.length&&r.tolerance!==r.tolerances[0]))fail();return Object.freeze({...r,residuals:Object.freeze(r.residuals),tolerances:Object.freeze(r.tolerances),units:Object.freeze(r.units)});}));}
/** @returns {Readonly<Record<string, any>>} */
export function captureLengthMeasurementReply(value,revision,verify=false){
 const ok=Object.getOwnPropertyDescriptor(value||{},'ok');if(!ok?.enumerable||!Object.hasOwn(ok,'value')||typeof ok.value!=='boolean')fail();const r=measurementRecord(value,!ok.value?['revision','ok','error']:verify?['revision','ok','verified']:['revision','ok','changed','serializedSketch','evidence','measurements','measurement']);if(r.revision!==revision)fail();if(!r.ok)return Object.freeze({...r,error:captureSketchFailure(r.error)});if(verify){if(r.verified!==true)fail();return Object.freeze(r);}
 if(typeof r.changed!=='boolean'||typeof r.serializedSketch!=='string'||r.serializedSketch.length>1048576)fail();r.measurements=captureRows(r.measurements);r.evidence=evidence(r.evidence);if(r.measurement!==null){r.measurement=captureRows([r.measurement])[0];if(!r.measurements.some(x=>x.segmentId===r.measurement.segmentId&&x.measurementId===r.measurement.measurementId&&x.constraintId===r.measurement.constraintId&&x.role===r.measurement.role&&x.canonicalValue===r.measurement.canonicalValue))fail();}
 // UI metadata stays bounded independently from native source/evidence budgets.
 const meta=JSON.stringify({measurements:r.measurements,measurement:r.measurement});if(meta.length>65536||new TextEncoder().encode(meta).byteLength>65536)fail();return Object.freeze(r);
}
