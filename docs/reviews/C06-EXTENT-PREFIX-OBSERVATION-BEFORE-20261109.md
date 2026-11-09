# C06 primary extent R3: BEFORE prefix observation review

Producer Core0afb07fe8e216ba9a03cf21923e0ab70aed72546 /
Hostbe24fbc232c967912f529053d34a9d407b369a39, 285 actual pins.
The complete R3 failed after 116 rows, 1355 commands, 68 Native observations,
7 native Save/fresh Opens, 10 artifacts and 20 settled write readbacks.
Contexts retired; pendingWrite null; executed sources unchanged. No post-failure
oracle, test, probe, build, Native or browser execution was performed here.

Retained evidence (read only):
- R730 /mnt/data10tb/codi-acad-primary-extents-20261109-r3/whole/receipt.json,
  SHA256 bea050e58a1607f693518a7b8907f3cf1f615f841c5e7fef17102d7534b0490f.
- PC /tmp/codi-acad-primary-extents-20261109-r3.log,
  SHA256 2ad81e6e161612ab84634195a85da83bd98f0dd5c01e777d25c85c8b6879fb25.

## Actual path and evidence

test/selected-profile-extents-workflow/desktop-driver.mjs line16 state()
unconditionally calls inspect-manufacturing. observe() line24 calls state()
before and after its actual Native point/source inspections. consumers() line44
sets the public history prefix after the extent producer, retaining the later
through-hole authored row, then calls observe('Prefix retains actual interval
constructor'). The prefix operation succeeds; state() fails.

Actual control before prefix: pointer2, fullTipIndex2, afterFeatureId3.
set-worker-history-prefix afterFeatureId2 returns changed:true/pointer1.
The subsequent public inspect retains all three rows
PLANE/WORKER_SELECTED_PROFILE_EXTENT_EXTRUDE_V1/WORKER_THROUGH_HOLES_V1.
Physical inspection reports ready:false / Return to a valid latest history
first. Drawing inspection reports ready:false / Wait for a complete current
authored tip. inspect-manufacturing throws the actual envelope:

    {name:'Error',code:null,
     message:'Finish the current sketch, operation or history edit before saving.',
     committed:false,possiblyCommitted:false}

Host manufacturing-commands.mjs registerManufacturingCommands line22 first
calls its supplied inspect(); Host index.mjs line275 supplies inspectSaveTarget.
That guard (index.mjs line146) deliberately refuses craft.isEditingHistory.
Core craftBundle.ts defines isEditingHistory as pointer!==history.length-1.
Core projectManagerBundle.ts getManufacturingMetadata itself just copies retained
metadata, but that private getter is not a substitute for the registered public
Host operation. Its null metadata at the previous full tip cannot be invented
as a prefix public result.

## Disposition and bounded acceptance correction

This is an acceptance observation mismatch with current full-tip-only Host
manufacturing inspection, not measured extent geometry corruption. Keep Save/
export guards, registered public contracts, production code and frozen R3
driver/receipt untouched.

A separate later acceptance checkout must:
1. Request an explicit prefix observation only at the three actual history-review
   phases: prefix creation, branch Undo, and prefix Redo.
2. Capture actual inspect-worker-history-controls and bind pointer/fullTip,
   afterFeatureId, retained original history and source, active extent body and
   inactive real through suffix. Preserve original highwater and shared J.
3. Call the actual inspect-manufacturing and require the exact noncommitted Error
   above. Store an explicit command-refusal observation, never ready metadata,
   null metadata, a synthetic successful reply or private getter output.
4. Keep the exact before/after state comparison and all actual Native metrics,
   material/void point geometry, original sketch inspection, source intent/frame/
   IDs/build, ownership cleanup and full branch/Undo/Redo checks.
5. Independently require all three prefix states and both real refusal calls
   around each observation. At every ordinary full tip, keep state() and its
   actual manufacturing result, assignments, exports and native Save/Open proofs
   unchanged. No broad catch, skipped reads or relaxed physical budget.

The next whole workflow may reveal another missing contract; no later PASS is
inferred from this source review or from earlier observations.
