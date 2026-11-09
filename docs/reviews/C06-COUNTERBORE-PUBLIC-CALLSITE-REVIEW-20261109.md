# Counterbore R2 public callsite review — source only

Reviewed ALL public callsites in frozen Core7b451c2 example.mjs and
 desktop-driver.mjs, their actual signed-harness dependencies, and Host
9ea4a1993ad8afa10ea9a24e9c9a4f7955e47420 registered adapters. Product source
basis is Coree521860. No packet, root tree, driver, helper, product, criterion or
historical evidence changed. No tests, parser/probes, build, Native or browser
execution. Root's whole54341 failure is retained; no new runtime incident or
post-fix success is claimed here.

## Confirmed mismatch and bounded correction

`test/centered-counterbore-workflow/desktop-driver.mjs:82`, drawing(), calls
inspect-closed-sketch with ONLY `{faceId}`. Actual Host
apps/system/jsketcher/closed-sketch-commands.mjs:23–26 requires the EXACT pair
`{revision,faceId}` and its own-data argument copy rejects the missing revision.
The token must come from current inspect-closed-sketches, not document inspect,
physical inspection, solids inspection or a previous face-specific reply.

Suggested correction at that one callsite:

```js
const discovery = await call('inspect-closed-sketches');
const inspection = await call('inspect-closed-sketch', {
  revision: discovery.revision,
  faceId: b.faceId
});
```

Keep the command wrapper so BOTH real requests/results enter receipt.commands.
Do not change coordinate/constraint/discovery expectations or remove drawing.
The earlier example.mjs:14 setSide correction in7b451c2/Host9ea already follows
this pattern and then submits edit-closed-sketch-dimension using the ACTUAL
face-specific inspection.revision. h.inspect at signed-harness.mjs:50 also
already uses the correct public two-command sequence. Those need no correction.

## Complete callsite disposition

No other confirmed request-schema/revision-source mismatch found in the packet.
This means source-compatible calls, not proof that their later geometry/exports
will succeed. The following were checked against the actual registered source:

| Calls / packet location | Actual contract / conclusion |
|---|---|
| build/create, example11–12; driver92–95 | rectangle/sketch creation revisions come from their respective inspections; explicit selected build, region, cap and counterbore identities are carried. Counterbore create has exact9 keys. Deliberate extra engineRevision is the INVALID_REQUEST control, not a missing positive field. |
| selected discovery→create, example11 | create reuses p.revision. This is legitimate here: Core selectedProfileCommands.ts:101 returns region inspection revision EXACTLY args.revision; it does not issue a different region token. No accidental document/sketch token substitution. |
| counterbore edit / parent depth, example9,13,15 | current index/feature and matching history inspection revision; exact6-field counterbore edit, exact4-field selected-depth edit. Retained stale revision is deliberate refusal input. |
| typed bindings, example16–17 | physical inspection revision; exact revision/changes/definitions and actual feature index/type/field/parameter rows. Definitions retain name/dimension/expression. No added presentationRevision argument. |
| display / travel, example18–19 | respective inspected display/J revision; exact revision+lengthUnit and revision+direction. |
| Native point reads, driver24–29 | current solids revision, actual current body/feature, explicit build/version/unit, points<=64 within bounds; all8 required fields present. No source-discovery revision belongs here. |
| material assign, driver81 | inspect-printable-parts revision; exact materials/appearances/parts request with complete region5 fields and valid bounded names/color. |
| drawing publish, driver83–84 | inspect-linked-part-drawing supplies BOTH revision and geometryRevision; exact operation version1/unit and definition. Definition version1, actual stable operationType, original datum and three source/plane dimensions match retained v1 schema. No v3 annotations or THRU claim introduced. |
| STEP, driver85–86 | inspect-worker-step-exports supplies document+geometry revisions; exact8 fields including bodies actual pairs, explicit build, version/unit/engine and new path. |
| core3MF / SVG, driver87–88,105 | respective current document revision+path only; manufacturing inspection intentionally returns the SAME document revision. SVG adapter compares inspect().revision. Adding a geometryRevision field here would violate their exact2-field contracts. |
| material review, driver105 | propose-material-rebind has exact current manufacturing revision; confirm-material-rebind takes only the actual returned token. New exports inspect again AFTER confirmation; no stale pre-confirmation export token is reused. |
| normal Save, driver16,80 / example20 | inspect().revision; path ONLY for untitled association. Second Save uses the existing open path implicitly. Actual document-commands.mjs rejects a supplied path on an associated document, and this packet avoids that. |
| fresh signed Open, driver80 | actual h.freshOpen retires its own old context, signs in/launches, inspects the new document, and submits exact revision/path then refreshes frame. |
| malformed Open, driver107 | own fixture writes settle before call; exact current revision/path. No private source authoring or invented discard/force argument. Open still uses actual dirty confirmation where required. After second healthy freshOpen, the intervening observations/file-fixture writes do not author a CAD edit; failure custody remains checked exactly. |
| empty inspections/state, driver18 / example | actual no-argument commands receive {}. All h.capture/h.inspect private observations remain read-only and are not substituted as positive authoring inputs. |

Mirror/server listing/read/write calls are the already scoped own-fixture and
artifact custody helpers, not CAD authoring commands. No new FS or account probe
is proposed. Unknown submitted writes retain pendingWrite and prevent forced
context retirement; each acknowledged export settles before the next submission.

Root should freeze a separate acceptance correction and update the actual local
acceptanceSource Git association when executing it. Core/Host/runtime pins are
independent: fixing this driver does not justify altering schemas, product,
tolerances or existing failed receipts. All after-whole source/archive/STEP/mesh/
SVG and malformed-state checks remain required and unchanged.
