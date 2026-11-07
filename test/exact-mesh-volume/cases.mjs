import {readFileSync} from 'node:fs';
import {box,reverse} from '../local-mesh-volume/fixtures.mjs';
const triangle=(x,y,z)=>[x,0,0,0,y,0,0,0,z];
export function cases(){
 const native=JSON.parse(readFileSync(new URL('../local-mesh-volume/actual-native-mesh.json',import.meta.url)));
 const rows=native.rows.map(r=>({id:'recorded-native:'+r.id,scope:'replay of retained genuine native Float64 triangle coordinates',positions:r.positions,nativeVolume:r.evidence.nativeVolume}));
 const add=(id,p)=>rows.push({id,scope:'analytic or adversarial triangle arithmetic fixture only',positions:p});
 const tiny=box([1e6,1e6,1e6],[1e-6,2e-6,3e-6]),other=box([-1e6,-1e6,-1e6],[1e-6,2e-6,3e-6]);
 add('separated-tiny-shell-counterexample',[...tiny,...other]);add('separated-reversed',reverse([...tiny,...other]));
 add('cavity',[...box([1e6,1e6,1e6],[10,10,10]),...reverse(box([1e6+2,1e6+2,1e6+2],[6,6,6]))]);
 add('disconnected',[...box([-100,20,30],[2,3,4]),...box([100,-20,-30],[5,6,7])]);
 add('opposite-cancellation',[...tiny,...reverse(tiny)]);add('empty',[]);add('all-zero',Array(18).fill(0));
 add('degenerate',[1,1,1,2,2,2,3,3,3]);add('single-open-triangle',triangle(1,1,1));
 for(const [origin,size,label] of [[[0,0,0],[1,2,3],'ordinary'],[[1e6,-1e6,1e6],[.001,.002,.003],'translated'],[[0,0,0],[2**-300,2**-300,2**-300],'small'],[[0,0,0],[2**300,2**300,2**300],'large']]){const p=box(origin,size);add('box:'+label,p);add('box-reversed:'+label,reverse(p));}
 add('tie-normal-even',[...triangle(6,1,1),...triangle(6,1,2**-53)]);
 add('tie-normal-odd',[...triangle(6,1,1),...triangle(6,1,3*2**-53)]);
 add('tie-negative',reverse([...triangle(6,1,1),...triangle(6,1,3*2**-53)]));
 add('tie-subnormal-zero',triangle(3,1,Number.MIN_VALUE));
 add('subnormal-above-half',triangle(3+2**-50,1,Number.MIN_VALUE));
 add('subnormal-below-half',triangle(3-2**-50,1,Number.MIN_VALUE));
 add('tie-subnormal-odd',triangle(9,1,Number.MIN_VALUE));add('tie-subnormal-even',triangle(15,1,Number.MIN_VALUE));
 add('positive-underflow',triangle(Number.MIN_VALUE,Number.MIN_VALUE,Number.MIN_VALUE));
 add('negative-underflow',reverse(triangle(Number.MIN_VALUE,Number.MIN_VALUE,Number.MIN_VALUE)));
 add('max-finite',triangle(6,Number.MAX_VALUE,1));add('overflow',triangle(12,Number.MAX_VALUE,1));
 add('overflow-halfway',[...triangle(6,Number.MAX_VALUE,1),...triangle(6,2**970,1)]);
 add('below-overflow-halfway',[...triangle(6,Number.MAX_VALUE,1),...triangle(6,2**969,1)]);
 const huge=triangle(Number.MAX_VALUE,Number.MAX_VALUE,Number.MAX_VALUE);
 add('extreme-cancellation-to-one',[...huge,...reverse(huge),...triangle(6,1,1),...triangle(Number.MIN_VALUE,0,0)]);
 add('extreme-cancellation-to-minsub',[...huge,...reverse(huge),...triangle(6,1,Number.MIN_VALUE)]);
 // Deterministic binary64 arithmetic samples spanning normal/subnormal scales.
 let state=113;const next=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state;};
 for(let i=0;i<48;i++){const exp=[-1074,-1000,-500,-20,0,20,300,700,1000][next()%9],sign=()=>next()&1?-1:1,scale=2**exp;add('sample:'+i,Array.from({length:9},()=>sign()*scale*(1+(next()%16)/16)));}
 return rows;
}
