// Worker-only, optional local differential estimate. It neither mutates the
// accepted system nor changes admission, and is not a proof of redundancy.
const LIMIT=128, VISITS=4096, DERIVATIVE_WORK=262144, LOW=1e-12, HIGH=1e-8;
const unavailable=reason=>Object.freeze({version:1,status:'unavailable',reason});
export function inspectLocalJacobian(stages){
 if(!Array.isArray(stages)||stages.length!==1)return unavailable('unsupported-stages');
 return inspectStage(stages[0],{visits:0,variables:0,equations:0,derivativeWork:0},null);
}
// Stage-local tangent-space estimates at the accepted solution. Earlier-stage
// parameters are fixed in each later report; never sum these into a project
// DOF or infer global solvability. Keep one shared diagnostic work budget.
export function inspectStageLocalJacobians(stages,groundStage=null){
 if(!Array.isArray(stages)||stages.length<1||stages.length>32)return unavailable('unsupported-stages');
 const budget={visits:0,variables:0,equations:0,derivativeWork:0},prior=new Set(groundStage?[groundStage]:[]),reports=[];
 for(let i=0;i<stages.length;i++){
  const stage=stages[i],localJacobian=inspectStage(stage,budget,prior);
  reports.push(Object.freeze({stage:i,localJacobian}));prior.add(stage);
 }
 return Object.freeze({version:1,status:'stage-local',scope:'stage-local-fixed-inputs',physicalDof:null,stages:Object.freeze(reports)});
}
function inspectStage(stage,budget,prior){
 try{
  if(budget.visits>VISITS||budget.variables>LIMIT||budget.equations>LIMIT||budget.derivativeWork>DERIVATIVE_WORK)return unavailable('limit');
  const system=stage?.solverSystem;if(!system?.solveStatus?.success||!Number.isFinite(system.solveStatus.error))return unavailable('solve-not-established');
  const objects=stage.objects,all=system.allConstraints;if(!objects||typeof objects[Symbol.iterator]!=='function'||!Array.isArray(all)||all.length>LIMIT)return unavailable('limit');
  const own=new Set();const add=p=>{if(++budget.visits>VISITS||!p||typeof p.get!=='function'||!Number.isFinite(p.get()))throw Error('limit-or-nonfinite');if(!own.has(p)){own.add(p);if(++budget.variables>LIMIT)throw Error('limit-or-nonfinite')}};
  for(const o of objects){if(typeof o?.visitParams!=='function')return unavailable('unsupported-object');o.visitParams(add)}
  const external=new Set();for(const c of all){if(system.conflicting.has(c)&&!system.redundant.has(c))return unavailable('conflicting-constraint');if(!Array.isArray(c.objects)||!Array.isArray(c.params))return unavailable('unsupported-constraint');for(const o of c.objects)if(!system.owns(o)){if(prior&&!prior.has(o?.stage))return unavailable('non-prior-external-stage');if(typeof o?.visitParams!=='function')return unavailable('unsupported-object');o.visitParams(p=>{if(++budget.visits>VISITS)throw Error('limit');external.add(p)})}}
  for(const p of external)if(own.has(p))return unavailable('shared-external-parameter');
  let auxiliary=0;for(const c of all)for(const p of c.params)if(!external.has(p)&&!own.has(p)){add(p);auxiliary++}
  for(const p of own)if(Array.isArray(p.constraints)&&p.constraints.length)return unavailable('inequality-domain');
  const params=[...own],columns=new Map(params.map((p,i)=>[p,i])),polynomials=[],origins=[],groups=[];let authoredIndex=0;
  for(let constraintIndex=0;constraintIndex<all.length;constraintIndex++){const c=all[constraintIndex],id=c?.schema?.id,debugId=c?.id;if(typeof id!=='string'||!id||id.length>128||typeof debugId!=='string'||debugId.length>256)return unavailable('unsupported-constraint');const current=c.internal?null:authoredIndex++,before=polynomials.length;c.collectPolynomials(polynomials);budget.equations+=polynomials.length-before;if(budget.equations>LIMIT)return unavailable('limit');const indices=[];for(let i=before;i<polynomials.length;i++){indices.push(i);origins.push(Object.freeze({constraintIndex,authoredIndex:current,constraintId:debugId,typeId:id,internal:!!c.internal}))}if(!c.internal)groups.push(Object.freeze({constraintIndex,authoredIndex:current,constraintId:debugId,typeId:id,rows:Object.freeze(indices)}));}
  const rows=[];for(const poly of polynomials){const row=new Array(params.length).fill(0),terms=new Set();let unowned=false;poly.visitParams(p=>{if(++budget.visits>VISITS)throw Error('limit');if(columns.has(p))terms.add(p);else if(!external.has(p))unowned=true});if(unowned)return unavailable('unowned-polynomial-parameter');if(!Array.isArray(poly.monomials))return unavailable('unsupported-polynomial');let cost=0;for(const m of poly.monomials){if(!Array.isArray(m.terms))return unavailable('unsupported-polynomial');cost+=1+m.terms.length;if(cost>DERIVATIVE_WORK)return unavailable('derivative-limit')}budget.derivativeWork+=cost*terms.size;if(budget.derivativeWork>DERIVATIVE_WORK)return unavailable('derivative-limit');for(const param of terms){let value=0;for(const monomial of poly.monomials)value+=monomial.differentiate(param,p=>p.get());if(!Number.isFinite(value))return unavailable('nonfinite-gradient');row[columns.get(param)]=value}rows.push(row)}
  const result=rankLocalJacobian(rows,params.length,{origins,groups});return result.status==='unavailable'?result:Object.freeze({...result,auxiliaryVariables:auxiliary,fixedExternalVariables:external.size,rowOrigins:Object.freeze(origins)});
 }catch{return unavailable('unsupported-or-limit')}
}
// Independent rows are selected by pivoted, twice-reorthogonalized MGS. Row
// and column equilibration change units only numerically, never authored data.
export function rankLocalJacobian(input,variableCount,ordered=null){
 if(!Number.isInteger(variableCount)||variableCount<0||variableCount>LIMIT||!Array.isArray(input)||input.length>LIMIT)return unavailable('limit');
 const rows=[],zero=[],nearZero=[];for(let i=0;i<input.length;i++){const row=input[i];if(!Array.isArray(row)||row.length!==variableCount||Array.from({length:row.length},(_,j)=>Object.hasOwn(row,j)&&Number.isFinite(row[j])).some(x=>!x))return unavailable('invalid-matrix');const norm=Math.hypot(...row);if(!Number.isFinite(norm))return unavailable('nonfinite-gradient');if(norm>0&&norm<=LOW)nearZero.push(i);if(norm===0){zero.push(i);rows.push(row.map(()=>0))}else{const scaled=row.map(x=>x/norm);if(scaled.some((x,j)=>x===0&&row[j]!==0))return unavailable('scaling-underflow');rows.push(scaled)}}
 for(let j=0;j<variableCount;j++){let max=0;for(const row of rows)max=Math.max(max,Math.abs(row[j]));if(max>0)for(const row of rows){const prior=row[j];row[j]/=max;if(row[j]===0&&prior!==0)return unavailable('scaling-underflow');}}
 for(const row of rows){const n=Math.hypot(...row);if(n>0)for(let j=0;j<row.length;j++){const prior=row[j];row[j]/=n;if(row[j]===0&&prior!==0)return unavailable('scaling-underflow');}}
 const factor=threshold=>{const pending=rows.map((row,index)=>({row:row.slice(),index}));let count=0;while(pending.length){let best=-1,bestNorm=-1;for(let i=0;i<pending.length;i++){const n=Math.hypot(...pending[i].row);if(n>bestNorm){best=i;bestNorm=n}}if(bestNorm<=threshold)break;const q=pending[best].row.map(x=>x/bestNorm);pending.splice(best,1);count++;for(const item of pending)for(let pass=0;pass<2;pass++){let dot=0;for(let j=0;j<variableCount;j++)dot+=item.row[j]*q[j];for(let j=0;j<variableCount;j++)item.row[j]-=dot*q[j];}}return {rank:count,dependent:pending.map(v=>v.index).sort((a,b)=>a-b)}};
 const lower=factor(HIGH),upper=factor(LOW),ambiguous=lower.rank!==upper.rank,status=zero.length?'zero-gradient':nearZero.length?'near-zero-gradient':ambiguous?'ambiguous':'estimated';
 let orderedContribution;
 if(ordered){
  const {origins,groups}=ordered;if(!Array.isArray(origins)||origins.length!==rows.length||!Array.isArray(groups))return unavailable('invalid-groups');
  const baseline=origins.flatMap((o,i)=>o.internal?[i]:[]),sequences=[baseline,...groups.map(g=>g.rows)],seen=new Set();for(const group of sequences)for(const i of group){if(!Number.isInteger(i)||i<0||i>=rows.length||seen.has(i))return unavailable('invalid-groups');seen.add(i)}if(seen.size!==rows.length)return unavailable('invalid-groups');
  const process=threshold=>{const basis=[],prefix=[];for(const group of sequences){const pending=group.map(i=>rows[i].slice());while(pending.length){let best=-1,bestNorm=-1,bestVector=null;for(let i=0;i<pending.length;i++){const v=pending[i].slice();for(let pass=0;pass<2;pass++)for(const q of basis){let dot=0;for(let j=0;j<variableCount;j++)dot+=v[j]*q[j];for(let j=0;j<variableCount;j++)v[j]-=dot*q[j]}const n=Math.hypot(...v);if(n>bestNorm){best=i;bestNorm=n;bestVector=v}}if(bestNorm<=threshold)break;basis.push(bestVector.map(x=>x/bestNorm));pending.splice(best,1)}prefix.push(basis.length)}return prefix};
  const lo=process(HIGH),hi=process(LOW);let uncertain=lo.at(-1)!==lower.rank||hi.at(-1)!==upper.rank;const entries=sequences.map((indices,i)=>{const beforeLo=i?lo[i-1]:0,beforeHi=i?hi[i-1]:0;uncertain=uncertain||indices.some(j=>zero.includes(j)||nearZero.includes(j))||lo[i]!==hi[i]||lo[i]<beforeLo||hi[i]<beforeHi||lo[i]>hi[i];const safe=!uncertain;return Object.freeze({status:safe?'estimated':'unknown',rankLower:lo[i],rankUpper:hi[i],increment:safe?lo[i]-beforeLo:null})});
  orderedContribution=Object.freeze({baseline:entries[0],groups:Object.freeze(groups.map((group,i)=>Object.freeze({constraintIndex:group.constraintIndex,authoredIndex:group.authoredIndex,constraintId:group.constraintId,typeId:group.typeId,...entries[i+1]})))});
 }
 return Object.freeze({version:1,status,variables:variableCount,equations:rows.length,rank:ambiguous?null:lower.rank,rankLower:lower.rank,rankUpper:upper.rank,localNullity:ambiguous?null:variableCount-lower.rank,nullityLower:variableCount-upper.rank,nullityUpper:variableCount-lower.rank,dependentRows:ambiguous?null:Object.freeze(lower.dependent),zeroGradientRows:Object.freeze(zero),nearZeroGradientRows:Object.freeze(nearZero),thresholds:Object.freeze({low:LOW,high:HIGH}),method:'equilibrated-pivoted-mgs2',...(orderedContribution?{orderedContribution}:{})});
}
