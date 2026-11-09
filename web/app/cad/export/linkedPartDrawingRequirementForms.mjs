// Worker-only presentation of captured v4 requirements and protected read facts.
// No source, geometry, reference, authored label or conformance state is written.
const fail=message=>{throw Object.assign(Error(message),{code:'INVALID_REQUEST'});};
const resource=message=>{throw Object.assign(Error(message),{code:'RESOURCE_LIMIT'});};
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
export function renderDrawingRequirementForms({definition:d,observation:o,views,geometryBounds,strokeBounds,labelBoxes,captionBoxes}){
 const paths=[],annotations=[],warnings=[],newLabels=[],newStrokes=[];
 if(d.version!==4)return{paths,annotations,warnings,labelBoxes:newLabels,strokeBounds:newStrokes};
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
  const p=project(a,anchor);let end;
  if(p[0]<box.min[0])end=[box.min[0],(box.min[1]+box.max[1])/2];
  else if(p[0]>box.max[0])end=[box.max[0],(box.min[1]+box.max[1])/2];
  else if(p[1]<box.min[1])end=[(box.min[0]+box.max[0])/2,box.min[1]];
  else if(p[1]>box.max[1])end=[(box.min[0]+box.max[0])/2,box.max[1]];
  else resource('The actual requirement anchor lies inside its authored text box.');
  forms.push({box,annotationId:a.annotationId});newLabels.push(box);leaders.push({points:[p,end],annotationId:a.annotationId});
  path(a,kind,[p,end],'requirement-leader');
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
 // Protect text boxes from newly drawn leaders, while leaving general leader
 // routing/geometry crossings explicitly outside this finite presentation.
 const intersectsSegment=(points,box)=>{
  let lo=0,hi=1;
  for(let k=0;k<2;k++){const p=points[0][k],delta=points[1][k]-p;if(delta===0){if(p<=box.min[k]||p>=box.max[k])return false;}else{const a=(box.min[k]-p)/delta,b=(box.max[k]-p)/delta;lo=Math.max(lo,Math.min(a,b));hi=Math.min(hi,Math.max(a,b));if(lo>=hi)return false;}}
  return lo<hi&&hi>0&&lo<1;
 };
 for(const leader of leaders){
  const textObstacles=[...labelBoxes,...captionBoxes,...forms.filter(f=>f.annotationId!==leader.annotationId).map(f=>f.box)];
  if(textObstacles.some(b=>intersectsSegment(leader.points,expand(b,0.125))))resource('A new requirement leader crosses an existing declared text box.');
 }
 return{paths,annotations,warnings,labelBoxes:newLabels,strokeBounds:newStrokes};
}
