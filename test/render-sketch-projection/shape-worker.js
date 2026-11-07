const {projectRenderSketch}=require('../../web/app/sketcher/headless/renderSketchProjection.mjs');
const {EndPoint}=require('../../web/app/sketcher/shapes/point.ts');
const {Segment}=require('../../web/app/sketcher/shapes/segment.ts');
const {Arc}=require('../../web/app/sketcher/shapes/arc.ts');
const {Circle}=require('../../web/app/sketcher/shapes/circle.js');
const {Ellipse}=require('../../web/app/sketcher/shapes/ellipse.js');
const {EllipticalArc}=require('../../web/app/sketcher/shapes/elliptical-arc.js');
const {BezierCurve}=require('../../web/app/sketcher/shapes/bezier-curve.js');
const {Generator}=require('../../web/app/sketcher/id-generator.js');
function assert(value,message){if(!value)throw Error(message)}
const near=(a,b)=>Math.abs(a-b)<1e-9, eqAngle=(a,b)=>near(Math.sin(a),Math.sin(b))&&near(Math.cos(a),Math.cos(b));
function record(shape){const calls=[];const ctx={beginPath(){},stroke(){},fill(){},save(){},restore(){},setLineDash(){},moveTo(...a){calls.push(['moveTo',...a])},lineTo(...a){calls.push(['lineTo',...a])},arc(...a){calls.push(['arc',...a])},ellipse(...a){calls.push(['ellipse',...a])},bezierCurveTo(...a){calls.push(['cubic',...a])}};shape.drawImpl(ctx,1);return calls}
self.onmessage=()=>{try{
 const shapes=[new EndPoint(2,3,'p'),new Segment(-2,1,3,4,'s'),new Circle(2,0,3,'c'),new Arc(1,0,0,-1,0,0,'a'),new Arc(1,0,1,0,0,0,'full'),new Ellipse(0,0,4,2,0.5,'e'),new EllipticalArc(0,0,4,2,0,4,0,0,2,'q'),new BezierCurve(0,0,1,2,3,4,5,6,'b')];
 const source={version:3,objects:shapes.map((s,i)=>({id:s.id,type:s.TYPE,role:i===0?'construction':null,stage:0,data:s.write()})),stages:[{constraints:[],generators:[]}],dimensions:[],labels:[]};
 const before=Generator.genID(),out=projectRenderSketch(source),after=Generator.genID();assert(after===before+1,'projection allocated native sketch IDs');assert(!out.unsupported.length,'unexpected unsupported shape');
 for(let i=0;i<shapes.length;i++){const s=shapes[i],g=out.objects[i].geometry,calls=record(s),descendants=new Map(),visit=o=>{descendants.set(o.id,o);for(const child of o.children||[])visit(child)};visit(s);for(const h of out.objects[i].handles){const native=descendants.get(h.id);assert(native&&near(native.x,h.x)&&near(native.y,h.y),'handle identity/coordinates')}if(g.kind==='point'){const x=calls.find(c=>c[0]==='arc');assert(x&&near(x[1],g.x)&&near(x[2],g.y),'point')}
 else if(g.kind==='segment'){const m=calls.find(c=>c[0]==='moveTo'),l=calls.find(c=>c[0]==='lineTo');assert(m&&l&&near(m[1],g.a.x)&&near(m[2],g.a.y)&&near(l[1],g.b.x)&&near(l[2],g.b.y),'segment')}
 else if(g.kind==='circle'||g.kind==='arc'){const x=calls.find(c=>c[0]==='arc');assert(x&&near(x[1],g.c.x)&&near(x[2],g.c.y)&&near(x[3],g.r),'circle/arc center');if(g.kind==='arc')assert(eqAngle(x[4],g.start)&&eqAngle(x[5],g.end)&&((x[5]-x[4]>6)===g.fullCircle),'arc direction')}
 else if(g.kind==='ellipse'||g.kind==='ellipticalArc'){const x=calls.find(c=>c[0]==='ellipse');assert(x&&near(x[1],g.c.x)&&near(x[2],g.c.y)&&near(x[3],g.rx)&&near(x[4],g.ry)&&near(x[5],g.rotation),'ellipse');if(g.kind==='ellipticalArc')assert(eqAngle(x[6],g.start)&&eqAngle(x[7],g.end),'ellipse arc')}
 else if(g.kind==='cubic'){const m=calls.find(c=>c[0]==='moveTo'),x=calls.find(c=>c[0]==='cubic');assert(m&&x&&near(m[1],g.p0.x)&&near(m[2],g.p0.y)&&[g.p1.x,g.p1.y,g.p2.x,g.p2.y,g.p3.x,g.p3.y].every((n,j)=>near(n,x[j+1])),'bezier')}
 }
 assert(out.objects[0].role==='construction','role');assert(out.bounds.complete,'bounds coverage');self.postMessage({ok:true,count:shapes.length,noIdAllocation:true,kinds:out.objects.map(x=>x.geometry.kind)});
 }catch(e){self.postMessage({ok:false,error:String(e),stack:e.stack})}};
