// Read-only Git custody at startup of the ONE future whole workflow.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const roster=JSON.parse(fs.readFileSync(new URL('./producer-roster.json',import.meta.url)));
export function captureProducerRoster({core,desktop,pins,nativeGit,acceptanceSource}) {
 assert.equal(roster.version,1);assert.match(acceptanceSource,/^[a-f0-9]{40}$/);
 const rows=[],files=[],worktreePaths=[],seen=new Set();
 function capture(repository,root,commit,names,{bare=false,compare=false,role}={}) {
  assert.match(commit,/^[a-f0-9]{40}$/);const args=bare?['--git-dir='+root]:['-C',root];
  for(const relative of names){
   assert.equal(typeof relative,'string');assert(relative&&!path.isAbsolute(relative)&&!relative.split('/').includes('..'));
   const identity=repository+'@'+commit+':'+relative;assert(!seen.has(identity));seen.add(identity);
   const raw=execFileSync('git',[...args,'show',commit+':'+relative],{maxBuffer:16*1024*1024});
   const gitBlob=execFileSync('git',[...args,'rev-parse',commit+':'+relative],{encoding:'utf8'}).trim();assert.match(gitBlob,/^[a-f0-9]{40}$/);
   let worktreePath=null;
   if(compare){worktreePath=path.join(root,relative);assert.deepEqual(fs.readFileSync(worktreePath),raw,'Executed source differs from frozen Git '+identity);worktreePaths.push(worktreePath);}
   rows.push({repository,root,commit,path:relative,bare,role,gitBlob,bytes:raw.length,sha256:sha(raw),worktreePath,originalFile:identity});files.push({originalFile:identity,raw});
  }
 }
 capture('ACAD',core,acceptanceSource,roster.acceptance,{role:'acceptance',compare:true});
 capture('ACAD',core,pins.source,roster.core,{role:'product-anchor',compare:true});
 capture('Desktop',desktop,pins.desktop,roster.desktop,{role:'product-and-helper',compare:true});
 capture('Native',nativeGit,roster.nativeSource,roster.native,{bare:true,role:'native-source'});
 capture('Native',nativeGit,roster.nativeQualification,roster.nativeProof,{bare:true,role:'native-proof'});
 const nativeProof=JSON.parse(files.at(-1).raw);assert.equal(nativeProof.sourceCapture,roster.nativeSource);assert.equal(nativeProof.compiledInputsIdenticalToCommit,true);assert.equal(nativeProof.sourceBeforeAfterIdentical,true);assert.equal(nativeProof.wasmSha256,'abbf2aa02a6f2101c600aa1eedd20fa80ab2db206e677ca860d9c5103cdfbfcc');
 capture('ACAD',core,pins.source,roster.componentProof,{role:'component-proof'});
 return {metadata:{version:1,scope:'exact-transitive-acceptance-Git-custody-with-product-anchors',acceptanceSource,core:pins.source,desktop:pins.desktop,nativeSource:roster.nativeSource,nativeQualification:roster.nativeQualification,rows},files,worktreePaths:[...new Set(worktreePaths)]};
}
