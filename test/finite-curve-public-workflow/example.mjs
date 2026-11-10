// Public recipe only. No source setter, solver call, opaque-ID grammar or native ordinal.
export function createFiniteCurveExample(agent,engineRevision,queryEngineRevision){
 const call=(command,args={})=>agent.execute(command,args);
 const one=(rows,label)=>{if(rows.length!==1)throw Error('Expected one '+label);return rows[0];};
 async function inspect(faceId){const r=await call('inspect-closed-sketches');return call('inspect-closed-sketch',{revision:r.revision,faceId});}
 async function begin(){const r=await call('inspect-sketch-creation');if(!r.ready)throw Error(r.reason);return call('create-empty-sketch-plane',{revision:r.revision,unit:'millimeter',plane:'XY',depth:0});}
 async function append(faceId,kind,data,role=null){const r=await inspect(faceId);return call('append-sketch-primitive',{revision:r.revision,faceId,kind,data,role,stage:r.stageCount-1});}
 async function query(faceId,curveIds,domain={kind:'finite-pair'}){const r=await inspect(faceId);return call('inspect-closed-sketch-intersections',{revision:r.revision,faceId,engine:'occ',engineRevision:queryEngineRevision,curveIds,domain});}
 async function endpoint(faceId,action,target,query,event){const r=await inspect(faceId);return call('edit-closed-sketch-endpoint',{revision:r.revision,faceId,action,target,queryId:query.queryId,eventId:event.eventId});}
 async function ownedPoint(faceId,parentId,coordinate){const r=await inspect(faceId);return one(r.points.filter(p=>p.parentId===parentId&&Math.abs(p.x-coordinate[0])<=5e-8&&Math.abs(p.y-coordinate[1])<=5e-8),'unique actual parent-owned point within source budget');}
 async function fix(faceId,id){const r=await inspect(faceId);return call('apply-closed-sketch-fix-entity',{revision:r.revision,faceId,id});}
 async function unfix(faceId,id){const r=await inspect(faceId),row=one(r.fixedEntities.rows.filter(x=>x.id===id&&x.canRemove),'actual removable Fix');return call('remove-closed-sketch-fix-entity',{revision:r.revision,faceId,constraintId:row.constraintId});}
 async function coincide(faceId,a,b){const r=await inspect(faceId);return call('apply-closed-sketch-coincidence',{revision:r.revision,faceId,ids:[a,b]});}
 async function move(faceId,id,x,y){const r=await inspect(faceId);return call('edit-closed-sketch-point',{revision:r.revision,faceId,id,x,y});}
 async function extrude(faceId,ids,depth){const r=await call('inspect-selected-profiles',{engineRevision});if(!r.ready)throw Error(r.reason);const choices=await call('inspect-selected-regions',{revision:r.revision,faceId,depth,engineRevision}),want=ids.slice().sort();const region=one(choices.regions.filter(r=>r.support==='supported'&&JSON.stringify(r.descriptor.outerCurveIds.slice().sort())===JSON.stringify(want)&&r.descriptor.holeCurveIds.length===0),'actual selected boundary region');return call('create-selected-extrusion',{revision:choices.revision,faceId,regionId:region.regionId,unit:'millimeter',engine:'occ',engineRevision,depth,bodyPolicy:'separate'});}
 async function radius(faceId,id,radius){const r=await inspect(faceId);return call('apply-closed-sketch-radius',{revision:r.revision,faceId,id,radius});}
 async function bindRadius(faceId,id,value){const r=await inspect(faceId),d=one(r.dimensionTargets.filter(x=>x.typeId==='RadiusLength'&&x.objects.length===1&&x.objects[0]===id&&x.canEdit),'actual RadiusLength locator');return call('edit-closed-sketch-dimension',{revision:r.revision,faceId,constraintId:d.constraintId,value});}
 async function definitions(definitions){const r=await call('inspect-physical-parameters');return call('apply-physical-bindings',{revision:r.revision,changes:[],definitions});}
 return Object.freeze({call,one,inspect,begin,append,query,endpoint,ownedPoint,fix,unfix,coincide,move,extrude,radius,bindRadius,definitions});
}
