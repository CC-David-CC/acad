// Analytic oriented triangle fixtures, not native CAD observations.
export function box(origin,size){
 const [x,y,z]=origin,[dx,dy,dz]=size,p=[[x,y,z],[x+dx,y,z],[x+dx,y+dy,z],[x,y+dy,z],[x,y,z+dz],[x+dx,y,z+dz],[x+dx,y+dy,z+dz],[x,y+dy,z+dz]];
 return [[0,2,1],[0,3,2],[4,5,6],[4,6,7],[0,1,5],[0,5,4],[1,2,6],[1,6,5],[2,3,7],[2,7,6],[3,0,4],[3,4,7]].flatMap(indices=>indices.flatMap(i=>p[i]));
}
export function reverse(flat){const out=[];for(let i=0;i<flat.length;i+=9)out.push(...flat.slice(i,i+3),...flat.slice(i+6,i+9),...flat.slice(i+3,i+6));return out}
export function globalIntegral(flat){let volume=0;for(let i=0;i<flat.length;i+=9){const [ax,ay,az,bx,by,bz,cx,cy,cz]=flat.slice(i,i+9);volume+=(ax*(by*cz-bz*cy)+ay*(bz*cx-bx*cz)+az*(bx*cy-by*cx))/6}return volume}
