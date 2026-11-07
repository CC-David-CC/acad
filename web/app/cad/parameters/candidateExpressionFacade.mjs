import {decodePhysicalSource} from './physicalSource.mjs';
import {QuantityError} from './physicalQuantities.mjs';
// Internal only: caller must supply the response from its pinned Worker, bind
// request revision/lifetime and recheck before publishing. No public raw input.
export function createCandidateExpressionFacade(base,source,response,revision){
 const request=decodePhysicalSource(source);if(!request||!base||typeof revision!=='string'||!revision||!response||response.revision!==revision||response.ok!==true||response.result?.version!==1||!Array.isArray(response.result.values)||response.result.values.length!==request.definitions.length)throw new QuantityError('INVALID_INPUT','Invalid candidate parameter response.');
 const values=new Map(),list=[],scalar=Object.create(null);
 for(let i=0;i<request.definitions.length;i++){
  const definition=request.definitions[i],result=response.result.values[i];
  if(!definition||!result||typeof definition.name!=='string'||definition.name!==result.name||definition.dimension!==result.dimension||values.has(result.name)||!['scalar','length','area','volume','angle','count','boolean'].includes(result.dimension)||((result.dimension==='boolean')?typeof result.value!=='boolean':typeof result.value!=='number'||!Number.isFinite(result.value)||Math.abs(result.value)>1e12)||result.dimension==='count'&&(!Number.isSafeInteger(result.value)||result.value<0||result.value>1000000))throw new QuantityError('INVALID_INPUT','Invalid candidate parameter value.');
  values.set(result.name,Object.freeze({dimension:result.dimension,value:result.value}));list.push(Object.freeze({name:result.name,value:result.value,dimension:result.dimension}));if(result.dimension==='scalar')scalar[result.name]=result.value;
 }
 const facade=Object.create(base),table=Object.freeze(scalar);
 const stream=(value,original)=>Object.freeze({value,revision:original?.revision});
 Object.defineProperty(facade,'isTyped',{value:true});
 Object.assign(facade,{script$:stream(source,base.script$),list$:stream(Object.freeze(list),base.list$),table$:stream(table,base.table$),errors$:stream(Object.freeze([]),base.errors$),
  hasCurrentPhysicalResult(){return true;},
  evaluateExpression(){throw new QuantityError('EXPECTED_DIMENSION_REQUIRED','Typed parameters require a dimension-aware consumer.');},
  resolveQuantity(name,dimension){const value=values.get(name);if(!value)throw new QuantityError('UNKNOWN_PARAMETER','Unknown parameter.');if(value.dimension!==dimension)throw new QuantityError('DIMENSION_MISMATCH','Parameter dimension does not match the field.');return value.value;}});
 return Object.freeze(facade);
}
