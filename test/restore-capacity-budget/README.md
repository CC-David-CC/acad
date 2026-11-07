# Restore budget for supported authored parts

Actual signed capacity R2 created32 valid sweeps, rejected33 before allocation,
queried native geometry at quota, then saved and synchronized the real native
file. Fresh Open failed because projectManager allowed only30 seconds for the
complete rebuild. The same32-entry evaluation takes about40.67 seconds in the
qualified native query. The saved bytes remain intact; R2 remains a failed run.

One finite rebuild wait now derives from validated authored history count:
60 seconds plus5 seconds per entry, capped at10 minutes. The34-entry fixture
receives230 seconds. Progress never renews the deadline. Pipeline failure,
caller cancellation and exact document lifetime still end the operation early;
only that temporary restore owner can roll back/dispose. Timeout is machine
readable as PROJECT_REBUILD_TIMEOUT and carries the bounded allowed/elapsed
counters. Geometry, feature/native budgets, format and host-file writes do not
change. Snapshot validation retains its separate preexisting deadline.

Four new policy/owner controls plus18 retained timeout/cancellation controls and
full TypeScript pass. This is a component repair. The actual saved32-body file
must reopen through the signed Files/app path on the built candidate before
claiming runtime qualification. No successful native result is fabricated here.
