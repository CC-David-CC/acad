#!/usr/bin/env bash
# Root only, after the separate normal build; own code-only fixture/accounts.
set -euo pipefail
acad_commit=${1:?exact built Core commit}
desktop_commit=${2:?exact Host commit}
acad_root=${3:?actual omission build directory}
desktop_root=${4:?NEW own Host worktree}
stage_root=${5:?NEW own stage output}
pins_output=${6:?NEW absolute signed pins output}
[[ "$acad_commit" =~ ^[0-9a-f]{40}$ && "$desktop_commit" =~ ^[0-9a-f]{40}$ ]]
[[ "$acad_root" == /mnt/data10tb/* && "$desktop_root" == /mnt/data10tb/* && "$stage_root" == /mnt/data10tb/* && "$pins_output" == /mnt/data10tb/* ]]
[[ "$(git -C "$acad_root" rev-parse HEAD)" == "$acad_commit" ]]
[[ -z "$(git -C "$acad_root" status --porcelain --untracked-files=no)" ]]
[[ -f "$acad_root/box-omission-build-custody.json" && ! -e "$acad_root/.build/boolean-history-assets" ]]
[[ ! -e "$desktop_root" && ! -e "$stage_root" && ! -e "$stage_root-apps" && ! -e "$pins_output" ]]
git --git-dir=/mnt/data10tb/git/CodiServer.git worktree add --detach "$desktop_root" "$desktop_commit"
ln -s /mnt/data10tb/codi-agent-bracket-desktop-20261105/active-system/tools/app-builder/node_modules "$desktop_root/active-system/tools/app-builder/node_modules"
export PATH=/mnt/data10tb/codi-3mf-qualification-SrUmue/node/bin:$PATH
python3 "$acad_root/test/native-cad-container/stage.py" --desktop-source "$desktop_root" --cad-dist "$acad_root/dist" --output "$stage_root"
node "$desktop_root/active-system/tools/app-builder/build.mjs" "$stage_root/builder-config.json"
python3 "$acad_root/test/box-build-admission/pin_fixture.py" --include-prefix static/manufacturing-mesh/ --include-prefix static/shell/ --include-prefix static/circular/ --include-prefix static/adaptive-metrology/ --include-prefix static/mechanical-native/ --apps "$stage_root-apps" --core-source "$acad_root" --desktop-source "$desktop_root" --previous-receipt "$acad_root/test/line-orientation-public-workflow/evidence-r11/receipt.json" --output "$pins_output"
python3 "$acad_root/test/box-build-admission/fixture_custody.py" stage "$acad_root/box-omission-build-custody.json" "$stage_root" "$pins_output" "$stage_root/box-omission-stage-custody.json"
