# C11 caption oracle scope defect — frozen BEFORE

Root source review identified this defect in source packet
b0e14954661d712ac3b06315e2197bf91204dd9e before composition or execution.
No parser, tests/probes, build, Native or browser invocation was used here.
The original bad packet and every historical/runtime artifact remain frozen.

oracle_svg.py contains the independent global envelope/caption intersection
block twice. My source editor used a dimension-loop anchor occurring in both
physical_facts and verify_svg, with an unrestricted string replacement. The
first insertion is after physical_facts.source_point, before its dimension
loop. caption_bounds/caption_boxes/texts/NS are not defined in that function,
so the new path would fail with NameError. This is a confirmed source error,
not an observed failed run. The second copy inside verify_svg is correctly
scoped after its actual view/geometry/caption collection and must remain.

Correction is ONLY removal of the wrongly inserted first block. Restore the
old physical-fact/equation flow exactly, preserving all old geometry assertions
and the entire intended later independent SVG inequalities. No guard, budget,
caption criterion, product behavior or evidence is weakened. Review final full
function/diff context for analogous replacement spillover without executing a
parser or checker. Root's frozen ad5 whole remains unaffected and unedited.
