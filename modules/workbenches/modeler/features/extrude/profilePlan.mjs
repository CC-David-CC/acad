// Conservative exact relationships for circles and axis-aligned rectangles.
// Boundaries within the OCC fuzzy tolerance or crossing are not classified.
export function profileRegions(profiles, tolerance=0.0001) {
 if(!Array.isArray(profiles)||profiles.length>128||!Number.isFinite(tolerance)||tolerance<=0)throw Error('Too many or invalid profiles for a single extrusion.');
 const valid=n=>Number.isFinite(n)&&Math.abs(n)<=10000000;
 for(const p of profiles){
  if(!p||!['circle','rectangle'].includes(p.kind))throw Error('Multiple profiles must be circles or axis-aligned rectangles; nested profiles are not yet supported for other shapes.');
  if(p.kind==='circle'&&(![p.x,p.y,p.r].every(valid)||p.r<=tolerance))throw Error('Circle profile is invalid or too small.');
  if(p.kind==='rectangle'&&(![p.minX,p.maxX,p.minY,p.maxY].every(valid)||p.maxX-p.minX<=tolerance||p.maxY-p.minY<=tolerance))throw Error('Rectangle profile is invalid or too small.');
 }
 const contains=(a,b)=>{
  if(a.kind==='circle'&&b.kind==='circle')return Math.hypot(a.x-b.x,a.y-b.y)+b.r<a.r-tolerance;
  if(a.kind==='rectangle'&&b.kind==='rectangle')return b.minX>a.minX+tolerance&&b.maxX<a.maxX-tolerance&&b.minY>a.minY+tolerance&&b.maxY<a.maxY-tolerance;
  if(a.kind==='rectangle')return b.x-b.r>a.minX+tolerance&&b.x+b.r<a.maxX-tolerance&&b.y-b.r>a.minY+tolerance&&b.y+b.r<a.maxY-tolerance;
  return [[b.minX,b.minY],[b.minX,b.maxY],[b.maxX,b.minY],[b.maxX,b.maxY]].every(([x,y])=>Math.hypot(x-a.x,y-a.y)<a.r-tolerance);
 };
 const separate=(a,b)=>{
  if(a.kind==='circle'&&b.kind==='circle')return Math.hypot(a.x-b.x,a.y-b.y)>a.r+b.r+tolerance;
  if(a.kind==='rectangle'&&b.kind==='rectangle')return a.maxX+tolerance<b.minX||b.maxX+tolerance<a.minX||a.maxY+tolerance<b.minY||b.maxY+tolerance<a.minY;
  const rect=a.kind==='rectangle'?a:b, circle=a.kind==='circle'?a:b;
  const x=Math.max(rect.minX,Math.min(circle.x,rect.maxX)),y=Math.max(rect.minY,Math.min(circle.y,rect.maxY));
  return Math.hypot(circle.x-x,circle.y-y)>circle.r+tolerance;
 };
 const area=p=>p.kind==='circle'?Math.PI*p.r*p.r:(p.maxX-p.minX)*(p.maxY-p.minY);
 const parent=profiles.map(()=>-1);
 for(let i=0;i<profiles.length;i++)for(let j=i+1;j<profiles.length;j++){
  const a=profiles[i],b=profiles[j],ab=contains(a,b),ba=contains(b,a);
  if(!ab&&!ba&&!separate(a,b))throw Error('Profiles intersect, touch or are too close; separate them before extruding.');
  if(ab&&(parent[j]===-1||area(a)<area(profiles[parent[j]])))parent[j]=i;
  if(ba&&(parent[i]===-1||area(b)<area(profiles[parent[i]])))parent[i]=j;
 }
 const depth=i=>{let n=0;while(parent[i]!==-1){i=parent[i];if(++n>profiles.length)throw Error('Invalid profile nesting.');}return n;};
 return profiles.map((_,i)=>({outer:i,holes:parent.flatMap((p,j)=>p===i?[j]:[]),depth:depth(i)}));
}

// Legacy experiment only; no user-selected regions are represented here.
export function profilePlan(profiles,tolerance=0.0001) {
 return profileRegions(profiles,tolerance).filter(region=>region.depth%2===0).map(({outer,holes})=>({outer,holes}));
}

// Research planner only. It does not assign persistent IDs or perform OCC work.
export function selectedRegionPlan(profiles,selected,bodyPolicy,tolerance=0.0001) {
 const regions=profileRegions(profiles,tolerance);
 if(!Array.isArray(selected)||!selected.length||selected.length>regions.length||new Set(selected).size!==selected.length||selected.some(i=>!Number.isInteger(i)||i<0||i>=regions.length))throw Error('Choose distinct existing regions.');
 if(!['separate','union'].includes(bodyPolicy))throw Error('Choose whether selected regions remain separate or are combined.');
 return {regions:selected.map(i=>regions[i]),bodyPolicy};
}
export function rectangleProfile(segments,tolerance=1e-7) {
 if(!Array.isArray(segments)||segments.length!==4)return null;
 const points=segments.flatMap(s=>[s.a,s.b]);if(points.some(p=>!p||![p.x,p.y].every(Number.isFinite)))return null;
 const minX=Math.min(...points.map(p=>p.x)),maxX=Math.max(...points.map(p=>p.x)),minY=Math.min(...points.map(p=>p.y)),maxY=Math.max(...points.map(p=>p.y));
 if(maxX-minX<=tolerance||maxY-minY<=tolerance)return null;
 const corner=p=>{const x=Math.abs(p.x-minX)<=tolerance?0:Math.abs(p.x-maxX)<=tolerance?1:-1,y=Math.abs(p.y-minY)<=tolerance?0:Math.abs(p.y-maxY)<=tolerance?1:-1;return x<0||y<0?null:x+2*y};
 const edges=new Set();for(const s of segments){const a=corner(s.a),b=corner(s.b);if(a===null||b===null||a===b||!([1,2].includes(a^b)))return null;edges.add([a,b].sort().join(':'))}
 if(edges.size!==4)return null;
 return {kind:'rectangle',minX,maxX,minY,maxY};
}

// A polygon must be closed and simple. Curve-containing contours are not
// classified by this routine and require separate geometric validation.
export function validateSegmentLoop(segments,tolerance=0.0001) {
 if(!Array.isArray(segments)||segments.length<3||segments.length>512)throw Error('A closed, simple profile is required.');
 const edges=segments.map(s=>s.inverted?{a:s.b,b:s.a}:{a:s.a,b:s.b});
 const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 for(let i=0;i<edges.length;i++){
  const {a,b}=edges[i],next=edges[(i+1)%edges.length].a;
  if(!a||!b||![a.x,a.y,b.x,b.y].every(n=>Number.isFinite(n)&&Math.abs(n)<=10000000)||dist(a,b)<=tolerance||dist(b,next)>tolerance)throw Error('A closed, simple profile is required.');
 }
 const orient=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
 const on=(a,b,p)=>p.x>=Math.min(a.x,b.x)-tolerance&&p.x<=Math.max(a.x,b.x)+tolerance&&p.y>=Math.min(a.y,b.y)-tolerance&&p.y<=Math.max(a.y,b.y)+tolerance;
 for(let i=0;i<edges.length;i++)for(let j=i+1;j<edges.length;j++){
  if(j===i+1||(i===0&&j===edges.length-1))continue;
  const {a,b}=edges[i],{a:c,b:d}=edges[j],e1=orient(a,b,c),e2=orient(a,b,d),e3=orient(c,d,a),e4=orient(c,d,b);
  const t1=tolerance*Math.max(dist(a,b),1),t2=tolerance*Math.max(dist(c,d),1);
  if(((e1>t1&&e2< -t1)||(e1< -t1&&e2>t1))&&((e3>t2&&e4< -t2)||(e3< -t2&&e4>t2))||Math.abs(e1)<=t1&&on(a,b,c)||Math.abs(e2)<=t1&&on(a,b,d)||Math.abs(e3)<=t2&&on(c,d,a)||Math.abs(e4)<=t2&&on(c,d,b))throw Error('Self-intersecting or touching profile is not supported.');
 }
}
