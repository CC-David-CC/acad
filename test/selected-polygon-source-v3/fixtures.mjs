// Explicit native-v3 component fixtures; not a public authoring/solver claim.
export {circle,rectangle,regionId,ids} from '../selected-region-discovery/fixtures.mjs';
import {request as baseRequest} from '../selected-region-discovery/fixtures.mjs';
export const request=(objects,overrides={})=>baseRequest(objects,{...overrides,input:{profileVersion:3,...overrides.input}});
export const polygon=(id,points)=>points.map((a,i)=>({id:id+i,type:'Segment',role:null,stage:0,data:i%2?{a:{x:points[(i+1)%points.length][0],y:points[(i+1)%points.length][1]},b:{x:a[0],y:a[1]}}:{a:{x:a[0],y:a[1]},b:{x:points[(i+1)%points.length][0],y:points[(i+1)%points.length][1]}}}));
export const triangle=(id='t')=>polygon(id,[[0,0],[30,0],[0,20]]);
export const rotated=(id='r')=>polygon(id,[[0,10],[10,20],[20,10],[10,0]]);
export const lshape=(id='l',offset=0)=>polygon(id,[[offset,0],[offset+80,0],[offset+80,20],[offset+20,20],[offset+20,60],[offset,60]]);
export const regular=(id,count)=>polygon(id,Array.from({length:count},(_,i)=>[100*Math.cos(i*2*Math.PI/count),100*Math.sin(i*2*Math.PI/count)]));
