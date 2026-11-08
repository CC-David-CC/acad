import {inspectCarriedCurve} from './carriedCurvePolicy.mjs';
import {inspectBoundedSpline} from './splinePolicy.mjs';
// Bounded preflight for the editor's serialized stage/Mirror graph.
export function inspectStageGenerators(sketch){
 const fail=()=>{throw Error('Unsupported or inconsistent stage/generator graph.')};
 if(!Array.isArray(sketch.stages)||!sketch.stages.length||sketch.stages.length>32||!Array.isArray(sketch.objects))fail();
 const objects=new Map(), aliases=new Map();
 const add=(id,owner)=>{if(typeof id!=='string'||!id||aliases.has(id))fail();aliases.set(id,owner)};
 add('ground/ORIGIN',null);
 const boundary=sketch.boundary;if(!boundary||!['lines','arcs','circles'].every(k=>Array.isArray(boundary[k])))fail();
 for(const [kind,suffixes] of [['lines',['',':A',':B']],['arcs',['',':A',':B',':C']],['circles',['',':C']]])for(const edge of boundary[kind])for(const suffix of suffixes)add('boundary/'+edge.id+suffix,null);
 for(const o of sketch.objects){if(!o||typeof o.id!=='string'||!o.id||objects.has(o.id)||!Number.isInteger(o.stage)||o.stage<0||o.stage>=sketch.stages.length)fail();objects.set(o.id,o);add(o.id,o);let suffixes=[];switch(o.type){case 'Segment':suffixes=[':A',':B'];break;case 'Circle':suffixes=[':C'];break;case 'Arc':suffixes=[':A',':B',':C'];break;case 'Ellipse':case 'EllipticalArc':case 'BezierCurve':suffixes=inspectCarriedCurve(o.type,o.data).map(([suffix])=>suffix);break;case 'BSpline':for(const child of inspectBoundedSpline(o.id,o.data).childRefs)add(child.id,o);break;case 'Point':case 'RigidGroup':break;default:fail()}for(const suffix of suffixes)add(o.id+suffix,o)}
 const generated=new Map();let total=0;
 for(let i=0;i<sketch.stages.length;i++){const s=sketch.stages[i];if(!s||!Array.isArray(s.generators)||!Array.isArray(s.constraints))fail();for(const [order,g] of s.generators.entries()){if(++total>256||!g||g.typeId!=='Mirror'||g.stage!==i||!g.params||Object.keys(g).sort().join(',')!=='generatedObjects,params,stage,typeId'||Object.keys(g.params).sort().join(',')!=='objects,reflectionLine')fail();const {objects:src,reflectionLine:axis}=g.params,out=g.generatedObjects;if(!Array.isArray(axis)||axis.length!==1||!Array.isArray(src)||!src.length||src.length>256||new Set(src).size!==src.length||!Array.isArray(out)||out.length!==src.length||new Set(out).size!==out.length||src.includes(axis[0]))fail();const line=objects.get(axis[0]);if(!line||line.type!=='Segment'||line.stage>i)fail();const {a,b}=line.data,dx=b.x-a.x,dy=b.y-a.y,den=dx*dx+dy*dy;if(!Number.isFinite(den)||den<=1e-18)fail();for(let j=0;j<src.length;j++){const x=objects.get(src[j]),y=objects.get(out[j]);if(!x||!y||!['Point','Segment','Circle','Arc'].includes(x.type)||y.type!==x.type||x.stage>i||y.stage!==i||x===y||y===line||generated.has(y.id)||src.includes(y.id))fail();generated.set(y.id,{stage:i,source:x.id,order});const reflect=p=>{const t=((p.x-a.x)*dx+(p.y-a.y)*dy)/den;return {x:2*(a.x+t*dx)-p.x,y:2*(a.y+t*dy)-p.y}};if(x.type==='Circle'&&(!Number.isFinite(x.data.r)||x.data.r<=1e-9||!Number.isFinite(y.data.r)||y.data.r<=1e-9||Math.abs(x.data.r-y.data.r)>1e-6))fail();if(x.type==='Arc'){
 const radius=(d,k)=>Math.hypot(d[k].x-d.c.x,d[k].y-d.c.y);
 for(const d of [x.data,y.data]){
  if(!d||!['a','b','c'].every(k=>d[k]&&Number.isFinite(d[k].x)&&Number.isFinite(d[k].y)))fail();
  const ra=radius(d,'a'),rb=radius(d,'b');
  // Coincident endpoints encode a full turn ambiguously; do not admit it here.
  if(!Number.isFinite(ra)||!Number.isFinite(rb)||ra<=1e-9||Math.abs(ra-rb)>1e-6||Math.hypot(d.a.x-d.b.x,d.a.y-d.b.y)<=1e-9)fail();
 }
 }
 if(x.type==='Point'){const p=reflect(x.data),q=y.data;if(!q||!Number.isFinite(p.x)||!Number.isFinite(p.y)||Math.hypot(p.x-q.x,p.y-q.y)>1e-6)fail();}
 for(const [from,to] of x.type==='Point'?[]:x.type==='Arc'?[['a','b'],['b','a'],['c','c']]:x.type==='Circle'?[['c','c']]:[['a','a'],['b','b']]){const p=reflect(x.data[from]),q=y.data[to];if(!q||!Number.isFinite(p.x)||!Number.isFinite(p.y)||Math.hypot(p.x-q.x,p.y-q.y)>1e-6)fail()}}}}
 for(let i=0;i<sketch.stages.length;i++){const s=sketch.stages[i];for(const c of s.constraints){if(c.stage!==i||!Array.isArray(c.objects))fail();for(const id of c.objects){if(!aliases.has(id))fail();const o=aliases.get(id);if(!o)continue;if(o.stage>i||generated.has(o.id)&&o.stage>=i)fail()}}for(const [order,g] of s.generators.entries()){for(const id of [...g.params.reflectionLine,...g.params.objects]){const owner=generated.get(id);if(owner&&(owner.stage>i||owner.stage===i&&owner.order>=order))fail()}}}
 return {stageCount:sketch.stages.length,generatorCount:total};
}
