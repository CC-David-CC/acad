// Exact integer-cell oracle for interiors of bounded axis-aligned boxes.
// Six-neighbor components describe positive-volume face-connected interiors.
export function leaves(expr,out=new Map()){
 if(expr.op==='box'){
  if(typeof expr.id!=='string'||!Array.isArray(expr.origin)||!Array.isArray(expr.dimensions)||expr.origin.length!==3||expr.dimensions.length!==3||!expr.origin.every(x=>Number.isSafeInteger(x)&&Math.abs(x)<=1000)||!expr.dimensions.every(x=>Number.isSafeInteger(x)&&x>0&&x<=1000))throw Error('Invalid bounded integer box');
  const old=out.get(expr.id);if(old&&JSON.stringify(old)!==JSON.stringify(expr))throw Error('Box identity changed');out.set(expr.id,expr);
 }else{if(!['union','common','subtract'].includes(expr.op))throw Error('Unknown Boolean');leaves(expr.a,out);leaves(expr.b,out);}return out;
}
export function truth(expr,p){
 if(expr.op==='box')return p.every((x,i)=>x>=expr.origin[i]&&x<=expr.origin[i]+expr.dimensions[i]);
 const a=truth(expr.a,p),b=truth(expr.b,p);return expr.op==='union'?a||b:expr.op==='common'?a&&b:a&&!b;
}
export function cellOracle(expr){
 const boxes=[...leaves(expr).values()];if(boxes.length>6)throw Error('Oracle leaf budget');
 const planes=[0,1,2].map(axis=>{const p=[...new Set(boxes.flatMap(b=>[b.origin[axis],b.origin[axis]+b.dimensions[axis]]))].sort((a,b)=>a-b);return [p[0]-1,...p,p.at(-1)+1];});
 const dims=planes.map(p=>p.length-1),count=dims.reduce((a,b)=>a*b,1);if(count>4096)throw Error('Oracle cell budget');
 const index=(x,y,z)=>(x*dims[1]+y)*dims[2]+z,occupied=new Uint8Array(count);let volume=0;
 for(let x=0;x<dims[0];x++)for(let y=0;y<dims[1];y++)for(let z=0;z<dims[2];z++){
  const v=[x,y,z],p=v.map((n,i)=>(planes[i][n]+planes[i][n+1])/2),inside=truth(expr,p);occupied[index(x,y,z)]=inside?1:0;
  if(inside){volume+=v.reduce((n,k,i)=>n*(planes[i][k+1]-planes[i][k]),1);if(!Number.isSafeInteger(volume))throw Error('Oracle exact-volume budget');}
 }
 const seen=new Uint8Array(count);let materialRegions=0,voidRegions=0;
 for(let x=0;x<dims[0];x++)for(let y=0;y<dims[1];y++)for(let z=0;z<dims[2];z++){
  const start=index(x,y,z);if(seen[start])continue;const value=occupied[start],todo=[[x,y,z]];seen[start]=1;let exterior=false;
  while(todo.length){const q=todo.pop();if(q.some((n,i)=>n===0||n===dims[i]-1))exterior=true;
   for(let axis=0;axis<3;axis++)for(const d of [-1,1]){const r=q.slice();r[axis]+=d;if(r[axis]<0||r[axis]>=dims[axis])continue;const id=index(...r);if(!seen[id]&&occupied[id]===value){seen[id]=1;todo.push(r);}}
  }
  if(value)materialRegions++;else if(!exterior)voidRegions++;
 }
 // Midpoint cells do not decide purely lower-dimensional result topology.
 let boundaryOnlyNonempty=false;
 if(volume===0){const samples=planes.map(p=>p.flatMap((v,i)=>i<p.length-1?[v,(v+p[i+1])/2]:[v]));
  outer:for(const x of samples[0])for(const y of samples[1])for(const z of samples[2])if(truth(expr,[x,y,z])){boundaryOnlyNonempty=true;break outer;}
 }
 return {volume,materialRegions,voidRegions,cellCount:count,planes,boundaryOnlyNonempty,scope:boundaryOnlyNonempty?'boundary-only-result-not-qualified':'regularized-positive-volume-interior'};
}
