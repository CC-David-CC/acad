// Bounded data-only response envelope checks. Full solid geometry belongs in
// the separate reader Worker, never in this main-thread mount adapter.
const fail=()=>{throw Error('Invalid portable topology envelope')};
function copy(v,depth=0,budget={nodes:0,chars:0}){
 if(++budget.nodes>16384||depth>16)fail();if(v===null||typeof v==='boolean')return v;
 if(typeof v==='string'){budget.chars+=v.length;if(budget.chars>16384)fail();return v;}
 if(typeof v==='number'){if(!Number.isFinite(v))fail();return v;}if(!v||typeof v!=='object')fail();
 const keys=Reflect.ownKeys(v);if(keys.some(k=>typeof k!=='string'))fail();
 if(Array.isArray(v)){if(v.length>192||keys.length!==v.length+1)fail();return Array.from({length:v.length},(_,i)=>{const d=Object.getOwnPropertyDescriptor(v,String(i));if(!d?.enumerable||!('value'in d))fail();return copy(d.value,depth+1,budget)});}
 if(keys.length>32)fail();const out={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(v,key);if(!d?.enumerable||!('value'in d)||key==='__proto__')fail();budget.chars+=key.length;if(budget.chars>16384)fail();out[key]=copy(d.value,depth+1,budget);}return out;
}
const exact=(o,k)=>{if(!o||typeof o!=='object'||Array.isArray(o)||Object.keys(o).sort().join(',')!==k.slice().sort().join(','))fail();};
const size=(a,n)=>{if(!Array.isArray(a)||a.length!==n)fail();};
const vec=a=>{size(a,3);if(a.some(n=>typeof n!=='number'||!Number.isFinite(n)))fail();};
export function validatePortableEnvelope(value,provenance,evidence){
 const d=copy(value);if(new TextEncoder().encode(JSON.stringify(d)).byteLength>16384)fail();
 exact(d,['version','unit','idScope','toleranceMm','vertices','edges','faces','sourceEdges']);if(d.version!==1||d.unit!=='millimeter'||d.idScope!=='response-local'||d.toleranceMm!==1e-6)fail();
 size(d.vertices,8);size(d.edges,12);size(d.faces,6);size(d.sourceEdges,4);
 d.vertices.forEach((v,i)=>{exact(v,['id','point']);if(v.id!=='vertex:'+i)fail();vec(v.point)});
 d.edges.forEach((e,i)=>{exact(e,['id','curve','a','b','uses']);if(e.id!=='edge:'+i||!/^vertex:[0-7]$/.test(e.a)||!/^vertex:[0-7]$/.test(e.b)||e.a===e.b)fail();exact(e.curve,['type','tessellation']);if(e.curve.type!=='line-segment'||!Array.isArray(e.curve.tessellation)||e.curve.tessellation.length<2||e.curve.tessellation.length>64)fail();e.curve.tessellation.forEach(vec);size(e.uses,2);e.uses.forEach(u=>{exact(u,['face','reversed']);if(!/^face:[0-5]$/.test(u.face)||typeof u.reversed!=='boolean')fail();});});
 let count=0;d.faces.forEach((f,i)=>{exact(f,['id','plane','inverted','loop','triangles']);if(f.id!=='face:'+i||typeof f.inverted!=='boolean')fail();exact(f.plane,['origin','normal','direct']);vec(f.plane.origin);vec(f.plane.normal);if(typeof f.plane.direct!=='boolean')fail();size(f.loop,4);f.loop.forEach(u=>{exact(u,['edge','reversed']);if(!/^edge:(?:[0-9]|1[01])$/.test(u.edge)||typeof u.reversed!=='boolean')fail();});if(!Array.isArray(f.triangles)||f.triangles.length<1||f.triangles.length>32)fail();for(const t of f.triangles){size(t,3);t.forEach(vec);count++;}});if(count>192||count!==evidence.triangles)fail();
 const seen=new Set(),base=new Set();for(const x of d.sourceEdges){exact(x,['sourceEdgeId','baseEdge','sweptFace','sourceReversed']);if(typeof x.sourceEdgeId!=='string'||!x.sourceEdgeId||!/^edge:(?:[0-9]|1[01])$/.test(x.baseEdge)||!/^face:[0-5]$/.test(x.sweptFace)||typeof x.sourceReversed!=='boolean'||seen.has(x.sourceEdgeId)||base.has(x.baseEdge))fail();const match=provenance.edgeFaces.find(e=>e.sourceEdgeId===x.sourceEdgeId);if(!match||x.sweptFace!=='face:'+match.faceOrdinal||x.sourceReversed!==match.sourceReversed)fail();seen.add(x.sourceEdgeId);base.add(x.baseEdge);}
 const min=[0,1,2].map(i=>Math.min(...d.vertices.map(v=>v.point[i]))),max=[0,1,2].map(i=>Math.max(...d.vertices.map(v=>v.point[i])));if(min.some((n,i)=>Math.abs(n-evidence.bounds.min[i])>1e-6)||max.some((n,i)=>Math.abs(n-evidence.bounds.max[i])>1e-6))fail();
 return d;
}
