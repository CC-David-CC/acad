// Document-start forwarding instrumentation: observes JavaScript readbacks without
// replacing rendering, authoring geometry, or intercepting browser compositor code.
module.exports=function installReadbackProbe(){
 const events=[],counts=Object.create(null);
 const state=window.__arc25Readback={phase:'startup',events,counts};
 function wrap(proto,name,label){
  if(!proto)return;const d=Object.getOwnPropertyDescriptor(proto,name);if(!d||typeof d.value!=='function')return;
  const original=d.value;
  Object.defineProperty(proto,name,{...d,value:function(...args){
   const key=state.phase+':'+label;counts[key]=(counts[key]||0)+1;
   const started=performance.now(),sample={phase:state.phase,api:label,started,args:args.slice(0,5).map(x=>typeof x==='number'||typeof x==='string'?x:x?.constructor?.name||typeof x),stack:new Error().stack};
   try{return Reflect.apply(original,this,args);}finally{sample.duration=performance.now()-started;if(events.length<32)events.push(sample);}
  }});
 }
 for(const name of ['WebGLRenderingContext','WebGL2RenderingContext'])for(const method of ['readPixels','finish','flush','getBufferSubData'])wrap(window[name]?.prototype,method,name+'.'+method);
 for(const method of ['toDataURL','toBlob'])wrap(window.HTMLCanvasElement?.prototype,method,'HTMLCanvasElement.'+method);
 for(const method of ['getImageData','drawImage'])wrap(window.CanvasRenderingContext2D?.prototype,method,'CanvasRenderingContext2D.'+method);
 wrap(window.OffscreenCanvas?.prototype,'convertToBlob','OffscreenCanvas.convertToBlob');
 for(const method of ['getImageData','drawImage'])wrap(window.OffscreenCanvasRenderingContext2D?.prototype,method,'OffscreenCanvasRenderingContext2D.'+method);
};
