// Actual whole manager and hash client, real validation/hash Node Workers.
// Existing fixture's UI/storage/pipeline doubles are explicit; empty-project
// protocol only, never claimed native geometry or a painted browser interface.
import {fixture} from '../display-units/manager-fixture.mjs';
import {geometryRevision} from '../../web/app/cad/projectManager/manufacturingMetadata.mjs';
import {encodeProjectEnvelope} from '../../web/app/cad/projectManager/projectEnvelope.mjs';
import {Worker} from 'node:worker_threads';
import {getEventListeners} from 'node:events';
import {setTimeout as wait} from 'node:timers/promises';
const [kind,fault='none']=process.argv.slice(2),causes={error:Error('injected after real Node Worker termination'),null:null,undefined:undefined,zero:0,false:false,empty:''},cause=causes[fault],originalTerminate=Worker.prototype.terminate,originalEmit=Worker.prototype.emit;
const uncaught=[],actualTermination=[],held=[],f=fixture(),controller=new AbortController();let settled=false,outcome,termCalls=0,enabled=false;
process.on('uncaughtException',error=>uncaught.push(error?.message||String(error)));
const until=async predicate=>{for(let n=0;n<200&&!predicate();n++)await wait(10);if(!predicate())throw Error('Probe deadline');};
try{
 if(kind.startsWith('hash')){const project=f.manager.snapshotCurrentProject().project,metadata={version:1,unit:'millimeter',revision:await geometryRevision(project),materials:[],appearances:[],bindings:[],objects:[]};await f.manager.restoreSnapshotBytesInEmptyWorkspace(new Blob([JSON.stringify(encodeProjectEnvelope(project,metadata))]));await f.drain();}
 const before={workers:{...f.workers},material:JSON.stringify(f.manager.getManufacturingMetadata()),projectAbortListeners:getEventListeners(f.project.documentSignal,'abort').length};
 Worker.prototype.terminate=function(){const p=originalTerminate.call(this);actualTermination.push(p);if(enabled){termCalls++;if(fault!=='none')throw cause;}return p;};
 Worker.prototype.emit=function(type,...args){if(enabled&&(kind.endsWith('abort')||kind.endsWith('stale'))&&type==='message'&&!held.length&&(kind.startsWith('hash')||args[0]?.ok!==undefined)){held.push({data:structuredClone(args[0]),deliver:()=>originalEmit.call(this,type,...args)});return true;}return originalEmit.call(this,type,...args);};
 enabled=true;
 const job=kind.startsWith('hash')?f.manager.prepareHostSave({signal:controller.signal}):f.manager.restoreSnapshotBytesInEmptyWorkspace(new Blob([JSON.stringify(encodeProjectEnvelope({model:{history:[],expressions:'',assembly:[],counters:{featureId:0}},sketches:[]}))]),{signal:controller.signal});
 job.then(()=>{settled=true;outcome={resolved:true};},error=>{settled=true;outcome={resolved:false,code:error?.code,name:error?.name,message:error?.message,causeExact:error?.cause===cause,originalExact:error===cause,operationError:error?.operationError?{name:error.operationError.name,message:error.operationError.message}:null};});
 if(kind.endsWith('abort')){await until(()=>held.length);controller.abort();}
 else if(kind.endsWith('stale')){await until(()=>held.length);if(kind.startsWith('hash'))f.manager.setDisplayUnits({revision:f.manager.inspectDisplayUnits().revision,lengthUnit:'inch'});else f.project.beginDocumentChange();held[0].deliver();await until(()=>termCalls>0);}
 else await until(()=>termCalls>0);
 await wait(150);const after={settled,outcome,termCalls,projectAbortListeners:getEventListeners(f.project.documentSignal,'abort').length,callerAbortListeners:getEventListeners(controller.signal,'abort').length,workers:{...f.workers},material:JSON.stringify(f.manager.getManufacturingMetadata())};
 for(const row of held)row.deliver();await wait(20);
 let subsequent;if(fault!=='none'&&settled&&kind.startsWith('hash')){const count=f.workers.hash;subsequent=await f.manager.prepareHostSave({signal:new AbortController().signal}).then(()=>({resolved:true}),error=>({resolved:false,code:error.code,causeExact:error.cause===cause}));subsequent.newWorkers=f.workers.hash-count;}
 // Restore failure revokes its disposable document. Replace only the fixture's
 // explicit document-lifetime double to check the SAME manager module fence;
 // this is not a real ProjectService/new-window qualification.
 if(fault!=='none'&&settled&&kind.startsWith('validation')){let generation=f.project.documentGeneration+1,owner=new AbortController();const replacement={...f.project,get documentGeneration(){return generation;},get documentSignal(){return owner.signal;},isDocumentCurrent:g=>g===generation&&!owner.signal.aborted,beginDocumentChange(){owner.abort();owner=new AbortController();return ++generation;},dispose(){owner.abort();}};f.ctx.projectService=replacement;const count=f.workers.validation;subsequent=await f.manager.restoreSnapshotBytesInEmptyWorkspace(new Blob([JSON.stringify(encodeProjectEnvelope({model:{history:[],expressions:'',assembly:[],counters:{featureId:0}},sketches:[]}))])).then(()=>({resolved:true}),error=>({resolved:false,code:error.code,causeExact:error.cause===cause}));subsequent.newWorkers=f.workers.validation-count;}
 console.log(JSON.stringify({kind,fault,scope:'Actual manager/client + real CPU Workers, injected post-real-termination fault, no geometry/public app claim',before,after,lateSettled:settled,subsequent,heldMessages:held.map(x=>x.data),actualTerminationAttempts:actualTermination.length,uncaught}));
}finally{enabled=false;Worker.prototype.terminate=originalTerminate;Worker.prototype.emit=originalEmit;await f.close();await Promise.allSettled(actualTermination);}
process.exit(0);
