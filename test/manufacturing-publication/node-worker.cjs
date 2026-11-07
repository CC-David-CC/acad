const {parentPort,workerData}=require('node:worker_threads'),{pathToFileURL}=require('node:url');
globalThis.self=globalThis;globalThis.location={href:pathToFileURL(workerData.entry).href};
const listeners=new Set();self.addEventListener=(kind,fn)=>{if(kind!=='message')throw Error('Unexpected Worker event');listeners.add(fn);};
self.postMessage=(data,transfers)=>parentPort.postMessage(data,transfers);self.close=()=>parentPort.close();
require(workerData.entry);
parentPort.on('message',data=>{const event={data};if(typeof self.onmessage==='function')self.onmessage(event);for(const fn of listeners)fn(event);});
