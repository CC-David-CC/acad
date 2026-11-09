// Structural transport only. No source authority, finite events or certificates.
export const FINITE_CURVE_READ_LIMITS=Object.freeze({curves:2,inputCapacity:64,actualValues:24,rawPoints:8,responseBytes:65536});
export const FINITE_CURVE_READ_ERROR_CODES=Object.freeze(["CURVE_QUERY_INVALID_REQUEST","CURVE_QUERY_UNCERTAIN","CURVE_QUERY_RESOURCE_LIMIT","CURVE_QUERY_INPUT_CHANGED","CURVE_QUERY_PUBLICATION_FAILED","CURVE_QUERY_FAILED","ENGINE_CLEANUP_FAILED"]);
const protocol=message=>{throw Object.assign(Error(message),{code:"FINITE_CURVE_READ_PROTOCOL"});};
const invalid=message=>{throw Object.assign(Error(message),{code:"CURVE_QUERY_INVALID_REQUEST"});};
const own=(value,key)=>Object.prototype.hasOwnProperty.call(value,key),functionSource=Function.call.bind(Function.prototype.toString);
function builtinPrototype(value,constructor){if(!value||typeof value!=="object")return false;const c=Object.getOwnPropertyDescriptor(value,"constructor"),p=c&&own(c,"value")&&typeof c.value==="function"?Object.getOwnPropertyDescriptor(c.value,"prototype"):null;return !!p&&own(p,"value")&&p.value===value&&functionSource(c.value)===functionSource(constructor);}
function plainPrototype(value){return value===null||Object.getPrototypeOf(value)===null&&builtinPrototype(value,Object);}
function fields(value,keys,fail){if(!value||typeof value!=="object"||Array.isArray(value)||!plainPrototype(Object.getPrototypeOf(value)))fail("Expected a plain finite-curve record");const actual=Reflect.ownKeys(value);if(actual.length!==keys.length||actual.some(k=>typeof k!=="string"||!keys.includes(k)))fail("Unexpected finite-curve fields");const out=Object.create(null);for(const k of keys){const d=Object.getOwnPropertyDescriptor(value,k);if(!d?.enumerable||!own(d,"value"))fail("Finite-curve fields must be own data");out[k]=d.value;}return out;}
function array(value,length,fail){if(!Array.isArray(value))fail("Expected a dense finite-curve array");const p=Object.getPrototypeOf(value),d=Object.getOwnPropertyDescriptor(value,"length");if(p!==null&&!(builtinPrototype(p,Array)&&plainPrototype(Object.getPrototypeOf(p)))||!d||!own(d,"value")||d.value!==length||Reflect.ownKeys(value).length!==length+1)fail("Invalid finite-curve array shape");const out=[];for(let i=0;i<length;i++){const item=Object.getOwnPropertyDescriptor(value,String(i));if(!item?.enumerable||!own(item,"value"))fail("Finite-curve arrays must be dense own data");out.push(item.value);}return out;}
const finite=n=>typeof n==="number"&&Number.isFinite(n),coordinate=n=>finite(n)&&Math.abs(n)<=1e8;
function pair(value,fail,coordinateOnly=false){const out=array(value,2,fail);if(!out.every(coordinateOnly?coordinate:finite))fail("Expected two finite curve coordinates");return Object.freeze(out);}
const freeze=value=>{if(value&&typeof value==="object"){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
// Primitive JSON.stringify only; no inherited object/array toJSON is invoked.
function canonical(value){if(Array.isArray(value))return "["+value.map(canonical).join(",")+"]";if(value&&typeof value==="object")return "{"+Object.keys(value).map(k=>JSON.stringify(k)+":"+canonical(value[k])).join(",")+"}";return JSON.stringify(value);}
function bounded(value){if(new TextEncoder().encode(canonical(value)).byteLength>FINITE_CURVE_READ_LIMITS.responseBytes)protocol("Finite-curve observation exceeds64KiB");return freeze(value);}
function word(value){const view=new DataView(new ArrayBuffer(8));view.setFloat64(0,value,false);return view.getUint32(0,false).toString(16).padStart(8,"0")+view.getUint32(4,false).toString(16).padStart(8,"0");}
function captureCurve(value){
 const r=fields(value,["id","stage","curve"],invalid);if(typeof r.id!=="string"||!r.id||r.id.length>256||/[\u0000-\u001f\u007f]/u.test(r.id)||!Number.isSafeInteger(r.stage)||r.stage<0||r.stage>31)invalid("Expected a bounded inspected curve identity/stage");
 if(!r.curve||typeof r.curve!=="object"||Array.isArray(r.curve))invalid("Expected a prepared plain curve record");
 const kind=Object.getOwnPropertyDescriptor(r.curve,"kind");if(!kind?.enumerable||!own(kind,"value")||!["segment","circle","arc"].includes(kind.value))invalid("Unsupported finite curve kind");
 const c=fields(r.curve,kind.value==="segment"?["kind","a","b"]:kind.value==="circle"?["kind","center","radius"]:["kind","a","b","center","radius","startRadians","endRadians","sense"],invalid);
 if(c.kind!==kind.value)invalid("Finite curve kind changed");
 if(c.kind!=="circle"){c.a=pair(c.a,invalid,true);c.b=pair(c.b,invalid,true);if(c.a.every((n,i)=>n===c.b[i]))invalid("Finite curve endpoints must differ");}
 if(c.kind!=="segment"){c.center=pair(c.center,invalid,true);if(!finite(c.radius)||c.radius<=0||c.radius>1e8)invalid("Expected a positive finite bounded radius");}
 if(c.kind==="arc"){const sweep=c.endRadians-c.startRadians;if(c.sense!=="ccw"||!finite(c.startRadians)||!finite(c.endRadians)||!finite(sweep)||sweep<=0||sweep>=2*Math.PI)invalid("Expected the original finite CCW Arc branch");}
 r.curve=freeze(c);return freeze(r);
}
function recordValues({curve:c}){return c.kind==="segment"?[1,...c.a,...c.b]:c.kind==="circle"?[2,...c.center,c.radius]:[3,...c.a,...c.b,...c.center,c.radius,c.startRadians,c.endRadians];}
export function encodeFiniteCurveReadInput(value){const curves=array(value,2,invalid).map(captureCurve);if(curves[0].id===curves[1].id)invalid("Choose two distinct inspected curve identities");const a=recordValues(curves[0]),b=recordValues(curves[1]),values=Object.freeze([1,2,a.length,b.length,...a,...b]);if(values.length>FINITE_CURVE_READ_LIMITS.actualValues)invalid("Finite-curve input length exceeds the frozen wire");return freeze({curves,values,inputBits:values.map(word),algorithmOrder:curves[0].curve.kind!=="segment"&&curves[1].curve.kind==="segment"?[1,0]:[0,1]});}
function expectedInput(value){const r=fields(value,["curves","values","inputBits","algorithmOrder"],protocol);let e;try{e=encodeFiniteCurveReadInput(r.curves);}catch(cause){throw Object.assign(Error("Invalid immutable finite-curve request"),{code:"FINITE_CURVE_READ_PROTOCOL",cause});}const values=array(r.values,e.values.length,protocol),bits=array(r.inputBits,e.inputBits.length,protocol),order=array(r.algorithmOrder,2,protocol);if(values.some((n,i)=>!Object.is(n,e.values[i]))||bits.some((n,i)=>n!==e.inputBits[i])||order.some((n,i)=>n!==e.algorithmOrder[i]))protocol("Immutable finite-curve request differs from its encoded DTO");return e;}
function captureBasis(value,source){
 const c=source.curve,line=c.kind==="segment",r=fields(value,["sourceKind","geometry","origin",...(line?["direction"]:["x","y","radius","direct"]),"domain","evaluatedEnds"],protocol);
 if(r.sourceKind!==c.kind||r.geometry!==(line?"line":"circle"))protocol("Constructed finite-curve basis kind differs");
 r.origin=pair(r.origin,protocol);const origin=line?c.a:c.center;if(r.origin.some((n,i)=>!Object.is(n,origin[i])))protocol("Actual Native basis origin differs from its immutable input");
 if(line)r.direction=pair(r.direction,protocol);
 else{r.x=pair(r.x,protocol);r.y=pair(r.y,protocol);if(!Object.is(r.radius,c.radius)||r.direct!==true)protocol("Actual Native circle basis input differs");}
 const d=fields(r.domain,["first","last","parameterUnit","fullCircle"],protocol);if(!finite(d.first)||!finite(d.last)||!(d.last>d.first)||d.parameterUnit!==(line?"millimeter":"radian")||d.fullCircle!==(c.kind==="circle"))protocol("Invalid actual Native finite-curve domain");
 if(c.kind==="arc"?(!Object.is(d.first,c.startRadians)||!Object.is(d.last,c.endRadians)):d.first!==0)protocol("Actual Native domain differs from its immutable input");
 // Segment length/Circle turn, normalized vectors and evaluated endpoints are
 // ACTUAL Native observations. No guessed JS norm/error certificate is added.
 r.domain=freeze(d);r.evaluatedEnds=Object.freeze(array(r.evaluatedEnds,2,protocol).map(p=>pair(p,protocol)));return freeze(r);
}
export function captureFiniteCurveReadResult(value,input){
 const expected=expectedInput(input),r=fields(value,["version","kind","scope","persistentIds","coordinateUnit","algorithm","inputBits","bases","algorithmOrder","flags","rawPointCount","rawPoints"],protocol);
 if(r.version!==1||r.kind!=="analytic-support-query"||r.scope!=="response-local"||r.persistentIds!==false||r.coordinateUnit!=="millimeter")protocol("Unsupported raw finite-curve observation");
 r.algorithm=fields(r.algorithm,["name","occtVersion"],protocol);if(r.algorithm.name!=="IntAna2d_AnaIntersection"||r.algorithm.occtVersion!=="7.6.0")protocol("Unexpected finite-curve algorithm identity");
 r.inputBits=array(r.inputBits,expected.inputBits.length,protocol);if(r.inputBits.some((v,i)=>typeof v!=="string"||!/^[a-f0-9]{16}$/.test(v)||v!==expected.inputBits[i]))protocol("Native input bits differ from the immutable Float64 request");
 r.algorithmOrder=array(r.algorithmOrder,2,protocol);if(r.algorithmOrder.some((n,i)=>n!==expected.algorithmOrder[i]))protocol("Raw Native parameter order differs from the actual overload");
 r.bases=array(r.bases,2,protocol).map((b,i)=>captureBasis(b,expected.curves[i]));r.flags=fields(r.flags,["done","empty","identical","parallel"],protocol);
 if(typeof r.flags.done!=="boolean")protocol("Invalid raw algorithm completion flag");
 if(!r.flags.done){if(r.flags.empty!==null||r.flags.identical!==null||r.flags.parallel!==null||r.rawPointCount!==null)protocol("An unfinished algorithm carries defined result flags");r.rawPoints=array(r.rawPoints,0,protocol);}
 else{
  if([r.flags.empty,r.flags.identical,r.flags.parallel].some(v=>typeof v!=="boolean")||!Number.isSafeInteger(r.rawPointCount)||r.rawPointCount<0||r.rawPointCount>FINITE_CURVE_READ_LIMITS.rawPoints)protocol("Invalid raw finite-curve result census");
  // This is the actual OCCT IsEmpty definition, not certified finite absence.
  if(r.flags.empty!==(r.rawPointCount===0&&!r.flags.identical))protocol("Raw OCCT IsEmpty differs from its actual report census");
  r.rawPoints=array(r.rawPoints,r.rawPointCount,protocol).map(value=>{const p=fields(value,["point","firstParameter","secondParameter","secondIsImplicit"],protocol);p.point=pair(p.point,protocol);if(!finite(p.firstParameter)||typeof p.secondIsImplicit!=="boolean"||(p.secondIsImplicit?p.secondParameter!==null:!finite(p.secondParameter)))protocol("Invalid actual raw point/parameter report");return freeze(p);});
 }
 return bounded(r);
}
// This captures only a data packet. It grants NO permission to accept it after
// a thrown/missing/duplicate exchange: the Root invocation owner decides first.
export function captureFiniteCurveReadError(value){const r=fields(value,["version","error"],protocol);if(r.version!==1||!FINITE_CURVE_READ_ERROR_CODES.includes(r.error))protocol("Unknown finite-curve Native error packet");return bounded(r);}
