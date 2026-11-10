Source-only correction after first assembled analytic startup, 2026-11-10.
No browser/CAD command, parser/helper test, build or Native execution performed
by this follow-up. Original R1 is not relabeled or rewritten.

The preserved startup log is
/mnt/data10tb/codi-acad-assembled-analytic-20261110-r1.log,
SHA256 a4ac1e963373c933af2b0bb9c14152bee5d2bf580fca2e96e68ee2eed8d2b06c.
It records ENOENT on the incorrect Native repository-relative main.cpp. Actual
Native commit147015f5349e85b8bf9e5025012944b3f03d81ae stores the compiled source
at shape-io/main.cpp. Only that roster string changes. The original empty R1
evidence directory and log remain Root-owned and untouched.

Read-only Git path inventory found no other missing or duplicate roster path:
32 Core entries at f85633ff13f1194e3cfeda19e8fb798fa8be6bc5;7 Host entries at
0fee14964910613df24df860369a22f751c6b92a;3 shared acceptance dependencies and
all11 enclosing acceptance source paths at5506cc92e78c555f0a29b034c8049de3b5399237;
all4 corrected Native entries at147015f5349e85b8bf9e5025012944b3f03d81ae.
These are source-inventory anchors, not replacement producing runtime pins.
The four actual Native checkout files are present; shape-io/main.cpp is22650
bytes, safely within the existing8MiB Git-show buffer. No SDK/dependency or
large local source copy was introduced.

Snapshot review: driver and checker use the SAME frozen producer-roster.json;
acceptance-root resolution is two parents above this folder; Core/Host/Native
roots remain separate explicit repository roots. Every row checks actual file
bytes against its stated Git object before browser/CDP connection, retains its
repository/relative-path/commit/blob ID, and hashes actual files at the footer.
No other hardcoded main.cpp path exists in the workflow/helper source. The
ordered R1 map reached the LAST Native row: preceding rows necessarily passed
their existing file/Git-byte guards before this error. The startup output root
was created before snapshot capture, explaining its empty state; no source
snapshot, account, CAD context or durable write was issued. A subsequent whole
must use a NEW output root and explicit new acceptance commit, preserving R1.

No driver, checker, runtime, geometry assertion, source/Native tolerance,
artifact criterion or cleanup policy changes. All finite qualification remains
pending the complete Root-owned whole and FIRST independent artifact oracle.
