const assert=require('node:assert/strict');
module.exports=async(page,{fresh})=>{
 const rows=[];
 const inputs=await page.evaluate(async()=>{
  const c=__CAD_APP,k=c.craftService,rows=[];window.spRows=rows;window.spPhase='inputs';
  async function refuse(id,call){spPhase=id;const before=sp.capture();let error;try{await call();}catch(e){error={name:e.name,code:e.code||null,message:e.message,committed:e.committed||false};}if(!error)throw Error('Expected refusal '+id);const after=sp.capture();if(JSON.stringify(before)!==JSON.stringify(after))throw Error('Refusal changed accepted state '+id);rows.push({id,error,preserved:true});}
  for(const field of['revision','faceId','regionId','depth','engineRevision','bodyPolicy']){let reads=0;const request=sp.request(),value=request[field];Object.defineProperty(request,field,{enumerable:true,get(){reads++;return value;}});await refuse('request-accessor-'+field,()=>k.createSelectedProfileExtrusion(request));if(reads)throw Error('Caller getter executed '+field);rows.at(-1).getterReads=reads;}
  for(const field of['signal','valid']){let reads=0;const options={};Object.defineProperty(options,field,{enumerable:true,get(){reads++;return field==='valid'?()=>true:new AbortController().signal;}});await refuse('option-accessor-'+field,()=>k.createSelectedProfileExtrusion(sp.request(),options));if(reads)throw Error('Option getter executed');rows.at(-1).getterReads=reads;}
  for(const[field,value]of[['depth',0],['depth',-1],['depth',Infinity],['depth',1000001],['engine','manifold'],['engine','smlib'],['bodyPolicy','join'],['engineRevision','foreign'],['regionId','sketch-region:'+ 'x'.repeat(8192)]])await refuse('invalid-'+field+'-'+String(value).slice(0,16),()=>k.createSelectedProfileExtrusion({...sp.request(),[field]:value}));
  const cancelled=new AbortController();cancelled.abort();await refuse('pre-aborted-caller',()=>k.createSelectedProfileExtrusion(sp.request(),{signal:cancelled.signal}));await refuse('false-caller-lifetime',()=>k.createSelectedProfileExtrusion(sp.request(),{valid:()=>false}));
  const stale=sp.request();await sp.append('Point',{x:50,y:50},'construction');await refuse('stale-public-source-revision',()=>k.createSelectedProfileExtrusion(stale));
  // Current revision with an invented current-looking selection still cannot
  // produce a native shape or consume any source geometry.
  await refuse('unknown-region-membership',()=>k.createSelectedProfileExtrusion({...sp.request(),regionId:'sketch-region:'+JSON.stringify({outer:['missing'],holes:[]})}));
  return rows;
 });rows.push(...inputs);
 for(const mode of['solve-extra','solve-wrong-digest','semantic-wrong-job','semantic-wrong-face','semantic-duplicate-region','prepare-wrong-depth','prepare-volume-first','prepare-volume-both','native-wrong-region']){
  const row=await page.evaluate(async mode=>{
   window.spPhase=mode;const c=__CAD_APP,k=c.craftService,before=sp.capture(),Native=Worker;let injected=0,nativeResults=0;
   const creating=mode.startsWith('prepare-')||mode.startsWith('native-');
   window.Worker=class extends Native{constructor(...args){super(...args);this.addEventListener('message',e=>{
    const d=e.data,task=this.row.task;if(task==='selected-profile-extrude'&&d.kind==='result')nativeResults++;
    if(mode.startsWith('solve-')&&task==='rectangle-extrusion-solve'&&d.ok===true&&!injected){injected++;if(mode==='solve-extra')d.extra=true;else d.sketchDigest='0'.repeat(64);}
    else if(mode.startsWith('semantic-')&&task==='inspect-selected'&&d.ok===true&&!injected){injected++;if(mode==='semantic-wrong-job')d.jobId='foreign';else if(mode==='semantic-wrong-face')d.value.binding.faceId='foreign';else d.value.regions.push(structuredClone(d.value.regions[0]));}
    else if(mode.startsWith('prepare-')&&task==='prepare-selected'&&d.ok===true&&(mode==='prepare-volume-both'?injected<2:!injected)){injected++;if(mode==='prepare-wrong-depth')d.value.request.depth+=1;else d.value.expected.volume*=2;}
    else if(mode==='native-wrong-region'&&task==='selected-profile-extrude'&&d.kind==='result'&&!injected){injected++;d.binding.regionId='sketch-region:foreign';}
   });}};
   let outcome;try{await(creating?sp.create():sp.inspect());outcome={ok:true};}catch(error){outcome={ok:false,name:error.name,code:error.code||null,message:error.message,committed:error.committed||false};}finally{window.Worker=Native;}
   const after=sp.capture();return{mode,injected,nativeResults,outcome,preserved:JSON.stringify(before)===JSON.stringify(after),differences:Object.keys(before).filter(key=>JSON.stringify(before[key])!==JSON.stringify(after[key])),resources:k.engineResourceUsage};
  },mode);
  assert.ok(row.injected>0,JSON.stringify(row));assert.equal(row.outcome.ok,false,JSON.stringify(row));assert.equal(row.outcome.committed,false);assert.equal(row.preserved,true,JSON.stringify(row));
  if(mode==='prepare-volume-both'){assert.equal(row.injected,2);assert.ok(row.nativeResults>=1);assert.equal(row.outcome.code,'NATIVE_MEASUREMENT_MISMATCH',JSON.stringify(row));}
  if(mode==='native-wrong-region')assert.ok(row.nativeResults>=1);assert.equal(row.resources.candidates,0);rows.push(row);
 }
 rows.push(...await require('./lifecycle.cjs')(page,{fresh}));
 const dependencies=await require('./dependencies.cjs')({fresh});rows.push({id:'bounded-selected-full-replay',...dependencies});return rows;
};
