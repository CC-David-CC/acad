// Exact oracle and direct native API both run off the UI thread. Native
// classification does not consume oracle answers and no tessellation is used.
import createRaw from './raw-provider.mjs';
import {cellOracle} from './cells.mjs';
self.onmessage=async({data:{row,wasmSha256}})=>{
 let kernel;const report={id:row.id};
 try{
  report.oracle=cellOracle(row.expr);
  const bytes=await(await fetch('./raw-provider.wasm',{cache:'no-store',credentials:'omit'})).arrayBuffer();
  const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');if(hash!==wasmSha256)throw Error('Native WASM SHA mismatch');
  kernel=await createRaw({wasmBinary:new Uint8Array(bytes)});
  const call=(name,...args)=>{const text=kernel.UTF8ToString(kernel[name](...args));if(text.length>35000000)throw Error('Native response budget');return JSON.parse(text);};
  const initialized=call('_binding_init');if(initialized.error)throw Error(JSON.stringify(initialized));
  const handles=new Map(),proofs=new Map();let operations=0;
  const evaluate=expr=>{
   const key=JSON.stringify(expr);if(handles.has(key))return handles.get(key);if(++operations>20)throw Error('Native operation budget');
   let result;if(expr.op==='box')result=call('_binding_box',...expr.origin,...expr.dimensions);else result=call('_binding_boolean',evaluate(expr.a),evaluate(expr.b),{union:0,common:1,subtract:2}[expr.op]);
   if(result.error||!Number.isSafeInteger(result.handle))throw Object.assign(Error(result.error||'Missing native handle'),{native:result});
   handles.set(key,result.handle);proofs.set(result.handle,call('_binding_inspect',result.handle));return result.handle;
  };
  const start=performance.now(),handle=evaluate(row.expr);report.nativeMs=performance.now()-start;
  report.native=call('_binding_inspect',handle);report.operations=operations;
  report.sourcesUnchanged=[...proofs].every(([id,proof])=>JSON.stringify(call('_binding_inspect',id))===JSON.stringify(proof));
 }catch(error){report.error={message:error.message,native:error.native||null};}
 finally{if(kernel)kernel._binding_close();self.postMessage(report);close();}
};
