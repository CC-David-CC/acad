// Exact new request against a separately built clean f107 production Worker.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {solve,point,constraint,sketch} from './reproduce.mjs';
const worker=process.env.SOLVER_REPORT_WORKER;assert(worker,'Select the frozen BEFORE Worker explicitly');
const workerSHA256=createHash('sha256').update(readFileSync(worker)).digest('hex');assert.equal(workerSHA256,'903bba99c3527f1019539877507156e2151d4644575cc1a45fecafd774e72d34');
const source=sketch([point('p',1,2),point('q',5,2,1)],[[constraint('LockPoint',['p'],{x:'1',y:'2'})],[constraint('SignedDistanceX',['p','q'],{distance:'4'},1)]]),options={localJacobian:{version:1,scope:'per-stage'}};
const response=await solve(source,options);assert.equal(response.ok,false);assert.equal(response.error.code,'INVALID');
writeFileSync(new URL('before-opt-in.json',import.meta.url),JSON.stringify({workerSHA256,source,options,response},null,2)+'\n');console.log('Actual clean before Worker refuses the exact new opt-in request; response retained.');
