import {canonicalPrismEndpointRoles,capturePrismConnectorEndpointRoles} from './ownedTopologyContract.mjs';
// Worker-only source identities. Native ordinals stay inside this index and
// are regenerated from the current prism's actual construction history.
const fail=(code,message)=>{throw Object.assign(Error(message),{code});};
const identity=value=>typeof value==='string'&&value.length>0&&value.length<=16384;
const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
export function createPrismSelectionIndex(featureId,provenance,topology){
 if(!Number.isSafeInteger(featureId)||featureId<1)fail('INVALID_REQUEST','A positive authored feature identity is required.');
 if(provenance?.status!=='available')fail('SELECTION_UNAVAILABLE','Prism construction provenance is unavailable.');
 const graph=provenance.data,binding=provenance.sourceBinding,regionId=binding?.regionId;
 if(graph?.scope!=='response-local'||graph.persistentIds!==false||binding?.scope!=='solved-request'||!identity(regionId)||regionId.length>8192||!Array.isArray(graph.sourceLoops)||!Array.isArray(binding.nativeSlotBindings)||graph.sourceLoops.length!==binding.nativeSlotBindings.length||topology?.scope!=='response-local'||topology.persistentIds!==false)fail('ENGINE_FAILURE','Current prism provenance is required.');
 const edges=[],faces=[],edgeMap=new Map(),faceMap=new Map(),usedEdges=new Set(),usedFaces=new Set();let bytes=0;
 const add=(kind,role,source,nativeIndex,extra={})=>{
  const map=kind==='edge'?edgeMap:faceMap,used=kind==='edge'?usedEdges:usedFaces,catalog=kind==='edge'?topology.edges:topology.faces;
  if(!Number.isSafeInteger(nativeIndex)||nativeIndex<1||nativeIndex>catalog.length||used.has(nativeIndex))fail('ENGINE_FAILURE','Prism selection ancestry must be unique.');
  const id='worker-prism-selection:1:'+JSON.stringify([featureId,regionId,kind,role,source]);
  if(!identity(id))fail('SELECTION_RESOURCE_LIMIT','Encoded prism selection identity exceeds its lookup budget.');
  const endpointBytes=Object.hasOwn(extra,'endpointRoles')?new TextEncoder().encode(JSON.stringify({endpointRoles:extra.endpointRoles})).byteLength:0;
  bytes+=id.length*3+256+endpointBytes;if(bytes>524288)fail('SELECTION_RESOURCE_LIMIT','Prism selection identities exceed their bounded observation budget.');
  if(map.has(id))fail('ENGINE_FAILURE','Duplicate authored prism selection.');
  const descriptor={id,role,...extra,geometry:catalog[nativeIndex-1].type};
  map.set(id,nativeIndex);used.add(nativeIndex);(kind==='edge'?edges:faces).push(descriptor);
 };
 add('face','first-cap',null,graph.caps.firstFace);add('face','last-cap',null,graph.caps.lastFace);
 for(let i=0;i<graph.sourceLoops.length;i++){
  const native=graph.sourceLoops[i],authored=binding.nativeSlotBindings[i];
  if(native.loop!==i||authored.loop!==i||native.edges.length!==authored.edges.length||native.vertices.length!==authored.vertices.length)fail('ENGINE_FAILURE','Prism source slots differ.');
  const endpointAware=authored.vertices.some(vertex=>vertex&&Object.hasOwn(vertex,'endpointRoles'));
  for(let j=0;j<native.edges.length;j++){
   const e=native.edges[j],source=authored.edges[j];
   if(e.source!==j||source.source!==j||!identity(source.curveId)||source.curveId.length>256||endpointAware&&typeof source.nativeReversed!=='boolean')fail('ENGINE_FAILURE','Invalid authored boundary identity.');
   const extra={curveId:source.curveId};
   add('edge','first-boundary',source.curveId,e.firstEdge,extra);add('edge','last-boundary',source.curveId,e.lastEdge,extra);add('face','swept-boundary',source.curveId,e.sweptFace,extra);
  }
  for(let j=0;j<native.vertices.length;j++){
   const v=native.vertices[j],source=authored.vertices[j],pair=source.incidentCurveIds;
   if(v.source!==j||source.source!==j||!Array.isArray(pair)||pair.length!==2||!pair.every(n=>identity(n)&&n.length<=256)||pair[0]>=pair[1])fail('ENGINE_FAILURE','A connector requires two distinct canonical authored boundary identities.');
   if(endpointAware){
    const field=Object.getOwnPropertyDescriptor(source,'endpointRoles');if(!field?.enumerable||!Object.hasOwn(field,'value'))fail('ENGINE_FAILURE','Analytic connector endpoint roles must cover every actual source junction.');
    const roles=capturePrismConnectorEndpointRoles(field.value,pair),previous=authored.edges[(j+authored.edges.length-1)%authored.edges.length],outgoing=authored.edges[j],expected=canonicalPrismEndpointRoles([{curveId:previous.curveId,endpoint:previous.nativeReversed?'a':'b'},{curveId:outgoing.curveId,endpoint:outgoing.nativeReversed?'b':'a'}]);
    if(JSON.stringify(roles)!==JSON.stringify(expected))fail('ENGINE_FAILURE','Connector endpoint roles differ from the actual bound source edges.');
    add('edge','connector',{endpointRoles:roles},v.sweptEdge,{incidentCurveIds:pair.slice(),endpointRoles:roles});
   }else add('edge','connector',pair,v.sweptEdge,{incidentCurveIds:pair.slice()});
  }
 }
 const unresolvedEdges=topology.edges.length-usedEdges.size,unresolvedFaces=topology.faces.length-usedFaces.size;
 if(unresolvedEdges<0||unresolvedFaces!==0)fail('ENGINE_FAILURE','Prism ancestry does not cover the reported faces.');
 const plan=freeze({version:1,featureId,regionId,scope:'authored-source',source:'prism-construction-history',edges,faces,
  unresolved:unresolvedEdges?[{kind:'edge',count:unresolvedEdges,reason:'UNAUTHORED_KERNEL_EDGE'}]:[]});
 if(new TextEncoder().encode(JSON.stringify(plan)).byteLength>524288)fail('SELECTION_RESOURCE_LIMIT','Encoded prism selection plan exceeds its observation budget.');
 const resolve=(kind,id)=>{
  if(!identity(id))fail('INVALID_SELECTION','Expected a discovered authored selection identity.');
  const index=(kind==='edge'?edgeMap:faceMap).get(id);if(index===undefined)fail('UNRESOLVED_SELECTION','The authored selection has no unique descendant in this prism.');return index;
 };
 return Object.freeze({plan,resolveEdge:id=>resolve('edge',id),resolveFace:id=>resolve('face',id)});
}
