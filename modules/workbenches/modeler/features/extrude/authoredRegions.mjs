import {profileRegions} from './profilePlan.mjs';
import {polygonProfileRegions} from '../../../../engine/mount/polygonProfilePlan.mjs';

const MAX_CONTOURS=128,MAX_PRIMITIVES=4096,MAX_ID=256;
const key=ids=>JSON.stringify(ids);
function normalizeIds(ids) {
 if(!Array.isArray(ids)||!ids.length||ids.length>MAX_PRIMITIVES||ids.some(id=>typeof id!=='string'||!id||id.length>MAX_ID)||new Set(ids).size!==ids.length)throw Error('Invalid authored profile boundary.');
 return [...ids].sort();
}
function normalizeDescriptor(value) {
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).sort().join(',')!=='faceId,holes,outer'||typeof value.faceId!=='string'||!value.faceId||value.faceId.length>MAX_ID||!Array.isArray(value.holes)||value.holes.length>MAX_CONTOURS)throw Error('Invalid sketch region descriptor.');
 const outer=normalizeIds(value.outer),holes=value.holes.map(normalizeIds).sort((a,b)=>key(a)<key(b)?-1:key(a)>key(b)?1:0);
 if(new Set(holes.map(key)).size!==holes.length||holes.some(h=>key(h)===key(outer)))throw Error('Ambiguous sketch region descriptor.');
 return {faceId:value.faceId,outer,holes};
}
// `contours` are arrays of stable authored primitive IDs; `profiles` are
// already validated geometry corresponding to those arrays. No array index
// is persisted, and changing children requires a deliberate new selection.
export function deriveAuthoredRegions(faceId,contours,profiles,profileVersion=2) {
 if(![2,3].includes(profileVersion))throw Error('Unsupported authored profile version.');
 if(typeof faceId!=='string'||!faceId||faceId.length>MAX_ID||!Array.isArray(contours)||!Array.isArray(profiles)||contours.length!==profiles.length||!contours.length||contours.length>MAX_CONTOURS)throw Error('Invalid sketch profile set.');
 let total=0;for(const ids of contours){if(!Array.isArray(ids)||(total+=ids.length)>MAX_PRIMITIVES)throw Error('Too many authored profile primitives.');}
 const boundaries=contours.map(normalizeIds),all=boundaries.flat();
 if(new Set(all).size!==all.length)throw Error('Ambiguous authored profile boundaries.');
 const regions=profileVersion===3?polygonProfileRegions(profiles):profileRegions(profiles);
 return regions.map(region=>normalizeDescriptor({faceId,outer:boundaries[region.outer],holes:region.holes.map(i=>boundaries[i])}));
}
export function resolveAuthoredRegions(faceId,contours,profiles,selected,bodyPolicy,profileVersion=2) {
 const regions=deriveAuthoredRegions(faceId,contours,profiles,profileVersion);
 if(!['separate','union'].includes(bodyPolicy))throw Error('Choose whether selected regions remain separate or are combined.');
 if(!Array.isArray(selected)||!selected.length||selected.length>regions.length)throw Error('Choose at least one sketch region.');
 const normalized=selected.map(normalizeDescriptor),keys=normalized.map(value=>key(value));
 if(new Set(keys).size!==keys.length)throw Error('A sketch region was selected more than once.');
 const current=new Map(regions.map((value,index)=>[key(value),index]));
 if(normalized.some(value=>value.faceId!==faceId||!current.has(key(value))))throw Error('A selected region changed or is no longer available; select it again.');
 return {regions:normalized.map(value=>({descriptor:value,index:current.get(key(value))})),bodyPolicy};
}
