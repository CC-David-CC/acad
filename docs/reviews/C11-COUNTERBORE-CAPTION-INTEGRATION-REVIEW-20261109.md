# Independent source review — composed caption acceptance BEFORE

Reviewed root64bbaad on isolated review/caption-policy-integration-20261109.
Scope: counterbore caption migration3d26538d462bbfc9a4e35908bade29b861c1ca24,
its actual svg_oracle.py/producer-roster/contract, final C11 oracle/custody and
renderer/helper composition (bb9e269/a8a3eda). No product/packet/evidence edits,
parser, tests/probes, TSC/build, Native/JS or browser execution. Existing root
old-build ad5 C11 whole/first oracle/render qualification is retained with its
actual source; it does not qualify the new caption source.

## Confirmed finding: preexisting C11 raw XML vocabulary gap

Current test/section-detail-drawing-public-workflow/oracle_svg.py verify_svg
passes actual raw bytes directly to ET.fromstring, then checks the element
scaffold/styles/paths/text. It does not have the counterbore reader's earlier
raw closed-form exclusion of `<!` and `<?`.

Actual installed stdlib source /usr/lib/python3.12/xml/etree/ElementTree.py
1397–1403 explicitly documents/defaults TreeBuilder(insert_pis=False);1482–1489
passes that setting to its processing-instruction handler. Thus an unsupported
XML processing instruction can be outside the tree inspected by the C11 closed
scaffold checker. That checker does not implement external SVG/CSS instruction
semantics. The tree checks alone cannot establish its stated no-hidden/foreign
presentation vocabulary. This is a source-derived acceptance gap; no parser,
modified artifact, external resource or render was executed, and no current
producer/runtime incident is claimed. Production emits the fixed inline SVG
without such instructions. The gap predates this caption migration.

Smallest proposed correction is a raw closed-form admission BEFORE ElementTree
parsing, retaining ALL existing XML scaffold, exact attributes, cap/hatch/path/
chord/physical/source criteria. Root accepted this finding and will apply strict
UTF-8/size/unsupported declaration/instruction exclusion plus explicit NUL
refusal, preserving byte-form admission against alternate encodings. Root will
add matching NUL refusal to counterbore, whose strict UTF-8 and declaration/
instruction exclusion already exists. Renderer-escaped authored text cannot
introduce literal declaration/instruction openers. No production change or
general XML/CSS engine is needed. This BEFORE review changes no packet code.
This needs acceptance repair before relying on the next complete C11 independent
closed-form proof, not an invented Native/product failure or a reason to discard
old real evidence.

## Reviewed seams with no additional blocking finding

| Seam | Actual source evidence and bounded conclusion |
| --- | --- |
| Counterbore closed visible scaffold | svg_oracle.py visible_scaffold retains raw declaration/instruction rejection, exact root420×297mm/viewBox/children/background, bare empty defs, plain leaves and closed path/style vocabulary. Geometry and fixed text groups retain their exact original inherited attributes. Newly allowed attributes occur ONLY on the bijected derived captions; noncaption title/dimensions/footer still have exact values, order, positions and fill with no extra styles, transforms, opacity, nesting, events or external effects. |
| Independent finite counter boxes | check.py rectangle() independently establishes the actual four-Segment/eleven-row source, positive0-origin W×H domain and exact identity XY source frame. Existing model/Native/source checks bind actual W/H/T and parent geometry. The migrated oracle uses exactly these finite outer boxes: top W×H, front W×T, right H×T under authored paper origins/scale; later full path/circle/finite axial-interval/shoulder/source-dimension proof remains intact. This is justified for the finite unplaced counterbore contract, not arbitrary placed parts. |
| Counter caption bijection and inequalities | Exact total/fixed/caption counts; unique view IDs; exactly one full top/front/right caption per view; exact caption role/layout/font/spacing attributes; finite actual x/y/textLength with existing1e-6 serialization check. Boxes are reconstructed from actual XML and physical type policy, never a renderer-declared box/search. Full own5mm+stroke, every independent view/stroke, prior-caption disjointness and8mm/16mm sheet exclusions are checked. No exact chosen placement or production search is copied. No warning layout is admitted by this finite three-view/no-annotation contract. |
| Counter exact source roster | producer-roster.json adds the migration contract, actual renderer/helper and ownedDrawingReadProtocol without dropping prior rows. producer-roster.mjs captures acceptance/producing Core/Desktop exact commit:path/blob associations, compares executing worktree bytes, and returns the complete before/after pin paths. acceptance_oracle.verify_roster independently checks exact roster membership, snapshots/blob recomputation/Git readback and sourcePins==sourcePinsAfter. svg_oracle's new math is inline: no new unlisted Python import/helper was introduced. Native/component proof association order is unchanged. |
| C11 corrected scopes and physical criteria | physical_facts remains the original actual source/reference/dimension/annotation proof. Exactly ONE caption_boxes/envelopes/intersects block is correctly inside verify_svg after complete caption collection; the wrongly inserted physical_facts copy is absent. Existing exact path/attribute/defs/hatching/physical label/unresolved/crop/chord/metadata/readonly rules remain; caption matching changes only intentionally derived positions/attributes. |
| C11 independent all-view proof | Actual analytic/cap/aperture envelopes derive from already independently reconciled facts, with complete conic envelopes; each actual caption is bijected by full view/role/status and its declared paper box is checked against own/all geometry+stroke, other captions, margins/header/footer and any actual warning band. No search algorithm is imported or reproduced. Added renderer/helper producer anchors occur in BOTH driver coreNames and lifecycle CORE; original19 become21 without dropping a helper. |
| Renderer/helper coherence | Only derived available/unresolved view captions and available-empty detail are queued/moved. Actual geometry/path coordinates, authored origins/dimensions/leaders/annotations/definitions, references, metadata and document/J remain unchanged. The static helper import enters the dedicated SVG export Worker bundle on normal rebuild; there is no separate caption model or transport flag. Max6 geometry envelopes/12 captions and2048 candidates/caption bound presentation work. Full own5mm+physical gutter, all views/captions and reserved sheet areas constrain placement; failure is RESOURCE_LIMIT before returning SVG. No font-size shrinking/truncation/clipping/fallback. Existing segment/conic/SVG limits remain. |

## Limits and required actual next result

The fixed3mm/1.8mm spacing-only policy and padded6mm box are DECLARED paper
presentation bounds, not universal glyph-ink evidence for arbitrary installed
fonts. Root must still run the complete new-build genuine C11 and counterbore
flows, FIRST independent artifact oracles and actual final Chrome SVG render
review. The old ad5 qualification cannot stand in for that. General authored
label/leader arrangement remains explicitly OPEN; no current scope promises
automatic overall sheet layout or moving authored geometry/labels.

No additional confirmed blocker was found in the migrated counterbore source,
caption helper or final scope correction in this bounded review. The one C11
raw-vocabulary finding is an acceptance-only correction proposal. No status/
count/acceptance criterion or historical proof was changed here.
