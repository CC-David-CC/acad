import {fixture,twoStage} from './normal-command.mjs';
import {transport} from './transport.mjs';
const t=transport(),f=fixture(twoStage(),t.run);try{const r=await f.analyze();console.log(JSON.stringify({status:r.status,admission:r.admission,report:r.localJacobian,workers:t.counts}));}finally{f.close();}
