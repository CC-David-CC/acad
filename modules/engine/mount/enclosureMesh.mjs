// Bounded triangle soup; these coordinates are display/preview quality only.
export const ENCLOSURE_MESH_TRIANGLES_MAX=512;
export function validateEnclosureMesh(buffer,count,expected) {
  if(!(buffer instanceof ArrayBuffer)||!Number.isSafeInteger(count)||count<1||count>ENCLOSURE_MESH_TRIANGLES_MAX||buffer.byteLength!==count*9*8||!expected||!Number.isFinite(expected.nativeVolume)||expected.nativeVolume<=0||!expected.mesh?.bounds||expected.mesh.triangles!==count)throw Error('INVALID_ENCLOSURE_MESH');
  const v=new Float64Array(buffer), min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity],origin=expected.mesh.bounds.min;let volume=0;
  for(let j=0;j<v.length;j+=9){const tri=[];for(let k=0;k<3;k++){const p=[];for(let i=0;i<3;i++){const x=v[j+k*3+i];if(!Number.isFinite(x))throw Error('INVALID_ENCLOSURE_MESH');min[i]=Math.min(min[i],x);max[i]=Math.max(max[i],x);p.push(x-origin[i]);}tri.push(p);}const [a,b,c]=tri,ab=b.map((x,i)=>x-a[i]),ac=c.map((x,i)=>x-a[i]),cross=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]];if(!Number.isFinite(Math.hypot(...cross))||Math.hypot(...cross)<=1e-14)throw Error('INVALID_ENCLOSURE_MESH');volume+=(a[0]*(b[1]*c[2]-b[2]*c[1])+a[1]*(b[2]*c[0]-b[0]*c[2])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6;}
  const isFloat32=expected.precision==='float32',coordTol=isFloat32?Math.max(1e-6,Math.max(...expected.mesh.bounds.max.map(Math.abs))*2**-21):1e-6,volumeTol=Math.max(1e-6,expected.nativeVolume*(isFloat32?1e-6:1e-9));
  if(!Number.isFinite(volume)||Math.abs(volume-expected.nativeVolume)>volumeTol||min.some((x,i)=>Math.abs(x-expected.mesh.bounds.min[i])>coordTol)||max.some((x,i)=>Math.abs(x-expected.mesh.bounds.max[i])>coordTol))throw Error('INVALID_ENCLOSURE_MESH');return true;
}
