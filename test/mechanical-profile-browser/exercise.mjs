// Executed by Chromium through CDP. Native replies and catalogs are never
// manufactured; the only reply interception holds one genuine positive event.
export async function runComponent({pins,fixtures,pairs,circle,splitTangent}){
 const {createMechanicalProfileOccMount}=await import(pins.constructorPath),GenuineWorker=window.Worker,workers=[];
 let holdNext=false,held=null,heldResolve=null;
 window.Worker=class extends GenuineWorker{
  constructor(...args){super(...args);this.record={url:String(args[0]),posts:[],terminated:false};workers.push(this.record);let listener;
   Object.defineProperty(this,'onmessage',{configurable:true,get(){return listener;},set(fn){listener=fn;}});
   this.addEventListener('message',event=>{if(holdNext&&this.record.posts.at(-1)==='solid-edge-treatment'&&event.data?.kind==='result'){holdNext=false;held=()=>listener?.call(this,event);heldResolve(event.data);}else listener?.call(this,event);});}
  postMessage(message,...args){this.record.posts.push(message.kind);return super.postMessage(message,...args);}
  terminate(){this.record.terminated=true;return super.terminate();}
 };
 const start=async()=>{const mount=createMechanicalProfileOccMount(pins.mountOptions),record=workers.at(-1);try{await mount.ready;return{mount,record};}catch(e){mount.close();throw e;}};
 const error=e=>({code:e?.code??null,message:String(e?.message??e)}),expect=(yes,msg)=>{if(!yes)throw Error(msg);},same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const topo=async(m,h)=>(await m.execute({op:'solid.topology.read',version:1,handle:h})).catalog;
 const selection=async(m,h,featureId)=>{const s=await m.execute({op:'solid.prism.selections.read',version:1,handle:h,featureId});expect(s.selection.status==='available','Selections unavailable: '+JSON.stringify(s));return s.selection.plan;};
 const mesh=async(m,h)=>{const r=await m.readSolidMesh({op:'solid.mesh.read',version:1,handle:h});return{triangleCount:r.triangleCount,evidence:r.evidence,coordinates:Array.from(new Float64Array(r.buffer))};};
 const snapshot=async(m,h,featureId)=>({catalog:await topo(m,h),plan:await selection(m,h,featureId),mesh:await mesh(m,h)});
 const classify=async(m,h,list)=>{const out=[];for(const [point,expected]of list)out.push({point,expected,actual:await m.execute({op:'solid.point.classify',version:1,unit:'millimeter',handle:h,point})});return out;};
 const choose=(plan,wanted)=>{const xs=plan.edges.filter(e=>e.role==='connector'&&wanted.some(p=>same(e.incidentCurveIds,[...p].sort())));expect(xs.length===wanted.length,'Missing actual connector selections');return xs.map(e=>e.id);};
 const request=(handle,producerFeatureId,featureId,edgeIds,kind='fillet',size=3)=>({op:'solid.edge.treat',version:1,unit:'millimeter',handle,producerFeatureId,featureId,edgeIds,kind,size});
 const release=(m,h)=>m.dispose({op:'solid.dispose',version:1,handle:h}),rows=[];
 try{
  for(const fixture of fixtures){const f=await start(),row={id:fixture.id},owned=[];try{
   const {mount:m}=f,w=fixture.width,h=fixture.height,z=fixture.depth/2,source=JSON.stringify(fixture.request),base=await m.execute(fixture.request);owned.push(base.handle);
   const b=await snapshot(m,base.handle,101);row.baseBefore=b;row.base={result:base,...b,points:await classify(m,base.handle,[[[.2,.2,z],'inside'],[[w-.2,.2,z],'inside'],[[w/2,h/2,z],'inside']])};
   const a=request(base.handle,101,102,choose(b.plan,pairs.fillet)),aRaw=JSON.stringify(a),fillet=await m.execute(a);owned.push(fillet.handle);
   const filletData=await snapshot(m,fillet.handle,102);row.filletBefore=filletData;row.fillet={result:fillet,...filletData,selected:a.edgeIds,points:await classify(m,fillet.handle,[[[.2,.2,z],'outside'],[[w-.2,h-.2,z],'outside'],[[w-.2,.2,z],'inside'],[[w/2,h/2,z],'inside']])};
   const bRequest=request(fillet.handle,102,103,choose(filletData.plan,pairs.chamfer),'chamfer-equal',1),bRaw=JSON.stringify(bRequest),chamfer=await m.execute(bRequest);owned.push(chamfer.handle);
   row.chamfer={result:chamfer,...await snapshot(m,chamfer.handle,103),selected:bRequest.edgeIds,points:await classify(m,chamfer.handle,[[[.2,.2,z],'outside'],[[w-.2,h-.2,z],'outside'],[[w-.2,.2,z],'outside'],[[.2,h-.2,z],'outside'],[[w/2,h/2,z],'inside'],[[w/2,0,z],'boundary']])};
   row.baseAfter=await snapshot(m,base.handle,101);row.filletAfter=await snapshot(m,fillet.handle,102);row.inputPreserved=same(row.baseBefore,row.baseAfter)&&same(row.filletBefore,row.filletAfter);row.sourcePreserved=source===JSON.stringify(fixture.request);row.requestsPreserved=aRaw===JSON.stringify(a)&&bRaw===JSON.stringify(bRequest);
   row.disposed=[];row.staleCodes=[];for(const handle of owned){await release(m,handle);row.disposed.push(true);try{await topo(m,handle);}catch(e){row.staleCodes.push(e.code);}}owned.length=0;
  }catch(e){row.error=error(e);}finally{f.mount.close();}rows.push(row);}
  const controls={};
  {const f=await start();try{const m=f.mount,base=await m.execute(fixtures[0].request),s=await snapshot(m,base.handle,101),ids=choose(s.plan,[pairs.fillet[0]]),req=request(base.handle,101,102,ids);controls.refusals=[];
   for(const [id,changes]of [['excessive',{size:1e6}],['duplicate',{edgeIds:[ids[0],ids[0]]}],['unknown',{edgeIds:['not-discovered']}],['producer-mismatch',{producerFeatureId:999}]]){let outcome;const r={...req,...changes},raw=JSON.stringify(r),before=f.record.posts.length;try{await m.execute(r);}catch(e){outcome=error(e);}const posts=f.record.posts.length-before;controls.refusals.push({id,outcome,posts,requestPreserved:raw===JSON.stringify(r),inputBefore:s,inputAfter:await snapshot(m,base.handle,101)});}
   await release(m,base.handle);const before=f.record.posts.length;let outcome;try{await m.execute(req);}catch(e){outcome=error(e);}controls.stale={outcome,posts:f.record.posts.length-before};
  }finally{f.mount.close();}}
  {const a=await start(),b=await start();try{const x=await a.mount.execute(fixtures[0].request),y=await b.mount.execute(fixtures[0].request),before=await snapshot(b.mount,y.handle,101);const startPosts=b.record.posts.length;let outcome;try{await b.mount.execute(request(x.handle,101,102,['foreign']));}catch(e){outcome=error(e);}controls.foreign={outcome,posts:b.record.posts.length-startPosts,inputBefore:before,inputAfter:await snapshot(b.mount,y.handle,101)};await release(a.mount,x.handle);await release(b.mount,y.handle);}finally{a.mount.close();b.mount.close();}}
  for(const [id,source,pick]of [['circle-edge',circle,p=>p.edges.find(e=>e.geometry==='circle')],['tangent-expansion',splitTangent,p=>p.edges.find(e=>e.role==='first-boundary'&&e.curveId==='split-a')]]){const f=await start();try{const m=f.mount,base=await m.execute(source),s=await snapshot(m,base.handle,101),edge=pick(s.plan);expect(edge,'Actual selected unsupported edge unavailable');let outcome;try{await m.execute(request(base.handle,101,102,[edge.id]));}catch(e){outcome=error(e);}controls[id]={outcome,selected:edge,inputBefore:s,inputAfter:await snapshot(m,base.handle,101)};await release(m,base.handle);}catch(e){controls[id]={setupError:error(e)};}finally{f.mount.close();}}
  {const f=await start();try{const m=f.mount,base=await m.execute(fixtures[0].request),plan=await selection(m,base.handle,101),controller=new AbortController(),genuinePromise=new Promise(resolve=>heldResolve=resolve);holdNext=true;
   const pending=m.execute(request(base.handle,101,102,choose(plan,[pairs.fillet[0]])),{signal:controller.signal}).then(value=>({unexpected:value}),e=>error(e));const genuine=await genuinePromise;controller.abort();const outcome=await pending;held();let retry;try{await m.execute(fixtures[0].request);}catch(e){retry=error(e);}controls.cancel={genuine,outcome,retry,terminated:f.record.terminated};
  }finally{holdNext=false;f.mount.close();}}
  {const f=await start();try{const m=f.mount,base=await m.execute(fixtures[0].request),plan=await selection(m,base.handle,101),ids=choose(plan,[pairs.chamfer[0]]),results=[];
   for(let i=0;i<31;i++){const value=await m.execute(request(base.handle,101,102+i,ids,'chamfer-equal',1));results.push({evidence:value.evidence});await release(m,value.handle);}
   const before=await snapshot(m,base.handle,101),posts=f.record.posts.length;let outcome;try{await m.execute(request(base.handle,101,133,ids,'chamfer-equal',1));}catch(e){outcome=error(e);}controls.budget={results,outcome,posts:f.record.posts.length-posts,inputBefore:before,inputAfter:await snapshot(m,base.handle,101)};await release(m,base.handle);
  }finally{f.mount.close();}}
  return{rows,controls,workers,csp:window.componentCsp};
 }finally{window.Worker=GenuineWorker;}
}
