// Research-only isolated sketch solver. Not wired to product operations.
self.window=self;
importScripts("../lib/verb.js", "../lib/diff_match_patch.js");
self.devicePixelRatio=1;
self.requestAnimationFrame=()=>0;
const {Viewer}=require('sketcher/viewer2d');
const {IO}=require('sketcher/io');
self.onmessage=event=>{
 try{
  const canvas=new OffscreenCanvas(8,8);canvas.parentNode={offsetWidth:8,offsetHeight:8};canvas.style={};canvas.setAttribute=()=>{};canvas.addEventListener=()=>{};canvas.removeEventListener=()=>{};canvas.focus=()=>{};
  const viewer=new Viewer(canvas,IO,{});
  try{
   viewer.io._loadSketch(event.data,{strict:true});
   const statuses=viewer.parametricManager.stages.map(s=>({success:s.algNumSystem.solveStatus.success,error:s.algNumSystem.solveStatus.error,conflicts:[...s.algNumSystem.conflicting].map(c=>c.schema.id),redundant:[...s.algNumSystem.redundant].map(c=>c.schema.id)}));
   const solved=JSON.parse(viewer.io.serializeSketch(undefined,{strict:true}));
   self.postMessage({statuses,objects:solved.objects.filter(o=>o.type==='Circle').map(o=>o.data),constraints:solved.stages.flatMap(s=>s.constraints)});
  }finally{viewer.dispose()}
 }catch(e){self.postMessage({error:String(e?.stack||e)})}
};
