// Worker-only derived diagnostics. No authored label, anchor or source changes.
const resource=message=>{throw Object.assign(Error(message),{code:'RESOURCE_LIMIT'});};
const finite=n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=1e9;
const overlap=(a,b)=>a.min[0]<b.max[0]&&a.max[0]>b.min[0]&&a.min[1]<b.max[1]&&a.max[1]>b.min[1];
const expand=(b,n)=>({min:b.min.map(v=>v-n),max:b.max.map(v=>v+n)});
export function layoutDrawingWarnings({sheet,warnings,geometryBounds,strokeBounds,labelBoxes,captionBoxes}){
 if(!finite(sheet.width)||!finite(sheet.height)||!Array.isArray(warnings)||warnings.length>32)resource('Drawing warnings exceed their bounded presentation domain.');
 if(!warnings.length)return[];
 const groups=[geometryBounds,strokeBounds,labelBoxes,captionBoxes];
 if(groups.some(xs=>!Array.isArray(xs))||groups.reduce((n,xs)=>n+xs.length,0)>512)resource('Drawing warning obstacles exceed their bounded presentation domain.');
 const obstacles=[];
 for(let group=0;group<groups.length;group++)for(const b of groups[group]){
  if(!b||!['min','max'].every(k=>Array.isArray(b[k])&&b[k].length===2&&b[k].every(finite))||b.min.some((n,i)=>n>b.max[i]))resource('Drawing warnings have an unqualified paper obstacle.');
  // Stroke half-width and physical gutter, not a model/Native tolerance.
  obstacles.push(expand(b,group<2?2.125:2));
 }
 const margin=8,top=16,bottom=sheet.height-16,advance=1.8,side=1,lineHeight=6,baseline=4;
 const capacity=Math.min(120,Math.floor((sheet.width-2*margin-2*side)/advance));
 if(capacity<1)resource('The sheet has no legible warning width.');
 const identities=new Set(),rows=[];let count=0,longest=0;
 for(const w of warnings){
  if(!w||!['dimension','annotation'].includes(w.role)||typeof w.id!=='string'||!w.id||w.id.length>128||typeof w.viewId!=='string'||!w.viewId||w.viewId.length>128||typeof w.message!=='string'||!w.message||w.message.length>512||/[\u0000-\u001f\u007f]/u.test(w.message))resource('Drawing warning membership exceeds its physical layout domain.');
  const key=JSON.stringify([w.role,w.id,w.viewId]);if(identities.has(key))resource('Drawing warnings repeat an authored identity.');identities.add(key);
  const chars=Array.from(w.message),lines=[];
  for(let at=0;at<chars.length;at+=capacity){const value=chars.slice(at,at+capacity).join('');lines.push(value);longest=Math.max(longest,Array.from(value).length);if(++count>256)resource('Drawing warnings exceed their bounded complete line census.');}
  rows.push({...w,lines});
 }
 const width=longest*advance+2*side,height=count*lineHeight,right=sheet.width-margin-width,maxY=bottom-height;
 if(right<margin||maxY<top)resource('The sheet has no complete legible warning placement.');
 const xs=[margin,right],ys=[top,maxY];
 for(const b of obstacles){xs.push(b.min[0]-width,b.max[0]);ys.push(b.min[1]-height,b.max[1]);}
 const xValues=[...new Set(xs)].filter(x=>finite(x)&&x>=margin&&x<=right).sort((a,b)=>a-b),yValues=[...new Set(ys)].filter(y=>finite(y)&&y>=top&&y<=maxY).sort((a,b)=>b-a);
 let found=null,work=0;
 for(const y of yValues){for(const x of xValues){
  if(++work>4096)resource('Drawing warning placement exceeds its bounded search.');
  const box={min:[x,y],max:[x+width,y+height]};
  if(!obstacles.some(b=>overlap(box,b))){found=box;break;}
 }if(found)break;}
 if(!found)resource('The sheet has no complete legible warning placement.');
 let line=0;
 return rows.map(row=>({...row,lines:row.lines.map(value=>({value,x:found.min[0]+side,y:found.min[1]+baseline+line++*lineHeight,textLength:Array.from(value).length*advance}))}));
}
