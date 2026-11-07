// Private bounded assembly: inputs must be the exact result of the strict
// reader and semantic Worker, rechecked against their live mount by caller.
import {Shell} from 'brep/topo/shell';
import {Face} from 'brep/topo/face';
import {Edge} from 'brep/topo/edge';
import {Vertex} from 'brep/topo/vertex';
import {MBrepShell} from 'cad/model/mshell';
import {BrepSurface} from 'geom/surfaces/brepSurface';
import BrepCurve from 'geom/curves/brepCurve';
import {Plane} from 'geom/impl/plane';
import Vector from 'math/vector';
const fail=():never=>{throw Error('Invalid or colliding validated prism projection');};
function snapshot(v:any,depth=0,budget={nodes:0,chars:0}):any {
 if(++budget.nodes>16384||depth>16)fail();if(v===null||typeof v==='boolean')return v;if(typeof v==='string'){budget.chars+=v.length;if(budget.chars>65536)fail();return v;}if(typeof v==='number'){if(!Number.isFinite(v))fail();return v;}if(!v||typeof v!=='object')fail();const keys=Reflect.ownKeys(v);if(keys.some(k=>typeof k!=='string'))fail();if(Array.isArray(v)){if(v.length>192||keys.length!==v.length+1)fail();return Array.from({length:v.length},(_,i)=>{const d=Object.getOwnPropertyDescriptor(v,String(i));if(!d?.enumerable||!('value'in d))fail();return snapshot(d.value,depth+1,budget)});}if(keys.length>32)fail();const out=Object.create(null);for(const k of keys as string[]){const d=Object.getOwnPropertyDescriptor(v,k);if(k==='__proto__'||!d?.enumerable||!('value'in d))fail();budget.chars+=k.length;if(budget.chars>65536)fail();out[k]=snapshot(d.value,depth+1,budget);}return out;
}
const exact=(x:any,k:string[])=>{if(!x||typeof x!=='object'||Array.isArray(x)||Object.keys(x).sort().join(',')!==k.slice().sort().join(','))fail();};
const dense=(a:any,n:number)=>Array.isArray(a)&&a.length===n&&Array.from({length:n},(_,i)=>Object.prototype.hasOwnProperty.call(a,i)).every(Boolean);
const vector=(v:any)=>{if(!dense(v,3)||v.some((x:any)=>typeof x!=='number'||!Number.isFinite(x)||Math.abs(x)>2e7))fail();return v as number[];};
const norm=(a:number[])=>Math.hypot(...a),diff=(a:number[],b:number[])=>a.map((n,i)=>n-b[i]),dot=(a:number[],b:number[])=>a.reduce((s,n,i)=>s+n*b[i],0);
const unsupported=()=>{throw Error('Research analytic geometry operation unsupported')};
function planeSurface(origin:number[],n:number[],inverted:boolean):BrepSurface {
 const normal=new Vector(n[0],n[1],n[2]),helper=Math.abs(n[0])<0.9?[1,0,0]:[0,1,0];let u=[n[1]*helper[2]-n[2]*helper[1],n[2]*helper[0]-n[0]*helper[2],n[0]*helper[1]-n[1]*helper[0]];const l=norm(u);if(!Number.isFinite(l)||l===0)fail();u=u.map(x=>x/l);const v=[n[1]*u[2]-n[2]*u[1],n[2]*u[0]-n[0]*u[2],n[0]*u[1]-n[1]*u[0]],point=(a:number,b:number)=>origin.map((x,i)=>x+a*u[i]+b*v[i]);
 const impl:any={domainU:[-2e7,2e7],domainV:[-2e7,2e7],knotsU:[-2e7,2e7],knotsV:[-2e7,2e7],uMin:-2e7,uMax:2e7,vMin:-2e7,vMax:2e7,isMirrored:false,degreeU:()=>1,degreeV:()=>1,point,param:(p:number[])=>[dot(diff(p,origin),u),dot(diff(p,origin),v)],normal:()=>[...n],eval:(a:number,b:number)=>[point(a,b),u,v],transform:unsupported};
 const surface=new BrepSurface(impl,inverted),oriented=inverted?normal.negate():normal;(surface as any)._simpleSurface=new Plane(oriented as any,oriented.dot(new Vector(...origin as [number,number,number])));return surface;
}
function lineCurve(a:number[],b:number[]):BrepCurve{const d=diff(b,a),dd=dot(d,d);if(!Number.isFinite(dd)||dd<=1e-12)fail();const point=(u:number)=>a.map((x,i)=>x+u*d[i]),impl:any={domain:()=>[0,1],degree:()=>1,point,param:(p:number[])=>dot(diff(p,a),d)/dd,eval:(u:number)=>[point(u),d],knots:()=>[0,1],transform:unsupported,invert:unsupported,split:unsupported};return new BrepCurve(impl);}
// Tuple encoding is injective for the admitted strings; IDs remain opaque.
const stableId=(tuple:any[])=>'worker-prism:1:'+JSON.stringify(tuple);
export function projectValidatedRectanglePrism(input:any, occupiedIds: Set<string>) {
 if(!(occupiedIds instanceof Set))fail();
 // structuredClone occurs before any model creation; caller must preserve the
 // exact Worker response and assert live mount binding before and afterwards.
 const data=snapshot(input);if(new TextEncoder().encode(JSON.stringify(data)).byteLength>65536)fail();exact(data,['topology','roles']);const t=data.topology,r=data.roles;
 exact(t,['version','unit','idScope','toleranceMm','vertices','edges','faces','sourceEdges']);
 if(t.version!==1||t.unit!=='millimeter'||t.idScope!=='response-local'||t.toleranceMm!==1e-6||!dense(t.vertices,8)||!dense(t.edges,12)||!dense(t.faces,6)||!dense(t.sourceEdges,4))fail();
 if(new TextEncoder().encode(JSON.stringify(t)).byteLength>16384)fail();
 exact(r,['version','scope','binding','engineBinding','records','unsupported']);exact(r.binding,['featureId','revision','sketchDigest','faceId','regionId']);exact(r.engineBinding,['mountId','generation','representation','id']);exact(r.unsupported,['connectorEdges','vertices']);
 const {featureId,revision,sketchDigest,faceId,regionId}=r.binding;
 if(r.version!==1||r.scope!=='authored-feature'||typeof featureId!=='string'||!featureId||featureId.length>256||typeof revision!=='string'||!revision||revision.length>256||typeof sketchDigest!=='string'||!/^[a-f0-9]{64}$/.test(sketchDigest)||typeof faceId!=='string'||!faceId||faceId.length>256||typeof regionId!=='string'||!regionId||regionId.length>8192||r.engineBinding.representation!=='occ-brep-worker-owned'||typeof r.engineBinding.mountId!=='string'||!r.engineBinding.mountId||typeof r.engineBinding.id!=='string'||!r.engineBinding.id||!Number.isSafeInteger(r.engineBinding.generation)||r.engineBinding.generation<1||!dense(r.records,14)||!dense(r.unsupported.connectorEdges,4)||r.unsupported.vertices!=='authored-endpoint-identity-not-qualified')fail();
 const vertexPoints=t.vertices.map((v:any,i:number)=>{exact(v,['id','point']);if(v.id!=='vertex:'+i)fail();return vector(v.point)}),edgeModels=t.edges.map((e:any,i:number)=>{exact(e,['id','curve','a','b','uses']);exact(e.curve,['type','tessellation']);if(e.id!=='edge:'+i||e.curve.type!=='line-segment'||!/^vertex:[0-7]$/.test(e.a)||!/^vertex:[0-7]$/.test(e.b)||e.a===e.b||!Array.isArray(e.curve.tessellation)||e.curve.tessellation.length<2||e.curve.tessellation.length>64||!dense(e.curve.tessellation,e.curve.tessellation.length)||!dense(e.uses,2))fail();e.curve.tessellation.forEach(vector);return e;});
 const faceModels=t.faces.map((f:any,i:number)=>{exact(f,['id','plane','inverted','loop','triangles']);exact(f.plane,['origin','normal','direct']);if(f.id!=='face:'+i||f.plane.direct!==true||typeof f.inverted!=='boolean'||Math.abs(norm(vector(f.plane.normal))-1)>1e-7||!dense(f.loop,4)||!dense(f.triangles,2))fail();vector(f.plane.origin);for(const u of f.loop){exact(u,['edge','reversed']);if(typeof u.reversed!=='boolean'||!/^edge:(?:[0-9]|1[01])$/.test(u.edge))fail();}for(const tri of f.triangles){if(!dense(tri,3))fail();tri.forEach(vector);}return f;});
 const localFaces=new Map(),localEdges=new Map(),ids=new Set<string>(),expected=new Map<string,number>(),segmentSets=new Map<string,Set<string>>();
 const addId=(id:string)=>{if(id.length>16384||ids.has(id)||occupiedIds.has(id))fail();ids.add(id);};
 const bodyId=stableId([featureId,'body']);addId(bodyId);
 for(const row of r.records){exact(row,['key','resultLocal']);exact(row.key,['featureId','kind','role','source']);const k=row.key;if(k.featureId!==featureId||!['face','edge'].includes(k.kind)||typeof row.resultLocal!=='string')fail();const table=k.kind==='face'?localFaces:localEdges;if(table.has(row.resultLocal))fail();
  if(k.kind==='face'&&['BASE','LID'].includes(k.role)){exact(k.source,['regionId']);if(k.source.regionId!==regionId||!/^face:[0-5]$/.test(row.resultLocal))fail();}
  else if((k.kind==='face'&&k.role==='SWEEP')||(k.kind==='edge'&&['BASE','LID'].includes(k.role))){exact(k.source,['segmentId']);const seg=k.source.segmentId;if(typeof seg!=='string'||!seg||seg.length>513||!(k.kind==='face'?/^face:[0-5]$/:/^edge:(?:[0-9]|1[01])$/).test(row.resultLocal))fail();const set=segmentSets.get(k.kind+':'+k.role)||new Set();if(set.has(seg))fail();set.add(seg);segmentSets.set(k.kind+':'+k.role,set);}
  else fail();const role=k.kind+':'+k.role;expected.set(role,(expected.get(role)||0)+1);const id=stableId([featureId,k.kind,k.role,k.source]);addId(id);table.set(row.resultLocal,{id,key:k});
 }
 if(localFaces.size!==6||localEdges.size!==8||expected.get('face:BASE')!==1||expected.get('face:LID')!==1||expected.get('face:SWEEP')!==4||expected.get('edge:BASE')!==4||expected.get('edge:LID')!==4)fail();
 const sourceSet=segmentSets.get('face:SWEEP');for(const name of ['edge:BASE','edge:LID']){const set=segmentSets.get(name);if(!set||set.size!==4||[...sourceSet].some(id=>!set.has(id)))fail();}
 // Check that semantic records still correspond to the validated authored
 // region and actual local incidence, without re-running geometry validation.
 let region:any;try{if(!regionId.startsWith('sketch-region:'))fail();region=JSON.parse(regionId.slice('sketch-region:'.length));}catch{fail();}
 exact(region,['faceId','outer','holes']);if(region.faceId!==faceId||!dense(region.outer,4)||!dense(region.holes,0)||region.outer.some((x:any)=>typeof x!=='string'||!x)||new Set(region.outer).size!==4||[...sourceSet].some(id=>!region.outer.includes(id)))fail();
 const sourceMap=new Map<string,any>();for(const source of t.sourceEdges){exact(source,['sourceEdgeId','baseEdge','sweptFace','sourceReversed']);if(typeof source.sourceEdgeId!=='string'||!sourceSet.has(source.sourceEdgeId)||sourceMap.has(source.sourceEdgeId)||typeof source.sourceReversed!=='boolean'||!localEdges.has(source.baseEdge)||!localFaces.has(source.sweptFace))fail();sourceMap.set(source.sourceEdgeId,source);}if(sourceMap.size!==4)fail();
 const uses=new Map<string,any[]>();for(const f of faceModels){const seen=new Set<string>();for(let i=0;i<4;i++){const u=f.loop[i],next=f.loop[(i+1)%4],e=edgeModels[Number(u.edge.slice(5))],n=edgeModels[Number(next.edge.slice(5))];if(!e||!n||seen.has(u.edge)||(u.reversed?e.a:e.b)!==(next.reversed?n.b:n.a))fail();seen.add(u.edge);const list=uses.get(u.edge)||[];list.push({face:f.id,reversed:u.reversed});uses.set(u.edge,list);}}
 for(const e of edgeModels){const actual=uses.get(e.id);if(!actual||actual.length!==2||actual[0].face===actual[1].face||actual[0].reversed===actual[1].reversed)fail();for(const u of e.uses){exact(u,['face','reversed']);if(typeof u.reversed!=='boolean'||!actual.some(x=>x.face===u.face&&x.reversed===u.reversed))fail();}if(e.uses[0].face===e.uses[1].face)fail();}
 const roleBy=(kind:string,role:string,segmentId?:string)=>r.records.filter((row:any)=>row.key.kind===kind&&row.key.role===role&&(!segmentId||row.key.source.segmentId===segmentId));
 const baseFace=roleBy('face','BASE')[0].resultLocal,lidFace=roleBy('face','LID')[0].resultLocal;if(baseFace===lidFace)fail();
 for(const [id,source] of sourceMap){const sweep=roleBy('face','SWEEP',id),baseEdge=roleBy('edge','BASE',id),lidEdge=roleBy('edge','LID',id);if(sweep.length!==1||baseEdge.length!==1||lidEdge.length!==1||sweep[0].resultLocal!==source.sweptFace||baseEdge[0].resultLocal!==source.baseEdge||!uses.get(source.baseEdge)?.some(x=>x.face===baseFace)||!uses.get(source.baseEdge)?.some(x=>x.face===source.sweptFace)||!uses.get(lidEdge[0].resultLocal)?.some(x=>x.face===lidFace)||!uses.get(lidEdge[0].resultLocal)?.some(x=>x.face===source.sweptFace))fail();}
 const connectorSet=new Set(r.unsupported.connectorEdges);if(connectorSet.size!==4||[...connectorSet].some(id=>typeof id!=='string'||!/^edge:(?:[0-9]|1[01])$/.test(id)||localEdges.has(id)))fail();
 // IDs for unqualified elements are scoped to one projection, not a feature.
 const nonce=crypto.randomUUID(),transientIds=new Set<string>();for(const id of connectorSet){const v=stableId(['transient',nonce,id]);addId(v);transientIds.add(v);localEdges.set(id,{id:v,key:null});}const vertexIds=vertexPoints.map((_:any,i:number)=>{const id=stableId(['transient',nonce,'vertex:'+i]);addId(id);transientIds.add(id);return id;});
 const shell=new Shell(),vertices=vertexPoints.map((v:number[])=>new Vertex(new Vector(...v as [number,number,number])));
 const edges=edgeModels.map((e:any)=>{const a=Number(e.a.slice(7)),b=Number(e.b.slice(7)),edge=new Edge(lineCurve(vertexPoints[a],vertexPoints[b]),vertices[a],vertices[b]),identity=localEdges.get(e.id);edge.data.id=identity.id;edge.data.portableIdentity=identity.key?{stability:'authored',key:identity.key}:{stability:'transient'};edge.data.tessellation=e.curve.tessellation;return edge;});
 for(const f of faceModels){const surface=planeSurface(f.plane.origin,f.plane.normal,f.inverted),face=new Face(surface),identity=localFaces.get(f.id);if(!identity)fail();face.data.id=identity.id;face.data.portableIdentity={stability:'authored',key:identity.key};face.data.tessellation={format:'verbose',data:f.triangles.map((t:number[][])=>{const tri=t.map(p=>[...p]),a=diff(tri[1],tri[0]),b=diff(tri[2],tri[0]),c=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];if((f.inverted?-1:1)*dot(c,f.plane.normal)<0)tri.reverse();return [tri]})};face.shell=shell;for(const u of f.loop){const e=edges[Number(u.edge.slice(5))],he=u.reversed?e.halfEdge2:e.halfEdge1;if(he.loop)fail();face.outerLoop.halfEdges.push(he);}face.outerLoop.link();shell.faces.push(face);}
 if(edges.some(e=>!e.halfEdge1.loop||!e.halfEdge2.loop))fail();const model=new MBrepShell(shell);model.id=bodyId;
 for(const v of model.vertices){const i=vertices.indexOf(v.brepVertex);if(i<0)fail();v.id=vertexIds[i];v.ext.vertexIdentity=Object.freeze({source:'worker-prism',stability:'transient'});}
 for(const e of model.edges){if(transientIds.has(e.id))e.ext.workerIdentity=Object.freeze({stability:'transient'});else e.ext.workerIdentity=Object.freeze({stability:'authored'});}
 model.ext.workerGeometry=Object.freeze({version:1,representation:'worker-owned-occ-prism',engine:'occ',legacyPointerCompatible:false,durableVertexReferences:false,durableConnectorReferences:false});
 return {model,durableIds:[...ids].filter(id=>!transientIds.has(id)),transientIds:[...transientIds]};
}
