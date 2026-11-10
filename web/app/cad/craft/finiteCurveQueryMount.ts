import {createCatalogFiniteCurveSupportMount} from 'engine/mount/catalogMount';

// Private source-query owner. The caller must independently establish current
// source and certify the returned candidates; this helper supplies neither.
// A mount is created for one query and closed even if readiness or execution
// rejects. Cleanup failure takes precedence because settlement is then unknown.
export async function readOwnedFiniteCurveSupport(engine:string,revision:string,curves:any,signal:AbortSignal,valid:()=>boolean){
 const current=()=>{if(signal.aborted||valid()!==true)throw new DOMException('Finite curve query was superseded.','AbortError');};
 current();
 const mount=createCatalogFiniteCurveSupportMount(engine,revision);
 let failure:any=null,result:any;
 try{
  current();await mount.ready;current();
  result=await mount.readFiniteCurveSupportIntersections(Object.freeze({op:'sketch.curves.support-intersections.read',version:1,unit:'millimeter',curves}),{signal});
  current();
 }catch(error){failure=error;}
 try{mount.close();}catch(error){throw Object.assign(Error('Finite curve query Worker cleanup failed.'),{code:'CURVE_QUERY_CLEANUP_FAILED',cause:error});}
 if(failure)throw failure;
 current();return result;
}
