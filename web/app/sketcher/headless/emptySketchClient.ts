import {runSketchSolve, SketchSolveOptions} from './client';

// Internal Worker request only. This prepares data and has no publication authority.
export function runEmptySketchPreparation(workerUrl:string, input:any, options:SketchSolveOptions={}) {
  const record=(v:any,keys:string[])=>{
    if(!v||typeof v!=='object'||Array.isArray(v)||![null,Object.prototype].includes(Object.getPrototypeOf(v))||Reflect.ownKeys(v).length!==keys.length)throw Error('Invalid empty sketch request.');
    const out:any={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(v,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))throw Error('Invalid empty sketch request.');out[key]=d.value;}return out;
  };
  const args=record(input,['revision','unit','frame']), frame=record(args.frame,['origin','x','y','z']);
  if(typeof workerUrl!=='string'||typeof args.revision!=='string'||!args.revision||args.revision.length>256||args.unit!=='millimeter')throw Error('Invalid empty sketch request.');
  for(const key of ['origin','x','y','z']){
    const a=frame[key];if(!Array.isArray(a)||Object.getPrototypeOf(a)!==Array.prototype||a.length!==3||Reflect.ownKeys(a).length!==4)throw Error('Invalid empty sketch frame.');
    frame[key]=Object.freeze([0,1,2].map(i=>{const d=Object.getOwnPropertyDescriptor(a,String(i));if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value')||typeof d.value!=='number'||!Number.isFinite(d.value)||Math.abs(d.value)>1e9)throw Error('Invalid empty sketch frame.');return d.value;}));
  }
  if(!options||typeof options!=='object'||Array.isArray(options)||![null,Object.prototype].includes(Object.getPrototypeOf(options))||Reflect.ownKeys(options).some(k=>typeof k!=='string'||!['signal','valid','timeoutMs'].includes(k)))throw Error('Invalid empty sketch options.');
  const opts:any={};for(const key of Reflect.ownKeys(options) as string[]){const d=Object.getOwnPropertyDescriptor(options,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))throw Error('Invalid empty sketch options.');opts[key]=d.value;}
  if(opts.valid!==undefined&&typeof opts.valid!=='function')throw Error('Invalid empty sketch options.');
  if(opts.signal!==undefined)try{Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get.call(opts.signal)}catch{throw Error('Invalid cancellation signal.')}
  const timeout=opts.timeoutMs===undefined?30000:opts.timeoutMs;if(!Number.isSafeInteger(timeout)||timeout<1||timeout>30000)throw Error('Invalid empty sketch timeout.');
  const deadline=performance.now()+timeout,current=()=>{let valid=false;try{valid=!opts.signal?.aborted&&(!opts.valid||opts.valid()===true)&&!opts.signal?.aborted}catch{}if(!valid)throw new DOMException('Empty sketch preparation cancelled.','AbortError');if(performance.now()>=deadline)throw Error('Empty sketch preparation timed out.');};
  current();
  return runSketchSolve(workerUrl,Object.freeze({task:'sketch-transition-empty',revision:args.revision,unit:args.unit,frame:Object.freeze(frame)}),{signal:opts.signal,valid:opts.valid,timeoutMs:timeout}).then(async result=>{
    current();if(!result.ok){const e=record(result,['revision','ok','error']),error=record(e.error,['code','message']);if(e.revision!==args.revision||typeof error.code!=='string'||!error.code||error.code.length>64||typeof error.message!=='string'||error.message.length>512)throw Error('Invalid empty sketch result.');current();return Object.freeze({revision:args.revision,ok:false,error:Object.freeze(error)});}
    const value=record(result,['revision','ok','serializedSketch']);if(value.revision!==args.revision||value.ok!==true||typeof value.serializedSketch!=='string'||value.serializedSketch.length>1048576)throw Error('Invalid empty sketch result.');const encoder=new TextEncoder();let bytes=0;for(let start=0;start<value.serializedSketch.length;){let end=Math.min(start+32768,value.serializedSketch.length);if(end<value.serializedSketch.length&&value.serializedSketch.charCodeAt(end-1)>=0xd800&&value.serializedSketch.charCodeAt(end-1)<=0xdbff&&value.serializedSketch.charCodeAt(end)>=0xdc00&&value.serializedSketch.charCodeAt(end)<=0xdfff)end--;bytes+=encoder.encode(value.serializedSketch.slice(start,end)).byteLength;if(bytes>1048576)throw Error('Invalid empty sketch result.');start=end;if(start<value.serializedSketch.length){await new Promise(resolve=>setTimeout(resolve,0));current();}}current();return Object.freeze({revision:args.revision,ok:true,serializedSketch:value.serializedSketch});
  });
}
