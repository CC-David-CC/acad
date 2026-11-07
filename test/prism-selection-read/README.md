# Frozen R4 prism-selection read: independent Chromium component proof

Actual first run **PASS**. Product read/index checkpoint1ee76d350; source inputs
are the immutable R4 component manifest. Native JS5414a24c… and WASM534ffdd2…
remain the prior qualified V3 native provider. New Worker SHA489e142ece37d6f16596d5083a38f72a028fc918938ba04c1802618cc97f3f8f,
bootstrapfe9172aa604998e048354fb54d6103bb33cb0b2a863c1935702024a4db9ff4bc,
index8382092e2e1c0df343a6e4b0ebbe1ae3c0f09baa9895684648b4aca2db1ce44c.
All20 manifest/closure assets were verified before browser startup.

This is actual Chromium155.0.8059.79 with genuine classic Workers and the
compiled native provider. It is **component evidence**, not public authored
CAD, the application ledger, saved project compatibility or E11 qualification.
No Files, account, filesystem-race/security test, private CAD writer, fake
canvas/UI or successful-output substitution was used.

The driver reuses the existing eight explicit component fixtures and their
independent native volume/bounds, mesh, void/material/boundary and complete
construction-ancestry assertions. It adds the new selection-read observations,
one same-authored-ID reversed-winding companion, box/Boolean unavailable checks,
foreign/stale selection-read refusal and genuine held selection-read cancellation.
The older R1/R2 receipts remain exact earlier evidence; none is retagged.

Observed selection plans:

| Fixture | Semantic edges | Semantic faces | Un-authored native seams |
|---|---:|---:|---:|
| Triangle | 9 | 5 | 0 |
| Reversed triangle (different fixture IDs) | 9 | 5 | 0 |
| Rotated rectangle | 12 | 6 | 0 |
| Concave L | 18 | 8 | 0 |
| Mixed holes | 29 | 12 | 1 |
| Mixed holes, permuted frame | 29 | 12 | 1 |
| Annulus | 4 | 4 | 2 |
| True45° angled triangle | 9 | 5 | 0 |
| Same triangle IDs, reversed source traversal | 9 | 5 | 0 |

The final companion preserves its feature/region/curve identities. Actual
curve e0 changes first-edge local index3→8 and swept-face index1→3, while the
**complete semantic selection key set stays identical**. Native ordinals are
used here only as detached research observations proving the reassignment;
they never appear in the new selection plan or authored model. `check.mjs`
asserts the actual mapping changed, without prescribing stable native indices.

Repeated selection reads preserve exact topology and caller source. All32
native inside/outside/boundary observations and independent geometry/ancestry
checks pass. The box and a valid two-solid disjoint union report
`{status:'unavailable',reason:'NOT_A_PRISM_RESULT'}`; input geometry is preserved.
Foreign and disposed handles refuse INVALID_HANDLE. A real successful new-read
reply was held until cancellation, then delivered unchanged: caller CANCELLED,
later operation MOUNT_CLOSED. No fake positive result was injected.

All14 owned Workers terminated; zero owned Worker targets remain and CSP
violations are empty. To leave the other agent's signed/public lane alone,
this driver launched its **own** browser process/profile and never connected
to shared CDP19329. Own browser/profile and loopback fixture are closed; see
cleanup-r4.json. Closing the owned browser is deliberately separate from the
shared-browser disconnect-only rule used in prior tests.

## Reproduction

Use the owner's reproduced frozen R4 component directory and existing read-only
strict-CSP server:

```sh
python3 -B test/polygon-profile-v3-browser/serve.py --root /tmp/frozen-r4 --port 0
```

Change only the reproducible pins' loopback baseURL to the printed port, then:

```sh
CODI_COMPONENT_PINS=test/prism-selection-read/component-r4-pins.json \
CODI_OWN_CHROME_EXECUTABLE=/snap/bin/chromium \
PUPPETEER_CORE_PATH=/absolute/puppeteer-core-24.35.0 \
CODI_RECEIPT=/tmp/selection-receipt.json node test/prism-selection-read/browser.cjs
node test/prism-selection-read/check.mjs
```

The latter checker reads the retained source-matched receipt. Browser/fixture
source hashes and the full module manifest are preserved, with no native
binaries or dependency trees committed. Public application producer-ID custody,
authored source regeneration/native reopen, descendant selection through cuts
and edge treatments, and operation feasibility remain separate work.
