// Independent diagnostic for the nominal 100 x 50 x 20, diameter-10 control.
// This does not authenticate ancestry or validate arbitrary native responses.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {closedCircleOrientation} from '../../modules/engine/projection/circularLoopOrientation.mjs';
export function inspectCutControl(x,{width=100,height=50,depth=20,origin=[0,0,0]}={}) {
 assert.equal(x.scope,'response-local');assert.equal(x.solidCount,1);assert.equal(x.valid,true);
 assert.equal(x.vertices.length,10);assert.equal(x.faces.length,7);
 assert.equal(x.faces.filter(f=>f.type==='plane').length,6);
 assert.equal(x.faces.filter(f=>f.type==='cylinder').length,1);
 const edges=new Map(),holes=[],rimZ=[];
 const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
 for(let i=0;i<3;i++){
  near(Math.min(...x.vertices.map(p=>p[i])),origin[i]);
  near(Math.max(...x.vertices.map(p=>p[i])),origin[i]+[width,height,depth][i]);
 }
 for(const [fi,f] of x.faces.entries())for(const loop of f.loops){
  assert.ok(loop.length>0);
  for(let i=0;i<loop.length;i++){
   const c=loop[i];assert.equal(c.end,loop[(i+1)%loop.length].start);
   assert.ok(Number.isInteger(c.edge)&&c.edge>0);
   for(const v of [c.start,c.end])assert.ok(Number.isInteger(v)&&v>0&&v<=x.vertices.length);
   assert.ok(['FORWARD','REVERSED'].includes(c.orientation));
   const a=edges.get(c.edge)||[];a.push({face:fi,...c});edges.set(c.edge,a);
  }
  if(f.type==='plane'&&loop.length===1&&loop[0].type==='circle'){
   const c=loop[0];assert.equal(c.radius,5);assert.equal(c.start,c.end);
   near(c.center[0],origin[0]+width/2);near(c.center[1],origin[1]+height/2);rimZ.push(c.center[2]);
   holes.push(closedCircleOrientation({axis:c.axis,x:c.xDirection,y:c.yDirection,
    planeNormal:f.normal.map(v=>v*(f.orientation==='REVERSED'?-1:1)),
    start:c.range[0],end:c.range[1],reversed:c.orientation==='REVERSED'}));
  }
 }
 assert.equal(edges.size,15);
 let seams=0;
 for(const a of edges.values()){
  assert.equal(a.length,2);assert.notEqual(a[0].orientation,a[1].orientation);
  assert.equal(a[0].start,a[1].end);assert.equal(a[0].end,a[1].start);
  if(a[0].face===a[1].face){seams++;assert.equal(x.faces[a[0].face].type,'cylinder');assert.equal(a[0].type,'line');}
 }
 assert.equal(seams,1);assert.deepEqual(holes,[-1,-1]);
 rimZ.sort((a,b)=>a-b);near(rimZ[0],origin[2]);near(rimZ[1],origin[2]+depth);
 near(x.signedVolume,width*height*depth-Math.PI*25*depth);
 return {faces:7,edgeGroups:15,vertices:10,periodicSeams:1,innerLoopOrientations:holes};
}
export const inspectNominalCut=x=>inspectCutControl(x);
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href&&process.argv[2]){
 const bytes=fs.readFileSync(process.argv[2]),data=JSON.parse(bytes);
 const result=inspectNominalCut(data);
 const broken=structuredClone(data);broken.faces[0].loops[0][0].end=999;
 assert.throws(()=>inspectNominalCut(broken));
 const reversed=structuredClone(data);const face=reversed.faces.find(f=>f.type==='plane'&&f.loops.some(l=>l.length===1));
 const c=face.loops.find(l=>l.length===1)[0];c.orientation=c.orientation==='FORWARD'?'REVERSED':'FORWARD';
 assert.throws(()=>inspectNominalCut(reversed));
 console.log(JSON.stringify({status:'PASS',inputSHA256:createHash('sha256').update(bytes).digest('hex'),...result,
  limits:'Nominal native-output diagnostic only; reported BRepCheck flag, not independent kernel validity or ancestry proof.'}));
}
