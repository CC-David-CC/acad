import a from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
export const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
export function freezeSources(acceptanceRoot,coreRoot,desktopRoot,acceptanceSource,source,hostSource,out){
 const roots={acceptance:fs.realpathSync(acceptanceRoot),core:fs.realpathSync(coreRoot),desktop:fs.realpathSync(desktopRoot)},commits={acceptance:acceptanceSource,core:source,desktop:hostSource};
 a.equal(fs.realpathSync(process.cwd()),roots.acceptance,'Run from the actual separate acceptance checkout');
 a.equal(new Set(Object.values(roots)).size,3,'Compiled Core, Host and acceptance checkouts must be separate');
 const git=(root,args,encoding='utf8')=>{const r=spawnSync('git',['-C',root,...args],{encoding,maxBuffer:8388608});a.equal(r.status,0,'Git custody '+args.join(' '));return r.stdout;};
 const checkouts=()=>Object.fromEntries(Object.entries(roots).map(([role,root])=>{
  a.match(commits[role],/^[a-f0-9]{40}$/);a.equal(fs.realpathSync(root),root);
  const top=fs.realpathSync(git(root,['rev-parse','--show-toplevel']).trim()),head=git(root,['rev-parse','HEAD']).trim(),status=git(root,['status','--porcelain=v1','--untracked-files=all']);
  a.equal(top,root,'Actual checkout root '+role);a.equal(head,commits[role],'Actual checkout HEAD '+role);a.equal(status,'','Clean tracked and untracked source '+role);
  return[role,{root,head,expectedCommit:commits[role],status}];
 }));
 const checkoutsBefore=checkouts(),roster=JSON.parse(fs.readFileSync(path.join(roots.acceptance,'test/arc-length-public-workflow/producer-roster.json'))),inputs=Object.entries(roster).flatMap(([role,names])=>{
  a(Object.hasOwn(roots,role),'Known source role');return names.map(n=>({role,relative:role==='acceptance'?'test/arc-length-public-workflow/'+n:n,root:roots[role],commit:commits[role]}));
 });
 a.equal(new Set(inputs.map(r=>r.role+':'+r.relative)).size,inputs.length);
 const rows=inputs.map(r=>{
  const file=path.join(r.root,r.relative),raw=fs.readFileSync(file),blob=git(r.root,['show',r.commit+':'+r.relative],null),oid=git(r.root,['rev-parse',r.commit+':'+r.relative]).trim();
  a.deepEqual(raw,blob,'Frozen Git source '+r.relative);return{...r,file,raw,gitBlobOID:oid};
 });
 fs.mkdirSync(path.join(out,'source'));
 const snapshots=rows.map(({raw,file,...r})=>{const sha256=sha(raw),snapshot='source/'+r.role+'-'+sha256+'-'+path.basename(r.relative);fs.writeFileSync(path.join(out,snapshot),raw,{flag:'wx'});return{...r,originalFile:file,snapshot,sha256};});
 const hashes=()=>Object.fromEntries(rows.map(r=>[r.role+':'+r.relative,sha(fs.readFileSync(r.file))]));
 a.deepEqual(checkouts(),checkoutsBefore,'Actual checkouts remain current through custody capture');
 return{snapshots,hashes,pins:hashes(),checkoutsBefore,checkouts};
}
