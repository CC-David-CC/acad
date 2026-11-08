// Private actual numerical observations, never solve/admission authority.
// Enumerable symbol ownership survives existing solve-status snapshot spreads.
const KEY=Symbol('actual-solver-termination'),issued=new WeakSet(),MAX=8;
const reasons=new Set(['residual','gradient','iteration-limit','trust-radius','divergence','invalid-state','empty','orthogonality','checker','cost-and-parameter-relative','cost-relative','parameter-relative','machine-cost-limit','machine-parameter-limit','machine-orthogonality-limit','nonfinite-jacobian','evaluation-limit','exception']);
const numbers=['iterations','evaluations','parameters','rows','residualInf','gradientInf','orthogonality','acceptedStepNorm','trustRadius','residualTolerance','gradientTolerance','stepTolerance','costRelativeTolerance','parameterRelativeTolerance','orthogonalityTolerance'];
function capture(input){
 if(!input||typeof input!=='object')return undefined;
 const data=key=>{const d=Object.getOwnPropertyDescriptor(input,key);return d&&Object.hasOwn(d,'value')?d.value:undefined;};
 const method=data('method'),reason=data('reason');
 if(!['dogleg','lm'].includes(method)||!reasons.has(reason))return undefined;
 const out={method,reason,acceptedState:data('acceptedState')===true};
 for(const key of numbers){const value=data(key);if(value===null||typeof value==='number'&&Number.isFinite(value)&&value>=0)out[key]=value;}
 return Object.freeze(out);
}
function publish(status,total,entries){
 const report=Object.freeze({version:1,total,entries:Object.freeze(entries)});issued.add(report);
 Object.defineProperty(status,KEY,{value:report,enumerable:true,configurable:true});
}
export function clearSolveTermination(status){if(status&&typeof status==='object')delete status[KEY];}
export function attachSolveTermination(status,attempts){
 const entries=[];for(const input of attempts.slice(0,2)){const row=capture(input);if(row)entries.push(row);}
 publish(status,entries.length,entries);
}
export function getSolveTermination(status){
 if(!status||typeof status!=='object')return undefined;
 const d=Object.getOwnPropertyDescriptor(status,KEY),report=d&&Object.hasOwn(d,'value')?d.value:undefined;
 return report&&issued.has(report)?report:undefined;
}
export function mergeSolveTerminations(status,sources){
 let total=0;const entries=[];
 for(let isolation=0;isolation<sources.length;isolation++){
  const report=getSolveTermination(sources[isolation]);if(!report)continue;total+=report.total;
  for(const row of report.entries)if(entries.length<MAX)entries.push(Object.freeze({isolation,...row}));
 }
 publish(status,total,entries);
}
// Bounded text only: no identifiers, equations, source, stack or parameter arrays.
export function formatSolveTerminations(stages){
 let total=0;const rows=[];
 for(const item of stages){total+=item.termination.total;for(const row of item.termination.entries)if(rows.length<3){
  rows.push(row.method+':'+row.reason+' i='+row.iterations+' e='+row.evaluations+' r='+row.residualInf+(row.method==='lm'?' o='+row.orthogonality:' g='+row.gradientInf));
 }}
 return rows.length?(' Stops('+total+'): '+rows.join('; ')).slice(0,220):'';
}
