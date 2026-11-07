// Orientation of one analytically described, closed circular coedge relative
// to an oriented plane. It is not a general-purpose loop or topology checker.
export function closedCircleOrientation(input) {
 const fail=()=>{throw new Error('Invalid analytic closed-circle orientation');};
 const names=['axis','x','y','planeNormal','start','end','reversed'];
 if(!input||typeof input!=='object'||Array.isArray(input))fail();
 const keys=Reflect.ownKeys(input);if(keys.length!==names.length||keys.some(k=>typeof k!=='string'||!names.includes(k)))fail();
 const values=Object.create(null);for(const name of names){const d=Object.getOwnPropertyDescriptor(input,name);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail();values[name]=d.value;}
 const vec=v=>{if(!Array.isArray(v)||v.length!==3||Reflect.ownKeys(v).length!==4)fail();return [0,1,2].map(i=>{const d=Object.getOwnPropertyDescriptor(v,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value')||typeof d.value!=='number'||!Number.isFinite(d.value))fail();return d.value;});};
 const a=vec(values.axis),x=vec(values.x),y=vec(values.y),n=vec(values.planeNormal),dot=(u,v)=>u.reduce((s,t,i)=>s+t*v[i],0),cross=(u,v)=>[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],tol=1e-8;
 if([a,x,y,n].some(v=>Math.abs(dot(v,v)-1)>tol)||Math.abs(dot(a,x))>tol||Math.abs(dot(a,y))>tol||Math.abs(dot(x,y))>tol||dot(cross(x,y),a)<1-tol||Math.abs(Math.abs(dot(a,n))-1)>tol)fail();
 if(typeof values.start!=='number'||typeof values.end!=='number'||!Number.isFinite(values.start)||!Number.isFinite(values.end)||typeof values.reversed!=='boolean')fail();
 const sweep=values.end-values.start;if(!Number.isFinite(sweep)||Math.abs(Math.abs(sweep)-2*Math.PI)>tol)fail();
 return Math.sign(sweep)*Math.sign(dot(a,n))*(values.reversed?-1:1);
}
