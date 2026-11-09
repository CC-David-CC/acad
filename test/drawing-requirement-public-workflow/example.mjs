// Actual registered operations only. A recipe carries returned references;
// it does not create source, geometry, Native selectors or a second journal.
export function createDrawingRequirementExample(agent,build){
 if(typeof agent?.execute!=='function'||typeof agent?.inspect!=='function'||!/^sha256:[a-f0-9]{64}:[a-f0-9]{64}$/.test(build))throw Error('Use the actual public CAD executor, inspection and explicit drawing build.');
 const call=(id,args={})=>agent.execute(id,args),one=(rows,label)=>{if(!Array.isArray(rows)||rows.length!==1)throw Error('Expected exactly one '+label);return rows[0];},clone=value=>structuredClone(value);
 let busy=false;const serial=async work=>{if(busy)throw Error('Wait for the current recipe operation.');busy=true;try{return await work();}finally{busy=false;}};
 const dot=(a,b)=>a.reduce((s,n,i)=>s+n*b[i],0),near=(a,b,t=1e-7)=>Math.abs(a-b)<=t;
 function sourceDatum(b){return{featureId:b.profile.featureId,faceId:b.faceId,regionId:b.regionId};}
 async function target(b){
  const last=b.last||b.center,info=await call('inspect-worker-history-controls'),accepted=await call('inspect'),row=one(info.features.filter(r=>r.featureId===last.featureId),'actual current target history row');
  if(!info.ready||info.pointer!==info.fullTipIndex||accepted.operationsTruncated||accepted.operations[row.index]!==row.type)throw Error('Current genuine target history is unavailable.');
  return{featureId:last.featureId,operationType:row.type,engine:'occ',engineRevision:build,output:'complete-native-result'};
 }
 async function discover(b){
  const info=await call('inspect-linked-part-drawing'),request={version:1,unit:'millimeter',revision:info.revision,geometryRevision:info.geometryRevision,target:await target(b),datum:sourceDatum(b)},result=await call('inspect-worker-drawing-requirement-targets',request);
  if(result.revision!==request.revision||result.geometryRevision!==request.geometryRevision||result.observation.quality!=='native-bound-drawing-requirement-targets')throw Error('Requirement discovery changed source binding.');
  return{request,result};
 }
 function plane(discovery,axis,level){
  const o=discovery.result.observation,f=o.sourceFrame;if(!f||!Array.isArray(f[axis]))throw Error('Actual source frame is unavailable.');
  const rows=o.planes.filter(r=>r.status==='available'&&r.reference.geometry==='plane'&&r.facts.sourceAxis===axis&&dot(r.facts.support.normal,f[axis])>1-1e-8&&near(dot(r.facts.support.origin.map((n,i)=>n-f.origin[i]),f[axis]),level));
  if(!rows.length)throw Error('No actual discovered '+axis+' support at requested source level.');
  // Coplanar Native patches can be legitimate distinct selectable faces. Pick
  // an actual eligible record, never construct a selector from an ordinal or
  // pretend that their equal supports establish common face identity.
  rows.sort((a,b)=>{for(let i=0;i<3;i++){const d=a.facts.anchor[i]-b.facts.anchor[i];if(d)return d;}return a.reference.selectionId.localeCompare(b.reference.selectionId);});return rows[0];
 }
 function bore(discovery,b){return one(discovery.result.observation.bores.filter(r=>r.status==='available'&&r.reference.featureId===b.center.featureId&&r.reference.sourceFeatureId===b.profile.featureId&&r.reference.faceId===b.faceId&&r.reference.regionId===b.regionId&&r.reference.slot==='center'),'actual finite centered bore');}
 async function request(action,definition,old){
  const i=old||await call('inspect-linked-part-drawing');return{version:1,unit:'millimeter',revision:i.revision,geometryRevision:i.geometryRevision,...(action==='create'?{}:{drawingId:definition.drawingId}),...(action==='remove'?{}:{definition})};
 }
 return Object.freeze({
  author:()=>serial(async()=>{
   const i=await call('inspect-rectangle-creation');if(!i.ready)throw Error(i.reason);
   const rectangle=await call('create-rectangle-sketch',{revision:i.revision,unit:'millimeter',origin:[0,0],width:100,height:50,depth:0}),faceId=rectangle.faceId,source=await agent.inspect(faceId);
   if(source.objects.length!==4||source.objects.some(r=>r.type!=='Segment'))throw Error('Actual four-Segment rectangle source required.');
   const selected=await call('inspect-selected-profiles',{engineRevision:build});if(!selected.ready||!selected.availableBuilds.some(r=>r.engine==='occ'&&r.engineRevision===build))throw Error(selected.reason||'Explicit build unavailable.');
   const regions=await call('inspect-selected-regions',{revision:selected.revision,faceId,depth:20,engineRevision:build}),ids=source.objects.map(r=>r.id),region=one(regions.regions.filter(r=>r.support==='supported'&&r.descriptor.outerCurveIds.length===4&&r.descriptor.holeCurveIds.length===0&&r.descriptor.outerCurveIds.every(id=>ids.includes(id))),'actual source-bound rectangle region');
   const profile=await call('create-selected-extrusion',{revision:regions.revision,faceId,regionId:region.regionId,unit:'millimeter',engine:'occ',engineRevision:build,depth:20,bodyPolicy:'separate'}),holes=await call('inspect-through-holes'),t=one(holes.targets.filter(r=>r.bodyId===profile.outputId&&r.sourceFeatureId===profile.featureId),'actual centered-through producer');
   if(!holes.ready||!t.creation['centered-through'].canCreate||t.engineRevision!==build)throw Error(t.creation['centered-through'].reason||holes.reason);
   const center=await call('create-through-hole',{revision:holes.revision,version:1,unit:'millimeter',engine:'occ',engineRevision:build,bodyId:t.bodyId,sourceFeatureId:t.sourceFeatureId,kind:'centered-through',diameter:10});
   return{rectangle,faceId,curveIds:region.descriptor.outerCurveIds,regionId:region.regionId,profile,center,last:center};
  }),
  discover:b=>serial(()=>discover(b)),
  definition:(b,drawingId)=>serial(async()=>{
   const found=await discover(b),A=plane(found,'z',20),B=plane(found,'x',0),C=plane(found,'y',0),lower=plane(found,'z',0),center=bore(found,b),s=await agent.inspect(b.faceId),rows=s.objects.filter(o=>b.curveIds.includes(o.id)).map(o=>({id:o.id,points:s.points.filter(p=>p.parentId===o.id)}));
   const horizontal=one(rows.filter(r=>r.points.length===2&&r.points.every(p=>near(p.y,0,5e-8))&&Math.abs(r.points[0].x-r.points[1].x)>1),'actual source bottom Segment'),vertical=one(rows.filter(r=>r.points.length===2&&r.points.every(p=>near(p.x,0,5e-8))&&Math.abs(r.points[0].y-r.points[1].y)>1),'actual source left Segment');
   const point=(r,end)=>({kind:'source-point',featureId:b.profile.featureId,faceId:b.faceId,regionId:b.regionId,curveId:r.id,curveType:'segment',point:end}),reference=clone(center.reference);
   const definition={version:4,unit:'millimeter',drawingId,title:'Linked datum position finish and declared clearance',target:found.request.target,datum:sourceDatum(b),sheet:{width:594,height:420,scale:{numerator:1,denominator:1}},views:[{viewId:'top',basis:'top',paperOrigin:[100,100],visibility:'visible-and-hidden'},{viewId:'front',basis:'front',paperOrigin:[100,240],visibility:'visible-and-hidden'},{viewId:'right',basis:'right',paperOrigin:[350,240],visibility:'visible-and-hidden'}],dimensions:[
    {dimensionId:'width',viewId:'top',kind:'source-distance',axis:'datum-x',from:point(horizontal,'a'),to:point(horizontal,'b'),label:[175,120]},
    {dimensionId:'height',viewId:'top',kind:'source-distance',axis:'datum-y',from:point(vertical,'a'),to:point(vertical,'b'),label:[80,70]},
    {dimensionId:'depth',viewId:'front',kind:'plane-distance',axis:'datum-normal',first:clone(lower.reference),second:clone(A.reference),label:[270,220]},
    {dimensionId:'nominal-hole',viewId:'top',kind:'hole-diameter',hole:clone(reference),label:[180,60]}],
    annotations:[{annotationId:'original-center-mark',kind:'bore-center',viewId:'top',hole:clone(reference),extension:3}],
    datumFeatures:[{annotationId:'datum-A',symbol:'A',viewId:'top',label:[280,40],reference:clone(A.reference)},{annotationId:'datum-B',symbol:'B',viewId:'front',label:[40,190],reference:clone(B.reference)},{annotationId:'datum-C',symbol:'C',viewId:'right',label:[510,240],reference:clone(C.reference)}],
    requirements:[{annotationId:'position-zone',kind:'position-tolerance',viewId:'top',label:[340,70],target:clone(reference),zone:{kind:'diameter',value:0.20,unit:'millimeter'},datumSymbols:['A','B','C']},{annotationId:'finish-Ra',kind:'surface-finish',viewId:'top',label:[340,110],target:clone(A.reference),parameter:'Ra',maximum:{value:3.2,unit:'micrometer'}},{annotationId:'declared-fit',kind:'clearance-fit',viewId:'top',label:[340,160],nominalDimensionId:'nominal-hole',hole:{lowerDeviation:0,upperDeviation:0.015},declaredShaft:{lowerDeviation:-0.020,upperDeviation:-0.005},unit:'millimeter'}]};
   return{definition,discovery:found};
  }),
  request:(action,d,old)=>request(action,d,old),
  publish:(action,d,old)=>serial(async()=>call(action+'-linked-part-drawing',await request(action,d,old))),
  read:d=>serial(async()=>{const i=await call('inspect-linked-part-drawing');return call('read-linked-part-drawing-requirements',{revision:i.revision,geometryRevision:i.geometryRevision,definition:d});}),
  resize:(b,width,height)=>serial(async()=>{const i=await call('inspect-rectangle-dimensions');return call('edit-rectangle-dimensions',{revision:i.revision,faceId:b.faceId,width,height});}),
  depth:(b,depth)=>serial(async()=>{const i=await call('inspect-selected-profile-history'),r=one(i.features.filter(r=>r.featureId===b.profile.featureId),'actual profile');return call('edit-selected-profile-depth',{revision:i.revision,index:r.index,featureId:r.featureId,depth});}),
  diameter:(b,diameter)=>serial(async()=>{const i=await call('inspect-through-hole-history'),r=one(i.features.filter(r=>r.featureId===b.center.featureId),'actual center bore');return call('edit-through-hole',{revision:i.revision,index:r.index,featureId:r.featureId,diameter});}),
  box:(origin,dimensions)=>serial(async()=>{const i=await call('inspect-worker-solids');return call('create-worker-solid-box',{revision:i.revision,version:1,unit:'millimeter',engine:'occ',engineRevision:build,origin,dimensions});}),
  cover:(b,tool)=>serial(async()=>{const i=await call('inspect-worker-solids');return call('create-worker-solid-boolean',{revision:i.revision,version:1,unit:'millimeter',engine:'occ',kind:'union',a:b.last.outputId,b:tool.outputId});}),
  retarget:(b,d)=>serial(async()=>{const result=clone(d);result.target=await target(b);return result;}),
  repair:(b,d,{lower=0,upper=27}={})=>serial(async()=>{const found=await discover(b),A=plane(found,'z',lower),B=plane(found,'x',0),C=plane(found,'y',0),top=plane(found,'z',upper);bore(found,b);const result=clone(d);for(const [symbol,row]of[['A',A],['B',B],['C',C]])one(result.datumFeatures.filter(r=>r.symbol===symbol),'actual datum '+symbol).reference=clone(row.reference);one(result.requirements.filter(r=>r.kind==='surface-finish'),'actual finish intent').target=clone(A.reference);const depth=one(result.dimensions.filter(r=>r.dimensionId==='depth'),'actual depth dimension');depth.first=clone(A.reference);depth.second=clone(top.reference);return{definition:result,discovery:found};}),
  travel:direction=>serial(async()=>{const i=await call('inspect-authored-edits');return call('travel-authored-edit',{revision:i.revision,direction});}),
  displayUnits:lengthUnit=>serial(async()=>{const i=await call('inspect-display-units');return call('set-display-units',{revision:i.revision,lengthUnit});})
 });
}
