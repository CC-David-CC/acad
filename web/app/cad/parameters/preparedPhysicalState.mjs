// Internal one-shot capability for an owned restore. Never stored in the project
// or attached to the public service. The owner must bind result to a Worker job.
const pending=new WeakMap();
export function armPreparedPhysicalState(service,source,result){
 if(!service||typeof service!=='object'||typeof source!=='string'||!result||pending.has(service))throw Error('Invalid prepared parameter state.');
 const token=Object.freeze({source,result});pending.set(service,token);
 return ()=>{if(pending.get(service)===token)pending.delete(service)};
}
export function consumePreparedPhysicalState(service,source){
 const token=pending.get(service);if(!token||token.source!==source)throw Error('Typed parameters need a current validated restore.');pending.delete(service);return token.result;
}
