# ACAD host integration source

This directory preserves the old Desktop-Preview `apps/system/jsketcher/` host mount, adapters, examples, styles, manifest and notices at source commit4f72ea86928666189b32f6f05c2c697a37341d06. Its133 current files retain their original blobs/modes; filtered history and source-to-result commit map were preserved before this structural merge.

ACAD's own README identifies it as a separate project derived partly from JSketcher and identifies this desktop mount as its external host integration. The new assembly owns both within the ACAD repository: core/native UI source remains unchanged, and WebOS-specific source lives here. Original JSketcher remains a separate repository at apps/jsketcher in the assembly. Similar historical names do not combine those projects.

This is a source ownership change, not a geometry feature, new runtime contract or qualified build. The old manifest still references jsketcher-build artifacts. Package/build asset wiring, Accounts/Storage, synchronous mount/readiness, public operations and browser/geometry qualification need deliberate review before enabling this entrypoint. Existing qualification reports remain attributed to their frozen original builds. No production deployment or native-kernel promotion occurred.
