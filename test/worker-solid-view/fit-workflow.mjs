// Source for the next COMPLETE loft workflow, not an isolated execution.
import assert from 'node:assert/strict';
import path from 'node:path';
const readCamera=h=>h.frame.evaluate(()=>{const s=__CAD_APP.viewer.sceneSetup,c=s.camera,t=s.trackballControls.target;return{mode:c.isPerspectiveCamera?'PERSPECTIVE':'ORTHOGRAPHIC',position:c.position.toArray(),up:c.up.toArray(),target:t.toArray(),zoom:c.zoom,near:c.near,far:c.far,projection:c.projectionMatrix.elements.slice(),worldInverse:c.matrixWorldInverse.elements.slice(),viewport:{width:s.container.clientWidth,height:s.container.clientHeight}};});
export async function fittedViewProof({h,call,state,record,out,label}){
 const before=await state();
 const camera=()=>readCamera(h);
 const prior=await camera(),info=before.capture.solids,ids=info.outputs.filter(r=>r.bodyId!==null&&r.displayProjection?.status==='available').map(r=>r.id);
 assert(ids.length>0&&ids.length<=32);const result=await call('fit-worker-solids',{revision:info.revision,bodyIds:ids});
 // Observe actual render frames; there is no timer/retry or synthetic geometry.
 await h.frame.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 const fitted=await camera(),after=await state();record(label+' raw camera-fit',{before,after,prior,fitted,result});
 assert.deepEqual(after,before,'Camera fit changed accepted source/models/J/metadata/counters/file state/resources');
 assert.equal(result.revision,info.revision);assert.deepEqual(result.bodyIds,ids);assert.equal(result.authoredChanged,false);assert.equal(result.boundsSource,'accepted-native-bounds');assert.equal(fitted.mode,prior.mode);assert.deepEqual(fitted.up,prior.up);
 const unit=v=>{const n=Math.hypot(...v);assert(n>0);return v.map(x=>x/n);},direction=c=>unit(c.position.map((x,i)=>x-c.target[i]));
 direction(fitted).forEach((x,i)=>assert(Math.abs(x-direction(prior)[i])<=1e-12,'Fit changed camera direction'));
 const multiply=(m,v)=>Array.from({length:4},(_,i)=>m[i]*v[0]+m[i+4]*v[1]+m[i+8]*v[2]+m[i+12]*v[3]);
 const corners=[];
 for(const id of ids){const row=info.outputs.find(r=>r.id===id),p=row.placement,b=row.metrics.nativeBounds;assert(row.displayProjection.renderTriangleCount>0);
  for(let mask=0;mask<8;mask++){const local=b.min.map((x,i)=>mask&(1<<i)?b.max[i]:x),world=Array.from({length:3},(_,i)=>{const j=4*i;return p[j]*local[0]+p[j+1]*local[1]+p[j+2]*local[2]+p[j+3];});const clip=multiply(fitted.projection,multiply(fitted.worldInverse,[...world,1]));assert(clip.every(Number.isFinite)&&clip[3]>0);const ndc=clip.slice(0,3).map(x=>x/clip[3]);assert(ndc.every(x=>Math.abs(x)<=1+1e-9),'Actual camera clips authenticated bounds');corners.push({id,world,ndc});}
 }
 const ndcBounds={min:[0,1].map(i=>Math.min(...corners.map(c=>c.ndc[i]))),max:[0,1].map(i=>Math.max(...corners.map(c=>c.ndc[i])))};
 assert(Math.max(...ndcBounds.max.map((x,i)=>x-ndcBounds.min[i]))>=.7,'The ordinary loft must occupy at least35% of one viewport dimension');
 const screenshot=label.replace(/[^a-zA-Z0-9_-]/g,'-')+'.png',canvas=await h.frame.$('#viewer-container canvas');assert(canvas,'Actual modeling canvas');await canvas.screenshot({path:path.join(out,screenshot)});
 const proof={label,before,after,prior,fitted,result,corners,ndcBounds,screenshot};record(label+' viewport proof',proof);return proof;
}

export async function refusedViewProof({h,call,state,record,label,args,code}){
 const before=await state(),cameraBefore=await readCamera(h);let error;
 try{await call('fit-worker-solids',args);}catch(e){error={name:e.name,code:e.code??null,message:e.message,committed:e.committed===true,possiblyCommitted:e.possiblyCommitted===true};}
 const after=await state(),cameraAfter=await readCamera(h),proof={label,args,expectedCode:code,error:error??null,before,after,cameraBefore,cameraAfter};record(label+' raw view refusal',proof);
 assert(error);assert.equal(error.code,code);assert(!error.committed&&!error.possiblyCommitted);assert.deepEqual(after,before,'Refused fit changed accepted state');assert.deepEqual(cameraAfter,cameraBefore,'Refused fit changed camera');return proof;
}
