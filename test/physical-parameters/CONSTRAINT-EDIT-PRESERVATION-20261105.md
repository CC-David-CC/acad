# Existing dimension edit: actual counterexample

Root Chromium, runtime41bb over the accepted configuration source, creates a
100x50 rectangle and adds SignedX100 between rect-0 endpoints via the inspected
action. SegmentLength100 is accepted; SignedX100 is satisfied/redundant. Editing
the actual length annotation to110 accepts110, changes geometry/source and turns
SignedX100 into rejected, while the solver reports success after dropping it.
This violates preservation of previously satisfied authored intent.

The ordinary editor writes constants before calling constraintUpdated outside
the shared transaction. Numeric prevalidation alone does not solve this.
Reproducer constraint-edit-preservation-browser.test.cjs currently fails on
preservation. Root evidence /tmp/codi-root-editor-contradiction.json and
/tmp/codi-root-editor-contradiction-actual.log; failure context090A78339DC87F588DBB05A632903A9B
onCDP20311. First harness omitted await on inspect and properly refused the
undefined revision; corrected harness demonstrates the actual defect.

Require one atomic existing-edit operation preserving prior constants/cache,
geometry/membership/history, distinct ephemeral new-dialog requests, all prior
satisfied relations, valid edit/undo/native persistence and failure recovery.
No new public deployment. This blocks M01 and final functional qualification.
