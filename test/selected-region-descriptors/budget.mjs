// Explicit component fixture: tune metadata bytes, never truncate region rows.
import {inspectSolvedSelectedRegions as inspect} from '../../modules/engine/extrusion/selectedSketchProfile.mjs';
import {request,circle} from '../selected-region-discovery/fixtures.mjs';
export const bytes=value=>new TextEncoder().encode(JSON.stringify(value)).byteLength;
export async function budgetBoundary(){
 const make=async(lengths,rev=1)=>request(lengths.map((n,i)=>circle('c'+String(i).padStart(3,'0')+'x'.repeat(n),1,3*i)),{input:{revision:'r'.repeat(rev)}});
 let lo=0,hi=246;while(lo<hi){const n=Math.ceil((lo+hi)/2),r=await inspect(await make(Array(128).fill(n)));if(bytes(r)<=65536)lo=n;else hi=n-1;}
 const lengths=Array(128).fill(lo);let revision=1,result=await inspect(await make(lengths,revision)),remaining=65536-bytes(result);if(remaining%2){revision++;remaining--;}
 let add=remaining/2;for(let i=0;i<lengths.length&&add;i++){const n=Math.min(add,246-lengths[i]);lengths[i]+=n;add-=n;}if(add)throw Error('Boundary fixture cannot be represented');
 const exact=await make(lengths,revision),value=await inspect(exact);if(bytes(value)!==65536)throw Error('Metadata byte boundary mismatch');return{exact,over:{...exact,revision:exact.revision+'r'},value};
}
