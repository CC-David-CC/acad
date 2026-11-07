// Real classic Workers/native results only. Producer IDs are component labels.
export async function runLinearHolePatternComponent({pins,fixtures,filletPairs,chamferPairs}){
 const {createBooleanHistoryOccMount}=await import(pins.constructorPath),Original=Worker,workers=[];
 window.Worker=class extends Original{constructor(...a){super(...a);this.record={url:String(a[0]),posts:[],work:[],terminated:false};workers.push(this.record);this.addEventListener('message',e=>{if(e.data?.kind==='result'&&e.data.work)this.record.work.push(structuredClone({hole:e.data.hole,pattern:e.data.pattern,work:e.data.work}));});}postMessage(m,...a){this.record.posts.push(m.kind);return super.postMessage(m,...a);}terminate(){this.record.terminated=true;return super.terminate();}};
 const error=e=>({code:e?.code??null,message:e?.message||String(e)}),body=f=>'worker-solid:1:'+JSON.stringify([f,'body']),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),need=(v,m)=>{if(!v)throw Error(m)};
 const start=async()=>{const m=createBooleanHistoryOccMount(pins.mountOptions);await m.ready;return{m,record:workers.at(-1)}};
 const topology=async(m,h)=>(await m.execute({op:'solid.topology.read',version:1,handle:h})).catalog,selection=async(m,h,featureId)=>(await m.execute({op:'solid.selections.read',version:1,handle:h,featureId})).selection;
 const snapshot=async(m,h,f)=>{const mesh=await m.readSolidMesh({op:'solid.mesh.read',version:1,handle:h});return{catalog:await topology(m,h),selection:await selection(m,h,f),mesh:{triangleCount:mesh.triangleCount,evidence:mesh.evidence,coordinates:Array.from(new Float64Array(mesh.buffer))}}};
 const choose=(s,pairs)=>{need(s.status==='available','Missing genuine source selections');const ids=s.plan.edges.filter(e=>e.role==='connector'&&pairs.some(p=>same(e.incidentCurveIds,[...p].sort()))).map(e=>e.id);need(ids.length===pairs.length,'Missing unique corner connectors');return ids;};
 const release=(m,h)=>m.dispose({op:'solid.dispose',version:1,handle:h});
 const build=async(m,f,{cornerOffsetY=8,corners=true,edges=true}={})=>{
  const base=await m.execute(f.source);await selection(m,base.handle,10);
  const center=await m.execute({op:'solid.holes.through',...f.centerIntent,handle:base.handle,sourceHandle:base.handle});await selection(m,center.handle,20);
  let current=center,feature=20,cornerResult=null,fillet=null;
  if(corners){const intent={...f.cornersIntent,offsetY:cornerOffsetY};cornerResult=await m.execute({op:'solid.holes.through',...intent,handle:current.handle,sourceHandle:base.handle});await selection(m,cornerResult.handle,21);current=cornerResult;feature=21;}
  if(edges){const ids=choose(await selection(m,current.handle,feature),filletPairs);fillet=await m.execute({op:'solid.edge.treat',version:1,unit:'millimeter',handle:current.handle,producerFeatureId:feature,featureId:40,kind:'fillet',edgeIds:ids,size:3});const chamferIds=choose(await selection(m,fillet.handle,40),chamferPairs);current=await m.execute({op:'solid.edge.treat',version:1,unit:'millimeter',handle:fillet.handle,producerFeatureId:40,featureId:41,kind:'chamfer-equal',edgeIds:chamferIds,size:1});feature=41;await selection(m,current.handle,feature);}
  // Dispose the consumed seed/corner/fillet geometry BEFORE pattern. Its
  // successful causal witness must suffice; no seed handle is passed/retained.
  const disposed=[];for(const r of[center,cornerResult,fillet])if(r&&r!==current){await release(m,r.handle);disposed.push(r.handle);}
  return{base,current,feature,disposed};
 };
 const intent=(f,feature=41,extra={})=>({version:1,unit:'millimeter',engine:'occ',engineRevision:pins.engineRevision,featureId:50,target:body(feature),producerFeatureId:feature,seedFeatureId:20,axis:'source-local-x-positive',count:3,spacing:20,...extra});
 const pattern=(m,r,state,source=state.base.handle,options={})=>m.execute({op:'solid.holes.pattern.linear',...r,handle:state.current.handle,sourceHandle:source},options);
 const points=async(m,h,f,centers)=>{const out=[];for(const [x,y,r]of centers)for(const [local,want]of[[[x,y,f.depth/2],'outside'],[[x+r+.5,y,f.depth/2],'inside'],[[x+r,y,f.depth/2],'boundary']]){const point=f.source.frame.origin.map((v,i)=>v+f.source.frame.x[i]*local[0]+f.source.frame.y[i]*local[1]+f.source.frame.z[i]*local[2]);out.push({local,point,want,actual:(await m.execute({op:'solid.point.classify',version:1,unit:'millimeter',handle:h,point})).classification});}return out;};
 const rows=[],controls=[];
 try{
  for(const f of fixtures){const {m,record}=await start(),row={id:f.id};try{
   row.descriptor=m.descriptor;const state=await build(m,f);row.seedGeometryDisposed=state.disposed.length===3;row.before=await snapshot(m,state.current.handle,state.feature);row.sourceBefore=await snapshot(m,state.base.handle,10);const r=intent(f),request={op:'solid.holes.pattern.linear',...r,handle:state.current.handle,sourceHandle:state.base.handle},text=JSON.stringify(request),result=await m.execute(request);row.requestPreserved=text===JSON.stringify(request);row.pattern={result,...await snapshot(m,result.handle,50)};
   const centers=[[f.width/2,f.height/2,f.centerIntent.diameter/2],[f.width/2+20,f.height/2,f.centerIntent.diameter/2],[f.width/2+40,f.height/2,f.centerIntent.diameter/2],[8,8,2],[f.width-8,8,2],[f.width-8,f.height-8,2],[8,f.height-8,2]];row.points=await points(m,result.handle,f,centers);row.targetAfter=await snapshot(m,state.current.handle,state.feature);row.sourceAfter=await snapshot(m,state.base.handle,10);row.work=record.work;for(const h of[result.handle,state.current.handle,state.base.handle])await release(m,h);row.disposed=true;
  }catch(e){row.error=error(e);}finally{m.close();}rows.push(row);}
  for(const id of['count1','wrong-producer','wrong-seed','corner-as-seed','wrong-source','corner-overlap','boolean-path']){
   const f=fixtures[0],{m,record}=await start(),row={id};try{
    const state=await build(m,f,{cornerOffsetY:id==='corner-overlap'?20:8});let source=state.base.handle,r=intent(f),extra=[];
    if(id==='count1')r.count=1;if(id==='wrong-producer'){r.producerFeatureId=999;r.target=body(999);}if(id==='wrong-seed')r.seedFeatureId=999;if(id==='corner-as-seed')r.seedFeatureId=21;
    if(id==='wrong-source'){const a=await m.execute(structuredClone(f.source));await selection(m,a.handle,11);source=a.handle;extra.push(a.handle);}
    if(id==='boolean-path'){const box=await m.execute({op:'solid.box.create',version:1,unit:'millimeter',origin:[200,200,0],dimensions:[1,1,1]});await selection(m,box.handle,60);const b=await m.execute({op:'solid.boolean.subtract',version:1,unit:'millimeter',a:state.current.handle,b:box.handle,featureId:42,producerAFeatureId:state.feature,producerBFeatureId:60});extra.push(state.current.handle,box.handle);state.current=b;state.feature=42;r=intent(f,42);await selection(m,b.handle,42);}
    row.before=await snapshot(m,state.current.handle,state.feature);row.sourceBefore=await snapshot(m,state.base.handle,10);const posts=record.posts.length;try{await pattern(m,r,state,source);}catch(e){row.outcome=error(e);}row.posts=record.posts.length-posts;row.after=await snapshot(m,state.current.handle,state.feature);row.sourceAfter=await snapshot(m,state.base.handle,10);
    if(id!=='boolean-path'){const healthy=await pattern(m,intent(f,state.feature,{count:id==='corner-overlap'?2:3}),state);row.healthy={result:healthy,...await snapshot(m,healthy.handle,50)};await release(m,healthy.handle);}for(const h of[state.current.handle,state.base.handle,...extra])await release(m,h);
   }catch(e){row.error=error(e);}finally{m.close();}controls.push(row);
  }
  // Full-cost preflight: one constructor+one centered seed used3; count16
  // needs30 more although only one final output would fit the remaining29.
  {const {m,record}=await start(),row={id:'full-cost-preflight'};try{const f={...fixtures[0],width:1000,source:structuredClone(fixtures[0].source)};for(const c of f.source.region.outer){for(const k of['a','b'])if(c[k][0]===100)c[k][0]=1000;}const state=await build(m,f,{corners:false,edges:false});row.before=await snapshot(m,state.current.handle,20);const posts=record.posts.length;try{await pattern(m,intent(f,20,{count:16}),state);}catch(e){row.outcome=error(e);}row.posts=record.posts.length-posts;row.after=await snapshot(m,state.current.handle,20);const good=await pattern(m,intent(f,20),state);row.healthy=good.evidence;for(const h of[good.handle,state.current.handle,state.base.handle])await release(m,h);}catch(e){row.error=error(e);}finally{m.close();}controls.push(row);}
  return{rows,controls,workers,csp:window.componentCsp};
 }finally{window.Worker=Original;}
}
