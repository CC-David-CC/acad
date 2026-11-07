// Independent arithmetic only; no CAD imports or authoring operations.
import assert from 'node:assert/strict';
function sorted(v){if(Array.isArray(v))return v.map(sorted);if(v&&typeof v==='object')return Object.fromEntries(Object.keys(v).sort().map(k=>[k,sorted(v[k])]));return v;}
export const canonical=v=>JSON.stringify(sorted(v));
export function near(a,b,t=1e-7,label='measurement'){assert(Number.isFinite(a)&&Number.isFinite(b));assert(Math.abs(a-b)<=t,`${label}: ${a} vs ${b}, tolerance ${t}`);}
export function polygonArea(points){return Math.abs(points.reduce((sum,p,i)=>{const q=points[(i+1)%points.length];return sum+p[0]*q[1]-p[1]*q[0]},0))/2;}
export const revision='sha256:5414a24c96eff09b77f7d3fe758287c9696e63127c91e73011f6f2939de2a8eb:534ffdd2d88632a7878d654742f2df72c16691f3c814085e4f525efc74961e19';
export function nativeBody(body,volume,min,max,count=1){assert(body);const m=body.metrics;near(m.nativeVolume,volume,Math.max(1e-6,Math.abs(volume)*1e-9),'native mm³');for(const k of ['min','max'])for(let i=0;i<3;i++)near(m.nativeBounds[k][i],(k==='min'?min:max)[i],Math.max(1e-7,Math.abs((k==='min'?min:max)[i])*1e-12),'native mm bound');assert.equal(m.nativeValidity.valid,true);assert.equal(m.solidCount,count);assert.equal(m.runtime.jsSha256,revision.split(':')[1]);assert.equal(m.runtime.wasmSha256,revision.split(':')[2]);assert.equal(m.runtime.mountEngine,'occ-polygon-profile-v3-component');return m;}
