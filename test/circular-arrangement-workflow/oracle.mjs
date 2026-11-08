// Independent finite source equations and analytic quantities. No CAD imports.
import assert from 'node:assert/strict';
export const fixtures=Object.freeze([
 {id:'lens',centers:[[0,0],[6,0]],radii:[5,5],relation:'proper-overlap',masks:[3],lifecycle:true},
 {id:'left-crescent',centers:[[0,0],[6,0]],radii:[5,5],relation:'proper-overlap',masks:[1]},
 {id:'right-crescent',centers:[[0,0],[6,0]],radii:[5,5],relation:'proper-overlap',masks:[2]},
 {id:'tangent',centers:[[0,0],[10,0]],radii:[5,5],relation:'external-tangent',masks:[1,2]},
 {id:'coincident',centers:[[0,0],[0,0]],radii:[5,5],relation:'coincident',masks:[3]},
 {id:'nested',centers:[[0,0],[0,0]],radii:[5,2],relation:'nested-0',masks:[1,3],ordinary:true},
 {id:'disjoint',centers:[[0,0],[12,0]],radii:[5,5],relation:'disjoint',masks:[1,2],ordinary:true}
]);
export const boundaryFixtures=Object.freeze([
 {id:'outside-1e-3',distance:10+1e-3,relation:'disjoint'},
 {id:'outside-1e-6',distance:10+1e-6,relation:'disjoint'},
 {id:'outside-1e-8',distance:10+1e-8,relation:'disjoint'},
 {id:'inside-1e-6',distance:10-1e-6,relation:'proper-overlap'}
]);
export const canonical=value=>JSON.stringify(function sort(v){return Array.isArray(v)?v.map(sort):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,sort(v[k])])):v;}(value));
export function circleTruth(source,ids){
 const s=typeof source==='string'?JSON.parse(source):source;assert.equal(s.version,3);assert.equal(s.objects.length,2);assert.deepEqual(s.objects.map(o=>o.id).sort(),ids.slice().sort());
 return ids.map(id=>{const o=s.objects.find(o=>o.id===id);assert.equal(o.type,'Circle');assert.equal(o.role,null);assert.equal(o.stage,0);assert.deepEqual(Object.keys(o.data).sort(),['c','r']);assert.deepEqual(Object.keys(o.data.c).sort(),['x','y']);assert(Number.isFinite(o.data.r)&&o.data.r>0);return{id,center:[o.data.c.x,o.data.c.y],radius:o.data.r};});
}
export function quantities(circles,mask,depth){
 const[a,b]=circles;assert.equal(a.center[1],0);assert.equal(b.center[1],0);const d=b.center[0]-a.center[0];assert(d>=0);const ra=a.radius,rb=b.radius,A=Math.PI*ra*ra,B=Math.PI*rb*rb;let overlap,points=[];
 if(d===0)overlap=Math.min(A,B);else if(d>=ra+rb)overlap=0;else if(d<=Math.abs(ra-rb))overlap=Math.min(A,B);else{const x=(d*d+ra*ra-rb*rb)/(2*d),h=Math.sqrt(ra*ra-x*x);overlap=ra*ra*Math.acos(x/ra)+rb*rb*Math.acos((d-x)/rb)-d*h;points=[[a.center[0]+x,h],[a.center[0]+x,-h]];}
 const area=mask===3?overlap:mask===1?A-overlap:B-overlap;assert(area>0);const include=(p,owner)=>{const other=circles[1-owner],square=(p[0]-other.center[0])**2+(p[1]-other.center[1])**2,inside=square<=other.radius**2,outside=square>=other.radius**2;return mask===3?inside:mask===1?owner===0?outside:inside:owner===1?outside:inside;};
 const extrema=points.slice();for(let owner=0;owner<2;owner++){const c=circles[owner];for(const p of[[c.center[0]-c.radius,0],[c.center[0]+c.radius,0],[c.center[0],-c.radius],[c.center[0],c.radius]])if(include(p,owner))extrema.push(p);}
 // Coincident whole-boundary ownership is shared, not erased by set subtraction.
 if(d===0&&ra===rb&&mask===3)extrema.push([-ra,0],[ra,0],[0,-ra],[0,ra]);
 return{area,volume:area*depth,bounds:{min:[Math.min(...extrema.map(p=>p[0])),Math.min(...extrema.map(p=>p[1])),0],max:[Math.max(...extrema.map(p=>p[0])),Math.max(...extrema.map(p=>p[1])),depth]}};
}
export function material(circles,mask,depth,[x,y,z]){if(!(z>0&&z<depth))return'outside';const bits=circles.reduce((n,c,i)=>n+(((x-c.center[0])**2+(y-c.center[1])**2<c.radius*c.radius)?1<<i:0),0);return bits===mask?'inside':'outside';}
export function probes(circles,mask,depth){const truth=quantities(circles,mask,depth),points=[];search:for(let i=1;i<12;i++)for(let j=1;j<12;j++){const p=[truth.bounds.min[0]+(truth.bounds.max[0]-truth.bounds.min[0])*i/12,truth.bounds.min[1]+(truth.bounds.max[1]-truth.bounds.min[1])*j/12,depth/2];if(material(circles,mask,depth,p)==='inside'&&circles.every(c=>Math.abs(Math.hypot(p[0]-c.center[0],p[1]-c.center[1])-c.radius)>0.1)){points.push(p);if(points.length===2)break search;}}assert(points.length);points.push([0,20,depth/2],[0,0,depth+1]);return points;}
export function checkNative(body,circles,mask,depth,build){const m=body.metrics,t=quantities(circles,mask,depth);assert.equal(m.nativeValidity.valid,true);assert.equal(m.solidCount,1);assert.equal(m.resultKind,'single-solid');assert.equal('sha256:'+m.runtime.jsSha256+':'+m.runtime.wasmSha256,build);assert(Math.abs(m.nativeVolume-t.volume)<=1e-6,`${m.nativeVolume} vs ${t.volume}`);for(const k of['min','max'])m.nativeBounds[k].forEach((v,i)=>assert(Number.isFinite(v)&&Math.abs(v-t.bounds[k][i])<=1e-6));return t;}
