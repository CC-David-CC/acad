// TEST/CONTRACT PROTOTYPE ONLY. Not imported by production code.
// Binding is supplied by a future owned evaluator, not accepted public data.
// Structural agreement here is not native ownership/material/ancestry proof.
import {captureOwnedHoleIntent} from '../../modules/engine/solid/ownedHoleIntent.mjs';
import {solidBodyId} from '../../modules/engine/solid/solidIntent.mjs';
import {planOwnedThroughHoles} from '../../modules/engine/mount/ownedThroughHolePlan.mjs';
import {preparePolygonProfileExtrusion,polygonProfileRelation} from '../../modules/engine/mount/polygonProfilePlan.mjs';
const MAX_COUNT=17,MAX_DIMENSION=1e6;
const fail=(code,message)=>{throw Object.assign(Error(message),{code});};
function fields(v,keys){
 if(!v||typeof v!=='object'||Array.isArray(v)||![null,Object.prototype].includes(Object.getPrototypeOf(v))||Reflect.ownKeys(v).length!==keys.length)fail('INVALID_REQUEST','Expected exact draft pattern data.');
 const out={};for(const k of keys){const d=Object.getOwnPropertyDescriptor(v,k);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('INVALID_REQUEST','Expected own pattern data.');out[k]=d.value;}return out;
}
const positive=v=>typeof v==='number'&&Number.isFinite(v)&&v>0&&v<=MAX_DIMENSION;
const identity=v=>Number.isSafeInteger(v)&&v>0;
const frozen=v=>{if(v&&typeof v==='object'){for(const x of Object.values(v))frozen(x);Object.freeze(v);}return v;};
export function captureDraftPatternIntent(input){
 const p=fields(input,['version','unit','engine','engineRevision','featureId','target','producerFeatureId','seedFeatureId','axis','count','spacing']);
 if(p.version!==1||p.unit!=='millimeter'||p.engine!=='occ'||typeof p.engineRevision!=='string'||!/^sha256:[a-f0-9]{64}:[a-f0-9]{64}$/.test(p.engineRevision)||![p.featureId,p.producerFeatureId,p.seedFeatureId].every(identity)||p.featureId===p.producerFeatureId||p.featureId===p.seedFeatureId||p.target!==solidBodyId(p.producerFeatureId)||p.axis!=='source-local-x-positive'||!Number.isSafeInteger(p.count)||p.count<1||p.count>MAX_COUNT||!positive(p.spacing))fail('INVALID_REQUEST','Unsupported bounded linear pattern intent.');
 return Object.freeze(p);
}
export function planDraftLinearHolePattern(input){
 const a=fields(input,['request','seed','sourceProfile','targetMetrics','binding']),request=captureDraftPatternIntent(a.request),seed=captureOwnedHoleIntent(a.seed);
 const b=fields(a.binding,['engineRevision','sourceFeatureId','sourceFaceId','sourceRegionId','seedFeatureId','producerFeatureId','target']);
 if(seed.kind!=='centered-through')fail('UNSUPPORTED_SEED','The first pattern supports one centered-through seed only.');
 if(request.featureId===seed.sourceFeatureId)fail('INVALID_REQUEST','The new pattern must not replace its source feature identity.');
 if(request.engineRevision!==seed.engineRevision||b.engineRevision!==request.engineRevision||b.seedFeatureId!==request.seedFeatureId||seed.featureId!==request.seedFeatureId||b.producerFeatureId!==request.producerFeatureId||b.target!==request.target||b.sourceFeatureId!==seed.sourceFeatureId||b.sourceFaceId!==seed.sourceFaceId||b.sourceRegionId!==seed.sourceRegionId)fail('STALE_BINDING','Owned seed, source and current target bindings must agree.');
 // Product planner supplies qualified rectangle/seed placement and target span.
 // The derived source request is ephemeral, never a second saved sketch.
 const seedPlan=planOwnedThroughHoles({request:seed,sourceProfile:a.sourceProfile,targetMetrics:a.targetMetrics}),source=preparePolygonProfileExtrusion(a.sourceProfile),outer=source.loops[0],center=seedPlan.centersLocal[0],radius=seedPlan.radius;
 const centersLocal=Array.from({length:request.count},(_,i)=>[center[0]+i*request.spacing,center[1]]);
 if(centersLocal.some(p=>p.some(n=>!Number.isFinite(n))))fail('PATTERN_DOMAIN','Pattern coordinates cannot be represented.');
 const circles=centersLocal.map(center=>({kind:'circle',center,radius,area:Math.PI*radius*radius}));
 if(circles.some(c=>polygonProfileRelation(outer,c)!=='contains'))fail('PATTERN_OUTSIDE_PROFILE','Every seed/copy must strictly clear the source boundary.');
 for(let i=0;i<circles.length;i++)for(let j=i+1;j<circles.length;j++)if(polygonProfileRelation(circles[i],circles[j])!=='separate')fail('PATTERN_OVERLAP','Seed and all additional holes must remain strictly separate.');
 const k=request.count-1,toolProfiles=centersLocal.slice(1).map((center,index)=>{
  const tool=structuredClone(seedPlan.toolProfiles[0]),label='derived-linear-hole-pattern:'+request.featureId+':'+(index+1);
  tool.region={id:label,outer:[{kind:'circle',id:label+':circle',center:center.slice(),radius}],holes:[]};
  try{preparePolygonProfileExtrusion(tool);}catch{fail('PATTERN_DOMAIN','A derived circle tool is outside the qualified construction domain.');}
  // The copied local coordinates alter world roundoff; check actual endpoints.
  const f=tool.frame,z=source.request.frame.z,origin=source.request.frame.origin;
  const first=f.origin.map((n,i)=>n+f.x[i]*center[0]+f.y[i]*center[1]),last=first.map((n,i)=>n+f.z[i]*tool.depth),project=p=>p.reduce((sum,n,i)=>sum+(n-origin[i])*z[i],0),lo=project(first),hi=project(last);
  if(![...first,...last,lo,hi].every(Number.isFinite)||!(lo<seedPlan.axialSpan.min&&hi>seedPlan.axialSpan.max))fail('PATTERN_DOMAIN','Copied tool endpoints do not fully cross the measured target.');
  return tool;
 });
 const expectedAdditionalPrismaticRemoval=k*Math.PI*radius*radius*source.request.depth;
 if(!Number.isFinite(expectedAdditionalPrismaticRemoval))fail('PATTERN_DOMAIN','Expected reference removal is outside the numeric domain.');
 return frozen({version:1,scope:'draft-linear-centered-through-pattern-layout-only',seedFeatureId:seed.featureId,sourceRegionId:seed.sourceRegionId,axis:request.axis,count:request.count,spacing:request.spacing,radius,centersLocal,toolProfiles,axialSpan:{...seedPlan.axialSpan},expectedAdditionalPrismaticRemoval,nativeWork:k?{status:'planned',additionalTools:k,unions:k-1,cuts:1,nativeResultCost:2*k}:{status:'requires-owned-identity-result',additionalTools:0,unions:0,cuts:0,nativeResultCost:null}});
}
