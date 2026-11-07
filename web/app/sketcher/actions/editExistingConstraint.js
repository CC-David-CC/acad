import {runSketchTransaction} from './sketchTransaction';

const editCaptures=new WeakMap();
function constantsSnapshot(value){
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Constraint constants are unavailable.');const keys=Reflect.ownKeys(value);if(keys.length>64||keys.some(k=>typeof k!=='string'||k.length>128))throw Error('Constraint constants exceed limits.');const out=Object.create(null);let size=0;for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value')||!['string','number','boolean'].includes(typeof d.value)||(typeof d.value==='number'&&!Number.isFinite(d.value))||String(d.value).length>4096)throw Error('Invalid constraint constants.');size+=key.length+String(d.value).length;if(size>65536)throw Error('Constraint constants exceed limits.');out[key]=d.value;}return Object.freeze(out);
}
export function captureExistingConstraintEdit(constraint){
 if(!constraint?.schema?.constants)throw Error('The constraint cannot be edited.');const token=Object.freeze({}),constants=constantsSnapshot(constraint.constants);editCaptures.set(token,{constraint,schema:constraint.schema,constants});return token;
}
function requireCapturedConstants(constraint,token){
 const saved=token&&typeof token==='object'?editCaptures.get(token):null;if(!saved||saved.constraint!==constraint||saved.schema!==constraint.schema)throw Error('The constraint changed; reopen its editor.');const now=constantsSnapshot(constraint.constants),a=Object.keys(saved.constants),b=Object.keys(now);if(a.length!==b.length||a.some(key=>!Object.prototype.hasOwnProperty.call(now,key)||!Object.is(now[key],saved.constants[key])))throw Error('The constraint changed; reopen its editor.');
}
// Existing-constraint edits share the same atomic admission boundary as new
// sketch operations. The caller may not supply history or rollback callbacks.
export function editExistingConstraint(viewer,constraint,proposed,expected) {
 const pm=viewer?.parametricManager, stages=pm?.stages;
 if(!pm||!Array.isArray(stages)||!constraint?.schema?.constants||!proposed||typeof proposed!=='object'||Array.isArray(proposed))throw Error('The constraint cannot be edited.');
 const owners=stages.filter(s=>s?.algNumSystem?.allConstraints?.includes(constraint));
 if(owners.length!==1||constraint.stage!==owners[0])throw Error('The constraint is no longer current.');
 requireCapturedConstants(constraint,expected);
 const definitions=constraint.schema.constants,keys=Reflect.ownKeys(proposed);if(keys.length>64||keys.some(k=>typeof k!=='string'||!Object.prototype.hasOwnProperty.call(definitions,k)))throw Error('Invalid constraint fields.');
 const next={...constraint.constants};for(const key of keys){const descriptor=Object.getOwnPropertyDescriptor(proposed,key);if(!descriptor?.enumerable||!Object.prototype.hasOwnProperty.call(descriptor,'value'))throw Error('Constraint fields must be data.');const value=descriptor.value;if(!['string','number','boolean'].includes(typeof value)||String(value).length>4096)throw Error('Invalid constraint value.');if(definitions[key].readOnly&&String(value)!==String(constraint.constants?.[key]))throw Error('This constraint field is read-only.');if(!definitions[key].readOnly)next[key]=String(value)}
 constraint.validateCandidateConstants(next,pm.constantResolver);
 if(Object.keys(next).every(key=>String(next[key])===String(constraint.constants?.[key]))){editCaptures.delete(expected);return Object.freeze({committed:false});}
 const originalStages=[...stages],snapshots=[];
 for(const stage of stages){const system=stage.algNumSystem;if(!system||!Array.isArray(system.allConstraints)||system.allConstraints.length>10000)throw Error('Constraint edit exceeds limits.');for(const c of system.allConstraints){if(snapshots.length>=10000)throw Error('Constraint edit exceeds limits.');const capture=value=>value&&typeof value==='object'?{value,descriptors:Object.getOwnPropertyDescriptors(value)}:{value,descriptors:null};snapshots.push({constraint:c,constants:capture(c.constants),resolved:capture(c.resolvedConstants)})}}
 const restore=()=>{for(const snapshot of snapshots)for(const [field,saved] of [['constants',snapshot.constants],['resolvedConstants',snapshot.resolved]]){const c=snapshot.constraint;c[field]=saved.value;if(saved.descriptors){for(const key of Reflect.ownKeys(saved.value))if(!Object.prototype.hasOwnProperty.call(saved.descriptors,key))delete saved.value[key];Object.defineProperties(saved.value,saved.descriptors)}}};
 runSketchTransaction(viewer,{mutate(){for(const key of Object.keys(next))if(!definitions[key].readOnly)constraint.updateConstant(key,next[key]);},rollbackExtra:restore,validate(current){if(current.length!==originalStages.length||current.some((s,i)=>s!==originalStages[i]))throw Error('Sketch stages changed during editing.');for(const stage of current){const sys=stage.algNumSystem,before=sys.transactionBefore;if(!before||!sys.allConstraints.includes(constraint)&&stage===owners[0])throw Error('The edited constraint is unavailable.');for(const c of before.constraints){const wasRejected=before.conflicting.has(c)&&!before.redundant.has(c),nowRejected=sys.conflicting.has(c)&&!sys.redundant.has(c);if(nowRejected&&(c===constraint||!wasRejected))throw Error('This change conflicts with an existing constraint.')}}}});
 // The operation is already committed; presentation failures cannot be
 // reinterpreted as an unsuccessful model edit.
 editCaptures.delete(expected);
 try{pm.refresh()}catch(error){console.error('Constraint edit committed; refresh failed:',error)}
 return Object.freeze({committed:true});
}
