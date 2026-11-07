// Pure bounded derived layout, not native ownership/material/ancestry proof.
import {captureOwnedLinearHolePatternIntent,linearHolePatternNativeCost} from '../solid/ownedLinearHolePatternIntent.mjs';
import {captureOwnedHoleIntent} from '../solid/ownedHoleIntent.mjs';
import {planOwnedThroughHoles} from './ownedThroughHolePlan.mjs';
import {capturePolygonProfileRequest} from './selectedProfilePlan.mjs';
import {preparePolygonProfileExtrusion,polygonProfileRelation} from './polygonProfilePlan.mjs';
const fail=(code,message)=>{throw Object.assign(Error(message),{code});};
const freeze=v=>{if(v&&typeof v==='object'){for(const x of Object.values(v))freeze(x);Object.freeze(v);}return v;};
export function planOwnedLinearHolePattern(input){
 const keys=['request','seed','existingHoles','sourceProfile','targetMetrics'];
 if(!input||typeof input!=='object'||Array.isArray(input)||Reflect.ownKeys(input).length!==keys.length)fail('INVALID_REQUEST','Expected exact linear-hole pattern preparation.');
 const a={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(input,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('INVALID_REQUEST','Pattern preparation must be own data.');a[key]=d.value;}
 const request=captureOwnedLinearHolePatternIntent(a.request),cost=linearHolePatternNativeCost(request.count),seed=captureOwnedHoleIntent(a.seed);
 if(seed.kind!=='centered-through')fail('UNSUPPORTED_SEED','Select a successful centered-through seed.');
 if(request.seedFeatureId!==seed.featureId||request.engineRevision!==seed.engineRevision||request.featureId===seed.sourceFeatureId)fail('STALE_SOURCE','Pattern seed/source runtime identity differs.');
 if(!Array.isArray(a.existingHoles)||a.existingHoles.length<1||a.existingHoles.length>16||Reflect.ownKeys(a.existingHoles).length!==a.existingHoles.length+1)fail('INVALID_REQUEST','Expected bounded genuine hole observations.');
 const holes=[],ids=new Set();for(let i=0;i<a.existingHoles.length;i++){
  const d=Object.getOwnPropertyDescriptor(a.existingHoles,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('INVALID_REQUEST','Hole observations must be dense data.');
  const hole=captureOwnedHoleIntent(d.value);
  if(hole.featureId===request.featureId)fail('INVALID_REQUEST','A pattern cannot reuse a successful hole feature identity');
  if(ids.has(hole.featureId)||['engineRevision','sourceFeatureId','sourceFaceId','sourceRegionId'].some(k=>hole[k]!==seed[k]))fail('STALE_SOURCE','Known holes must share one genuine current source.');
  ids.add(hole.featureId);holes.push(hole);
 }
 const matches=holes.filter(h=>h.featureId===seed.featureId);if(matches.length!==1||JSON.stringify(matches[0])!==JSON.stringify(seed))fail('STALE_SOURCE','The current seed differs from successful hole observations.');
 const sourceProfile=capturePolygonProfileRequest(a.sourceProfile);
 const metricKeys=['version','valid','solidCount','nativeVolume','nativeBounds'],targetMetrics={};
 if(!a.targetMetrics||typeof a.targetMetrics!=='object'||Array.isArray(a.targetMetrics)||Reflect.ownKeys(a.targetMetrics).length!==5)fail('INVALID_REQUEST','Expected exact native target measurements.');
 for(const k of metricKeys){const d=Object.getOwnPropertyDescriptor(a.targetMetrics,k);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('INVALID_REQUEST','Measurements must be own data.');targetMetrics[k]=d.value;}
 const bounds=targetMetrics.nativeBounds;if(bounds&&typeof bounds==='object'&&!Array.isArray(bounds)&&Reflect.ownKeys(bounds).length===2){const copy={};for(const k of ['min','max']){const d=Object.getOwnPropertyDescriptor(bounds,k),v=d?.value;if(!d?.enumerable||!Object.hasOwn(d,'value')||!Array.isArray(v)||v.length!==3||Reflect.ownKeys(v).length!==4)fail('INVALID_REQUEST','Bounds must be dense own data.');copy[k]=[0,1,2].map(i=>{const n=Object.getOwnPropertyDescriptor(v,String(i));if(!n?.enumerable||!Object.hasOwn(n,'value'))fail('INVALID_REQUEST','Bounds must be own coordinates.');return n.value;});}targetMetrics.nativeBounds=copy;}else if(bounds!==null)fail('INVALID_REQUEST','Expected exact native bounds.');
 const oldPlans=holes.map(h=>planOwnedThroughHoles({request:h,sourceProfile,targetMetrics})),seedPlan=oldPlans[holes.findIndex(h=>h.featureId===seed.featureId)],source=preparePolygonProfileExtrusion(sourceProfile),outer=source.loops[0],center=seedPlan.centersLocal[0],radius=seedPlan.radius;
 const existing=oldPlans.flatMap(p=>p.centersLocal.map(center=>({kind:'circle',center,radius:p.radius,area:Math.PI*p.radius*p.radius}))),centersLocal=Array.from({length:request.count},(_,i)=>[center[0]+i*request.spacing,center[1]]),circles=centersLocal.slice(1).map(center=>({kind:'circle',center,radius,area:Math.PI*radius*radius}));
 if(centersLocal.some(p=>p.some(n=>!Number.isFinite(n))))fail('PATTERN_DOMAIN','Pattern coordinates exceed numeric domain.');
 if(circles.some(c=>polygonProfileRelation(outer,c)!=='contains'))fail('PATTERN_OUTSIDE_PROFILE','Every copy must strictly clear the source rectangle.');
 for(let i=0;i<existing.length;i++)for(let j=i+1;j<existing.length;j++)if(polygonProfileRelation(existing[i],existing[j])!=='separate')fail('PATTERN_OVERLAP','Known holes do not remain strictly separate.');
 for(let i=0;i<circles.length;i++){
  if(existing.some(c=>polygonProfileRelation(circles[i],c)!=='separate'))fail('PATTERN_OVERLAP','A copy overlaps or touches an existing hole.');
  for(let j=i+1;j<circles.length;j++)if(polygonProfileRelation(circles[i],circles[j])!=='separate')fail('PATTERN_OVERLAP','Pattern copies overlap or touch.');
 }
 const toolProfiles=circles.map((circle,i)=>{
  const tool=structuredClone(seedPlan.toolProfiles[0]),label='derived-linear-hole-pattern:'+request.featureId+':'+(i+1);tool.region={id:label,outer:[{kind:'circle',id:label+':circle',center:circle.center.slice(),radius}],holes:[]};
  try{preparePolygonProfileExtrusion(tool);}catch{fail('PATTERN_DOMAIN','A derived pattern tool exceeds the qualified construction domain.');}
  const f=tool.frame,z=source.request.frame.z,o=source.request.frame.origin,p=f.origin.map((n,j)=>n+f.x[j]*circle.center[0]+f.y[j]*circle.center[1]),q=p.map((n,j)=>n+f.z[j]*tool.depth),project=p=>p.reduce((sum,n,j)=>sum+(n-o[j])*z[j],0),lo=project(p),hi=project(q);
  if(![...p,...q,lo,hi].every(Number.isFinite)||!(lo<seedPlan.axialSpan.min&&hi>seedPlan.axialSpan.max))fail('PATTERN_DOMAIN','A copied tool does not cross the entire measured target.');return tool;
 });
 const expectedRemovedVolume=circles.length*Math.PI*radius*radius*source.request.depth;if(!Number.isFinite(expectedRemovedVolume)||expectedRemovedVolume<=0)fail('PATTERN_DOMAIN','Pattern removal exceeds numeric domain.');
 return freeze({version:1,scope:'source-local-centered-hole-linear-pattern',seedFeatureId:seed.featureId,sourceRegionId:seed.sourceRegionId,centersLocal,radius,toolProfiles,expectedRemovedVolume,axialSpan:{...seedPlan.axialSpan},nativeResultCost:cost});
}
