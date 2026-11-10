import {runFiniteCurveSourceExtraction,verifyFiniteCurveSourceExtraction,runFiniteCurveCertificate} from 'sketcher/headless/transitionClient';
import {sameFiniteCurveSourceReceipt} from 'sketcher/headless/finiteCurveSourceEnvelope.mjs';
import {sameSketchSaveFrame} from './unconsumedSketchSave.mjs';
import {readOwnedFiniteCurveSupport} from './finiteCurveQueryMount';
export class CurveQueryPreparationError extends Error{
 readonly code:string;readonly layer:string;readonly cause:unknown;
 constructor(layer:string,code:string,message:string,cause?:unknown){super(message);this.layer=layer;this.code=code;this.cause=cause;}
}

// Internal query preparation on a real captureJob. No public event or editing
// authority is issued here: the owning coordinator must retain and recheck the
// actual job and document lifetime before offering or applying a selection.
export async function prepareFiniteCurveQuery(job:any,workerUrl:string,engine:string,engineRevision:string,curveIds:readonly [string,string],domain:any){
 const valid=()=>{try{job.current();return true;}catch{return false;}};
 const options={signal:job.controller.signal,valid};
 const failure=(result:any,stage:string)=>new CurveQueryPreparationError(stage,result?.error?.code||'CURVE_QUERY_FAILED',result?.error?.message||stage+' failed.',result?.error?.cause);
 await job.start();const inspected=await job.inspect(job.source);job.current();
 const revision=crypto.randomUUID(),request=Object.freeze({revision,sketchJSON:job.source,externalParameters:job.external,intent:Object.freeze({curveIds:Object.freeze([...curveIds])})});
 const source=await runFiniteCurveSourceExtraction(workerUrl,request,options);job.current();
 if(!source.ok)throw failure(source,'source');
 if(!sameSketchSaveFrame(source.frame,inspected.boundaryFrame))throw Object.assign(Error('Curve extraction changed the authored sketch frame.'),{code:'FINITE_CURVE_SOURCE_MISMATCH'});
 const second=await verifyFiniteCurveSourceExtraction(workerUrl,{...request,expected:source},options);job.current();
 if(!second.ok)throw failure(second,'source');
 if(!sameFiniteCurveSourceReceipt(source,second))throw Object.assign(Error('Independent original curve extraction changed.'),{code:'FINITE_CURVE_SOURCE_MISMATCH'});
 const raw=await readOwnedFiniteCurveSupport(engine,engineRevision,source.input.curves,job.controller.signal,valid);job.current();
 const checked=await runFiniteCurveCertificate(workerUrl,{revision,curves:source.input.curves,raw:raw.observation,domain},options);job.current();
 if(!checked.ok)throw failure(checked,'certificate');
 await job.recheckHistory();job.current();
 return Object.freeze({source,raw:raw.observation,certificate:checked.certificate});
}
