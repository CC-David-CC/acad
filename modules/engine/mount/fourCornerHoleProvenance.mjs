// Research-only response-local ancestry check. This is NOT geometry validation,
// ownership authentication, durable naming, or permission to publish a model.
const bad=()=>{throw Error('Missing, ambiguous, or contradictory four-tool ancestry')};
const dense=(x,n)=>Array.isArray(x)&&x.length===n&&Array.from({length:n},(_,i)=>Object.hasOwn(x,i)).every(Boolean);
const exact=(o,keys)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).sort().join(',')===keys.slice().sort().join(',');
const validIds=(x,max)=>Array.isArray(x)&&x.length<=max&&x.every(n=>Number.isSafeInteger(n)&&n>0&&n<=max)&&new Set(x).size===x.length;
const near=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<1e-6;
export function validateFourCornerProvenance(result,centerParent,plan){
 if(!result||!centerParent||!plan||!dense(result.faces,11)||!dense(result.vertices,18)||!dense(result.parentFaces,7)||!dense(result.fourCornerTools,4)||!dense(centerParent.faces,7)||!dense(plan.corners,4))bad();
 const faces=result.faces,parent=centerParent.faces,used=new Set(),supports=[];let oldWall;
 for(let i=0;i<7;i++){
  const h=result.parentFaces[i];if(!exact(h,['same','modified','generatedEdges'])||!validIds(h.same,11)||!validIds(h.modified,11)||!validIds(h.generatedEdges,27)||h.same.length+h.modified.length!==1)bad();
  const id=(h.same[0]??h.modified[0]);if(used.has(id)||!faces[id-1]||!parent[i]||faces[id-1].type!==parent[i].type)bad();used.add(id);
  if(parent[i].type==='cylinder'){if(oldWall||h.same.length!==1||h.generatedEdges.length)bad();oldWall=id;}
  else if(parent[i].type!=='plane')bad();
  if(h.generatedEdges.length){if(parent[i].type!=='plane'||h.modified.length!==1||h.generatedEdges.length!==4)bad();supports.push({id,edges:h.generatedEdges});}
 }
 if(!oldWall||supports.length!==2)bad();
 const seenInput=new Set(),newFaces=new Set(),rimSet=new Set(),bindings=[];
 for(const tool of result.fourCornerTools){
  if(!exact(tool,['inputIndex','faces'])||!Number.isInteger(tool.inputIndex)||tool.inputIndex<0||tool.inputIndex>3||seenInput.has(tool.inputIndex)||!dense(tool.faces,3))bad();seenInput.add(tool.inputIndex);
  for(const f of tool.faces){if(!exact(f,['type','same','modified','generated','modifiedEdges','generatedEdges'])||!['plane','cylinder'].includes(f.type)||!['same','modified','generated'].every(k=>validIds(f[k],11))||!['modifiedEdges','generatedEdges'].every(k=>validIds(f[k],27)))bad();}
  const cylinders=tool.faces.filter(f=>f.type==='cylinder'),caps=tool.faces.filter(f=>f.type==='plane');if(cylinders.length!==1||caps.length!==2||caps.some(f=>['same','modified','generated','modifiedEdges','generatedEdges'].some(k=>f[k].length)))bad();
  const c=cylinders[0];if(c.same.length||c.generated.length||c.modifiedEdges.length||c.modified.length!==1||c.generatedEdges.length!==2)bad();const id=c.modified[0],face=faces[id-1],corner=plan.corners[tool.inputIndex];
  if(used.has(id)||newFaces.has(id)||face?.type!=='cylinder'||!corner||!near(face.radius,corner.radius)||!Array.isArray(face.origin)||!near(face.origin[0],corner.center[0])||!near(face.origin[1],corner.center[1]))bad();newFaces.add(id);
  if(!Array.isArray(face.loops)||face.loops.length!==1||!Array.isArray(face.loops[0]))bad();const circle=face.loops[0].filter(e=>e.type==='circle');if(circle.length!==2||!c.generatedEdges.every(e=>circle.some(u=>u.edge===e)))bad();
  for(const edge of c.generatedEdges){if(rimSet.has(edge))bad();rimSet.add(edge);const support=supports.filter(s=>s.edges.includes(edge));if(support.length!==1)bad();const loops=faces[support[0].id-1].loops;if(!Array.isArray(loops)||loops.filter(l=>Array.isArray(l)&&l.length===1&&l[0].type==='circle'&&l[0].edge===edge).length!==1)bad();}
  bindings.push(Object.freeze({inputIndex:tool.inputIndex,wallFace:id,rimEdges:Object.freeze([...c.generatedEdges])}));
 }
 if(newFaces.size!==4||used.size!==7||rimSet.size!==8||supports.some(s=>s.edges.some(e=>!rimSet.has(e))))bad();
 const original=parent.find(f=>f.type==='cylinder'),wall=faces[oldWall-1];if(!original||!near(wall.radius,original.radius)||!Array.isArray(wall.origin)||!Array.isArray(original.origin)||!wall.origin.every((n,i)=>near(n,original.origin[i])))bad();
 return Object.freeze({centerWallFace:oldWall,tools:Object.freeze(bindings.sort((a,b)=>a.inputIndex-b.inputIndex))});
}
