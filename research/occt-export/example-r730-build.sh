#!/bin/bash
set -u
base=/tmp/codi-occt-release-20261102.3DKcW3s3
job=/tmp/codi-occ-export-uBcWfm
source "$base/emsdk/emsdk_env.sh" >/dev/null 2>&1
python3 - "$base" "$job" <<'PY'
import pathlib,sys
base,job=sys.argv[1:]
s=pathlib.Path(base+'/link-adapted.sh').read_text().replace(base+'/source/shape-io/',job+'/shape-io/')
pathlib.Path(job+'/link.sh').write_text(s)
PY
cd "$job" || exit 1
setsid taskset -c 0-3 timeout 900 bash link.sh > build.log 2>&1 &
pid=$!
while kill -0 "$pid" 2>/dev/null; do
 free=$(df -Pk "$job" | awk 'NR==2{print $4}')
 if ! [[ "$free" =~ ^[0-9]+$ ]] || (( free < 15*1024*1024 )); then
   printf 'disk guard %s KiB\n' "$free" >> guard.log
   kill -TERM -- "-$pid" 2>/dev/null || true
   break
 fi
 sleep 5
done
wait "$pid"; result=$?
printf 'exit %s\n' "$result"
if [ "$result" -eq 0 ]; then sha256sum main.js main.wasm; else tail -40 build.log; fi
exit "$result"
