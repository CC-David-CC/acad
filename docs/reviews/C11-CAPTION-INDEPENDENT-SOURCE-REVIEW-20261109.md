# Derived captions: independent source review

Reviewed product `2d591c2eb565901488fc93f43682e5fc8a142648` and oracle
`6b79ecf1339aa7e1cb0594393dc7003e9ca80e2d` against root
`9c7d5f07a9661704aef1c9ca79497279e6fc7eb9` and the actual previous C11
725 renderer/artifacts. No confirmed blocking source flaw was found in this
bounded caption repair. This is source review, not new runtime qualification.
No parser, test/probe, TSC, build, Native or browser execution occurred; no
product, packet or frozen evidence was edited.

| Reviewed seam | Finding |
|---|---|
| Ordinary top/front/right/isometric | `linkedPartDrawingSvg.mjs:41–46,74–89` bounds actual admitted line endpoints and full conic envelopes. For each projected coordinate, `abs(a*cos(t)+b*sin(t)) <= hypot(a,b)` for every trim parameter; a full envelope conservatively contains finite, reversed-orientation and degenerate projected conics without solving extrema, changing the trim or borrowing a geometric tolerance. |
| Physical paper map | `:28–29,42,46` uses the same positive sheet/detail scale, authored paper origin and Y inversion as the actual paths. Mapping opposite rectangle corners then taking each paper-coordinate minimum/maximum is valid for this axis-aligned paper map. The baseline `[minX,maxY+5]` clears the own-view envelope by 5 paper mm. It does not claim a 5mm glyph-box or cross-view clearance certificate. |
| Section | `:48–59` bounds every actual finite cap-patch edge endpoint before rendering the same patches/cut boundaries. Linear segment/polygon extrema occur at these vertices, including internal patch edges; no nominal section rectangle or mesh is substituted. |
| Detail2:1 | `:62–68,75,89` uses its actual aperture at its existing absolute2:1 scale, not the parent sheet scale or a conic's untrimmed parent envelope. The same aperture bound applies to a genuine available-empty detail. Existing available-empty notice placement is unchanged. |
| Empty/unresolved variants | `:33–35,46` retains the old explicit unresolved placeholder and empty ordinary-projection fallback. There is no invented prior extent/cache, fabricated available geometry or changed availability/repair behavior. |
| Bounds and resources | `num()` still refuses nonfinite/absolute>1e9 paper coordinates. Full conic envelopes can be conservative; this policy does not promise that every caption fits inside the sheet or that its bound is the minimal trimmed extent. The source contract explicitly declines clamping/rescaling or automatic layout. Added work is bounded constant arithmetic per already admitted analytic curve/section edge, in the same Worker walk; segment and final-byte guards remain unchanged. No cost/peak-memory result follows from reading the source. |
| Physical/source authority | The diff changes only caption coordinates plus local bound accumulation. Existing geometry paths, scales, chord construction/.02mm criterion, Native facts, source references, dimensions/annotation labels, metadata/currentness, capabilities, resource policy, source/J/persistence and public methods are unchanged. No changed mathematical threshold or new source trust flag was found. |
| Independent expectation | `oracle_svg.py:102–121,144–145` derives the same stated mathematical envelope independently from `check.py:89–114`'s source/document-bound checked analytic observations, independently reconciled finite cap patches, or the actual authored detail aperture. It imports no production renderer/bounding helper and does not read the emitted caption coordinate to choose its expectation. Existing `textcheck` requires full label, exact style and expected position within the unchanged1e-6 paper comparison bound; the added baseline check does not relax it. Existing geometry/chord/hatch/dimension/source/lifecycle assertions remain. |

The retained evidence is explicitly prior behavior:
`test/section-detail-drawing-public-workflow/evidence-r2/QUALIFICATION.json`
binds actual Core725c3806, Host5ea92e08, whole61449 and first oracle40502,
63 observations/16 SVGs/8 .cad saves. Its recorded caption follow-up is OPEN.
The actual `whole/translated-negative-edited.svg` still contains captions at
top(180,105), front(180,225), right(410,225), isometric(440,125), section(140,335)
and detail(420,335): the old origin+5 policy, not evidence for this fix. Its
render and all frozen bytes remain unchanged. Root must qualify the repaired
composition with the complete whole, first independent oracle and actual render
review before closing that presentation follow-up.

The documented remaining cross-view/authored-label collisions and lack of sheet
auto-layout are not silently claimed repaired. The fixed origin0 counterbore
top/front/right family has min-localX/min-localY=0 on its actual complete outer
outline, so this policy still yields the caption positions admitted by its
separately repaired closed SVG scaffold. No additional caller migration or
capability/geometry change was identified in the reviewed finite cases.
