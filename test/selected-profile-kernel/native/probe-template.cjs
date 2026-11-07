function runTest(){
 const assert=require('node:assert/strict'),fs=require('node:fs'),rows=[];
 const call=(method,name)=>{const p=str2C(name);try{globalThis.__OCI_EXCHANGE_VAL=null;Module[method](p);return globalThis.__OCI_EXCHANGE_VAL;}finally{_free(p);globalThis.__OCI_EXCHANGE_VAL=null;}};
 const frame=[0,0,0,1,0,0,0,1,0,0,0,1],rectangle=[0,0,0,10,0,10,10,0,10],circle=[1,0,0,10];
 const create=(name,loops,depth=5,f=frame)=>{const values=[depth,...f,loops.length,...loops.flat()],array=new Float64Array(values),p=_malloc(array.byteLength),n=str2C(name);try{HEAPF64.set(array,p/8);globalThis.__OCI_EXCHANGE_VAL=null;Module._CreateSelectedProfileV2(n,p,array.length);assert.deepEqual(Array.from(HEAPF64.subarray(p/8,p/8+array.length)),values);return globalThis.__OCI_EXCHANGE_VAL;}finally{_free(p);_free(n);globalThis.__OCI_EXCHANGE_VAL=null;}};
 const release=name=>{const p=str2C(name);try{return Module._ReleaseOwnedShapeV2(p)}finally{_free(p)}};
 const classify=(name,x,y,z)=>{const p=str2C(name);try{return Module._ClassifyOwnedPointV2(p,x,y,z)}finally{_free(p)}};
 try{
  assert.equal(Module._OwnedShapeNamesV2(),0);
  for(const[name,loops,volume]of[['rectangle',[rectangle],500],['circle',[circle],500*Math.PI],['annulus',[[1,0,0,20],circle],1500*Math.PI]]){
   const evidence=create(name,loops);assert.equal(evidence.valid,true);assert.equal(evidence.solidCount,1);assert.ok(Math.abs(evidence.nativeVolume-volume)<1e-6);rows.push({name,evidence});assert.equal(Module._OwnedShapeNamesV2(),rows.length);
  }
  const before=call('_InspectOwnedSolidV2','annulus');assert.equal(classify('annulus',0,0,2.5),1);assert.equal(classify('annulus',15,0,2.5),0);assert.equal(classify('annulus',25,0,2.5),1);
  const mesh=call('_ReadOwnedMeshV2','annulus');assert.ok(mesh.faces.length>0);assert.doesNotMatch(JSON.stringify(mesh),/"(?:ptr|ref|edgeRef)"/);assert.deepEqual(call('_InspectOwnedSolidV2','annulus'),before);
  assert.equal(create('annulus',[rectangle]).error,'PROFILE_CONSTRUCTION_FAILED');assert.deepEqual(call('_InspectOwnedSolidV2','annulus'),before);assert.equal(Module._OwnedShapeNamesV2(),3);
  assert.equal(create('outside-hole',[[1,0,0,10],[1,6,0,5]]).error,'PROFILE_CONSTRUCTION_FAILED');assert.equal(Module._OwnedShapeNamesV2(),3);
  assert.equal(create('invalid',[[1,0,0,-1]]).error,'PROFILE_CONSTRUCTION_FAILED');assert.equal(Module._OwnedShapeNamesV2(),3);
  for(const row of rows){assert.equal(release(row.name),1);assert.equal(release(row.name),0);}assert.equal(Module._OwnedShapeNamesV2(),0);
  for(let i=0;i<32;i++){assert.equal(create('repeated',[rectangle]).valid,true);assert.equal(Module._OwnedShapeNamesV2(),1);assert.equal(release('repeated'),1);assert.equal(Module._OwnedShapeNamesV2(),0);}
  const result={result:'PASS',scope:'Actual C++ compiled to WASM; native CPU execution not claimed.',rows,annulusClassification:{void:1,material:0,exterior:1},duplicateAndInvalidPreserved:true,repeatedCreateRelease:32,finalNativeNames:Module._OwnedShapeNamesV2()};
  if(process.env.CODI_NATIVE_RECEIPT)fs.writeFileSync(process.env.CODI_NATIVE_RECEIPT,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
 }catch(error){console.error(error.stack);process.exitCode=1;}
}
