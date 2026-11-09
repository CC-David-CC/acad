#!/usr/bin/env bash
set -euo pipefail
cd /mnt/data10tb/codi-acad-build-20261107-r2
[[ "$(git rev-parse HEAD)" == ad5bb96eb7ce0ff5d22b5b93b5b0266bd906f830 ]]
[[ -z "$(git status --porcelain --untracked-files=no)" ]]
export CODI_DESKTOP_SOURCE_ROOT=/mnt/data10tb/codi-acad-foundation-next-desktop-20261109-r13
export CODI_NATIVE_GIT=/mnt/data10tb/git/occt-interpreter-codi.git
export CODI_EVIDENCE=/mnt/data10tb/codi-acad-foundation-next-counterbore-20261109-r4
export CODI_SIGNED_PINS=/mnt/data10tb/codi-acad-foundation-next-pins-20261109-r13.json
export CODI_ENGINE_REVISION=sha256:32eec74e3019d9e2d767c9016f05aa3daa49441c6102423a269d67b9c7f02a08:abbf2aa02a6f2101c600aa1eedd20fa80ab2db206e677ca860d9c5103cdfbfcc
export CODI_ACCEPTANCE_SOURCE=ad5bb96eb7ce0ff5d22b5b93b5b0266bd906f830
export CODI_EXPECT_SOURCE=ad5bb96eb7ce0ff5d22b5b93b5b0266bd906f830
export CODI_EXPECT_DESKTOP=9ea4a1993ad8afa10ea9a24e9c9a4f7955e47420
export CODI_TEST_URL=http://127.0.0.1:21052/
export CODI_TEST_CDP=http://127.0.0.1:19551
export PUPPETEER_CORE_PATH=/mnt/data10tb/codi-acad-acceptance-deps-20261109/node_modules/puppeteer-core
/mnt/data10tb/codi-3mf-qualification-SrUmue/node/bin/node test/centered-counterbore-workflow/desktop-driver.mjs
