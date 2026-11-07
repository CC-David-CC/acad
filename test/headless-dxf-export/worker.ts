(self as any).importScripts('/static/verb.js');
const {makeEmptySketch}=require('../../web/app/sketcher/headless/emptySketch');
const {appendSketchPrimitive}=require('../../web/app/sketcher/headless/primitiveTransition');
const {exportSketchDXF}=require('../../web/app/sketcher/headless/dxfExport');
const {replaySketchTransition}=require('../../web/app/sketcher/headless/sketchTransition');
let used=false;self.onmessage=e=>{if(used)return;used=true;const m=e.data;try{if(m.mode==='audit-export'){const before=JSON.stringify(m.request);const result=exportSketchDXF(m.request);const replay=replaySketchTransition({revision:m.request.revision,sketchJSON:m.request.sketchJSON,externalParameters:m.request.externalParameters});self.postMessage({...result,requestUnchanged:before===JSON.stringify(m.request),nativeReplay:replay});return;}self.postMessage(m.mode==='empty'?{ok:true,sketch:makeEmptySketch('millimeter',m.frame)}:m.mode==='append'?appendSketchPrimitive(m.request):exportSketchDXF(m.request));}catch(error){self.postMessage({ok:false,error:{code:error?.code||'ERROR',message:error?.message||'failed'}})}};
