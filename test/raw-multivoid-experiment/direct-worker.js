// Test-only raw binding diagnostic. No mount admission/evidence classification.
import createKernel from 'codi-raw-smlib-glue';
self.onmessage=async({data:{variant}})=>{
 let kernel;
 try {
  kernel=await createKernel({wasmBinary:await (await fetch('/raw-provider.wasm')).arrayBuffer()});
  const call=(name,...args)=>{const ptr=kernel[name](...args);return JSON.parse(kernel.UTF8ToString(ptr));};
  const initialized=call('_binding_init');if(initialized.error)throw Error(JSON.stringify(initialized));
  const requireHandle=x=>{if(!Number.isSafeInteger(x.handle))throw Error(JSON.stringify(x));return x.handle;};
  const box=(...args)=>requireHandle(call('_binding_box',...args));
  const bool=(a,b,kind)=>requireHandle(call('_binding_boolean',a,b,kind));
  const outer=box(0,0,0,10,10,10),inner=box(2,2,2,6,6,6),far=box(20,0,0,10,10,10),hollow=bool(outer,inner,2);
  let handle;
  if(variant==='hollow-fill')handle=bool(hollow,inner,0);
  else if(variant==='hollow-fill-reverse')handle=bool(inner,hollow,0);
  else if(variant==='grouped')handle=bool(bool(hollow,inner,0),far,0);
  else {
   const composite=bool(hollow,far,0);
   handle=variant==='fill-reverse'?bool(inner,composite,0):bool(composite,inner,0);
  }
  self.postMessage({variant,inspect:call('_binding_inspect',handle),mesh:call('_binding_tessellate',handle)});
 }catch(e){self.postMessage({variant,error:e.message});}
 finally{if(kernel)kernel._binding_close();close();}
};
