// Data-only admission before any BSpline constructor performs curve sampling.
// The Worker later loads the same source through strict native sketch IO.
const LIMIT_POINTS=64, LIMIT_DEGREE=5, LIMIT_WORK=8192;
const keys=(o,allowed)=>!!o&&typeof o==='object'&&!Array.isArray(o)&&Reflect.ownKeys(o).every(k=>{if(typeof k!=='string'||!allowed.includes(k))return false;const d=Object.getOwnPropertyDescriptor(o,k);return !!d?.enumerable&&Object.hasOwn(d,'value')});
const dense=a=>{if(!Array.isArray(a)||Reflect.ownKeys(a).length!==a.length+1)return false;for(let i=0;i<a.length;i++){const d=Object.getOwnPropertyDescriptor(a,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value'))return false}return true};
const fail=()=>{throw Error('Unsupported or invalid bounded B-spline.');};
export function inspectBoundedSpline(id,d){
 if(typeof id!=='string'||!id||id.length>1024||!keys(d,['degree','cPoints','fPoints','kValues','interpolation','CVModel','type','method','closedBasePoints'])||!Number.isInteger(d.degree)||d.degree<1||d.degree>LIMIT_DEGREE||!dense(d.cPoints)||d.cPoints.length<d.degree+1||d.cPoints.length>LIMIT_POINTS||!dense(d.fPoints)||d.fPoints.length>LIMIT_POINTS||!dense(d.kValues)||d.kValues.length!==d.cPoints.length+d.degree+1||!['Clamped','Open','Closed'].includes(d.type)||typeof d.interpolation!=='boolean'||typeof d.CVModel!=='boolean'||d.interpolation&&d.CVModel||d.interpolation&&(d.degree!==3||d.fPoints.length<3)||!Number.isInteger(d.method)||d.method< -1||d.method>2)fail();
 if(d.type==='Closed'&&d.CVModel&&(!dense(d.closedBasePoints)||d.closedBasePoints.length<2)||d.closedBasePoints!==undefined&&(!dense(d.closedBasePoints)||d.closedBasePoints.length>LIMIT_POINTS))fail();
 if(!d.kValues.every((k,i)=>Number.isFinite(k)&&(i===0||d.kValues[i-1]<=k)&&(i<=d.degree||k!==d.kValues[i-d.degree-1]))||d.kValues[d.degree]>=d.kValues[d.cPoints.length])fail();
 const result=[],all=new Set(),points=[];
 for(const [kind,group] of [['cPoint',d.cPoints],['fPoint',d.fPoints],['basePoint',d.closedBasePoints||[]]]){
  const local=new Map(),generated=new Map();let next=0;
  for(const p of group){if(!keys(p,['id','x','y'])||typeof p.id!=='string'||!p.id||p.id.length>1024||!Number.isFinite(p.x)||!Number.isFinite(p.y))fail();
   if(!d.interpolation&&!d.CVModel){if(kind==='basePoint')fail();const coord=`${p.x}_${p.y}`;if(!generated.has(coord))generated.set(coord,`spline${id}_${kind}${next++}`);if(p.id!==generated.get(coord))fail()}
   const prior=local.get(p.id);if(prior){if(prior.x!==p.x||prior.y!==p.y)fail();continue}if(all.has(p.id)||p.id===id)fail();local.set(p.id,p);all.add(p.id);const derived=d.type==='Closed'&&d.CVModel?kind!=='basePoint':d.CVModel&&!d.interpolation?kind==='fPoint':false;result.push(Object.freeze({id:p.id,type:derived?'SplineDerivedPoint':'Point'}));points.push(p);
  }
 }
 if(points.length<2)fail();let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;for(const p of points){minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y)}const diagonal=Math.hypot(maxX-minX,maxY-minY),spans=d.cPoints.length-d.degree;if(!Number.isFinite(diagonal)||diagonal<=1e-9)fail();const work=spans*(2+Math.ceil(diagonal/50));if(!Number.isSafeInteger(work)||work>LIMIT_WORK)fail();return Object.freeze({childRefs:Object.freeze(result),work});
}
export const SPLINE_WORK_LIMIT=LIMIT_WORK;
