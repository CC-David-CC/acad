# C08: proposed shared custom source frames

Proposal only, reviewed against ACAD `32ae9c8` on 2026-11-08. No production changes, checks, build, browser execution or new native qualification accompany this packet. Implementation requires root approval of the ownership table in CONTRACT.md.

The bounded operation is an editable source-plane producer with an explicit numeric right-handed local frame and an optional attachment to an earlier authored source-plane producer. The same captured source, candidate replay, Native selected-profile constructor, journal and native `.cad` document remain authoritative. It is not a post-render body transform.

Phase A supplies the custom source-plane increment: local intent/IDs stay unchanged while parent pose and a principal-parent depth change move its actual Native geometry. Explicit forward/inverse coordinates and a non-origin pivot are independently checked. **Phase A is not C08 closure.** Gate1 also requires phase B in NATIVE-ATTACHMENT.md: an independent editable source sketch genuinely attached to the actual last planar face of an owned extrusion, following that extrusion's depth20→25. Source-plane following cannot substitute for this requirement.

Mirrored solids, arbitrary affine transforms, assembly/joints, typed frame expressions and general history-control support remain outside this finite proposal. Native planar-face attachment is a required second phase, not an optional future feature or an unsupported declaration used to close C08.

Files:

- CONTRACT.md: current source evidence, exact proposed schema/API, transaction and ownership.
- ACCEPTANCE.md: one eventual complete public workflow and independent measurements. It is a plan, not an executed driver or a passing result.
- NATIVE-ATTACHMENT.md: required genuine extruded-face attachment phase, existing protected evidence and minimal new reader/repair dependencies.

Current user precision direction is 50 pm (`5e-8 mm`) for the small-design geometric acceptance budget. A proposed frame-validity tolerance is dimensionless and does not replace that geometric budget. Existing Native expanded BRep bounds and mass-integration estimates must be identified separately; they cannot certify point placement at 50 pm.
