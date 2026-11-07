// Drawing/selection only. Authoritative source stays in the craft workspace.
// No solver, parameter manager or editable shape graph lives in this surface.
export function createWorkerSketchCanvas(canvas:HTMLCanvasElement, requireCurrent:()=>void, selected:(id:string)=>void) {
 const context=canvas.getContext('2d');if(!context)throw Error('2D drawing unavailable.');
 const hitCanvas=document.createElement('canvas');hitCanvas.width=hitCanvas.height=1;
 const hit=hitCanvas.getContext('2d');if(!hit)throw Error('2D selection unavailable.');
 let closed=false,epoch=0,projection:any=null,paths:any[]=[],selection:string[]=[],transform:any=null;
 const check=(version:number)=>{if(closed||version!==epoch)throw new DOMException('Drawing superseded.','AbortError');requireCurrent();if(closed||version!==epoch)throw new DOMException('Drawing superseded.','AbortError');};
 const waiting=new Map<number,(error:any)=>void>(),buffers=new Set<HTMLCanvasElement>();
 const cancelWork=()=>{epoch++;for(const [id,reject] of waiting){cancelAnimationFrame(id);reject(new DOMException('Drawing superseded.','AbortError'));}waiting.clear();for(const buffer of buffers)buffer.width=buffer.height=1;buffers.clear();};
 const pause=()=>new Promise<void>((resolve,reject)=>{const id=requestAnimationFrame(()=>{waiting.delete(id);resolve()});waiting.set(id,reject)});
 async function path(g:any,pointRadius:number,version:number){const p=new Path2D();if(!g)return null;
  if(g.kind==='point')p.arc(g.x,g.y,pointRadius,0,2*Math.PI);
  else if(g.kind==='segment'){p.moveTo(g.a.x,g.a.y);p.lineTo(g.b.x,g.b.y)}
  else if(g.kind==='circle')p.arc(g.c.x,g.c.y,g.r,0,2*Math.PI);
  else if(g.kind==='arc')p.arc(g.c.x,g.c.y,g.r,g.start,g.fullCircle?g.start+2*Math.PI:g.end);
  else if(g.kind==='ellipse'||g.kind==='ellipticalArc')p.ellipse(g.c.x,g.c.y,g.rx,g.ry,g.rotation,g.start??0,g.fullCircle?((g.start??0)+2*Math.PI):(g.end??2*Math.PI));
  else if(g.kind==='polyline'){p.moveTo(g.points[0].x,g.points[0].y);let slice=performance.now();for(let i=1;i<g.points.length;i++){p.lineTo(g.points[i].x,g.points[i].y);if(i%128===0&&performance.now()-slice>=4){await pause();check(version);slice=performance.now();}}}
  else if(g.kind==='cubic'){p.moveTo(g.p0.x,g.p0.y);p.bezierCurveTo(g.p1.x,g.p1.y,g.p2.x,g.p2.y,g.p3.x,g.p3.y)}
  else return null;return p;
 }
 async function install(next:any){if(closed)throw Error('Drawing closed.');cancelWork();const version=epoch;check(version);
  const rect=canvas.getBoundingClientRect(),ratio=Math.min(window.devicePixelRatio||1,2),width=Math.max(1,Math.round(rect.width*ratio)),height=Math.max(1,Math.round(rect.height*ratio));
  // Render privately and swap once; cancellation never shows half a sketch.
  const buffer=document.createElement('canvas');buffers.add(buffer);buffer.width=width;buffer.height=height;const ctx=buffer.getContext('2d');if(!ctx)throw Error('2D drawing unavailable.');
  const b=next.bounds,minX=b?.minX??-10,maxX=b?.maxX??10,minY=b?.minY??-10,maxY=b?.maxY??10;
  const scale=Math.min(width/Math.max(maxX-minX,1),height/Math.max(maxY-minY,1))*0.82,tx=width/2-scale*(minX+maxX)/2,ty=height/2+scale*(minY+maxY)/2;
  const nextPaths=[];let slice=performance.now();
  try{ctx.fillStyle='#222';ctx.fillRect(0,0,width,height);ctx.setTransform(scale,0,0,-scale,tx,ty);ctx.lineWidth=1.5*ratio/scale;
   for(const object of next.objects){const p=await path(object.geometry,3*ratio/scale,version);check(version);if(p){ctx.strokeStyle=selection.includes(object.id)?'#ffcf5b':object.role==='construction'?'#a2a2b5':'#69a8ff';ctx.setLineDash(object.role==='construction'?[6*ratio/scale,4*ratio/scale]:[]);ctx.stroke(p);nextPaths.push({id:object.id,path:p,point:object.geometry.kind==='point'});}if(performance.now()-slice>=4){await pause();check(version);slice=performance.now();}}
   check(version);canvas.width=width;canvas.height=height;context.setTransform(1,0,0,1,0,0);context.drawImage(buffer,0,0);projection=next;paths=nextPaths;transform={scale,tx,ty,ratio};
  }finally{buffers.delete(buffer);buffer.width=buffer.height=1;}
 }
 const click=async(event:MouseEvent)=>{const version=epoch;try{check(version);if(!transform)return;const rect=canvas.getBoundingClientRect(),t=transform;
  const x=((event.clientX-rect.left)*canvas.width/rect.width-t.tx)/t.scale,y=-((event.clientY-rect.top)*canvas.height/rect.height-t.ty)/t.scale;hit.lineWidth=10*t.ratio/t.scale;
  let id=null,slice=performance.now();for(let i=paths.length-1;i>=0;i--){if((paths[i].point&&hit.isPointInPath(paths[i].path,x,y))||hit.isPointInStroke(paths[i].path,x,y)){id=paths[i].id;break}if(performance.now()-slice>=4){await pause();check(version);slice=performance.now();}}check(version);if(id)selected(id);
 }catch(error){if(error?.name!=='AbortError')console.error(error)}};
 canvas.addEventListener('click',click);
 return Object.freeze({install,async select(ids:readonly string[]){requireCurrent();selection=[...ids];if(projection)await install(projection)},clear(){cancelWork();projection=null;paths=[];transform=null;context.clearRect(0,0,canvas.width,canvas.height)},close(){closed=true;cancelWork();canvas.removeEventListener('click',click);projection=null;paths=[];transform=null;canvas.width=canvas.height=hitCanvas.width=hitCanvas.height=1;}});
}
