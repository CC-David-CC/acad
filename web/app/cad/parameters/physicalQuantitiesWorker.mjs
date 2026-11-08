import {discoverTypedSketchConsumers} from './discoverTypedSketchConsumers.mjs';
import {resolvePhysicalBindings} from './physicalBindings.mjs';
import {QuantityError} from './physicalQuantities.mjs';
import {evaluatePhysicalSource} from './evaluatePhysicalSource.mjs';
import {decodePhysicalSource} from './physicalSource.mjs';
import {captureTypedRectangleBindingFailure} from './typedRectangleBindings.mjs';

self.onmessage=event=>{
 let revision='',phase='request-capture';
 try{
  const d=event.data,keys=d&&typeof d==='object'&&!Array.isArray(d)?Reflect.ownKeys(d).sort().join(','):'';
  if(!['definitions,revision,version','revision,source,version','manifest,revision,source,version','manifest,revision,sketches,source,version'].includes(keys)||!Reflect.ownKeys(d).every(k=>{const p=Object.getOwnPropertyDescriptor(d,k);return p?.enumerable&&Object.hasOwn(p,'value')})||typeof d.revision!=='string'||!d.revision||d.revision.length>128)throw new QuantityError('INVALID_INPUT','Invalid worker request.');
  revision=d.revision;phase='source-decoding';let request;
  if(keys==='revision,source,version'||keys==='manifest,revision,source,version'||keys==='manifest,revision,sketches,source,version'){
   if(d.version!==1||typeof d.source!=='string')throw new QuantityError('INVALID_INPUT','Invalid source request.');
   request=((keys==='manifest,revision,source,version'||keys==='manifest,revision,sketches,source,version')&&d.source==='')?{version:1,definitions:[]}:decodePhysicalSource(d.source);
   if(!request)throw new QuantityError('INVALID_INPUT','Typed parameter source required.');
  }else request={version:d.version,definitions:d.definitions};
  phase='quantity-evaluation';const result=evaluatePhysicalSource(request);let bindings,sketchConsumers;const sources=new Map();
  if(keys==='manifest,revision,sketches,source,version'){
   phase='sketch-consumer-discovery';
   if(!Array.isArray(d.sketches)||d.sketches.length>64)throw Error('Invalid sketches.');
   for(const row of d.sketches){if(!row||Reflect.ownKeys(row).sort().join(',')!=='id,source'||sources.has(row.id))throw Error('Invalid sketch source.');sources.set(row.id,row.source);}
   sketchConsumers=discoverTypedSketchConsumers(d.sketches,id=>sources.get(id));
  }
  phase='binding-resolution';bindings=keys.includes('manifest,')?resolvePhysicalBindings(d.manifest,result,id=>sources.get(id)):undefined;
  phase='response';self.postMessage({revision,ok:true,result,...(bindings?{bindings}:{}),...(sketchConsumers?{sketchConsumers}:{})});
 }catch(error){
  const rectangle=captureTypedRectangleBindingFailure(error);
  // Known producer failures carry detached, bounded contract metadata. An
  // unknown exception is not evidence of bad caller input or a contradiction;
  // report only this owned phase, without reading its message/code/getters.
  const failure=error instanceof QuantityError?{code:error.code,message:error.message,...(error.parameter?{parameter:error.parameter}:{})}:rectangle||{code:'PHYSICAL_WORKER_FAILED',message:'Physical parameter worker failed during '+phase+'.'};
  self.postMessage({revision,ok:false,error:{...failure,phase}});
 }
};
