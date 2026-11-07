(self as any).importScripts(new URL('../lib/verb.js',self.location.href).href);
const {prepareAcceptedSketchProjection}=require('../../web/app/sketcher/headless/acceptedSketchProjectionWorker');
self.onmessage=event=>{self.postMessage(prepareAcceptedSketchProjection(event.data));};
