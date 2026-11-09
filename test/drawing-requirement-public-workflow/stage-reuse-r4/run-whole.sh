#!/usr/bin/env bash
set -euo pipefail
cd /mnt/data10tb/codi-acad-drawing-requirements-acceptance-20261109-r5
export CODI_DESKTOP_SOURCE_ROOT=/mnt/data10tb/codi-acad-drawing-requirements-desktop-20261109-r4
export CODI_SIGNED_PINS=/mnt/data10tb/codi-acad-drawing-requirements-pins-20261109-r4.json
export CODI_EXPECT_SOURCE=82866bf0ee852f1d3b3892972f07d8af4cd8b9b0
export CODI_EXPECT_DESKTOP=796c9051331054746d81ea4ea0bb8ec8e8cf2bbd
export CODI_ACCEPTANCE_SOURCE=615716f87f74efc34ed6cd41660db07aa377f4a1
export CODI_EXAMPLE_SOURCE=796c9051331054746d81ea4ea0bb8ec8e8cf2bbd
export CODI_ENGINE_REVISION=sha256:57b74074e0a249b917ac68357fbd003c37d1ab61897206886b575088e6995858:60dc956b08e01f43d08a48035a384e478e63bb34fb55f21a152c8cd12e8b8947
export CODI_TEST_URL=http://127.0.0.1:21057/
export CODI_TEST_CDP=http://127.0.0.1:19551
export CODI_EVIDENCE=/mnt/data10tb/codi-acad-drawing-requirements-20261109-r5/whole
export PUPPETEER_CORE_PATH=/mnt/data10tb/codi-acad-acceptance-deps-20261109/node_modules/puppeteer-core
export PYTHON=python3
exec /mnt/data10tb/codi-3mf-qualification-SrUmue/node/bin/node test/drawing-requirement-public-workflow/desktop-driver.mjs
