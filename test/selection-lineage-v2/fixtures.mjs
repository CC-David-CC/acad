import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createPrismSelectionIndex} from '../../modules/engine/mount/prismSelectionIndex.mjs';
import {preparePolygonProfileExtrusion} from '../../modules/engine/mount/polygonProfilePlan.mjs';
import {validatePrismProvenance,bindPrismSourceSlots} from '../../modules/engine/mount/ownedTopologyContract.mjs';
import {liftPrismSelectionIndexV2} from '../../modules/engine/mount/selectionLineageIndex.mjs';
export const edgeReceipt=JSON.parse(fs.readFileSync(new URL('../selection-ancestry/native-first-receipt.json',import.meta.url),'utf8'));
export const native=JSON.parse(fs.readFileSync(new URL('./native-main-fixture.json',import.meta.url),'utf8'));
export function edgeBase(){
 const p=structuredClone(edgeReceipt.initial.create.constructionProvenance),c=edgeReceipt.initial.catalog,loop=p.data.sourceLoops[0];
 // Explicit fixture caller names on actual construction slots, not recovered
 // public CAD IDs. Match the recorded original source vertices first.
 loop.vertices.forEach((v,i)=>assert.deepEqual(c.vertices[v.firstVertex-1].point,[[0,0,0],[100,0,0],[100,50,0],[0,50,0]][i]));
 p.sourceBinding={scope:'solved-request',regionId:'component-rectangle',nativeSlotBindings:[{loop:0,edges:loop.edges.map((e,i)=>({source:i,curveId:'e'+i,nativeReversed:false})),vertices:loop.vertices.map((v,i)=>({source:i,incidentCurveIds:['e'+((i+3)%4),'e'+i].sort()}))}]};
 const v1=createPrismSelectionIndex(1,p,c);return{v1,v2:liftPrismSelectionIndexV2({sourceIndex:v1,featureId:1,regionId:'component-rectangle',topology:c}),catalog:c};
}
export const featureIds={A:10,B:20,C:30,plate:40,'circle-tool':50};
export function mainBase(name){
 const r=native.initial[name],v=r.values,kind=v[14],curves=[];assert.equal(v[13],1);
 if(kind===1){assert.equal(v.length,18);curves.push({kind:'circle',id:name+':circle',center:v.slice(15,17),radius:v[17]});}
 else{assert.equal(kind,2);const n=v[15];assert.equal(v.length,16+2*n);for(let i=0;i<n;i++)curves.push({kind:'segment',id:name+':segment:'+i,a:v.slice(16+2*i,18+2*i),b:v.slice(16+2*((i+1)%n),18+2*((i+1)%n))});}
 const request={op:'solid.profile.extrude',version:3,unit:'millimeter',frame:{origin:v.slice(1,4),x:v.slice(4,7),y:v.slice(7,10),z:v.slice(10,13)},depth:v[0],region:{id:'native-v3-component:'+name,outer:curves,holes:[]}};
 const prepared=preparePolygonProfileExtrusion(request);assert.deepEqual(prepared.nativeValues,v);
 const topology=r.state.catalog,proof=bindPrismSourceSlots(validatePrismProvenance(structuredClone(r.value.constructionProvenance),topology,prepared),prepared),v1=createPrismSelectionIndex(featureIds[name],proof,topology);
 return{v1,v2:liftPrismSelectionIndexV2({sourceIndex:v1,featureId:featureIds[name],regionId:request.region.id,topology}),catalog:topology};
}
export const edgeAt=(index,n)=>{const matches=index.plan.edges.filter(d=>index.resolveEdge(d.id)===n);assert.equal(matches.length,1);return matches[0].id;};
export function identity(topology,version=2){
 const names=version===1?['edges','faces']:['vertices','edges','faces'];
 const empty=()=>Object.fromEntries(names.map(k=>[k,[]]));
 return{version,scope:'response-local',persistentIds:false,sourceCounts:Object.fromEntries(names.map(k=>[k,topology[k].length])),resultCounts:Object.fromEntries(names.map(k=>[k,topology[k].length])),...Object.fromEntries(names.map(k=>[k,topology[k].map((_,i)=>({source:i+1,same:{...empty(),[k]:[i+1]},modified:empty(),generated:empty(),reportedDeleted:false}))]))};
}
export function renamed(index,rename){
 const plan=structuredClone(index.plan),maps={vertex:new Map(),edge:new Map(),face:new Map()};
 for(const [type,list]of [['vertex','vertices'],['edge','edges'],['face','faces']])plan[list]=plan[list].map((d,i)=>{const id=rename(d.id,i,type);maps[type].set(id,index['resolve'+type[0].toUpperCase()+type.slice(1)](d.id));return{...d,id};});
 const resolve=(type,id)=>{if(!maps[type].has(id))throw Error('missing fixture ID');return maps[type].get(id);};
 return{plan,resolveVertex:id=>resolve('vertex',id),resolveEdge:id=>resolve('edge',id),resolveFace:id=>resolve('face',id)};
}
