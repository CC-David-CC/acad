# Save compatibility followups — candidate, not browser qualified

The combined ae579 app passes the separately recorded bounded Save/parameter
flows. Review also found gaps introduced by routing all changed saves through
the more limited headless validator. These must remain visible until fixed and
tested together; refusing formerly working ordinary saves is a release regression.

## Typed engineering names

The signed multisource test accepts a physical length named `E`, then fails its
sketch Save with `Invalid external parameter`. The independent passing rerun
uses `D2` to separate propagation from that name defect. Physical definitions
intentionally accept E and Math, whereas the Worker incorrectly uses the legacy
arithmetic-script definition-name rule. The candidate uses a separate external
numeric-binding validator for those explicit literal bindings. It preserves
legacy script name restrictions, Euler's constant E and Math.PI evaluation;
prototype keys and non-identifiers remain rejected. Two parser/name controls
pass, but matching real Worker and signed E Save/reopen proof remain pending.

## Large labels

The existing near-1MiB sketch control carries a1,037,000-character label. The
new Save Worker rejects individual strings over256KiB even though its sketch
packet limit is1MiB. The candidate aligns this string ceiling with the existing
sketch limit while retaining structural and aggregate budgets. No128MiB CAD
document claim follows.

An independent previous0b9 profile found Canvas fillText dominated the long
label's repaint. Label drawing now supplies at most512 UTF-16 units to Canvas,
with an explicit `[long label preview]` marker; editing and serialization retain
the complete authored label. Three pure preview controls pass, including a
surrogate-pair boundary. The actual large-history browser test now checks Canvas
argument sizes as well as exact full-label undo/redo, release and native reopen.
Those new runtime/paint assertions remain unrun pending the combined build.

## Remaining compatibility work

- B-spline construction/derived-data verification and child-point constraints.
- Registered schemas omitted by the original headless signature table, other
  carried curve geometry, and RadiusLength's Arc coverage.
- Curved external boundaries, multi-stage sketches and authored generators
  require explicit supported semantics and real consumer tests. Their current
  refusals must not be presented as complete application compatibility.

The complete Files/CAD release objective and later CAD1–6 gates remain open.
No source packaging, public deployment or full Worker-first claim is made.
