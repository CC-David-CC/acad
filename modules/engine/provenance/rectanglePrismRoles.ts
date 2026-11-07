import {prepareRectangleExtrusion} from 'workbenches/modeler/features/extrude/rectangleProfileRequest.mjs';
import {validatePortableEnvelope} from 'engine/mount/portable-topology-envelope.mjs';
import {readPortablePrism} from 'brep/io/readPortablePrism';

// Research only. Caller must assert the live mount binding before and after
// this async job, and separately bind feature/document/account lifetime.
export async function deriveRectanglePrismRoles(featureId: string, profile: any, input: any) {
 const fail=():never=>{throw Error('Ambiguous rectangle prism provenance');};
 if(typeof featureId!=='string'||!featureId||featureId.length>256||!input)fail();
 const h=input.handle,p=input.provenance,e=input.evidence;
 if(!h||!p||!e||h.representation!=='occ-brep-worker-owned'||typeof h.mountId!=='string'||!h.mountId||h.mountId.length>256||!Number.isSafeInteger(h.generation)||h.generation<1||typeof h.id!=='string'||!h.id||h.id.length>256||
    ![p.revision,p.sketchDigest,p.faceId,p.regionId].every((v:any)=>typeof v==='string'&&v.length<=8192)||!Array.isArray(p.edgeFaces)||p.edgeFaces.length!==4||![0,1,2,3].every(i=>Object.prototype.hasOwnProperty.call(p.edgeFaces,i))||!Array.isArray(e.bounds?.min)||e.bounds.min.length!==3||!Array.isArray(e.bounds?.max)||e.bounds.max.length!==3||![0,1,2].every(i=>Object.prototype.hasOwnProperty.call(e.bounds.min,i)&&Object.prototype.hasOwnProperty.call(e.bounds.max,i)))fail();
 const handle={mountId:h.mountId,generation:h.generation,representation:h.representation,id:h.id},prov={revision:p.revision,sketchDigest:p.sketchDigest,faceId:p.faceId,regionId:p.regionId,edgeFaces:p.edgeFaces.map((x:any)=>{if(!x||typeof x.sourceEdgeId!=='string'||x.sourceEdgeId.length>513||!Number.isInteger(x.faceOrdinal)||typeof x.sourceReversed!=='boolean')fail();return {sourceEdgeId:x.sourceEdgeId,faceOrdinal:x.faceOrdinal,sourceReversed:x.sourceReversed};})},evidence={triangles:e.triangles,bounds:{min:e.bounds.min.slice(),max:e.bounds.max.slice()}};
 const topo=validatePortableEnvelope(input.portableTopology,prov,evidence);
 const prepared=await prepareRectangleExtrusion(profile);
 if(prov.revision!==prepared.revision||prov.sketchDigest!==prepared.sketchDigest||prov.faceId!==prepared.faceId||prov.regionId!==prepared.regionId)fail();
 // Reuse the strict headless reader for complete supported prism geometry and
 // oriented incidence, rather than trusting the shallow controller envelope.
 readPortablePrism(topo,{engine:handle.representation,mountId:handle.mountId,generation:handle.generation});
 const authored=prepared.edges.map((e:any)=>e.id).sort(),sources=topo.sourceEdges.map((x:any)=>x.sourceEdgeId).sort();
 if(JSON.stringify(authored)!==JSON.stringify(sources)||new Set(sources).size!==4)fail();
 const edges=new Map(topo.edges.map((e:any)=>[e.id,e])),faces=new Map(topo.faces.map((f:any)=>[f.id,f]));
 const mappings=topo.sourceEdges.map((x:any)=>({x,edge:edges.get(x.baseEdge) as any}));
 const common=mappings.map(({edge}:any)=>new Set<string>(edge.uses.map((u:any)=>u.face))).reduce((a:Set<string>,b:Set<string>)=>new Set([...a].filter(v=>b.has(v))));
 if(common.size!==1)fail();const base=[...common][0],sides=new Set<string>();
 for(const {x,edge} of mappings){const others=edge.uses.filter((u:any)=>u.face!==base);if(others.length!==1||others[0].face!==x.sweptFace||sides.has(x.sweptFace))fail();sides.add(x.sweptFace);}
 const lids=topo.faces.filter((f:any)=>f.id!==base&&!sides.has(f.id));if(lids.length!==1)fail();const lid=lids[0],lidEdges=new Set(lid.loop.map((u:any)=>u.edge));
 const faceKey=(role:string,source:any)=>({featureId,kind:'face',role,source:{...source}});const edgeKey=(role:string,source:any)=>({featureId,kind:'edge',role,source:{...source}});
 const region={regionId:prepared.regionId},records:any[]=[{key:faceKey('BASE',region),resultLocal:base},{key:faceKey('LID',region),resultLocal:lid.id}],usedEdges=new Set<string>();
 mappings.sort((a:any,b:any)=>a.x.sourceEdgeId<b.x.sourceEdgeId?-1:a.x.sourceEdgeId>b.x.sourceEdgeId?1:0);
 for(const {x,edge} of mappings){const side=faces.get(x.sweptFace) as any,candidates=side.loop.filter((u:any)=>lidEdges.has(u.edge));if(candidates.length!==1||usedEdges.has(candidates[0].edge))fail();const target=candidates[0].edge;usedEdges.add(target);const source={segmentId:x.sourceEdgeId};records.push({key:faceKey('SWEEP',source),resultLocal:x.sweptFace},{key:edgeKey('BASE',source),resultLocal:edge.id},{key:edgeKey('LID',source),resultLocal:target});}
 const perimeter=new Set([...topo.sourceEdges.map((x:any)=>x.baseEdge),...usedEdges]),unsupportedEdges=topo.edges.map((e:any)=>e.id).filter((id:string)=>!perimeter.has(id));if(unsupportedEdges.length!==4)fail();
 return {version:1,scope:'authored-feature',binding:{featureId,revision:prepared.revision,sketchDigest:prepared.sketchDigest,faceId:prepared.faceId,regionId:prepared.regionId},engineBinding:{...handle},records,unsupported:{connectorEdges:unsupportedEdges,vertices:'authored-endpoint-identity-not-qualified'}};
}
