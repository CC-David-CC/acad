import {runSketchSolve} from './client';
import {createAcceptedSketchProjectionOwner} from './acceptedSketchProjection.mjs';
import workerUrl from 'codi-headless-sketch-worker';

// Internal owner factory. The guard belongs to the editor, not to an agent or
// a caller-selected transport: it fences the captured source and its lifetime.
export function createSketchProjectionClient(requireCurrent:()=>void) {
  if(typeof requireCurrent!=='function')throw Error('A sketch projection guard is required.');
  let deadline=Infinity,timeout=30000,serial=0;
  const current=()=>{requireCurrent();if(performance.now()>=deadline)throw Error('Sketch projection timed out.');};
  const owner=createAcceptedSketchProjectionOwner(async (request:any,options:any)=>{
    const result=await runSketchSolve(workerUrl,Object.freeze({task:'sketch-transition-projection',...request}),{...options,timeoutMs:timeout});
    if(!result.ok){const error=new Error(result.error.message);Object.defineProperty(error,'code',{value:result.error.code});throw error;}
    return result;
  },current);
  return Object.freeze({
    prepare(input:any,options:any={}) {
      if(!options||typeof options!=='object'||Array.isArray(options)||![Object.prototype,null].includes(Object.getPrototypeOf(options))||Reflect.ownKeys(options).some(k=>typeof k!=='string'||!['signal','timeoutMs'].includes(k)))throw Error('Invalid projection options.');
      const captured:any={};for(const key of Reflect.ownKeys(options) as string[]){const d=Object.getOwnPropertyDescriptor(options,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))throw Error('Invalid projection options.');captured[key]=d.value;}
      const duration=captured.timeoutMs===undefined?30000:captured.timeoutMs;if(!Number.isSafeInteger(duration)||duration<1||duration>30000)throw Error('Invalid projection timeout.');
      timeout=duration;deadline=performance.now()+duration;const sequence=++serial;return owner.prepare(input,{signal:captured.signal}).then(ticket=>{if(sequence===serial)deadline=Infinity;return ticket},error=>{if(sequence===serial)deadline=Infinity;throw error});
    },
    inspect:owner.inspect, retire:owner.retire, close:owner.close
  });
}
