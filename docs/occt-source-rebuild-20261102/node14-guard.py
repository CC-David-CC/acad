import os,shutil,signal,subprocess,sys,time
root=sys.argv[1]
with open(os.path.join(root,'node14-orchestrator.log'),'w') as out:
 p=subprocess.Popen(['taskset','-c','0-3','bash',os.path.join(root,'node14-relink.sh'),root],stdout=out,stderr=subprocess.STDOUT,start_new_session=True)
 start=time.monotonic()
 while p.poll() is None:
  if shutil.disk_usage(root).free < 15*1024**3 or time.monotonic()-start > 900:
   with open(os.path.join(root,'node14-guard.txt'),'w') as f:f.write('stopped for disk or time limit\n')
   os.killpg(p.pid,signal.SIGTERM)
   try:p.wait(timeout=10)
   except subprocess.TimeoutExpired:os.killpg(p.pid,signal.SIGKILL)
   break
  time.sleep(5)
 code=p.wait()
with open(os.path.join(root,'node14.exit'),'w') as f:f.write(str(code)+'\n')
sys.exit(0 if code == 0 else 1)
