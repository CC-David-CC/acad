// Node transport bridge only; production Worker encoder code executes unchanged.
import{parentPort}from'node:worker_threads';await import('jszip');globalThis.self={postMessage:(v,t)=>parentPort.postMessage(v,t),close:()=>parentPort.close()};await import('../../web/app/cad/export/controlledMesh3mf.worker.mjs');parentPort.on('message',data=>self.onmessage({data}));
