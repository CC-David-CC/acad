// Main-safe STRUCTURAL transport only. No arithmetic proof or source/edit authority.
import {encodeFiniteCurveReadInput,captureFiniteCurveReadResult} from '../../../../modules/engine/mount/finiteCurveReadProtocol.mjs';
import {captureSketchFailure} from '../constr/admissionCause.mjs';

export const FINITE_CURVE_CERTIFICATE_ENVELOPE_LIMITS=Object.freeze({bytes:65536,nodes:1024,depth:16,integerHexDigits:4096,work:500000});
const own=(v,k)=>Object.prototype.hasOwnProperty.call(v,k);
const functionSource=Function.call.bind(Function.prototype.toString);
const fail=(code,message)=>{throw Object.assign(Error(message),{code});};
const invalid=m=>fail('FINITE_CURVE_CERTIFICATE_INPUT',m);
const protocol=m=>fail('FINITE_CURVE_CERTIFICATE_PROTOCOL',m);
const resource=m=>fail('RESOURCE_LIMIT',m);
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const identity=s=>typeof s==='string'&&s.length>0&&s.length<=256&&!/[\u0000-\u001f\u007f]/u.test(s);
const integer=(n,lo,hi)=>Number.isSafeInteger(n)&&n>=lo&&n<=hi;
const boolean=(v,stop)=>{if(typeof v!=='boolean')stop('Expected a literal certificate boolean.');return v;};
const literal=(v,expected,stop)=>{if(v!==expected)stop('Unexpected certificate literal.');return v;};
const choice=(v,values,stop)=>{if(!values.includes(v))stop('Unknown certificate union member.');return v;};
function builtinPrototype(v,ctor){
 if(!v||typeof v!=='object')return false;
 const c=Object.getOwnPropertyDescriptor(v,'constructor');
 const p=c&&own(c,'value')&&typeof c.value==='function'?Object.getOwnPropertyDescriptor(c.value,'prototype'):null;
 return !!p&&own(p,'value')&&p.value===v&&functionSource(c.value)===functionSource(ctor);
}
const plain=p=>p===null||Object.getPrototypeOf(p)===null&&builtinPrototype(p,Object);

// Bound the COMPLETE envelope before nested schema capture. Primitive-only JSON
// sizing cannot call toJSON/getters. Repeated data is copied/charged per occurrence;
// cycles, holes, symbols and accessors are refused. Never freeze caller objects.
function detached(value,stop){
 const limits=FINITE_CURVE_CERTIFICATE_ENVELOPE_LIMITS,ancestors=new WeakSet(),encoder=new TextEncoder();
 let nodes=0,bytes=0;
 const charge=n=>{if(bytes>limits.bytes-n)resource('Finite-curve certificate envelope exceeds64KiB.');bytes+=n;};
 const text=s=>{if(s.length>4097)resource('Certificate string exceeds its bounded transport length.');charge(encoder.encode(JSON.stringify(s)).byteLength);};
 function visit(v,depth){
  if(++nodes>limits.nodes||depth>limits.depth)resource('Finite-curve certificate envelope exceeds its node/depth bound.');
  if(v===null){charge(4);return null;}
  if(typeof v==='string'){text(v);return v;}
  if(typeof v==='boolean'){charge(v?4:5);return v;}
  if(typeof v==='number'){if(!finite(v))stop('Certificate numbers must be finite.');charge(JSON.stringify(v).length);return v;}
  if(typeof v!=='object'||ancestors.has(v))stop('Certificate envelope must be acyclic own JSON data.');
  const isArray=Array.isArray(v),p=Object.getPrototypeOf(v);
  if(isArray){if(p!==null&&!(builtinPrototype(p,Array)&&plain(Object.getPrototypeOf(p))))stop('Expected a plain certificate array.');}
  else if(!plain(p))stop('Expected a plain certificate record.');
  let length;
  if(isArray){const d=Object.getOwnPropertyDescriptor(v,'length');if(!d||!own(d,'value')||!integer(d.value,0,limits.nodes))resource('Certificate array exceeds its node bound.');length=d.value;if(length>limits.nodes-nodes)resource('Certificate array exceeds the remaining node bound.');}
  const keys=Reflect.ownKeys(v);
  if(keys.length>limits.nodes+1)resource('Certificate record exceeds its node bound.');
  if(isArray&&keys.length!==length+1)stop('Certificate arrays must be dense without extra fields.');
  const count=isArray?length:keys.length;
  if(count>limits.nodes-nodes)resource('Certificate fields exceed the remaining node bound.');
  charge(2+Math.max(0,count-1));ancestors.add(v);
  const result=isArray?[]:Object.create(null);
  for(let i=0;i<count;i++){
   const key=isArray?String(i):keys[i];
   if(typeof key!=='string')stop('Certificate symbols are unsupported.');
   if(!isArray){if(key.length>64)stop('Certificate field name exceeds its schema bound.');text(key);charge(1);}
   const d=Object.getOwnPropertyDescriptor(v,key);
   if(!d?.enumerable||!own(d,'value'))stop('Certificate fields must be enumerable own data.');
   const item=visit(d.value,depth+1);
   if(isArray)result.push(item);else Object.defineProperty(result,key,{value:item,enumerable:true,writable:true,configurable:true});
  }
  ancestors.delete(v);return result;
 }
 return visit(value,0);
}
function record(v,keys,stop=protocol){
 if(!v||typeof v!=='object'||Array.isArray(v))stop('Expected a certificate record.');
 const actual=Object.keys(v);
 if(actual.length!==keys.length||actual.some(k=>!keys.includes(k)))stop('Unexpected certificate fields.');
 return v;
}
function array(v,min,max,stop=protocol){if(!Array.isArray(v)||v.length<min||v.length>max)stop('Invalid certificate array length.');return v;}
function freeze(v){if(v&&typeof v==='object'){for(const child of Object.values(v))freeze(child);Object.freeze(v);}return v;}
function domain(v,curves,stop){
 const kind=v&&v.kind;
 if(kind==='finite-pair')return record(v,['kind'],stop);
 const r=record(v,['kind','targetCurveId','endpoint'],stop);
 if(r.kind!=='endpoint-ray'||!curves.some(c=>c.id===r.targetCurveId&&c.curve.kind==='segment')||!['a','b'].includes(r.endpoint))stop('An endpoint ray requires an actual input Segment endpoint.');
 return r;
}
function sameDomain(a,b){return a.kind===b.kind&&(a.kind==='finite-pair'||a.targetCurveId===b.targetCurveId&&a.endpoint===b.endpoint);}
function request(v){
 const r=record(v,['revision','curves','raw','domain'],invalid);
 if(!identity(r.revision))invalid('Invalid finite-curve certificate revision.');
 const input=encodeFiniteCurveReadInput(r.curves);
 r.curves=input.curves;r.raw=captureFiniteCurveReadResult(r.raw,input);r.domain=domain(r.domain,input.curves,invalid);
 return freeze(r);
}
export function captureFiniteCurveCertificateRequest(value){return request(detached(value,invalid));}

// These are bounded encoded integers, not parsed numbers. No normalization,
// rational ordering, gcd, root verification or comparison happens on Main.
function rational(v){
 const r=record(v,['numeratorHex','denominatorHex']);
 if(typeof r.numeratorHex!=='string'||typeof r.denominatorHex!=='string')protocol('Expected encoded certificate integers.');
 const digits=r.numeratorHex[0]==='-'?r.numeratorHex.length-1:r.numeratorHex.length;
 if(digits>4096||r.denominatorHex.length>4096)resource('Certificate integer exceeds16384 encoded bits.');
 if(!/^(?:0|-?[1-9a-f][0-9a-f]*)$/.test(r.numeratorHex)||!/^[1-9a-f][0-9a-f]*$/.test(r.denominatorHex))protocol('Invalid canonical hexadecimal certificate integer.');
 return r;
}
function interval(v){const r=record(v,['lower','upper']);r.lower=rational(r.lower);r.upper=rational(r.upper);return r;}
function rationalPoint(v){return array(v,2,2).map(rational);}
function occurrences(v,curves,kind){
 const rows=array(v,0,4),seen=new Set();
 for(const row of rows){record(row,['curveId','endpoint']);if(!curves.some(c=>c.id===row.curveId&&c.curve.kind===kind)||!['a','b'].includes(row.endpoint))protocol('Foreign certificate endpoint occurrence.');const key=curves.findIndex(c=>c.id===row.curveId)+':'+row.endpoint;if(seen.has(key))protocol('Duplicate certificate endpoint occurrence.');seen.add(key);}
 return rows;
}
function marker(v,curves){const r=record(v,['periodicSeam','occurrences']);boolean(r.periodicSeam,protocol);r.occurrences=occurrences(r.occurrences,curves,'arc');if(!r.periodicSeam&&!r.occurrences.length)protocol('A nonsymbolic circular marker requires an original Arc endpoint.');return r;}
function overlap(v,curves,supportKind){
 const kind=v&&v.kind;
 if(kind==='periodic-full'){
  record(v,['kind']);if(supportKind!=='circle-circle'||!curves.every(c=>c.curve.kind==='circle'))protocol('Periodic full overlap requires two input Circles.');return v;
 }
 if(kind==='linear-contact'||kind==='linear-interval'){
  const r=record(v,['kind','lower','upper','lowerClosed','upperClosed','lowerOccurrences','upperOccurrences']);
  if(supportKind!=='line-line')protocol('Linear overlap has nonline support.');
  r.lower=rational(r.lower);r.upper=rational(r.upper);boolean(r.lowerClosed,protocol);boolean(r.upperClosed,protocol);
  r.lowerOccurrences=occurrences(r.lowerOccurrences,curves,'segment');r.upperOccurrences=occurrences(r.upperOccurrences,curves,'segment');return r;
 }
 if(supportKind!=='circle-circle')protocol('Circular overlap has noncircular support.');
 if(kind==='circular-contact'){const r=record(v,['kind','at']);r.at=marker(r.at,curves);return r;}
 const r=record(v,['kind','from','to','wraps','lowerClosed','upperClosed']);literal(r.kind,'circular-interval',protocol);r.from=marker(r.from,curves);r.to=marker(r.to,curves);boolean(r.wraps,protocol);literal(r.lowerClosed,true,protocol);literal(r.upperClosed,true,protocol);return r;
}
function support(v,kind){
 const equality=own(v||{},'commonSupportEquality');
 const r=record(v,['kind','rootCount','censusWitness','witnessRole',...(equality?['commonSupportEquality']:[])]);
 literal(r.kind,kind,protocol);choice(r.rootCount,[0,1,2,'continuum'],protocol);r.censusWitness=rational(r.censusWitness);
 const roles=kind==='line-line'?['source-determinant']:kind==='line-circle'?['quadratic-discriminant']:['squared-center-separation','radical-axis-H'];
 choice(r.witnessRole,roles,protocol);
 const needsEquality=kind==='line-line'&&r.rootCount!==1||kind==='circle-circle'&&r.witnessRole==='squared-center-separation';
 if(equality!==needsEquality||kind==='line-line'&&![0,1,'continuum'].includes(r.rootCount)||kind==='line-circle'&&r.rootCount==='continuum'||kind==='circle-circle'&&r.witnessRole==='radical-axis-H'&&r.rootCount==='continuum'||needsEquality&&![0,'continuum'].includes(r.rootCount))protocol('Inconsistent certificate support union.');
 if(equality)r.commonSupportEquality=rational(r.commonSupportEquality);return r;
}
function membership(v,curve,selectedDomain){
 const isLine=curve.curve.kind==='segment';
 const r=record(v,['curveId','location','selectedDomain',...(isLine?['sourceParameter']:[])]);
 literal(r.curveId,curve.id,protocol);
 choice(r.location,curve.curve.kind==='circle'?['periodic']:['endpoint-a','endpoint-b','interior','outside'],protocol);
 boolean(r.selectedDomain,protocol);
 if(selectedDomain.kind==='finite-pair'||selectedDomain.targetCurveId!==curve.id){if(r.selectedDomain!==(r.location!=='outside'))protocol('Finite-domain membership shape differs.');}
 else if(r.selectedDomain&&r.location!=='outside')protocol('An endpoint-ray selection must lie outside the original finite Segment.');
 if(isLine){const p=record(r.sourceParameter,['origin','coefficient','interval']);p.origin=rational(p.origin);p.coefficient=rational(p.coefficient);p.interval=interval(p.interval);}
 return r;
}
function root(v,original,kind){
 const r=record(v,['nativeIndex','candidate','multiplicity','boxSteps','refinements','parameterInterval','parameterRole','nativeParametersRole','nativeParameters','coordinateEnclosure','derivativeLower','memberships','distanceEvidence']);
 if(!integer(r.nativeIndex,0,original.raw.rawPoints.length-1))protocol('Foreign Native candidate index.');
 const raw=original.raw.rawPoints[r.nativeIndex];r.candidate=array(r.candidate,2,2);
 if(r.candidate.some((n,i)=>!finite(n)||!Object.is(n,raw.point[i])))protocol('Certificate candidate differs from the original Native observation.');
 choice(r.multiplicity,[1,2],protocol);choice(r.boxSteps,[1,2,4,8,16,32,64],protocol);
 if(kind==='line-line'&&r.multiplicity!==1)protocol('An isolated line-line root has multiplicity one.');
 if(!integer(r.refinements,0,64))protocol('Invalid certificate refinement count.');
 r.parameterInterval=interval(r.parameterInterval);literal(r.parameterRole,kind==='circle-circle'?'radical-axis-v':'dimensionless-source-line-t',protocol);literal(r.nativeParametersRole,'raw-observation-only',protocol);
 r.nativeParameters=array(r.nativeParameters,2,2);
 for(let i=0;i<2;i++){
  const p=record(r.nativeParameters[i],['curveId','value','implicit']);
  literal(p.curveId,original.curves[original.raw.algorithmOrder[i]].id,protocol);
  const value=i===0?raw.firstParameter:raw.secondParameter,implicit=i===0?false:raw.secondIsImplicit;
  if(!Object.is(p.value,value)||p.implicit!==implicit)protocol('Certificate Native parameter differs from the original raw observation.');
 }
 const enclosure=record(r.coordinateEnclosure,['min','max']);enclosure.min=rationalPoint(enclosure.min);enclosure.max=rationalPoint(enclosure.max);
 if(r.derivativeLower!==null){r.derivativeLower=rational(r.derivativeLower);if(r.derivativeLower.numeratorHex==='0'||r.derivativeLower.numeratorHex[0]==='-')protocol('Derivative lower evidence must be positive.');}
 if(kind==='line-line'||r.multiplicity===2){if(r.derivativeLower!==null)protocol('Unexpected derivative lower evidence.');}
 else if(r.derivativeLower===null)protocol('Simple quadratic evidence requires a derivative lower bound.');
 r.memberships=array(r.memberships,2,2).map((m,i)=>membership(m,original.curves[i],original.domain));
 const d=record(r.distanceEvidence,['budgetMm','squaredUpper','withinBudget']);literal(d.budgetMm,5e-8,protocol);d.squaredUpper=rational(d.squaredUpper);if(d.squaredUpper.numeratorHex[0]==='-')protocol('Squared distance evidence must be nonnegative.');boolean(d.withinBudget,protocol);
 return r;
}
const uncertainty=Object.freeze(['NATIVE_BASIS_UNQUALIFIED','ARC_BRANCH_UNCERTAIN','ARC_ENDPOINT_INCIDENCE','NATIVE_NOT_DONE','NATIVE_ROOT_CENSUS','NATIVE_FLAGS','CANDIDATE_NOT_ENCLOSED','ROOTS_NOT_SEPARATED','FINITE_DOMAIN_UNRESOLVED']);
function certificate(v,original){
 const base=['version','scope','sourceAuthority','editAuthority','curveIds','inputBits','domain','work','status'];
 const uncertain=v&&v.status==='uncertain';
 const r=record(v,[...base,...(uncertain?['reason','nativeIndex']:['kind','support','intervals','roots','finiteRootIndices'])]);
 literal(r.version,1,protocol);literal(r.scope,'pure-mathematical-verification',protocol);literal(r.sourceAuthority,false,protocol);literal(r.editAuthority,false,protocol);
 r.curveIds=array(r.curveIds,2,2);if(r.curveIds.some((id,i)=>id!==original.curves[i].id))protocol('Certificate curve identities differ from the original request.');
 const input=encodeFiniteCurveReadInput(original.curves);r.inputBits=array(r.inputBits,input.inputBits.length,input.inputBits.length);if(r.inputBits.some((bits,i)=>bits!==input.inputBits[i]))protocol('Certificate input bits differ from the original request.');
 r.domain=domain(r.domain,original.curves,protocol);if(!sameDomain(r.domain,original.domain))protocol('Certificate domain differs from the original request.');
 const work=record(r.work,['charged','limit']);literal(work.limit,500000,protocol);if(!integer(work.charged,0,500000))protocol('Invalid certificate work charge.');
 if(uncertain){choice(r.reason,uncertainty,protocol);if(r.nativeIndex!==null&&!integer(r.nativeIndex,0,original.raw.rawPoints.length-1))protocol('Foreign uncertain Native candidate index.');return r;}
 literal(r.status,'certified',protocol);choice(r.kind,['finite-points','finite-empty','overlap-intervals'],protocol);
 if(!original.raw.flags.done)protocol('A certificate cannot certify an unfinished Native observation.');
 const lines=original.curves.filter(c=>c.curve.kind==='segment').length,kind=lines===2?'line-line':lines===1?'line-circle':'circle-circle';
 r.support=support(r.support,kind);
 const common=r.support.rootCount==='continuum';
 const parallel=kind==='line-line'?r.support.rootCount!==1:kind==='circle-circle'&&r.support.witnessRole==='squared-center-separation';
 if(original.raw.flags.identical!==common||original.raw.flags.parallel!==parallel||original.raw.flags.empty!==(r.support.rootCount===0))protocol('Certificate support shape differs from the original Native flags.');
 r.intervals=array(r.intervals,0,kind==='line-line'?1:5).map(v=>overlap(v,original.curves,kind));
 r.roots=array(r.roots,0,2).map(v=>root(v,original,kind));
 const indices=r.roots.map(row=>row.nativeIndex);if(new Set(indices).size!==indices.length)protocol('Duplicate certificate Native candidate index.');
 r.finiteRootIndices=array(r.finiteRootIndices,0,2);
 const selected=r.roots.filter(row=>row.memberships.every(m=>m.selectedDomain)).map(row=>row.nativeIndex);
 if(r.finiteRootIndices.length!==selected.length||r.finiteRootIndices.some((index,i)=>index!==selected[i]))protocol('Certificate finite index membership differs.');
 if(r.support.rootCount==='continuum'){
  if(r.roots.length||r.finiteRootIndices.length||original.raw.rawPointCount!==0||r.kind!==(r.intervals.length?'overlap-intervals':'finite-empty'))protocol('Inconsistent continuum certificate fields.');
 }else if(r.intervals.length||r.roots.length!==r.support.rootCount||r.roots.length!==original.raw.rawPointCount||r.kind!==(selected.length?'finite-points':'finite-empty'))protocol('Inconsistent finite-point certificate fields.');
 return r;
}
export function captureFiniteCurveCertificateReply(value,originalRequest){
 const original=captureFiniteCurveCertificateRequest(originalRequest),data=detached(value,protocol);
 const r=record(data,data&&data.ok===true?['revision','ok','certificate']:['revision','ok','error']);
 literal(r.revision,original.revision,protocol);
 if(r.ok===true)r.certificate=certificate(r.certificate,original);
 else{literal(r.ok,false,protocol);try{r.error=captureSketchFailure(r.error);}catch{protocol('Malformed finite-curve certificate failure.');}}
 return freeze(r);
}
