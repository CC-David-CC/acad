// Bounded inspection of already-published worker plate geometry. This is not
// a kernel query, topology certification, or permission to use native handles.
const supported=Object.freeze({'worker-owned-occ-prism':{faces:6,holes:0},'worker-owned-occ-drilled':{faces:7,holes:1},'worker-owned-occ-four-corner':{faces:11,holes:5}});
const fail=()=>{throw Error('Published geometry is unavailable or unsupported.');};
const finite=n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=2e7;
function point(value){if(!Array.isArray(value)||value.length!==3||![0,1,2].every(i=>Object.hasOwn(value,i)&&finite(value[i])))fail();return value;}
function text(value){if(typeof value!=='string'||!value||value.length>1024)fail();return value;}
export function inspectPublishedWorkerGeometry(ctx){
 const craft=ctx?.craftService,registry=ctx?.cadRegistry,project=ctx?.projectService;
 if(!project?.hasHostLifetime||!project.isDocumentCurrent(project.documentGeneration)||!craft||!registry)fail();
 const start=craft.inspectRectangleCreation();if(!start.ready)fail();
 const shells=registry.shells;if(!Array.isArray(shells)||shells.length>256)fail();
 let omitted=0;const bodies=[];
 for(const model of shells){
  const geometry=model?.ext?.workerGeometry,shape=Object.hasOwn(supported,geometry?.representation)?supported[geometry.representation]:null;
  if(!shape||geometry?.engine!=='occ'){omitted++;continue;}
  const bodyId=text(model.id);if(registry.find(bodyId)!==model||!Array.isArray(model.faces)||model.faces.length!==shape.faces)fail();
  let count=0;const bounds=[[Infinity,-Infinity],[Infinity,-Infinity],[Infinity,-Infinity]];
  for(const vertex of model.brepShell?.vertices||[]){if(++count>64)fail();const p=vertex?.point,coords=[p?.x,p?.y,p?.z];if(!coords.every(finite))fail();coords.forEach((v,i)=>{bounds[i][0]=Math.min(bounds[i][0],v);bounds[i][1]=Math.max(bounds[i][1],v);});}
  if(count<4)fail();
  const faces=[],holes=[],seen=new Set();
  for(const face of model.faces){
   const id=text(face?.id),role=text(face?.topology?.data?.portableIdentity?.key?.role);
   if(face.root!==model||registry.findFace(id)!==face||seen.has(id))fail();seen.add(id);faces.push(Object.freeze({id,role}));
   if(role!=='HOLE_WALL'&&role!=='CORNER_WALL')continue;
   const impl=face.surface?.impl,u=impl?.uMin,v=impl?.vMin;
   if(impl?.analyticKind!=='cylinder'||!finite(u)||!finite(v)||typeof impl.point!=='function')fail();
   const a=point(impl.point(u,v)),b=point(impl.point(u+Math.PI,v)),center=a.map((x,i)=>(x+b[i])/2),radius=Math.hypot(...a.map((x,i)=>x-center[i]));
   if(!center.every(finite)||!finite(radius)||radius<=0)fail();holes.push(Object.freeze({faceId:id,role,center:Object.freeze(center),radius}));
  }
  if(holes.length!==shape.holes)fail();
  bodies.push(Object.freeze({bodyId,representation:geometry.representation,bounds:Object.freeze(bounds.map(v=>Object.freeze(v))),faces:Object.freeze(faces),holes:Object.freeze(holes)}));
 }
 const end=craft.inspectRectangleCreation();if(!end.ready||end.revision!==start.revision||ctx.craftService!==craft||ctx.cadRegistry!==registry||ctx.projectService!==project)throw new DOMException('The document changed during inspection.','AbortError');
 return Object.freeze({revision:end.revision,unit:'millimeter',scope:'published-worker-plates',bodies:Object.freeze(bodies),omittedBodies:omitted});
}
