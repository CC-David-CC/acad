// Private read-only diagnostics; geometry and limit policy are production code.
importScripts('/static/selected-profile-worker.js');
const budgetProductionHandler=self.onmessage;
self.onmessage=event=>{if(event.data?.kind==='budget-inspect'){self.postMessage({kind:'budget-inspect',seq:event.data.seq,heapCapacityBytes:typeof HEAP8==='undefined'?null:HEAP8.buffer.byteLength,nativeOwnedNames:moduleReady?Module._OwnedShapeNamesV2():null,workerLifetimeNames:nextName,workerMaxLifetimeNames:maxNames,workerLiveHandles:shapes.size,retainedInterpreterArgumentPointers:retained.length,cumulativeResultTriangles:selectedTriangleTotal,chargedNativeResults:selectedResultTriangles.size,maxCumulativeResultTriangles:selectedTriangleLimit});return;}return budgetProductionHandler(event);};
