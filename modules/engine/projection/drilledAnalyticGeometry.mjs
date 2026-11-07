// Bounded analytic building blocks for the proposed drilled-solid projection.
// These are not a topology reader or a source/ancestry verifier.
const fail=()=>{throw new Error('Invalid drilled analytic geometry');};
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const finite=n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=2e7;
function array(v,n){if(!Array.isArray(v)||v.length!==n||Reflect.ownKeys(v).length!==n+1)fail();return Array.from({length:n},(_,i)=>{const d=Object.getOwnPropertyDescriptor(v,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value')||!finite(d.value))fail();return d.value;});}
function frame(value,keys){
 if(!value||typeof value!=='object'||Array.isArray(value))fail();const own=Reflect.ownKeys(value);if(own.length!==keys.length||own.some(k=>typeof k!=='string'||!keys.includes(k)))fail();const v=Object.create(null);for(const k of keys){const d=Object.getOwnPropertyDescriptor(value,k);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail();v[k]=d.value;}
 const origin=array(v.origin,3),x=array(v.x,3),y=array(v.y,3),axis=array(v.axis,3),radius=v.radius,tol=1e-8;
 if(!finite(radius)||radius<=0||[x,y,axis].some(a=>Math.abs(dot(a,a)-1)>tol)||Math.abs(dot(x,y))>tol||Math.abs(dot(x,axis))>tol||Math.abs(dot(y,axis))>tol||dot(cross(x,y),axis)<1-tol)fail();
 return {v,origin,x,y,axis,radius};
}
function range(a){const r=array(a,2);if(r[1]<=r[0])fail();return r;}
function angle(p,o,x,y,start){const d=p.map((v,i)=>v-o[i]);let u=Math.atan2(dot(d,y),dot(d,x));u+=Math.ceil((start-u)/(2*Math.PI))*2*Math.PI;return u;}
const unsupported=()=>{throw new Error('Research analytic geometry operation unsupported');};
export function analyticCircle(value){
 const f=frame(value,['origin','x','y','axis','radius','domain']),domain=range(f.v.domain);if(Math.abs(domain[1]-domain[0]-2*Math.PI)>1e-8)fail();
 const point=u=>{if(!finite(u))fail();return f.origin.map((p,i)=>p+f.radius*(Math.cos(u)*f.x[i]+Math.sin(u)*f.y[i]));};
 return {domain:()=>[...domain],degree:unsupported,knots:unsupported,point,param:p=>angle(array(p,3),f.origin,f.x,f.y,domain[0]),eval:u=>[point(u),f.x.map((_,i)=>f.radius*(-Math.sin(u)*f.x[i]+Math.cos(u)*f.y[i]))],transform:unsupported,invert:unsupported,split:unsupported};
}
export function analyticCylinder(value){
 const f=frame(value,['origin','x','y','axis','radius','domainU','domainV']),domainU=range(f.v.domainU),domainV=range(f.v.domainV);if(Math.abs(domainU[1]-domainU[0]-2*Math.PI)>1e-8)fail();
 const normal=u=>{if(!finite(u))fail();return f.x.map((v,i)=>Math.cos(u)*v+Math.sin(u)*f.y[i]);};
 const point=(u,v)=>{if(!finite(v))fail();const n=normal(u);return f.origin.map((p,i)=>p+f.radius*n[i]+v*f.axis[i]);};
 return {analyticKind:'cylinder',domainU:[...domainU],domainV:[...domainV],knotsU:[...domainU],knotsV:[...domainV],uMin:domainU[0],uMax:domainU[1],vMin:domainV[0],vMax:domainV[1],isMirrored:false,degreeU:unsupported,degreeV:unsupported,point,normal,param:p=>{p=array(p,3);return [angle(p,f.origin,f.x,f.y,domainU[0]),dot(p.map((v,i)=>v-f.origin[i]),f.axis)];},eval:(u,v)=>[point(u,v),f.x.map((_,i)=>f.radius*(-Math.sin(u)*f.x[i]+Math.cos(u)*f.y[i])),[...f.axis]],transform:unsupported};
}
