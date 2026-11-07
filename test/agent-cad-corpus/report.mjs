// Read-only inventory: never runs CAD, changes verdicts or grants release status.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const directory=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(directory,'../..');
const index=JSON.parse(fs.readFileSync(path.join(directory,'index.json'),'utf8'));
const statuses=['pass','fail','unsupported','not-tested'],keys=new Set(),rows=[];
if(index.version!==1||!Array.isArray(index.fragments)||!index.fragments.length)throw Error('Invalid corpus index.');
for(const file of index.fragments){
 const location=path.resolve(directory,file);
 if(!location.startsWith(directory+path.sep))throw Error('Fragment outside corpus.');
 const fragment=JSON.parse(fs.readFileSync(location,'utf8'));
 if(fragment.version!==1||!/^[a-f0-9]{40}$/.test(fragment.source?.commit)||!/^[a-f0-9]{64}$/.test(fragment.source?.appSha256)||!Array.isArray(fragment.cases))throw Error('Missing source/runtime pins: '+file);
 for(const row of fragment.cases){
  if(!['id','subsystem','priority','level','layer','backend','scope'].every(k=>typeof row[k]==='string'&&row[k])||!['shared','occ','manifold','smlib'].includes(row.backend)||!statuses.includes(row.status)||!Object.hasOwn(row,'expected')||!Object.hasOwn(row,'actual')||!Array.isArray(row.evidence)||(row.status!=='not-tested'&&!row.evidence.length))throw Error('Invalid evidence row: '+row.id);
  const key=[row.level,row.subsystem,row.id,row.backend,row.layer].join('/');
  if(keys.has(key))throw Error('Duplicate case: '+key);keys.add(key);
  for(const evidence of row.evidence){
   const referenced=typeof evidence==='string'?path.resolve(root,evidence):typeof evidence?.file==='string'?path.resolve(path.dirname(location),evidence.file):null;
   if(!referenced||!referenced.startsWith(root+path.sep)||!fs.statSync(referenced).isFile())throw Error('Missing evidence: '+key);
  }
  rows.push({...row,source:fragment.source,fragment:file});
 }
}
const counts=Object.fromEntries(statuses.map(status=>[status,rows.filter(row=>row.status===status).length]));
console.log(JSON.stringify({version:1,scope:index.scope,caseCount:rows.length,counts,failures:rows.filter(row=>row.status==='fail'),open:rows.filter(row=>['unsupported','not-tested'].includes(row.status)).map(({id,backend,status,scope,fragment})=>({id,backend,status,scope,fragment}))},null,2));
