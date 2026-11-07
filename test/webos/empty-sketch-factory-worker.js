// Test-only worker; same real verb bundle and no DOM/canvas shims as solveWorker.
self.importScripts(new URL('../lib/verb.js', self.location.href).href);
const {makeEmptySketch}=require('../../web/app/sketcher/headless/emptySketch');
const {makeRectangleDraft}=require('../../web/app/sketcher/headless/rectangleDraft');
const {HeadlessSketchWorkspace}=require('../../web/app/sketcher/headless/workspace');
const {encodeProjectEnvelope,decodeProjectEnvelope}=require('../../web/app/cad/projectManager/projectEnvelope.mjs');
self.onmessage=event=>{
  try {
    const input=event.data;
    if (input.kind==='accessor') {
      let touched=false; const frame={origin:[0,0,0],x:[1,0,0],y:[0,1,0],z:[0,0,1]};
      Object.defineProperty(frame,'x',{enumerable:true,get(){touched=true;return [1,0,0]}});
      let rejected=false;try{makeEmptySketch('millimeter',frame)}catch(_){rejected=true}
      self.postMessage({ok:true,rejected,touched});self.close();return;
    }
    const draft=input.kind==='rectangle' ? makeRectangleDraft(input.unit,input.frame,input.origin,input.width,input.height) : null;
    const sketch=draft ? draft.sketch : makeEmptySketch(input.unit,input.frame);
    const workspace=new HeadlessSketchWorkspace(Object.create(null));
    workspace.io._loadSketch(sketch,{strict:true});
    const reopened=JSON.parse(workspace.io.serializeSketch(sketch.metadata,{strict:true}));
    reopened.boundary=sketch.boundary;
    const project={model:{history:[],expressions:''},sketches:[{id:'S:0/SURFACE',data:sketch}]};
    const envelope=encodeProjectEnvelope(project), decoded=decodeProjectEnvelope(JSON.parse(JSON.stringify(envelope)));
    self.postMessage({ok:true,sketch,reopened,evidence:draft?.evidence,decoded});
  } catch(error) { self.postMessage({ok:false,error:String(error.message||error)}); }
  self.close();
};
