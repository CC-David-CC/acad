import {sketchBoundaryFrame} from 'cad/sketch/boundaryValidity';
import {SketchGeom} from 'cad/sketch/sketchReader';import {Segment,Circle} from 'cad/sketch/sketchModel';import sketchObjectGlobalId from 'cad/sketch/sketchObjectGlobalId';
import {MOpenFaceShell} from 'cad/model/mopenFace';import {PlaneSurfacePrototype} from 'cad/model/surfacePrototype';import {Plane} from 'geom/impl/plane';import CSys from 'math/csys';import Vector from 'math/vector';
import {Types} from 'cad/craft/schema/types';import planeOperation from '../plane/simplePlaneOperation';
import {sourcePlaneShellId} from 'cad/craft/sourcePlaneIdentity.mjs';
import {SOURCE_PROJECTION_TYPE,captureSourceProjection,projectionFail as fail} from 'engine/source/sourceProjectionIntent.mjs';
const records=new WeakMap<object,any>();
export function readProjectedSourceRecord(ctx:any,face:any){
 const record=records.get(face);if(!record)return null;const history=ctx.craftService.modifications$.value.history,entry=history[face.root.originatingOperation];
 if(ctx.cadRegistry.findFace(face.id)!==face||ctx.operationService.get(SOURCE_PROJECTION_TYPE)!==record.projectionDescriptor||!isRegisteredSourceProjection(record.projectionDescriptor)||entry?.type!==SOURCE_PROJECTION_TYPE||JSON.stringify(captureSourceProjection(entry.params))!==record.parameterText||ctx.sketchStorageService.getSketchData(face.id)!==record.reply.serializedSketch||ctx.cadRegistry.findFace(record.parentFace.id)!==record.parentFace||ctx.sketchStorageService.getSketchData(record.parentFace.id)!==record.parentSourceJSON||JSON.stringify(sketchBoundaryFrame(record.parentFace))!==record.parentFrame||ctx.operationService.get(record.parentType)!==record.parentDescriptor||history[record.parentFace.root.originatingOperation]?.type!==record.parentType||JSON.stringify(history[record.parentFace.root.originatingOperation]?.params)!==record.parentParameters)fail('PROJECTION_CACHE_MISMATCH','The current projected source display binding is stale.');
 const expressions=ctx.expressionService;if(expressions.isTyped!==record.typed||expressions.errors$.value.length||record.typed&&!expressions.hasCurrentPhysicalResult())fail('PROJECTION_CACHE_MISMATCH','Projection parameter custody is stale.');
 const keys=Object.keys(record.bindings);if(!record.typed&&Object.keys(expressions.table$.value).length!==keys.length||keys.some(key=>!Object.is(record.bindings[key],record.typed?expressions.resolveQuantity(key,'length'):expressions.table$.value[key])))fail('PROJECTION_CACHE_MISMATCH','Projection parameter values changed outside accepted replay.');return record;
}
export function assertProjectionSourceReadonly(ctx:any,face:any){const entry=ctx.craftService.modifications$.value.history[face?.root?.originatingOperation];if(entry?.type===SOURCE_PROJECTION_TYPE)fail('PROJECTION_REFERENCE_READONLY','Projected references are readonly; edit their original source or explicitly repair the association.');}
export const sourceProjectionRun=async(params:any,ctx:any,raw:any)=>{
 const p=captureSourceProjection(raw),owner=ctx.engineEvaluation;
 if(params.featureId!==p.featureId||!owner||ctx.cadRegistry?.isEvaluating!==true||typeof ctx.prepareProjectedSource!=='function')fail('INVALID_WORKSPACE','Source projection requires its genuine candidate-private evaluator.');
 owner.requireCurrent();const prepared=await ctx.prepareProjectedSource(raw,sourceProjectionRun);owner.requireCurrent();
 if(!prepared)fail('PROJECTION_SOURCE_UNAVAILABLE','The current registered source producer did not prepare its source.');
 const csys=new CSys(new Vector(0,0,0),new Vector(1,0,0),new Vector(0,1,0),new Vector(0,0,1)),plane=new Plane(csys.z as any,0);
 const model=new MOpenFaceShell(new PlaneSurfacePrototype(plane),csys,sourcePlaneShellId(raw,p.featureId)),sketch=new SketchGeom(),boundary:any={lines:[],arcs:[],circles:[],nurbses:[]};
 for(const row of prepared.reply.roots){const id=sketchObjectGlobalId(model.face.id,row.referenceId),g=row.geometry;if(row.kind==='Segment'){sketch.constructionSegments.push(new Segment(id,new Vector(g.a.x,g.a.y,0),new Vector(g.b.x,g.b.y,0)));boundary.lines.push(Object.freeze({id:row.referenceId,a:g.a,b:g.b}));}else{sketch.constructionSegments.push(new Circle(id,new Vector(g.c.x,g.c.y,0),g.r));boundary.circles.push(Object.freeze({id:row.referenceId,c:g.c,r:g.r}));}}
 for(const key of Object.keys(boundary))Object.freeze(boundary[key]);prepared.installDisplay(sketch);const {installDisplay,...record}=prepared;records.set(model.face,Object.freeze({...record,sketch,boundary:Object.freeze(boundary)}));
 return{consumed:[],created:[model]};
};
const projectionOperation={id:SOURCE_PROJECTION_TYPE,label:'Source projection',info:'Associative earlier sketch references projected to world XY.',icon:planeOperation.icon,form:[],schema:{featureId:{type:Types.number}},admitGeometry:()=>{},paramsInfo:()=>'(associative XY reference)',run:sourceProjectionRun};
// OperationService adds schema/form metadata by cloning the descriptor. Pin the
// actual registered object across awaits, and authenticate its compiled methods.
export function isRegisteredSourceProjection(operation:any){return !!operation&&operation.id===SOURCE_PROJECTION_TYPE&&operation.run===sourceProjectionRun&&operation.admitGeometry===projectionOperation.admitGeometry;}
export default projectionOperation;
