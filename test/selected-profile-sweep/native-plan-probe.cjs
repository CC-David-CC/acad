// Appended by the existing pinned full production main runner.
function runTest(runtimePins){
 const fs=require('node:fs'),assert=require('node:assert/strict'),input=JSON.parse(fs.readFileSync(process.env.CODI_SWEEP_INPUTS)),rows=[];
 const count=()=>Module._OwnedShapeNamesV2();
 for(const row of input.rows){
  assert.equal(count(),0);const name=str2C(row.label),a=_malloc(row.profile.length*8),b=_malloc(row.path.length*8);
  try{
   assert(a&&b);HEAPF64.set(row.profile,a/8);HEAPF64.set(row.path,b/8);globalThis.__OCI_EXCHANGE_VAL=null;
   Module._CreateOwnedSweepV1(name,a,row.profile.length,b,row.path.length);const result=globalThis.__OCI_EXCHANGE_VAL;
   assert.equal(result?.error,undefined,row.label);assert.equal(result.valid,true);assert.equal(result.solidCount,1);
   assert(Math.abs(result.nativeVolume-row.expected.volumeMM3)<=row.expected.tolerance.volumeMM3,row.label+' volume');
   for(const k of ['min','max'])for(let i=0;i<3;i++)assert(Math.abs(result.nativeBounds[k][i]-row.expected.boundsMM[k][i])<=row.expected.tolerance.boundsMM,row.label+' bounds');
   const probes=row.expected.probes.map(p=>{const actual=Module._ClassifyOwnedPointV2(name,...p.point),expected={inside:0,outside:1,boundary:2}[p.classification];assert.equal(actual,expected,row.label+' '+p.id);return{...p,actual};});
   assert.deepEqual(Array.from(HEAPF64.subarray(a/8,a/8+row.profile.length)),row.profile);assert.deepEqual(Array.from(HEAPF64.subarray(b/8,b/8+row.path.length)),row.path);
   rows.push({label:row.label,result,probes,callerPayloadPreserved:true});
  }finally{Module._ReleaseOwnedShapeV2(name);_free(a);_free(b);_free(name);globalThis.__OCI_EXCHANGE_VAL=null;}
  assert.equal(count(),0);
 }
 fs.writeFileSync(process.env.CODI_SWEEP_OUTPUT,JSON.stringify({status:'PASS',scope:input.scope,runtimePins,rows,finalOwnedNames:count()},null,2)+'\n');console.log('PASS JS-planned native sweeps '+rows.length);
}
