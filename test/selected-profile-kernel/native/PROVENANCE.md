# Native provenance and retrieval

Repository: `occt-interpreter-codi.git` on both LAN hosts.
Branch: `research/selected-profile-prism-v2-20261106`.
Final source/evidence tip: `c10848b72b9bebf7c9fff334bdf83e5acf79bda5`.

Logical commits:

- `e4bb309c` — native owned prism/inspection/mesh/release APIs and additive DBRep helpers.
- `9ac8fa5b` — build script, executable C++→WASM probe and contract notes.
- `c10848b7` — exact build/ownership/export receipts and portable JS adapter.

The receipt's `sourceRevision` points to `9ac8fa5b`, before the later evidence
commit; the compiled C++/header bytes are unchanged at the final tip and their
SHA256 values are recorded explicitly. The portable adapter itself is supplied
by the evidence commit. No second editable native-source copy is kept here;
check out the native branch for the actual C++ source. `probe-template.cjs` is
the same executable probe source used by that branch.

Both final artifact directories contain matching final JS, WASM, portable JS,
source archive, receipts and source license/exception notices:

- R730: `/mnt/data10tb/codi-occt-selected-profile-v2-20261106/`
- example.invalid: `/srv/data/codi-occt-selected-profile-v2-20261106/`

Exact primary pins:

| File | SHA256 |
|---|---|
| `main.js` | `e1ca1ef329659c5a2d605c82e698d8ca7890c386e2bca71de87b9ba18499f3f8` |
| `main.wasm` | `a81af0b78dd585124f3f2d05d09b4a387b276bd1f655f0234002a6ab4646a637` |
| `occ-portable.js` | `cbd49d63d0900f50dda7fc53518d5f06183e85b1dea720522cc2994b0876adc9` |
| `source.tar.zst` | `8216786f322dc0fca197a6dcc51644e7b0b50d99b090a7f4c30e7ac3832d1853` |

Verify every artifact with the supplied `SHA256SUMS`. Generated runtime assets
and static-library dependencies are not committed into this CAD branch.
The native source archive is from the final Git tip, including notices and
source tests; it is a private LAN backup, not a public source-distribution offer.

Build machine: R730. Native worktree:
`/mnt/data10tb/codi-occ-selected-profile-source-20261106`.
Build output: `/mnt/data10tb/codi-occ-selected-profile-build-20261106`.
Emscripten2.0.30 was loaded from
`/mnt/data10tb/codi-occ-four-corner-clean-20261104/emsdk/emsdk_env.sh`.
Compilation/linking used CPUs0–3, existing OCCT archives from source
`846bea93aebfabb3e18c94672ed4c295ac1c1fa3`, and the exact new build script.
The archive hashes are in `build-receipt.json`. This is a wrapper relink, not a
fresh rebuild of every static library or a claim of cross-machine reproducibility.

`exports-receipt.json` confirms all52 prior WASM export names remain, with six
new native helper exports. A retained v1 rectangle route successfully used the
same new runtime in Chromium; downstream feature/history integration is still
separate. Six inherited compile warnings remain in legacy code.

The native probe ran against the final pinned WASM and portable JS. It is
actual WASM execution in Node, not native CPU execution or a protocol double.
Its32 create/release cycles prove bounded named-shape ownership in that probe;
no RSS/heap shrinkage, arbitrary-shape stability or general kernel correctness
is inferred. Browser geometry proof is recorded independently in the parent
`browser-receipt.json`.
