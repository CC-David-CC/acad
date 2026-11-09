# Independent review: extent SVG oracle

Immutable input e5461dea6f6a17badfd4c51af57b2259ea1f44ec (parent6ee849b9aaab77690fa8024806034f603323232c), following Root BEFORE08313b3. This branch contains this review only. No product/packet/frozen artifact/root worktree edits, Python/parser/probe/test/build/Native/browser execution or status changes. The normative SVG2 specification text was read; no SVG artifact was opened or parsed.

## Confirmed findings

### CAD-EXTENT-SVG-ORACLE-GRAMMAR-01

svg_oracle.py:15–23 recognizes numeric/ML tokens and strips commas/whitespace from EVERY intervening gap, including the prefix and the command-to-first-coordinate gap. It therefore interprets `,M110,100 L122,100` as the same two physical points as the producer's valid `M110,100 L122,100`. A leading comma is not permitted by the SVG path grammar, and unrecognized initial path data does not establish a drawable segment. The checker nevertheless charges and uses the stripped mathematical line for all footprint/dimension/leader proofs. Prefixing each otherwise qualifying path with that comma preserves every checker's parsed coordinate/coverage result while losing its actual path-syntax certificate. This is a static source counterexample, not a generated artifact or observed runtime incident.

The authoritative [SVG2 path grammar](https://www.w3.org/TR/SVG2/paths.html#PathDataBNF) allows whitespace before the initial moveto and between a command letter and its first coordinate; comma handling belongs to coordinate separation. Its error-handling section requires path rendering to stop at the first erroneous command. The actual renderer emits explicit M/L commands with a finite first number immediately after the command and comma-separated coordinate pairs.

Narrow remedy: admit a position-aware valid closed M/L grammar, or deliberately the exact declared exporter subset, before interpreting any coordinates. Preserve signs/exponents/full precision, existing finite point/segment budgets, all geometry/anchor/visibility checks and tolerances. Do not repair the artifact by stripping an invalid separator or invoke a production renderer/parser as the independent proof.

### CAD-EXTENT-SVG-ORACLE-SOURCE-BINDING-01

check.py:199 selects `definition` from the driver's proposed request roster `r.definitions` and passes the actual export-before state separately. Neither this call nor inspect_extent_svg compares that proposed definition with `context.drawing.definition`, the current accepted definition. The helper binds document/geometry revisions and reads actual source sketch/target/cap descriptors, but never reads the accepted drawing definition. Its title/reference/label comparisons therefore prove the SVG against the proposed request, without an explicit equality to current authored drawing source. The archive branch at check.py:172 independently preserves the actual accepted drawing; it does not connect it to r.definitions. Actual output and saved source could disagree while those separate comparisons still succeed.

Also the SVG artifact branch omits the explicit issued revision comparison present immediately above for 3MF/STEP. Metadata equality to the export state does not independently validate the recorded public request revision.

Narrow remedy: exact equality of the supplied definition to context.drawing.definition before using it as authority, and `item.issued.revision == before.host.revision` for SVG alongside the existing format-specific issued bindings. Keep all current source/cap ID/anchor/label/geometry and immutable artifact checks. Do not normalize a different definition, invent Native identity, or substitute the request roster for accepted document source.

## Bounded source conclusions

No additional confirmed defect was identified in the reviewed e546 delta. Top uses source X/Y; front X/Z; right Y/Z, agreeing with drawingReferenceFacts.mjs. With paper Y inverted, front/right bounds use signed lower/upper interval levels, not source-plane depth. Width/height source-point anchors use actual saved Segment endpoints. The cap anchor alternatives are the two actual rectangular X corner coordinates after front projection, with current lower/upper role+opaque selection membership. ΔX/ΔY/ΔZ labels describe component distances and true span, not an invented Euclidean length or plane offset. All integers in these two frozen SVG cases avoid a new cross-language rounding premise.

The oracle's1e-6mm projected incidence allowance is the declared Native artifact allowance at1:1, separate from50pm original source coordinates. No tolerance change is proposed. Caption checks use the fixed3mm/1.8mm advance/padded6mm declared paper boxes, enforce own-view lower clearance, other-view nonoverlap with gap, caption disjointness and title/footer-safe sheet bounds without copying layout search. This does not prove arbitrary installed-font ink or general authored leader/dimension layout. It proves finite boundary support/coverage, not independent Native HLR visibility classification/multiplicity. Actual complete whole/FIRST and Chrome artifact review remain necessary.

Raw UTF8/16MiB/NUL/declaration/PI exclusion precedes ElementTree; exact root/groups/leaves/attributes prohibit opacity/CSS/transforms/external effects, and defs is bare empty. The new Python helper imports only stdlib. It is present in BOTH the driver before/after Git-bound roster and check.py's exact expected roster. Other actual local imports resolve to the listed mesh/step/negative/archive helpers; the inserted native-container path contains no same-basename shadow for the new helper. Production renderer/helper custody still uses Root's final producing-source/build/assets chain; this roster is the acceptance/helper roster, not a claim that every production source file was snapshotted here.

## Exact source inputs

Git blob identities at e546:

- svg_oracle.py:7117d593e814670ff8914056861090558fbd57e3; SHA256dc6684a50908e697def1cb1b3050b87a963316f48d0e5891980d8144294c25f4.
- check.py:ac795b9d916498b50c07a35e2d8b03e4358a4937; SHA256c201382b90ebf362450527c0e624fcc2041e4610b451ddebacb81b5065d0e5ca.
- desktop-driver.mjs:b5a0df525ce0fc626fcc395ff1ad9f6ab8182af8; SHA25647113f7e23e38bfd70442cace4cd94aca2b9acb685368b38b0901e9fbc2b7478.
- linkedPartDrawingSvg.mjs:78abbb11add58e118ef31ec2b63452c462577253.
- linkedPartDrawingCaptionLayout.mjs:37f2c57bd57e684793a1f44fdec638ce5a820b97.
- drawingReferenceFacts.mjs:161934704336dfca617a5748825025b24ab5b808.

All first three paths are under test/selected-profile-extents-workflow; renderer/helper under web/app/cad/export; Native fact producer under modules/engine/mount. No actual whole/oracle PASS is inferred by this source review.
