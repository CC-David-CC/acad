# Display inches without changing canonical CAD units — read-only checkpoint

Source CAD53c6203fb, desktop9655720f5. No production edits, browser execution or
conversion-feature qualification. This checkpoint was stopped at parent request
so the broad22-row Gate1 pass could start. Existing quantity source was inspected,
not newly executed. No geometry/history/document migration is proposed.

The minimal design keeps `projectManager.unit`, source coordinates, constraints,
feature numbers, native operands, tolerances and exports in millimeters. Add a
small document-owned presentation preference, not a second model: length display
millimeter/inch, defaultmillimeter. Angles stay canonical radians and display
separately as degrees; an inch toggle must never scale angles/counts/scalars.
All existing agent creation/edit/inspection numeric contracts remain canonicalmm.
Optional formatted values must be additive records with explicit display units;
never relabel canonical numbers. Unitless input is stillmm in existing commands.

## Exact existing boundaries

- physicalQuantities.mjs:1,4,29 uses mm/radian canonical bases and maps inch(x)
  to25.4*x; deg(x) is separately radians. Area/volume need squared/cubed length
  conversion, not a linear division. Typed source is persisted as exact text
  (parameters/physicalSource.mjs:14), not reformatted by a display switch.
- projectManager/projectEnvelope.mjs:20,37,46 currently has strict project/root
  key whitelists and fixed millimeter envelope; manufacturing must matchmm.
  Changing envelope.unit toinch would reject valid pipelines, not add display.
- projectValidationCore.ts:11 and projectValidationWorker.ts:13–17 decode that
  envelope and prepare only model/sketch storage. Any persisted display metadata
  must be admitted/retained explicitly, not silently stripped.
- projectBundle.ts:49–71 saves history/expressions/assembly/counters; loadData:124
  resets document state before replay. storage/storageBundle.ts:29–33 isolates
  volatile WebOS windows/accounts. No browser-global preference should become
  the authority for another document's presentation.
- projectManagerBundle.ts:67–110 already owns document-scoped metadata/revisions;
  snapshot:285–318 and restore:539–670 are the native lifecycle seam. unit:803 is
  intentionally a fixed millimeter getter. inspectMaterialSurfaceRevision:77
  guards actual authored manufacturing/surface state; display must not change it.
- sketcher/shapes/dim.js:98/307 format raw linear/radius values; angle:532 already
  converts radians to degrees. SignedX/Y/Projected/diameter in
  shapes/annotations/angleAnnotation.ts:142/154/169/209 also format raw lengths.
  Those are display-only seams. Formatting must not enter serialization/solver.
- ConstraintEditor.jsx:58–75 edits exact constant expressions, and142–155 currently
  has only boolean transforms. Do not round/rewrite those strings on unit change.
  ANConstraints.ts:1215–1223 rounds initial constants; do not reuse that authored
  mutation for formatting. Viewer:61–66 has applicationContext for a shared
  formatter; dimensionText calls currently need the actual viewer/preference.
- measureEdge.action.ts:9–25 returns canonical endpoint/chord values; UI:68 says
  model units. WorkerSolidCommands.ts:31/throughHoleCommands.ts:121 exposemm.
  Keep machine measurements canonical, add explicit formatted display alongside.
- rectangleCreation.ts:97/104 and desktop index.mjs:84/132 gate canonicalmm.
  Keep those gates. Desktop inspect-state.mjs:1–11 and index.mjs:108–117 rebuild
  the saved envelope for dirty detection; a persisted preference needs the same
  serializer path or dirty/Save/Open will disagree.

## Minimal next patch and explicit semantics

1. Tiny shared pure formatter/scale definition (reuse the existing physical
   unit constants rather than reparsing typed expressions on each label). Length
   display25.4mm→1in; areas/volumes scale by25.4²/25.4³. Return numeric/text/unit
   separately; formatted text is never accepted as the original numeric value.
2. ProjectManager owns an immutable presentation record +small revision, reset
   on New/replace. Public inspect-display-units{} and set-display-units
   {revision,lengthUnit:'millimeter'|'inch'} use existing host lifetime. Expose
   canonicalLengthUnit:mm, canonicalAngleUnit:radian, displayAngleUnit:degree.
   Set is metadata-only, no Worker solve/native operation/replay, no feature ID.
3. Recommended persistence is optional top-level presentation metadata on the
   existing v2 envelope, omitted for the defaultmm. Old files loadmm with no
   rewriting/migration; normal explicit Save writes it, New resetsmm, fresh Open
   restores it. Extend only that explicit whitelist/manager restore/desktop dirty
   serializer together. Updated readers must reject malformed metadata. Older
   strict readers may refuse a new optional field; never claim old-reader parity.
   If no metadata schema change is accepted initially, label RAM-only/reset-on-
   Open explicitly; do not imply native persistence. This is a deliberate scope
   choice for the parent, not implemented by this review.
4. Do not add preference changes to authored geometry/edit/creation Undo. Return
   authoredUndo:false. Preserve entries/cursor/canUndo and source/equations;
   ordinary Undo after toggling must still undo the same modeling edit. A separate
   presentation revision can make stale preference commands refuse. Save revision
   and dirty state must include presentation, while native/material/tolerance
   fingerprints remain unchanged. Keep setter idle-only initially to avoid an
   unrelated preference change invalidating a native job.
5. Wire all length annotations and measurement UI through the same formatter.
   Preserve R/diameter/ΔX/ΔY/projected prefixes, reference/driving roles and
   explicit angle formatting. No canvas mock is evidence of the real UI.

## Required acceptance before claiming the feature

Actual public mm→inch→mm on the qualified hole/edge part: exact native geometry,
Float64 mesh, bounds/volume, source bytes, history params/IDs/backend, typed source
and evaluated table, journal entries/cursor and counters remain unchanged; zero
new geometryWorker dispatch. Display25.4mm=1in including signed/radius/diameter,
angleπ/2 still90° independently. Input contracts stillmm. No-op, stale and closed
set refuse honestly. Two windows do not share preferences. Native Save/Open keeps
inch presentation but canonical envelope/manufacturingmm; returning defaultmm
and saving reproduces original canonical bytes apart from explicitly allowed
non-geometric metadata. Old native files defaultmm without rewrite. Verify actual
annotation/measurement surfaces separately; no UI or persistence pass exists yet.
