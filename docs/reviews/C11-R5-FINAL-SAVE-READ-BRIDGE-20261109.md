# Actual final Save and protected drawing read

Reader 3b49077 on unchanged whole66328 completed six SVG checks, then failed
the seventh artifact's exact observation-state lookup. This is AFTER output
AFTER-EXPORT-DTO-REPAIR.json; original FIRST and every AFTER remain immutable.

The final recorded native Save input exactly equals the last protected Native
observation. Its output exactly equals the final SVG's before/after states.
The sole recursive change is host.dirty true to false. Complete model source,
Native objects, geometry/document revision, journal, definitions, references,
ownership and lifecycle are identical. Save command1059 and settled write13
have the same actual result and archive bytes; SVG write14 follows. Independent
read-only review by timeline_qualification confirmed these actual relations.

The reader now permits ONLY the resaved-final phase to use this explicit actual
Save bridge when there is no exact observed-state match. It requires every
non-Host field equal, every Host field except dirty equal, strict boolean dirty
transition, exact original read/input and Save-output/SVG-state matches,
identical binding/definition/expectations, unique registered command and settled
write/result/readback association, and Save-before-export chronology in both
records. It retains the original observation object and reports the association
as a Save bridge, never as a fresh Native read. No generic dirty normalization,
receipt mutation, invented observation, changed model or waived SVG assertion.

The next execution uses a new frozen reader checkout and separate output/custody.
This source note does not anticipate its result. Original Native/source/geometry,
metadata, visible paper, routing and accuracy checks remain unchanged.
