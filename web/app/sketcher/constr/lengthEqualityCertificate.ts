import {withAdmissionCause,admissionCause} from './admissionCause.mjs';
import {assertRegisteredConstraintDomain,registeredResidualProfile} from './registeredConstraintPolicy.mjs';
// Connectivity of actual ORIGINAL |Segment.t| atoms proves implication. Current
// residuals below validate retained witnesses; they never establish dependence.
export function createLengthEqualityCertificate(system:any,definitions:any){
 const parent=new Map<any,any>(),edges=new Map<any,any[]>(),owned=new Set(system.allConstraints);let work=0,validationPass:any=null;
 const charge=()=>{if(++work>100000)throw withAdmissionCause(Object.assign(Error('Length equality certificate exceeds its work budget.'),{code:'RESOURCE_LIMIT'}),admissionCause('resource-limit'));};
 const find=(p:any)=>{charge();if(!parent.has(p))parent.set(p,p);let root=p;const trail=[];while(parent.get(root)!==root){charge();trail.push(root);root=parent.get(root);}for(const item of trail)parent.set(item,root);return root;};
 const literal=(v:any,n:number)=>typeof v==='number'?v===n:typeof v==='string'&&v.trim()!==''&&Number.isFinite(Number(v))&&Number(v)===n&&parseFloat(v)===n;
 function atom(c:any){
  charge();if(!owned.has(c)||c.stage?.algNumSystem!==system||c.internal||c.objects.length!==2||c.objects[0]===c.objects[1]||c.params.length!==2)return null;
  if(c.schema===definitions.EqualLength){if(c.constants&&Reflect.ownKeys(c.constants).length)return null;}
  else if(c.schema===definitions.LengthRelation){if(!c.constants||Object.keys(c.constants).sort().join(',')!=='factor,offset'||!literal(c.constants.factor,1)||!literal(c.constants.offset,0))return null;}
  else return null;
  for(let i=0;i<2;i++){charge();const o=c.objects[i];if(o.TYPE!=='Segment'||c.params[i]!==o.params?.t||!Number.isFinite(c.params[i].get())||c.params[i].get()===0)return null;}
  return c.params[0]===c.params[1]?null:[c.params[0],c.params[1]];
 }
 function capture(c:any){const pair=atom(c);return pair?{c,pair,objects:[...c.objects],constants:c.constants?{...c.constants}:null}:null;}
 function verify(w:any){
  const pair=atom(w.c);if(!pair||pair.some((p,i)=>p!==w.pair[i])||w.c.objects.some((o,i)=>o!==w.objects[i])||
    (w.c.constants?Object.keys(w.c.constants).sort().join(',')!==Object.keys(w.constants||{}).sort().join(',')||Object.keys(w.c.constants).some(k=>w.c.constants[k]!==w.constants[k]):w.constants!==null)||
    system.conflicting.has(w.c)&&!system.redundant.has(w.c))throw withAdmissionCause(Object.assign(Error('Original length-equality witness changed.'),{code:'RETAINED_VALIDATION_FAILED'}),admissionCause('retained-validation-failure'));
  w.c.resolveConstants(system.expressionResolver);assertRegisteredConstraintDomain(w.c);const equations=[];w.c.collectPolynomials(equations);charge();
  if(equations.length!==1)throw withAdmissionCause(Object.assign(Error('Original equality equation changed.'),{code:'RETAINED_VALIDATION_FAILED'}),admissionCause('retained-validation-failure'));
  const values=equations.map(e=>e.value()),profile=registeredResidualProfile(w.c,values);
  if(profile.residuals.some((v,i)=>!Number.isFinite(v)||Math.abs(v)>profile.tolerances[i]))throw withAdmissionCause(Object.assign(Error('Original equality witness residual failed.'),{code:'RESIDUAL'}),admissionCause('original-residual-failure'));
 }
 return{capture(c:any){const w=capture(c);if(!w)return null;try{verify(w);}catch(error){if(error?.code==='RESOURCE_LIMIT')throw error;return null;}const a=find(w.pair[0]),b=find(w.pair[1]);if(a!==b){parent.set(a,b);for(let i=0;i<2;i++){const list=edges.get(w.pair[i])||[];list.push({next:w.pair[1-i],witness:w});edges.set(w.pair[i],list);}return null;}
   // Forest excludes this candidate and all dependent cycles. Each original
   // support row remains a post-solve domain/residual/ownership obligation.
   const pending=[w.pair[0]],previous=new Map<any,any>([[w.pair[0],null]]);for(let at=0;at<pending.length&&!previous.has(w.pair[1]);at++)for(const edge of edges.get(pending[at])||[]){charge();if(!previous.has(edge.next)){previous.set(edge.next,{from:pending[at],witness:edge.witness});pending.push(edge.next);}}const supports=[];let cursor=w.pair[1];while(cursor!==w.pair[0]){charge();const edge=previous.get(cursor);if(!edge)throw withAdmissionCause(Object.assign(Error('Length equality forest lost its original path.'),{code:'RETAINED_VALIDATION_FAILED'}),admissionCause('retained-validation-failure'));supports.push(edge.witness);cursor=edge.from;}return(pass?:object)=>{if(pass!==validationPass||!pass){work=0;validationPass=pass||{};}for(const row of supports)verify(row);verify(w);};
 }};
}
