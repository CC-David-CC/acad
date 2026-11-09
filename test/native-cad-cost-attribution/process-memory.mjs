// Future whole-workflow observer only. No browser launch, process signals or
// product access. Sampled PSS is not a continuous physical-memory peak.
import fs from 'node:fs/promises';
import {performance} from 'node:perf_hooks';

const MAX_PROCESSES=256,MAX_SAMPLES=12000,MAX_ROWS=250000,MAX_THREADS_PER_PROCESS=512,MAX_THREADS_PER_SAMPLE=4096;
async function stat(pid){
 const text=await fs.readFile(`/proc/${pid}/stat`,'utf8'),end=text.lastIndexOf(')'),fields=text.slice(end+2).trim().split(/\s+/);
 return {pid,startTimeTicks:fields[19],parentPid:Number(fields[1])};
}
function portFlag(argv){return argv.find(v=>v.startsWith('--remote-debugging-port='))?.slice(24);}
export async function createProcessMemory({pid,profilePath,cdpURL,intervalMS,emit,phase}){
 if(process.platform!=='linux'||!Number.isSafeInteger(pid)||pid<=1||![250,500,1000].includes(intervalMS))throw Error('Explicit Linux Chrome PID and250/500/1000ms sampling required');
 const initial=await stat(pid),argv=(await fs.readFile(`/proc/${pid}/cmdline`,'utf8')).split('\0').filter(Boolean),actualProfile=argv.find(v=>v.startsWith('--user-data-dir='))?.slice(16);
 if(!/chrome|chromium/i.test(argv[0]||'')||actualProfile!==profilePath||portFlag(argv)!==(new URL(cdpURL).port||'80'))throw Error('Chrome PID/profile/CDP-port custody does not match explicit invocation');
 const metadata={pid,startTimeTicks:initial.startTimeTicks,profilePath,cdpURL,intervalMS,limits:{processes:MAX_PROCESSES,samples:MAX_SAMPLES,processRows:MAX_ROWS,threadsPerProcess:MAX_THREADS_PER_PROCESS,threadsPerSample:MAX_THREADS_PER_SAMPLE},scope:'Owned Chrome process tree only; enumerate children of every observed thread, not only leaders. Traversal is not an atomic process-tree snapshot; excludes Node/server/OS cache; no forced GC; sampled maxima are lower bounds on continuous maxima'};
 emit('process-custody',metadata);
 let busy=null,stopped=false,timer=null,samples=0,rows=0,overflow=false;
 async function collect(){
  if(stopped||busy)return busy;
  busy=(async()=>{
   const atMS=performance.now(),current=phase(),records=[],missing=[],queue=[{pid,parentPid:null}],seen=new Set();let threadCount=0;
   if(++samples>MAX_SAMPLES){overflow=true;emit('process-overflow',{atMS,phase:current,reason:'sample cap'});stopped=true;clearInterval(timer);return;}
   try{const root=await stat(pid);if(root.startTimeTicks!==initial.startTimeTicks)throw Error('Root PID was reused');}
   catch(error){emit('process-error',{atMS,phase:current,message:error.message});return;}
   for(let cursor=0;cursor<queue.length;cursor++){
    const entry=queue[cursor],item=entry.pid;if(seen.has(item))continue;seen.add(item);
    if(seen.size>MAX_PROCESSES){overflow=true;missing.push({reason:'process cap'});break;}
    try{
     const before=await stat(item);if(entry.parentPid!==null&&before.parentPid!==entry.parentPid)throw Error('Discovered child changed parent before observation');
     const tasks=(await fs.readdir(`/proc/${item}/task`)).sort();
     if(tasks.length>MAX_THREADS_PER_PROCESS||(threadCount+=tasks.length)>MAX_THREADS_PER_SAMPLE){overflow=true;throw Error('Thread inventory exceeds bound');}
     const children=new Set();
     for(const task of tasks){
      if(!/^[1-9][0-9]*$/.test(task))throw Error('Invalid observed thread ID');
      const text=await fs.readFile(`/proc/${item}/task/${task}/children`,'utf8');
      for(const child of text.trim()?text.trim().split(/\s+/).map(Number):[])children.add(child);
     }
     const afterTasks=(await fs.readdir(`/proc/${item}/task`)).sort();
     if(tasks.length!==afterTasks.length||tasks.some((task,i)=>task!==afterTasks[i]))missing.push({pid:item,reason:'Thread inventory changed during child discovery; transient descendants may be unavailable'});
     if([...children].some(child=>!Number.isSafeInteger(child)||child<=1)||children.size>MAX_PROCESSES){overflow=true;throw Error('Child inventory exceeds bound');}
     if(queue.length+children.size>MAX_PROCESSES*2){overflow=true;throw Error('Process traversal exceeds bound');}queue.push(...[...children].map(child=>({pid:child,parentPid:item})));
     const rollup=await fs.readFile(`/proc/${item}/smaps_rollup`,'utf8'),cmdline=(await fs.readFile(`/proc/${item}/cmdline`,'utf8')).split('\0');
     const after=await stat(item);if(after.startTimeTicks!==before.startTimeTicks)throw Error('Child PID reused while sampling');
     const values={};for(const name of ['Rss','Pss','Private_Clean','Private_Dirty','Private_Hugetlb']){const match=rollup.match(new RegExp('^'+name+':\\s+(\\d+) kB$','m'));values[name]=match?Number(match[1])*1024:null;}
     if(values.Rss===null||values.Pss===null||values.Private_Clean===null||values.Private_Dirty===null)throw Error('Required smaps counters unavailable');
     records.push({...before,type:item===pid?'browser':(cmdline.find(v=>v.startsWith('--type='))?.slice(7)||'unclassified'),rssBytes:values.Rss,pssBytes:values.Pss,privateBytes:values.Private_Clean+values.Private_Dirty+(values.Private_Hugetlb||0)});
    }catch(error){missing.push({pid:item,message:error.message});}
   }
   rows+=records.length;if(rows>MAX_ROWS){overflow=true;emit('process-overflow',{atMS,phase:current,reason:'process row cap'});stopped=true;clearInterval(timer);return;}
   emit('process-sample',{atMS,endedMS:performance.now(),phase:current,records,missing,discovered:seen.size,totals:records.length?{rssBytes:records.reduce((s,r)=>s+r.rssBytes,0),pssBytes:records.reduce((s,r)=>s+r.pssBytes,0),privateBytes:records.reduce((s,r)=>s+r.privateBytes,0)}:null,complete:missing.length===0&&!overflow});
  })().catch(error=>emit('process-error',{atMS:performance.now(),phase:phase(),message:error.message})).finally(()=>{busy=null;});return busy;
 }
 await collect();timer=setInterval(()=>{void collect();},intervalMS);
 return {metadata,sample:collect,async stop(){clearInterval(timer);if(busy)await busy;if(!stopped)await collect();stopped=true;return {samples,processRows:rows,overflow};}};
}
