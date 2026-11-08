import {sketchMutationEpoch} from '../sketchMutationEpoch.mjs';
// Ephemeral derived membership only. No role, value, classification or native
// authority is cached. Global epoch conservatively invalidates other viewers.
const rulerIndexes=new WeakMap(),constraintIndexes=new WeakMap();
const MAX_RULERS=10000,MAX_CONSTRAINTS=100000;
export const sameLengthPair=(d,s)=>(d.a===s.a&&d.b===s.b)||(d.a===s.b&&d.b===s.a);
function localSegment(viewer,pair){
 const s=pair.a?.parent;
 if(!s||s!==pair.b?.parent||s.TYPE!=='Segment'||!sameLengthPair(pair,s))return{segment:null,unresolved:false};
 // Segment constructs its own endpoints; a coincident point on a different
 // Segment has a different parent. No coordinate/ID matching or scene search.
 const stage=s.stage;
 if(s.parent||!s.children.has(s.a)||!s.children.has(s.b)||s.a.parent!==s||s.b.parent!==s||!stage||stage.viewer!==viewer||!stage.objects.has(s))return{segment:null,unresolved:true};
 return{segment:s,unresolved:false};
}
function rulers(viewer){
 const layer=viewer?.dimLayer,objects=layer?.objects,epoch=sketchMutationEpoch();
 if(!Array.isArray(objects)||objects.length>MAX_RULERS)return null;
 let index=rulerIndexes.get(viewer);
 if(index&&index.epoch===epoch&&index.layer===layer&&index.objects===objects&&index.length===objects.length)return index;
 const members=new Set(),bySegment=new WeakMap();
 for(const d of objects){
  if(d.TYPE!=='LinearDimension'||d.isAnnotation)continue;
  if(d.layer!==layer||!d.stage||d.stage.viewer!==viewer||!d.stage.objects.has(d))continue;
  members.add(d);const local=localSegment(viewer,d);if(!local.segment)continue;
  const s=local.segment;bySegment.set(s,bySegment.has(s)?null:d);
 }
 index={epoch,layer,objects,length:objects.length,members,bySegment};rulerIndexes.set(viewer,index);return index;
}
function membership(system){
 const rows=system?.allConstraints,epoch=sketchMutationEpoch();
 if(!Array.isArray(rows)||rows.length>MAX_CONSTRAINTS)return null;
 let index=constraintIndexes.get(system);
 if(!index||index.epoch!==epoch||index.rows!==rows||index.length!==rows.length){index={epoch,rows,length:rows.length,members:new Set(rows)};constraintIndexes.set(system,index);}
 return index.members;
}
function derived(viewer,dimension,index){
 if(!index?.members.has(dimension))return{role:'unresolved',driver:null};
 const local=localSegment(viewer,dimension);if(local.unresolved)return{role:'unresolved',driver:null};
 const s=local.segment;if(!s)return{role:'reference',driver:null};
 if(index.bySegment.get(s)!==dimension)return{role:'unresolved',driver:null};
 const stage=s.stage,system=stage.solverSystem,members=membership(system);
 if(!members||s.constraints.size>MAX_CONSTRAINTS)return{role:'unresolved',driver:null};
 let driver=null;
 // These links are maintained on add/remove and transaction rollback by the
 // real AlgNumSystem. The epoch index authenticates actual system membership.
 for(const c of s.constraints){
  if(c.internal||c.schema.id!=='SegmentLength'||c.objects.length!==1||c.objects[0]!==s)continue;
  if(driver||c.stage!==stage||!members.has(c))return{role:'unresolved',driver:null};driver=c;
 }
 if(!driver)return{role:'reference',driver:null};
 return system.isConflicting(driver)?{role:'unresolved',driver:null}:{role:'driving',driver};
}
export function lengthMeasurementRole(viewer,dimension){
 if(!viewer?.parametricManager||dimension.TYPE!=='LinearDimension'||dimension.isAnnotation)return null;
 return derived(viewer,dimension,rulers(viewer)).role;
}
export function hasLengthMeasurementRuler(viewer,annotation){
 if(!viewer?.parametricManager)return false;
 const local=localSegment(viewer,annotation),index=rulers(viewer);if(!local.segment||!index)return false;
 const d=index.bySegment.get(local.segment);if(!d)return false;
 const current=derived(viewer,d,index);
 return current.role==='driving'&&annotation.constraint===current.driver&&current.driver.annotations.includes(annotation);
}
