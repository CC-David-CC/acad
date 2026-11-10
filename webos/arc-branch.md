# Ordinary authored Arc branch

SOURCE ONLY / UNRUN. Requires the matching Core CAD-ARC-01 packet; this host
adapter is not independently compatible with the old a/b/c-only saved schema.

`append-sketch-primitive` Arc data accepts a/b/c and optional branch
`proper-ccw` or `full-ccw`. Omission defaults to proper ONLY for this NEW
creation request. The adapter captures/fixes that intent before calling Core;
Core/Worker authenticates actual geometry/admission/currentness and its independent
original-request verifier. A caller branch value is not geometry authority.

Full Arc requires exact seam equality. Proper Arc cannot collapse or become full
through proximity, solver output, Mirror or save/reopen. Native source records
must always contain branch; missing/unknown saved values refuse before adoption.
Circle remains its own full periodic entity. Units, original coordinate precision,
IDs, current source-byte journal, Save and Undo/Redo policies are unchanged.

No index/registration changes or new public commands. No tests/probes/parser,
build, module, Native or browser execution. Root owns coherent app qualification.
