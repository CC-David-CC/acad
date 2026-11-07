// Bounded drilled-solid derived-model guard. No engine call, serializer, or UI
// cache mutation. The validated Worker source remains authoritative.
const fail=()=>{throw Object.assign(new Error('Candidate drilled projection changed or is invalid.'),{code:'INVALID_CANDIDATE_PROJECTION'});};
const vectorKeys=['x','y','z'],matrixKeys=['mxx','mxy','mxz','tx','myx','myy','myz','ty','mzx','mzy','mzz','tz','apply','applyNoTranslation'];
export function captureCandidateFourCornerProjection(model){
 const checks=[],snapshots=[],maps=[],curveCaches=[],faceCaches=[];let visits=0;
 function prop(object,key){if(!object||typeof object!=='object'||++visits>50000)fail();const value=object[key];checks.push([object,key,value]);return value;}
 function sequence(array,length){if(!Array.isArray(array)||array.length!==length||Reflect.ownKeys(array).length!==length+1)fail();prop(array,'length');for(let i=0;i<length;i++){if(!Object.hasOwn(array,i))fail();prop(array,String(i));}return array;}
 function tree(value,depth=0,seen=new Set()){
  if(++visits>50000||depth>18)fail();if(value===null||value===undefined||typeof value==='boolean')return;
  if(typeof value==='number'){if(!Number.isFinite(value))fail();return;}if(typeof value==='string'){if(value.length>8192)fail();return;}
  if(typeof value==='function')return;if(typeof value!=='object'||seen.has(value))fail();seen.add(value);
  if(Array.isArray(value)){if(value.length>192)fail();sequence(value,value.length);for(const entry of value)tree(entry,depth+1,seen);}
  else {const keys=Reflect.ownKeys(value);if(keys.length>32||keys.some(k=>typeof k!=='string'||k==='__proto__'))fail();snapshots.push({object:value,keys});for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail();tree(prop(value,key),depth+1,seen);}}
  seen.delete(value);
 }
 function selected(object,keys){for(const key of keys)prop(object,key);}
 function vec(object){selected(object,vectorKeys);for(const k of vectorKeys)if(!Number.isFinite(object[k]))fail();}
 function ownGeometry(object,allowCurveCache=false){
  const all=Reflect.ownKeys(object);if(all.length>32||all.some(k=>typeof k!=='string'))fail();
  const keys=allowCurveCache?all.filter(k=>!k.startsWith('__cache__:tess:')):all;
  snapshots.push({object,keys,allowCurveCache});for(const key of keys){const d=Object.getOwnPropertyDescriptor(object,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail();const v=prop(object,key);if(typeof v!=='function')tree(v);}
  if(allowCurveCache)curveCaches.push({object,start:numeric(object.eval(0)[0]),end:numeric(object.eval(1)[0])});
 }
 function expectedFaceFrame(model,plane){
  const v=o=>[o.x,o.y,o.z],n=v(plane.normal),origin=v(model.csys.origin),ay=v(model.csys.y),az=v(model.csys.z);
  const dot=(a,b)=>a.reduce((t,x,i)=>t+x*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const align=cross(n,Math.abs(dot(n,ay))<.5?ay:az),y=cross(align,n),x=cross(y,n),shift=dot(n,origin)-plane.w;
  return {origin:origin.map((a,i)=>a-n[i]*shift),x,y,z:n};
 }
 function expectedCylinderFrame(surface){
  const impl=surface.impl,u=surface.uMin,v=surface.vMin,origin=impl.point(u,v),normal=impl.normal(u,v),derivative=impl.eval(u,v)[1];
  const length=Math.hypot(...derivative);if(!Number.isFinite(length)||length<=1e-12)fail();const x=derivative.map(a=>a/length),z=normal.map(a=>surface.inverted?-a:a),y=[z[1]*x[2]-z[2]*x[1],z[2]*x[0]-z[0]*x[2],z[0]*x[1]-z[1]*x[0]];return {origin,x,y,z};
 }
 function checkFaceCache(face,expected){
  const c=face._csys;if(!c){if(face._basis||face._sketchToWorldTransformation||face._worldToSketchTransformation)fail();return;}
  for(const k of ['origin','x','y','z']){const v=c[k];if(!v||vectorKeys.some((axis,i)=>!Number.isFinite(v[axis])||Math.abs(v[axis]-expected[k][i])>1e-12))fail();}
  const dot=(a,b)=>a.reduce((t,x,i)=>t+x*b[i],0),o=expected.origin,x=expected.x,y=expected.y,z=expected.z;
  if(!Number.isFinite(face.w)||Math.abs(face.w-dot(z,o))>1e-12)fail();
  if(face._basis&&(!Array.isArray(face._basis)||face._basis.length!==3||face._basis[0]!==c.x||face._basis[1]!==c.y||face._basis[2]!==c.z))fail();
  function matrix(actual,expectedValues){if(!actual)return;for(let i=0;i<12;i++)if(!Number.isFinite(actual[matrixKeys[i]])||Math.abs(actual[matrixKeys[i]]-expectedValues[i])>1e-12)fail();}
  matrix(face._sketchToWorldTransformation,[x[0],y[0],z[0],o[0],x[1],y[1],z[1],o[1],x[2],y[2],z[2],o[2]]);
  matrix(face._worldToSketchTransformation,[x[0],x[1],x[2],-dot(x,o),y[0],y[1],y[2],-dot(y,o),z[0],z[1],z[2],-dot(z,o)]);
 }
 function numeric(value){if(!Array.isArray(value)||value.length>8||Reflect.ownKeys(value).length!==value.length+1)fail();return Array.from({length:value.length},(_,i)=>{const d=Object.getOwnPropertyDescriptor(value,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value'))fail();const x=d.value;return Array.isArray(x)?numeric(x):Number.isFinite(x)?x:fail();});}
 function sample(fn){const value=numeric(fn());return ()=>{const current=numeric(fn());return equalNumeric(value,current);};}
 function equalNumeric(a,b){return a.length===b.length&&a.every((x,i)=>Array.isArray(x)?Array.isArray(b[i])&&equalNumeric(x,b[i]):Object.is(x,b[i]));}
 if(!model||!model.ext?.workerGeometry||model.ext.workerGeometry.representation!=='worker-owned-occ-four-corner')fail();
 selected(model,['id','TYPE','ext','csys','location$','brepShell','brepRegistry','faces','edges','vertices']);
 const tag=prop(model.ext,'workerGeometry');tree(tag);
 const csys=model.csys;selected(csys,['origin','x','y','z']);for(const k of ['origin','x','y','z'])vec(csys[k]);
 const location=prop(model.location$,'value');selected(location,matrixKeys);for(const key of matrixKeys.slice(0,12))if(!Number.isFinite(location[key]))fail();
 const shell=model.brepShell,registry=model.brepRegistry;if(!(registry instanceof Map)||registry.size!==56)fail();
 const faces=sequence(model.faces,11),edges=sequence(model.edges,27),vertices=sequence(model.vertices,18);
 selected(shell,['faces','data']);sequence(shell.faces,11);tree(shell.data);
 const samples=[];
 for(let i=0;i<faces.length;i++){
  const f=faces[i];selected(f,['id','TYPE','shell','surface','brepFace']);if(f.shell!==model||f.brepFace!==shell.faces[i]||f.surface!==f.brepFace.surface||registry.get(f.brepFace)!==f)fail();
  const b=f.brepFace;selected(b,['data','surface','shell','outerLoop','innerLoops']);if(b.shell!==shell)fail();tree(b.data);if(!Array.isArray(b.innerLoops)||b.innerLoops.length>5)fail();sequence(b.innerLoops,b.innerLoops.length);
  const surf=b.surface;selected(surf,['impl','inverted','_simpleSurface','uMin','uMax','vMin','vMax','uMid','vMid']);const plane=surf._simpleSurface;if(plane){selected(plane,['normal','w']);vec(plane.normal);faceCaches.push({face:f,expected:expectedFaceFrame(model,plane)});}else if(surf.impl?.analyticKind==='cylinder'){faceCaches.push({face:f,expected:expectedCylinderFrame(surf)});}else fail();checkFaceCache(f,faceCaches[faceCaches.length-1].expected);ownGeometry(surf.impl);
  const impl=surf.impl;if(typeof impl.eval!=='function'||typeof impl.normal!=='function')fail();samples.push(sample(()=>impl.eval(0,0)),sample(()=>impl.normal(0,0)));
  for(const loop of [b.outerLoop,...b.innerLoops]){selected(loop,['data','face','halfEdges']);if(loop.face!==b||!Array.isArray(loop.halfEdges)||loop.halfEdges.length<1||loop.halfEdges.length>4)fail();tree(loop.data);sequence(loop.halfEdges,loop.halfEdges.length);for(const he of loop.halfEdges){selected(he,['data','edge','inverted','vertexA','vertexB','loop','next','prev']);tree(he.data);if(he.loop!==loop)fail();}}
 }
 for(const e of edges){selected(e,['id','TYPE','ext','shell','brepEdge']);tree(e.ext);if(e.shell!==model||registry.get(e.brepEdge)!==e)fail();const b=e.brepEdge;selected(b,['data','curve','halfEdge1','halfEdge2']);tree(b.data);for(const h of [b.halfEdge1,b.halfEdge2])if(h.edge!==b)fail();const curve=b.curve;selected(curve,['impl','uMin','uMax','uMid','tessellate']);ownGeometry(curve.impl,true);if(typeof curve.impl.eval!=='function')fail();samples.push(sample(()=>curve.impl.eval(0)),sample(()=>curve.impl.eval(1)));}
 for(const v of vertices){selected(v,['id','TYPE','ext','shell','brepVertex']);tree(v.ext);if(v.shell!==model||registry.get(v.brepVertex)!==v)fail();const b=v.brepVertex;selected(b,['data','point']);tree(b.data);vec(b.point);}
 maps.push({map:registry,size:registry.size,entries:[...registry]});
 return ()=>{
  try{
   for(const [object,key,value] of checks)if(!Object.is(object[key],value))fail();
   for(const {object,keys,allowCurveCache} of snapshots){const all=Reflect.ownKeys(object);if(all.length>32||all.some(k=>typeof k!=='string'))fail();const now=allowCurveCache?all.filter(k=>!k.startsWith('__cache__:tess:')):all;if(now.length!==keys.length||now.some((key,i)=>key!==keys[i]))fail();}
   for(const {object,start,end} of curveCaches){for(const key of Reflect.ownKeys(object).filter(k=>typeof k==='string'&&k.startsWith('__cache__:tess:'))){const d=Object.getOwnPropertyDescriptor(object,key);if(key.length>256||!d?.enumerable||!Object.hasOwn(d,'value'))fail();const points=numeric(d.value);if(points.length!==2||!equalNumeric(points[0],start)||!equalNumeric(points[1],end))fail();}}
   for(const {map,size,entries} of maps){if(map.size!==size)fail();for(const [key,value] of entries)if(map.get(key)!==value)fail();}
   for(const {face,expected} of faceCaches)checkFaceCache(face,expected);
   for(const run of samples)if(!run())fail();
  }catch(error){if(error?.code==='INVALID_CANDIDATE_PROJECTION')throw error;fail();}
 };
}
