import {evaluateMath,parseMathDefinitions,validVariableName} from 'gems/safeExpression.mjs';

export const LEGACY_SOURCE_LIMIT=65536;
// Worker-only evaluation: retains legacy scalar values and field-defined units.
export function evaluateLegacyNumericSource(source){
 if(typeof source!=='string'||source.length>LEGACY_SOURCE_LIMIT||new TextEncoder().encode(source).byteLength>LEGACY_SOURCE_LIMIT)throw Error('Legacy expression source exceeds the supported 64 KiB limit.');
 const result=parseMathDefinitions(source);
 if(result.errors.length){const error=Object.assign(Error(result.errors.map(e=>`Line ${e.line+1}: ${e.message}`).join('\n')),{code:'LEGACY_EXPRESSION_INVALID'});throw error;}
 if(result.varList.length>256||result.varList.some(row=>!Number.isFinite(row.value)||Math.abs(row.value)>1e9))throw Error('Legacy expressions require at most 256 finite values bounded by 1e9.');
 return result;
}
// Validate the private pinned Worker's data without parsing the source on the UI
// thread. The command binds revision, exact source and old table before using it.
function dataRecord(value,keys){
 if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value))||Reflect.ownKeys(value).length!==keys.length)throw Error('Invalid legacy expression response.');
 const out=Object.create(null);for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))throw Error('Invalid legacy expression response.');out[key]=d.value;}return out;
}
function dataArray(value,limit){if(!Array.isArray(value)||value.length>limit||Reflect.ownKeys(value).length!==value.length+1)throw Error('Invalid legacy expression array.');const out=[];for(let i=0;i<value.length;i++){const d=Object.getOwnPropertyDescriptor(value,String(i));if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))throw Error('Invalid legacy expression array.');out.push(d.value);}return out;}
function captureFrame(value){
 const frame=dataRecord(value,['origin','x','y','z']);for(const key of ['origin','x','y','z']){const a=dataArray(frame[key],3);if(a.length!==3||a.some(v=>typeof v!=='number'||!Number.isFinite(v)||Math.abs(v)>1e9))throw Error('Invalid legacy response frame.');frame[key]=Object.freeze(a);}
 const dot=(a,b)=>a.reduce((sum,v,i)=>sum+v*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],tol=1e-9;
 if(['x','y','z'].some(k=>Math.abs(dot(frame[k],frame[k])-1)>tol)||Math.abs(dot(frame.x,frame.y))>tol||Math.abs(dot(frame.x,frame.z))>tol||Math.abs(dot(frame.y,frame.z))>tol||cross(frame.x,frame.y).some((v,i)=>Math.abs(v-frame.z[i])>tol))throw Error('Invalid legacy response frame.');return Object.freeze(frame);
}
export function captureLegacyExpressionResponse(response,revision,sourceOnly){
 const ok=Object.getOwnPropertyDescriptor(response||{},'ok');if(!ok?.enumerable||!Object.prototype.hasOwnProperty.call(ok,'value'))throw Error('Invalid legacy expression response.');
 if(ok.value===false){const row=dataRecord(response,['revision','ok','error']),error=dataRecord(row.error,['code','message']);if(row.revision!==revision||typeof error.code!=='string'||typeof error.message!=='string')throw Error('Invalid legacy expression failure.');return Object.freeze({revision,ok:false,error:Object.freeze({...error})});}
 const row=dataRecord(response,['revision','ok','result','serializedSketch','boundaryFrame']),result=dataRecord(row.result,['version','kind','values']);if(row.revision!==revision||row.ok!==true||result.version!==1||result.kind!=='legacy-numeric-v1')throw Error('Invalid legacy expression response.');
 const values=[],seen=new Set();for(const value of dataArray(result.values,256)){const item=dataRecord(value,['name','value']);if(!validVariableName(item.name)||seen.has(item.name)||typeof item.value!=='number'||!Number.isFinite(item.value)||Math.abs(item.value)>1e9)throw Error('Invalid legacy expression value.');seen.add(item.name);values.push(Object.freeze({...item}));}
 let frame=null;if(sourceOnly){if(row.serializedSketch!==null||row.boundaryFrame!==null)throw Error('Invalid source-only legacy response.');}else{if(typeof row.serializedSketch!=='string'||row.serializedSketch.length>1048576||new TextEncoder().encode(row.serializedSketch).byteLength>1048576)throw Error('Invalid legacy sketch response.');frame=captureFrame(row.boundaryFrame);}
 return Object.freeze({revision,ok:true,result:Object.freeze({version:1,kind:'legacy-numeric-v1',values:Object.freeze(values)}),serializedSketch:row.serializedSketch,boundaryFrame:frame});
}
export function captureLegacyNumericValues(response,revision){return captureLegacyExpressionResponse(response,revision,Object.getOwnPropertyDescriptor(response||{},'serializedSketch')?.value===null).result.values;}
export function createLegacyExpressionFacade(base,source,response,revision){
 if(!base||typeof source!=='string'||source.length>LEGACY_SOURCE_LIMIT)throw Error('Invalid legacy expression publication.');
 const list=captureLegacyNumericValues(response,revision),table=Object.create(null);for(const row of list)table[row.name]=row.value;Object.freeze(table);
 const facade=Object.create(base),snapshot=(value,stream)=>Object.freeze({value,revision:stream?.revision});
 Object.defineProperty(facade,'isTyped',{value:false});
 Object.assign(facade,{script$:snapshot(source,base.script$),list$:snapshot(list,base.list$),table$:snapshot(table,base.table$),errors$:snapshot(Object.freeze([]),base.errors$),hasCurrentPhysicalResult:()=>false,
 evaluateExpression(value){if(typeof value==='number'){if(!Number.isFinite(value))throw Error('A finite legacy expression is required.');return value;}return Object.prototype.hasOwnProperty.call(table,value)?table[value]:evaluateMath(value,table);}});
 return Object.freeze(facade);
}
