# First complete E18 run: manifest target admission

Parent-retained E18 R1 on Core `0e46c2b` / Desktop `fc5cc6747` passed literal
part/native point observations, then refused the first `recipe.bind` with
`The selected rectangle is unavailable.` Four rows, no saves. The complete driver
remains unchanged.

The coordinator required the legacy manifest kind `rectangle`, while the modern
manifest producer emits `selected-rectangle`. This is a coordinator schema mismatch
before candidate native work, not evidence of a geometry failure.

Admission now follows the established family branch. Modern admission requires one
`selected-rectangle` target matching the actual captured feature index, feature ID,
source face and opaque region. Legacy symbolic-width inspection remains confined
to legacy `rectangle` targets. The adjacent modern no-op lookup binds the same full
identity rather than matching only a face ID. Worker manifest capture, dimensional
resolution and reply verification already have separate branches for both kinds;
they are unchanged. No kind-wide OR or unverified target fallback was added.

Source repair only: no isolated tests, probes or builds. The parent will rebuild
and execute the same complete driver. Proposed typed export/read-snapshot work is
still on hold.
