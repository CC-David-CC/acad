// Mathematical verification ONLY. No source/current-job authority, event IDs,
// Native invocation, root fallback or coordinate publication lives in this leaf.
import {encodeFiniteCurveReadInput,captureFiniteCurveReadResult} from './finiteCurveReadProtocol.mjs';
import {createFiniteCurveCertificateArithmetic,FINITE_CURVE_CERTIFICATE_LIMITS as LIMITS} from './finiteCurveCertificateArithmetic.mjs';
const invalid=message=>{throw Object.assign(Error(message),{code:'FINITE_CURVE_CERTIFICATE_INPUT'});};
const resource=message=>{throw Object.assign(Error(message),{code:'RESOURCE_LIMIT'});};
const own=(v,k)=>Object.prototype.hasOwnProperty.call(v,k);
export const FINITE_CURVE_CERTIFICATE_UNCERTAIN_REASONS=Object.freeze(['NATIVE_BASIS_UNQUALIFIED','ARC_BRANCH_UNCERTAIN','ARC_ENDPOINT_INCIDENCE','NATIVE_NOT_DONE','NATIVE_ROOT_CENSUS','NATIVE_FLAGS','CANDIDATE_NOT_ENCLOSED','ROOTS_NOT_SEPARATED','FINITE_DOMAIN_UNRESOLVED']);
function captureDomain(value,curves){
 if(!value||typeof value!=='object'||Array.isArray(value))invalid('Expected a pure finite-curve query domain.');
 const kind=Object.getOwnPropertyDescriptor(value,'kind');if(!kind||!own(kind,'value'))invalid('Query domain requires an own-data kind.');
 const keys=kind.value==='finite-pair'?['kind']:kind.value==='endpoint-ray'?['kind','targetCurveId','endpoint']:[];
 if(!keys.length||Reflect.ownKeys(value).length!==keys.length||Reflect.ownKeys(value).some(k=>typeof k!=='string'||!keys.includes(k)))invalid('Unexpected finite-curve query domain.');
 const result={};for(const k of keys){const d=Object.getOwnPropertyDescriptor(value,k);if(!d?.enumerable||!own(d,'value'))invalid('Query domain fields must be own data.');result[k]=d.value;}
 if(result.kind==='endpoint-ray'){
  const target=curves.find(c=>c.id===result.targetCurveId);
  if(!target||target.curve.kind!=='segment'||!['a','b'].includes(result.endpoint))invalid('An endpoint ray requires an actual input Segment endpoint.');
 }
 return Object.freeze(result);
}
export function verifyFiniteCurveCandidates(curvesValue,rawValue,domainValue={kind:'finite-pair'}){
 const input=encodeFiniteCurveReadInput(curvesValue),raw=captureFiniteCurveReadResult(rawValue,input),domain=captureDomain(domainValue,input.curves),A=createFiniteCurveCertificateArithmetic();
 const Z=A.integer(0),O=A.integer(1),T=A.integer(2),F=A.integer(4),qpoint=p=>p.map(A.number),add=(a,b)=>a.map((n,i)=>A.add(n,b[i])),sub=(a,b)=>a.map((n,i)=>A.sub(n,b[i])),scale=(a,t)=>a.map(n=>A.mul(n,t));
 const dot=(a,b)=>A.add(A.mul(a[0],b[0]),A.mul(a[1],b[1])),cross=(a,b)=>A.sub(A.mul(a[0],b[1]),A.mul(a[1],b[0])),norm=a=>dot(a,a),eq=(a,b)=>A.cmp(a,b)===0;
 const original=input.curves.map(r=>{const c=r.curve;return{id:r.id,kind:c.kind,a:c.a?qpoint(c.a):null,b:c.b?qpoint(c.b):null,c:c.center?qpoint(c.center):null,r:c.radius===undefined?null:A.number(c.radius),d:c.kind==='segment'?sub(qpoint(c.b),qpoint(c.a)):null};});
 let rationalBytes=0;
 const encode=q=>{const r=A.encode(q);const bytes=r.numeratorHex.length+r.denominatorHex.length+80;if(rationalBytes>LIMITS.responseBytes-8192-bytes)resource('Finite-curve rational evidence exceeds its bounded wire share.');rationalBytes+=bytes;return r;};
 const encodePoint=p=>p.map(encode),interval=i=>({lower:encode(i.lo),upper:encode(i.hi)});
 function finish(fields){
  const result={version:1,scope:'pure-mathematical-verification',sourceAuthority:false,editAuthority:false,curveIds:input.curves.map(c=>c.id),inputBits:[...input.inputBits],domain:{...domain},...fields,work:{charged:0,limit:LIMITS.work}};
  let bytes=0,nodes=0;
  const charge=n=>{if(bytes>LIMITS.responseBytes-32-n)resource('Finite-curve certificate exceeds64KiB.');bytes+=n;};
  function scan(v,depth){
   A.tick();if(++nodes>1024||depth>16)resource('Finite-curve evidence exceeds its structural bound.');
   if(v===null||typeof v!=='object'){const s=JSON.stringify(v);if(typeof s!=='string')invalid('Non-JSON mathematical evidence.');charge(new TextEncoder().encode(s).byteLength);return;}
   const keys=Object.keys(v);charge(2+Math.max(0,keys.length-1));
   for(const k of keys){if(!Array.isArray(v))charge(new TextEncoder().encode(JSON.stringify(k)).byteLength+1);scan(v[k],depth+1);}
  }
  scan(result,0);result.work.charged=A.work;
  const freeze=v=>{if(v&&typeof v==='object'){for(const child of Object.values(v))freeze(child);Object.freeze(v);}return v;};
  return freeze(result);
 }
 const uncertain=(reason,nativeIndex=null)=>{if(!FINITE_CURVE_CERTIFICATE_UNCERTAIN_REASONS.includes(reason))throw Error('Unknown mathematical uncertainty reason.');return finish({status:'uncertain',reason,nativeIndex});};
 // These checks refuse inherited ambiguity; they do not turn a drawing
 // threshold or atan2 into an exact equality or finite-root predicate.
 for(let i=0;i<original.length;i++){
  const c=original[i],s=input.curves[i].curve,b=raw.bases[i];
  if(c.kind==='segment'){
   const u=qpoint(b.direction);if(A.sign(norm(u))<=0||A.sign(dot(c.d,u))<=0)return uncertain('NATIVE_BASIS_UNQUALIFIED');
  }else{
   if(b.x[0]!==1||b.x[1]!==0||b.y[0]!==0||b.y[1]!==1||b.direct!==true)return uncertain('NATIVE_BASIS_UNQUALIFIED');
   if(c.kind==='arc'){
    if(Math.abs(s.a[0]-s.b[0])<1e-6&&Math.abs(s.a[1]-s.b[1])<1e-6)return uncertain('ARC_BRANCH_UNCERTAIN');
    if(!eq(norm(sub(c.a,c.c)),A.mul(c.r,c.r))||!eq(norm(sub(c.b,c.c)),A.mul(c.r,c.r)))return uncertain('ARC_ENDPOINT_INCIDENCE');
    const start=Math.atan2(s.a[1]-s.center[1],s.a[0]-s.center[0]);let end=Math.atan2(s.b[1]-s.center[1],s.b[0]-s.center[0]);if(end<=start)end+=2*Math.PI;
    if(!Object.is(start,s.startRadians)||!Object.is(end,s.endRadians))return uncertain('ARC_BRANCH_UNCERTAIN');
   }
  }
 }
 if(!raw.flags.done)return uncertain('NATIVE_NOT_DONE');
 const lineIndices=original.map((c,i)=>c.kind==='segment'?i:-1).filter(i=>i>=0);let model;
 if(lineIndices.length===2){
  const[a,b]=original,D=cross(a.d,b.d),delta=sub(b.a,a.a);
  if(!A.sign(D)){const equality=cross(delta,a.d);model={kind:'line-line',common:!A.sign(equality),count:0,parallel:true,witness:D,equality};}
  else model={kind:'line-line',count:1,parallel:false,origin:a.a,vector:a.d,exact:A.div(cross(delta,b.d),D),multiplicity:1,witness:D};
 }else if(lineIndices.length===1){
  const lineIndex=lineIndices[0],line=original[lineIndex],circle=original[1-lineIndex],offset=sub(line.a,circle.c),a=norm(line.d),b=A.mul(T,dot(line.d,offset)),c=A.sub(norm(offset),A.mul(circle.r,circle.r)),D=A.sub(A.mul(b,b),A.mul(F,A.mul(a,c))),s=A.sign(D);
  model={kind:'line-circle',count:s<0?0:s===0?1:2,parallel:false,origin:line.a,vector:line.d,poly:[a,b,c],multiplicity:s===0?2:1,witness:D,...(s===0?{exact:A.div(A.neg(b),A.mul(T,a))}:{})};
 }else{
  const[a,b]=original,d=sub(b.c,a.c),D=norm(d);
  if(!A.sign(D))model={kind:'circle-circle',common:eq(a.r,b.r),count:0,parallel:true,witness:D,equality:A.sub(a.r,b.r)};
  else{
   const K=A.add(D,A.sub(A.mul(a.r,a.r),A.mul(b.r,b.r))),H=A.sub(A.mul(F,A.mul(D,A.mul(a.r,a.r))),A.mul(K,K)),s=A.sign(H),twice=A.mul(T,D);
   model={kind:'circle-circle',count:s<0?0:s===0?1:2,parallel:false,origin:add(a.c,scale(d,A.div(K,twice))),vector:scale([A.neg(d[1]),d[0]],A.div(O,twice)),poly:[O,Z,A.neg(H)],multiplicity:s===0?2:1,witness:H,...(s===0?{exact:Z}:{})};
  }
 }
 const expectedCount=model.common?0:model.count;
 if(raw.rawPointCount!==expectedCount)return uncertain('NATIVE_ROOT_CENSUS');
 if(raw.flags.identical!==!!model.common||raw.flags.parallel!==model.parallel||raw.flags.empty!==(expectedCount===0&&!model.common))return uncertain('NATIVE_FLAGS');
 const support=()=>({kind:model.kind,rootCount:model.common?'continuum':model.count,censusWitness:encode(model.witness),witnessRole:model.kind==='line-line'?'source-determinant':model.kind==='line-circle'?'quadratic-discriminant':model.parallel?'squared-center-separation':'radical-axis-H',...(own(model,'equality')?{commonSupportEquality:encode(model.equality)}:{})});
 const value=(poly,t)=>A.add(A.mul(A.add(A.mul(poly[0],t),poly[1]),t),poly[2]);
 const at=t=>add(model.origin,scale(model.vector,t));
 function affineInterval(origin,direction,Q){
  let lo=null,hi=null;
  for(let k=0;k<2;k++){
   if(!A.sign(direction[k])){if(A.cmp(origin[k],Q.lo[k])<0||A.cmp(origin[k],Q.hi[k])>0)return null;continue;}
   const a=A.div(A.sub(Q.lo[k],origin[k]),direction[k]),b=A.div(A.sub(Q.hi[k],origin[k]),direction[k]);lo=lo===null?A.min(a,b):A.max(lo,A.min(a,b));hi=hi===null?A.max(a,b):A.min(hi,A.max(a,b));
  }
  return lo!==null&&hi!==null&&A.cmp(lo,hi)<=0?{lo,hi}:null;
 }
 function enclosure(root){
  const a=at(root.interval.lo),b=at(root.interval.hi);return{lo:a.map((n,i)=>A.min(n,b[i])),hi:a.map((n,i)=>A.max(n,b[i]))};
 }
 function derivative(I){const a=A.add(A.mul(A.mul(T,model.poly[0]),I.lo),model.poly[1]),b=A.add(A.mul(A.mul(T,model.poly[0]),I.hi),model.poly[1]);return A.sign(a)*A.sign(b)>0?A.min(A.abs(a),A.abs(b)):null;}
 function candidate(index){
  const p=raw.rawPoints[index].point,low=[...p],high=[...p];let previous=0;
  for(const steps of LIMITS.boxSteps){
   for(let n=previous;n<steps;n++)for(let k=0;k<2;k++){low[k]=A.neighbor(low[k],false);high[k]=A.neighbor(high[k],true);if(low[k]===null||high[k]===null)return null;}
   previous=steps;const Q={lo:qpoint(low),hi:qpoint(high)},I=affineInterval(model.origin,model.vector,Q);if(!I)continue;
   if(own(model,'exact')){if(A.cmp(model.exact,I.lo)>=0&&A.cmp(model.exact,I.hi)<=0)return{index,boxSteps:steps,interval:{lo:model.exact,hi:model.exact},exact:model.exact,refinements:0};continue;}
   const lower=value(model.poly,I.lo),upper=value(model.poly,I.hi),bound=derivative(I);if(bound===null||A.sign(lower)*A.sign(upper)>0)continue;
   const exact=!A.sign(lower)?I.lo:!A.sign(upper)?I.hi:null;
   return{index,boxSteps:steps,interval:exact?{lo:exact,hi:exact}:I,exact,refinements:0};
  }
  return null;
 }
 function refine(root){
  if(root.exact!==null)return false;if(root.refinements>=LIMITS.refinements)return false;
  A.tick();root.refinements++;const I=root.interval,middle=A.div(A.add(I.lo,I.hi),T),f=value(model.poly,middle);
  if(!A.sign(f)){root.exact=middle;root.interval={lo:middle,hi:middle};return true;}
  const lower=value(model.poly,I.lo);root.interval=A.sign(f)===A.sign(lower)?{lo:middle,hi:I.hi}:{lo:I.lo,hi:middle};return true;
 }
 function signLinear(root,alpha,beta){
  if(!A.sign(beta))return A.sign(alpha);
  for(;;){
   const x=A.add(alpha,A.mul(beta,root.interval.lo)),y=A.add(alpha,A.mul(beta,root.interval.hi)),sx=A.sign(x),sy=A.sign(y);
   if(root.exact!==null)return sx;if(sx*sy>0)return sx;
   const zero=A.div(A.neg(alpha),beta);
   if(A.cmp(zero,root.interval.lo)>=0&&A.cmp(zero,root.interval.hi)<=0&&!A.sign(value(model.poly,zero)))return 0;
   if(!refine(root))return null;
  }
 }
 function halfDirection(v){const y=A.sign(v[1]);return y>0||y===0&&A.sign(v[0])>=0?0:1;}
 function compareDirections(a,b){const ah=halfDirection(a),bh=halfDirection(b);return ah!==bh?ah-bh:-A.sign(cross(a,b));}
 function compareDirectionRoot(direction,root,center){
  const offset=sub(model.origin,center),y=signLinear(root,offset[1],model.vector[1]);if(y===null)return null;
  const x=y===0?signLinear(root,offset[0],model.vector[0]):1;if(x===null)return null;
  const half=y>0||y===0&&x>=0?0:1,h=halfDirection(direction);if(h!==half)return h-half;
  const c=signLinear(root,cross(direction,offset),cross(direction,model.vector));return c===null?null:-c;
 }
 function membership(c,root){
  if(c.kind==='segment'){
   const k=A.sign(c.d[0])?0:1,alpha=A.div(A.sub(model.origin[k],c.a[k]),c.d[k]),beta=A.div(model.vector[k],c.d[k]),sa=signLinear(root,alpha,beta),sb=signLinear(root,A.sub(alpha,O),beta);if(sa===null||sb===null)return null;
   const finite=sa>=0&&sb<=0,location=sa===0?'endpoint-a':sb===0?'endpoint-b':finite?'interior':'outside';
   const selected=domain.kind==='endpoint-ray'&&domain.targetCurveId===c.id?(domain.endpoint==='a'?sa<0:sb>0):finite;
   return{curveId:c.id,location,selectedDomain:selected,sourceParameter:{origin:alpha,coefficient:beta}};
  }
  if(c.kind==='circle')return{curveId:c.id,location:'periodic',selectedDomain:true};
  const start=sub(c.a,c.c),end=sub(c.b,c.c),av=compareDirectionRoot(start,root,c.c),bv=compareDirectionRoot(end,root,c.c);if(av===null||bv===null)return null;
  const inside=compareDirections(start,end)<0?av<=0&&bv>=0:av<=0||bv>=0;
  return{curveId:c.id,location:av===0?'endpoint-a':bv===0?'endpoint-b':inside?'interior':'outside',selectedDomain:inside};
 }
 // Common-support interval construction below never creates a numeric root:
 // all boundaries are authenticated INPUT endpoints or a symbolic periodic seam.
 function domainLine(c){
  const k=A.sign(original[0].d[0])?0:1,coordinate=p=>A.div(A.sub(p[k],original[0].a[k]),original[0].d[k]),a=coordinate(c.a),b=coordinate(c.b);
  if(domain.kind==='endpoint-ray'&&domain.targetCurveId===c.id){const endpoint=domain.endpoint==='a'?a:b,increasing=A.cmp(b,a)>0,upper=domain.endpoint==='a'?increasing:!increasing;return{lo:upper?null:endpoint,hi:upper?endpoint:null,loClosed:false,hiClosed:false};}
  return{lo:A.min(a,b),hi:A.max(a,b),loClosed:true,hiClosed:true};
 }
 function commonLine(){
  const a=domainLine(original[0]),b=domainLine(original[1]),choose=(x,y,lower)=>x===null?y:y===null?x:lower?A.max(x,y):A.min(x,y),lo=choose(a.lo,b.lo,true),hi=choose(a.hi,b.hi,false);
  if(lo===null||hi===null)invalid('A finite boundary must bound a common-support interval.');
  const closed=(bound,key)=>[a,b].every(d=>d[key]===null||!eq(bound,d[key])||d[key+'Closed']),lc=closed(lo,'lo'),hc=closed(hi,'hi'),order=A.cmp(lo,hi);
  if(order>0||order===0&&!(lc&&hc))return[];
  const owners=t=>original.flatMap(c=>['a','b'].filter(k=>{const q=atPointOnFirst(c[k]);return eq(q,t);}).map(endpoint=>({curveId:c.id,endpoint})));
  function atPointOnFirst(p){const k=A.sign(original[0].d[0])?0:1;return A.div(A.sub(p[k],original[0].a[k]),original[0].d[k]);}
  return[{kind:order===0?'linear-contact':'linear-interval',lower:encode(lo),upper:encode(hi),lowerClosed:lc,upperClosed:hc,lowerOccurrences:owners(lo),upperOccurrences:owners(hi)}];
 }
 function directionInside(c,w){if(c.kind==='circle')return true;const a=sub(c.a,c.c),b=sub(c.b,c.c),ab=compareDirections(a,b),aw=compareDirections(a,w),wb=compareDirections(w,b);return ab<0?aw<=0&&wb<=0:aw<=0||wb<=0;}
 function commonCircle(){
  if(original.every(c=>c.kind==='circle'))return[{kind:'periodic-full'}];
  const nodes=[{direction:[O,Z],occurrences:[],seam:true}];
  for(const c of original)if(c.kind==='arc')for(const endpoint of ['a','b']){
   const direction=sub(c[endpoint],c.c);let n=nodes.find(n=>compareDirections(n.direction,direction)===0);
   if(!n){n={direction,occurrences:[],seam:false};nodes.push(n);}n.occurrences.push({curveId:c.id,endpoint});
  }
  nodes.sort((a,b)=>compareDirections(a.direction,b.direction));const marker=n=>({periodicSeam:n.seam,occurrences:n.occurrences.map(r=>({...r}))}),result=[],covered=new Set();
  for(let i=0;i<nodes.length;i++){
   const a=nodes[i].direction,b=nodes[(i+1)%nodes.length].direction,s=A.sign(cross(a,b));let middle;
   if(s>0)middle=add(a,b);else if(s<0)middle=scale(add(a,b),A.neg(O));else middle=[A.neg(a[1]),a[0]];
   if(original.every(c=>directionInside(c,middle))){result.push({kind:'circular-interval',from:marker(nodes[i]),to:marker(nodes[(i+1)%nodes.length]),wraps:i===nodes.length-1,lowerClosed:true,upperClosed:true});covered.add(i);covered.add((i+1)%nodes.length);}
  }
  for(let i=0;i<nodes.length;i++)if(!covered.has(i)&&original.every(c=>directionInside(c,nodes[i].direction)))result.push({kind:'circular-contact',at:marker(nodes[i])});
  return result;
 }
 if(model.common){const intervals=model.kind==='line-line'?commonLine():commonCircle();return finish({status:'certified',kind:intervals.length?'overlap-intervals':'finite-empty',support:support(),intervals,roots:[],finiteRootIndices:[]});}
 if(!model.count)return finish({status:'certified',kind:'finite-empty',support:support(),intervals:[],roots:[],finiteRootIndices:[]});
 const roots=[];for(let i=0;i<model.count;i++){const root=candidate(i);if(!root)return uncertain('CANDIDATE_NOT_ENCLOSED',i);roots.push(root);}
 if(roots.length===2){
  for(;;){const[a,b]=roots;if(A.cmp(a.interval.hi,b.interval.lo)<0||A.cmp(b.interval.hi,a.interval.lo)<0)break;if(!refine(a)&&!refine(b))return uncertain('ROOTS_NOT_SEPARATED');}
  roots.sort((a,b)=>A.cmp(a.interval.lo,b.interval.lo));
 }
 const evidence=[],finite=[];
 for(const root of roots){
  const memberships=[];for(const c of original){const m=membership(c,root);if(m===null)return uncertain('FINITE_DOMAIN_UNRESOLVED',root.index);memberships.push(m);}
  const bounds=enclosure(root),candidatePoint=raw.rawPoints[root.index].point,delta=bounds.lo.map((n,i)=>A.max(A.abs(A.sub(A.number(candidatePoint[i]),n)),A.abs(A.sub(A.number(candidatePoint[i]),bounds.hi[i])))),errorSquared=norm(delta),budget=A.number(5e-8);
  const rows=memberships.map(m=>{
   if(!m.sourceParameter)return{...m};
   const{origin,coefficient}=m.sourceParameter,a=A.add(origin,A.mul(coefficient,root.interval.lo)),b=A.add(origin,A.mul(coefficient,root.interval.hi));
   return{...m,sourceParameter:{origin:encode(origin),coefficient:encode(coefficient),interval:{lower:encode(A.min(a,b)),upper:encode(A.max(a,b))}}};
  });
  if(rows.every(m=>m.selectedDomain))finite.push(root.index);
  const derivativeLower=model.poly&&model.multiplicity===1?derivative(root.interval):null;
  const native=raw.rawPoints[root.index],nativeParameters=[{curveId:input.curves[raw.algorithmOrder[0]].id,value:native.firstParameter,implicit:false},{curveId:input.curves[raw.algorithmOrder[1]].id,value:native.secondParameter,implicit:native.secondIsImplicit}];
  evidence.push({nativeIndex:root.index,candidate:[...candidatePoint],multiplicity:model.multiplicity,boxSteps:root.boxSteps,refinements:root.refinements,parameterInterval:interval(root.interval),parameterRole:model.kind==='circle-circle'?'radical-axis-v':'dimensionless-source-line-t',nativeParametersRole:'raw-observation-only',nativeParameters,coordinateEnclosure:{min:encodePoint(bounds.lo),max:encodePoint(bounds.hi)},derivativeLower:derivativeLower===null?null:encode(derivativeLower),memberships:rows,distanceEvidence:{budgetMm:5e-8,squaredUpper:encode(errorSquared),withinBudget:A.cmp(errorSquared,A.mul(budget,budget))<=0}});
 }
 return finish({status:'certified',kind:finite.length?'finite-points':'finite-empty',support:support(),intervals:[],roots:evidence,finiteRootIndices:finite});
}
