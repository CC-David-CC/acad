// Pure source-method controls, not browser/model/Worker qualification.
import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import {sameRestoredSketch as current} from '../../web/app/sketcher/historyEquivalence.mjs';
import {previousSameRestoredSketch as previous} from './previous.mjs';
const rows=[],run=(id,a,b,want)=>{const old=previous(a,b),now=current(a,b);assert.equal(old,want,id+' previous');assert.equal(now,want,id+' current');rows.push({id,previous:old,current:now,expected:want});};
const text=JSON.stringify,clone=x=>JSON.parse(text(x)),base=()=>({version:3,objects:[{id:'s',type:'Segment',data:{a:{x:0,y:0},b:{x:10,y:0}}}],metadata:{boundaryFrame:{origin:[0,0,0],x:[1,0,0],y:[0,1,0],z:[0,0,1]}},labels:[],stages:[{constraints:[{typeId:'Horizontal',objects:['s']},{typeId:'SignedDistanceY',objects:['s:A','s:B'],admission:{version:1,state:'redundant'}}]},{constraints:[{typeId:'LockPoint',objects:['s:A'],admission:null}]}]});
const initial=base(),replayed=clone(initial);replayed.stages[0].constraints[0].admission={version:1,state:'accepted'};
run('mixed-stages-only-absent-hint-added',text(initial),text(replayed),true);
for(const [id,mutate]of [
 ['saved-hint-changed',s=>s.stages[0].constraints[1].admission.state='accepted'],
 ['saved-hint-removed',s=>delete s.stages[0].constraints[1].admission],
 ['explicit-null-hint-is-owned',s=>s.stages[1].constraints[0].admission={version:1,state:'accepted'}],
 ['constraint-order-retained',s=>s.stages[0].constraints.reverse()],
 ['stage-order-retained',s=>s.stages.reverse()],
 ['geometry-retained',s=>s.objects[0].data.b.x=11],
 ['metadata-retained',s=>s.metadata.boundaryFrame.origin[2]=1],
 ['extra-constraint-field-retained',s=>s.stages[0].constraints[0].authored='different'],
 ['array-vs-object-not-equivalent',s=>s.objects={'0':s.objects[0]}]
]){const actual=clone(replayed);mutate(actual);run(id,text(initial),text(actual),false);}
const keys=JSON.parse('{"__proto__":{"x":1},"constructor":{"prototype":{"y":2}},"toJSON":"authored","01":3,"1":4,"a.b":5}');
const reorder=v=>Array.isArray(v)?v.map(reorder):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).reverse().map(k=>[k,reorder(v[k])])):v;
run('prototype-names-are-own-json-data',text(keys),text(reorder(keys)),true);
for(const key of ['__proto__','constructor','toJSON','01','1','a.b']){const changed=clone(keys);changed[key]=null;run('key-value-'+key,text(keys),text(changed),false);}
let seed=0x07119e2d;const random=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return seed>>>0;};
const value=depth=>{const choice=random()%(depth?7:4);if(choice===0)return null;if(choice===1)return !!(random()%2);if(choice===2)return (random()%2001)-1000;if(choice===3)return ['a\u0000b','😀','e\u0301','é','\\"','\ud800'][random()%6];if(choice===4)return Array.from({length:random()%4},()=>value(depth-1));return Object.fromEntries(Array.from({length:random()%4},(_,i)=>[['__proto__','constructor','10','02','field'][random()%5]+i,value(depth-1)]));};
for(let i=0;i<128;i++){const s=base();s.metadata.extra=value(4);run('fixed-seed-key-permutation-'+i,text(s),text(reorder(s)),true);const changed=clone(s);changed.metadata.meaningfulAdditionalField=i;run('fixed-seed-added-key-'+i,text(s),text(changed),false);}
const large=base();large.labels=[{id:'label',text:'x'.repeat(1040000)+'complete-ending😀'}];const a=text(large),b=text(reorder(large)),changed=clone(large);changed.labels[0].text=changed.labels[0].text.slice(0,-2)+'X';
run('large-full-string-key-permutation',a,b,true);run('large-late-character-difference',a,text(changed),false);
function calls(fn){const parse=JSON.parse,stringify=JSON.stringify;let parses=0,stringifies=0,generatedCodeUnits=0;try{JSON.parse=(...args)=>{parses++;return parse(...args);};JSON.stringify=(...args)=>{stringifies++;const value=stringify(...args);generatedCodeUnits+=value?.length||0;return value;};assert.equal(fn(a,b),true);}finally{JSON.parse=parse;JSON.stringify=stringify;}return {parses,stringifies,generatedCodeUnits};}
const allocations={previous:calls(previous),current:calls(current),scope:'Comparator JSON call instrumentation only; not peak/RSS or all history allocations'};
assert.equal(allocations.previous.parses,4);assert.equal(allocations.previous.stringifies,4);assert.equal(allocations.current.parses,2);assert.equal(allocations.current.stringifies,0);
const invalidOutsideNative={overflowVsNull:{previous:previous('{"x":1e999}','{"x":null}'),current:current('{"x":1e999}','{"x":null}')},scope:'Syntactically valid JSON numeric overflow; strict native IO rejects nonfinite geometry. New comparison refuses the old stringify-to-null collision.'};assert.equal(invalidOutsideNative.overflowVsNull.previous,true);assert.equal(invalidOutsideNative.overflowVsNull.current,false);
assert.throws(()=>current('{bad','{}'));
const report={version:1,source:'2ad57a006df613c4ce0cbdfb1743742bfb26a763',base:'3bd196f31',scope:'Pure comparison-method differential controls; no fake viewer, browser or new native history runtime claim',seed:0x07119e2d,node:process.version,rows,allocations,largeInputCodeUnits:a.length,invalidOutsideNative,testSources:Object.fromEntries(['review.mjs','previous.mjs','../../web/app/sketcher/historyEquivalence.mjs'].map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(new URL(p,import.meta.url))).digest('hex')]))};
fs.writeFileSync(process.env.CODI_HISTORY_REVIEW_RECEIPT||new URL('./receipt.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({pass:true,differentialChecks:rows.length,allocations,invalidOutsideNative}));
