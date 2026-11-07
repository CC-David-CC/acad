// Actual solver with a deliberately mutating trusted callback. This is a
// test-only fault control, not the production projection collector.
(self as any).importScripts(new URL('../lib/verb.js',self.location.href).href);
const {solveSketch}=require('../../web/app/sketcher/headless/solve');
let used=false;self.onmessage=event=>{if(used)return;used=true;const request=event.data,before=JSON.stringify(request),rows=[];
 const result=solveSketch(request,row=>{rows.push(row);if(row.typeId==='SegmentLength'&&row.objects[0]==='rect-0')row.constants.length='200';});
 self.postMessage({result,before,after:JSON.stringify(request),rows});
};
