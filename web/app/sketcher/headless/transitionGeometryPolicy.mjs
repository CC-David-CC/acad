// Only fields backed by sketch solver parameters may change during a
// LengthRelation transition. All other serialized data remains authored data.
const point=(p,k)=>p.length===2&&p[0]===k&&(p[1]==='x'||p[1]==='y');
const xy=p=>p.length===1&&(p[0]==='x'||p[0]==='y');
function movable(type,p){
 switch(type){
  case 'Point':return xy(p);
  case 'Segment':return point(p,'a')||point(p,'b');
  case 'Circle':return point(p,'c')||(p.length===1&&p[0]==='r');
  case 'Arc':return ['a','b','c'].some(k=>point(p,k));
  case 'Ellipse':return point(p,'c')||(p.length===1&&['rx','ry','rot'].includes(p[0]));
  case 'EllipticalArc':return ['a','b','c'].some(k=>point(p,k))||(p.length===1&&['rx','ry','rot'].includes(p[0]));
  case 'BezierCurve':return ['cp1','cp2','cp3','cp4'].some(k=>point(p,k));
  case 'BSpline':return p.length===3&&p[0]==='cPoints'&&/^(0|[1-9]\d*)$/.test(p[1])&&(p[2]==='x'||p[2]==='y');
  case 'RigidGroup':return p.length===2&&p[0]==='transform'&&['x','y','angle'].includes(p[1]);
  default:return false;
 }
}
const unsupported=()=>Object.assign(new Error('The transition changed unsupported authored shape data.'),{code:'UNSUPPORTED_SOLVER_DATA_CHANGE'});
export function assertAllowedSolverGeometry(type,before,after){
 let visited=0;const pending=[[before,after,[]]];
 while(pending.length){
  const [a,b,path]=pending.pop();if(++visited>100000||path.length>64)throw unsupported();
  if(Object.is(a,b))continue;
  if(movable(type,path)){if(typeof a!=='number'||typeof b!=='number'||!Number.isFinite(a)||!Number.isFinite(b))throw unsupported();continue;}
  if(!a||!b||typeof a!=='object'||typeof b!=='object'||Array.isArray(a)!==Array.isArray(b))throw unsupported();
  const ak=Object.keys(a).sort(),bk=Object.keys(b).sort();if(ak.length!==bk.length||ak.some((key,i)=>key!==bk[i])||(Array.isArray(a)&&a.length!==b.length))throw unsupported();
  for(const key of ak)pending.push([a[key],b[key],[...path,key]]);
 }
 return true;
}
