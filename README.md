# ACAD — Agent Computer-Aided Design

ACAD is the CAD engine for the browser WebOS. People and agents use the same
model operations, authored design history, identities, transactions and failure
contracts. Geometry kernels run in Workers; their results are derived from the
application-owned parametric document.

This is a separate project inspired by and derived in part from JSketcher. The
previous JSketcher integration ends at
[CC-David-CC/jsketcher](https://github.com/CC-David-CC/jsketcher). Existing license,
copyright and third-party notices remain applicable to retained source.

ACAD begins with a single source-snapshot commit, with no inherited Git history.
It is active development: named complete workflows pass, but full CAD Gate 1 is
not yet qualified. A menu entry, successful build or engine capability alone does
not establish application correctness.

- [Repository and qualification boundaries](docs/ACAD-REPOSITORY.md)
- [Active CAD scope](docs/CAD1-ACTIVE-SCOPE.md)
- [Agent corpus](docs/AGENT-CAD-CORPUS.md)
- [Tracked CAD issues](docs/AGENT-CAD-ISSUES.md)
- [Headless sketch processing](docs/HEADLESS-SKETCH-SOLVE.md)

Build entry points are in `package.json` and `build/`. Optional native kernels
require their exact qualified input artifacts, documented by the corresponding
engine notes. Dependencies and generated runtime outputs are not included in
source Git. Never substitute arbitrary binaries for recorded build identities.
The desktop mount, authenticated My files services, public command adapters and
full Gate 1 checklist belong to the separate CodiServer desktop repository.
ACAD does not require an AI provider to author or evaluate a design.
