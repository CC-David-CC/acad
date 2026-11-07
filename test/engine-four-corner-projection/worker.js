const {projectBoundCenteredHole}=require('../../modules/engine/projection/centeredHoleProjection.ts');
const {projectBoundFourCornerHoles}=require('../../modules/engine/projection/fourCornerHoleProjection.ts');
self.onmessage=e=>{try{
 const {center,result}=e.data,regionId='region',stable=v=>'worker-prism:1:'+JSON.stringify(v);
 const parent={id:stable(['42','body']),faces:[]};
 parent.faces=Array.from({length:6},(_,i)=>{const role=i===4?'BASE':i===5?'LID':'SWEEP',source=role==='SWEEP'?{segmentId:'seg'+i}:{regionId},key={featureId:'42',kind:'face',role,source};return {id:stable(['42','face',role,source]),root:parent,topology:{data:{portableIdentity:{key}}}}});
 const parentTopology={faces:Array.from({length:6},(_,i)=>({id:'face:'+i}))};
 const centeredIntent={featureId:'43',target:{parentFeatureId:'42',regionId,bodyId:parent.id}},occupiedIds=new Set([parent.id,...parent.faces.map(f=>f.id)]);
 const centered=projectBoundCenteredHole({topology:center,parentTopology,parentModel:parent,intent:centeredIntent,occupiedIds});centered.checkProjection();
 const intent={featureId:'44',centerFeatureId:'43',target:{parentFeatureId:'42',regionId,bodyId:parent.id}};
 const occupied=new Set();centered.model.traverse(v=>occupied.add(v.id));
 const projected=projectBoundFourCornerHoles({topology:result,parentTopology:center,parentModel:centered.model,intent,occupiedIds:occupied});
 projected.checkProjection();
 const model=projected.model,old=model.edges.find(e=>e.ext.workerIdentity?.stability==='transient'),oldIdentity=old.ext.workerIdentity;
 old.ext.workerIdentity={stability:'authored'};let rejected=false;try{projected.checkProjection()}catch{rejected=true}old.ext.workerIdentity=oldIdentity;projected.checkProjection();
 self.postMessage({ok:true,faces:model.faces.length,edges:model.edges.length,vertices:model.vertices.length,inner:model.faces.filter(f=>f.brepFace.innerLoops.length===5).length,authoredFaces:model.faces.filter(f=>f.topology.data.portableIdentity?.stability==='authored').length,authoredEdges:model.edges.filter(v=>v.ext.workerIdentity?.stability==='authored').length,rejected});
}catch(error){self.postMessage({ok:false,error:String(error),stack:error.stack})}};
