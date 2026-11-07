// Evaluated by genuine Chromium, forwarding every real Worker reply unchanged.
export async function runThroughHoleComponent({pins,fixtures,filletPairs,chamferPairs}){
 const {createBooleanHistoryOccMount}=await import(pins.constructorPath),OriginalWorker=window.Worker,workers=[];
 window.Worker=class extends OriginalWorker{constructor(...args){super(...args);this.record={url:String(args[0]),posts:[],work:[],terminated:false};workers.push(this.record);this.addEventListener('message',e=>{if(e.data?.kind==='result'&&e.data.hole&&e.data.work)this.record.work.push(structuredClone({hole:e.data.hole,work:e.data.work}));});}postMessage(m,...args){this.record.posts.push(m.kind);return super.postMessage(m,...args);}terminate(){this.record.terminated=true;return super.terminate();}};
 const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),need=(v,m)=>{if(!v)throw Error(m);},error=e=>({code:e?.code??null,message:String(e?.message??e)}),bodyId=f=>'worker-solid:1:'+JSON.stringify([f,'body']);
 const start=async()=>{const m=createBooleanHistoryOccMount(pins.mountOptions),record=workers.at(-1);try{await m.ready;return{m,record};}catch(e){m.close();throw e;}};
 const topology=async(m,h)=>(await m.execute({op:'solid.topology.read',version:1,handle:h})).catalog;
 const selection=async(m,h,featureId)=>(await m.execute({op:'solid.selections.read',version:1,handle:h,featureId})).selection;
 const snapshot=async(m,h,f)=>{const mesh=await m.readSolidMesh({op:'solid.mesh.read',version:1,handle:h});return{catalog:await topology(m,h),selection:await selection(m,h,f),mesh:{triangleCount:mesh.triangleCount,evidence:mesh.evidence,coordinates:Array.from(new Float64Array(mesh.buffer))}};};
 const plan=s=>{need(s.status==='available','Required inherited naming unavailable');return s.plan;};
 const choose=(s,pairs)=>{const xs=plan(s).edges.filter(e=>e.role==='connector'&&pairs.some(p=>same(e.incidentCurveIds,[...p].sort())));need(xs.length===pairs.length,'Actual outer corner selections missing');return xs.map(e=>e.id);};
 const holes=(m,intent,handle,sourceHandle)=>m.execute({op:'solid.holes.through',...intent,handle,sourceHandle});
 const edge=(m,h,p,f,kind,edgeIds,size)=>m.execute({op:'solid.edge.treat',version:1,unit:'millimeter',handle:h,producerFeatureId:p,featureId:f,kind,edgeIds,size});
 const release=(m,h)=>m.dispose({op:'solid.dispose',version:1,handle:h});
 const world=(f,p)=>f.origin.map((v,i)=>v+f.x[i]*p[0]+f.y[i]*p[1]+f.z[i]*p[2]);
 const classify=async(m,h,f,points)=>{const out=[];for(const [local,expected]of points){const point=world(f,local);out.push({local,point,expected,actual:await m.execute({op:'solid.point.classify',version:1,unit:'millimeter',handle:h,point})});}return out;};
 const centers=f=>[[f.width/2,f.height/2],[8,8],[f.width-8,8],[f.width-8,f.height-8],[8,f.height-8]];
 const borePoints=(f,count)=>centers(f).slice(0,count).flatMap((p,i)=>{const r=i?2:5;return[[[...p,f.depth/2],'outside'],[[p[0]+r+.5,p[1],f.depth/2],'inside'],[[p[0]+r,p[1],f.depth/2],'boundary']];});
 const rows=[];
 try{
  for(const fixture of fixtures){const {m,record}=await start(),row={id:fixture.id},owned=[];try{
   row.capabilities=m.descriptor;need(row.capabilities.operations.some(o=>o.id==='solid.holes.through'&&o.version===1),'Through-hole capability not advertised');
   const sourceJSON=JSON.stringify(fixture.source),base=await m.execute(fixture.source);owned.push(base.handle);row.base={result:base,...await snapshot(m,base.handle,10)};
   row.originalConnectors=choose(row.base.selection,[...filletPairs,...chamferPairs]);
   const centeredRequest={op:'solid.holes.through',...fixture.centerIntent,handle:base.handle,sourceHandle:base.handle},centerJSON=JSON.stringify(centeredRequest),center=await m.execute(centeredRequest);owned.push(center.handle);
   row.center={result:center,...await snapshot(m,center.handle,20),points:await classify(m,center.handle,fixture.source.frame,borePoints(fixture,1))};
   const cornersRequest={op:'solid.holes.through',...fixture.cornersIntent,handle:center.handle,sourceHandle:base.handle},cornersJSON=JSON.stringify(cornersRequest),corners=await m.execute(cornersRequest);owned.push(corners.handle);
   row.corners={result:corners,...await snapshot(m,corners.handle,21),points:await classify(m,corners.handle,fixture.source.frame,borePoints(fixture,5))};
   const filletIds=choose(row.corners.selection,filletPairs),fillet=await edge(m,corners.handle,21,40,'fillet',filletIds,3);owned.push(fillet.handle);row.fillet={result:fillet,...await snapshot(m,fillet.handle,40),selected:filletIds};
   const chamferIds=choose(row.fillet.selection,chamferPairs),chamfer=await edge(m,fillet.handle,40,41,'chamfer-equal',chamferIds,1);owned.push(chamfer.handle);
   const w=fixture.width,h=fixture.height,d=fixture.depth;row.chamfer={result:chamfer,...await snapshot(m,chamfer.handle,41),selected:chamferIds,points:await classify(m,chamfer.handle,fixture.source.frame,[...borePoints(fixture,5),[[.2,.2,d/2],'outside'],[[w-.2,h-.2,d/2],'outside'],[[w-.2,.2,d/2],'outside'],[[.2,h-.2,d/2],'outside'],[[w/2,h/2+8,d/2],'inside'],[[w/2,h/2+8,0],'boundary']])};
   row.baseAfter=await snapshot(m,base.handle,10);row.centerAfter=await snapshot(m,center.handle,20);row.cornersAfter=await snapshot(m,corners.handle,21);row.filletAfter=await snapshot(m,fillet.handle,40);
   row.sourcePreserved=sourceJSON===JSON.stringify(fixture.source);row.requestsPreserved=centerJSON===JSON.stringify(centeredRequest)&&cornersJSON===JSON.stringify(cornersRequest);
   await release(m,base.handle);owned.splice(owned.indexOf(base.handle),1);const posts=record.posts.length;let outcome;
   try{await holes(m,{...fixture.centerIntent,featureId:50,producerFeatureId:41,target:bodyId(41)},chamfer.handle,base.handle);}catch(e){outcome=error(e);}row.staleSource={outcome,posts:record.posts.length-posts,before:row.chamfer,after:await snapshot(m,chamfer.handle,41)};
   row.disposed=[];for(const handle of owned){await release(m,handle);let outcome;try{await topology(m,handle);}catch(e){outcome=error(e);}row.disposed.push(outcome);}owned.length=0;
  }catch(e){row.error=error(e);}finally{m.close();}rows.push(row);}
  const controls=[];
  for(const id of ['wrong-producer','wrong-region','wrong-source-handle','overlap','outside']){const f=fixtures[0],{m,record}=await start(),row={id};try{
   const base=await m.execute(f.source);await selection(m,base.handle,10);let sourceHandle=base.handle,alternate=null;
   if(id==='wrong-source-handle'){const request=structuredClone(f.source);request.region.id+='-alternate';alternate=await m.execute(request);await selection(m,alternate.handle,11);sourceHandle=alternate.handle;row.alternateBefore=await snapshot(m,alternate.handle,11);}
   row.before=await snapshot(m,base.handle,10);let intent={...f.centerIntent,featureId:70};
   if(id==='wrong-producer')Object.assign(intent,{producerFeatureId:11,target:bodyId(11)});
   if(id==='wrong-region')intent.sourceRegionId='not-the-captured-source-region';
   if(id==='overlap'||id==='outside')intent={...f.cornersIntent,featureId:71,producerFeatureId:10,target:bodyId(10),offsetX:id==='overlap'?f.width/2:.5};
   const request={op:'solid.holes.through',...intent,handle:base.handle,sourceHandle},raw=JSON.stringify(request),posts=record.posts.length;let outcome;
   try{await m.execute(request);}catch(e){outcome=error(e);}row.outcome=outcome;row.posts=record.posts.length-posts;row.requestPreserved=raw===JSON.stringify(request);row.after=await snapshot(m,base.handle,10);if(alternate)row.alternateAfter=await snapshot(m,alternate.handle,11);
   const healthy=await holes(m,f.centerIntent,base.handle,base.handle);row.healthy={result:healthy,...await snapshot(m,healthy.handle,20),points:await classify(m,healthy.handle,f.source.frame,borePoints(f,1))};row.sourceAfterHealthy=await snapshot(m,base.handle,10);
   for(const h of [healthy.handle,base.handle,...(alternate?[alternate.handle]:[])])await release(m,h);
  }catch(e){row.error=error(e);}finally{m.close();}controls.push(row);}
  return{rows,controls,workers,csp:window.componentCsp};
 }finally{window.Worker=OriginalWorker;}
}
