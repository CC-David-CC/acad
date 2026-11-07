// Genuine Chromium Worker/native observations only; no fabricated replies.
export async function runBooleanComponent({pins,fixtures,filletPairs,chamferPairs,controls:controlSources}){
 const {createBooleanHistoryOccMount}=await import(pins.constructorPath),OriginalWorker=window.Worker,workers=[];
 window.Worker=class extends OriginalWorker{
  constructor(...args){super(...args);this.record={url:String(args[0]),posts:[],terminated:false};workers.push(this.record);}
  postMessage(message,...args){this.record.posts.push(message.kind);return super.postMessage(message,...args);}
  terminate(){this.record.terminated=true;return super.terminate();}
 };
 const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b),need=(v,m)=>{if(!v)throw Error(m);},error=e=>({code:e?.code??null,message:String(e?.message??e)});
 const start=async()=>{const m=createBooleanHistoryOccMount(pins.mountOptions),record=workers.at(-1);try{await m.ready;return{m,record};}catch(e){m.close();throw e;}};
 const topology=async(m,h)=>(await m.execute({op:'solid.topology.read',version:1,handle:h})).catalog;
 const selection=async(m,h,f)=>(await m.execute({op:'solid.selections.read',version:1,handle:h,featureId:f})).selection;
 const snapshot=async(m,h,f)=>{const mesh=await m.readSolidMesh({op:'solid.mesh.read',version:1,handle:h});return{catalog:await topology(m,h),selection:await selection(m,h,f),mesh:{triangleCount:mesh.triangleCount,evidence:mesh.evidence,coordinates:Array.from(new Float64Array(mesh.buffer))}};};
 const available=s=>{need(s?.status==='available','Required scoped selection unavailable: '+JSON.stringify(s));return s.plan;};
 const choose=(plan,pairs)=>{const selected=plan.edges.filter(e=>e.role==='connector'&&pairs.some(p=>equal(e.incidentCurveIds,[...p].sort())));need(selected.length===pairs.length,'Actual authored corner selection missing');return selected.map(e=>e.id);};
 const boolean=(m,kind,a,b,f,fa,fb)=>m.execute({op:'solid.boolean.'+kind,version:1,unit:'millimeter',a,b,featureId:f,producerAFeatureId:fa,producerBFeatureId:fb});
 const edge=(m,h,p,f,ids,kind,size)=>m.execute({op:'solid.edge.treat',version:1,unit:'millimeter',handle:h,producerFeatureId:p,featureId:f,edgeIds:ids,kind,size});
 const release=(m,h)=>m.dispose({op:'solid.dispose',version:1,handle:h});
 const classify=async(m,h,points)=>{const rows=[];for(const [point,expected]of points)rows.push({point,expected,actual:await m.execute({op:'solid.point.classify',version:1,unit:'millimeter',handle:h,point})});return rows;};
 const holePoints=(fixture,count)=>fixture.tools.slice(0,count).flatMap(t=>[[[...t.center,fixture.depth/2],'outside'],[[t.center[0]+t.radius+.5,t.center[1],fixture.depth/2],'inside'],[[t.center[0]+t.radius,t.center[1],fixture.depth/2],'boundary']]);
 const rows=[],controls={};
 try{
  for(const fixture of fixtures){const {m,record}=await start(),row={id:fixture.id,cuts:[],ancestors:[],refusals:[]},owned=[];try{
   const rawSource=JSON.stringify(fixture),base=await m.execute(fixture.base);owned.push(base.handle);
   const baseState=await snapshot(m,base.handle,fixture.baseFeatureId),basePlan=available(baseState.selection);
   row.base={result:base,...baseState};row.originalConnectors=choose(basePlan,[...filletPairs,...chamferPairs]);
   let current=base,currentFeature=fixture.baseFeatureId;
   for(const tool of fixture.tools){
    const result=await m.execute(tool.request);owned.push(result.handle);
    const beforeA=await snapshot(m,current.handle,currentFeature),beforeB=await snapshot(m,result.handle,tool.featureId);
    const cut=await boolean(m,'subtract',current.handle,result.handle,tool.cutFeatureId,currentFeature,tool.featureId);owned.push(cut.handle);
    const state=await snapshot(m,cut.handle,tool.cutFeatureId);available(state.selection);
    row.cuts.push({featureId:tool.cutFeatureId,toolFeatureId:tool.featureId,tool:{result,...beforeB},result:cut,...state,points:await classify(m,cut.handle,holePoints(fixture,row.cuts.length+1)),beforeA,afterA:await snapshot(m,current.handle,currentFeature),beforeB,afterB:await snapshot(m,result.handle,tool.featureId)});
    row.ancestors.push({handle:current.handle,featureId:currentFeature,before:beforeA});row.ancestors.push({handle:result.handle,featureId:tool.featureId,before:beforeB});
    current=cut;currentFeature=tool.cutFeatureId;
   }
   const before=await snapshot(m,current.handle,currentFeature),plan=available(before.selection);
   for(const [id,operation]of [
    ['selection-producer',()=>selection(m,current.handle,999)],
    ['boolean-producer-a',()=>boolean(m,'subtract',current.handle,row.ancestors[1].handle,60,999,row.ancestors[1].featureId)],
    ['boolean-producer-b',()=>boolean(m,'subtract',current.handle,row.ancestors[1].handle,60,currentFeature,999)],
    ['unknown-edge',()=>edge(m,current.handle,currentFeature,60,['not-discovered'],'fillet',3)]
   ]){const posts=record.posts.length;let outcome;try{await operation();}catch(e){outcome=error(e);}row.refusals.push({id,outcome,posts:record.posts.length-posts,before,after:await snapshot(m,current.handle,currentFeature)});}
   const filletIds=choose(plan,filletPairs),fillet=await edge(m,current.handle,currentFeature,40,filletIds,'fillet',3);owned.push(fillet.handle);
   row.fillet={result:fillet,...await snapshot(m,fillet.handle,40),selected:filletIds};
   row.cutBefore=before;row.cutAfter=await snapshot(m,current.handle,currentFeature);
   let staleOutcome;try{await edge(m,fillet.handle,40,61,[filletIds[0]],'fillet',3);}catch(e){staleOutcome=error(e);}row.staleSelection={outcome:staleOutcome,before:row.fillet,after:await snapshot(m,fillet.handle,40)};
   const chamferIds=choose(available(row.fillet.selection),chamferPairs),chamfer=await edge(m,fillet.handle,40,41,chamferIds,'chamfer-equal',1);owned.push(chamfer.handle);
   const w=fixture.width,h=fixture.height,z=fixture.depth/2;
   row.chamfer={result:chamfer,...await snapshot(m,chamfer.handle,41),selected:chamferIds,points:await classify(m,chamfer.handle,[...holePoints(fixture,5),[[.2,.2,z],'outside'],[[w-.2,h-.2,z],'outside'],[[w-.2,.2,z],'outside'],[[.2,h-.2,z],'outside'],[[w/2,h/2+8,z],'inside'],[[w/2,h/2+8,0],'boundary']])};
   row.filletAfter=await snapshot(m,fillet.handle,40);row.ancestors.push({handle:current.handle,featureId:currentFeature,before});
   for(const a of row.ancestors)a.after=await snapshot(m,a.handle,a.featureId);
   row.sourcePreserved=rawSource===JSON.stringify(fixture);row.disposed=[];
   for(const handle of owned){await release(m,handle);let outcome;try{await topology(m,handle);}catch(e){outcome=error(e);}row.disposed.push({outcome});}owned.length=0;
  }catch(e){row.error=error(e);}finally{m.close();}rows.push(row);}
  {const {m,record}=await start();try{
   const a=await m.execute(controlSources.a),b=await m.execute(controlSources.b);await selection(m,a.handle,100);await selection(m,b.handle,101);
   const beforeA=await snapshot(m,a.handle,100),beforeB=await snapshot(m,b.handle,101);
   const multi=await boolean(m,'union',a.handle,b.handle,102,100,101);
   controls.multi={result:multi,...await snapshot(m,multi.handle,102),points:await classify(m,multi.handle,[[[5,5,5],'inside'],[[25,5,5],'inside'],[[15,5,5],'outside']])};
   const tool=await m.execute(controlSources.cut);await selection(m,tool.handle,103);
   const continued=await boolean(m,'subtract',multi.handle,tool.handle,104,102,103);
   controls.multiContinuation={result:continued,...await snapshot(m,continued.handle,104),points:await classify(m,continued.handle,[[[2,5,5],'outside'],[[7,5,5],'inside'],[[25,5,5],'inside']])};
   const empty=await boolean(m,'common',a.handle,b.handle,105,100,101);
   controls.empty={result:empty,...await snapshot(m,empty.handle,105)};
   const c=await m.execute(controlSources.c);await selection(m,c.handle,106);
   const fromEmpty=await boolean(m,'union',empty.handle,c.handle,107,105,106);
   controls.emptyContinuation={result:fromEmpty,...await snapshot(m,fromEmpty.handle,107),points:await classify(m,fromEmpty.handle,[[[42,2,2],'inside'],[[5,5,5],'outside']])};
   controls.controlOperands={beforeA,afterA:await snapshot(m,a.handle,100),beforeB,afterB:await snapshot(m,b.handle,101)};
   const missing={op:'solid.boolean.union',version:1,unit:'millimeter',a:a.handle,b:b.handle},posts=record.posts.length;let outcome;try{await m.execute(missing);}catch(e){outcome=error(e);}controls.missingProducers={outcome,posts:record.posts.length-posts,beforeA,afterA:await snapshot(m,a.handle,100),beforeB,afterB:await snapshot(m,b.handle,101)};
   for(const h of [a.handle,b.handle,multi.handle,tool.handle,continued.handle,empty.handle,c.handle,fromEmpty.handle])await release(m,h);
  }catch(e){controls.emptyMultiError=error(e);}finally{m.close();}}
  {const {m}=await start();try{
   const a=await m.execute(controlSources.a),b=await m.execute(controlSources.identical);await selection(m,a.handle,200);await selection(m,b.handle,201);
   const beforeA=await snapshot(m,a.handle,200),beforeB=await snapshot(m,b.handle,201),result=await boolean(m,'union',a.handle,b.handle,202,200,201);
   controls.identical={result,...await snapshot(m,result.handle,202),beforeA,afterA:await snapshot(m,a.handle,200),beforeB,afterB:await snapshot(m,b.handle,201)};
   for(const h of [a.handle,b.handle,result.handle])await release(m,h);
  }catch(e){controls.identicalError=error(e);}finally{m.close();}}
  return{rows,controls,workers,csp:window.componentCsp};
 }finally{window.Worker=OriginalWorker;}
}
