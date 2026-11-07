// Injected transport/fault contract only: no real solver or geometry claim.
import {evaluatePhysicalInWorker} from '../../web/app/cad/parameters/physicalWorkerClient.mjs';
const events=[];let calls=0,settled=false,outcome;
process.on('uncaughtException',error=>events.push(error.message));
globalThis.location={href:'http://fixture.local/',origin:'http://fixture.local'};
Object.defineProperty(globalThis,'navigator',{value:{locks:{request:async(_name,_options,callback)=>callback()}},configurable:true});
globalThis.Worker=class {
 postMessage(request){queueMicrotask(()=>this.onmessage({data:{revision:request.revision,ok:true,result:{version:1,values:[]}}}));}
 terminate(){calls++;if(process.argv[2]==='throw')throw Error('injected W03 termination failure');}
};
evaluatePhysicalInWorker('/worker.js','',{valid:()=>true,timeoutMs:10}).then(value=>{settled=true;outcome={resolved:true};},error=>{settled=true;outcome={error:error.message};});
await new Promise(resolve=>setTimeout(resolve,100));
console.log(JSON.stringify({scope:'Actual imported parameter client, doubled transport and injected cleanup failure',mode:process.argv[2],settled,outcome,calls,uncaught:events}));
process.exit(0);
