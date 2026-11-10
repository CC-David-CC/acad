import {routeDrawingLeader} from './linkedPartDrawingRequirementForms.mjs';

// Worker-only paper presentation. Inputs are already source-bound projected
// anchors; this leaf neither measures the model nor changes authored labels.
const LIMIT=Object.freeze({dimensions:16,boxes:128,candidates:17,vertices:64,pathCharacters:8192,outputSegments:256,work:8000000,integerBits:1200,numbers:16384});
const resource=message=>{throw Object.assign(Error(message),{code:'RESOURCE_LIMIT'});};
const finite=n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=1e9;
const point=p=>Array.isArray(p)&&p.length===2&&p.every(finite);
const box=b=>b&&point(b.min)&&point(b.max)&&b.min.every((n,i)=>n<=b.max[i]);
const equal=(a,b)=>a[0]===b[0]&&a[1]===b[1];
const boxOf=points=>({min:[0,1].map(i=>Math.min(...points.map(p=>p[i]))),max:[0,1].map(i=>Math.max(...points.map(p=>p[i])))});
const overlap=(a,b)=>a.min[0]<b.max[0]&&a.max[0]>b.min[0]&&a.min[1]<b.max[1]&&a.max[1]>b.min[1];

// Exact predicates on represented paper coordinates. Floating lengths rank
// candidate lanes only; they never decide segment/text or line crossings.
function predicates(budget){
 const zero=BigInt(0),one=BigInt(1),b32=BigInt(32),b52=BigInt(52),data=new DataView(new ArrayBuffer(8)),cache=new Map();
 const charge=()=>{if(++budget.used>LIMIT.work)resource('Dimension layout exceeds its bounded paper work.');};
 function parts(n){
  charge();if(cache.has(n))return cache.get(n);
  if(!finite(n)||cache.size>=LIMIT.numbers)resource('Dimension layout exceeds its finite coordinate inventory.');
  data.setFloat64(0,n,false);const bits=(BigInt(data.getUint32(0,false))<<b32)|BigInt(data.getUint32(4,false)),exponent=Number((bits>>b52)&BigInt(2047));
  let m=bits&((one<<b52)-one),e=exponent?exponent-1075:-1074;if(exponent)m+=one<<b52;if(bits>>BigInt(63))m=-m;
  if(m===zero)e=0;const p={m,e};cache.set(n,p);return p;
 }
 function grid(values){
  const ps=values.map(parts),e=Math.min(0,...ps.filter(p=>p.m!==zero).map(p=>p.e));
  return ps.map(p=>{const n=p.m<<BigInt(p.e-e);if((n<zero?-n:n)>>BigInt(LIMIT.integerBits))resource('Dimension paper arithmetic exceeds its bounded grid.');return n;});
 }
 const orient=(a,b,c)=>{charge();return(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);};
 function rectangle(a,b,r,pad=.125){
  const q=grid([...a,...b,...r.min,...r.max,pad]),x=q.slice(0,2),y=q.slice(2,4),lo=[q[4]-q[8],q[5]-q[8]],hi=[q[6]+q[8],q[7]+q[8]];
  for(let i=0;i<2;i++)if((x[i]>y[i]?x[i]:y[i])<=lo[i]||(x[i]<y[i]?x[i]:y[i])>=hi[i])return false;
  const signs=[orient(x,y,lo),orient(x,y,[hi[0],lo[1]]),orient(x,y,hi),orient(x,y,[lo[0],hi[1]])];
  return !(signs.every(n=>n>=zero)||signs.every(n=>n<=zero));
 }
 function crossing(a,b,c,d){
  const q=grid([...a,...b,...c,...d]),x=q.slice(0,2),y=q.slice(2,4),u=q.slice(4,6),v=q.slice(6,8),p=orient(x,y,u),r=orient(x,y,v),s=orient(u,v,x),t=orient(u,v,y);
  const opposite=(n,m)=>n<zero&&m>zero||n>zero&&m<zero;
  if(opposite(p,r)&&opposite(s,t))return true;
  if(p===zero&&r===zero){const i=x[0]!==y[0]?0:1,lo1=x[i]<y[i]?x[i]:y[i],hi1=x[i]>y[i]?x[i]:y[i],lo2=u[i]<v[i]?u[i]:v[i],hi2=u[i]>v[i]?u[i]:v[i];return(lo1>lo2?lo1:lo2)<(hi1<hi2?hi1:hi2);}
  const between=(p,a,b)=>p.every((n,i)=>n>=(a[i]<b[i]?a[i]:b[i])&&n<=(a[i]>b[i]?a[i]:b[i]));
  // Shared true endpoints are permitted; an endpoint in another line's
  // interior remains a crossing. No near-coordinate merge is performed.
  if(p===zero&&between(u,x,y)&&!equal(c,a)&&!equal(c,b)||r===zero&&between(v,x,y)&&!equal(d,a)&&!equal(d,b)||s===zero&&between(x,u,v)&&!equal(a,c)&&!equal(a,d)||t===zero&&between(y,u,v)&&!equal(b,c)&&!equal(b,d))return true;
  return false;
 }
 return{rectangle,crossing,charge};
}

// Clip only NEW paper line segments around a declared text gutter. The
// original anchors remain separately retained in the dimension records.
function textGap(a,b,r){
 const lo=r.min.map(n=>n-1),hi=r.max.map(n=>n+1),delta=b.map((n,i)=>n-a[i]);let enter=0,leave=1;
 for(let i=0;i<2;i++){
  if(delta[i]===0){if(a[i]<lo[i]||a[i]>hi[i])return[[a,b]];continue;}
  const x=(lo[i]-a[i])/delta[i],y=(hi[i]-a[i])/delta[i];enter=Math.max(enter,Math.min(x,y));leave=Math.min(leave,Math.max(x,y));if(enter>leave)return[[a,b]];
 }
 if(leave<0||enter>1)return[[a,b]];
 const at=t=>a.map((n,i)=>n+t*delta[i]),out=[];
 if(enter>0)out.push([a,at(enter)]);if(leave<1)out.push([at(leave),b]);return out.filter(([x,y])=>!equal(x,y));
}
function port(start,r){
 if(start[0]<r.min[0])return{end:[r.min[0],(r.min[1]+r.max[1])/2],side:'left'};
 if(start[0]>r.max[0])return{end:[r.max[0],(r.min[1]+r.max[1])/2],side:'right'};
 if(start[1]<r.min[1])return{end:[(r.min[0]+r.max[0])/2,r.min[1]],side:'top'};
 if(start[1]>r.max[1])return{end:[(r.min[0]+r.max[0])/2,r.max[1]],side:'bottom'};
 return null;
}

export function layoutDrawingDimensions({sheet,dimensions,labelBoxes,captionBoxes,geometrySegments,geometryBounds,existingLeaders}){
 if(!sheet||![sheet.width,sheet.height].every(finite)||!Array.isArray(dimensions)||dimensions.length>LIMIT.dimensions||!Array.isArray(labelBoxes)||!Array.isArray(captionBoxes)||labelBoxes.length+captionBoxes.length>LIMIT.boxes||![...labelBoxes,...captionBoxes].every(box)||!Array.isArray(geometrySegments)||geometrySegments.length>200024||geometrySegments.some(s=>!Array.isArray(s)||s.length!==2||!s.every(point))||!Array.isArray(geometryBounds)||geometryBounds.length>12||!geometryBounds.every(box)||!Array.isArray(existingLeaders)||existingLeaders.length>442||existingLeaders.some(s=>!Array.isArray(s)||s.length!==2||!s.every(point)))resource('Dimension layout inputs exceed their bounded paper domain.');
 const budget={used:0},exact=predicates(budget),result=new Map(),lines=[...existingLeaders],leaderStrokes=[],identities=new Set();let outputSegments=0;
 const reserveStroke=segment=>{const b=boxOf(segment);leaderStrokes.push({min:b.min.map(n=>n-.25),max:b.max.map(n=>n+.25)});};
 existingLeaders.forEach(reserveStroke);
 for(const row of dimensions){
  if(!row||typeof row.dimensionId!=='string'||!row.dimensionId||identities.has(row.dimensionId)||!Array.isArray(row.ends)||row.ends.length!==2||!row.ends.every(point)||!point(row.label)||!box(row.labelBox))resource('Dimension layout requires complete actual anchor and label identities.');
  identities.add(row.dimensionId);
 }
 // Short dimensions take the nearer lanes first. Stable authored identity is
 // the tie breaker, independent of definition/source array traversal order.
 const ordered=[...dimensions].sort((a,b)=>Math.hypot(a.ends[1][0]-a.ends[0][0],a.ends[1][1]-a.ends[0][1])-Math.hypot(b.ends[1][0]-b.ends[0][0],b.ends[1][1]-b.ends[0][1])||(a.dimensionId<b.dimensionId?-1:a.dimensionId>b.dimensionId?1:0));
 const inSheet=p=>point(p)&&p.every((n,i)=>n>=.125&&n<=(i?sheet.height:sheet.width)-.125);
 for(const row of ordered){
  const a=row.ends[0],b=row.ends[1],delta=b.map((n,i)=>n-a[i]),length=Math.hypot(...delta),others=[...labelBoxes.filter(r=>r!==row.labelBox),...captionBoxes];
  const uncertain=reason=>{
   result.set(row.dimensionId,{dimensionId:row.dimensionId,status:'uncertain',reason,paths:null});
   for(const segment of[[a,b],[a,row.label],[b,row.label]])if(!equal(...segment)){lines.push(segment);reserveStroke(segment);if(++outputSegments>LIMIT.outputSegments)resource('Dimension layout exceeds its bounded complete segment output.');}
  };
  let labelIssue=null;
  if(row.labelBox.min.some(n=>n<.125)||row.labelBox.max.some((n,i)=>n>(i?sheet.height:sheet.width)-.125))labelIssue='DECLARED_TEXT_OUTSIDE_SHEET';
  else if(others.some(r=>overlap(row.labelBox,r)))labelIssue='DECLARED_TEXT_BOX_CONFLICT';
  else for(const segment of geometrySegments){
   exact.charge();const a=segment[0],b=segment[1],lo=row.labelBox.min,hi=row.labelBox.max;
   // The cheap broad phase never certifies clearance at a near boundary.
   // Its .25 gutter strictly contains the exact .125 stroke test for finite
   // |paper coordinate| <=1e9, including binary64 addition rounding.
   if(Math.min(a[0],b[0])<=hi[0]+.25&&Math.min(a[1],b[1])<=hi[1]+.25&&Math.max(a[0],b[0])>=lo[0]-.25&&Math.max(a[1],b[1])>=lo[1]-.25&&exact.rectangle(a,b,row.labelBox)){labelIssue='DECLARED_TEXT_GEOMETRY_CONFLICT';break;}
  }
  if(!labelIssue&&geometryBounds.some(b=>overlap(row.labelBox,b)))labelIssue='VIEW_ENVELOPE_UNCERTAINTY';
  if(!(length>0)||!Number.isFinite(length)){uncertain('PROJECTED_SPAN_COLLAPSED');continue;}
  const u=delta.map(n=>n/length),normal=[-u[1],u[0]],center=row.labelBox.min.map((n,i)=>(n+row.labelBox.max[i])/2),desired=center.reduce((n,x,i)=>n+(x-a[i])*normal[i],0),side=desired<0?-1:1;
  const first=Math.abs(desired)>=6?desired:side*6,offsets=Array.from({length:LIMIT.candidates},(_,i)=>first+side*i*6);
  let chosen=null,reason='NO_CLEAR_BOUNDED_DIMENSION_LANE';
  for(const offset of offsets){
   exact.charge();const q0=a.map((n,i)=>n+normal[i]*offset),q1=b.map((n,i)=>n+normal[i]*offset),paths=[];
   if(equal(q0,q1)){reason='DERIVED_SPAN_UNREPRESENTABLE';continue;}
   for(const points of textGap(q0,q1,row.labelBox))paths.push({role:'dimension-line',points});
   for(const p of[a,b]){
    const from=p.map((n,i)=>n+normal[i]*side*1.5),to=p.map((n,i)=>n+normal[i]*(offset+side*1.5));
    for(const points of textGap(from,to,row.labelBox))paths.push({role:'extension-line',points});
   }
   // Fixed paper arrow size; short spans use outward arrows instead of
   // reducing the text or silently shrinking the arrowheads.
   const inward=length>=8?1:-1;
   for(const [tip,direction]of[[q0,inward],[q1,-inward]]){
    const root=tip.map((n,i)=>n+u[i]*direction*2),points=[root.map((n,i)=>n+normal[i]*.65),tip,root.map((n,i)=>n-normal[i]*.65)];paths.push({role:'arrowhead',points});
   }
   if(paths.some(p=>p.points.some(q=>!inSheet(q)))){reason='DIMENSION_LANE_OUTSIDE_SHEET';continue;}
   if(paths.some(p=>p.points.slice(1).some((q,i)=>[...others,row.labelBox].some(r=>exact.rectangle(p.points[i],q,r))))){reason='DECLARED_TEXT_STROKE_CONFLICT';continue;}
   if(paths.filter(p=>p.role==='dimension-line').some(p=>lines.some(line=>exact.crossing(p.points[0],p.points[1],line[0],line[1])))){reason='DIMENSION_LINE_CROSSING';continue;}
   const geometryCrossing=paths.filter(p=>p.role==='dimension-line').some(p=>geometrySegments.some(segment=>{
    exact.charge();const a=p.points[0],b=p.points[1],c=segment[0],d=segment[1];
    if(Math.max(a[0],b[0])<Math.min(c[0],d[0])||Math.min(a[0],b[0])>Math.max(c[0],d[0])||Math.max(a[1],b[1])<Math.min(c[1],d[1])||Math.min(a[1],b[1])>Math.max(c[1],d[1]))return false;
    return exact.crossing(a,b,c,d);
   }));
   if(geometryCrossing){reason='PROJECTED_GEOMETRY_LINE_CROSSING';continue;}
   const projection=center.reduce((n,x,i)=>n+(x-q0[i])*u[i],0),start=q0.map((n,i)=>n+u[i]*Math.max(0,Math.min(length,projection))),target=port(start,row.labelBox);
   if(target){
    const obstacles=[...others,...leaderStrokes];
    if(obstacles.length+1>LIMIT.boxes)resource('Dimension leader obstacles exceed their bounded inventory.');
    try{
     const points=routeDrawingLeader(start,target.end,row.labelBox,target.side,obstacles,sheet,budget);
     if(points.length>LIMIT.vertices||points.some(p=>!inSheet(p)))resource('Dimension connector exceeds its bounded output domain.');
     paths.push({role:'label-connector',points});
    }catch(error){if(error?.code==='RESOURCE_LIMIT'&&['ANCHOR_OR_PORT_BLOCKED','NO_ROUTE_IN_BOUNDED_GRAPH'].includes(error.layoutReason)){reason=error.layoutReason;continue;}throw error;}
   }
   chosen={dimensionId:row.dimensionId,status:labelIssue?'uncertain':'available',reason:labelIssue,paths};
   outputSegments+=paths.reduce((n,p)=>n+p.points.length-1,0);if(outputSegments>LIMIT.outputSegments)resource('Dimension layout exceeds its bounded complete segment output.');
   for(const p of paths)if(['dimension-line','label-connector'].includes(p.role))for(let i=1;i<p.points.length;i++){
    const segment=[p.points[i-1],p.points[i]];lines.push(segment);
    // A conservative routed-segment obstacle is explicitly a finite graph
    // restriction, not a claim that all space inside that box contains ink.
    reserveStroke(segment);
   }
   break;
  }
  if(chosen)result.set(row.dimensionId,chosen);else uncertain(reason);
 }
 return dimensions.map(row=>result.get(row.dimensionId));
}

export const DRAWING_DIMENSION_LAYOUT_LIMITS=LIMIT;
