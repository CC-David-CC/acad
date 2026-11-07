#!/usr/bin/env python3
import os, shutil, signal, subprocess, sys, time
root=sys.argv[1]
limit=15*1024**3
with open(os.path.join(root,'orchestrator.log'),'w') as out:
    proc=subprocess.Popen(['taskset','-c','0-3','bash',os.path.join(root,'build.sh'),root],stdout=out,stderr=subprocess.STDOUT,start_new_session=True)
    started=time.monotonic()
    while proc.poll() is None:
        free=shutil.disk_usage(root).free
        if free < limit or time.monotonic()-started > 3000:
            with open(os.path.join(root,'guard.txt'),'w') as f: f.write(f'stopped free_bytes={free} elapsed={time.monotonic()-started:.1f}\n')
            os.killpg(proc.pid,signal.SIGTERM)
            try: proc.wait(timeout=10)
            except subprocess.TimeoutExpired: os.killpg(proc.pid,signal.SIGKILL)
            break
        time.sleep(5)
    code=proc.wait()
with open(os.path.join(root,'exit.txt'),'w') as f: f.write(str(code)+'\n')
sys.exit(0 if code == 0 else 1)
