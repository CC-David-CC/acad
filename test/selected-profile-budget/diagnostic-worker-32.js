// PRIVATE experimental32 diagnostic wrapper; changes only lifetime-name cap.
// Private diagnostic wrapper. Geometry messages and successful
// responses come from the exact unchanged production Worker below.
importScripts('/static/selected-profile-worker.js');
maxNames=32;
const budgetOriginalHandler=self.onmessage;
self.onmessage=event=>{
 if(event.data?.kind==='budget-inspect'){
  self.postMessage({kind:'budget-inspect',seq:event.data.seq,scope:'read-only diagnostic, capacity is not used bytes',ready:moduleReady,heapCapacityBytes:typeof HEAP8==='undefined'?null:HEAP8.buffer.byteLength,nativeOwnedNames:moduleReady&&typeof Module._OwnedShapeNamesV2==='function'?Module._OwnedShapeNamesV2():null,workerLifetimeNames:nextName,workerMaxLifetimeNames:maxNames,workerLiveHandles:shapes.size,retainedInterpreterArgumentPointers:retained.length});return;
 }
 return budgetOriginalHandler(event);
};
