# CAD precision requirements and qualification boundaries

User clarification2026-11-07: intended work includes photonic chips and defect
manufacturing with features on the0.x nanometer scale. The user accepted
**0.001nm geometric error** as the target. That is1picometer =1e-9millimeter
=1e-12meter. Overall model extent and absolute coordinate offsets have not yet
been specified. Do not invent them or claim universal accuracy at that target.

## Separate contracts

1. Authored source identity: units, stored numbers/formula spelling, IDs,
   references, material assignments and ordered history survive native Save/Open
   exactly under their declared schemas.
2. Reconstruction stability: the current small-fixture source guard permits at
   most1e-9mm coordinate change between the actual returned candidate and fresh
   reconstruction. Repeatability is not geometric accuracy or physical validity.
3. Geometric accuracy: qualify coordinates/dimensions, intersections, topology,
   BRep construction and exchange against independent expectations at the user's
   0.001nm budget in a declared model-size/coordinate envelope. Agreement between
   two kernels or reproducing one wrong result is insufficient.
4. Derived representations: display/manufacturing/analysis meshes each have
   explicit approximation budgets and provenance. They do not redefine source
   geometry or automatically inherit BRep accuracy.
5. Physical/manufacturing uncertainty: process capability, material models,
   measurement uncertainty and simulated behavior require separate evidence.
   A numerical picometer budget is not a manufacturing/simulation guarantee.

## Present implementation is not nanoscale-qualified

Current mechanical qualification does not establish this accuracy. Selected
polygon profile resolution has a declared1e-4mm floor (100nm); canonical typed
rectangle binding has a1e-3mm lower domain (1000nm). The ordinary source-only
width workflow demonstrates a1e-6mm-wide sketch, but its Native extrusion is
explicitly refused below qualified profile resolution. A valid tiny sketch is
not proof of a qualified solid. Native/material/mesh fixture comparisons also
have separately declared tolerances. The replay guard cannot upgrade them.

No threshold changes here. Existing mechanical evidence retains its actual
units, sizes, build and tolerances. Unsupported domains must not silently weld,
clamp, rescale authored dimensions or claim success.

## Required precision work

- [ ] Declare supported feature sizes, physical extent, coordinate offsets and
      error budgets per operation/backend/representation. The0.001nm target is
      required; remaining operating-envelope parameters are unresolved.
- [ ] Separate numerical conditioning/stopping, geometric classification,
      reconstruction stability and manufacturing tolerances.
- [ ] Eliminate construction/replay inconsistencies before revising bounds.
      Orientation's observed2.3599383780492644e-8mm movement remains a failure.
      That is0.023599383780492644nm, or23.599383780492644pm.
- [ ] Evaluate explicit internal coordinate frames/unit scaling where justified.
      Keep one physical authored model and reversible attributable conversions;
      kernel numeric frames cannot become another editable design document.
- [ ] Derive scale-aware representability/rounding bounds for translated models
      and mixed small/large geometry. Refuse unattainable requests honestly.
      Do not tune tolerances merely to turn a failing fixture green.
- [ ] Qualify independent analytic geometry, interfaces/Boolean topology,
      parameter changes, Save/Open and STEP/core3MF exchange over the declared
      envelope. Report achieved error separately per representation/result.
- [ ] Measure Worker CPU/memory/cancellation at required quality; finer tolerance
      cannot silently remove lifecycle/resource bounds.

This informs existing C05/C09 precision competencies and later CAD work. It does
not claim current mechanical Gate1 proofs satisfy nanoscale accuracy or that all
physical phenomena can use continuum CAD representations.
