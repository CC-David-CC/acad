# Native component checkpoint

## R2: shared native vertices and construction ancestry

Native source `b66472f8ccef195bdd7a629f6f06ac1ef9686944` on
`feature/cad-gate1-kernel-20261106` is verified on both LAN repositories.
The exact R2 build is retained on R730 at
`/mnt/data10tb/codi-occ-gate1-build-20261106-r2`:

| File | SHA256 |
| --- | --- |
| main.js | `1ea7c85e170a93a28b09b5fc04761e32a3afadf98dbf138ea9bddd9920544853` |
| main.wasm | `534ffdd2d88632a7878d654742f2df72c16691f3c814085e4f525efc74961e19` |
| occ-portable.js | `5414a24c96eff09b77f7d3fe758287c9696e63127c91e73011f6f2939de2a8eb` |

V3 construction now uses shared native polygon vertices and captures the real
prism builder's first/last/generated relationships before the builder dies.
Four actual Node native cases pass geometry, ancestry and input preservation;
the retained V2 rectangle/circle/annulus suite also passes on these exact R2
bytes, including32 create/release cycles with final owned names zero. The
portable adapter reproduces byte-identical glue. Source/build/archive pins and
receipts are in the native repository's `shape-io/GATE1-PROFILE-V3-R2.md` and
associated evidence directory. No native heap/RSS claim follows from names zero.

The separate [actual Chromium R2 corpus](../polygon-profile-v3-browser/README.md)
passes eight shapes,29 point classifications and authored source-to-result
binding, reversed winding, explicit circle seams, refusal preservation,
cancellation and Worker cleanup. Those frozen component pins are retained.
Construction graphs use response-local indices; they are not saved selections.
Root app/history integration is under genuine combined qualification. This
checkpoint does not qualify fillets/chamfers, public polygon Save/reopen or
complete Gate1. Beta remains the qualified R4 build.

## Historical R1: initial native geometry

Repository `occt-interpreter-codi.git`, branch
`feature/cad-gate1-kernel-20261106`, source
`3a75e8a82e8c3a8760a71754780d4d9c4a35f1d9` is verified on both LAN remotes:

- example.invalid: `/srv/data/git/occt-interpreter-codi.git`
- R730: `/mnt/data10tb/git/occt-interpreter-codi.git`

Actual main C++→WASM execution passes triangle, rotated rectangle, concave L
and circular-hole geometry, analytic volumes/bounds/material/void probes,
input preservation and32 named create/release cycles. Retained V2 rectangle,
circle and annulus controls pass on that same runtime. Names returning to zero
does not establish heap/RSS reclamation.

Runtime files remain outside Git on R730 at
`/mnt/data10tb/codi-occ-gate1-build-20261106`:

| File | SHA256 |
| --- | --- |
| main.js | `d318423895577385bd121a51bd8d6ddd44069c6162339b7ed57e5994a19680d5` |
| main.wasm | `9a31bd41b5d08cd6c7d5ecfbcdd01ab2c13a5a558a309c36dd58ecbb2ceef625` |
| occ-portable.js | `4c6b242fe2675ef8ee362caf0872872cf37ac652c431042b5e2843f227b9194a` |

Native source `shape-io/gate1-kernel-evidence-r1/` contains source/build pins
and actual V2/V3 receipts; `GATE1-PROFILE-V3.md` contains reproduction commands.
The build reuses existing pinned OCCT static archives, not a clean rebuild of
every library. No public app/history/native-save or Chromium qualification is
inferred from this Node execution.

`ReadOwnedTopologyV1` returns bounded native observations with response-local
indices, never authored identities. The separately tested
`profilePrismProvenanceV1.hpp` supports exact source-to-prism ancestry but is
not wired into this initial main build. Before exposing persistent edge keys,
V3 must construct shared native vertices, retain actual source edges and capture
FirstShape/LastShape/Generated targets before the builder dies. Circle seams
are not authored corners. See the [independent provenance probe](../../research/gate1-edge-features-plan-20261106/PRISM-PROVENANCE.md).

Next: bind that provenance, integrate the explicit new backend revision into
the real preparation Worker/model/history, and rerun public authoring/native
Save/Open with independent geometry checks. This is not yet public polygon,
fillet/chamfer or completed Gate1 support. Beta remains the qualified R4 build.
