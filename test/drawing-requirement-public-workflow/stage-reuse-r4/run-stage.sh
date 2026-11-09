#!/usr/bin/env bash
set -euo pipefail
# Reuse actual qualified BUILD custody, not a relabeled source/output tree.
# This is staging only; no workflow qualification or execution implied.
desktop_commit=${1:?exact new Host example commit required}
[[ "$desktop_commit" =~ ^[0-9a-f]{40}$ ]]
acad_commit=82866bf0ee852f1d3b3892972f07d8af4cd8b9b0
acad_root=/mnt/data10tb/codi-acad-drawing-requirements-build-20261109-r3
desktop_root=/mnt/data10tb/codi-acad-drawing-requirements-desktop-20261109-r4
stage_root=/mnt/data10tb/codi-acad-drawing-requirements-stage-20261109-r4
pins=/mnt/data10tb/codi-acad-drawing-requirements-pins-20261109-r4.json
[[ "$(git -C "$acad_root" rev-parse HEAD)" == "$acad_commit" ]]
[[ -z "$(git -C "$acad_root" status --porcelain --untracked-files=no)" ]]
[[ ! -e "$desktop_root" && ! -e "$stage_root" && ! -e "$stage_root-apps" && ! -e "$pins" ]]
git --git-dir=/mnt/data10tb/git/CodiServer.git worktree add --detach "$desktop_root" "$desktop_commit"
# Only the published example may change among actual Host runtime/build files.
python3 - "$desktop_root" "$desktop_commit" <<'CHECK'
import subprocess,sys
root,commit=sys.argv[1:]
names=subprocess.check_output(['git','-C',root,'diff','--name-only','6b2a1fbe806175bddafa6c0e0f54c486487d1749',commit,'--','apps','active-system'],text=True).splitlines()
assert names==['apps/system/jsketcher/examples/linked-drawing-requirements.mjs'],names
CHECK
ln -s /mnt/data10tb/codi-agent-bracket-desktop-20261105/active-system/tools/app-builder/node_modules "$desktop_root/active-system/tools/app-builder/node_modules"
export PATH=/mnt/data10tb/codi-3mf-qualification-SrUmue/node/bin:$PATH
python3 "$acad_root/test/native-cad-container/stage.py" --desktop-source "$desktop_root" --cad-dist "$acad_root/dist" --output "$stage_root"
node "$desktop_root/active-system/tools/app-builder/build.mjs" "$stage_root/builder-config.json"
python3 /mnt/data10tb/codi-circular-pin-fixture-20261108-r3.py --include-prefix static/manufacturing-mesh/ --include-prefix static/shell/ --include-prefix static/circular/ --include-prefix static/adaptive-metrology/ --include-prefix static/mechanical-native/ --apps "$stage_root-apps" --core-source "$acad_root" --desktop-source "$desktop_root" --previous-receipt "$acad_root/test/line-orientation-public-workflow/evidence-r11/receipt.json" --output "$pins"
python3 - "$pins" <<'CHECK'
import json,sys
from pathlib import Path
new=json.loads(Path(sys.argv[1]).read_text());old=json.loads(Path('/mnt/data10tb/codi-acad-drawing-requirements-pins-20261109-r3.json').read_text())
assert new['source']==old['source']=='82866bf0ee852f1d3b3892972f07d8af4cd8b9b0'
assert new['files']==old['files'],'Reused Core frame/Native assets changed; preserve stage and investigate'
print(json.dumps({'scope':'exact reused Core frame/native asset equality only','core':new['source'],'desktop':new['desktop'],'pins':len(new['files']),'allCorePinsUnchanged':True}))
CHECK
[[ -z "$(git -C "$acad_root" status --porcelain --untracked-files=no)" ]]
