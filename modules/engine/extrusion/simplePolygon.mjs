// Worker-side geometry predicates for the actual binary64 coordinates. No
// welding, constraint solving, repair, persistent IDs or kernel tolerance here.
const fail=(code,message)=>{throw Object.assign(new Error(message),{code});};
const bits=new DataView(new ArrayBuffer(8));
function dyadic(value){
 bits.setFloat64(0,value,false);
 const hi=bits.getUint32(0,false),lo=bits.getUint32(4,false),e=(hi>>>20)&2047;
 let n=(BigInt(hi&0xfffff)<<32n)|BigInt(lo);if(e)n|=1n<<52n;
 return{n:(hi>>>31)?-n:n,e:e?e-1075:-1074};
}
function add(a,b){const e=Math.min(a.e,b.e);return{n:(a.n<<BigInt(a.e-e))+(b.n<<BigInt(b.e-e)),e};}
const sub=(a,b)=>add(a,{n:-b.n,e:b.e});
const mul=(a,b)=>({n:a.n*b.n,e:a.e+b.e});
const sign=n=>n>0n?1:n<0n?-1:0;
function exactCross(a,b,c){
 return sub(mul(sub(dyadic(b[0]),dyadic(a[0])),sub(dyadic(c[1]),dyadic(a[1]))),
  mul(sub(dyadic(b[1]),dyadic(a[1])),sub(dyadic(c[0]),dyadic(a[0]))));
}
export function orientationSign(a,b,c){
 const x=(b[0]-a[0])*(c[1]-a[1]),y=(b[1]-a[1])*(c[0]-a[0]),d=x-y;
 if(Number.isFinite(d)&&Math.abs(d)>16*Number.EPSILON*(Math.abs(x)+Math.abs(y))+16*Number.MIN_VALUE)return Math.sign(d);
 return sign(exactCross(a,b,c).n);
}
const onSegment=(a,b,p)=>orientationSign(a,b,p)===0&&p[0]>=Math.min(a[0],b[0])&&p[0]<=Math.max(a[0],b[0])&&p[1]>=Math.min(a[1],b[1])&&p[1]<=Math.max(a[1],b[1]);
export function segmentRelation(a,b,c,d){
 const ac=orientationSign(a,b,c),ad=orientationSign(a,b,d),ca=orientationSign(c,d,a),cb=orientationSign(c,d,b);
 if(ac===0&&ad===0&&ca===0&&cb===0){
  const axis=a[0]!==b[0]||c[0]!==d[0]?0:1;
  const lo=Math.max(Math.min(a[axis],b[axis]),Math.min(c[axis],d[axis])),hi=Math.min(Math.max(a[axis],b[axis]),Math.max(c[axis],d[axis]));
  return lo<hi?'overlap':lo===hi?'touching':'separate';
 }
 if(ac*ad<0&&ca*cb<0)return'crossing';
 if(ac===0&&onSegment(a,b,c)||ad===0&&onSegment(a,b,d)||ca===0&&onSegment(c,d,a)||cb===0&&onSegment(c,d,b))return'touching';
 return'separate';
}
function magnitude(value){
 const n=value.n<0n?-value.n:value.n;
 // Round once at the final representable exponent, including subnormals.
 const exponent=Math.max(value.e,value.e+n.toString(2).length-53,-1074),shift=exponent-value.e;let q=n>>BigInt(shift);
 if(shift){const r=n-(q<<BigInt(shift)),half=1n<<BigInt(shift-1);if(r>half||r===half&&(q&1n))q++;}
 return Number(q)*2**exponent;
}
export function analyzeSimplePolygon(input){
 if(!Array.isArray(input)||input.length<3||input.length>512)fail('INVALID_PROFILE','A polygon needs3–512 vertices.');
 const vertices=Array.from(input,p=>{
  if(!Array.isArray(p)||p.length!==2||![p[0],p[1]].every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=1e6))fail('INVALID_PROFILE','Expected finite bounded coordinates.');
  return[p[0],p[1]];
 }),n=vertices.length;
 // Classify elementary degeneracy before pairwise boundary contacts; otherwise
 // an earlier edge may hide a later zero edge behind a self-touch diagnosis.
 for(let i=0;i<n;i++){
  const a=vertices[i],b=vertices[(i+1)%n];
  if(a[0]===b[0]&&a[1]===b[1])fail('ZERO_LENGTH_EDGE','A boundary edge has identical endpoints.');
 }
 for(let i=0;i<n;i++){
  const a=vertices[i],b=vertices[(i+1)%n];
  for(let j=i+1;j<n;j++){
   const relation=segmentRelation(a,b,vertices[j],vertices[(j+1)%n]),adjacent=j===i+1||i===0&&j===n-1;
   if(adjacent){if(relation==='overlap')fail('OVERLAPPING_EDGES','Adjacent boundary edges backtrack.');}
   else if(relation!=='separate')fail(relation==='crossing'?'SELF_INTERSECTION':relation==='overlap'?'OVERLAPPING_EDGES':'SELF_TOUCHING_BOUNDARY','A simple polygon cannot cross, overlap or touch itself.');
  }
 }
 let twice={n:0n,e:0};for(let i=1;i<n-1;i++)twice=add(twice,exactCross(vertices[0],vertices[i],vertices[i+1]));
 const winding=sign(twice.n);if(!winding)fail('ZERO_AREA_PROFILE','A polygon must enclose nonzero area.');
 const area=magnitude({...twice,e:twice.e-1});if(!Number.isFinite(area)||area===0)fail('UNREPRESENTABLE_AREA','Polygon area is outside the numeric range.');
 const bounds={min:[Math.min(...vertices.map(p=>p[0])),Math.min(...vertices.map(p=>p[1]))],max:[Math.max(...vertices.map(p=>p[0])),Math.max(...vertices.map(p=>p[1]))]};
 return{kind:'polygon',vertices,area,winding,bounds};
}
export function classifyPolygonPoint(polygon,point){
 const v=polygon.vertices;let inside=false;
 for(let i=0;i<v.length;i++){
  const a=v[i],b=v[(i+1)%v.length];if(onSegment(a,b,point))return'boundary';
  if((a[1]>point[1])!==(b[1]>point[1])){const s=orientationSign(a,b,point);if(b[1]>a[1]?s>0:s<0)inside=!inside;}
 }
 return inside?'inside':'outside';
}
export function polygonRelation(a,b){
 let contact=false;
 for(let i=0;i<a.vertices.length;i++)for(let j=0;j<b.vertices.length;j++){
  const r=segmentRelation(a.vertices[i],a.vertices[(i+1)%a.vertices.length],b.vertices[j],b.vertices[(j+1)%b.vertices.length]);
  if(r==='crossing')return'intersecting';if(r!=='separate')contact=true;
 }
 if(contact)return'touching-or-overlapping-boundary';
 if(classifyPolygonPoint(a,b.vertices[0])==='inside')return'contains';
 if(classifyPolygonPoint(b,a.vertices[0])==='inside')return'inside';
 return'separate';
}
