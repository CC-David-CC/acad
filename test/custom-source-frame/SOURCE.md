# C08 phase A source handoff

Source-only implementation based on ACAD32ae plus frozen proposal813/20a/3e04.
No unit tests, TypeScript checks, builds, browser execution or runtime pass is
claimed. Phase B genuine Native extrusion-face attachment remains REQUIRED and
OPEN. This packet adds no Native read, bootstrap/pre-init hook or dynamic overlay.

One `SOURCE_FRAME_V1` producer saves a numeric basis or one rigid base/axis/angle/
pivot/translation plus an actual earlier source-plane parent. It uses the same
stable producer/face identity as standard source planes, explicit MOpenFaceShell
csys, existing Matrix3x4 rotation in the sketch Worker, strict1e-12 dimensionless
right-handed frame admission, and existing1e-9mm frame/cache comparison. Authored
vectors are retained exactly; only rotation direction is explicitly normalized.
The current user50pm geometric acceptance criterion remains separate.

The existing metadata.boundaryFrame stays a persisted derived validated witness.
Unchanged replay/Open validates it against the independently derived actual
source frame before registry ReadSketch; no auto-healing source write. Explicit
frame/depth edits precompute the complete source-plane descendant closure in
Workers, validate original/candidate local sources independently, and provide
STATIC overrides/frame witnesses to existing candidate replay. Local entities,
constraints, constants, order, branch/admission metadata and external boundary
data remain unchanged; nonempty referenced boundary geometry refuses.

All source writes, the requested producer change and one source-frame journal
delta publish through existing submitPreparedReplay. Creation Undo removes only
the exact latest custom source producer and its exact source bytes, with no
surviving dependent. The approved STATIC removed-source list makes every
candidate read treat it as missing, not an empty fabricated sketch. Accepted
storage changes only in the same publication using prepareWrites(null). Redo
independently verifies/restores the exact originally created bytes and feature
ID; allocator high-water is retained. No new Undo stack or saved snapshot model.

Limits are explicit:64 sources, chain depth16,256 history entries, each source
64KiB, cooperative complete source inventory262144 characters, new frame-edit
journal source delta32768 characters across before/after (64KiB retained UTF16;
actual charge is maxUTF16/UTF8 plus bounded headers). Existing global journal
limits64 entries/8MiB and old edit-family limits are unchanged. These finite new
command limits must be reported, not represented as arbitrary-size support.

Root composition splices:

- Desktop index imports/registers `registerSourceFrameCommands` from the new
  adapter and may export createSourceBoundFrameExample; this branch does not edit
  index. Public IDs inspect-source-frames/create-source-frame/edit-source-frame/
  inspect-source-frame-points. Both agent and human callers use these Craft/model
  operations; no new UI is supplied.
- PM archive owner/Files are untouched. At the existing validation-Worker known
  error forwarding catch, root may add INVALID_SOURCE_FRAME and
  INVALID_FRAME_DEPENDENCY (existing INVALID_FEATURE_ID stays). Full replay
  already forwards typed pipeline failure codes before native adoption.
- Native pair, catalog/default, common OCI Worker/controller/pins unchanged.
  Normal composed build must regenerate the actual shared sketch Worker with
  its source-frame-transition route; old source asset pins are not new proof.

Source descriptor policy captures genuine standard/custom run/admission
identities once. Native result budget treats a validated custom source as zero
names. Ordinary primitive discovery plus the four protected point/STEP/mesh/
drawing read services recognize precisely this source family; no broad solid
membership or typed-frame guard removal. The existing principal capture reuses
the canonical authored feature-ID helper so valid16-digit canonical IDs do not
become a new inconsistent domain. Source type is new, so older registries refuse
rather than silently discard custom placement fields. Typed frame expressions,
C07 custom-source suppression/branch, source reparenting, assembly and Native
solid-face parent locators remain explicitly unavailable in this phase.

Complete public driver/oracle is prepared separately. It must run once only on
the composed normal app, retain actual failures and qualify real Native results,
source preservation, creation/edit/mixed travel, refusals and `.cad` Save/Open.

Follow-up source factoring shares unchanged stable source naming through pure
sourcePlaneIdentity.mjs and frame math through Worker-only sourceFrameMath.ts.
The project-validation Worker now checks phase-A source attachment causal order,
actual constructor identity convention, depth bound and derived frame-cache
relation before adoption, in addition to rechecking it in real candidate replay.
Old histories without SOURCE_FRAME_V1 take no new frame-validation path. No
Native parent frame is approximated; phaseB locators remain unadmitted. Root
known-code forwarding should preserve STALE_FRAME, UNRESOLVED_SOURCE and
UNSUPPORTED_FRAME_PARENT too. This is needed for own malformed-cache/parent
NativeOpen controls; it does not change PM/codec/archive-owner/Files.
