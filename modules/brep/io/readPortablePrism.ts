// Research boundary: does not install a model, invoke OCC, or create native refs.
import {Shell} from 'brep/topo/shell';
import {Face} from 'brep/topo/face';
import {Edge} from 'brep/topo/edge';
import {Vertex} from 'brep/topo/vertex';
import {BrepSurface} from 'geom/surfaces/brepSurface';
import BrepCurve from 'geom/curves/brepCurve';
import {Plane} from 'geom/impl/plane';
import Vector from 'math/vector';

const fail=(s:string):never=>{throw Error('Invalid portable prism: '+s)};
const TOL=1e-6;
function snapshot(v:any, depth=0, budget={nodes:0,chars:0}):any {
 if(++budget.nodes>16384)fail('input nodes');
 if(depth>16)fail('nesting');if(v===null||typeof v==='boolean')return v;if(typeof v==='string'){budget.chars+=v.length;if(budget.chars>16384)fail('input strings');return v;}
 if(typeof v==='number'){if(!Number.isFinite(v))fail('nonfinite');return v;}
 if(!v||typeof v!=='object')fail('non-data value');
 const keys=Reflect.ownKeys(v);if(keys.some(k=>typeof k!=='string'))fail('symbol');
 if(Array.isArray(v)) {if(v.length>192||keys.length!==v.length+1)fail('sparse or oversized array');return Array.from({length:v.length},(_,i)=>{const d=Object.getOwnPropertyDescriptor(v,String(i));if(!d?.enumerable||!('value'in d))fail('sparse array');return snapshot(d.value,depth+1,budget)});}
 if(keys.length>32)fail('oversized record');const out=Object.create(null);for(const k of keys as string[]){const d=Object.getOwnPropertyDescriptor(v,k);if(!d?.enumerable||!('value'in d))fail('accessor');budget.chars+=k.length;if(budget.chars>16384)fail('input strings');out[k]=snapshot(d.value,depth+1,budget)}return out;
}
const exact=(o:any,ks:string[])=>{if(!o||typeof o!=='object'||Array.isArray(o)||Object.keys(o).sort().join(',')!==ks.slice().sort().join(','))fail('record shape');};
const arr=(v:any,n:number)=>{if(!Array.isArray(v)||v.length!==n)fail('array length');};
const vec=(v:any)=>{arr(v,3);if(v.some((n:any)=>typeof n!=='number'||!Number.isFinite(n)||Math.abs(n)>2e7))fail('coordinate');return v as number[];};
const diff=(a:number[],b:number[])=>a.map((x,i)=>x-b[i]);
const dot=(a:number[],b:number[])=>a.reduce((s,x,i)=>s+x*b[i],0);
const norm=(a:number[])=>Math.hypot(...a);
const close=(a:number[],b:number[])=>norm(diff(a,b))<=TOL;
const token=(s:any,p:string,n:number)=>{if(typeof s!=='string'||!new RegExp('^'+p+':[0-9]+$').test(s)||s!==p+':'+n)fail('local ID');return s;};
function planarSurface(origin:number[],n:number[],inverted:boolean):BrepSurface {
 const normal=new Vector(n[0],n[1],n[2]);const helper=Math.abs(n[0])<0.9?[1,0,0]:[0,1,0];
 let u=[n[1]*helper[2]-n[2]*helper[1],n[2]*helper[0]-n[0]*helper[2],n[0]*helper[1]-n[1]*helper[0]];const l=norm(u);u=u.map(x=>x/l);const v=[n[1]*u[2]-n[2]*u[1],n[2]*u[0]-n[0]*u[2],n[0]*u[1]-n[1]*u[0]];
 const point=(x:number,y:number)=>origin.map((a,i)=>a+x*u[i]+y*v[i]);
 const unsupported=()=>{throw Error('Research analytic plane operation unsupported')};
 const impl:any={domainU:[-2e7,2e7],domainV:[-2e7,2e7],knotsU:[-2e7,2e7],knotsV:[-2e7,2e7],uMin:-2e7,uMax:2e7,vMin:-2e7,vMax:2e7,isMirrored:false,degreeU:()=>1,degreeV:()=>1,point,param:(p:number[])=>[dot(diff(p,origin),u),dot(diff(p,origin),v)],normal:()=>[...n],eval:(x:number,y:number)=>[point(x,y),u,v],transform:unsupported};
 const surface=new BrepSurface(impl,inverted);const oriented=inverted?normal.negate():normal;(surface as any)._simpleSurface=new Plane(oriented as any,oriented.dot(new Vector(...origin as [number,number,number])));return surface;
}
function straightCurve(a:number[],b:number[]):BrepCurve {
 const d=diff(b,a),dd=dot(d,d),point=(u:number)=>a.map((x,i)=>x+u*d[i]);const unsupported=()=>{throw Error('Research analytic line operation unsupported')};
 const impl:any={domain:()=>[0,1],degree:()=>1,point,param:(p:number[])=>dot(diff(p,a),d)/dd,eval:(u:number)=>[point(u),d],knots:()=>[0,1],transform:unsupported,invert:unsupported,split:unsupported};return new BrepCurve(impl);
}
export function readPortablePrism(input:any, provenance:any) {
 const d=snapshot(input),p=snapshot(provenance);if(new TextEncoder().encode(JSON.stringify(d)).byteLength>16384)fail('bytes');
 exact(p,['engine','mountId','generation']);if(p.engine!=='occ-brep-worker-owned'||typeof p.mountId!=='string'||!p.mountId||p.mountId.length>256||!Number.isSafeInteger(p.generation)||p.generation<1)fail('provenance');
 exact(d,['version','unit','idScope','toleranceMm','vertices','edges','faces','sourceEdges']);if(d.version!==1||d.unit!=='millimeter'||d.idScope!=='response-local'||d.toleranceMm!==TOL)fail('version');
 arr(d.vertices,8);arr(d.edges,12);arr(d.faces,6);arr(d.sourceEdges,4);
 const points=d.vertices.map((v:any,i:number)=>{exact(v,['id','point']);token(v.id,'vertex',i);return vec(v.point)});
 for(let i=0;i<8;i++)for(let j=0;j<i;j++)if(close(points[i],points[j]))fail('coincident vertices');
 const vertexIndex=(id:string)=>{if(typeof id!=='string'||!/^vertex:[0-7]$/.test(id))fail('vertex ID');return Number(id.slice(7));};
 const edgeIndex=(id:string)=>{if(typeof id!=='string'||!/^edge:(?:[0-9]|1[01])$/.test(id))fail('edge ID');return Number(id.slice(5));};
 const faceIndex=(id:string)=>{if(typeof id!=='string'||!/^face:[0-5]$/.test(id))fail('face ID');return Number(id.slice(5));};
 const incidence:any[][]=Array.from({length:12},()=>[]),pairs=new Set();
 d.edges.forEach((e:any,i:number)=>{exact(e,['id','curve','a','b','uses']);token(e.id,'edge',i);const a=vertexIndex(e.a),b=vertexIndex(e.b);if(a===b)fail('edge');const key=[a,b].sort().join(',');if(pairs.has(key))fail('coincident edge');pairs.add(key);exact(e.curve,['type','tessellation']);if(e.curve.type!=='line-segment'||!Array.isArray(e.curve.tessellation)||e.curve.tessellation.length<2||e.curve.tessellation.length>64)fail('edge curve');const ps=e.curve.tessellation.map(vec),ab=diff(points[b],points[a]),len=norm(ab);if(len<=2*TOL||!((close(ps[0],points[a])&&close(ps[ps.length-1],points[b]))||(close(ps[0],points[b])&&close(ps[ps.length-1],points[a]))))fail('edge ends');for(const q of ps){const aq=diff(q,points[a]),t=dot(aq,ab)/(len*len);if(t < -TOL/len||t>1+TOL/len||norm(aq.map((x,k)=>x-t*ab[k]))>TOL)fail('edge line');}arr(e.uses,2);});
 let triangleCount=0;d.faces.forEach((f:any,i:number)=>{exact(f,['id','plane','inverted','loop','triangles']);token(f.id,'face',i);exact(f.plane,['origin','normal','direct']);const o=vec(f.plane.origin),n=vec(f.plane.normal);if(Math.abs(norm(n)-1)>1e-7||f.plane.direct!==true||typeof f.inverted!=='boolean')fail('plane');arr(f.loop,4);const used=new Set();f.loop.forEach((u:any,j:number)=>{exact(u,['edge','reversed']);const k=edgeIndex(u.edge);if(typeof u.reversed!=='boolean'||used.has(k))fail('coedge');used.add(k);const e=d.edges[k],start=u.reversed?e.b:e.a,end=u.reversed?e.a:e.b,next=f.loop[(j+1)%4],ne=d.edges[edgeIndex(next.edge)];if(end!==(next.reversed?ne.b:ne.a))fail('loop');for(const id of [start,end])if(Math.abs(dot(diff(points[vertexIndex(id)],o),n))>TOL)fail('vertex plane');incidence[k].push({face:f.id,reversed:u.reversed});});
 const ring=f.loop.map((u:any)=>{const e=d.edges[edgeIndex(u.edge)];return points[vertexIndex(u.reversed?e.b:e.a)]}),anchor=ring[0],area=[0,0,0];for(let j=0;j<4;j++){const a=diff(ring[j],anchor),b=diff(ring[(j+1)%4],anchor);area[0]+=a[1]*b[2]-a[2]*b[1];area[1]+=a[2]*b[0]-a[0]*b[2];area[2]+=a[0]*b[1]-a[1]*b[0];}if((f.inverted?-1:1)*dot(area,n)<=TOL*TOL)fail('face orientation');
 if(!Array.isArray(f.triangles)||f.triangles.length!==2)fail('triangles');const triCorners:number[][]=[];for(const t of f.triangles){arr(t,3);triangleCount++;const q=t.map(vec);const corners=q.map((v:number[])=>{const matches=ring.flatMap((p:number[],index:number)=>close(v,p)?[index]:[]);if(matches.length!==1)fail('triangle boundary');return matches[0];});if(new Set(corners).size!==3)fail('triangle boundary');triCorners.push(corners);for(const v of q)if(Math.abs(dot(diff(v,o),n))>TOL)fail('triangle plane');const a=diff(q[1],q[0]),b=diff(q[2],q[0]),c=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];if(norm(c)<=TOL*TOL)fail('triangle degenerate');}const shared=triCorners[0].filter(x=>triCorners[1].includes(x));if(shared.length!==2||Math.abs(shared[0]-shared[1])!==2)fail('triangle coverage');});if(triangleCount>192)fail('triangles');
 d.edges.forEach((e:any,i:number)=>{const uses=incidence[i];if(uses.length!==2||uses[0].face===uses[1].face||uses[0].reversed===uses[1].reversed)fail('edge incidence');for(const u of e.uses){exact(u,['face','reversed']);faceIndex(u.face);if(typeof u.reversed!=='boolean'||!uses.some(x=>x.face===u.face&&x.reversed===u.reversed))fail('edge uses');}if(e.uses[0].face===e.uses[1].face)fail('edge uses');});
 const source=new Set<string>(),base=new Set<number>();for(const x of d.sourceEdges){exact(x,['sourceEdgeId','baseEdge','sweptFace','sourceReversed']);if(typeof x.sourceEdgeId!=='string'||!x.sourceEdgeId||x.sourceEdgeId.length>513||source.has(x.sourceEdgeId)||typeof x.sourceReversed!=='boolean')fail('source');source.add(x.sourceEdgeId);const i=edgeIndex(x.baseEdge);faceIndex(x.sweptFace);if(base.has(i)||!incidence[i].some(u=>u.face===x.sweptFace))fail('source edge');base.add(i);}
 // The four source edges must bound exactly one common base face; each
 // claimed generated face must be the other side of its source edge.
 const common=[...base].map(i=>new Set<string>(incidence[i].map(x=>x.face))).reduce((a,b)=>new Set<string>([...a].filter(x=>b.has(x))));
 if(common.size!==1)fail('ambiguous source base face');
 const baseFace=[...common][0] as string,swept=new Set<string>();
 for(const x of d.sourceEdges){const other=incidence[edgeIndex(x.baseEdge)].filter(u=>u.face!==baseFace);if(other.length!==1||other[0].face!==x.sweptFace||swept.has(x.sweptFace))fail('source swept face');swept.add(x.sweptFace);}
 if(swept.size!==4||swept.has(baseFace))fail('source swept faces');
 const lids=d.faces.filter((f:any)=>f.id!==baseFace&&!swept.has(f.id));if(lids.length!==1)fail('prism lid');
 const baseLoop=d.faces[faceIndex(baseFace)].loop,lid=lids[0],baseEdges=new Set<number>(baseLoop.map((u:any)=>edgeIndex(u.edge))),lidEdges=new Set<number>(lid.loop.map((u:any)=>edgeIndex(u.edge)));
 if(baseEdges.size!==4||lidEdges.size!==4||[...base].some(i=>!baseEdges.has(i))||[...lidEdges].some(i=>baseEdges.has(i)))fail('prism end loops');
 const baseVertices=new Set<number>(),lidVertices=new Set<number>();for(const i of baseEdges){baseVertices.add(vertexIndex(d.edges[i].a));baseVertices.add(vertexIndex(d.edges[i].b));}for(const i of lidEdges){lidVertices.add(vertexIndex(d.edges[i].a));lidVertices.add(vertexIndex(d.edges[i].b));}
 if(baseVertices.size!==4||lidVertices.size!==4||[...baseVertices].some(i=>lidVertices.has(i)))fail('prism end vertices');
 const across=d.edges.map((e:any,i:number)=>i).filter((i:number)=>!baseEdges.has(i)&&!lidEdges.has(i));if(across.length!==4)fail('prism connectors');
 const usedBase=new Set<number>(),usedLid=new Set<number>();let delta:number[]|undefined;
 for(const i of across){const e=d.edges[i],a=vertexIndex(e.a),b=vertexIndex(e.b),v=baseVertices.has(a)&&lidVertices.has(b)?a:baseVertices.has(b)&&lidVertices.has(a)?b:-1,w=v===a?b:a;if(v<0||usedBase.has(v)||usedLid.has(w))fail('prism connector');usedBase.add(v);usedLid.add(w);const step=diff(points[w],points[v]);if(delta&&!close(delta,step))fail('inconsistent prism translation');delta=step;}
 const baseNormal=d.faces[faceIndex(baseFace)].plane.normal,lidNormal=lid.plane.normal;
 if(!delta||norm(delta)<=TOL||Math.abs(Math.abs(dot(baseNormal,lidNormal))-1)>1e-7)fail('prism end planes');
 const unitNormal=baseNormal.map((n:number)=>n/norm(baseNormal)),axial=dot(delta,unitNormal),transverse=delta.map((n,i)=>n-axial*unitNormal[i]);
 if(!Number.isFinite(axial)||norm(transverse)>TOL)fail('prism extrusion transverse displacement');
 for(const f of swept){const loop=d.faces[faceIndex(f)].loop.map((u:any)=>edgeIndex(u.edge));if(loop.filter((i:number)=>baseEdges.has(i)).length!==1||loop.filter((i:number)=>lidEdges.has(i)).length!==1||loop.filter((i:number)=>across.includes(i)).length!==2)fail('prism side');}
 const shell=new Shell(),vertices=points.map((v:number[],i:number)=>{const x=new Vertex(new Vector(...v as [number,number,number]));x.data.portableId='vertex:'+i;return x;});
 const edges=d.edges.map((e:any,i:number)=>{const a=vertexIndex(e.a),b=vertexIndex(e.b),x=new Edge(straightCurve(points[a],points[b]),vertices[a],vertices[b]);x.data.portableId='edge:'+i;x.data.tessellation=e.curve.tessellation.map((q:number[])=>[...q]);return x;});
 for(const f of d.faces){const effective=f.inverted !== (f.plane.direct===false),face=new Face(planarSurface(f.plane.origin,f.plane.normal,effective));face.data.portableId=f.id;face.data.tessellation={format:'verbose',data:f.triangles.map((t:number[][])=>{const tri=t.map(q=>[...q]),a=diff(tri[1],tri[0]),b=diff(tri[2],tri[0]),c=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];if((effective?-1:1)*dot(c,f.plane.normal)<0)tri.reverse();return [tri];})};face.shell=shell;for(const u of f.loop){const e=edges[edgeIndex(u.edge)],he=u.reversed?e.halfEdge2:e.halfEdge1;if(he.loop)fail('duplicate half-edge');face.outerLoop.halfEdges.push(he);}face.outerLoop.link();shell.faces.push(face);}
 shell.data.portableProvenance={...p,idScope:'response-local',sourceEdges:d.sourceEdges};return shell;
}
