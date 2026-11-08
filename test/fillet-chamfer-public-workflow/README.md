# E11 fillet/chamfer creation, travel and native persistence

Source-ready acceptance packet. **Not executed or qualified.** This fills the
specific missing observation in the E10–E13 exercise evidence map: immediate Undo
of the actual **fillet creation**, restoring its corner-holed predecessor, followed
by Redo of the same feature/output/opaque edges. Existing treatment, creation,
original-rectangle and other frozen receipts remain unchanged. No exercise status
changes follow from preparing this source.

`example.mjs` exports `createFilletChamferExample(agent, engineRevision)`. Its
`agent.execute(command, args)` is the actual registered public command executor;
the driver supplies the normal signed Desktop harness. The recipe uses genuine
New/rectangle/selected-region extrusion, centered and four-corner hole, edge
inspection/creation/edit, source dimensions and depth commands. It does not seed
source/history, invoke private authoring, derive qualified curve IDs, parse opaque
IDs, fabricate results or substitute an engine. The explicit staged build must
actually advertise the supported source/Native operations. The root operator
supplies its exact compiled source, Desktop and asset pins.

## Frozen geometry and selection contract

The original source is an actual four-Segment, eleven-constraint XY rectangle,
100 × 50 mm at the origin, extruded 20 mm. Its center bore is D10; four D4 bores
are 8 mm from the original rectangle sides. All local curve, point, feature,
output and region identities come from real replies/inspection.

The initial corner-holed producer must advertise exactly four genuine line
connectors from the original extrusion. Each has two distinct actual incident
source-curve IDs. The first returned connector and its unique disjoint-incidence
opposite receive R3 fillets. The remaining opposite pair receives equal-distance
1 mm chamfers. The recipe retains these exact discovered IDs; it never supplies
Native edge ordinals or guesses geometric identities from ID grammar.

Public connector metadata does not expose a world endpoint for each opaque edge.
Therefore the following **two geometries are frozen before execution** (corner
order LL, LR, UR, UL):

| Permitted geometry | Fillet corners | Chamfer corners |
| --- | --- | --- |
| A | LL, UR | LR, UL |
| B | LR, UL | LL, UR |

Both use the same declared analytic volume and census. The very first actual
fillet observation must match exactly one declared geometry, using Native material
classification at all four corners. That valid diagonal becomes a required
spatial binding for the same immutable selected edges through every subsequent
edit, Undo/Redo, source replay and Open. There is no new expected geometry selected
after an invalid result. The independent oracle derives both declared geometries
separately and rejects all other results.

For width `W`, height `H`, depth `T`, two equal fillets `r` and the other two equal
chamfers `c`, expected Native volume is:

```
W*H*T - 41*pi*T - 2*T*r*r*(1-pi/4) - T*c*c
```

The five bores contribute `41*pi*T`. Bounds remain `[0,0,0]..[W,H,T]`. Before
any treatment the five-bore solid has 11 faces, 27 edges and 18 vertices. Each of
the two-edge treatments adds two faces, six edges and four vertices. These are
finite fixture expectations, not a general topological certificate.

Each observation makes 25 genuine current-body Native point queries: five bore
centers and adjacent material points, four-corner probes at 0.1 mm and 0.8 mm
insets, four deeper 3 mm material probes, and boundary/outside points. At the
frozen positive sizes the 0.8 mm probes distinguish the filleted diagonal from the
chamfered diagonal; the 0.1 mm probes also detect missing chamfers. The oracle
independently tests cylindrical voids, circular fillet exclusions and chamfer
half-planes. Source coordinate/equation budget is **50 pm = 5e-8 mm**; Native
volume budget is **1e-6 mm³** and bounds **1e-7 mm**. Available source precision is
retained. Historical receipts and their budgets are not rewritten.

## One complete required workflow

1. Normal signed login, actual `.cad` advertisement, public New and exact mounted
   asset verification; author the original corner-holed plate.
2. Create the two R3 fillets. Immediately Undo that exact
   `WORKER_SOLID_EDGE_TREATMENT_V1` creation to the corner-holed body, then Redo
   the same feature/output/selected edges. Verify exact source and history,
   original-ID restoration, monotonic creation high-water, J targets, material
   absence and settled resource ownership.
3. Create the other two chamfers and immediately perform the corresponding
   actual chamfer creation Undo/Redo.
4. Edit fillet 3→4, chamfer 1→1.5, original width/height to 150×30 and depth to25.
   Observe the actual suffix after each edit. Undo all four edits **and both
   creation events**, then Redo that entire chain with the original IDs.
5. Refuse excessive Native fillet size, zero public argument size, stale edit
   revision and the original now-removed sharp-edge selections. Preserve accepted
   state, then prove healthy Native continuation.
6. Normal `.cad` Save, own browser/server byte equality, fresh signed Open and
   reedit fillet/chamfer. Exercise shared Undo/Redo and a genuine literal no-op;
   Save/sync/Open again.
7. Reedit original source to140×40, depth22, fillet3.5 and chamfer1.25, exercise
   mixed travel, then a third Save/sync/fresh Open and healthy observation.

Same-window read-only observations compare **all raw accepted state**, including
public inspection revisions, document token, material state and ownership. Across
replay/Undo/Redo, only the explicitly opaque inspection revisions and opaque
material revision are treated according to their existing contracts; the actual
source, graph, counters, output/producer IDs, metadata and J targets remain exact.
Across fresh Open, document/session revisions may rebind and the session J resets;
source, authored intent and creation counters must remain identical.

The precise refusal codes frozen from the current source are
`EDGE_TREATMENT_FAILED`, null, `STALE_HISTORY`, `UNRESOLVED_SELECTION`, in that
order. The zero-size edge adapter currently throws an ordinary `Error` with its
exact argument-envelope message, unlike the separately repaired through-hole
adapter. This packet records that real contract and does not invent a blanket
`INVALID_REQUEST` code. The removed-selection control uses genuine earlier edge
IDs which must no longer be listed as usable on the current treated producer;
it does not invent a fake edge identity. No refusal can silently retarget.

## Operator invocation, after source freeze

The following commands are instructions for the root's later single complete
application run; **they were not executed while preparing this packet**. Use a new
nonexistent evidence directory and the actual qualified Desktop harness checkout.
No dependency install or app build is part of this packet.

```
CODI_DESKTOP_SOURCE_ROOT=/absolute/desktop-source \
CODI_EVIDENCE=/absolute/new-e11-evidence-r1 \
CODI_SIGNED_PINS=/absolute/exact-runtime-pins.json \
CODI_ENGINE_REVISION=sha256:ACTUAL_JS_SHA:ACTUAL_WASM_SHA \
CODI_EXPECT_SOURCE=ACTUAL_COMPILED_CORE_COMMIT \
CODI_EXPECT_DESKTOP=ACTUAL_FROZEN_DESKTOP_COMMIT \
CODI_TEST_URL=http://127.0.0.1:PORT/ \
CODI_TEST_CDP=http://127.0.0.1:19329 \
PUPPETEER_CORE_PATH=/absolute/puppeteer-core \
node test/fillet-chamfer-public-workflow/desktop-driver.mjs
```

Only after the entire public workflow is terminal:

```
python3 test/fillet-chamfer-public-workflow/check.py \
  /absolute/new-e11-evidence-r1 \
  > /absolute/new-e11-evidence-r1/independent-oracle.json
```

The independent oracle imports only the existing independent archive reader from
`test/native-cad-container/archive_oracle.py`. It checks whole `.cad` ZIP structure,
CRC/SHA/design revision, exact original source/equations/intent, ordered treatment
bindings, analytic Native measurements and all point classifications. It imports
no production planner, solver, archive codec, recipe or Native implementation.

The driver freezes actual source/harness/oracle bytes and runtime pins, retains the
first failure, and closes only its owned contexts. It does **not** intentionally
close a context during a submitted durable Save or unresolved server sync. Such a
failure is recorded as pending cleanup, with the owned context left for the root's
readback rather than claiming successful retirement. The shared browser/service
remain owned by the root. Account credentials or keys are not archived.

This is a finite E11 candidate proof, not qualification of every C06 treatment,
every engine, arbitrary curved edges, typed treatment formulas, human gesture UI,
STEP/3MF exports or full Gate1. The existing frozen proofs retain their own scopes.
