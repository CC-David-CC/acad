import {requireCadEngineBuild} from '../mount/engineCatalog.mjs';

const fail=(code,message)=>{throw Object.assign(Error(message),{code});};
function data(value,key,allowArray=false){
 const d=value&&typeof value==='object'&&(allowArray||!Array.isArray(value))?Object.getOwnPropertyDescriptor(value,key):null;
 if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('INVALID_OPERAND','Operand runtime inspection is unavailable.');
 return d.value;
}
function outputBuild(output,engine){
 if(data(output,'engine')!==engine)fail('INVALID_OPERAND','The current outputs use a different engine.');
 const runtime=data(data(output,'metrics'),'runtime'),js=data(runtime,'jsSha256'),wasm=data(runtime,'wasmSha256');
 if(typeof js!=='string'||!/^[a-f0-9]{64}$/.test(js)||typeof wasm!=='string'||!/^[a-f0-9]{64}$/.test(wasm))fail('ENGINE_REVISION_MISMATCH','The operand runtime is unavailable.');
 const build=requireCadEngineBuild(engine,'sha256:'+js+':'+wasm);
 if(data(runtime,'mountEngine')!==build.mountEngine||data(runtime,'representation')!==build.representation)fail('ENGINE_BINDING_MISMATCH','The operand runtime does not match its registered engine.');
 return build;
}
// New geometry continues the current generic part's build. An empty workspace
// uses its declared default; an empty native RESULT still owns its build.
// Neither case converts or re-evaluates an existing result with another build.
export function selectSolidContinuationBuild(outputs,engine,defaultRevision){
 const initial=requireCadEngineBuild(engine,defaultRevision);
 if(!Array.isArray(outputs)||outputs.length>16384)fail('INVALID_OPERAND','Current solid runtime inspection is unavailable.');
 let selected=null;const seen=new Set();
 for(let i=0;i<outputs.length;i++){
  const output=data(outputs,String(i),true),id=data(output,'outputId');
  if(typeof id!=='string'||!id||seen.has(id))fail('INVALID_OPERAND','Current output identities are unavailable.');
  seen.add(id);const build=outputBuild(output,engine);
  if(selected&&selected.revision!==build.revision)fail('ENGINE_REVISION_MISMATCH','Current outputs must use one engine build.');
  selected=build;
 }
 return selected||initial;
}
// The coordinator supplies its current read-only inspection, never caller
// geometry or a fallback build. Empty outputs retain their native runtime too.
export function selectSolidOperandBuild(outputs,engine,a,b){
 if(!Array.isArray(outputs)||outputs.length>16384||typeof a!=='string'||!a||typeof b!=='string'||!b||a===b)fail('INVALID_OPERAND','Select two distinct current operands.');
 const found=new Map();
 for(let i=0;i<outputs.length;i++){
  const output=data(outputs,String(i),true),id=data(output,'outputId');
  if(id!==a&&id!==b)continue;
  if(found.has(id)||data(output,'engine')!==engine)fail('INVALID_OPERAND','The selected operands are unavailable.');
  found.set(id,outputBuild(output,engine));
 }
 if(found.size!==2)fail('INVALID_OPERAND','The selected operands are unavailable.');
 const left=found.get(a),right=found.get(b);
 if(left.revision!==right.revision)fail('ENGINE_REVISION_MISMATCH','Boolean operands must use the same engine build.');
 return left;
}
