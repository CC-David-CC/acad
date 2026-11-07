import {planCenteredHole} from './centeredHolePlan.mjs';

// Pure geometric planning only. The caller must authenticate this prepared
// profile and centered-hole request against its live candidate owner/mount.
const CLEARANCE=1e-5, FRAME_TOL=1e-9, MATCH_TOL=1e-8;
const fail=(code,message)=>{const e=new Error(message);e.code=code;throw e;};
const exact=(v,keys)=>{if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).sort().join(',')!==keys.slice().sort().join(','))fail('INVALID_REQUEST','Unexpected planner fields.');};
function copy(value,depth=0,budget={nodes:0,chars:0}){
 if(++budget.nodes>4096||depth>12)fail('INVALID_REQUEST','Planner input exceeds limits.');
 if(value===null||typeof value==='boolean')return value;
 if(typeof value==='number'){if(!Number.isFinite(value))fail('INVALID_REQUEST','Planner numbers must be finite.');return value;}
 if(typeof value==='string'){if((budget.chars+=value.length)>32768)fail('INVALID_REQUEST','Planner input exceeds limits.');return value;}
 if(!value||typeof value!=='object')fail('INVALID_REQUEST','Planner input must be data.');
 const keys=Reflect.ownKeys(value);if(keys.some(k=>typeof k!=='string'))fail('INVALID_REQUEST','Planner input must use string keys.');
 if(Array.isArray(value)){if(value.length>32||keys.length!==value.length+1)fail('INVALID_REQUEST','Planner arrays must be bounded and dense.');return Array.from({length:value.length},(_,i)=>{const d=Object.getOwnPropertyDescriptor(value,String(i));if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))fail('INVALID_REQUEST','Planner arrays must be data.');return copy(d.value,depth+1,budget);});}
 const proto=Object.getPrototypeOf(value);if(proto!==null&&Object.getPrototypeOf(proto)!==null)fail('INVALID_REQUEST','Planner records must be plain.');if(keys.length>24)fail('INVALID_REQUEST','Planner input exceeds limits.');const out=Object.create(null);for(const k of keys){const d=Object.getOwnPropertyDescriptor(value,k);if(k==='__proto__'||!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value')||(budget.chars+=k.length)>32768)fail('INVALID_REQUEST','Planner fields must be data.');out[k]=copy(d.value,depth+1,budget);}return out;
}
const vector=(a,n)=>Array.isArray(a)&&a.length===n&&a.every(Number.isFinite);
const canonicalId=s=>typeof s==='string'&&/^[1-9][0-9]*$/.test(s)&&Number.isSafeInteger(Number(s));
export function planFourCornerHoles(profile,centeredRequest,request){
 profile=copy(profile);centeredRequest=copy(centeredRequest);request=copy(request);
 exact(profile,['version','op','unit','engine','revision','sketchDigest','faceId','regionId','frame','depth','direction','bodyPolicy','edges','worldVertices']);
 exact(request,['version','unit','featureId','parentFeatureId','centerFeatureId','revision','sketchDigest','faceId','regionId','sideIds','offsetX','offsetY','diameter']);
 if(![1,2].includes(profile.version)||profile.op!=='sketch.region.extrude.prepare'||profile.unit!=='millimeter'||profile.engine!=='occ'||profile.bodyPolicy!=='separate'||request.version!==1||request.unit!=='millimeter')fail('UNSUPPORTED_PROFILE','A checked OCC millimeter rectangle is required.');
 if(![request.featureId,request.parentFeatureId,request.centerFeatureId].every(canonicalId)||new Set([request.featureId,request.parentFeatureId,request.centerFeatureId]).size!==3)fail('INVALID_REQUEST','Feature identities must be distinct canonical positive integers.');
 for(const k of ['revision','faceId','regionId'])if(typeof request[k]!=='string'||!request[k]||request[k].length>(k==='regionId'?8192:256)||request[k]!==profile[k])fail('STALE_SOURCE','The rectangle source binding changed.');
 if(typeof request.sketchDigest!=='string'||!/^[0-9a-f]{64}$/.test(request.sketchDigest)||request.sketchDigest!==profile.sketchDigest)fail('STALE_SOURCE','The rectangle sketch binding changed.');
 for(const k of ['offsetX','offsetY','diameter'])if(typeof request[k]!=='number'||!Number.isFinite(request[k])||request[k]<=0||request[k]>1e6)fail('INVALID_REQUEST','Dimensions must be finite and positive.');
 const radius=request.diameter/2;if(radius<=CLEARANCE)fail('UNSUPPORTED_PROFILE','Hole radius is below the supported precision.');
 // Recomputing the center hole validates the same parent profile, its existing
 // center diameter and source binding. It does not authenticate prior history.
 const center=planCenteredHole(profile,centeredRequest);
 exact(profile.frame,['origin','x','y','z']);const f=profile.frame,basis=[[1,0,0],[0,1,0],[0,0,1]];
 if(!vector(f.origin,3)||![f.x,f.y,f.z].every((a,i)=>vector(a,3)&&a.every((v,j)=>Math.abs(v-basis[i][j])<=FRAME_TOL))||!Array.isArray(profile.edges)||profile.edges.length!==4||!Array.isArray(profile.worldVertices)||profile.worldVertices.length!==4)fail('UNSUPPORTED_PROFILE','A principal-XY rectangle is required.');
 // A merely near-XY frame can carry a real tilt. Do not flatten it while
 // passing centers to a principal-Z cutter: reject until that path is qualified.
 if(!vector(profile.direction,3)||profile.direction.some((n,i)=>n!==basis[2][i])||f.x[2]!==0||f.y[2]!==0||profile.worldVertices.some(v=>!vector(v,3)||v[2]!==profile.worldVertices[0][2]))fail('UNSUPPORTED_PROFILE','Only exactly planar XY profiles and +Z through direction are supported.');
 const dot3=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0),cross3=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],zLength=Math.hypot(...f.z);if(f.origin.some(n=>Math.abs(n)>1e7)||[f.x,f.y,f.z].some(a=>Math.abs(dot3(a,a)-1)>FRAME_TOL)||Math.abs(dot3(f.x,f.y))>FRAME_TOL||Math.abs(dot3(f.x,f.z))>FRAME_TOL||Math.abs(dot3(f.y,f.z))>FRAME_TOL||cross3(f.x,f.y).some((n,i)=>Math.abs(n-f.z[i])>FRAME_TOL)||!vector(profile.direction,3)||f.z.some((n,i)=>Math.abs(n/zLength-profile.direction[i])>1e-12))fail('UNSUPPORTED_PROFILE','The rectangle frame is inconsistent.');
 let region;try{if(!request.regionId.startsWith('sketch-region:'))throw Error();region=JSON.parse(request.regionId.slice('sketch-region:'.length));}catch{fail('STALE_SOURCE','The source region is not canonical.');}
 exact(region,['faceId','outer','holes']);if(region.faceId!==request.faceId||!Array.isArray(region.outer)||region.outer.length!==4||!Array.isArray(region.holes)||region.holes.length!==0||region.outer.some(s=>typeof s!=='string'||!s||s.length>513)||new Set(region.outer).size!==4||region.outer.some((s,i)=>i&&region.outer[i-1]>=s)||'sketch-region:'+JSON.stringify(region)!==request.regionId)fail('STALE_SOURCE','The source region changed.');
 const toWorld=p=>f.origin.map((v,i)=>v+f.x[i]*p.x+f.y[i]*p.y),p=profile.worldVertices,edges=[],sideMap=new Map();
 for(let i=0;i<4;i++){
  const e=profile.edges[i];exact(e,['id','a','b','reversed']);exact(e.a,['x','y']);exact(e.b,['x','y']);
  if(typeof e.id!=='string'||!region.outer.includes(e.id)||typeof e.reversed!=='boolean'||![e.a.x,e.a.y,e.b.x,e.b.y].every(n=>Number.isFinite(n)&&Math.abs(n)<=1e7)||!vector(p[i],3)||!vector(p[(i+1)%4],3))fail('STALE_SOURCE','The source edge is unavailable.');
  const a=toWorld(e.a),b=toWorld(e.b);if(a.some((v,j)=>Math.abs(v-p[i][j])>MATCH_TOL)||b.some((v,j)=>Math.abs(v-p[(i+1)%4][j])>MATCH_TOL))fail('STALE_SOURCE','The source edge does not match the prepared profile.');
  const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);if(!Number.isFinite(length)||length<=CLEARANCE)fail('UNSUPPORTED_PROFILE','The rectangle has a degenerate side.');
  const horizontal=Math.abs(dy)<=length*1e-8,vertical=Math.abs(dx)<=length*1e-8;if(horizontal===vertical)fail('UNSUPPORTED_PROFILE','The rectangle side orientation is ambiguous.');
  const role=horizontal?(dx>0?'MIN_Y':'MAX_Y'):(dy>0?'MAX_X':'MIN_X');if(sideMap.has(role))fail('UNSUPPORTED_PROFILE','The rectangle sides are ambiguous.');
  const edge={id:e.id,role,a,b,length,n:[-dy/length,dx/length],t:[dx/length,dy/length]};edges.push(edge);sideMap.set(role,edge);
 }
 if(new Set(edges.map(e=>e.id)).size!==4||region.outer.some(id=>!edges.some(e=>e.id===id))||sideMap.size!==4)fail('STALE_SOURCE','The authored boundary changed.');
 exact(request.sideIds,['minX','maxX','minY','maxY']);for(const [field,role] of [['minX','MIN_X'],['maxX','MAX_X'],['minY','MIN_Y'],['maxY','MAX_Y']])if(typeof request.sideIds[field]!=='string'||request.sideIds[field]!==sideMap.get(role).id)fail('STALE_SOURCE','An authored side changed its semantic role.');
 const origin=p[0],spec=[['MIN_X_MIN_Y','MIN_X','MIN_Y'],['MAX_X_MIN_Y','MAX_X','MIN_Y'],['MAX_X_MAX_Y','MAX_X','MAX_Y'],['MIN_X_MAX_Y','MIN_X','MAX_Y']];
 const corners=spec.map(([role,xRole,yRole])=>{
  const x=sideMap.get(xRole),y=sideMap.get(yRole),det=x.n[0]*y.n[1]-x.n[1]*y.n[0];if(!Number.isFinite(det)||Math.abs(det)<1e-8)fail('UNSUPPORTED_PROFILE','Corner sides do not intersect uniquely.');
  const rhs=(e,off)=>e.n[0]*(e.a[0]-origin[0])+e.n[1]*(e.a[1]-origin[1])+off,rx=rhs(x,request.offsetX),ry=rhs(y,request.offsetY);
  const point=[origin[0]+(rx*y.n[1]-x.n[1]*ry)/det,origin[1]+(x.n[0]*ry-rx*y.n[0])/det,origin[2]];if(point.some(v=>!Number.isFinite(v)||Math.abs(v)>1e6))fail('UNSUPPORTED_PROFILE','Corner center exceeds coordinate limits.');
  for(const e of edges){const delta=[point[0]-e.a[0],point[1]-e.a[1]],inside=delta[0]*e.n[0]+delta[1]*e.n[1],along=delta[0]*e.t[0]+delta[1]*e.t[1];if(!Number.isFinite(inside)||inside<=radius+CLEARANCE||along<0||along>e.length)fail('HOLE_OUTSIDE_PROFILE','Each hole must clear every finite rectangle side.');}
  if(Math.hypot(point[0]-center.center[0],point[1]-center.center[1])<=radius+center.radius+CLEARANCE)fail('HOLES_OVERLAP','A corner hole overlaps or touches the center hole.');
  return {role,center:point,radius,sides:{x:x.id,y:y.id}};
 });
 for(let i=0;i<corners.length;i++)for(let j=i+1;j<corners.length;j++)if(Math.hypot(corners[i].center[0]-corners[j].center[0],corners[i].center[1]-corners[j].center[1])<=2*radius+CLEARANCE)fail('HOLES_OVERLAP','Corner holes must be strictly separated.');
 const expectedVolume=center.expectedVolume-4*Math.PI*radius*radius*center.depth;if(!Number.isFinite(expectedVolume)||expectedVolume<=0)fail('UNSUPPORTED_PROFILE','The holes leave no valid volume.');
 for(const c of corners){Object.freeze(c.center);Object.freeze(c.sides);Object.freeze(c);}return Object.freeze({version:1,unit:'millimeter',featureId:request.featureId,parentFeatureId:request.parentFeatureId,centerFeatureId:request.centerFeatureId,revision:request.revision,sketchDigest:request.sketchDigest,faceId:request.faceId,regionId:request.regionId,sideIds:Object.freeze({...request.sideIds}),offsetX:request.offsetX,offsetY:request.offsetY,diameter:request.diameter,clearance:CLEARANCE,depth:center.depth,direction:Object.freeze([...profile.direction]),margin:center.margin,existingHole:Object.freeze({center:center.center,radius:center.radius}),expectedVolume,corners:Object.freeze(corners)});
}
