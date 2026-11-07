// Data-only analytic circle/arc boundary checks; NURBS remain unsupported.
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const record=(x,keys)=>{if(!x||typeof x!=='object'||Array.isArray(x))return false;const own=Reflect.ownKeys(x);return own.every(k=>typeof k==='string'&&Object.getOwnPropertyDescriptor(x,k)?.enumerable&&'value' in Object.getOwnPropertyDescriptor(x,k))&&own.sort().join(',')===keys};
const point=p=>record(p,'x,y')&&finite(p.x)&&finite(p.y);
const fail=()=>{throw Error('Invalid analytic sketch boundary.')};
export function validateCurvedBoundary(boundary){
 if(!boundary||!['lines','arcs','circles','nurbses'].every(k=>Array.isArray(boundary[k])&&boundary[k].length<=10000)||boundary.nurbses.length)fail();
 const seen=new Set(),curves=new Map();for(const kind of ['lines','arcs','circles'])for(const edge of boundary[kind]){if(!edge||typeof edge.id!=='string'||!edge.id||edge.id.length>1024||seen.has(edge.id))fail();seen.add(edge.id);if(kind==='lines')continue;
  if(kind==='circles'){if(!record(edge,'c,id,r')||!point(edge.c)||!finite(edge.r)||edge.r<=1e-9)fail()}
  else {if(!record(edge,'a,b,c,id')||!point(edge.a)||!point(edge.b)||!point(edge.c))fail();const ra=Math.hypot(edge.a.x-edge.c.x,edge.a.y-edge.c.y),rb=Math.hypot(edge.b.x-edge.c.x,edge.b.y-edge.c.y);if(ra<=1e-9||rb<=1e-9||Math.abs(ra-rb)>1e-6||Math.hypot(edge.a.x-edge.b.x,edge.a.y-edge.b.y)<=1e-9)fail()}
  curves.set(edge.id,{kind,edge});
 }
 return curves;
}
export function referencedCurvedBoundaries(sketch,boundary){
 const aliases=new Map();for(const [id,{kind}] of validateCurvedBoundary(boundary)){for(const suffix of kind==='arcs'?['',':A',':B',':C']:['',':C']){const key='boundary/'+id+suffix;if(aliases.has(key))throw Error('Ambiguous curved boundary reference.');aliases.set(key,id)}}
 const refs=new Set(),todo=[sketch.stages,sketch.dimensions,sketch.labels];let count=0;while(todo.length){const value=todo.pop();if(++count>100000)throw Error('Boundary references exceed limits.');if(typeof value==='string'){const id=aliases.get(value);if(id!==undefined)refs.add(id)}else if(value&&typeof value==='object')for(const child of Object.values(value))todo.push(child)}return refs;
}
export function assertUnchangedCurvedBoundaries(before,after,referenced){const a=validateCurvedBoundary(before),b=validateCurvedBoundary(after),same=(p,q)=>p.x===q.x&&p.y===q.y;for(const [id,x] of a){if(!referenced.has(id))continue;const y=b.get(id),u=x.edge,v=y?.edge;if(!y||x.kind!==y.kind||!same(u.c,v.c)||(x.kind==='circles'?u.r!==v.r:!same(u.a,v.a)||!same(u.b,v.b)))throw Error('Referenced curved boundary changed; remapping is unsupported.')};}
export function assertFixedCurvedBoundary(index,boundary){
 validateCurvedBoundary(boundary);for(const e of boundary.circles){const c=index['boundary/'+e.id];if(!c||c.TYPE!=='Circle'||!c.c||c.c.x!==e.c.x||c.c.y!==e.c.y||!c.r||c.r.get()!==e.r)throw Error('A fixed circular boundary changed.');}
 const nearAngle=(x,y)=>Number.isFinite(x)&&Math.abs(Math.atan2(Math.sin(x-y),Math.cos(x-y)))<=1e-12;
 for(const e of boundary.arcs){const a=index['boundary/'+e.id],r=Math.hypot(e.a.x-e.c.x,e.a.y-e.c.y),ang1=Math.atan2(e.a.y-e.c.y,e.a.x-e.c.x),ang2=Math.atan2(e.b.y-e.c.y,e.b.x-e.c.x);if(!a||a.TYPE!=='Arc'||!a.a||!a.b||!a.c||a.a.x!==e.a.x||a.a.y!==e.a.y||a.b.x!==e.b.x||a.b.y!==e.b.y||a.c.x!==e.c.x||a.c.y!==e.c.y||!a.r||!a.ang1||!a.ang2||!finite(a.r.get())||Math.abs(a.r.get()-r)>1e-9||!nearAngle(a.ang1.get(),ang1)||!nearAngle(a.ang2.get(),ang2))throw Error('A fixed arc boundary changed.');}
}
