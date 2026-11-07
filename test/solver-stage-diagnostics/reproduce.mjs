import {Worker} from 'node:worker_threads';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {writeFileSync} from 'node:fs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const boundary={lines:[],arcs:[],circles:[],nurbses:[]};
export const workerLifecycle={started:0,terminated:0};
export const point=(id,x,y,stage=0)=>({id,type:'Point',role:null,stage,data:{x,y}});
export const constraint=(typeId,objects,constants,stage=0,state='accepted')=>({typeId,objects,constants,stage,annotations:['SignedDistanceX','SignedDistanceY'].includes(typeId)?[{offset:20}]:[],admission:{version:1,state}});
export const sketch=(objects,stages)=>({version:3,objects,dimensions:[],labels:[],stages:stages.map(constraints=>({constraints,generators:[]})),constants:'',boundary:structuredClone(boundary)});
export async function solve(source,extra={}){
 const worker=new Worker(resolve(root,'test/solver-stage-diagnostics/node-worker.cjs'),{workerData:{worker:process.env.SOLVER_REPORT_WORKER||resolve(root,'.build/solver-report-worker/static/worker.js'),verb:resolve(root,'web/lib/verb.js')}});
 workerLifecycle.started++;
 try{return await new Promise((resolve,reject)=>{const timer=setTimeout(()=>{reject(Error('Worker deadline'));},30000);worker.once('error',e=>{clearTimeout(timer);reject(e);});worker.once('message',value=>{clearTimeout(timer);resolve(value);});worker.postMessage({revision:'local-report-reproducer',sketch:source,boundary:structuredClone(boundary),externalParameters:{},localJacobian:{version:1},...extra});});}finally{await worker.terminate();workerLifecycle.terminated++;}
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const lock=constraint('LockPoint',['p'],{x:'1',y:'2'}),source=sketch([point('p',1,2),point('q',5,2,1)],[[lock],[constraint('SignedDistanceX',['p','q'],{distance:'4'},1)]]);
 const result=await solve(source);writeFileSync(resolve(root,'test/solver-stage-diagnostics/before.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({ok:result.ok,diagnostic:result.localJacobian,error:result.error}));
}
