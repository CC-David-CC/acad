// Test-only instrumentation of the pinned, statically embedded Worker.
const fs=require('node:fs'),crypto=require('node:crypto');
const [input,output]=process.argv.slice(2); const source=fs.readFileSync(input,'utf8');
if(crypto.createHash('sha256').update(source).digest('hex')!=='b0713d865ec90f3778f65118098138a86fc6dba707070374f9eb166d5e03a3ca')throw Error('unexpected embedded worker');
const marker="    if (msg?.kind==='dispose') {";
if(source.split(marker).length!==2)throw Error('worker shape mismatch');
const addition=`
    if (msg?.kind==='research-enclosure-admit') {
      let ptr;
      try {
        if (!Number.isFinite(msg.expected) || msg.expected<=0) throw Error('invalid expected volume');
        ptr=str2C(nameFor(msg.token));globalThis.__OCI_EXCHANGE_VAL=null;
        Module._InspectAnalyticV1(ptr); const r=globalThis.__OCI_EXCHANGE_VAL;
        if (!r || r.version!==1 || r.scope!=='response-local' || r.valid!==true || r.solidCount!==1 || !Number.isFinite(r.signedVolume) || !Array.isArray(r.faces) || r.faces.length<1 || r.faces.length>64 || Math.abs(r.signedVolume-msg.expected)>Math.max(1e-6,msg.expected*1e-9)) throw Error('kernel admission failed');
        self.postMessage({kind:'admitted',seq:msg.seq,valid:true,solidCount:1,volume:r.signedVolume});
      } catch(e) { self.postMessage({kind:'refused',seq:msg.seq,code:'ENCLOSURE_ADMISSION_FAILED'}); self.close(); }
      finally {if(ptr)_free(ptr);globalThis.__OCI_EXCHANGE_VAL=null;}
      return;
    }
`;
const atomic=fs.readFileSync(require('node:path').join(__dirname,'atomic-worker-branch.txt'),'utf8');
fs.writeFileSync(output,source.replace(marker,atomic+addition+marker),{flag:'wx'});console.log(crypto.createHash('sha256').update(fs.readFileSync(output)).digest('hex'));
