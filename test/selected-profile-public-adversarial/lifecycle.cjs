const assert=require('node:assert/strict');
module.exports=async(page,{fresh})=>{
 const rows=[];
 for(const mode of['inspect-caller-abort','inspect-source-ABA','create-semantic-abort','create-native-host-close']){
  const target=mode==='create-native-host-close'?await fresh():page;if(target!==page)await target.evaluate(()=>sp.setup());
  await target.evaluate(mode=>{
   window.spHeldBefore=sp.capture();window.spHeld=false;window.spHeldSettled=null;window.spLatePassed=false;window.spAbort=new AbortController();window.spHeldNative=Worker;
   window.Worker=class extends spHeldNative{constructor(...args){super(...args);this.addEventListener('message',event=>{
    const d=event.data,task=this.row.task,match=mode==='create-native-host-close'?task==='selected-profile-extrude'&&d.kind==='result':task===(mode.startsWith('inspect-')?'inspect-selected':'prepare-selected')&&d.ok===true;
    if(!match)return;if(this.wasHeld){spLatePassed=true;return;}this.wasHeld=true;event.stopImmediatePropagation();window.spHeld=true;window.spHeldKind={task,ok:d.ok??null,kind:d.kind??null};const Message=MessageEvent;window.spRelease=()=>this.dispatchEvent(new Message('message',{data:d}));
   });}};
   window.spHeldJob=(mode.startsWith('inspect-')?sp.inspect({signal:spAbort.signal}):sp.create({signal:spAbort.signal})).then(value=>({ok:true,value}),e=>({ok:false,name:e.name,code:e.code||null,message:e.message,committed:e.committed||false})).then(result=>{spHeldSettled=result;return result;});
  },mode);
  await target.waitForFunction(()=>spHeld||spHeldSettled,{timeout:45000,polling:50});assert.equal(await target.evaluate(()=>spHeld),true,mode+': '+JSON.stringify(await target.evaluate(()=>spHeldSettled)));
  const row=await target.evaluate(async mode=>{
   try{
    let expected=spHeldBefore,aba=null;
    if(mode==='inspect-source-ABA'){
     const c=__CAD_APP,k=c.craftService,old=c.sketchStorageService.getSketchData(sp.faceId),key=c.projectService.sketchStorageKey(sp.faceId),version=c.storageService.versionOf(key);
     await sp.append('Point',{x:88,y:89},'construction');await k.authoredEditTravel({revision:k.inspectAuthoredEdits().revision,direction:'undo'});
     aba={bytesRestored:c.sketchStorageService.getSketchData(sp.faceId)===old,versionChanged:c.storageService.versionOf(key)!==version};if(!aba.bytesRestored||!aba.versionChanged)throw Error('Actual public ABA was not established');expected=sp.capture();
    }else if(mode==='create-native-host-close'){
     // A closed host intentionally releases live resource owners and refuses
     // live revision inspectors; authored bytes/history/models remain observable.
     expected=sp.rawCapture();delete expected.resources;spHost.abort();
    }else spAbort.abort();
    const result=await spHeldJob;let after=mode==='create-native-host-close'?sp.rawCapture():sp.capture();if(mode==='create-native-host-close')delete after.resources;
    const settled=JSON.stringify(after),preserved=JSON.stringify(expected)===settled;spRelease();await new Promise(resolve=>setTimeout(resolve,100));let late=mode==='create-native-host-close'?sp.rawCapture():sp.capture();if(mode==='create-native-host-close')delete late.resources;
    return{mode,genuineReply:spHeldKind,result,aba,preserved,lateReplyDelivered:spLatePassed,lateReplyPreserved:JSON.stringify(late)===settled,resources:__CAD_APP.craftService.engineResourceUsage,workers:spWorkers};
   }finally{window.Worker=spHeldNative;}
  },mode);
  assert.equal(row.result.ok,false,JSON.stringify(row));assert.equal(row.result.committed,false);assert.equal(row.preserved,true,JSON.stringify(row));assert.equal(row.lateReplyDelivered,true);assert.equal(row.lateReplyPreserved,true);assert.equal(row.resources.candidates,0);assert.equal(row.resources.cleanupFailed,false);
  if(mode==='create-native-host-close'){assert.equal(row.resources.mounts,0);assert.equal(row.resources.owners,0);assert.ok(row.workers.every(w=>w.terminated));await target.close();}
  rows.push(row);
 }
 return rows;
};
