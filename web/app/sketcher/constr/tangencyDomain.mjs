import {classifyFiniteTangency} from './finiteTangencyPredicates.mjs';
// Registered sketch semantics. No persisted frame/contact or endpoint-ID grammar.
export const TANGENT_CC_BRANCHES=Object.freeze(['external','first-contains-second','second-contains-first']);
export const TANGENCY_SCHEMAS=Object.freeze(['TangentLC','FiniteTangentLC','TangentCC']);
export const tangentSide=v=>v===true||v==='true'?-1:1;
export const tangentBoolean=v=>v===true||v===false||v==='true'||v==='false';
export function tangencyConstantsValid(type,c){
 if(!c||typeof c!=='object'||Array.isArray(c))return false;
 const keys=Reflect.ownKeys(c),key=type==='TangentCC'?'branch':'inverted',d=Object.getOwnPropertyDescriptor(c,key);
 return keys.length===1&&keys[0]===key&&!!d?.enumerable&&Object.hasOwn(d,'value')&&(type==='TangentCC'?TANGENT_CC_BRANCHES.includes(d.value):['TangentLC','FiniteTangentLC'].includes(type)&&tangentBoolean(d.value));
}
export const reverseTangentBranch=b=>b==='first-contains-second'?'second-contains-first':b==='second-contains-first'?'first-contains-second':b;
const fail=(code,message)=>{throw Object.assign(Error(message),{code});};
const finite=(...v)=>v.every(Number.isFinite);
// The existing ordinary >1e-9 envelope is a supported numerical domain, not
// a theorem that smaller mathematical circles or distances cannot exist.
export function circleCircleContact(first,second,branch){
 if(first?.TYPE!=='Circle'||second?.TYPE!=='Circle')fail('TANGENCY_TARGET','Circle-Circle tangency requires actual Circle objects.');
 if(!TANGENT_CC_BRANCHES.includes(branch))fail('INVALID_TANGENCY_BRANCH','Choose an exact registered tangent branch.');
 const rA=first.r.get(),rB=second.r.get(),dx=second.c.x-first.c.x,dy=second.c.y-first.c.y,d=Math.hypot(dx,dy);
 if(!finite(rA,rB,dx,dy,d)||rA<=1e-9||rB<=1e-9||d<=1e-9)fail('TANGENCY_DOMAIN','Tangency requires positive circles with a supported distinct-center domain.');
 if(branch==='first-contains-second'&&!(rA>rB)||branch==='second-contains-first'&&!(rB>rA))fail('TANGENCY_BRANCH_DOMAIN','The declared internal containing-circle order is not satisfied.');
 const target=branch==='external'?rA+rB:Math.abs(rA-rB),sign=branch==='second-contains-first'?-1:1;
 return{distance:d,target,radialResidual:d-target,contact:[first.c.x+sign*rA*dx/d,first.c.y+sign*rA*dy/d]};
}
// Geometric finite inclusion is a domain, not a new optimizer equation or a
// promise to search every feasible inequality branch. No tolerance extension.
export function lineCircularContact(line,curve,inverted,finiteContact=false){
 if(line?.TYPE!=='Segment'||!['Circle','Arc'].includes(curve?.TYPE))fail('TANGENCY_TARGET','Choose actual Segment and Circle/Arc objects.');
 if(!tangentBoolean(inverted))fail('INVALID_TANGENCY_BRANCH','Tangency inversion is a literal boolean.');
 const angle=line.params.ang.get(),t=line.params.t.get(),nx=-Math.sin(angle),ny=Math.cos(angle),r=curve.r.get(),dx=line.b.x-line.a.x,dy=line.b.y-line.a.y,len2=dx*dx+dy*dy;
 if(!finite(angle,t,nx,ny,r,dx,dy,len2)||r<=1e-9||len2<=1e-18||Math.abs(t)<=1e-9)fail('TANGENCY_DOMAIN','A current nondegenerate line and positive circular curve are required.');
 const signed=nx*(curve.c.x-line.a.x)+ny*(curve.c.y-line.a.y),q=[curve.c.x-signed*nx,curve.c.y-signed*ny];
 let lambda=((q[0]-line.a.x)*dx+(q[1]-line.a.y)*dy)/len2;
 if(!finite(signed,...q,lambda))fail('TANGENCY_DOMAIN','Nonfinite tangent contact.');
 let arcParameter=null;
 if(finiteContact){
  const classification=classifyFiniteTangency(line,curve);
  if(!classification.inside)fail('FINITE_CONTACT_OUTSIDE','The endpoint-defined tangent foot is outside the actual finite Segment or CCW Arc; no infeasibility is claimed.');
  // Exact predicate decisions above are authority. The following ordinary
  // rounded coordinates/parameters are read-only observations, never source.
  lambda=classification.segmentAt!==null?classification.segmentAt:((curve.c.x-line.a.x)*dx+(curve.c.y-line.a.y)*dy)/len2;
  if(!Number.isFinite(lambda)||lambda<0||lambda>1)fail('FINITE_CONTACT_UNCERTAIN','A rounded finite contact observation is not qualified.');
  q[0]=classification.segmentAt===0?line.a.x:classification.segmentAt===1?line.b.x:line.a.x+lambda*dx;
  q[1]=classification.segmentAt===0?line.a.y:classification.segmentAt===1?line.b.y:line.a.y+lambda*dy;
  if(curve.TYPE==='Arc'){
   if(classification.arcAt!==null)arcParameter=classification.arcAt;
   else{const turn=2*Math.PI,start=Math.atan2(curve.a.y-curve.c.y,curve.a.x-curve.c.x),end=Math.atan2(curve.b.y-curve.c.y,curve.b.x-curve.c.x),at=Math.atan2(q[1]-curve.c.y,q[0]-curve.c.x),sweep=((end-start)%turn+turn)%turn,delta=((at-start)%turn+turn)%turn,value=delta/sweep;arcParameter=Number.isFinite(value)&&value>=0&&value<=1?value:null;}
  }
 }

 return{normal:[nx,ny],angleRadians:angle,polarLength:t,signedDistance:signed,radius:r,residual:signed-tangentSide(inverted)*r,contact:q,segmentParameter:lambda,arcParameter};
}
