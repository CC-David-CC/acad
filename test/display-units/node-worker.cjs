const {parentPort,workerData}=require('node:worker_threads'),fs=require('node:fs'),vm=require('node:vm'),{pathToFileURL}=require('node:url');
globalThis.self=globalThis;globalThis.location={href:pathToFileURL(workerData.entry).href};
const listeners=new Set();self.addEventListener=(type,fn)=>{if(type!=='message')throw Error('Unexpected Worker event');listeners.add(fn);};
self.close=()=>parentPort.close();self.postMessage=(value,transfers)=>parentPort.postMessage(value,transfers);
self.importScripts=url=>{if(!new URL(url).pathname.endsWith('/lib/verb.js'))throw Error('Unexpected code import');vm.runInThisContext(fs.readFileSync(workerData.verb,'utf8'),{filename:workerData.verb});};
if(workerData.module)import(pathToFileURL(workerData.entry).href).then(()=>parentPort.on('message',data=>{for(const fn of listeners)fn({data});}));
else{require(workerData.entry);parentPort.on('message',data=>self.onmessage({data}));}
