import {test} from 'node:test';
import assert from 'node:assert/strict';
import {analyticCircle,analyticCylinder} from '../../modules/engine/projection/drilledAnalyticGeometry.mjs';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
const vec=(a,b)=>a.forEach((v,i)=>near(v,b[i]));
const frame={origin:[50,25,-1],x:[1,0,0],y:[0,1,0],axis:[0,0,1],radius:5};
test('circle point, parameter and tangent use true analytic arc',()=>{
 const c=analyticCircle({...frame,origin:[50,25,20],domain:[0,2*Math.PI]});
 vec(c.point(Math.PI/2),[50,30,20]); vec(c.eval(Math.PI/2)[1],[-5,0,0]);near(c.param([50,30,20]),Math.PI/2);
});
test('cylinder point, normal, derivatives and parameter are analytic',()=>{
 const c=analyticCylinder({...frame,domainU:[0,2*Math.PI],domainV:[1,21]});
 vec(c.point(Math.PI/2,21),[50,30,20]);vec(c.normal(Math.PI/2,21),[0,1,0]);
 const e=c.eval(Math.PI/2,21);vec(e[1],[-5,0,0]);vec(e[2],[0,0,1]);vec(c.param([50,30,20]),[Math.PI/2,21]);
});
test('malformed, nonfinite and left-handed frames refuse',()=>{
 for(const f of [{...frame,radius:0},{...frame,axis:[0,0,0]},{...frame,y:[0,-1,0]},{...frame,x:[1,,0]}]) assert.throws(()=>analyticCircle({...f,domain:[0,2*Math.PI]}));
 assert.throws(()=>analyticCylinder({...frame,domainU:[0,Infinity],domainV:[0,1]}));
});

test('standalone real OCC cut analytic frames reproduce circle vertices and cylinder samples',async()=>{
 const {readFile}=await import('node:fs/promises');
 const data=JSON.parse(await readFile(new URL('../engine-hole-projection/fixtures/standalone-box-cut.json',import.meta.url),'utf8'));
 let circles=0,cylinders=0;
 for(const face of data.faces){
  if(face.type==='cylinder'){
   cylinders++;const c=analyticCylinder({origin:face.origin,x:face.xDirection,y:face.yDirection,axis:face.axis,radius:face.radius,domainU:face.uv.slice(0,2),domainV:face.uv.slice(2,4)});
   for(const tri of face.triangles) for(const p of tri){const uv=c.param(p),q=c.point(...uv);vec(q,p);}
  }
  for(const loop of face.loops)for(const edge of loop)if(edge.type==='circle'){
   circles++;const c=analyticCircle({origin:edge.center,x:edge.xDirection,y:edge.yDirection,axis:edge.axis,radius:edge.radius,domain:edge.range});
   vec(c.point(edge.range[0]),data.vertices[edge.start-1]);vec(c.point(edge.range[1]),data.vertices[edge.end-1]);
  }
 }
 assert.equal(cylinders,1);assert.equal(circles,4);
});
