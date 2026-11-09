// Worker-only clipping of actual parent analytic trims. No new coefficients,
// saved measurement values, Native handles, source edits or rounded root welds.
import {unpackOrthographicRecord} from './orthographicAnalyticRecord.mjs';
export const DRAWING_DETAIL_LIMITS=Object.freeze({parentFragments:8192,intervals:4096,packedBytes:98304,transferBuffers:1});
const fail=(message,code='DRAWING_DETAIL_UNQUALIFIED')=>{throw Object.assign(Error(message),{code});};
const flat=f=>[...f.origin,...f.u,...f.v,...f.n],dot=(a,b)=>a.reduce((s,n,i)=>s+n*b[i],0),sub=(a,b)=>a.map((n,i)=>n-b[i]);
const error=(...numbers)=>256*Number.EPSILON*Math.max(1,...numbers.map(Math.abs));
const at=(c,t)=>c.kind==='line'?c.origin.map((n,i)=>n+c.direction[i]*t):c.center.map((n,i)=>n+c.a[i]*Math.cos(t)+c.b[i]*Math.sin(t));
function clipCurve(c,low,high){
 let [first,last]=c.range;
 if(c.kind==='line'){
  if(c.direction.every(n=>n===0))return[];
  for(let i=0;i<2;i++){
   const a=c.origin[i],b=c.direction[i];if(b===0){if(a<low[i]||a>high[i])return[];continue;}
   const t=[(low[i]-a)/b,(high[i]-a)/b].sort((a,b)=>a-b);first=Math.max(first,t[0]);last=Math.min(last,t[1]);
  }
  return last>first?[[first,last]]:[];
 }
 if(c.a.every(n=>n===0)&&c.b.every(n=>n===0))return[];
 if(last-first>2*Math.PI)fail('Detail supports one actual conic turn per parent trim');
 const events=[first,last];
 for(let i=0;i<2;i++)for(const limit of [low[i],high[i]]){
  const a=c.a[i],b=c.b[i],radius=Math.hypot(a,b),delta=limit-c.center[i],uncertainty=error(a,b,c.center[i],limit);
  if(uncertainty>1e-7)fail('Detail boundary arithmetic is outside its coordinate budget');
  if(radius===0){if(c.center[i]<low[i]||c.center[i]>high[i])return[];continue;}
  if(Math.abs(delta)>radius+uncertainty)continue;
  // Tangency/near-coincident boundary events need a stronger arithmetic
  // certificate. Refuse this detail, never clamp acos or merge close roots.
  if(Math.abs(Math.abs(delta)-radius)<=uncertainty)fail('Detail conic boundary is numerically ambiguous');
  if(Math.abs(delta)>=radius)continue;
  const phase=Math.atan2(b,a),angle=Math.acos(delta/radius);
  for(const root of [phase-angle,phase+angle]){
   const lo=Math.ceil((first-root)/(2*Math.PI)),hi=Math.floor((last-root)/(2*Math.PI));
   for(let k=lo;k<=hi;k++){const t=root+k*2*Math.PI;if(t>first&&t<last)events.push(t);}
  }
 }
 events.sort((a,b)=>a-b);const unique=[];
 for(const t of events){if(unique.length&&t===unique[unique.length-1])continue;if(unique.length&&t-unique[unique.length-1]<=error(t,unique[unique.length-1]))fail('Distinct detail events cannot be ordered reliably');unique.push(t);}
 const kept=[];
 for(let i=0;i+1<unique.length;i++){
  const a=unique[i],b=unique[i+1],p=at(c,a+(b-a)/2);let outside=false;
  for(let j=0;j<2;j++){
   const e=error(p[j],low[j],high[j],c.center[j],c.a[j],c.b[j]);
   if(p[j]<low[j]-e||p[j]>high[j]+e){outside=true;break;}
   const constant=c.a[j]===0&&c.b[j]===0;
   if(!constant&&(Math.abs(p[j]-low[j])<=e||Math.abs(p[j]-high[j])<=e))fail('Detail interval membership is unresolved');
  }
  if(!outside)kept.push([a,b]);
 }
 return kept;
}
export function clipDrawingDetail({parent,parentFrame,frame,view}){
 if(view.basis!=='detail'||view.scale.numerator!==2||view.scale.denominator!==1||frame.u.some((n,i)=>!Object.is(n,parentFrame.u[i]))||frame.v.some((n,i)=>!Object.is(n,parentFrame.v[i]))||frame.n.some((n,i)=>!Object.is(n,parentFrame.n[i])))fail('Detail does not share its actual top projection basis','ENGINE_FAILURE');
 const p=unpackOrthographicRecord(parent,flat(parentFrame)),offset=[dot(sub(frame.origin,parentFrame.origin),parentFrame.u),dot(sub(frame.origin,parentFrame.origin),parentFrame.v)],half=[view.aperture.halfWidth,view.aperture.halfHeight],low=offset.map((n,i)=>n-half[i]),high=offset.map((n,i)=>n+half[i]),rows=[];let fragment=0;
 for(const group of p.groups)for(const c of group.curves){for(const [a,b]of clipCurve(c,low,high)){if(rows.length>=4096)fail('Detail interval capacity exceeded','RESOURCE_LIMIT');rows.push([fragment,a,b]);}fragment++;}
 const intervals=new ArrayBuffer(rows.length*24),data=new DataView(intervals);rows.forEach((r,i)=>r.forEach((n,j)=>data.setFloat64(i*24+j*8,n,true)));
 return captureDrawingDetailPacket({metadata:{version:1,quality:'parent-analytic-trim-intervals',parentViewId:view.parentViewId,parentFragmentCount:fragment,intervalCount:rows.length,intervalBytes:intervals.byteLength,frame:flat(frame),offset,aperture:{...view.aperture},scale:{...view.scale}},intervals},view,frame,parent);
}
const fields=(v,keys)=>{if(!v||typeof v!=='object'||Array.isArray(v)||Reflect.ownKeys(v).length!==keys.length)fail('Invalid detail metadata fields','ENGINE_FAILURE');const out={};for(const k of keys){const d=Object.getOwnPropertyDescriptor(v,k);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('Detail metadata must be own data','ENGINE_FAILURE');out[k]=d.value;}return out;};
const bytes=Function.call.bind(Object.getOwnPropertyDescriptor(ArrayBuffer.prototype,'byteLength').get);
export function captureDrawingDetailTransfer(value,view,frame,parent){
 const keys=['version','quality','parentViewId','parentFragmentCount','intervalCount','intervalBytes','frame','offset','aperture','scale'],p=fields(value,['metadata','intervals']),m=fields(p.metadata,keys);
 fields(m.aperture,['kind','halfWidth','halfHeight']);fields(m.scale,['numerator','denominator']);
 if(!value||Object.keys(value).sort().join(',')!=='intervals,metadata'||!m||Reflect.ownKeys(m).length!==keys.length||keys.some(k=>!Object.hasOwn(m,k))||m.version!==1||m.quality!=='parent-analytic-trim-intervals'||m.parentViewId!==view.parentViewId||m.parentFragmentCount!==parent.metadata.fragmentCount||!Number.isInteger(m.intervalCount)||m.intervalCount<0||m.intervalCount>4096||m.intervalBytes!==m.intervalCount*24||bytes(value.intervals)!==m.intervalBytes||!Array.isArray(m.frame)||m.frame.length!==12||m.frame.some((n,i)=>!Object.is(n,flat(frame)[i]))||!Array.isArray(m.offset)||m.offset.length!==2||m.offset.some(n=>!Number.isFinite(n)||Math.abs(n)>4e6)||JSON.stringify(m.aperture)!==JSON.stringify(view.aperture)||m.scale?.numerator!==2||m.scale?.denominator!==1)fail('Invalid detail packet','ENGINE_FAILURE');
 return Object.freeze({metadata:Object.freeze({...m,frame:Object.freeze([...m.frame]),offset:Object.freeze([...m.offset]),aperture:Object.freeze({...m.aperture}),scale:Object.freeze({...m.scale})}),intervals:value.intervals});
}
export function captureDrawingDetailPacket(value,view,frame,parent){
 const packet=captureDrawingDetailTransfer(value,view,frame,parent),m=packet.metadata;
 const data=new DataView(value.intervals);let priorIndex=-1,priorEnd=-Infinity;
 for(let i=0;i<m.intervalCount;i++){const index=data.getFloat64(i*24,true),a=data.getFloat64(i*24+8,true),b=data.getFloat64(i*24+16,true);if(!Number.isInteger(index)||index<0||index>=m.parentFragmentCount||index<priorIndex||!Number.isFinite(a)||!Number.isFinite(b)||!(b>a)||index===priorIndex&&a<priorEnd)fail('Invalid detail interval','ENGINE_FAILURE');priorIndex=index;priorEnd=b;}
 return Object.freeze({metadata:Object.freeze({...m,frame:Object.freeze([...m.frame]),offset:Object.freeze([...m.offset]),aperture:Object.freeze({...m.aperture}),scale:Object.freeze({...m.scale})}),intervals:value.intervals});
}
export function unpackDrawingDetail({packet,parent,parentFrame,frame,view}){
 const p=captureDrawingDetailPacket(packet,view,frame,parent),record=unpackOrthographicRecord(parent,flat(parentFrame)),source=record.groups.flatMap(group=>group.curves.map(curve=>({curve,category:group.category,visibility:group.visibility}))),data=new DataView(p.intervals),groups=[];
 // Recompute from authentic parent coefficients in the consumer Worker too.
 // A forged out-of-trim or mismatched interval never becomes presentation.
 const expected=clipDrawingDetail({parent,parentFrame,frame,view}),expectedData=new Uint8Array(expected.intervals),actual=new Uint8Array(p.intervals);
 if(p.metadata.offset.some((n,i)=>!Object.is(n,expected.metadata.offset[i]))||expectedData.length!==actual.length||actual.some((n,i)=>n!==expectedData[i]))fail('Detail intervals differ from their parent analytic trim','ENGINE_FAILURE');
 for(let i=0;i<p.metadata.intervalCount;i++){const index=data.getFloat64(i*24,true),a=data.getFloat64(i*24+8,true),b=data.getFloat64(i*24+16,true),r=source[index],c=r.curve;if(a<c.range[0]||b>c.range[1])fail('Detail interval exceeds its original trim','ENGINE_FAILURE');
  const offset=p.metadata.offset,move=v=>v.map((n,j)=>n-offset[j]),curve={...c,range:[a,b],start:move(at(c,a)),end:move(at(c,b)),...(c.kind==='line'?{origin:move(c.origin)}:{center:move(c.center)})};groups.push({category:r.category,visibility:r.visibility,curves:[curve]});}
 return{groups,empty:groups.length===0};
}
