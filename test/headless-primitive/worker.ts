(self as any).importScripts('/static/verb.js');
const {makeEmptySketch}=require('../../web/app/sketcher/headless/emptySketch');
const {appendSketchPrimitive}=require('../../web/app/sketcher/headless/primitiveTransition');
let used=false;self.onmessage=e=>{if(used)return;used=true;try{self.postMessage(e.data.mode==='empty'?{ok:true,sketch:makeEmptySketch('millimeter',e.data.frame)}:appendSketchPrimitive(e.data.request));}catch(error){self.postMessage({ok:false,error:{code:error?.code||'ERROR',message:error?.message||'failed'}})}};
