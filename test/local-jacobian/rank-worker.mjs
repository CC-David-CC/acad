import {rankLocalJacobian} from '../../web/app/sketcher/headless/localJacobian.mjs';
self.onmessage=e=>{const start=performance.now(),result=rankLocalJacobian(e.data.rows,e.data.variables,e.data.ordered);self.postMessage({result,elapsedMs:performance.now()-start})};
