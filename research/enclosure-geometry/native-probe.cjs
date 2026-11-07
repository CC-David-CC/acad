function runTest(){
 const assert=require('node:assert/strict'); Module._InitCommands();
 const cmd=(name,args)=>CallCommand(name,[name,...args.map(String)]);
 const box=(n,o,d)=>cmd('box',[n,'-min',...o,'-size',...d,'-dir',0,0,1,'-xdir',1,0,0]);
 const inspect=n=>{globalThis.__OCI_EXCHANGE_VAL=null;Module._InspectAnalyticV1(str2C(n));return globalThis.__OCI_EXCHANGE_VAL;};
 const calc=(a,b,n,op)=>{cmd('bop',[a,b]);return cmd(op,[n]);};
 box('outer',[0,0,0],[100,70,30]);box('cavity',[3,3,3],[94,64,30]);calc('outer','cavity','body','bopcut');
 box('cover',[0,0,30],[100,70,3]);box('lip',[3.3,3.3,28],[93.4,63.4,2.02]);calc('cover','lip','lid','bopfuse');
 let body=inspect('body'),lid=inspect('lid');assert.equal(body.valid,true);assert.equal(body.solidCount,1);assert.ok(Math.abs(body.signedVolume-47568)<1e-6);assert.equal(lid.valid,true);assert.equal(lid.solidCount,1);assert.ok(Math.abs(lid.signedVolume-32843.12)<1e-6);
 box('far',[200,0,0],[1,1,1]);calc('outer','far','unchanged','bopcut');let noop=inspect('unchanged');assert.equal(noop.valid,true);assert.equal(noop.solidCount,1);assert.ok(Math.abs(noop.signedVolume-210000)<1e-6);
 calc('outer','outer','empty','bopcut');let empty=inspect('empty');console.log(JSON.stringify({body:{valid:body.valid,count:body.solidCount,volume:body.signedVolume},lid:{valid:lid.valid,count:lid.solidCount,volume:lid.signedVolume},noop:{valid:noop.valid,count:noop.solidCount,volume:noop.signedVolume},empty}));
}
