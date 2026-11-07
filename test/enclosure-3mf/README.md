# OCC enclosure 3MF qualification

On d7504677 with the narrowly applied autosave fix `6ff03e0f` (test branch parent `211e111c`), actual strict-CSP Chromium/OCC exported the authored 100×70×30 mm body and lid with PLA/red and PETG/blue. It then changed width to 120 mm, verified stale assignments refused export, explicitly rebound and exported again. Each output has two print build objects, two distinct base materials and 56 triangles. `check-3mf.py` independently opens the ZIP, parses the XML and checks indices, closed edge incidence, role bounds and signed volumes for both dimensions. This tests a bounded V1 enclosure, not label lettering, grouped regions, a third material, physical printing or general manufacturing correctness.

The same browser run holds native reconstruction and observes caller abort terminate the disposable worker without changing accepted models; caller validity change and a programmatic in-flight history rewind both reject output. The first unmodified d750 run failed immediately after an edit because a queued project autosave wrote identical state and changed the storage generation during reconstruction; delaying 2.2 seconds allowed export. `6ff03e0f` consumes that pending autosave at explicit capture, and the passing run used no artificial delay. One early cancellation control started before native dispatch due to the same autosave race; it is not evidence of native cancellation.

R730 test build `/mnt/data10tb/codi-enclosure-3mf-qualification/dist`: app SHA-256 `4befa8d449212b64476d556f387c5c55ae5029186b4e7c45e8b8995f532f9e24`, OCI worker `627e1823392a792238fadec78919a9ee3db357392a0180664d7cd7265bb3bb8e`, manufacturing module `760862b0d3c847bc5b093a0be8d42975eb38f17ec956b9052bb2c68a31df77ec`. Node 24 and the shared pinned R730 dependencies were used with `resolve.symlinks=false`, `CODI_EMBED_NUMERIC=1` and `CODI_EMBED_MANIFOLD=1`. Serve with `test/engine-hole-projection/serve-app-fixture.py`; run the browser test with loopback `JSKETCHER_TEST_URL`/`CODI_TEST_CDP`, then `python3 -B test/enclosure-3mf/check-3mf.py /tmp/codi-enclosure-initial.3mf /tmp/codi-enclosure-edited.3mf`. Generated 3MF bytes vary across ZIP runs; validate contents instead of assuming a reproducible archive hash.

The independent oracle also accepts `--ui` for the actual UI's default appearance colors (`#D24B4B` and `#4B78D2`). The first signed-output check used the earlier red/blue fixture expectations and correctly rejected the different appearance values; the corrected mode verifies the actual UI-selected values without relaxing geometry, volume, object or material assertions. Signed desktop evidence is in `tests/jsketcher-enclosure-3mf-signed-20261104.md` in the desktop repository.
# Integration review and stronger oracle

Root integrated the V1 test sequence through `27264b6c` and independently
checked both signed output files against the published hashes. The ZIP/XML
oracle now traverses the full component chain, detects cycles, requires the
two build objects to reach the two distinct intended meshes, and checks every
component/build placement is identity for these specific fixtures. Both real
signed outputs pass. Three mutations (duplicated mesh reference, translation,
component cycle) are rejected by `check-negative.py`.

The first strengthened run assumed only one component-wrapper level and failed;
inspection showed the writer correctly has region and printable-object wrappers.
The verifier now traverses the actual graph rather than weakening the check.
These fixtures use identity placements; this is not a general transformed-model
oracle. Reproduce with the commands below plus:
`python3 -B test/enclosure-3mf/check-negative.py INITIAL.3mf --ui`.

Signed files are backed up at
`r730:/mnt/data10tb/codi-files-cad-evidence-20261104/enclosure-v1-signed/`.
Root reviewed the surfacing mutation fence and integrated its source/receipt
through `3b38261b`; the existing agent browser evidence remains scoped to gizmo
change callbacks. Additional pointer Push/Pull/cancel controls remain pending.

