// Check handwritten expected fixtures independently; this is not native proof.
import assert from 'node:assert/strict';
import {cases} from './cases.mjs';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1e-9,Math.abs(b)*1e-12),`${a} != ${b}`);
const area=loop=>loop[0].kind==='circle'?Math.PI*loop[0].radius**2:Math.abs(loop.reduce((s,e)=>s+e.a[0]*e.b[1]-e.a[1]*e.b[0],0))/2;
const inside=(loop,p)=>{
 if(loop[0].kind==='circle'){const c=loop[0];return Math.hypot(p[0]-c.center[0],p[1]-c.center[1])<c.radius;}
 let n=0;for(const e of loop){const [x,y]=p,[a,b]=[e.a,e.b];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])n++;}return n%2===1;
};
for(const c of cases){
 const r=c.request,f=r.frame;near((area(r.region.outer)-r.region.holes.reduce((s,l)=>s+area(l),0))*r.depth,c.volume);
 const local=p=>['x','y','z'].map(k=>p.reduce((s,n,i)=>s+(n-f.origin[i])*f[k][i],0));
 const material=p=>inside(r.region.outer,p)&&!r.region.holes.some(l=>inside(l,p));
 for(const p of c.material){const q=local(p);assert(q[2]>0&&q[2]<r.depth);assert(material(q),c.id+' material');}
 for(const p of c.void){const q=local(p);assert(!material(q),c.id+' void');}
 for(const p of c.boundary){const q=local(p);near(q[2],0);assert(material(q),c.id+' cap interior');}
}
console.log(JSON.stringify({status:'PASS',scope:'Independent handwritten component fixture arithmetic only; no production/native/browser invocation',cases:cases.map(c=>c.id)},null,2));
