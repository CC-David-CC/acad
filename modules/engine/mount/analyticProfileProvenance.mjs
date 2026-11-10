import {createAnalyticProfileWorldCertificate} from './analyticProfileWorldBudget.mjs';
import {requireArcInterval} from '../extrusion/authoredArcBranch.mjs';
import {validateOwnedTopology,validatePrismProvenance,bindPrismSourceSlots} from './ownedTopologyContract.mjs';
const fail=()=>{throw Object.assign(Error('Actual analytic prism does not preserve original curve/cap provenance'),{code:'ANALYTIC_PROFILE_PROVENANCE_UNRESOLVED'});};
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const close=(a,b)=>distance(a,b)<=1e-9;
const parallel=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]))<=1e-12||Math.hypot(...a.map((v,i)=>v+b[i]))<=1e-12;
export function validateAnalyticPrismProvenance(value,rawTopology,prepared){
 const topology=validateOwnedTopology(rawTopology),checked=validatePrismProvenance(value,topology,prepared);
 if(checked.status!=='available')fail();const v=checked.data,curves=prepared.loops[0].curves,f=prepared.frame,world=(p,upper)=>f.origin.map((v,i)=>v+(f.x[i]*p[0]+f.y[i]*p[1])+(upper?f.z[i]*prepared.depth:0));
 const worldProof=createAnalyticProfileWorldCertificate(f,prepared.depth);
 const first=topology.faces[v.caps.firstFace-1],last=topology.faces[v.caps.lastFace-1];
 if(first.type!=='plane'||last.type!=='plane'||!parallel(first.analytic.normal,f.z)||!parallel(last.analytic.normal,f.z))fail();
 const onPlane=(p,plane)=>Math.abs(p.reduce((n,x,i)=>n+(x-plane.origin[i])*plane.normal[i],0))<=1e-9;
 const row=v.sourceLoops[0],firstUses=new Set(first.wires.flat().map(u=>u.edge)),lastUses=new Set(last.wires.flat().map(u=>u.edge));
 if(first.wires.length!==1||last.wires.length!==1||firstUses.size!==curves.length||lastUses.size!==curves.length)fail();
 for(let i=0;i<curves.length;i++){
  const c=curves[i],start=c.orientation==='forward'?c.a:c.b,end=c.orientation==='forward'?c.b:c.a,j=row.vertices[i],next=row.vertices[(i+1)%row.vertices.length],map=row.edges[i],side=topology.faces[map.sweptFace-1];
  if(!firstUses.has(map.firstEdge)||!lastUses.has(map.lastEdge))fail();
  const sideUses=new Set(side.wires.flat().map(u=>u.edge));if(![map.firstEdge,map.lastEdge,j.sweptEdge,next.sweptEdge].every(edge=>sideUses.has(edge)))fail();
  for(const [upper,vertex,after,edgeIndex] of [[false,j.firstVertex,next.firstVertex,map.firstEdge],[true,j.lastVertex,next.lastVertex,map.lastEdge]]){
   const a=topology.vertices[vertex-1]?.point,b=topology.vertices[after-1]?.point,edge=topology.edges[edgeIndex-1],plane=upper?last.analytic:first.analytic;
   if(!a||!b||!close(a,world(start,upper))||!close(b,world(end,upper))||!onPlane(a,plane)||!onPlane(b,plane)||edge.degenerated||edge.vertices.length!==2||!edge.vertices.includes(vertex)||!edge.vertices.includes(after))fail();
   worldProof.assertPoint(start,upper,a);worldProof.assertPoint(end,upper,b);
   if(c.kind==='segment'){
    if(edge.type!=='line'||side.type!=='plane'||![world(c.a,false),world(c.b,false),world(c.a,true),world(c.b,true)].every(p=>onPlane(p,side.analytic)))fail();
    const u=world(c.a,upper),w=world(c.b,upper).map((v,k)=>v-u[k]),len=Math.hypot(...w);
    if(!len||!parallel(edge.analytic.direction,w.map(v=>v/len)))fail();
   }else{
    const circle=edge.analytic,r=Math.hypot(c.a[0]-c.center[0],c.a[1]-c.center[1]),data={a:{x:c.a[0],y:c.a[1]},b:{x:c.b[0],y:c.b[1]},c:{x:c.center[0],y:c.center[1]},branch:c.branch},branch=requireArcInterval(data);
    if(edge.type!=='circle'||side.type!=='cylinder'||!close(circle.center,world(c.center,upper))||Math.abs(circle.radius-r)>1e-9||!parallel(circle.axis,f.z)||Math.abs((edge.range[1]-edge.range[0])-branch.sweep)*r>1e-9||Math.abs(side.analytic.radius-r)>1e-9||!parallel(side.analytic.axis,f.z))fail();
    const actualSweep=edge.range[1]-edge.range[0];if(c.branch==='full-ccw'?actualSweep!==2*Math.PI:!(actualSweep>0&&actualSweep<2*Math.PI))fail();
    worldProof.assertCircle(c,upper,circle,edge.range);
    const axisDelta=side.analytic.origin.map((v,k)=>v-world(c.center,false)[k]),along=axisDelta.reduce((n,v,k)=>n+v*f.z[k],0);if(Math.hypot(...axisDelta.map((v,k)=>v-along*f.z[k]))>1e-9)fail();
    const evaluate=t=>circle.center.map((v,k)=>v+circle.radius*(circle.x[k]*Math.cos(t)+circle.y[k]*Math.sin(t)));
    // Wire reversal preserves the underlying A->B support parameterization.
    // The separate exact world-support proof requires its genuine zero phase;
    // a changed chart remains explicitly unqualified rather than guessed.
    if(!close(evaluate(edge.range[0]),world(c.a,upper))||!close(evaluate(edge.range[1]),world(c.b,upper)))fail();
   }
  }
  const connector=topology.edges[j.sweptEdge-1];if(connector.type!=='line'||!connector.vertices.includes(j.firstVertex)||!connector.vertices.includes(j.lastVertex)||!parallel(connector.analytic.direction,f.z))fail();
 }
 return bindPrismSourceSlots(checked,prepared);
}
