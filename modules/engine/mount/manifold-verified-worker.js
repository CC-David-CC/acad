// Research bootstrap; the hosting release must independently pin this file.
let ready=false, wasm, next=0; const shapes=new Map(), enclosureShapes=new Map(), MAX_CREATED=8;
const bad=message=>{throw Error(message)};
async function verifiedAsset(asset,max){
  if(!asset||!/^[0-9a-f]{64}$/.test(asset.sha256)||typeof asset.path!=='string')bad('Invalid asset manifest');
  const url=new URL(asset.path,self.location.origin);
  if(url.origin!==self.location.origin||url.search||url.hash)bad('Asset must be same-origin');
  const response=await fetch(url.href,{credentials:'omit',redirect:'error',cache:'no-store'});
  if(!response.ok||!response.body)bad('Runtime fetch failed');
  const reader=response.body.getReader(),chunks=[];let total=0;
  try{while(true){const {value,done}=await reader.read();if(done)break;total+=value.byteLength;if(total>max)bad('Runtime asset exceeds budget');chunks.push(value);}}
  finally{reader.releaseLock();}
  const bytes=new Uint8Array(total);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
  if(digest!==asset.sha256)bad('Runtime digest mismatch');return bytes;
}
const finite3=v=>Array.isArray(v)&&v.length===3&&[0,1,2].every(i=>Object.hasOwn(v,i)&&Number.isFinite(v[i]));
function release(s){s.delete();if(typeof s.isDeleted!=='function'||!s.isDeleted())bad('Manifold wrapper disposal failed');}
function evidence(s){
  if(s.status()!=='NoError')bad('Manifold status: '+s.status());
  const empty=s.isEmpty(),triangles=s.numTri(),vertices=s.numVert(),volume=s.volume();
  if(!Number.isSafeInteger(triangles)||triangles<0||triangles>100000||!Number.isSafeInteger(vertices)||vertices<0||vertices>100000||!Number.isFinite(volume))bad('Invalid mesh evidence');
  let components=0,bounds=null;
  if(!empty){
    bounds=s.boundingBox();
    if(!finite3(bounds?.min)||!finite3(bounds?.max)||bounds.min.some((n,i)=>n>bounds.max[i]))bad('Invalid mesh bounds');
    const parts=s.decompose();
    try{components=parts.length;if(!Number.isSafeInteger(components)||components<1||components>1000)bad('Invalid component count');}
    finally{for(const part of parts)release(part);}
  } else if(triangles!==0||vertices!==0||volume!==0)bad('Inconsistent empty mesh');
  // Mesh connected components are not a census of physical bodies or voids.
  return {empty,triangles,vertices,volume,components,bounds,resultKind:empty?'empty':'mesh-container',meshComponents:components,solidCount:null,materialRegions:null,voidRegions:null,nativeValidity:null,nativeStatus:'NoError',validLevel0:null,validLevel2:null,manifoldPredicate:null,volumeQuality:'mesh-kernel-volume'};
}
function read(token){const s=shapes.get(token);if(!s)bad('Unknown or disposed handle');return s;}
self.onmessage=async event=>{
  const msg=event.data;
  try{
    if(!ready){
      if(msg?.kind!=='init'||msg.manifest?.version!==1)bad('Initialization required');
      const [js,binary]=await Promise.all([verifiedAsset(msg.manifest.js,1048576),verifiedAsset(msg.manifest.wasm,41943040)]);
      const url=URL.createObjectURL(new Blob([js],{type:'text/javascript'}));
      try{const init=(await import(url)).default;wasm=await init({wasmBinary:binary,locateFile:()=>new URL(msg.manifest.wasm.path,self.location.origin).href});wasm.setup();}
      finally{URL.revokeObjectURL(url);}
      ready=true;self.postMessage({kind:'ready'});return;
    }
    if(msg?.kind==='enclosure-build'){
      const owned=[];let body,lid;
      try{
        const {validateManifoldEnclosureInput,validateManifoldEnclosureInputV2}=await import(new URL('./enclosurePlan.mjs',self.location.href));if(![1,2].includes(msg.version))bad('Invalid enclosure version');const plan=(msg.version===2?validateManifoldEnclosureInputV2:validateManifoldEnclosureInput)(msg.plan);
        if(next!==0||typeof msg.bodyToken!=='string'||typeof msg.lidToken!=='string'||!msg.bodyToken||!msg.lidToken||msg.bodyToken===msg.lidToken||shapes.has(msg.bodyToken)||shapes.has(msg.lidToken)||(msg.version===2&&(typeof msg.labelToken!=='string'||!msg.labelToken||msg.labelToken===msg.bodyToken||msg.labelToken===msg.lidToken||shapes.has(msg.labelToken))))bad('Invalid enclosure tokens');next=msg.version===2?8:6;
        const mk=r=>{const base=wasm.Manifold.cube(r.dimensions,false);let result;try{result=base.translate(r.origin);}finally{release(base);}owned.push(result);return result;};
        const a=mk(plan.body.outer),b=mk(plan.body.cavity);body=a.subtract(b);owned.push(body);const c=mk(plan.lid.cover),d=mk(plan.lid.lip),baseLid=c.add(d);owned.push(baseLid);let label=null;lid=baseLid;if(msg.version===2){label=mk(plan.label.box);lid=baseLid.subtract(label);owned.push(lid);}
        const verify=(s,p)=>{if(!s||typeof s.delete!=='function')bad('Missing Manifold shape');const e=evidence(s),tol=Math.max(1e-6,p.volume*1e-6),ct=Math.max(1e-6,Math.max(...p.bounds.max.map(Math.abs))*2**-21);if(e.empty||e.components!==1||Math.abs(e.volume-p.volume)>tol||e.bounds.min.some((x,i)=>Math.abs(x-p.bounds.min[i])>ct)||e.bounds.max.some((x,i)=>Math.abs(x-p.bounds.max[i])>ct))bad('Invalid Manifold enclosure');return {nativeVolume:e.volume,mesh:e};};
        const bodyEvidence=verify(body,plan.body),lidEvidence=verify(lid,plan.lid),labelEvidence=label?verify(label,plan.label):null;let interfaceEvidence=null;if(label){const common=lid.intersect(label);try{const e=evidence(common);if(!Number.isFinite(e.volume)||e.volume!==0)bad('label interface overlap');interfaceEvidence={version:1,kind:'bounded-common-volume',engine:'manifold',commonVolume:0};}finally{release(common);}}for(const part of [a,b,c,d,...(label?[baseLid]:[])]){release(part);owned.splice(owned.indexOf(part),1);}
        const enclosureGroup={bodyToken:msg.bodyToken,lidToken:msg.lidToken,labelToken:msg.labelToken,interfaceEvidence};
        shapes.set(msg.bodyToken,body);shapes.set(msg.lidToken,lid);enclosureShapes.set(msg.bodyToken,{role:'BODY',evidence:{...bodyEvidence,precision:'float32'},read:false,group:enclosureGroup,plan:structuredClone(msg.plan)});enclosureShapes.set(msg.lidToken,{role:'LID',evidence:{...lidEvidence,precision:'float32'},read:false,group:enclosureGroup,plan:structuredClone(msg.plan)});if(label){shapes.set(msg.labelToken,label);enclosureShapes.set(msg.labelToken,{role:'LABEL',evidence:{...labelEvidence,precision:'float32'},read:false,group:enclosureGroup,plan:structuredClone(msg.plan)});}owned.length=0;
        self.postMessage({kind:'result',seq:msg.seq,bodyToken:msg.bodyToken,lidToken:msg.lidToken,bodyEvidence,lidEvidence,...(label?{labelToken:msg.labelToken,labelEvidence,interfaceEvidence}:{})});
      }catch(e){for(const shape of owned){try{release(shape)}catch{}}self.postMessage({kind:'error',seq:msg.seq,error:'Manifold enclosure failed'});self.close();}return;
    }
    if(msg?.kind==='enclosure-interface') {
      try {
        const body=enclosureShapes.get(msg.bodyToken),lid=enclosureShapes.get(msg.lidToken),label=enclosureShapes.get(msg.labelToken);
        if(!body||!lid||!label||body.role!=='BODY'||lid.role!=='LID'||label.role!=='LABEL'||body.group!==lid.group||body.group!==label.group||body.group.bodyToken!==msg.bodyToken||body.group.lidToken!==msg.lidToken||body.group.labelToken!==msg.labelToken||!body.group.interfaceEvidence||!lid.qualified||!label.qualified)throw Error('Invalid enclosure interface binding');
        const {qualifyEnclosureLabelContact}=await import(new URL('./enclosureLabelContact.mjs',self.location.href));
        const evidence=qualifyEnclosureLabelContact(lid.plan,lid.qualified,label.qualified,msg.maxDeviationMm);
        self.postMessage({kind:'result',seq:msg.seq,bodyToken:msg.bodyToken,lidToken:msg.lidToken,labelToken:msg.labelToken,commonVolume:body.group.interfaceEvidence.commonVolume,...evidence});
      } catch(e) {self.postMessage({kind:'error',seq:msg.seq,error:'Enclosure interface qualification failed'});self.close();}return;
    }
    if(msg?.kind==='enclosure-mesh'||msg?.kind==='enclosure-manufacturing'){
      try{const record=enclosureShapes.get(msg.token),manufacturing=msg.kind==='enclosure-manufacturing';if(!record||(manufacturing?record.manufacturingRead:record.read))bad('Invalid enclosure token');if(manufacturing)record.manufacturingRead=true;else record.read=true;const s=read(msg.token),m=s.getMesh(),indices=m.triVerts,vertices=m.vertProperties,n=m.numProp;
        if(!Number.isSafeInteger(n)||n<3||n>16||!(indices instanceof Uint32Array)||!(vertices instanceof Float32Array)||indices.length<3||indices.length%3!==0||indices.length>512*3||vertices.length%n!==0||vertices.length>65536)bad('Invalid Manifold mesh');
        const buffer=new ArrayBuffer(indices.length*3*8),out=new Float64Array(buffer);let i=0;for(const index of indices){if(index>=vertices.length/n)bad('Invalid Manifold index');for(let k=0;k<3;k++){const value=vertices[index*n+k];if(!Number.isFinite(value))bad('Invalid Manifold vertex');out[i++]=value;}}
        const count=indices.length/3;
        if(manufacturing){const {qualifyEnclosureManufacturingMesh}=await import(new URL('./enclosureManufacturingMesh.mjs',self.location.href)),q=qualifyEnclosureManufacturingMesh(buffer,count,record.plan,record.role,'manifold',msg.maxDeviationMm);record.qualified={vertices:q.vertices.slice(),triangles:q.triangles.slice(),evidence:q.evidence};self.postMessage({kind:'result',seq:msg.seq,token:msg.token,role:record.role,verticesBuffer:q.vertices.buffer,trianglesBuffer:q.triangles.buffer,evidence:q.evidence},[q.vertices.buffer,q.triangles.buffer]);}
        else{const {validateEnclosureMesh}=await import(new URL('./enclosureMesh.mjs',self.location.href));validateEnclosureMesh(buffer,count,record.evidence);self.postMessage({kind:'result',seq:msg.seq,token:msg.token,role:record.role,triangleCount:count,buffer},[buffer]);}
      }catch(e){self.postMessage({kind:'error',seq:msg.seq,error:'Manifold enclosure mesh failed'});self.close();}return;
    }
    if(msg?.kind==='solid-mesh'){
      if(Object.keys(msg).sort().join(',')!=='kind,seq,token')bad('Invalid solid mesh request');
      const shape=read(msg.token),checked=evidence(shape),m=shape.getMesh(),indices=m.triVerts,vertices=m.vertProperties,n=m.numProp;
      if(!Number.isSafeInteger(n)||n<3||n>16||!(indices instanceof Uint32Array)||!(vertices instanceof Float32Array)||indices.length%3||indices.length!==checked.triangles*3||vertices.length%n||vertices.length/n!==checked.vertices)bad('Invalid solid mesh');
      const buffer=new ArrayBuffer(indices.length*3*8),out=new Float64Array(buffer);let offset=0;
      for(const index of indices){if(index>=vertices.length/n)bad('Invalid solid mesh index');for(let k=0;k<3;k++){const coordinate=vertices[index*n+k];if(!Number.isFinite(coordinate))bad('Invalid solid mesh coordinate');out[offset++]=coordinate;}}
      const {createDisplayProjection}=await import(new URL('./displayProjection.mjs',self.location.href)),display=createDisplayProjection(buffer,checked.triangles);
      self.postMessage({kind:'result',seq:msg.seq,token:msg.token,triangleCount:checked.triangles,buffer,evidence:checked,displayBuffer:display.buffer,displayStatus:display.status,displayReason:display.reason},[buffer,display.buffer]);return;
    }
    if(msg?.kind==='dispose'){
      const shape=read(msg.token);release(shape);shapes.delete(msg.token);enclosureShapes.delete(msg.token);
      self.postMessage({kind:'disposed',seq:msg.seq,released:true});return;
    }
    if(!['box','common','union','subtract'].includes(msg?.kind))bad('Unsupported request');
    if(next>=MAX_CREATED)bad('Manifold shape budget exhausted');
    ++next;let shape;
    try{
      if(msg.kind==='box'){
        const o=msg.origin,d=msg.dimensions;
        if(!finite3(o)||!finite3(d)||d.some(n=>n<=0||n>1e6)||o.some(n=>Math.abs(n)>1e6))bad('Invalid box');
        const initial=wasm.Manifold.cube(d,false);
        try{shape=initial.translate(o);}finally{release(initial);}
      }else{
        const a=read(msg.a),b=read(msg.b);if(msg.a===msg.b)bad('Operands must be distinct');
        shape=msg.kind==='union'?a.add(b):msg.kind==='subtract'?a.subtract(b):a.intersect(b);
      }
      if(!shape||typeof shape.delete!=='function')bad('Manifold returned no shape');
      const result=evidence(shape);shapes.set(msg.token,shape);shape=null;
      self.postMessage({kind:'result',seq:msg.seq,evidence:result});
    }finally{if(shape)release(shape);}
  }catch(error){self.postMessage({kind:'error',seq:msg?.seq,error:String(error)});}
};
