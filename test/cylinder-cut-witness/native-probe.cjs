// Fresh genuine native FFI only; run through the existing reviewed runner.
function runTest(runtimePins){
 const fs=require('node:fs'),assert=require('node:assert/strict'),output=process.env.CODI_CYLINDER_NATIVE_OUTPUT;assert(output&&!fs.existsSync(output));const rows=[],owned=new Set();let reply,failure=null;globalThis.__OCI_EXCHANGE=s=>{reply=JSON.parse(s)};
 const alloc=bytes=>{const p=_malloc(bytes.length);assert(p);HEAPU8.set(bytes,p);return p},string=s=>alloc(Buffer.from(s+'\0'));
 function call(method,...args){reply=null;Module[method](...args);assert(reply&&!reply.error,JSON.stringify(reply));return reply;}
 function snapshot(name){const p=string(name);try{return{metrics:call('_InspectOwnedSolidV2',p),catalog:call('_ReadOwnedTopologyV1',p)}}finally{_free(p)}}
 function make(name,request,loops){const f=request.frame,values=[request.depth,...f.origin,...f.x,...f.y,...f.z,loops.length,...loops.flat()],array=new Float64Array(values),p=alloc(Buffer.from(array.buffer)),n=string(name);try{const result=call('_CreateSelectedProfileV3',n,p,values.length);assert(result.valid&&result.solidCount===1);assert.deepEqual(Buffer.from(HEAPU8.subarray(p,p+array.byteLength)),Buffer.from(array.buffer));owned.add(name);return{values,result}}finally{_free(p);_free(n)}}
 const at=(f,x,y,z)=>f.origin.map((n,i)=>n+f.x[i]*x+f.y[i]*y+f.z[i]*z);
 try{
  assert.equal(Module._OwnedShapeNamesV2(),0);
  for(const [name,w,h,d,diameter,frame]of [
   ['plate100',100,50,20,10,{origin:[0,0,0],x:[1,0,0],y:[0,1,0],z:[0,0,1]}],
   ['plate150',150,30,25,14,{origin:[0,0,0],x:[1,0,0],y:[0,1,0],z:[0,0,1]}],
   ['rotated',100,50,20,10,{origin:[10,20,30],x:[0,1,0],y:[0,0,1],z:[1,0,0]}]
  ]){
   const a=name+'-a',b=name+'-b',c=name+'-cut',request={op:'solid.profile.extrude',version:3,unit:'millimeter',frame:{...frame,origin:at(frame,0,0,-1)},depth:d+2,region:{id:name+'-circle-tool',outer:[{kind:'circle',id:name+'-circle',center:[w/2,h/2],radius:diameter/2}],holes:[]}};
   make(a,{frame,depth:d},[[2,4,0,0,w,0,w,h,0,h]]);const tool=make(b,request,[[1,w/2,h/2,diameter/2]]),beforeA=snapshot(a),beforeB=snapshot(b),pa=string(a),pb=string(b),pc=string(c);let result;
   try{result=call('_ApplyOwnedBooleanHistoryV1',pa,pb,pc,1);assert(result.valid&&!result.empty&&result.solidCount===1);owned.add(c)}finally{_free(pa);_free(pb);_free(pc)}
   const afterA=snapshot(a),afterB=snapshot(b),current=snapshot(c);assert.deepEqual(afterA,beforeA);assert.deepEqual(afterB,beforeB);assert(Math.abs(result.nativeVolume-(w*h*d-Math.PI*(diameter/2)**2*d))<=1e-6);
   const points=[[at(frame,w/2,h/2,d/2),1],[at(frame,w/2+diameter/2+1,h/2,d/2),0],[at(frame,0,h/2,d/2),2]].map(([point,expected])=>{const p=string(c);try{const actual=Module._ClassifyOwnedPointV2(p,...point);assert.equal(actual,expected);return{point,expected,actual}}finally{_free(p)}});
   rows.push({name,truth:{w,h,d,diameter,frame,axisPoint:at(frame,w/2,h/2,0)},operation:'subtract',toolRequest:request,toolNativeValues:tool.values,toolConstruction:tool.result.constructionProvenance,sourceTopologies:[beforeA.catalog,beforeB.catalog],result,topology:current.catalog,sourceAPreserved:true,sourceBPreserved:true,points});
   for(const name of [c,b,a]){const p=string(name);try{assert.equal(Module._ReleaseOwnedShapeV2(p),1);owned.delete(name)}finally{_free(p)}}assert.equal(Module._OwnedShapeNamesV2(),0);
  }
 }catch(error){failure={name:error.name,message:error.message,stack:error.stack}}finally{
  for(const name of owned){const p=string(name);try{assert.equal(Module._ReleaseOwnedShapeV2(p),1)}catch(error){failure??={message:error.message}}finally{_free(p)}}
  const receipt={status:failure?'FAIL':'PASS',scope:'fresh actual native shapes and Cut ancestry; not production Worker/shared drawing',runtimePins,rows,finalOwnedNames:Module._OwnedShapeNamesV2(),failure};fs.writeFileSync(output,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify({status:receipt.status,cases:rows.length,finalOwnedNames:receipt.finalOwnedNames,failure}));if(failure||receipt.finalOwnedNames!==0)process.exitCode=1;
 }
}
