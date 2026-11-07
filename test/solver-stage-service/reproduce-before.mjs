import {writeFileSync} from 'node:fs';
import {fixture,twoStage} from './normal-command.mjs';
let dispatches=0;const f=fixture(twoStage(),async()=>{dispatches++;throw Error('Unexpected Worker dispatch');});
try{const inspected=f.inspect();let outcome;try{await f.analyze();outcome={ok:true};}catch(error){outcome={ok:false,code:error.code,message:error.message};}writeFileSync(new URL('before-service.json',import.meta.url),JSON.stringify({inspected,outcome,dispatches},null,2)+'\n');console.log(JSON.stringify({outcome,dispatches}));}finally{f.close();}
