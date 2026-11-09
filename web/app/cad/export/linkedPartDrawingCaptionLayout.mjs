// Worker-only derived presentation. No authored pose/source/view is modified.
// Caption boxes use fixed3mm monospace,1.8mm advance,1mm side padding and a
// 6mm-high declared paper line box (baseline4mm below its top). No font shrinking.
const resource=message=>{throw Object.assign(Error(message),{code:'RESOURCE_LIMIT'});};
const finite=n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=1e9;
const overlap=(a,b)=>a.min[0]<b.max[0]&&a.max[0]>b.min[0]&&a.min[1]<b.max[1]&&a.max[1]>b.min[1];
const expand=(b,n)=>({min:b.min.map(v=>v-n),max:b.max.map(v=>v+n)});
export function layoutDrawingViewCaptions({sheet,captions,bottom}){
 if(!finite(sheet.width)||!finite(sheet.height)||!finite(bottom)||!Array.isArray(captions)||captions.length>12)resource('Drawing caption layout exceeds its bounded presentation domain.');
 const margin=8,lineHeight=6,side=1,baseline=4,advance=1.8,gap=2,titleBottom=16,geometry=new Map(),placed=[],result=[];
 for(const c of captions){
  if(typeof c.value!=='string'||c.value.length<1||c.value.length>64||!/^[ -~]+$/.test(c.value)||typeof c.viewId!=='string'||!Array.isArray(c.origin)||c.origin.length!==2||c.origin.some(n=>!finite(n)))resource('Drawing caption data exceeds its supported physical layout.');
  if(c.bounds){
   const b=c.bounds;if(!['min','max'].every(k=>Array.isArray(b[k])&&b[k].length===2&&b[k].every(finite))||b.min.some((n,i)=>n>b.max[i]))resource('Drawing caption has no finite observed view envelope.');
   const prior=geometry.get(c.viewId);if(prior&&['min','max'].some(k=>prior[k].some((n,i)=>n!==b[k][i])))resource('One drawing view has inconsistent observed envelopes.');
   geometry.set(c.viewId,b);
  }
 }
 if(geometry.size>6)resource('Drawing caption view census exceeds its source bound.');
 for(const c of captions){
  const textLength=c.value.length*advance,width=textLength+2*side,right=sheet.width-margin-width,maxY=Math.min(bottom,sheet.height-16)-lineHeight;
  // Extra quarter-mm is a physical presentation gutter, not geometry tolerance.
  // The full padded box, not merely its baseline, clears own geometry by>=5mm.
  const minY=Math.max(titleBottom,c.bounds?c.bounds.max[1]+5.25:c.origin[1]+5.25),preferred=c.bounds?c.bounds.min[0]:c.origin[0];
  if(right<margin||minY>maxY)resource('The sheet has no supported legible view-caption placement.');
  const obstacles=[...geometry.values(),...placed].map(b=>expand(b,gap));
  // All possible obstruction-edge coordinates for this bounded axis-aligned
  // placement policy; no paper-sized raster search or unbounded retries.
  const xs=[margin,right,Math.max(margin,Math.min(right,preferred))],ys=[minY,maxY];
  for(const b of obstacles){xs.push(b.min[0]-width,b.max[0]);ys.push(b.min[1]-lineHeight,b.max[1]);}
  const xValues=[...new Set(xs)].filter(x=>x>=margin&&x<=right).sort((a,b)=>Math.abs(a-preferred)-Math.abs(b-preferred)||a-b),yValues=[...new Set(ys)].filter(y=>y>=minY&&y<=maxY).sort((a,b)=>a-b);
  let found=null,positions=0;
  for(const y of yValues){for(const x of xValues){
   if(++positions>2048)resource('Drawing caption placement exceeds its bounded search.');
   const box={min:[x,y],max:[x+width,y+lineHeight]};
   if(!obstacles.some(b=>overlap(box,b))){found=box;break;}
  }if(found)break;}
  if(!found)resource('The sheet has no supported legible view-caption placement.');
  placed.push(found);result.push({...c,x:found.min[0]+side,y:found.min[1]+baseline,textLength});
 }
 return result;
}
