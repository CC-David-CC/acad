// Platform adapter only: replies come from compiled production Workers.
import {Worker} from 'node:worker_threads';import {fileURLToPath} from 'node:url';import {resolve,dirname} from 'node:path';import {createHash,randomUUID} from 'node:crypto';
export const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..'),lifecycle={started:0,terminated:0},observations=[];
export const hash=text=>createHash('sha256').update(text).digest('hex');
export async function runWorker(kind,request){const w=new Worker(resolve(root,'test/solver-stage-diagnostics/node-worker.cjs'),{workerData:{worker:resolve(root,'.build/selected-profile-loft/'+kind+'/worker.js'),verb:resolve(root,'web/lib/verb.js')}});lifecycle.started++;try{return await new Promise((yes,no)=>{w.once('message',value=>{observations.push({kind,task:request.task||request.kind,revision:request.revision||request.jobId,ok:value.ok,code:value.code||value.error?.code});yes(value);});w.once('error',no);w.postMessage(request);});}finally{await w.terminate();lifecycle.terminated++;}}
export async function task(task,fields){const r=await runWorker('sketch',{task,revision:randomUUID(),...fields});if(!r.ok)throw Error(JSON.stringify(r));return r;}
export const frame=z=>({origin:[0,0,z],x:[1,0,0],y:[0,1,0],z:[0,0,1]});
export async function author(kind,z,options={}){const f=frame(z),receipts=[];let r=await task('sketch-transition-empty',{unit:'millimeter',frame:f});const add=async(kind,data,role=null)=>{r=await task('sketch-transition-primitive',{sketchJSON:r.serializedSketch,externalParameters:{},primitive:{id:'agent-primitive-'+randomUUID(),stage:0,kind,role,data}});receipts.push(r.primitive);};
 if(kind==='circle')await add('Circle',{c:{x:options.cx??1,y:options.cy??-2},r:options.radius??4});
 else{const w=options.width??20,h=options.height??10,p=kind==='triangle'?[[0,0],[20,0],[0,10]]:options.cw?[[-w/2,h/2],[w/2,h/2],[w/2,-h/2],[-w/2,-h/2]]:[[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2]];for(let i=0;i<p.length;i++)await add('Segment',{a:{x:p[i][0],y:p[i][1]},b:{x:p[(i+1)%p.length][0],y:p[(i+1)%p.length][1]}});}
 if(options.extraCircle)await add('Circle',{c:{x:1,y:-2},r:1});if(options.construction){await add('Segment',{a:{x:100,y:100},b:{x:101,y:100}},'construction');await add('Point',{x:-10,y:-5},'construction');}
 const inspected=await task('sketch-transition-inspection',{sketchJSON:r.serializedSketch,externalParameters:{}});
 return{source:{unit:'millimeter',engine:'occ',profileVersion:3,revision:'same-captured-document',sketchDigest:hash(r.serializedSketch),faceId:'component-source-face-'+z,frame:f,sketchJSON:r.serializedSketch},receipts,inspected};
}
