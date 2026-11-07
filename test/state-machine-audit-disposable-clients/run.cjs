const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),output=path.resolve(process.argv[2]),sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const sources=['web/app/cad/parameters/physicalWorkerClient.mjs','modules/engine/extrusion/prismSemanticClient.ts','web/app/sketcher/headless/client.ts'];
const receipt={scope:'Production client code bundled unchanged; explicit WebLock/Worker transport and cleanup doubles; no mathematical output claim',sources:Object.fromEntries(sources.map(p=>[p,sha(path.join(root,p))])),bundleSHA256:sha(path.join(root,'.build/disposable-client-audit/clients.cjs')),probeSHA256:sha(path.join(__dirname,'probe.cjs')),rows:[]};
for(const family of ['physical','semantic','sketch']){
 const cases=[...['success','operation-error','message-error','malformed','abort','timeout','late'].map(x=>[x,'none']),...['error','null','undefined','zero','false','empty'].map(x=>['success',x]),...['operation-error','abort','timeout'].map(x=>[x,'error'])];
 for(const [scenario,fault]of cases){const r=spawnSync(process.execPath,[path.join(__dirname,'probe.cjs'),family,scenario,fault],{cwd:root,encoding:'utf8',timeout:10000});if(r.status!==0)throw Error(family+'/'+scenario+'/'+fault+': '+r.stderr);receipt.rows.push(JSON.parse(r.stdout));}
}
fs.writeFileSync(output,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify({rows:receipt.rows.length,unsettled:receipt.rows.filter(x=>!x.settled).length,uncaught:receipt.rows.reduce((n,x)=>n+x.uncaught.length,0),retainedIntervals:receipt.rows.filter(x=>x.intervals).length}));
