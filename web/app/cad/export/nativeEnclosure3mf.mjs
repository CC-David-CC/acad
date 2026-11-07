// Research-only: a rectangular open-top enclosure made by subtracting one
// axis-aligned Native Mesh Box from another. Not a general Boolean exporter.
export function nativeEnclosureFor3mf(shell,{featureId,id,name,materialId,history}={}) {
 if (!Number.isSafeInteger(featureId) || featureId<=0 || shell?.id!==`native:${featureId}` || !Array.isArray(history)) throw Error('A uniquely resolved native enclosure is required');
 const matches=history.map((op,i)=>({op,i})).filter(x=>Number(x.op?.params?.featureId)===featureId);
 if(matches.length!==1 || matches[0].op.type!=='NATIVE_MESH_BOOLEAN' || matches[0].op.params.kind!=='SUBTRACT') throw Error('Only a native subtract enclosure is supported');
 const op=matches[0], ref=p=>typeof p==='string' && /^native:[1-9][0-9]*$/.test(p)?Number(p.slice(7)):NaN;
 const target=ref(op.op.params.target),tool=ref(op.op.params.tool);
 function source(id) {
   const found=history.map((op,i)=>({op,i})).filter(x=>x.i<op.i && x.op?.type==='NATIVE_MESH_BOX' && Number(x.op.params?.featureId)===id);
   if(found.length!==1) throw Error('Enclosure operands must be unique native boxes');
   const p=found[0].op.params;
   if(![p.x,p.y,p.z,p.width,p.depth,p.height].every(Number.isFinite) || Math.min(p.width,p.depth,p.height)<0.01) throw Error('Invalid enclosure dimensions');return p;
 }
 const a=source(target),b=source(tool);
 if(!(b.x>a.x && b.y>a.y && b.x+b.width<a.x+a.width && b.y+b.depth<a.y+a.depth && b.z>a.z && b.z<a.z+a.height && b.z+b.height>a.z+a.height)) throw Error('Only a strictly inset, open-top rectangular cavity is supported');
 const data=shell.brepShell?.data?.__meshWithOrigins?.meshData;
 if(!data || !Array.isArray(data.verts) || !Array.isArray(data.tris) || data.verts.length<12 || data.verts.length>450000 || data.verts.length%3 || data.tris.length<12 || data.tris.length>750000 || data.tris.length%3 || !Array.isArray(data.mergeFrom) || !Array.isArray(data.mergeTo) || data.mergeFrom.length || data.mergeTo.length) throw Error('Unsupported native enclosure mesh');
 const vertices=Array.from({length:data.verts.length/3},(_,i)=>data.verts.slice(i*3,i*3+3));
 const triangles=Array.from({length:data.tris.length/3},(_,i)=>data.tris.slice(i*3,i*3+3));
 const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
 for(const v of vertices)for(let i=0;i<3;i++){if(!Number.isFinite(v[i]))throw Error('Invalid enclosure mesh');lo[i]=Math.min(lo[i],v[i]);hi[i]=Math.max(hi[i],v[i]);}
 const expectedLo=[a.x,a.y,a.z],expectedHi=[a.x+a.width,a.y+a.depth,a.z+a.height];
 const approx=(x,y)=>Math.abs(x-y)<=Math.max(1e-5,Math.abs(y)*1e-5);
 if(!lo.every((x,i)=>approx(x,expectedLo[i])) || !hi.every((x,i)=>approx(x,expectedHi[i])))throw Error('Enclosure bounds do not match history');
 let volume=0;
 for(const t of triangles){if(!t.every(i=>Number.isSafeInteger(i)&&i>=0&&i<vertices.length))throw Error('Invalid enclosure mesh indices');const [p,q,r]=t.map(i=>vertices[i]);volume+=(p[0]*(q[1]*r[2]-q[2]*r[1])+p[1]*(q[2]*r[0]-q[0]*r[2])+p[2]*(q[0]*r[1]-q[1]*r[0]))/6;}
 const expected=a.width*a.depth*a.height-b.width*b.depth*(a.z+a.height-b.z);
 if(!Number.isFinite(volume) || !approx(volume,expected)) throw Error('Enclosure volume does not match history');
 const l=shell.location;if(!l)throw Error('Missing enclosure placement');
 const transform=[l.mxx,l.myx,l.mzx,l.mxy,l.myy,l.mzy,l.mxz,l.myz,l.mzz,l.tx,l.ty,l.tz];
 if(!transform.every(Number.isFinite))throw Error('Invalid enclosure placement');
 return {id,name,materialId,vertices,triangles,transform,verifiedPocket:{min:[b.x,b.y,b.z],max:[b.x+b.width,b.y+b.depth,a.z+a.height]}};
}
