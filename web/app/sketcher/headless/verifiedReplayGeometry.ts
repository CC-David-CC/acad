import {HeadlessSketchWorkspace} from './workspace';
import {sameRestoredSketch} from '../historyEquivalence.mjs';
import {CURRENT_DIAGNOSTIC_POSITION_TOLERANCE_MM} from './diagnosticGeometry.mjs';
const POSITION=CURRENT_DIAGNOSTIC_POSITION_TOLERANCE_MM,ANGLE=1e-8,MIN=1e-9,TAU=2*Math.PI,WORK=100000;
const fail=(code:string,message:string):never=>{throw Object.assign(Error(message),{code});};
const count=(value:number)=>{if(value>WORK)fail('LIMIT','Verified sketch replay exceeds its bounded geometry work.');};
const withoutAdmission=(s:any)=>({...s,stages:s.stages.map(stage=>({...stage,constraints:stage.constraints.map(c=>{const row={...c};delete row.admission;return row;})}))});
const authored=(stage:any)=>stage.algNumSystem.allConstraints.filter(c=>!c.internal);

function admittedHint(value:any){
 if(!value||typeof value!=='object'||Array.isArray(value)||Reflect.ownKeys(value).length!==2)return false;
 const version=Object.getOwnPropertyDescriptor(value,'version'),state=Object.getOwnPropertyDescriptor(value,'state');
 return version?.enumerable&&Object.hasOwn(version,'value')&&version.value===1&&state?.enumerable&&Object.hasOwn(state,'value')&&['accepted','redundant'].includes(state.value);
}


// All calls occur inside production sketch Workers, after genuine solve success.
// The support graph uses actual native model parameter identities and original
// polynomial dependencies, never a numerical rank or a public permission flag.
function support(sketch:any,externalParameters:any,seed?:{stage:number,index:number}){
 const workspace=new HeadlessSketchWorkspace(externalParameters);workspace.io._loadSketch(structuredClone(sketch),{strict:true});
 const stages=workspace.parametricManager.stages,index=workspace.createIndex(),adjacency=new Map<any,any[]>(),seeds=new Set<any>();let work=0,selected=false;
 for(let si=0;si<stages.length;si++){
  const stage=stages[si],rows=authored(stage),chosen=seed&&si===seed.stage?rows[seed.index]:null;
  for(const c of stage.algNumSystem.allConstraints){
   count(++work);
   if(c.internal&&!['Polar','ArcConsistency'].includes(c.schema.id))continue;
   if(stage.algNumSystem.conflicting.has(c)&&!stage.algNumSystem.redundant.has(c))fail('ADMISSION_CHANGED','A replay support constraint is rejected.');
   const equations=[];c.collectPolynomials(equations);
   for(const equation of equations){
    const params=new Set<any>();equation.visitParams(p=>{count(++work);params.add(p);});
    const group=[...params];
    for(const p of group){const links=adjacency.get(p)||[];links.push(group);adjacency.set(p,links);if(!c.internal&&(!seed||c===chosen))seeds.add(p);}
   }
   if(c===chosen)selected=true;
  }
 }
 if(seed&&(!Number.isSafeInteger(seed.stage)||!Number.isSafeInteger(seed.index)||seed.stage<0||seed.index<0||!selected))fail('INTENT_CHANGED','The actual operation row is unavailable for replay support.');
 const reached=new Set(seeds),pending=[...seeds];
 for(let at=0;at<pending.length;at++)for(const group of adjacency.get(pending[at])||[])for(const p of group){count(++work);if(!reached.has(p)){reached.add(p);pending.push(p);}}
 const fields=new Map<string,Set<string>>();
 for(const row of sketch.objects){
  count(++work);const object=index[row.id],allowed=new Set<string>(),point=(p:any,prefix:string)=>{for(const k of['x','y'])if(p?.params?.[k]&&reached.has(p.params[k]))allowed.add(prefix+k);};
  if(row.type==='Point')point(object,'');
  else if(row.type==='Segment'){point(object.a,'a.');point(object.b,'b.');}
  else if(row.type==='Circle'){point(object.c,'c.');if(reached.has(object.r))allowed.add('r');}
  else if(row.type==='Arc'){point(object.a,'a.');point(object.b,'b.');point(object.c,'c.');}
  // Other carried geometry has no newly qualified equivalence policy.
  fields.set(row.id,allowed);
 }
 return fields;
}
function compareData(before:any,after:any,fields:Map<string,Set<string>>,bounded:boolean){
 if(!Array.isArray(before.objects)||!Array.isArray(after.objects)||before.objects.length!==after.objects.length||before.objects.length>10000)fail('INTENT_CHANGED','Replay changed sketch object membership.');
 let work=0;
 for(let i=0;i<before.objects.length;i++){
  const a=before.objects[i],b=after.objects[i];if(a.id!==b.id||a.type!==b.type)fail('INTENT_CHANGED','Replay changed sketch object identity or ordering.');
  const pending:any[]=[[a.data,b.data,[]]],allowed=fields.get(a.id)||new Set();let changed=false;
  while(pending.length){
   const [x,y,path]=pending.pop();count(++work);if(path.length>64)fail('LIMIT','Replay geometry nesting exceeds its bound.');
   if(Object.is(x,y))continue;
   if(typeof x==='number'||typeof y==='number'){
    const name=path.join('.');
    if(!allowed.has(name))fail('CURRENT_GEOMETRY_MISMATCH','Replay changed an unrelated or unsupported authored field: '+a.id+'.'+name);
    if(typeof x!=='number'||typeof y!=='number'||!Number.isFinite(x)||!Number.isFinite(y))fail('CURRENT_GEOMETRY_MISMATCH','Replay produced nonfinite analytic geometry.');
    if(bounded&&Math.abs(x-y)>POSITION)fail('CURRENT_GEOMETRY_MISMATCH','Replay analytic position differs beyond the existing1e-9mm save bound: '+a.id+'.'+name+' (before='+x+', after='+y+', delta='+Math.abs(x-y)+'mm)');
    changed=true;continue;
   }
   if(x===null||y===null||typeof x!=='object'||typeof y!=='object'||Array.isArray(x)!==Array.isArray(y))fail('INTENT_CHANGED','Replay changed authored shape data.');
   const ax=Object.keys(x).sort(),ay=Object.keys(y).sort();if(ax.length!==ay.length||ax.some((k,j)=>k!==ay[j]))fail('INTENT_CHANGED','Replay changed authored shape fields.');
   for(const key of ax)pending.push([x[key],y[key],[...path,key]]);
  }
  if(bounded&&changed)branch(a,b);
 }
}
function branch(a:any,b:any){
 const angle=(p:any,c:any)=>Math.atan2(p.y-c.y,p.x-c.x),normalized=(v:number)=>(v%TAU+TAU)%TAU;
 // Compare directions on the circle:0 and2*pi (or pi and-pi) are the
 // same directed branch. Subtracting separately wrapped values falsely rejects
 // a tiny numerical crossing of that seam; the angular bound is unchanged.
 const sameDirection=(u:number,v:number)=>Number.isFinite(u)&&Number.isFinite(v)&&Math.abs(Math.atan2(Math.sin(u-v),Math.cos(u-v)))<=ANGLE;
 const radius=(p:any,c:any)=>Math.hypot(p.x-c.x,p.y-c.y),full=(d:any)=>Math.abs(d.a.x-d.b.x)<1e-6&&Math.abs(d.a.y-d.b.y)<1e-6;
 const x=a.data,y=b.data;
 if(a.type==='Segment'){
  if(radius(x.b,x.a)<=MIN||radius(y.b,y.a)<=MIN||!sameDirection(angle(x.b,x.a),angle(y.b,y.a)))fail('CURRENT_GEOMETRY_MISMATCH','Replay changed a segment domain or directed angular branch.');
 }else if(a.type==='Circle'){
  if(!(x.r>MIN&&y.r>MIN))fail('CURRENT_GEOMETRY_MISMATCH','Replay changed a positive circle radius domain.');
 }else if(a.type==='Arc'){
  const xf=full(x),yf=full(y),xa=angle(x.a,x.c),xb=angle(x.b,x.c),ya=angle(y.a,y.c),yb=angle(y.b,y.c),xs=xf?TAU:normalized(xb-xa),ys=yf?TAU:normalized(yb-ya);
  if(radius(x.a,x.c)<=MIN||radius(x.b,x.c)<=MIN||radius(y.a,y.c)<=MIN||radius(y.b,y.c)<=MIN||xf!==yf||!(xs>0&&ys>0)||!sameDirection(xa,ya)||!sameDirection(xb,yb)||(xs>Math.PI)!==(ys>Math.PI)||Math.abs(xs-ys)>ANGLE)fail('CURRENT_GEOMETRY_MISMATCH','Replay changed an Arc radius, CCW interval or full-circle/major branch.');
 }
}
function evidence(after:any,rows:any[]){
 let at=0;if(!Array.isArray(rows)||rows.length>10000)fail('ADMISSION_CHANGED','Verified replay evidence is unavailable.');
 for(const stage of after.stages)for(const c of stage.constraints){const row=rows[at++];if(!row||row.typeId!==c.typeId||!['accepted','redundant'].includes(row.state)||!admittedHint(c.admission)||c.admission.state!==row.state)fail('ADMISSION_CHANGED','Serialized replay admission differs from actual solved classification.');}
 if(at!==rows.length)fail('ADMISSION_CHANGED','Verified replay evidence membership changed.');
}
export function assertVerifiedReplayGeometry(before:any,after:any,rows:any[],externalParameters:any,seed?:{stage:number,index:number}){
 evidence(after,rows);
 const restored={...after,objects:after.objects.map((o,i)=>({...o,data:before.objects[i]?.data}))};
 if(!sameRestoredSketch(JSON.stringify(withoutAdmission(before)),JSON.stringify(withoutAdmission(restored))))fail('INTENT_CHANGED','Verified replay changed exact authored sketch intent.');
 for(const stage of before.stages)for(const c of stage.constraints)if(c.admission!==undefined&&!admittedHint(c.admission))fail('ADMISSION_CHANGED','The replay source contains unadmitted constraint intent.');
 if(sameRestoredSketch(JSON.stringify(before),JSON.stringify(after)))return true;
 compareData(before,after,support(before,externalParameters,seed),true);return true;
}
// Mutation may move its actually connected component by the requested amount;
// everything outside that component must remain bit-exact even before solving.
export function assertUnrelatedSignedGeometry(before:any,after:any,externalParameters:any,seed:{stage:number,index:number}){
 compareData(before,after,support(after,externalParameters,seed),false);
}
