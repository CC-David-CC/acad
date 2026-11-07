// Test-only nonvisual component entry. Real model/registry/owner and Worker
// clients; controlled project/storage context, not public Craft/history/Files.
import {state} from 'lstream';
import {MOpenFaceShell} from 'cad/model/mopenFace';
import {MWorkerSolid} from 'cad/model/mworkerSolid';
import {PlaneSurfacePrototype} from 'cad/model/surfacePrototype';
import {Plane} from 'geom/impl/plane';
import {activate as activateRegistry} from 'cad/craft/cadRegistryBundle';
import {ReadSketch} from 'cad/sketch/sketchReader';
import {sketchBoundaryFrame} from 'cad/sketch/boundaryValidity';
import {createEvaluationResourcePool} from 'cad/craft/evaluationResources.mjs';
import {createWorkerSelectedProfileOperation} from '../../modules/workbenches/modeler/features/workerSelectedProfile/workerSelectedProfile.operation';
import {createCatalogMount} from 'engine/mount/catalogMount';
import {validateEngineMount,OCC_SELECTED_PROFILE_BUILD} from 'engine/mount/engineCatalog.mjs';

export function fixture(objects:any[],constraints:any[]=[],options:any={}){
 const plane=new MOpenFaceShell(new PlaneSurfacePrototype(Plane.XY)),face=plane.face,frame=sketchBoundaryFrame(face),empty={lines:[],arcs:[],circles:[],nurbses:[]};
 const native={version:3,objects,dimensions:[],labels:[],stages:[{constraints,generators:[]}],constants:options.constants||'',metadata:{boundaryFrame:frame,...options.metadata},boundary:empty};
 let source=JSON.stringify(native),version=1,active=true;const original=source,namespace='component-sketch/',key=namespace+face.id,controller=new AbortController();
 const pool=createEvaluationResourcePool(),owner=pool.begin({signal:controller.signal,valid:()=>active}),models=state([]),sketchStorage={getSketchData:(id:string)=>id===face.id?source:null,readSketch:(id:string)=>id===face.id?ReadSketch(JSON.parse(source),id,true):null};
 const storage={revision:1,getAllKeysFromNamespace:(ns:string)=>ns===namespace?[key]:[],versionOf:(k:string)=>k===key?version:null},ctx:any={services:{},streams:{craft:{models}},sketchStorageService:sketchStorage};
 activateRegistry(ctx);ctx.cadRegistry=ctx.cadRegistry.createEvaluationRegistry(sketchStorage);ctx.cadRegistry.setModels([plane]);
 ctx.engineEvaluation=owner;ctx.projectService={documentGeneration:1,hasHostLifetime:true,sketchStorageNamespace:namespace,isDocumentCurrent:(g:number)=>active&&!controller.signal.aborted&&g===1};ctx.storageService=storage;ctx.craftService={evaluationEpoch:1,modifications$:state({history:[{type:'PLANE',params:{featureId:1,orientation:'XY',depth:0}}],pointer:0})};ctx.expressionService={isTyped:false,script$:state(''),table$:state({}),list$:state([]),errors$:state([])};ctx.projectManager={unit:'millimeter'};
 const mounts:any[]=[],factoryCalls:any[]=[],operation=createWorkerSelectedProfileOperation((engine,revision)=>{factoryCalls.push({engine,revision});const mount=createCatalogMount(engine,revision);mounts.push(mount);return mount;},validateEngineMount);
 let featureId=2;
 const args=(regionIndex=0,depth=5)=>({version:1,unit:'millimeter',engine:'occ',engineRevision:OCC_SELECTED_PROFILE_BUILD.revision,featureId:featureId++,faceId:face.id,regionId:face.sketchRegions[regionIndex]?.id,depth,bodyPolicy:'separate'});
 const run=async(raw=args())=>{const result=await operation.run(raw,ctx,raw);if(result.created.length!==1||!(result.created[0] instanceof MWorkerSolid)||result.consumed.length)throw Error('Unexpected actual model output');ctx.cadRegistry.setModels([...ctx.cadRegistry.models,...result.created]);owner.requireCurrent();return result;};
 return{ctx,owner,pool,plane,face,mounts,factoryCalls,operation,args,run,original,get source(){return source;},changeSource(){source=source+' ';version++;},deactivate(){active=false;},close(){controller.abort();owner.close();},revision:OCC_SELECTED_PROFILE_BUILD.revision};
}
export const rectangle=(id:string,x=0,w=10,h=10)=>{const p=[[x,0],[x+w,0],[x+w,h],[x,h]];return p.map((a,i)=>({id:id+i,type:'Segment',role:null,stage:0,data:{a:{x:a[0],y:a[1]},b:{x:p[(i+1)%4][0],y:p[(i+1)%4][1]}}}));};
export const circle=(id:string,r:number)=>({id,type:'Circle',role:null,stage:0,data:{c:{x:0,y:0},r}});
