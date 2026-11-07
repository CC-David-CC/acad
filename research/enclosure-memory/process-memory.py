import json, os, sys
root=int(sys.argv[1]); process={}
for s in os.listdir('/proc'):
 if not s.isdigit(): continue
 try:
  stat=open('/proc/'+s+'/stat').read(); rest=stat[stat.rfind(')')+2:].split(); process[int(s)]=int(rest[1])
 except (OSError,ValueError,IndexError): pass
family={root}; previous=-1
while len(family)!=previous:
 previous=len(family);family.update(pid for pid,parent in process.items() if parent in family)
rows=[]
for pid in sorted(family):
 try:
  cmd=open('/proc/%d/cmdline'%pid,'rb').read().replace(b'\0',b' ').decode(errors='replace'); mem={}
  for line in open('/proc/%d/smaps_rollup'%pid):
   parts=line.split()
   if len(parts)>=2 and parts[0] in ('Rss:','Pss:','Private_Clean:','Private_Dirty:','Swap:'):mem[parts[0][:-1]]=int(parts[1])
  kind=next((x[7:] for x in cmd.split() if x.startswith('--type=')),'browser');rows.append({'pid':pid,'ppid':process.get(pid),'type':kind,'kib':mem})
 except (OSError,ValueError):rows.append({'pid':pid,'unavailable':True})
print(json.dumps({'rootPid':root,'processes':rows,'totalsKiB':{k:sum(row.get('kib',{}).get(k,0) for row in rows) for k in ('Rss','Pss','Private_Clean','Private_Dirty','Swap')}}))
