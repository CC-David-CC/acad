// Node Worker platform adapter only. Real production solveWorker imports the
// unchanged Verb distribution. No DOM, geometry replacements or solver hooks.
const {parentPort,workerData}=require('node:worker_threads'),fs=require('node:fs'),vm=require('node:vm'),{pathToFileURL,fileURLToPath}=require('node:url');
globalThis.self=globalThis;globalThis.location={href:pathToFileURL(workerData.worker).href};
globalThis.importScripts=url=>{if(new URL(url).pathname.endsWith('/lib/verb.js'))vm.runInThisContext(fs.readFileSync(workerData.verb,'utf8'),{filename:workerData.verb});else throw Error('Unexpected importScripts URL '+url);};
self.postMessage=value=>parentPort.postMessage(value);
require(workerData.worker);
parentPort.once('message',data=>self.onmessage({data}));
