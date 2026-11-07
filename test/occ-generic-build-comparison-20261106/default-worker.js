// Read-only diagnostics around the exact registered default bootstrap.
importScripts('/static/oci-verified-worker.js');
const comparisonDefaultHandler=self.onmessage;
self.onmessage=event=>{if(event.data?.kind==='comparison-inspect'){self.postMessage({kind:'comparison-inspect',seq:event.data.seq,heapCapacityBytes:typeof HEAP8==='undefined'?null:HEAP8.buffer.byteLength,nativeOwnedNames:moduleReady&&typeof Module._OwnedShapeNamesV2==='function'?Module._OwnedShapeNamesV2():null,workerLiveHandles:shapes.size,workerLifetimeNames:nextName,workerMaxLifetimeNames:maxNames,retainedInterpreterArgumentPointers:retained.length});return;}return comparisonDefaultHandler(event);};
