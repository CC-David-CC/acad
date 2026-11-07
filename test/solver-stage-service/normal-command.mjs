import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import vm from 'node:vm';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
// The unchanged Verb distribution distinguishes Worker-capable hosts through
// importScripts. Provide that platform loader without a DOM/window shim.
globalThis.self=globalThis;globalThis.importScripts=url=>{const value=new URL(url);if(value.protocol!=='file:')throw Error('Only local code imports are supported');vm.runInThisContext(readFileSync(fileURLToPath(value),'utf8'),{filename:fileURLToPath(value)});};vm.runInThisContext(readFileSync(resolve(root,'web/lib/verb.js'),'utf8'),{filename:'actual-verb.js'});
const {fixture:createFixture}=createRequire(import.meta.url)(resolve(root,'.build/solver-stage-service/service.cjs'));
export const bridgePath=process.env.CAD_DIAGNOSTIC_BRIDGE||'/tmp/codi-desktop-mechanical-candidate-20261105/apps/system/jsketcher/diagnostic-commands.mjs';
const {registerSketchDiagnosticCommands}=await import(pathToFileURL(bridgePath));
export const point=(id,x,y,stage=0)=>({id,type:'Point',role:null,stage,data:{x,y}});
export const constraint=(typeId,objects,constants,stage=0,state='accepted')=>({typeId,objects,constants,stage,annotations:['SignedDistanceX','SignedDistanceY','SegmentLength','DiameterLength'].includes(typeId)?[{offset:20}]:[],admission:{version:1,state}});
export const sketch=(objects,stages)=>({version:3,objects,dimensions:[],labels:[],stages:stages.map(constraints=>({constraints,generators:[]})),constants:'',boundary:{lines:[],arcs:[],circles:[],nurbses:[]}});
export const twoStage=()=>sketch([point('p',1,2),point('q',5,2,1)],[[constraint('LockPoint',['p'],{x:'1',y:'2'})],[constraint('SignedDistanceX',['p','q'],{distance:'4'},1)]]);
export function fixture(source,run,options={}){
 const f=createFixture(source,run,options),hostLife=new AbortController(),handlers=new Map(),session={fixtureSession:true};let attached=true;
 const host={signal:hostLife.signal,session:()=>session,commands:{register(descriptor,handler){handlers.set(descriptor.id,handler);return()=>handlers.delete(descriptor.id);}}};
 const stop=registerSketchDiagnosticCommands(host,()=>({diagnostics:f.service,valid:()=>attached}));
 const invoke=(id,args)=>{const handler=handlers.get(id);if(!handler)throw Error('Command not registered');return handler(args);};
 return{...f,hostLife,handlers,invoke,inspect:()=>invoke('inspect-sketch-diagnostics',{}),analyze:()=>{const inventory=invoke('inspect-sketch-diagnostics',{});return invoke('analyze-sketch',{revision:inventory.revision,mode:options.active?'active':'saved',faceId:f.face.id});},detach(){attached=false;},close(){attached=false;stop();hostLife.abort();f.close();}};
}
