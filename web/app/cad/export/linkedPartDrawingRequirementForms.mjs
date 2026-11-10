// Worker-only presentation of captured v4 requirements and protected read facts.
// No source, geometry, reference, authored label or conformance state is written.
const fail=message=>{throw Object.assign(Error(message),{code:'INVALID_REQUEST'});};
const resource=(message,layoutReason=undefined)=>{throw Object.assign(Error(message),{code:'RESOURCE_LIMIT',...(layoutReason?{layoutReason}:{})});};
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const finite=n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=1e9;
const num=n=>{if(!finite(n))resource('Requirement paper coordinates exceed their supported domain.');return String(Object.is(n,-0)?0:n);};
const overlap=(a,b)=>a.min[0]<b.max[0]&&a.max[0]>b.min[0]&&a.min[1]<b.max[1]&&a.max[1]>b.min[1];
const expand=(b,n)=>({min:b.min.map(v=>v-n),max:b.max.map(v=>v+n)});
const boxOf=points=>({min:[0,1].map(k=>Math.min(...points.map(p=>p[k]))),max:[0,1].map(k=>Math.max(...points.map(p=>p[k])))});
// Preserve the complete represented value; padding adds zeros, never rounds.
function value(n,decimals=0,signed=false){
 if(typeof n!=='number'||!Number.isFinite(n))fail('A resolved requirement has no finite quantity.');
 let s=String(Object.is(n,-0)?0:n);
 if(!/[eE]/.test(s)){const at=s.indexOf('.'),places=at<0?0:s.length-at-1;if(places<decimals)s+=(at<0?'.':'')+'0'.repeat(decimals-places);}
 return(signed&&n>0?'+':'')+s;
}
const attrs=(a,kind)=>`data-annotation-id="${escape(a.annotationId)}" data-annotation-kind="${kind}" data-requirement-role="authored-manufacturing-requirement" data-geometry-binding="resolved"`;
const ROUTE_LIMITS=Object.freeze({boxes:128,nodes:514,leaders:6,vertices:64,pathCharacters:8192,work:8000000,integerBits:1200});
// Visibility graph over declared paper rectangles, then deterministic Dijkstra.
// Distances choose a route; exact dyadic predicates alone decide its legality.
export function routeDrawingLeader(start,end,ownBox,side,otherBoxes,sheet,budget){
 return routePaperPath(start,end,ownBox,side,otherBoxes,sheet,budget);
}
// Explicit derived reference connector, not a conventional extension line.
// Both endpoints are actual already-bound paper anchors, never model input.
export function routeDrawingReferenceConnector(start,end,otherBoxes,sheet,budget){
 return routePaperPath(start,end,null,null,otherBoxes,sheet,budget);
}
function routePaperPath(start,end,ownBox,side,otherBoxes,sheet,budget){
 const charge=(n=1)=>{budget.used+=n;if(budget.used>ROUTE_LIMITS.work)resource('Requirement leader routing exceeds its bounded work domain.');};
 if(otherBoxes.length+(ownBox?1:0)>ROUTE_LIMITS.boxes)resource('Requirement leader text obstacles exceed their bounded domain.');
 const point=p=>Array.isArray(p)&&p.length===2&&p.every(finite);
 const box=b=>b&&point(b.min)&&point(b.max)&&b.min.every((v,i)=>v<b.max[i]);
 if(!point(start)||!point(end)||(ownBox!==null&&!box(ownBox))||!otherBoxes.every(box)||!finite(sheet.width)||!finite(sheet.height))resource('Requirement leader paper inputs are unavailable.');
 const data=new DataView(new ArrayBuffer(8)),zero=BigInt(0),one=BigInt(1),two=BigInt(2),b32=BigInt(32),b52=BigInt(52),mask32=(one<<b32)-one;
 const bits=n=>{data.setFloat64(0,n,false);return(BigInt(data.getUint32(0,false))<<b32)|BigInt(data.getUint32(4,false));};
 const number=b=>{data.setUint32(0,Number(b>>b32),false);data.setUint32(4,Number(b&mask32),false);return data.getFloat64(0,false);};
 const next=(n,up)=>{if(n===0)return up?Number.MIN_VALUE:-Number.MIN_VALUE;const b=bits(n);return number((n>0)===up?b+one:b-one);};
 const parts=new Map();
 function dyadic(n){
  charge();if(parts.has(n))return parts.get(n);
  const b=bits(n),exponent=Number((b>>b52)&BigInt(2047));let m=b&((one<<b52)-one),e=exponent?exponent-1075:-1074;
  if(exponent)m+=one<<b52;
  if(b>>BigInt(63))m=-m;
  if(m===zero)e=0;else while(m%two===zero){charge();m/=two;++e;}
  const p={m,e};parts.set(n,p);return p;
 }
 // Outward rounding is only for NEW derived paper waypoints. Collision boxes
 // below use exact raw bounds +/- .125, not these rounded approximations.
 const allBoxes=ownBox?[...otherBoxes,ownBox]:[...otherBoxes],corners=[];
 for(const b of allBoxes){
  const lo=b.min.map(n=>next(n-.125,false)),hi=b.max.map(n=>next(n+.125,true));
  corners.push([lo[0],lo[1]],[hi[0],lo[1]],[hi[0],hi[1]],[lo[0],hi[1]]);
 }
 const rawPoints=[[...start],[...end],...corners];
 if(rawPoints.length>ROUTE_LIMITS.nodes||rawPoints.some(p=>!point(p)))resource('Requirement leader graph exceeds its finite node domain.');
 const values=[.125,sheet.width,sheet.height,...allBoxes.flatMap(b=>[...b.min,...b.max]),...rawPoints.flat()];
 let exponent=0;for(const n of values){const p=dyadic(n);if(p.m!==zero)exponent=Math.min(exponent,p.e);}
 const exact=n=>{const p=dyadic(n),q=p.m<<BigInt(p.e-exponent);if((q<zero?-q:q)>>BigInt(ROUTE_LIMITS.integerBits))resource('Requirement paper arithmetic exceeds its bounded domain.');return q;};
 const half=exact(.125),qbox=(b,pad)=>({min:b.min.map(n=>exact(n)-pad),max:b.max.map(n=>exact(n)+pad)}),own=ownBox?qbox(ownBox,zero):null,obstacles=otherBoxes.map(b=>qbox(b,half));
 const lower=[half,half],upper=[exact(sheet.width)-half,exact(sheet.height)-half];
 const inside=(p,b,closed)=>p.every((n,i)=>closed?n>=b.min[i]&&n<=b.max[i]:n>b.min[i]&&n<b.max[i]);
 const inSheet=p=>p.every((n,i)=>n>=lower[i]&&n<=upper[i]);
 const vertex=p=>({p,q:p.map(exact)});
 const allowed=(n,goal=false)=>{charge();return inSheet(n.q)&&(goal||!own||!inside(n.q,own,true))&&!obstacles.some(b=>{charge();return inside(n.q,b,false);});};
 const first=vertex(rawPoints[0]),last=vertex(rawPoints[1]);
 if(!allowed(first)||!allowed(last,true))resource('The actual requirement anchor or port has no clear supported paper domain.','ANCHOR_OR_PORT_BLOCKED');
 const orient=(a,b,p)=>{charge();return(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);};
 function intersects(a,b,r,closed){
  charge();
  for(let k=0;k<2;k++)if(closed?((a[k]>b[k]?a[k]:b[k])<r.min[k]||(a[k]<b[k]?a[k]:b[k])>r.max[k]):((a[k]>b[k]?a[k]:b[k])<=r.min[k]||(a[k]<b[k]?a[k]:b[k])>=r.max[k]))return false;
  const signs=[orient(a,b,r.min),orient(a,b,[r.max[0],r.min[1]]),orient(a,b,r.max),orient(a,b,[r.min[0],r.max[1]])];
  return !(signs.every(n=>closed?n>zero:n>=zero)||signs.every(n=>closed?n<zero:n<=zero));
 }
 const approach=p=>side==='left'?p[0]<own.min[0]:side==='right'?p[0]>own.max[0]:side==='top'?p[1]<own.min[1]:side==='bottom'?p[1]>own.max[1]:false;
 function visible(a,b,goal){
  charge();if(own&&(goal?!approach(a.q):intersects(a.q,b.q,own,true)))return false;
  return !obstacles.some(r=>intersects(a.q,b.q,r,false));
 }
 // The unchanged authored midpoint is reachable directly whenever clear.
 if(visible(first,last,true))return[first.p,last.p];
 const nodes=[first,last],seen=new Set([first.p.join(','),last.p.join(',')]);
 corners.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
 for(const p of corners){const key=p.join(',');if(seen.has(key))continue;seen.add(key);const n=vertex(p);if(allowed(n))nodes.push(n);}
 if(nodes.length>ROUTE_LIMITS.nodes)resource('Requirement leader graph exceeds its bounded node domain.');
 const distances=nodes.map(()=>Infinity),hops=nodes.map(()=>Infinity),previous=nodes.map(()=>-1),visited=nodes.map(()=>false);distances[0]=hops[0]=0;
 for(let iteration=0;iteration<nodes.length;iteration++){
  let at=-1;
  for(let i=0;i<nodes.length;i++){charge();if(!visited[i]&&Number.isFinite(distances[i])&&(at<0||distances[i]<distances[at]||distances[i]===distances[at]&&(hops[i]<hops[at]||hops[i]===hops[at]&&i<at)))at=i;}
  if(at<0)resource('No supported obstacle-avoiding requirement leader route is available.','NO_ROUTE_IN_BOUNDED_GRAPH');
  if(at===1)break;visited[at]=true;
  for(let to=0;to<nodes.length;to++){
   charge();if(to===at||visited[to]||!visible(nodes[at],nodes[to],to===1))continue;
   const a=nodes[at].p,b=nodes[to].p,distance=distances[at]+Math.hypot(b[0]-a[0],b[1]-a[1]),steps=hops[at]+1;
   if(!Number.isFinite(distance))resource('Requirement leader route length exceeds its finite domain.');
   if(distance<distances[to]||distance===distances[to]&&(steps<hops[to]||steps===hops[to]&&at<previous[to])){distances[to]=distance;hops[to]=steps;previous[to]=at;}
  }
 }
 const route=[],used=new Set();let at=1;
 while(at!==-1){charge();if(used.has(at)||route.length===ROUTE_LIMITS.vertices)resource('Requirement leader output exceeds its bounded path domain.');used.add(at);route.push(nodes[at]);if(at===0)break;at=previous[at];}
 if(at!==0)resource('No complete requirement leader path was established.','NO_ROUTE_IN_BOUNDED_GRAPH');route.reverse();
 for(let i=1;i<route.length;i++)if(!visible(route[i-1],route[i],i===route.length-1))resource('Requirement leader route failed its exact final visibility check.');
 return route.map(n=>n.p);
}
export function renderDrawingRequirementForms({definition:d,observation:o,views,geometryBounds,strokeBounds,labelBoxes,captionBoxes}){
 const paths=[],annotations=[],warnings=[],newLabels=[],newStrokes=[],leaderSegments=[];
 if(d.version!==4)return{paths,annotations,warnings,labelBoxes:newLabels,strokeBounds:newStrokes,leaderSegments};
 if(!Array.isArray(d.datumFeatures)||!Array.isArray(d.requirements)||!Array.isArray(o.datumFeatures)||!Array.isArray(o.requirements)||o.datumFeatures.length!==d.datumFeatures.length||o.requirements.length!==d.requirements.length)fail('Requirement observation differs from the complete authored v4 definition.');
 const frames=new Map(o.viewFrames.map(v=>[v.viewId,v.frame])),scale=d.sheet.scale.numerator/d.sheet.scale.denominator;
 const obstacles=[...geometryBounds,...strokeBounds].map(b=>expand(b,2.125)).concat([...labelBoxes,...captionBoxes].map(b=>expand(b,2))),forms=[],leaders=[];
 if(obstacles.length>512)resource('Requirement paper obstacles exceed the bounded presentation domain.');
 const project=(a,p)=>{
  if(!Array.isArray(p)||p.length!==3||p.some(n=>typeof n!=='number'||!Number.isFinite(n)))fail('Requirement anchor is not an actual finite read point.');
  const v=d.views.find(v=>v.viewId===a.viewId),f=frames.get(a.viewId),delta=p.map((n,i)=>n-f.origin[i]);
  return[v.paperOrigin[0]+scale*delta.reduce((n,x,i)=>n+x*f.u[i],0),v.paperOrigin[1]-scale*delta.reduce((n,x,i)=>n+x*f.v[i],0)];
 };
 const available=(a,row,kind)=>{
  if(!row||row.annotationId!==a.annotationId||(kind==='datum-feature'?row.symbol!==a.symbol:row.kind!==a.kind)||!['available','unresolved'].includes(row.status))fail('Requirement row identity, order or status changed.');
  const view=views.find(v=>v.viewId===a.viewId),frame=frames.get(a.viewId);
  if(kind!=='datum-feature'&&row.requirementRole!=='authored-manufacturing-requirement')fail('Requirement facts have an invalid authored role.');
  if(row.status==='available'){
   if(row.quality!==(kind==='datum-feature'?'native-brep-analytic':'native-bound-requirement-reference')||row.facts===null||row.reason!==null)fail('Resolved requirement facts have an invalid evidence role.');
  }else if(row.quality!==null||row.facts!==null)fail('Unresolved requirement contains stale available facts.');
  if(row.status==='available'&&frame&&view?.status==='available')return true;
  const reason=row.status==='unresolved'?row.reason:view?.reason||'DRAWING_VIEW_FRAME_UNAVAILABLE';
  if(typeof reason!=='string'||!reason||reason.length>256)fail('An unresolved requirement has no bounded actual reason.');
  warnings.push({role:'annotation',id:a.annotationId,viewId:a.viewId,message:'UNRESOLVED: '+a.annotationId+' ('+reason+')',tag:`data-annotation-id="${escape(a.annotationId)}" data-annotation-kind="${kind}"`});return false;
 };
 const path=(a,kind,points,role)=>{newStrokes.push(boxOf(points));paths.push(`<path ${attrs(a,kind)} data-presentation="${role}" d="M${points.map(p=>p.map(num).join(',')).join(' L')}" stroke="#357"/>`);};
 const text=(a,kind,point,s,role)=>{
  const length=Array.from(s).length*1.8;if(!length||length>1024)resource('A complete requirement line exceeds its fixed-size presentation domain.');
  annotations.push(`<text x="${num(point[0])}" y="${num(point[1])}" ${attrs(a,kind)} data-requirement-text="${role}" font-family="monospace" font-size="3" textLength="${num(length)}" lengthAdjust="spacing" fill="#124">${escape(s)}</text>`);
 };
 function reserve(a,kind,width,height,anchor){
  const box={min:[a.label[0]-1,a.label[1]-4],max:[a.label[0]-1+width,a.label[1]-4+height]};
  if(!finite(width)||!finite(height)||width<=0||height<=0||box.min[0]<8||box.min[1]<16||box.max[0]>d.sheet.width-8||box.max[1]>d.sheet.height-16||[...obstacles,...forms.map(f=>expand(f.box,2))].some(b=>overlap(box,b)))resource('The authored requirement label has no complete supported legible paper box.');
  const p=project(a,anchor);let end,side;
  if(p[0]<box.min[0]){end=[box.min[0],(box.min[1]+box.max[1])/2];side='left';}
  else if(p[0]>box.max[0]){end=[box.max[0],(box.min[1]+box.max[1])/2];side='right';}
  else if(p[1]<box.min[1]){end=[(box.min[0]+box.max[0])/2,box.min[1]];side='top';}
  else if(p[1]>box.max[1]){end=[(box.min[0]+box.max[0])/2,box.max[1]];side='bottom';}
  else resource('The actual requirement anchor lies inside its authored text box.');
  // Reserve the original output slot, but route only after EVERY form exists.
  // This retains leader/frame/cell order without assuming future boxes clear.
  forms.push({box,annotationId:a.annotationId});newLabels.push(box);leaders.push({a,kind,start:p,end,side,box,pathIndex:paths.length});paths.push(null);
  path(a,kind,[box.min,[box.max[0],box.min[1]],box.max,[box.min[0],box.max[1]],box.min],'requirement-frame');return box;
 }
 for(let i=0;i<d.datumFeatures.length;i++){
  const a=d.datumFeatures[i],row=o.datumFeatures[i],kind='datum-feature';if(!available(a,row,kind))continue;
  reserve(a,kind,8,6,row.facts.anchor);text(a,kind,[a.label[0]+2,a.label[1]],a.symbol,'datum-symbol');
 }
 for(let i=0;i<d.requirements.length;i++){
  const a=d.requirements[i],row=o.requirements[i],kind=a.kind;if(!available(a,row,kind))continue;const f=row.facts;
  if(kind==='position-tolerance'){
   const cells=[['kind','POS REQ'],['zone','Ø'+value(a.zone.value,2)+' mm'],...a.datumSymbols.map(s=>['datum-'+s,s])],widths=cells.map(([,s])=>Math.max(6,Array.from(s).length*1.8+2)),box=reserve(a,kind,widths.reduce((n,v)=>n+v,0),6,f.anchor);let x=box.min[0];
   cells.forEach(([role,s],j)=>{text(a,kind,[x+1,a.label[1]],s,role);x+=widths[j];if(j<cells.length-1)path(a,kind,[[x,box.min[1]],[x,box.max[1]]],'requirement-cell');});
  }else if(kind==='surface-finish'){
   const s='REQ Ra ≤'+value(a.maximum.value)+' µm';reserve(a,kind,Array.from(s).length*1.8+2,6,f.anchor);text(a,kind,a.label,s,'roughness');
  }else if(kind==='clearance-fit'){
   const lines=[['nominal','REQ FIT nominal Ø'+value(f.nominalDiameter,3)+' mm'],['hole-deviations','HOLE deviations '+value(a.hole.lowerDeviation,3,true)+'..'+value(a.hole.upperDeviation,3,true)+' mm'],['hole-limits','HOLE limits ['+f.holeLimits.map(n=>value(n,3)).join(',')+'] mm'],['declared-shaft-deviations','DECLARED SHAFT deviations '+value(a.declaredShaft.lowerDeviation,3,true)+'..'+value(a.declaredShaft.upperDeviation,3,true)+' mm'],['declared-shaft-limits','DECLARED SHAFT limits ['+f.declaredShaftLimits.map(n=>value(n,3)).join(',')+'] mm'],['clearance','REQUIRED CLEARANCE ['+value(f.clearance.minimum,3)+','+value(f.clearance.maximum,3)+'] mm']];
   reserve(a,kind,Math.max(...lines.map(([,s])=>Array.from(s).length))*1.8+2,lines.length*6,f.anchor);
   lines.forEach(([role,s],j)=>text(a,kind,[a.label[0],a.label[1]+j*6],s,role));
  }else fail('Unsupported captured requirement kind.');
 }
 // Protect declared text, including forms created later in definition order.
 // General geometry/leader-leader crossings remain a separate layout domain.
 if(leaders.length>ROUTE_LIMITS.leaders)resource('Requirement leaders exceed their bounded presentation domain.');
 const routingBudget={used:0};
 for(const leader of leaders){
  const textObstacles=[...labelBoxes,...captionBoxes,...forms.filter(f=>f.annotationId!==leader.a.annotationId).map(f=>f.box)];
  const points=routeDrawingLeader(leader.start,leader.end,leader.box,leader.side,textObstacles,d.sheet,routingBudget);
  const data='M'+points.map(p=>p.map(num).join(',')).join(' L');
  if(data.length>ROUTE_LIMITS.pathCharacters)resource('Requirement leader path exceeds its bounded serialization domain.');
  // Round joins bound all routed stroke ink by the .125-expanded segments.
  // Original direct leaders preserve their original attributes exactly.
  paths[leader.pathIndex]=`<path ${attrs(leader.a,leader.kind)} data-presentation="requirement-leader" d="${data}" stroke="#357"${points.length>2?' stroke-linejoin="round"':''}/>`;
  for(let i=1;i<points.length;i++){const segment=[points[i-1],points[i]];newStrokes.push(boxOf(segment));leaderSegments.push(segment);}
 }
 return{paths,annotations,warnings,labelBoxes:newLabels,strokeBounds:newStrokes,leaderSegments};
}
