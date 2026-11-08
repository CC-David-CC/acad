// Pre-construction bounded native/Worker admission. Limits are the existing
// supported evaluator envelope, not mathematical curve-invalidity theorems.
const LIMIT_POINTS=64,LIMIT_DEGREE=5,LIMIT_WORK=8192;
export function splineSourceError(code,message){return Object.assign(new Error(message),{code});}
const fail=(message='Invalid B-spline source record.')=>{throw splineSourceError('INVALID_SPLINE_DATA',message);};
const resource=()=>{throw splineSourceError('SPLINE_RESOURCE_LIMIT','B-spline exceeds the existing bounded degree/points/evaluation-work envelope.');};
const unsupported=message=>{throw splineSourceError('UNSUPPORTED_SPLINE_SOURCE',message);};
const keys=(o,allowed)=>!!o&&typeof o==='object'&&!Array.isArray(o)&&Reflect.ownKeys(o).every(k=>{if(typeof k!=='string'||!allowed.includes(k))return false;const d=Object.getOwnPropertyDescriptor(o,k);return !!d?.enumerable&&Object.hasOwn(d,'value')});
const dense=a=>{if(!Array.isArray(a)||Reflect.ownKeys(a).length!==a.length+1)return false;for(let i=0;i<a.length;i++){const d=Object.getOwnPropertyDescriptor(a,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value'))return false;}return true;};
export function inspectBoundedSpline(id,input){
 const required=['degree','cPoints','fPoints','kValues','interpolation','CVModel','type','method'];
 if(typeof id!=='string'||!id||id.length>1024||!keys(input,[...required,'closedBasePoints']))fail();
 const d=Object.create(null);for(const key of required){const p=Object.getOwnPropertyDescriptor(input,key);if(!p?.enumerable||!Object.hasOwn(p,'value'))unsupported('Spline source lacks the current explicit native encoding.');d[key]=p.value;}if(Object.hasOwn(input,'closedBasePoints'))d.closedBasePoints=input.closedBasePoints;
 if(!Number.isInteger(d.degree)||d.degree<1)fail('Spline degree must be a positive integer.');if(d.degree>LIMIT_DEGREE)resource();
 if(!dense(d.cPoints)||!dense(d.fPoints)||!dense(d.kValues)||d.closedBasePoints!==undefined&&!dense(d.closedBasePoints))fail();
 if(d.cPoints.length>LIMIT_POINTS||d.fPoints.length>LIMIT_POINTS||d.closedBasePoints?.length>LIMIT_POINTS||d.kValues.length>LIMIT_POINTS+LIMIT_DEGREE+1)resource();
 if(d.cPoints.length<d.degree+1||d.kValues.length!==d.cPoints.length+d.degree+1||!['Clamped','Open','Closed'].includes(d.type)||typeof d.interpolation!=='boolean'||typeof d.CVModel!=='boolean'||!Number.isInteger(d.method)||d.method< -1||d.method>2)fail();
 if(d.interpolation&&d.CVModel)unsupported('Simultaneous fitting and CV modes have no single authored authority.');
 if(d.interpolation&&(d.degree!==3||d.fPoints.length<3))unsupported('The native fitting implementation supports bounded cubic source only.');
 if((d.interpolation||d.CVModel)&&d.method===-1)unsupported('Derived spline source needs an explicit supported parameterization.');
 if(d.CVModel&&d.type==='Open')unsupported('The current native CV rebuild has no qualified unclamped Open mode.');
 if(d.type==='Closed'&&d.CVModel&&(!dense(d.closedBasePoints)||d.closedBasePoints.length<2))unsupported('Closed CV source lacks its actual authored base-point provenance.');
 if(!d.kValues.every((k,i)=>typeof k==='number'&&Number.isFinite(k)&&(i===0||d.kValues[i-1]<=k)&&(i<=d.degree||k!==d.kValues[i-d.degree-1]))||d.kValues[d.degree]>=d.kValues[d.cPoints.length])fail('Invalid nondecreasing knot vector/domain.');
 const result=[],all=new Set(),points=[];
 for(const [kind,group]of [['cPoint',d.cPoints],['fPoint',d.fPoints],['basePoint',d.closedBasePoints||[]]]){
  const local=new Map(),generated=new Map();let next=0;
  for(const p of group){if(!keys(p,['id','x','y'])||typeof p.id!=='string'||!p.id||p.id.length>1024||!Number.isFinite(p.x)||!Number.isFinite(p.y))fail();
   // This corroborates the ACTUAL passive native decoder internally. Public
   // callers never parse these IDs or use coordinates as identity authority.
   if(!d.interpolation&&!d.CVModel){if(kind==='basePoint')unsupported('Passive spline has no authored base-point mode.');const coord=`${p.x}_${p.y}`;if(!generated.has(coord))generated.set(coord,`spline${id}_${kind}${next++}`);if(p.id!==generated.get(coord))unsupported('Passive spline identities do not match its actual native decoder.');}
   const prior=local.get(p.id);if(prior){if(prior.x!==p.x||prior.y!==p.y)fail('One native point ID has different coordinates.');continue;}if(all.has(p.id)||p.id===id)fail('Spline point ownership is ambiguous.');local.set(p.id,p);all.add(p.id);
   const derived=d.type==='Closed'&&d.CVModel?kind!=='basePoint':d.CVModel&&!d.interpolation?kind==='fPoint':false;result.push(Object.freeze({id:p.id,type:derived?'SplineDerivedPoint':'Point'}));points.push(p);
  }
 }
 if(points.length<2)fail();let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;for(const p of d.cPoints){minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);}const diagonal=Math.hypot(maxX-minX,maxY-minY);
 if(!Number.isFinite(diagonal))resource();if(diagonal<=1e-9)throw splineSourceError('SPLINE_DOMAIN','Spline control spread is outside the existing ordinary numerical envelope.');
 // Preserve the prior aggregate spread work bound, including carried/derived
 // groups; control-domain admission above must not silently widen that cap.
 minX=Infinity;maxX=-Infinity;minY=Infinity;maxY=-Infinity;for(const p of points){minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);}const workDiagonal=Math.hypot(maxX-minX,maxY-minY);if(!Number.isFinite(workDiagonal))resource();
 const spans=d.cPoints.length-d.degree,work=spans*(2+Math.ceil(workDiagonal/50));if(!Number.isSafeInteger(work)||work>LIMIT_WORK)resource();
 return Object.freeze({childRefs:Object.freeze(result),work});
}
export const SPLINE_WORK_LIMIT=LIMIT_WORK;
