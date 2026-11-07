// Research-only 3MF Core serializer. It accepts already-qualified model-space
// meshes; it does not extract CAD geometry or claim manufacturing readiness.
import JSZip from 'jszip';
import {capture3mfProvenance,encode3mfProvenance} from './controlledMesh3mfProvenance.mjs';
import {validateEmbeddedShells,EMBEDDED_SHELL_LIMITS} from './embeddedShellValidator.mjs';

const MAX_OBJECTS = 32, MAX_MATERIALS = 128, MAX_VERTICES = 150000,
  MAX_TRIANGLES = 250000, MAX_XML_BYTES = 48 * 1024 * 1024;
const units = new Set(['micron', 'millimeter', 'centimeter', 'inch', 'foot', 'meter']);
const ident = /^[A-Za-z0-9_.:-]{1,128}$/;
const color = /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/;
const identity = [1,0,0, 0,1,0, 0,0,1, 0,0,0];
const fail = message => { throw new Error(message); };
function text(v, what) {
  if (typeof v !== 'string' || !v.length || v.length > 256 || /[\u0000-\u001f\u007f-\u009f\ud800-\udfff]/u.test(v)) fail(`Invalid ${what}`);
  return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}
function cancelled(signal) { if (signal?.aborted) throw new DOMException('Export cancelled', 'AbortError'); }
async function checkpoint(signal, i) {
  if ((i & 4095) === 0) { cancelled(signal); await new Promise(resolve => setTimeout(resolve, 0)); cancelled(signal); }
}
function transform(values) {
  if (!Array.isArray(values) || values.length !== 12 || !values.every(Number.isFinite)) fail('Invalid transform');
  const [a,b,c,d,e,f,g,h,i] = values;
  const det = a*(e*i-f*h)-b*(d*i-f*g)+c*(d*h-e*g);
  if (!Number.isFinite(det) || det < 1e-12) fail('Singular, near-singular or reflected transform');
  return values.map(n => Object.is(n, -0) ? '0' : String(n)).join(' ');
}

// Complete geometric embedding and exact strict shell containment run in the
// dedicated export Worker; no Native/source-preservation flag bypasses validation.
async function validateShellNesting(parts,vertices,triangles,signal,budget,onProgress) {
  if(parts.length>64)throw Object.assign(Error('Too many shell components'),{code:'RESOURCE_LIMIT'});
  const remaining=Math.floor(budget.deadline-performance.now());
  if(remaining<1||budget.pairs<1||budget.predicates<1)throw Object.assign(Error('Embedded mesh export work budget exhausted'),{code:'RESOURCE_LIMIT'});
  const result=await validateEmbeddedShells({vertices,triangles},{signal,deadlineMs:Math.min(120000,remaining),maxPairTests:budget.pairs,maxPredicateTests:budget.predicates,onProgress});
  budget.pairs-=result.metrics.pairTests;budget.predicates-=result.metrics.predicateTests;
  const byFirst=new Map(result.shells.map(row=>[row.firstTriangle,row]));
  if(byFirst.size!==parts.length)fail('Embedded shell census differs');
  for(const part of parts){const row=byFirst.get(part.tris[0]);if(!row||row.triangleCount!==part.tris.length||row.vertexCount!==part.vertices.size)fail('Embedded shell membership differs');part.depth=row.depth;}
}

export async function writeCore3mf(model, {signal,provenance=undefined,onMeshProgress=undefined} = {}) {
  cancelled(signal);
  if(onMeshProgress!==undefined&&typeof onMeshProgress!=='function')fail('Invalid mesh progress observer');
  const meshBudget={pairs:EMBEDDED_SHELL_LIMITS.pairTests,predicates:EMBEDDED_SHELL_LIMITS.predicateTests,deadline:performance.now()+EMBEDDED_SHELL_LIMITS.deadlineMs};
  if (!model || !units.has(model.unit)) fail('Explicit supported unit required');
  if (!Array.isArray(model.materials) || model.materials.length > MAX_MATERIALS) fail('Invalid materials');
  if (!Array.isArray(model.objects) || !model.objects.length || model.objects.length > MAX_OBJECTS) fail('Invalid objects');
  // Snapshot only bounded fields before yielding; callers may continue editing.
  let preVertices=0, preTriangles=0;
  for (const item of model.objects) {
    if (!item || !Array.isArray(item.vertices) || !Array.isArray(item.triangles)) fail('Invalid mesh');
    preVertices+=item.vertices.length; preTriangles+=item.triangles.length;
    if(preVertices>MAX_VERTICES||preTriangles>MAX_TRIANGLES)throw Object.assign(Error('Mesh exceeds limits'),{code:'RESOURCE_LIMIT'});
  }
  model={unit:model.unit, revision:model.revision, materials:model.materials.map(m=>m && ({id:m.id,name:m.name,color:m.color})), builds:model.builds===undefined?undefined:(Array.isArray(model.builds)?model.builds.map(b=>b && ({id:b.id,name:b.name,objects:Array.isArray(b.objects)?b.objects.slice(0,MAX_OBJECTS+1):b.objects})):null), objects:model.objects.map(item=>({id:item.id,name:item.name,materialId:item.materialId,transform:Array.isArray(item.transform)?item.transform.slice(0,13):item.transform,vertices:item.vertices.map(v=>Array.isArray(v) && v.length===3?v.slice():null),triangles:item.triangles.map(t=>Array.isArray(t) && t.length===3?t.slice():null)}))};
  const capturedProvenance=provenance===undefined?undefined:capture3mfProvenance(provenance,model);
  const provenanceObjects=new Map(),provenanceBuilds=new Map();
  const materials = new Map(), ids = new Set();
  const materialXml = model.materials.map((m, i) => {
    if (!m || typeof m.id !== 'string' || !ident.test(m.id) || materials.has(m.id) || !color.test(m.color)) fail('Invalid material');
    materials.set(m.id, i);
    return `<base name="${text(m.name, 'material name')}" displaycolor="${m.color.toUpperCase()}"/>`;
  }).join('');
  const resourceIds=new Map();
  let nv = 0, nt = 0, objectsXml = '', buildXml = '';
  for (let o = 0; o < model.objects.length; o++) {
    const item = model.objects[o];
    if (!item || typeof item.id !== 'string' || !ident.test(item.id) || ids.has(item.id)) fail('Invalid object identity');
    ids.add(item.id);
    const name = text(item.name, 'object name');
    if (!Array.isArray(item.vertices) || !Array.isArray(item.triangles)) fail('Invalid mesh');
    nv += item.vertices.length; nt += item.triangles.length;
    if(nv>MAX_VERTICES||nt>MAX_TRIANGLES)throw Object.assign(Error('Mesh exceeds limits'),{code:'RESOURCE_LIMIT'});
    if(item.vertices.length<4||item.triangles.length<4)fail('Mesh is empty');
    const mat = item.materialId === undefined || item.materialId === null ? null : materials.get(item.materialId);
    if (mat === undefined) fail('Unknown material');
    const verts = [];
    for (let j=0; j<item.vertices.length; j++) {
      await checkpoint(signal,j);
      const v=item.vertices[j];
      if(!Array.isArray(v)||v.length!==3||!v.every(Number.isFinite))fail('Invalid vertex');
      if(v.some(n=>Math.abs(n)>1e9))throw Object.assign(Error('Coordinate magnitude exceeds supported bound'),{code:'RESOURCE_LIMIT'});
      verts.push(`<vertex x="${v[0]}" y="${v[1]}" z="${v[2]}"/>`);
    }
    // Each undirected edge must occur twice in opposite directions. Indexed
    // vertices must already be welded; never guess a tolerance and change shape.
    const edges=new Map(), triangles=[], parents=Int32Array.from({length:item.triangles.length}, (_, i) => i);
    const root = i => { while(parents[i] !== i) { parents[i]=parents[parents[i]]; i=parents[i]; } return i; };
    for (let j=0; j<item.triangles.length; j++) {
      await checkpoint(signal,j);
      const t=item.triangles[j];
      if (!Array.isArray(t) || t.length!==3 || !t.every(n=>Number.isSafeInteger(n)&&n>=0&&n<item.vertices.length) || new Set(t).size!==3) fail('Invalid triangle');
      // Exact area, embedding and volume signs are checked below in the Worker.
      for (const [x,y] of [[t[0],t[1]],[t[1],t[2]],[t[2],t[0]]]) {
        const key=x<y?`${x}:${y}`:`${y}:${x}`, prev=edges.get(key)||[0,0,j];
        prev[0]++; prev[1]+=x<y?1:-1; if(prev[0]===2) {prev[3]=j; parents[root(j)]=root(prev[2]);} if(prev[0]>2) fail('Non-manifold edge'); edges.set(key,prev);
      }
      triangles.push(`<triangle v1="${t[0]}" v2="${t[1]}" v3="${t[2]}"/>`);
    }
    let edgeIndex=0;
    for (const [count, direction] of edges.values()) {
      await checkpoint(signal,edgeIndex++);
      if (count!==2 || direction!==0) fail('Mesh is open or has inconsistent winding');
    }
    // The incident triangles at each vertex must form one cycle, not two
    // disconnected fans (a bow-tie vertex can pass every edge check).
    const links=new Map(); edgeIndex=0;
    for(const [key, edge] of edges) {
      await checkpoint(signal,edgeIndex++);
      const [u,v]=key.split(':').map(Number);
      for (const vertex of [u,v]) {
        if(!links.has(vertex)) links.set(vertex,new Map());
        const graph=links.get(vertex), a=edge[2], b=edge[3];
        if(!graph.has(a)) graph.set(a,[]); if(!graph.has(b)) graph.set(b,[]);
        graph.get(a).push(b);graph.get(b).push(a);
      }
    }
    let vertexIndex=0;
    for (const graph of links.values()) {
      await checkpoint(signal,vertexIndex++);
      if([...graph.values()].some(neighbours=>neighbours.length!==2)) fail('Non-manifold vertex');
      const visited=new Set(), stack=[graph.keys().next().value];
      while(stack.length) {const face=stack.pop();if(visited.has(face)) continue;visited.add(face);for(const next of graph.get(face)) if(!visited.has(next)) stack.push(next);}
      if(visited.size!==graph.size) fail('Non-manifold vertex');
    }
    const componentParts = new Map();
    for (let j=0; j<item.triangles.length; j++) {
      await checkpoint(signal,j); const k=root(j);
      if (!componentParts.has(k)) componentParts.set(k,{tris:[],vertices:new Set()});
      const part=componentParts.get(k);part.tris.push(j);
      for(const v of item.triangles[j])part.vertices.add(v);
    }
    await validateShellNesting([...componentParts.values()],item.vertices,item.triangles,signal,meshBudget,onMeshProgress===undefined?undefined:work=>onMeshProgress(Object.freeze({...work,version:1,objectIndex:o,objectCount:model.objects.length})));
    const objectId=2+2*o, componentId=objectId+1, property=mat===null?'':` pid="1" pindex="${mat}"`;
    objectsXml+=`<object id="${objectId}" type="model" name="${name}"${property}><mesh><vertices>${verts.join('')}</vertices><triangles>${triangles.join('')}</triangles></mesh></object>`;
    objectsXml+=`<object id="${componentId}" type="model" name="${name}"><components><component objectid="${objectId}" transform="${transform(item.transform || identity)}"/></components></object>`;
    resourceIds.set(item.id,componentId);
    provenanceObjects.set(item.id,{mesh:objectId,component:componentId});
    if (objectsXml.length > MAX_XML_BYTES) throw Object.assign(Error('Model exceeds XML limit'),{code:'RESOURCE_LIMIT'});
  }
  if (model.builds===undefined && model.objects.length!==1) fail('Explicit build grouping required for multiple objects');
  const groups=model.builds===undefined?model.objects.map(item=>({id:item.id,name:item.name,objects:[item.id]})):model.builds;
  if (!Array.isArray(groups) || !groups.length || groups.length>MAX_OBJECTS) fail('Invalid build groups');
  const grouped=new Set(), groupIds=new Set();
  for (let i=0;i<groups.length;i++) {
    const group=groups[i];
    if (!group || typeof group.id!=='string' || !ident.test(group.id) || groupIds.has(group.id) || !Array.isArray(group.objects) || !group.objects.length || group.objects.length>MAX_OBJECTS) fail('Invalid build group');
    groupIds.add(group.id);
    let refs='';
    for (const id of group.objects) {
      if (!resourceIds.has(id) || grouped.has(id)) fail('Unknown or repeated group object');
      grouped.add(id); refs+=`<component objectid="${resourceIds.get(id)}"/>`;
    }
    const id=2+2*model.objects.length+i;
    objectsXml+=`<object id="${id}" type="model" name="${text(group.name,'build group name')}"><components>${refs}</components></object>`;
    buildXml+=`<item objectid="${id}"/>`;
    provenanceBuilds.set(group.id,id);
  }
  if (grouped.size!==model.objects.length) fail('Every object must belong to a build group');
  const resource=model.materials.length?`<basematerials id="1">${materialXml}</basematerials>`:'';
  const provenanceXml=capturedProvenance===undefined?'':`<metadata name="codi:ManufacturingBindings">${encode3mfProvenance(capturedProvenance,{objects:provenanceObjects,builds:provenanceBuilds,materials}).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</metadata>`;
  const xml=`<?xml version="1.0" encoding="UTF-8"?><model unit="${model.unit}" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:codi="https://ksu.codes/3mf/metadata/2026"><metadata name="codi:SourceRevision">${text(model.revision,'source revision')}</metadata>${provenanceXml}<resources>${resource}${objectsXml}</resources><build>${buildXml}</build></model>`;
  if (new TextEncoder().encode(xml).length > MAX_XML_BYTES) throw Object.assign(Error('Model exceeds XML limit'),{code:'RESOURCE_LIMIT'});
  cancelled(signal);
  const zip=new JSZip();
  zip.file('[Content_Types].xml','<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>');
  zip.file('_rels/.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>');
  zip.file('3D/3dmodel.model',xml);
  const output=await zip.generateAsync({type:'uint8array',compression:'STORE'},()=>cancelled(signal));
  cancelled(signal); return output;
}
