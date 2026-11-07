// Optional admission diagnostic: actual freshly compiled native V3, not a
// public/Chrome qualification. run-probe.cjs pins JS/WASM before initialization.
function runTest(){
 const assert=require('node:assert/strict'),fs=require('node:fs'),rows=[];
 try{
  assert.equal(Module._OwnedShapeNamesV2(),0);
  for(const [name,length,height] of [['thin-12',1000000,1e-12],['thin-5',1000000,1e-5],['thin-3',1000000,1e-3],['ordinary',20,10]]){
   const values=[1,0,0,0,1,0,0,0,1,0,0,0,1,1,2,3,0,0,length,0,length/2,height],a=new Float64Array(values),p=_malloc(a.byteLength),n=str2C(name);
   let result;
   try{HEAPF64.set(a,p/8);globalThis.__OCI_EXCHANGE_VAL=null;Module._CreateSelectedProfileV3(n,p,a.length);assert.deepEqual(Array.from(HEAPF64.subarray(p/8,p/8+a.length)),values);result=globalThis.__OCI_EXCHANGE_VAL;}
   finally{_free(p);_free(n);globalThis.__OCI_EXCHANGE_VAL=null;}
   if(result?.valid){const k=str2C(name);try{assert.equal(Module._ReleaseOwnedShapeV2(k),1);}finally{_free(k);}}
   assert.equal(Module._OwnedShapeNamesV2(),0);rows.push({name,length,height,analyticVolume:length*height/2,result});
  }
  assert.equal(rows.at(-1).result.valid,true);assert.ok(Math.abs(rows.at(-1).result.nativeVolume-100)<1e-8);
  const out={status:'PASS',scope:'Native V3 thin-admission diagnostic only; no public or minimum-width qualification',rows,inputPreserved:true,finalOwnedNames:Module._OwnedShapeNamesV2()};
  if(process.env.CODI_NATIVE_RECEIPT)fs.writeFileSync(process.env.CODI_NATIVE_RECEIPT,JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify(out));
 }catch(e){console.error(e.stack);process.exitCode=1;}
}
