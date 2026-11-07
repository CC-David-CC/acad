if(new URL(self.location.href).searchParams.has('preload'))importScripts('/lib/verb.js');
const {readPortablePrism}=require('../../modules/brep/io/readPortablePrism.ts');
const NurbsSurface=require('../../modules/geom/surfaces/nurbsSurface.ts').default;
const {surfaceClosestParam}=require('../../modules/geom/impl/nurbs-ext.ts');
const knots=[0,0,1,1],points=[[[0,0,0],[0,1,0]],[[1,0,0],[1,1,0]]],weights=[[1,1],[1,1]];
self.onmessage=e=>{try{const {op,descriptor}=e.data;if(typeof window!=='undefined'||typeof document!=='undefined')throw Error('Unexpected DOM');
 if(op==='read'){const shell=readPortablePrism(descriptor,{engine:'occ-brep-worker-owned',mountId:'fixture',generation:1});self.postMessage({ok:true,verb:typeof verb,faces:shell.faces.length,edges:[...shell.edges].length,vertices:[...shell.vertices].length});return;}
 if(op==='missing'){let closestError;try{surfaceClosestParam({},[0,0,0])}catch(error){closestError=String(error)}try{NurbsSurface.create(1,1,knots,knots,points,weights);self.postMessage({ok:false,error:'missing runtime accepted'})}catch(error){self.postMessage({ok:true,error:String(error),closestError,verb:typeof verb})}return;}
 if(op==='load'){const preloaded=typeof verb!=='undefined';if(!preloaded)importScripts('/lib/verb.js');const original=verb.eval.Tess.rationalSurfaceAdaptive;const surface=NurbsSurface.create(1,1,knots,knots,points,weights),wrapped=verb.eval.Tess.rationalSurfaceAdaptive;NurbsSurface.create(1,1,knots,knots,points,weights);const once=wrapped===verb.eval.Tess.rationalSurfaceAdaptive,uv=surfaceClosestParam(surface.data,[0.5,0.5,1]);const a=wrapped(surface.data,{maxDepth:2}),b=wrapped(surface.data,{maxDepth:2});self.postMessage({ok:true,preloaded,wrapped:original!==wrapped,once,uv,cacheSame:a===b,points:a.points.length});return;}
 throw Error('unknown test operation');}catch(error){self.postMessage({ok:false,error:String(error)});}};
