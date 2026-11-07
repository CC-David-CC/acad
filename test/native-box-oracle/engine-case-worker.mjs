// Off-main exact cell oracle + child real, immutable production kernel Worker.
import {boundedOracle} from './bounds.mjs';
self.onmessage=async({data:{row,engine,pins}})=>{
 const out={id:row.id,engine};let native;
 try{
  out.oracle=boundedOracle(row.expr);native=new Worker('/native-worker.js');let seq=0;
  const send=message=>new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>reject(Error('Native response timeout')),6000);
   native.onmessage=({data})=>{clearTimeout(timer);if(['error','unsupported','refused'].includes(data.kind))reject(Object.assign(Error(data.code||data.error||data.kind),{native:data}));else resolve(data);};native.onerror=e=>{clearTimeout(timer);reject(Error(e.message));};native.postMessage(message);
  });
  await send({kind:'init',manifest:{version:1,js:{path:'/embedded-glue-unused',sha256:pins.glue},wasm:{path:'/kernel.wasm',sha256:pins.wasm}}});
  const handles=new Map(),proofs=new Map();let created=0;
  const evaluate=async(expr,force=false)=>{
   const key=JSON.stringify(expr);if(!force&&handles.has(key))return handles.get(key);
   let args;if(expr.op==='box')args={origin:expr.origin,dimensions:expr.dimensions};else{
    const a=await evaluate(expr.a);let b=await evaluate(expr.b);
    // The production protocols require two distinct tokens. A-A therefore
    // materializes a second genuine identical box, preserving expression math.
    if(a===b)b=await evaluate(expr.b,true);args={a,b};
   }
   if(++created>8)throw Error('Ordinary native eight-name resource budget');
   const token='body-'+created,result=await send({kind:expr.op==='box'?'box':expr.op,seq:++seq,token,...args});
   if(result.kind!=='result'||!result.evidence)throw Error('Missing real native result');
   if(!force)handles.set(key,token);proofs.set(token,result.evidence);return token;
  };
  const start=performance.now(),token=await evaluate(row.expr);out.nativeMs=performance.now()-start;out.created=created;out.native=proofs.get(token);
  out.sourcesUnchanged=true;
  for(const [token,proof]of proofs){const result=await send({kind:'solid-mesh',seq:++seq,token});if(JSON.stringify(result.evidence)!==JSON.stringify(proof))out.sourcesUnchanged=false;}
 }catch(error){out.error={message:error.message,native:error.native||null};}
 finally{if(native)native.terminate();self.postMessage(out);close();}
};
