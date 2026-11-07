import fs from 'node:fs';import assert from 'node:assert/strict';
import {createPrismSelectionIndex} from '../../modules/engine/mount/prismSelectionIndex.mjs';
export const native=JSON.parse(fs.readFileSync(new URL('../selection-ancestry/native-first-receipt.json',import.meta.url)));
export const catalog=native.initial.catalog,clone=structuredClone;
export const plural=k=>k==='vertex'?'vertices':k==='edge'?'edges':'faces';
export function history(topology=catalog,version=2,sourceCounts){
 const names=version===2?['vertices','edges','faces']:['edges','faces'];const counts=Object.fromEntries(names.map(k=>[k,topology[k].length])),source=sourceCounts??counts;
 const empty=()=>Object.fromEntries(names.map(k=>[k,[]]));
 return {version,scope:'response-local',persistentIds:false,sourceCounts:{...source},resultCounts:counts,...Object.fromEntries(names.map(k=>[k,Array.from({length:source[k]},(_,i)=>({source:i+1,same:{...empty(),[k]:i<counts[k]?[i+1]:[]},modified:empty(),generated:empty(),reportedDeleted:false}))]))};
}
export const claim=(id,sourceIndex=1,kind='edge')=>({kind,id,sourceIndex});
export function fixture(a=[claim('A')],b=[claim('B',2)],version=2){return{sources:[{claims:a,ancestry:history(catalog,version)},{claims:b,ancestry:history(catalog,version)}],topology:clone(catalog)}}
export function sourceClaims(){
 const p=clone(native.initial.create.constructionProvenance),loop=p.data.sourceLoops[0],corners=[[0,0,0],[100,0,0],[100,50,0],[0,50,0]];
 loop.vertices.forEach((v,i)=>assert.deepEqual(catalog.vertices[v.firstVertex-1].point,corners[i]));
 // Explicit component-side authored slot labels, just as the recorded pure
 // propagation proof. These are not public CAD/native-save feature identities.
 p.sourceBinding={scope:'solved-request',regionId:'component-rectangle',nativeSlotBindings:[{loop:0,edges:loop.edges.map((_,i)=>({source:i,curveId:'e'+i,nativeReversed:false})),vertices:loop.vertices.map((_,i)=>({source:i,incidentCurveIds:['e'+((i+3)%4),'e'+i].sort()}))}]};
 const index=createPrismSelectionIndex(1,p,catalog);return [...index.plan.edges.map(e=>claim(e.id,index.resolveEdge(e.id))),...index.plan.faces.map(f=>claim(f.id,index.resolveFace(f.id),'face'))];
}
export const noNativeIndices=value=>assert.doesNotMatch(JSON.stringify(value),/"(?:sourceIndex|sourceCounts|resultCounts|nativeIndex|ptr|ref|index|vertices)"\s*:/);
