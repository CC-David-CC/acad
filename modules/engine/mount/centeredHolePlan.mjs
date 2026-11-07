// Bounded research contract. The parent profile is worker-owned, never caller-supplied.
const fail=(code,message)=>{const e=Error(message);e.code=code;throw e};
const dense=(a,n)=>Array.isArray(a)&&a.length===n&&Array.from({length:n},(_,i)=>Object.hasOwn(a,i)&&Number.isFinite(a[i])).every(Boolean);
function capture(o,keys){
 if(!o||typeof o!=='object'||Array.isArray(o))fail('INVALID_REQUEST','Expected request data');
 const own=Reflect.ownKeys(o);if(own.length!==keys.length||own.some(k=>typeof k!=='string'||!keys.includes(k)))fail('INVALID_REQUEST','Unexpected request fields');
 const out=Object.create(null);for(const k of keys){const d=Object.getOwnPropertyDescriptor(o,k);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('INVALID_REQUEST','Request fields must be data');out[k]=d.value;}return out;
}
export function planCenteredHole(profile,request){
 request=capture(request,['version','unit','revision','sketchDigest','faceId','regionId','diameter']);
 if(request.version!==1||request.unit!=='millimeter'||typeof request.diameter!=='number'||!Number.isFinite(request.diameter)||request.diameter<=0||request.diameter>1e6)fail('INVALID_REQUEST','Invalid centered hole request');
 if(!profile||['revision','sketchDigest','faceId','regionId'].some(k=>typeof request[k]!=='string'||request[k]!==profile[k]))fail('STALE_SOURCE','The parent source binding changed');
 const p=profile.worldVertices,d=profile.direction,depth=profile.depth;if(!dense(d,3)||Math.abs(d[0])>1e-10||Math.abs(d[1])>1e-10||Math.abs(d[2]-1)>1e-10||!Number.isFinite(depth)||depth<=1e-5||depth>1e6||!Array.isArray(p)||p.length!==4||p.some(v=>!dense(v,3)||v.some(n=>Math.abs(n)>1e6)))fail('UNSUPPORTED_PROFILE','Only bounded positive principal-XY prisms are supported');
 if(p.some(v=>Math.abs(v[2]-p[0][2])>1e-8))fail('UNSUPPORTED_PROFILE','The source plane is not XY');
 const edge=p.map((a,i)=>p[(i+1)%4].map((x,j)=>x-a[j])),length=edge.map(e=>Math.hypot(e[0],e[1]));if(length.some(n=>n<=1e-5))fail('UNSUPPORTED_PROFILE','Degenerate rectangle');
 const cross=(a,b)=>a[0]*b[1]-a[1]*b[0],dot=(a,b)=>a[0]*b[0]+a[1]*b[1];
 for(let i=0;i<4;i++){if(Math.abs(dot(edge[i],edge[(i+1)%4]))>length[i]*length[(i+1)%4]*1e-8||cross(edge[i],edge[(i+1)%4])<=0)fail('UNSUPPORTED_PROFILE','Source must be a strictly oriented rectangle');if(Math.min(Math.abs(edge[i][0]),Math.abs(edge[i][1]))>length[i]*1e-8)fail('UNSUPPORTED_PROFILE','Rotated rectangle unsupported');}
 const mid=(a,b)=>a.map((v,i)=>(v+b[i])/2),c=mid(p[0],p[2]),other=mid(p[1],p[3]);if(c.some((x,i)=>Math.abs(x-other[i])>1e-6))fail('UNSUPPORTED_PROFILE','Opposite corners do not share a center');
 const distances=edge.map((e,i)=>cross(e,[c[0]-p[i][0],c[1]-p[i][1]])/length[i]),radius=request.diameter/2;if(radius<=1e-5)fail('UNSUPPORTED_PROFILE','Hole radius is below the supported precision');if(distances.some(v=>!Number.isFinite(v)||v<=radius+1e-5))fail('HOLE_OUTSIDE_PROFILE','Hole must clear every finite side');
 // Translate before the area sum to avoid cancellation at large world origins.
 // Classification tolerance never authorizes snapping the actual boundary.
 const local=p.map(v=>[v[0]-p[0][0],v[1]-p[0][1]]);
 const area=local.reduce((sum,v,i)=>sum+cross(v,local[(i+1)%4]),0)/2;
 const margin=Math.max(.001,Math.min(1,depth*.01)),expectedVolume=(area-Math.PI*radius*radius)*depth;if(!Number.isFinite(expectedVolume)||expectedVolume<=0||Math.abs(c[2]-margin)>1e6||Math.abs(c[2]+depth+margin)>1e6)fail('UNSUPPORTED_PROFILE','Through-cut exceeds numerical limits');
 return Object.freeze({center:Object.freeze(c),radius,depth,margin,expectedVolume,revision:request.revision,sketchDigest:request.sketchDigest,faceId:request.faceId,regionId:request.regionId});
}
