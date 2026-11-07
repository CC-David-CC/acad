// Narrow beginner exercise using the same BOX and SCALE_BODY_PIVOT operations
// as the modeling UI. This is not a generic remote modeling interface.
const states=new WeakMap();
const LIMIT=1024*1024;
const check=options=>{if(options?.signal?.aborted||(options?.valid&&!options.valid()))throw Error('The CAD window or account is no longer available.');};
const dimensions=v=>{if(!v||Object.keys(v).sort().join(',')!=='x,y,z'||![v.x,v.y,v.z].every(n=>typeof n==='number'&&Number.isFinite(n)&&n>=0.01&&n<=10000))throw Error('Provide X, Y and Z between 0.01 and 10000.');};
function state(ctx) {
 const craft=ctx.craftService,mods=craft?.modifications$?.value,models=craft?.models$?.value;
 if(ctx.projectManager?.unit!=='millimeter')throw Error('This command requires a millimeter project.');
 if(ctx.projectManager.getManufacturingMetadata?.())throw Error('This command does not support material-assigned designs.');
 if(!mods||!models||craft.isProcessing||craft.pipelineFailure$.value||ctx.services.sketcher.inPlaceEditor.inEditMode||(ctx.wizardService.workingRequest$.value && mods.pointer===mods.history.length-1)||ctx.streams.wizard.insertOperation.value)throw Error('Finish the current operation before using the block command.');
 if(mods.history.length>2||mods.history.some((r,i)=>r.type!==(i?'SCALE_BODY_PIVOT':'BOX'))||mods.pointer < -1||mods.pointer>=mods.history.length)throw Error('This command supports only an empty document or its own single block.');
 if((mods.pointer<0&&models.length!==0)||(mods.pointer>=0&&models.length!==1))throw Error('The document contains unsupported geometry.');
 const keys=(o,expected)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).sort().join(',')===expected;
 if(mods.history.length){const p=mods.history[0].params;
  if(!keys(p,'boolean,featureId,x,y,z')||!keys(p.boolean,'kind,simplify,targets')||p.boolean.kind!=='NONE'||typeof p.boolean.simplify!=='boolean'||!Array.isArray(p.boolean.targets)||p.boolean.targets.length||typeof p.featureId!=='string'||!/^\d{1,12}$/.test(p.featureId))throw Error('This block contains unsupported settings.');
  dimensions({x:p.x,y:p.y,z:p.z});
 }
 if(mods.history.length===2){const p=mods.history[1].params;
  if(!keys(p,'factor,featureId,shells,x,y,z')||!Array.isArray(p.shells)||p.shells.length!==1||typeof p.shells[0]!=='string'||p.shells[0].length>256||typeof p.featureId!=='string'||!/^\d{1,12}$/.test(p.featureId)||![p.x,p.y,p.z,p.factor].every(n=>typeof n==='number'&&Number.isFinite(n))||p.x!==0||p.y!==0||p.z!==0||p.factor<0.1||p.factor>10)throw Error('This block contains unsupported size changes.');
 }
 const history=JSON.stringify(mods);if(history.length>LIMIT)throw Error('The document is too large for the block command.');
 return {mods,models,history,project:ctx.projectService.id};
}
function tokenState(ctx,options) {
 check(options);const s=state(ctx),token=crypto.randomUUID();states.set(ctx,{...s,token});return {s,token};
}
function validate(ctx,token,options) {
 check(options);const saved=states.get(ctx),now=state(ctx);
 if(!saved||token!==saved.token||now.mods!==saved.mods||now.models!==saved.models||now.history!==saved.history||now.project!==saved.project)throw Error('The document changed; inspect it again.');
 states.delete(ctx);check(options);return now;
}
function measure(s) {
 if(s.mods.pointer<0)return null;
 const model=s.models[0];if(model.faces?.length!==6||!model.brepShell?.vertices)throw Error('Only an uncut block can be measured.');
 const vertices=[];for(const vertex of model.brepShell.vertices){if(vertices.length===8)throw Error('Only an uncut block can be measured.');vertices.push(vertex.point)}
 if(vertices.length!==8)throw Error('Only an uncut block can be measured.');
 if(!vertices.length||vertices.some(p=>![p.x,p.y,p.z].every(Number.isFinite)))throw Error('Block geometry could not be measured.');
 const bounds=['x','y','z'].map(k=>[Math.min(...vertices.map(p=>p[k])),Math.max(...vertices.map(p=>p[k]))]);
 let signed=0;for(const face of model.brepShell.faces){
  if(face.innerLoops.length)throw Error('Only an uncut block can be measured.');
  const poly=face.outerLoop.asPolygon(),n=face.surface.normalInMiddle();
  for(let i=1;i+1<poly.length;i++){let [a,b,c]=[poly[0],poly[i],poly[i+1]];
   const ux=b.x-a.x,uy=b.y-a.y,uz=b.z-a.z,vx=c.x-a.x,vy=c.y-a.y,vz=c.z-a.z;
   if((uy*vz-uz*vy)*n.x+(uz*vx-ux*vz)*n.y+(ux*vy-uy*vx)*n.z<0)[b,c]=[c,b];
   signed+=(a.x*(b.y*c.z-b.z*c.y)+a.y*(b.z*c.x-b.x*c.z)+a.z*(b.x*c.y-b.y*c.x))/6;
  }
 }
 const volume=Math.abs(signed);if(!Number.isFinite(volume))throw Error('Block volume could not be measured.');
 return {bodyId:model.id,bounds,dimensions:{x:bounds[0][1]-bounds[0][0],y:bounds[1][1]-bounds[1][0],z:bounds[2][1]-bounds[2][0]},volume,unit:'millimeter',volumeUnit:'cubic-millimeter',faces:model.faces.length};
}
async function settled(ctx,options) {
 const deadline=Date.now()+30000;
 while(ctx.craftService.isProcessing){if(Date.now()>deadline)throw Error('The operation may have completed; inspect the model before retrying.');await new Promise(r=>setTimeout(r,20));}
 check(options);if(ctx.craftService.pipelineFailure$.value)throw Error('The model could not regenerate.');
}
async function modify(ctx,request,options) {
 let dispatched=false;
 try{check(options);dispatched=true;await new Promise((resolve,reject)=>ctx.craftService.modify(request,resolve,reject));await settled(ctx,options);}
 catch(error){if(dispatched&&(options?.signal?.aborted||(options?.valid&&!options.valid())))throw Error('The operation may have completed; reopen and inspect before retrying.');throw error;}
}
export function createBlockLearningService(ctx) {
 return {
  inspect(options={}) {const {s,token}=tokenState(ctx,options);return {revision:token,historyLength:s.mods.history.length,pointer:s.mods.pointer,block:measure(s)};},
  async create(revision,values,options={}) {
   dimensions(values);const s=validate(ctx,revision,options);
   if(s.mods.history.length||s.models.length)throw Error('Start with an empty document.');
   const snapshot=ctx.projectManager.snapshotCurrentProject();const project=snapshot.project||snapshot;
   if(snapshot.unit!=='millimeter'||project.sketches?.length||project.surfacing||snapshot.manufacturing||project.model?.expressions)throw Error('Start with an empty document.');
   check(options);const featureId=ctx.projectService.counterGenerator.generateFeatureId();
   await modify(ctx,{type:'BOX',params:{...values,boolean:{kind:'NONE',simplify:true,targets:[]},featureId}},options);
   return this.inspect(options);
  },
  async scale(revision,factor,options={}) {
   if(typeof factor!=='number'||!Number.isFinite(factor)||factor<0.1||factor>10)throw Error('Provide a scale factor between 0.1 and 10.');
   const s=validate(ctx,revision,options);if(s.mods.history.length!==1||s.mods.pointer!==0||s.models.length!==1)throw Error('Create one block before scaling it.');
   const current=measure(s);dimensions(Object.fromEntries(Object.entries(current.dimensions).map(([k,v])=>[k,v*factor])));
   check(options);const featureId=ctx.projectService.counterGenerator.generateFeatureId();
   await modify(ctx,{type:'SCALE_BODY_PIVOT',params:{shells:[current.bodyId],x:0,y:0,z:0,factor,featureId}},options);
   return this.inspect(options);
  },
  async travel(revision,direction,options={}) {
   const s=validate(ctx,revision,options);if(s.mods.history.length!==2||!['undo','redo'].includes(direction)||(direction==='undo'?s.mods.pointer!==1:s.mods.pointer!==0))throw Error('No matching block size change to undo or redo.');
   check(options);ctx.craftService.historyTravel[direction==='undo'?'backward':'forward']({noWizardFocus:true});
   try{await settled(ctx,options);}catch(error){if(options?.signal?.aborted||(options?.valid&&!options.valid()))throw Error('The history change may have completed; reopen and inspect before retrying.');throw error;}
   return this.inspect(options);
  }
 };
}
