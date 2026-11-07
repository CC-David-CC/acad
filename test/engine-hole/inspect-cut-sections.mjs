// Independent approximate mesh-section evidence, not exact BRep proof.
import assert from 'node:assert/strict';
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export function raySections(topology,origin,direction){
 const hits=[];
 for(const face of topology.faces)for(const triangle of face.triangles){
  const [a,b,c]=triangle,e1=sub(b,a),e2=sub(c,a),p=cross(direction,e2),det=dot(e1,p);
  if(Math.abs(det)<1e-12)continue;
  const s=sub(origin,a),u=dot(s,p)/det;if(u < -1e-9 || u > 1+1e-9)continue;
  const q=cross(s,e1),v=dot(direction,q)/det;if(v < -1e-9 || u+v > 1+1e-9)continue;
  const t=dot(e2,q)/det;if(t>=0)hits.push(t);
 }
 hits.sort((a,b)=>a-b);
 return hits.filter((t,i)=>i===0||Math.abs(t-hits[i-1])>1e-6);
}
export function inspectCutSections(topology,{width,height,depth,origin}){
 const [x,y,z]=origin,center=[x+width/2,y+height/2],above=z+depth+10;
 assert.deepEqual(raySections(topology,[...center,above],[0,0,-1]),[],'The centered through opening is obstructed.');
 const material=raySections(topology,[center[0]+10,center[1],above],[0,0,-1]);
 assert.equal(material.length,2,'Material beside the hole must have two support faces.');
 assert.ok(Math.abs(material[0]-10)<1e-6);assert.ok(Math.abs(material[1]-(depth+10))<1e-6);
 const transverse=raySections(topology,[x-10,center[1],z+depth/2],[1,0,0]);
 assert.equal(transverse.length,4,'A transverse section must cross outer walls and both sides of the hole.');
 assert.ok(Math.abs(transverse[0]-10)<1e-6);assert.ok(Math.abs(transverse[3]-(width+10))<1e-6);
 // Faceted wall tolerance stays separate from native-volume tolerances.
 assert.ok(Math.abs(transverse[1]-(10+width/2-5))<0.1);
 assert.ok(Math.abs(transverse[2]-(10+width/2+5))<0.1);
 if(width===150&&height===30){
  const oldCenter=raySections(topology,[x+50,y+25,above],[0,0,-1]);
  assert.equal(oldCenter.length,2,'The previous center must contain material after the parent edit.');
 }
 return {centerOpening:true,adjacentMaterial:true,transverseCrossings:4};
}
