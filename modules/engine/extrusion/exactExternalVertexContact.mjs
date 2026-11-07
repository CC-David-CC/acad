// Worker-only sufficient proof for two ALREADY validated simple polygons.
// No source solving/rewriting or admission of an intersecting/combined wire.
import {orientationSign,segmentRelation} from './simplePolygon.mjs';
const same=(a,b)=>a[0]===b[0]&&a[1]===b[1];
export function hasExactExternalVertexContact(a,b){
 if(a?.kind!=='polygon'||b?.kind!=='polygon')return false;
 const av=a.vertices,bv=b.vertices;
 if(!Array.isArray(av)||!Array.isArray(bv)||av.length<3||bv.length<3||av.length>512||bv.length>512||[...av,...bv].some(p=>!Array.isArray(p)||p.length!==2||!p.every(n=>Number.isFinite(n)&&Math.abs(n)<=1e6)))return false;
 // Exact coordinate extrema exclude contact before pairwise predicates.
 if([0,1].some(k=>Math.max(...av.map(p=>p[k]))<Math.min(...bv.map(p=>p[k]))||Math.max(...bv.map(p=>p[k]))<Math.min(...av.map(p=>p[k]))))return false;
 const candidates=[];let contact=false;
 for(let i=0;i<av.length;i++)for(let j=0;j<bv.length;j++){
  const p=av[i],q=av[(i+1)%av.length],r=bv[j],s=bv[(j+1)%bv.length],relation=segmentRelation(p,q,r,s);
  if(relation==='separate')continue;
  if(relation!=='touching'||![p,q].some(v=>same(v,r)||same(v,s)))return false;
  contact=true;candidates.push([p,q],[r,s]);
 }
 if(!contact)return false;
 // An exact common supporting line puts the WHOLE polygon interiors in
 // opposite open half-planes. The complete segment census above then proves
 // isolated endpoint contact only; no rounded midpoint/tolerance/angle guess.
 for(const [p,q] of candidates){
  const sa=av.map(v=>orientationSign(p,q,v)),sb=bv.map(v=>orientationSign(p,q,v));
  if(sa.every(s=>s>=0)&&sb.every(s=>s<=0)&&sa.some(s=>s>0)&&sb.some(s=>s<0)||
     sa.every(s=>s<=0)&&sb.every(s=>s>=0)&&sa.some(s=>s<0)&&sb.some(s=>s>0))return true;
 }
 return false;
}
