# Derived multi-source selection lineage — implementation contract

Native helper and main binding are qualified; Worker/Craft/public hole/history/
Save integration remains open. Keep one authored graph and whole-part backend.

## Plan version2 for the new runtime

```js
{
  version: 2, featureId: currentProducerFeatureId, scope: 'authored-source',
  source: 'prism-construction-history', // or kernel-operation-history
  sourceContexts: [{kind:'sketch-profile', featureId:originFeatureId, regionId}],
  vertices: [], edges: [], faces: [], unresolved: []
}
```

Contexts are a flat, deduplicated, sorted set of real construction origins, not
material regions or duplicate authored history. Initially support actual sketch
profiles only, at most32 contexts. Unknown constructions remain unavailable
until named with real proof. No fake sketch region for a box and no fake operand.
Omit top-level regionId: a Boolean may have several real source regions.

Keep existing opaque edge/face key bytes exactly. Each resolved descriptor gains
originFeatureId naming an actual context. Role/curve metadata comes from qualified
source descriptors; geometry type comes from the actual result catalog. Private
resolveVertex/Edge/Face closures keep ordinals out of public data. Initial vertex
IDs may stay empty until their source identity is qualified.

## Shared rules

- The strict core now has a one-or-two-source entry point; the Boolean-only
  entry point still requires exactly two. Capture once; no synthetic source.
- Lift an initial prism only with its genuine originating feature/region. Never
  infer origin from later geometry, bounds or caller ID parsing.
- Binary wrapper takes both private indices/histories, result catalog and new
  feature. Joint claims detect merges across inputs. An ID cannot silently gain
  a different origin or role on another branch.
- Unique SAME/MODIFIED descendants retain keys. Generated geometry does not
  inherit keys; missing/split/merged identities remain explicitly unresolved.
- Unary edge wrapper uses that same core and actual treatment history. Blend
  keys follow the existing feature/kind/source-edge rule only with unique actual
  generated-face attribution across all native source-edge rows. Context follows
  the source edge. No dummy binary input is allowed.
- Preserve detailed prior unresolved IDs and first-failure evidence. Do not
  silently repair one from another branch. Conflicting prior histories may
  explicitly refuse naming while preserving valid geometry. Recompute aggregate
  unclaimed counts; old counts do not describe the current result.
- Keep512KiB actual UTF-8 observation,16KiB key and native/work bounds. Naming
  resource refusal must not relabel geometrically valid output invalid.

## Worker and shared model

New pinned build advertises Boolean-history and selection-plan versions.
Use `solid.selections.read`, version1, returning plan.version2; the prism-named
read stays scoped to old runtime behavior. Do not retag old qualified evidence.

New Boolean requests keep op/version/unit/a/b and add featureId,
producerAFeatureId, producerBFeatureId. Ledger infers these from genuine current
operands. Worker checks private producer bindings, invokes the typed native
export and computes naming from actual A/B history. Geometry can succeed with
explicitly unavailable naming; later edge edits cannot guess through it.

Root owns Worker/controller/ledger/registry/staging. Helpers and component tests
are separate lanes. No silent engine substitution or history conversion. These
tasks do not close semantic through-all/placement, journal, native persistence,
or full Gate1/all22 exercises and integrated original-rectangle acceptance.
