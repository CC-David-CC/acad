// Independent public data-contract oracle. No CAD implementation imports.
import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const fields=(v,keys)=>assert.deepEqual(Object.keys(v).sort(),[...keys].sort());
export function unavailableSelections(value){assert.deepEqual(value,{status:'unavailable',reason:'NO_AUTHORED_PRISM_SELECTIONS'});}
export function prismSelections(value,binding,priorKeys=null){
 fields(value,['status','plan']);assert.equal(value.status,'available');const p=value.plan;
 fields(p,['version','featureId','regionId','scope','source','edges','faces','unresolved']);assert.equal(p.version,1);assert.equal(p.featureId,binding.featureId);assert.equal(p.regionId,binding.regionId);assert.equal(p.scope,'authored-source');assert.equal(p.source,'prism-construction-history');assert.deepEqual(p.unresolved,[]);
 assert.equal(p.edges.length,18);assert.equal(p.faces.length,8);const curves=new Set(binding.curveIds);assert.equal(curves.size,6);const counts=new Map(),ids=[],connectors=new Set(),expectedConnectors=new Set(binding.curveIds.map((id,i)=>JSON.stringify([binding.curveIds[(i+5)%6],id].sort())));
 for(const [kind,rows]of [['edge',p.edges],['face',p.faces]])for(const row of rows){
  assert.equal(row.geometry,kind==='edge'?'line':'plane');assert.equal(typeof row.id,'string');assert(row.id.startsWith('worker-prism-selection:1:'));const decoded=JSON.parse(row.id.slice('worker-prism-selection:1:'.length));assert.equal(decoded.length,5);assert.equal(decoded[0],binding.featureId);assert.equal(decoded[1],binding.regionId);assert.equal(decoded[2],kind);assert.equal(decoded[3],row.role);ids.push(row.id);
  if(row.role==='connector'){assert.equal(kind,'edge');fields(row,['id','role','incidentCurveIds','geometry']);assert.equal(row.incidentCurveIds.length,2);assert(row.incidentCurveIds[0]<row.incidentCurveIds[1]);for(const id of row.incidentCurveIds)assert(curves.has(id));assert.deepEqual(decoded[4],row.incidentCurveIds);connectors.add(JSON.stringify(row.incidentCurveIds));}
  else if(['first-boundary','last-boundary','swept-boundary'].includes(row.role)){assert.equal(kind,row.role==='swept-boundary'?'face':'edge');fields(row,['id','role','curveId','geometry']);assert(curves.has(row.curveId));assert.equal(decoded[4],row.curveId);const key=row.role+':'+row.curveId;counts.set(key,(counts.get(key)||0)+1);}
  else{assert.equal(kind,'face');assert(['first-cap','last-cap'].includes(row.role));fields(row,['id','role','geometry']);assert.equal(decoded[4],null);counts.set(row.role,(counts.get(row.role)||0)+1);}
 }
 assert.equal(new Set(ids).size,26);assert.deepEqual([...connectors].sort(),[...expectedConnectors].sort());assert.equal(counts.get('first-cap'),1);assert.equal(counts.get('last-cap'),1);for(const id of curves)for(const role of ['first-boundary','last-boundary','swept-boundary'])assert.equal(counts.get(role+':'+id),1);
 ids.sort();if(priorKeys)assert.deepEqual(ids,priorKeys);return {keys:ids,keySha256:createHash('sha256').update(JSON.stringify(ids)).digest('hex'),featureId:p.featureId,regionId:p.regionId,edges:p.edges.length,faces:p.faces.length};
}
