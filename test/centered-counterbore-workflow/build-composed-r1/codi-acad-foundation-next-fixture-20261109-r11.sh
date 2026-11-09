#!/usr/bin/env bash
set -euo pipefail
acad_commit=${1:?exact core commit required}
desktop_commit=${2:?exact desktop commit required}
acad_root=/mnt/data10tb/codi-acad-build-20261107-r2
desktop_root=/mnt/data10tb/codi-acad-foundation-next-desktop-20261109-r11
stage_root=/mnt/data10tb/codi-acad-foundation-next-stage-20261109-r11
[[ "$(git -C "$acad_root" rev-parse HEAD)" == "$acad_commit" ]]
[[ -z "$(git -C "$acad_root" status --porcelain --untracked-files=no)" ]]
[[ ! -e "$desktop_root" && ! -e "$stage_root" && ! -e "$stage_root-apps" ]]
git --git-dir=/mnt/data10tb/git/CodiServer.git worktree add --detach "$desktop_root" "$desktop_commit"
ln -s /mnt/data10tb/codi-agent-bracket-desktop-20261105/active-system/tools/app-builder/node_modules "$desktop_root/active-system/tools/app-builder/node_modules"
export PATH=/mnt/data10tb/codi-3mf-qualification-SrUmue/node/bin:$PATH
python3 "$acad_root/test/native-cad-container/stage.py" --desktop-source "$desktop_root" --cad-dist "$acad_root/dist" --output "$stage_root"
node "$desktop_root/active-system/tools/app-builder/build.mjs" "$stage_root/builder-config.json"
python3 /mnt/data10tb/codi-circular-pin-fixture-20261108-r3.py --include-prefix static/manufacturing-mesh/ --include-prefix static/shell/ --include-prefix static/circular/ --include-prefix static/adaptive-metrology/ --apps "$stage_root-apps" --core-source "$acad_root" --desktop-source "$desktop_root" --previous-receipt "$acad_root/test/line-orientation-public-workflow/evidence-r11/receipt.json" --output /mnt/data10tb/codi-acad-foundation-next-pins-20261109-r11.json
