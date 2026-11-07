// Shared synchronous admission boundary for bounded sketch actions. This
// still uses the existing UI-thread sketch checkpoint; it is not a worker.
const MAX_CHECKPOINT_BYTES=1024*1024;

export function runSketchTransaction(viewer,{mutate,validate,rollbackExtra}={}) {
  const pm=viewer?.parametricManager,history=viewer?.historyManager;
  if(!pm||!history||!Array.isArray(history.diffs)||history.recoverySnapshot||pm.inTransaction||typeof mutate!=='function'||(validate!==undefined&&typeof validate!=='function')||(rollbackExtra!==undefined&&typeof rollbackExtra!=='function')) {
    throw Error('The sketch is not ready for this operation.');
  }
  const before={diffs:[...history.diffs],pointer:history.historyPointer,last:history.lastCheckpoint,counter:history._counter};
  let checkpoint=null,transactionAttempted=false;
  try {
    history._checkpoint();checkpoint=history.lastCheckpoint;
    if(typeof checkpoint!=='string'||checkpoint.length>MAX_CHECKPOINT_BYTES||new TextEncoder().encode(checkpoint).byteLength>MAX_CHECKPOINT_BYTES)throw Error('Sketch exceeds the operation size limit.');
    transactionAttempted=true;pm.startTransaction();mutate(pm);pm.finishTransaction(validate||null,false);
  } catch(error) {
    let rollbackFailed=false;
    if(transactionAttempted&&pm.inTransaction){try{pm.finishTransaction(()=>{throw error},false)}catch(_){/* An expected validation throw may follow a successful rollback. */}}
    if(transactionAttempted&&rollbackExtra){try{rollbackExtra()}catch(_){rollbackFailed=true}}
    try{history.diffs.splice(0,history.diffs.length,...before.diffs);history.historyPointer=before.pointer;history.lastCheckpoint=before.last;history._counter=before.counter}catch(_){rollbackFailed=true}
    if(transactionAttempted&&checkpoint!==null){
      try {
        if(pm.inTransaction||!Array.isArray(pm.stages)||pm.stages.some(s=>!s?.algNumSystem||s.algNumSystem.inTransaction||s.algNumSystem.transactionBefore)||viewer.io.serializeSketch(undefined,{strict:true})!==checkpoint)rollbackFailed=true;
      } catch(_){rollbackFailed=true}
      if(rollbackFailed){history.recoverySnapshot=checkpoint;throw Error('The operation could not be rolled back. The previous sketch is held for recovery; do not save this sketch.')}
    }
    throw error;
  }
}
